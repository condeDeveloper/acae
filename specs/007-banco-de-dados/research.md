# Research: Banco de Dados — PostgreSQL via Supabase

**Branch**: `007-banco-de-dados` | **Data**: 2026-03-10  
**Fase**: Phase 0 — Resolução de incertezas técnicas antes do design

---

## Incerteza 1 — Strings de conexão Prisma + Supabase

### Decisão

Usar **dois URLs distintos**: `DATABASE_URL` para consultas em runtime (via Supavisor session mode) e `DIRECT_URL` para migrações Prisma (conexão direta ao Postgres).

### Racional

O Supabase usa **Supavisor** como pooler de conexões. O Supavisor opera em dois modos:

| Modo | Porta | Uso |
|------|-------|-----|
| Session (padrão) | 5432 | Servidor persistente (Fastify no Railway) |
| Transaction | 6543 | Funções serverless |
| Direct | 5432 (host `db.*`) | Migrações DDL |

Para o Fastify rodando no Railway (processo persistente), o **session mode** suporta prepared statements — não é necessário o sufixo `?pgbouncer=true`. Para migrações, `prisma migrate deploy` usa DDL dentro de transações explícitas, o que é incompatível com transaction mode poolers; a conexão direta é necessária e mais confiável.

### Alternativas consideradas

- **Somente `DATABASE_URL`** (sem `DIRECT_URL`): Funciona se `DATABASE_URL` apontar para session mode, mas falha se apontar para transaction mode (porta 6543). Usar `DIRECT_URL` é mais explícito e robusto.
- **`?pgbouncer=true&connection_limit=1`**: Necessário somente para transaction mode (serverless). Desnecessário para Fastify persistente no Railway.

### Configuração resultante

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

```dotenv
# .env — strings de conexão do Supabase
DATABASE_URL="postgres://prisma.[PROJECT-REF]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

---

## Incerteza 2 — Políticas RLS para isolamento por professor

### Decisão

**Padrão B: Papéis privilegiados + filtros na camada de aplicação**, com RLS como segunda linha de defesa para acesso via Supabase cliente (não via Fastify+Prisma).

### Racional

O Fastify acessa o Postgres via Prisma com role privilegiado (não afetado pelo RLS automático do PostgREST). Aplicar RLS via `SET LOCAL ROLE authenticated` + `set_config('request.jwt.claims', ...)` em cada transação é possível mas adiciona latência e complexidade. Como o Fastify já verifica o JWT e carrega o objeto `Professor` em cada requisição (via `attachProfessor` hook), filtrar por `professor_id` na camada de aplicação é mais simples e performático.

O RLS do Supabase continua habilitado nas tabelas para proteger o acesso direto via PostgREST/Supabase cliente (painel admin, APIs públicas futuras).

### Políticas SQL (segunda linha de defesa)

Para acessos via Supabase Dashboard e futuros acessos via cliente JS:

```sql
-- Turmas: professor vê as próprias
CREATE POLICY "professor_own_turmas" ON public.turmas
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = professor_id)
  WITH CHECK ((SELECT auth.uid()) = professor_id);

-- Coordenador vê todas (via Custom Access Token Hook)
CREATE POLICY "coordenador_all_turmas" ON public.turmas
  FOR SELECT TO authenticated
  USING ((SELECT auth.jwt() ->> 'papel') = 'coordenador');
```

*(Padrão análogo para todas as tabelas com `professor_id`)*

### Custom Access Token Hook

O campo `papel` (professor/coordenador) vive na tabela `professores`, não no JWT por padrão. Para que as políticas RLS por papel funcionem sem DB lookup, configurar o hook de acesso token personalizado no Supabase que injeta `papel` no JWT no momento do login.

```sql
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE claims jsonb; user_papel text;
BEGIN
  SELECT papel INTO user_papel FROM public.professores
  WHERE supabase_user_id = (event->>'user_id')::uuid;
  claims := jsonb_set(event->'claims', '{papel}',
    to_jsonb(COALESCE(user_papel, 'professor')));
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;
```

### Alternativas consideradas

- **Pattern A — `SET LOCAL ROLE` por transação**: Correto mas adiciona 1 round-trip por request e complexidade de gestão de transação.
- **RLS apenas via PostgREST**: Não protege o backend Fastify que usa Prisma diretamente.

---

## Incerteza 3 — Integração Supabase Auth + Fastify 5

### Decisão

Verificação JWT via **`@fastify/jwt` v9.x com segredo HS256** (`SUPABASE_JWT_SECRET`). Após verificação, carregar o `Professor` do banco via `supabase_user_id = JWT.sub` e anexar ao `request`.

### Racional

`@fastify/jwt` v9.x é o primeiro compatível com Fastify 5 e usa `fast-jwt` internamente. A verificação HS256 com o segredo JWT do Supabase é a abordagem mais simples e direta para backends internos. A verificação JWKS (RS256/ES256) é recomendada para projetos novos pelo Supabase, mas requer a ativação de chaves assimétricas no Dashboard — overhead desnecessário para este projeto de escola.

### Alternativas consideradas

- **JWKS com `get-jwks`**: Mais seguro (sem compartilhar segredo), mas exige ativação de signing keys assimétricas no Supabase e adiciona dependência extra.
- **`jsonwebtoken` manual**: Funciona mas não integra com o sistema de decorators e hooks do Fastify.

### Padrão de implementação

```typescript
// plugins/auth.ts
import fastifyJwt from '@fastify/jwt'

