# Modelo de Dados: Banco de Dados — PostgreSQL via Supabase

**Branch**: `007-banco-de-dados` | **Data**: 2026-03-10  
**ORM**: Prisma 6.x | **Banco**: PostgreSQL (Supabase, região São Paulo)

---

## Schema Prisma completo (`backend/prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ─────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────

enum Papel {
  professor
  coordenador
}

enum StatusProfessor {
  ativo
  inativo
}

enum Turno {
  manha
  tarde
  integral
}

enum StatusTurma {
  ativa
  inativa
}

enum StatusAluno {
  ativo
  inativo
  excluido  // soft-delete LGPD: dados preservados, acesso bloqueado
}

enum TipoDocumento {
  portfolio_semanal
  relatorio_individual
  atividade_adaptada
  resumo_pedagogico
}

enum StatusDocumento {
  rascunho
  em_revisao
  finalizado  // imutável após atingir este estado
}

// ─────────────────────────────────────────────────────────────
// 1. PROFESSOR
// ─────────────────────────────────────────────────────────────

model Professor {
  id               String          @id @default(uuid()) @db.Uuid
  nome             String
  email            String          @unique
  papel            Papel           @default(professor)
  escola           String
  status           StatusProfessor @default(ativo)
  supabase_user_id String          @unique @db.Uuid  // FK → Supabase Auth users.id

  turmas    Turma[]
  rascunhos RascunhoDocumento[]
  versoes   VersaoDocumento[]

  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  @@map("professores")
}

// ─────────────────────────────────────────────────────────────
// 2. TURMA
// ─────────────────────────────────────────────────────────────

model Turma {
  id         String      @id @default(uuid()) @db.Uuid
  nome       String
  ano_letivo Int         // ex: 2026
  turno      Turno
  escola     String
  status     StatusTurma @default(ativa)

  professor_id String    @db.Uuid
  professor    Professor @relation(fields: [professor_id], references: [id])

  alunos    Aluno[]
  grupos    Grupo[]
  contextos ContextoPedagogico[]
  registros RegistroAluno[]
  rascunhos RascunhoDocumento[]
  versoes   VersaoDocumento[]

  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  @@index([professor_id])  // RLS performance
  @@map("turmas")
}

// ─────────────────────────────────────────────────────────────
// 3. ALUNO
// ─────────────────────────────────────────────────────────────

model Aluno {
  id                        String      @id @default(uuid()) @db.Uuid
  nome                      String
  data_nascimento           DateTime    @db.Date
  necessidades_educacionais String?     @db.Text
  status                    StatusAluno @default(ativo)

  turma_id String @db.Uuid
  turma    Turma  @relation(fields: [turma_id], references: [id])

  grupos    GrupoAluno[]
  registros RegistroAluno[]
  rascunhos RascunhoDocumento[]
  versoes   VersaoDocumento[]

  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  @@index([turma_id])
  @@map("alunos")
}

// ─────────────────────────────────────────────────────────────
// 4. GRUPO + TABELA DE JUNÇÃO
// ─────────────────────────────────────────────────────────────

model Grupo {
  id   String @id @default(uuid()) @db.Uuid
  nome String

  turma_id String @db.Uuid
  turma    Turma  @relation(fields: [turma_id], references: [id])

  alunos GrupoAluno[]

  created_at DateTime @default(now())

  @@map("grupos")
}

model GrupoAluno {
  grupo_id String @db.Uuid
  aluno_id String @db.Uuid

  grupo Grupo @relation(fields: [grupo_id], references: [id])
  aluno Aluno @relation(fields: [aluno_id], references: [id])

  @@id([grupo_id, aluno_id])
  @@map("grupos_alunos")
}

// ─────────────────────────────────────────────────────────────
// 5. COMPETÊNCIA BNCC
// ─────────────────────────────────────────────────────────────

model CompetenciaBNCC {
  id                String @id @default(uuid()) @db.Uuid
  codigo            String @unique       // ex: "EF01LP01"
  descricao         String @db.Text
  area_conhecimento String               // ex: "Língua Portuguesa"
  nivel_educacional String               // ex: "Ensino Fundamental I"

  created_at DateTime @default(now())

  @@map("competencias_bncc")
}

// ─────────────────────────────────────────────────────────────
// 6. CONTEXTO PEDAGÓGICO
// ─────────────────────────────────────────────────────────────

model ContextoPedagogico {
  id             String  @id @default(uuid()) @db.Uuid
  periodo        String  // ex: "2026-semana-10" ou "2026-03"
  metodologia    String  @db.Text
  objetivos      String  @db.Text
  dinamica_grupo String? @db.Text

  turma_id String @db.Uuid
  turma    Turma  @relation(fields: [turma_id], references: [id])

  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  @@unique([turma_id, periodo])  // um contexto por turma por período
  @@map("contextos_pedagogicos")
}

// ─────────────────────────────────────────────────────────────
// 7. REGISTRO DO ALUNO (por período)
// ─────────────────────────────────────────────────────────────

