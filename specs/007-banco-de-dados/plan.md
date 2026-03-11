# Implementation Plan: Banco de Dados — PostgreSQL via Supabase

**Branch**: `007-banco-de-dados` | **Date**: 2026-03-10 | **Spec**: `specs/007-banco-de-dados/spec.md`  
**Input**: Feature specification from `/specs/007-banco-de-dados/spec.md`

## Summary

Implementar o banco de dados relacional do Portal do Professor usando **PostgreSQL gerenciado pelo Supabase** (região São Paulo) com **Prisma ORM** para o backend Node.js. O banco deve armazenar as 10 entidades principais do sistema (professores, turmas, alunos, grupos, competências BNCC, contextos pedagógicos, registros de alunos, rascunhos e versões de documentos, e controle de cotas de IA), aplicar isolamento de dados por professor via Row Level Security (RLS), garantir imutabilidade de documentos finalizados via trigger INSERT-ONLY, e bloquear criação de documentos sem vínculo BNCC via CHECK constraint — tudo em conformidade com a LGPD.

## Technical Context

**Language/Version**: Node.js 22 LTS (backend Fastify); migrações via Prisma CLI  
**Primary Dependencies**: `prisma` + `@prisma/client` 6.x, `@fastify/jwt` v9.x  
**Storage**: PostgreSQL 15 via Supabase (região `sa-east-1`, plano gratuito, 500MB)  
**Testing**: Vitest (unit) + Supertest (integration) — cobertura das restrições de banco  
**Target Platform**: Servidor Linux persistente (Railway), não serverless  
**Project Type**: Web service (backend API Fastify alimentando frontend Vue 3)  
**Performance Goals**: Queries de listagem < 200ms p95; isolamento RLS sem overhead perceptível  
**Constraints**: Plano gratuito Supabase (500MB, 2 CPUs compartilhadas); sem Redis; sem extensões pagas  
**Scale/Scope**: ~10 professores por escola; ~500 alunos; ~5.000 documentos/ano; bem dentro do plano gratuito

## Constitution Check

*GATE: Verificado antes da Fase 0 e revalidado após o design na Fase 1.*

| Princípio | Status | Evidência |
|-----------|--------|-----------|
| **I — Simplicidade para o Professor** | ✅ APROVADO | Prisma abstrai SQL; professor não interage diretamente com o banco. Padrões de acesso simples (findMany com where). |
| **II — IA baseada em dados** | ✅ APROVADO | As entidades `RegistroAluno`, `ContextoPedagogico`, `CompetenciaBNCC` formam a base de dados estruturada que alimenta a IA (feature 006). |
| **III — Rastreabilidade BNCC** | ✅ APROVADO | CHECK constraint `cardinality(bncc_refs) >= 1` em `rascunhos_documento` e `registros_aluno` bloqueia criação sem BNCC **no nível do banco**. |
| **IV — LGPD** | ✅ APROVADO | RLS por professor; nomes de alunos não entram em logs; soft-delete `excluido` com dissociação de PII; `DIRECT_URL` não exposta ao cliente; `supabase_user_id` como FK sem expor dados de auth. |
| **V — Fidelidade de documentos** | ✅ APROVADO | Trigger `BEFORE UPDATE OR DELETE` em `versoes_documento` garante imutabilidade no nível de banco; status `finalizado` é terminal; `VersaoDocumento` é INSERT-ONLY. |

**Resultado**: Todas as 5 gates aprovadas. Nenhuma violação identificada.

## Project Structure

### Documentação (esta feature)

```text
specs/007-banco-de-dados/
├── plan.md              # Este arquivo
├── research.md          # Fase 0: decisões técnicas e racional
├── data-model.md        # Fase 1: schema Prisma completo (10 entidades) + SQL adicional
├── quickstart.md        # Fase 1: guia de setup Supabase + Prisma
├── contracts/
│   ├── turmas.md        # GET/POST /api/turmas
│   ├── alunos.md        # GET/POST /api/turmas/:id/alunos + DELETE LGPD
│   └── registros.md     # GET/POST /api/alunos/:id/registros
└── tasks.md             # Fase 2 (gerado por /speckit.tasks — não criado aqui)
```