fastify.register(fastifyJwt, {
  secret: process.env.SUPABASE_JWT_SECRET!,
  verify: { algorithms: ['HS256'] },
})

// preHandler em rotas protegidas
async function attachProfessor(request, reply) {
  const professor = await prisma.professor.findUnique({
    where: { supabase_user_id: request.user.sub },
  })
  if (!professor || professor.status === 'inativo') {
    return reply.code(403).send({ error: 'Acesso negado' })
  }
  request.professor = professor
}
```

Variável de ambiente necessária: `SUPABASE_JWT_SECRET` (obtida em Dashboard → Project Settings → API → JWT Settings → JWT Secret).

---

## Incerteza 4 — Constraint INSERT-ONLY para `versoes_documento`

### Decisão

**Trigger PostgreSQL** `BEFORE UPDATE OR DELETE` na tabela `versoes_documento`, aplicado via SQL raw na migration do Prisma.

### Racional

Prisma ORM não suporta nativamente a expressão de triggers em `schema.prisma`. A abordagem correta para o ecossistema Prisma é: criar a migration com `--create-only`, editar o arquivo SQL gerado adicionando o trigger, e então aplicar com `migrate deploy`. O Prisma executa o SQL raw como está — a tabela fica protegida no nível do banco, independente de ORM, role ou cliente.

### SQL do trigger

```sql
CREATE OR REPLACE FUNCTION prevent_versao_documento_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION
    'versoes_documento é append-only. Operação % não permitida.',
    TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$;

CREATE TRIGGER versao_documento_insert_only
  BEFORE UPDATE OR DELETE ON public.versoes_documento
  FOR EACH ROW EXECUTE FUNCTION prevent_versao_documento_mutation();
```

### Alternativas consideradas

- **RLS com `USING (false)` para UPDATE/DELETE**: Protege acesso via PostgREST mas não protege o role privilegiado usado pelo Prisma.
- **Apenas validação na camada de aplicação**: Frágil — pode ser bypassada por erros de programação ou acesso direto ao banco.

---

## Incerteza 5 — Constraint BNCC obrigatório em `rascunhos_documento`

### Decisão

**CHECK constraint SQL** `cardinality(bncc_refs) >= 1` via migration raw, combinado com validação na camada de serviço do Fastify.

### Racional

`cardinality()` retorna 0 para arrays vazios `{}` e NULL para NULL, cobrindo ambos os casos com uma única expressão. A restrição no banco garante o Princípio III (BNCC obrigatória) independente da camada de aplicação. A validação na camada de serviço fornece mensagens de erro amigáveis antes de bater no banco.

```sql
ALTER TABLE public.rascunhos_documento
ADD CONSTRAINT bncc_refs_required
CHECK (cardinality(bncc_refs) >= 1);
```

### Alternativas consideradas

- **Trigger**: Mais flexível (lógica condicional, mensagem customizada) mas mais pesado que um CHECK constraint para validação simples.
- **Somente validação no serviço**: Violaria o Princípio III que exige a restrição "em nível de dados".

---

## Incerteza 6 — Estrutura de pastas backend (Prisma)

### Decisão

```text
backend/
├── prisma/
│   ├── schema.prisma          # Definição do schema Prisma
│   └── migrations/            # Migrações SQL geradas pelo Prisma
├── src/
│   ├── plugins/
│   │   ├── prisma.ts          # Plugin Fastify: instancia PrismaClient
│   │   └── auth.ts            # Plugin Fastify: registra @fastify/jwt
│   ├── hooks/
│   │   └── attach-professor.ts # preHandler: carrega Professor do JWT
│   ├── routes/
│   │   ├── turmas/
│   │   ├── alunos/
│   │   ├── registros/
│   │   └── documentos/
│   └── services/
│       └── (services da feature 006 aqui)
```

---

## Decisões consolidadas

| Tópico | Decisão | Pacote / Versão |
|--------|---------|-----------------|
| ORM | Prisma 6.x | `prisma` + `@prisma/client` |
| Database URL | Session mode + `directUrl` para migrações | Supabase Supavisor |
| JWT verification | `@fastify/jwt` v9.x, HS256 | `@fastify/jwt` |
| Isolamento de dados | Filtros por `professor_id` na camada de app + RLS como defesa secundária | — |
| `papel` no JWT | Custom Access Token Hook injeta `papel` no JWT | SQL function no Supabase |
| INSERT-ONLY | Trigger PostgreSQL via migration raw SQL | — |
| Constraint BNCC | CHECK `cardinality(bncc_refs) >= 1` via migration raw SQL | — |