model RegistroAluno {
  id          String   @id @default(uuid()) @db.Uuid
  periodo     String   // ex: "2026-semana-10"
  objetivos   String   @db.Text
  atividades  String   @db.Text
  mediacoes   String?  @db.Text
  ocorrencias String?  @db.Text
  bncc_refs   String[] // códigos BNCC ref. ex: ["EF01LP01", "EF01MA02"]
               // CHECK: cardinality(bncc_refs) >= 1 (via migration SQL)

  aluno_id String @db.Uuid
  aluno    Aluno  @relation(fields: [aluno_id], references: [id])

  turma_id String @db.Uuid
  turma    Turma  @relation(fields: [turma_id], references: [id])

  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  @@unique([aluno_id, periodo])  // um registro por aluno por período
  @@index([turma_id, periodo])
  @@map("registros_aluno")
}

// ─────────────────────────────────────────────────────────────
// 8. RASCUNHO DE DOCUMENTO
// ─────────────────────────────────────────────────────────────

model RascunhoDocumento {
  id                 String          @id @default(uuid()) @db.Uuid
  tipo               TipoDocumento
  status             StatusDocumento @default(rascunho)
  conteudo_gerado    String          @db.Text   // gerado pela IA (imutável)
  conteudo_editado   String?         @db.Text   // editado pelo professor
  conteudo_final     String?         @db.Text   // cópia após finalização
  periodo            String
  bncc_refs          String[]
  // CHECK: cardinality(bncc_refs) >= 1 (via migration SQL)
  prompt_hash        String          // SHA-256 do prompt anonimizado (sem PII)
  duracao_geracao_ms Int?            // tempo de resposta da API em ms
  finalizado_em      DateTime?       // preenchido quando status = finalizado

  professor_id String    @db.Uuid
  professor    Professor @relation(fields: [professor_id], references: [id])

  aluno_id String? @db.Uuid
  aluno    Aluno?  @relation(fields: [aluno_id], references: [id])

  turma_id String @db.Uuid
  turma    Turma  @relation(fields: [turma_id], references: [id])

  versoes VersaoDocumento[]

  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  @@index([professor_id, status])
  @@index([aluno_id, periodo])
  @@map("rascunhos_documento")
}

// ─────────────────────────────────────────────────────────────
// 9. VERSÃO DE DOCUMENTO — INSERT-ONLY
// Trigger impede UPDATE e DELETE (ver migration SQL abaixo)
// ─────────────────────────────────────────────────────────────

model VersaoDocumento {
  id            String   @id @default(uuid()) @db.Uuid
  numero_versao Int      // versão incremental por (rascunho_id)
  conteudo      String   @db.Text   // cópia imutável do conteúdo finalizado
  periodo       String
  bncc_refs     String[]
  finalizado_em DateTime

  rascunho_id String            @db.Uuid
  rascunho    RascunhoDocumento @relation(fields: [rascunho_id], references: [id])

  professor_id String    @db.Uuid
  professor    Professor @relation(fields: [professor_id], references: [id])

  aluno_id String? @db.Uuid
  aluno    Aluno?  @relation(fields: [aluno_id], references: [id])

  turma_id String @db.Uuid
  turma    Turma  @relation(fields: [turma_id], references: [id])

  created_at DateTime @default(now())

  @@unique([rascunho_id, numero_versao])
  @@index([professor_id])
  @@map("versoes_documento")
}

// ─────────────────────────────────────────────────────────────
// 10. CONTROLE DE COTAS DE IA
// ─────────────────────────────────────────────────────────────

model ControleCotas {
  id                   String   @id @default(uuid()) @db.Uuid
  data                 DateTime @unique @db.Date   // YYYY-MM-DD, horário de Brasília
  contagem_requisicoes Int      @default(0)
  ultima_requisicao_em DateTime

  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  @@map("controle_cotas")
}
```

---

## SQL Adicional (via migrations raw)

Estas restrições não podem ser expressas no `schema.prisma` e devem ser adicionadas em migrations dedicadas.

### Migration 1 — Trigger INSERT-ONLY em `versoes_documento`

**Arquivo**: `prisma/migrations/[timestamp]_versao_insert_only_trigger/migration.sql`

```sql
-- Função: bloqueia UPDATE e DELETE em versoes_documento
CREATE OR REPLACE FUNCTION prevent_versao_documento_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'versoes_documento é append-only. Operação % não é permitida.',
    TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$;

-- Trigger: executa antes de qualquer UPDATE ou DELETE
CREATE TRIGGER versao_documento_insert_only
  BEFORE UPDATE OR DELETE
  ON public.versoes_documento
  FOR EACH ROW
  EXECUTE FUNCTION prevent_versao_documento_mutation();
```

### Migration 2 — CHECK constraint BNCC em `rascunhos_documento`

**Arquivo**: `prisma/migrations/[timestamp]_bncc_refs_constraint/migration.sql`

```sql
-- Garante ao menos 1 código BNCC em rascunhos_documento
ALTER TABLE public.rascunhos_documento
ADD CONSTRAINT bncc_refs_required
CHECK (cardinality(bncc_refs) >= 1);