### Código-fonte (raiz do repositório)

```text
backend/
├── prisma/
│   ├── schema.prisma              # Schema Prisma (10 modelos + enums)
│   ├── seed.ts                    # Seed de competências BNCC
│   └── migrations/
│       ├── [ts]_init_schema/      # Tabelas principais
│       ├── [ts]_versao_insert_only_trigger/  # Trigger INSERT-ONLY
│       ├── [ts]_bncc_refs_constraint/        # CHECK cardinality >= 1
│       ├── [ts]_enable_rls_policies/         # RLS + políticas + índices
│       └── [ts]_custom_access_token_hook/    # Hook papel → JWT
├── src/
│   ├── plugins/
│   │   ├── prisma.ts              # Plugin Fastify: PrismaClient singleton
│   │   └── auth.ts               # Plugin Fastify: @fastify/jwt + authenticate decorator
│   ├── hooks/
│   │   └── attach-professor.ts    # preHandler: JWT sub → Professor no req
│   └── routes/
│       ├── turmas/
│       │   └── index.ts           # GET /api/turmas, POST /api/turmas
│       ├── alunos/
│       │   └── index.ts           # GET/POST /api/turmas/:id/alunos, DELETE /api/alunos/:id
│       └── registros/
│           └── index.ts           # GET/POST /api/alunos/:id/registros

frontend/
├── src/
│   └── (sem alterações nesta feature — DB é backend-only)
```

## Decisões de Implementação

### Decisão 1 — Prisma com `directUrl` para migrações

Usar `DATABASE_URL` (Supavisor session mode, porta 5432) para runtime e `DIRECT_URL` (conexão direta) para `prisma migrate`. Isso evita falhas de DDL em transaction mode e é explicitamente recomendado pela documentação Prisma + Supabase.

### Decisão 2 — Verificação JWT com `@fastify/jwt` (HS256)

Usar `SUPABASE_JWT_SECRET` (segredo HS256 do Dashboard) com `@fastify/jwt` v9.x. Mais simples que JWKS para um backend interno. O hook `attachProfessor` carrega o `Professor` do banco via `supabase_user_id = request.user.sub` em cada requisição autenticada.

### Decisão 3 — Isolamento de dados na camada de aplicação + RLS como defesa secundária

O Fastify usa role privilegiado (bypassrls) via Prisma. Isolamento por professor é feito com `where: { professor_id: request.professor.id }` em todas as queries. O RLS do Supabase protege o acesso direto via PostgREST/Dashboard/cliente JS.

### Decisão 4 — `papel` no JWT via Custom Access Token Hook

O hook SQL injeta o campo `papel` (professor/coordenador) da tabela `professores` no JWT no momento do login. Permite que as políticas RLS usem `auth.jwt() ->> 'papel'` sem DB lookup adicional no banco.

### Decisão 5 — INSERT-ONLY via Trigger (não via RLS ou aplicação)

O trigger `BEFORE UPDATE OR DELETE` é a única abordagem que protege contra mutações independente do nível de acesso (RLS pode ser bypassado por role privilegiado; aplicação pode ter bugs). O trigger é aplicado via SQL raw na migration.

### Decisão 6 — Soft-delete com dissociação de PII (LGPD)

Alunos excluídos recebem `status = excluido` e têm `nome` sobrescrito com `[DADOS REMOVIDOS]`. O `aluno_id` permanece nas versões históricas de documentos para manter integridade referencial, mas o PII pessoal não é mais acessível.

## Variáveis de ambiente necessárias

Adicionar ao `.env` (e ao `.env.example` como placeholder):

```dotenv
# Adicionadas nesta feature
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
SUPABASE_JWT_SECRET=<jwt-secret-do-dashboard>
```

As variáveis `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `DATABASE_URL` já existem no `.env`.
