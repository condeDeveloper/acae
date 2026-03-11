# Quickstart: Banco de Dados — Supabase + Prisma

**Branch**: `007-banco-de-dados`  
**Tempo estimado**: 30–45 minutos (primeira configuração)

---

## Pré-requisitos

- Node.js 22 LTS instalado
- Conta no [Supabase](https://supabase.com) criada
- Git com branch `007-banco-de-dados` ativo

---

## Passo 1 — Criar projeto no Supabase

1. Acessar [app.supabase.com](https://app.supabase.com)
2. Clicar em **New Project**
3. Preencher:
   - **Name**: `acae-portal`
   - **Database Password**: senha forte (salvar em local seguro)
   - **Region**: `South America (São Paulo)` — obrigatório para LGPD
4. Aguardar 1–2 minutos até o projeto estar pronto

---

## Passo 2 — Obter credenciais do Supabase

No Dashboard do projeto → **Project Settings** → **API**:

- Copiar **Project URL** → `SUPABASE_URL`
- Copiar **anon public** key → `SUPABASE_ANON_KEY`
- Copiar **JWT Secret** (em JWT Settings) → `SUPABASE_JWT_SECRET`

No Dashboard → **Project Settings** → **Database** → **Connection string** → selecionar **URI** e copiar:
- A string com porta `5432` do pooler (Transaction ou Session) → `DATABASE_URL`
- A string direta (host `db.[PROJECT-REF].supabase.co`) → `DIRECT_URL`

Preencher o `.env` na raiz do projeto:

```dotenv
# Supabase
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_JWT_SECRET=<jwt-secret-do-dashboard>

# Prisma — Supabase Supavisor (session mode, porta 5432)
DATABASE_URL=postgres://prisma.[PROJECT-REF]:[DB-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://postgres:[DB-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Gemini (já existente)
GEMINI_API_KEY=...
```

---

## Passo 3 — Inicializar Prisma no backend

```powershell
# Na pasta raiz do projeto
mkdir backend
cd backend
npm init -y
npm install prisma @prisma/client
npm install -D typescript @types/node tsx

# Inicializar Prisma
npx prisma init --datasource-provider postgresql
```

O comando cria:
- `backend/prisma/schema.prisma` — arquivo de schema (substituir pelo schema do `data-model.md`)
- `backend/.env` — remover, usar o `.env` da raiz com `dotenv`

---

## Passo 4 — Configurar o schema

Substituir o conteúdo de `backend/prisma/schema.prisma` pelo schema completo do arquivo `specs/007-banco-de-dados/data-model.md`.

Verificar que o `.env` da raiz está acessível pelo Prisma. No `backend/package.json`, adicionar:

```json
{
  "scripts": {
    "db:migrate": "dotenv -e ../.env -- prisma migrate dev",
    "db:deploy": "dotenv -e ../.env -- prisma migrate deploy",
    "db:generate": "prisma generate",
    "db:studio": "dotenv -e ../.env -- prisma studio"
  }
}
```

```powershell
npm install dotenv-cli --save-dev
```

---

## Passo 5 — Criar e aplicar migrações

### 5.1 — Migration inicial (schema principal)

```powershell
cd backend
npm run db:migrate -- --name init_schema
```

Isso cria as tabelas no Supabase conforme o `schema.prisma`.

### 5.2 — Migration: trigger INSERT-ONLY em `versoes_documento`

```powershell
npx prisma migrate dev --create-only --name versao_insert_only_trigger
```

Editar o arquivo SQL gerado em `prisma/migrations/[timestamp]_versao_insert_only_trigger/migration.sql`:

```sql
-- Adicionar ao arquivo gerado (preservar o SQL do Prisma acima):

CREATE OR REPLACE FUNCTION prevent_versao_documento_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION
    'versoes_documento é append-only. Operação % não é permitida.',
    TG_OP USING ERRCODE = 'restrict_violation';
END;
$$;

CREATE TRIGGER versao_documento_insert_only
  BEFORE UPDATE OR DELETE ON public.versoes_documento
  FOR EACH ROW EXECUTE FUNCTION prevent_versao_documento_mutation();
```

Aplicar:

```powershell
npm run db:deploy
```

### 5.3 — Migration: constraint BNCC obrigatório

```powershell
npx prisma migrate dev --create-only --name bncc_refs_constraint
```

Editar o arquivo SQL gerado:

```sql
ALTER TABLE public.rascunhos_documento
ADD CONSTRAINT bncc_refs_required
CHECK (cardinality(bncc_refs) >= 1);

ALTER TABLE public.registros_aluno
ADD CONSTRAINT bncc_refs_required_registro
CHECK (cardinality(bncc_refs) >= 1);
```

Aplicar:

```powershell
npm run db:deploy
```

### 5.4 — Migration: habilitar RLS

```powershell
npx prisma migrate dev --create-only --name enable_rls_policies
```

Copiar o SQL de RLS completo do arquivo `specs/007-banco-de-dados/data-model.md` (seção "Migration 3") para o arquivo gerado. Aplicar:

```powershell
npm run db:deploy
```

### 5.5 — Migration: Custom Access Token Hook

```powershell
npx prisma migrate dev --create-only --name custom_access_token_hook
```

Copiar o SQL do hook do arquivo `specs/007-banco-de-dados/data-model.md` (seção "Migration 4"). Aplicar:

```powershell
npm run db:deploy
```

**Após aplicar**: No Dashboard do Supabase → **Authentication** → **Hooks** → **Access Token Hook** → selecionar `public.custom_access_token_hook`.

---

## Passo 6 — Gerar o Prisma Client

```powershell
npm run db:generate
```

Verificar que o `@prisma/client` foi gerado em `node_modules/.prisma/client`.

---

## Passo 7 — Configurar autenticação no Supabase

No Dashboard → **Authentication** → **Providers** → **Email**:
- Habilitar **Email/Password**
- Desabilitar **Confirm email** (para desenvolvimento — habilitar em produção)

No Dashboard → **Authentication** → **URL Configuration**:
- **Site URL**: `http://localhost:5173` (Vite dev server)
- **Redirect URLs**: `http://localhost:5173/**`

---

## Passo 8 — Verificar a instalação

```powershell
# Abrir o Prisma Studio para verificar as tabelas
npm run db:studio
```

Deve abrir em `http://localhost:5555` com todas as 10 tabelas visíveis:
- `professores`, `turmas`, `alunos`, `grupos`, `grupos_alunos`
- `competencias_bncc`, `contextos_pedagogicos`, `registros_aluno`
- `rascunhos_documento`, `versoes_documento`, `controle_cotas`

---

## Passo 9 — Popular competências BNCC (seed)

Criar `backend/prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const competencias = [
  { codigo: 'EF01LP01', descricao: 'Reconhecer que textos são lidos e escritos de cima para baixo e da esquerda para a direita na página.', area_conhecimento: 'Língua Portuguesa', nivel_educacional: 'Ensino Fundamental I' },
  { codigo: 'EF01LP02', descricao: 'Perceber que palavras diferentes compartilham certas letras.', area_conhecimento: 'Língua Portuguesa', nivel_educacional: 'Ensino Fundamental I' },
  { codigo: 'EF01MA01', descricao: 'Utilizar números naturais como indicação de quantidade ou de ordem em diferentes situações cotidianas.', area_conhecimento: 'Matemática', nivel_educacional: 'Ensino Fundamental I' },
  // ... adicionar as competências completas da BNCC
]

async function main() {
  for (const c of competencias) {
    await prisma.competenciaBNCC.upsert({
      where: { codigo: c.codigo },
      create: c,
      update: {},
    })
  }
  console.log(`Seed concluído: ${competencias.length} competências BNCC inseridas.`)
}

main()
  .finally(() => prisma.$disconnect())
```

Adicionar ao `backend/package.json`:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

Executar:

```powershell
npm install tsx
npm run db:migrate -- --name seed_bncc
npx prisma db seed
```

---

## Próximos passos

Após este quickstart, os próximos passos são cobertos pela feature **001-login** (configuração do Supabase Auth no frontend Vue) e **006-integracao-ia-gemini** (integração do Fastify com o banco para geração de documentos).

Referências:
- [Prisma + Supabase docs](https://supabase.com/docs/guides/database/prisma)
- [Supabase RLS docs](https://supabase.com/docs/guides/database/row-level-security)
- [Supabase Custom Access Token Hook](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook)