-- Garante ao menos 1 código BNCC em registros_aluno
ALTER TABLE public.registros_aluno
ADD CONSTRAINT bncc_refs_required_registro
CHECK (cardinality(bncc_refs) >= 1);
```

### Migration 3 — Habilitar RLS nas tabelas sensíveis

**Arquivo**: `prisma/migrations/[timestamp]_enable_rls/migration.sql`

```sql
-- Habilitar RLS
ALTER TABLE public.turmas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos_alunos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contextos_pedagogicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_aluno    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rascunhos_documento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.versoes_documento  ENABLE ROW LEVEL SECURITY;

-- Políticas: turmas
CREATE POLICY "professor_own_turmas"
  ON public.turmas FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = professor_id)
  WITH CHECK ((SELECT auth.uid()) = professor_id);

CREATE POLICY "coordenador_all_turmas"
  ON public.turmas FOR SELECT TO authenticated
  USING ((SELECT auth.jwt() ->> 'papel') = 'coordenador');

-- Políticas: alunos (acessíveis via turmas do professor)
CREATE POLICY "professor_own_alunos"
  ON public.alunos FOR ALL TO authenticated
  USING (
    turma_id IN (
      SELECT id FROM public.turmas
      WHERE professor_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "coordenador_all_alunos"
  ON public.alunos FOR SELECT TO authenticated
  USING ((SELECT auth.jwt() ->> 'papel') = 'coordenador');

-- Políticas: rascunhos_documento
CREATE POLICY "professor_own_rascunhos"
  ON public.rascunhos_documento FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = professor_id)
  WITH CHECK ((SELECT auth.uid()) = professor_id);

CREATE POLICY "coordenador_all_rascunhos"
  ON public.rascunhos_documento FOR SELECT TO authenticated
  USING ((SELECT auth.jwt() ->> 'papel') = 'coordenador');

-- Políticas: versoes_documento
CREATE POLICY "professor_own_versoes"
  ON public.versoes_documento FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = professor_id);

CREATE POLICY "coordenador_all_versoes"
  ON public.versoes_documento FOR SELECT TO authenticated
  USING ((SELECT auth.jwt() ->> 'papel') = 'coordenador');

-- Índices para performance das políticas RLS
CREATE INDEX ON public.turmas (professor_id);
CREATE INDEX ON public.rascunhos_documento (professor_id);
CREATE INDEX ON public.versoes_documento (professor_id);
```

### Migration 4 — Custom Access Token Hook (Supabase Auth)

**Arquivo**: `prisma/migrations/[timestamp]_custom_access_token_hook/migration.sql`

```sql
-- Injeta 'papel' do Professor no JWT gerado pelo Supabase Auth
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims    jsonb;
  user_papel text;
BEGIN
  SELECT papel::text INTO user_papel
  FROM public.professores
  WHERE supabase_user_id = (event->>'user_id')::uuid;

  claims := jsonb_set(
    event->'claims',
    '{papel}',
    to_jsonb(COALESCE(user_papel, 'professor'))
  );

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Permissões necessárias para o Supabase Auth invocar a função
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook
  FROM authenticated, anon, public;
```

> **Após aplicar esta migration**: Acessar o Dashboard do Supabase → Authentication → Hooks → Access Token Hook → selecionar a função `public.custom_access_token_hook`.

---

## Diagrama de Relacionamentos

```
Professor ─────────── Turma ──── Aluno ──── Grupo (via GrupoAluno)
    │                  │           │
    │                  │           ├── RegistroAluno (bncc_refs[])
    │                  │           │
    │           ContextoPedagogico │
    │                              │
    └──── RascunhoDocumento ───────┘
               │
               └── VersaoDocumento (INSERT-ONLY)

CompetenciaBNCC  →  referenciada por código em bncc_refs[] arrays
ControleCotas    →  tabela independente (1 registro por dia)
```

---

## Transições de Estado: `RascunhoDocumento.status`

```
rascunho ──→ em_revisao ──→ finalizado
rascunho ──────────────────→ finalizado  (sem edição manual)
```

- Transições retrógradas são **proibidas** (validação na camada de serviço)
- `status = 'finalizado'` torna `conteudo_final` obrigatório (validação na camada de serviço)
- Ao finalizar, uma `VersaoDocumento` é criada automaticamente (INSERT-ONLY)

---

## Regras de Negócio do Banco

| Regra | Onde enforçada |
|-------|---------------|
| Ao menos 1 `bncc_refs` em `rascunhos_documento` | CHECK constraint SQL |
| Ao menos 1 `bncc_refs` em `registros_aluno` | CHECK constraint SQL |
| `versoes_documento` sem UPDATE/DELETE | Trigger PostgreSQL |
| Professor só vê seus próprios dados | Filtros Prisma na camada de app + RLS |
| `papel` no JWT para políticas RLS | Custom Access Token Hook |
| Aluno `excluido` não pode ter novos documentos | Validação na camada de serviço |
| Um contexto pedagógico por turma por período | Unique constraint `[turma_id, periodo]` |
| Um registro por aluno por período | Unique constraint `[aluno_id, periodo]` |
