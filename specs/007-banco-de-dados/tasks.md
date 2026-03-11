# Tasks: Banco de Dados — PostgreSQL via Supabase

**Input**: `specs/007-banco-de-dados/` (plan.md, spec.md, data-model.md, quickstart.md, contracts/)
**Feature Branch**: `007-banco-de-dados`
**Implementação**: Node.js 22 + Fastify 5 + Prisma 6 + PostgreSQL (Supabase sa-east-1)

---

## Phase 1: Setup

**Purpose**: Estrutura do projeto backend e configuração inicial

- [X] T001 Criar estrutura de diretórios do backend: `backend/prisma/`, `backend/src/routes/`, `backend/src/services/`, `backend/src/plugins/`, `backend/src/hooks/`
- [X] T002 Inicializar projeto Node.js 22 com Fastify 5, Prisma 6 e dependências per `specs/007-banco-de-dados/quickstart.md`
- [X] T003 [P] Criar `backend/.env` com `DATABASE_URL`, `DIRECT_URL` e `SUPABASE_JWT_SECRET` e adicionar `backend/.env` ao `.gitignore`
- [X] T004 [P] Criar `backend/.env.example` com placeholders para todas as variáveis obrigatórias

---

## Phase 2: Foundational (Schema + Migrações + Segurança)

**Purpose**: Schema Prisma completo e todas as restrições de banco. Nada de user story pode avançar sem esta fase.

**⚠️ CRÍTICO**: Fase 2 deve estar 100% completa antes de implementar qualquer rota.

- [X] T005 Criar `backend/prisma/schema.prisma` com os 10 modelos per `specs/007-banco-de-dados/data-model.md`: `Professor`, `Turma`, `Aluno`, `Grupo`, `GrupoAluno`, `CompetenciaBNCC`, `ContextoPedagogico`, `RegistroAluno`, `RascunhoDocumento`, `VersaoDocumento`, `ControleCotas`
- [ ] T006 Criar primeira migração Prisma: `npx prisma migrate dev --name init` gerando `backend/prisma/migrations/`
- [X] T007 Criar migração SQL adicional com CHECK constraint `cardinality(bncc_refs) >= 1` em `rascunhos_documento` e `registros_aluno` per Princípio III
- [X] T008 Criar migração SQL com trigger `BEFORE UPDATE OR DELETE` em `versoes_documento` rejeitando modificações (INSERT-ONLY) per Princípio V
- [X] T009 Criar `backend/prisma/seed.ts` com todas as competências BNCC da Educação Infantil (BNCC 2017 — EI01 a EI03, campos de experiência completos)
- [X] T010 Configurar Supabase Custom Access Token Hook via Dashboard para injetar claim `papel` no JWT (professor/coordenador)

**Checkpoint**: Schema criado, migrações aplicadas, seed pronto — user stories podem iniciar

---

## Phase 3: User Story 1 — Professor acessa apenas seus dados (Prioridade: P1)

**Goal**: Isolamento total de dados por professor via RLS no PostgreSQL; coordenadores acessam tudo.

**Independent Test**: Criar dois professores com turmas distintas, logar como cada um e verificar que apenas suas próprias turmas aparecem. Logar como coordenador e verificar acesso irrestrito.

- [X] T011 [US1] Criar migração SQL com política RLS `CREATE POLICY professor_isolation ON turmas USING (professor_id = auth.uid())` em `backend/prisma/migrations/`
- [X] T012 [US1] Criar política RLS para `alunos` baseada em turma: `EXISTS (SELECT 1 FROM turmas WHERE turmas.id = alunos.turma_id AND turmas.professor_id = auth.uid())`
- [X] T013 [US1] Criar política RLS de bypass para coordenador em todas as tabelas: `(SELECT papel FROM professores WHERE id = auth.uid()) = 'coordenador'`
- [X] T014 [P] [US1] Criar `backend/src/plugins/auth.ts` com `@fastify/jwt` verificando `SUPABASE_JWT_SECRET` e decorator `fastify.authenticate`
- [X] T015 [P] [US1] Criar `backend/src/hooks/attach-professor.ts`: preHandler que extrai `JWT.sub` → busca professor no banco → annexa `req.professor`

**Checkpoint**: US1 verificada — professor A não acessa dados do professor B

---

## Phase 4: User Story 2 — Cadastro e consulta de alunos (Prioridade: P1)

**Goal**: CRUD completo de turmas e alunos com isolamento por professor.

**Independent Test**: Cadastrar aluno com necessidades educacionais, consultá-lo, atualizar uma informação e verificar que a atualização foi salva corretamente.

- [X] T016 [P] [US2] Implementar `GET /api/turmas` em `backend/src/routes/turmas.ts` per `specs/007-banco-de-dados/contracts/turmas.md`
- [X] T017 [P] [US2] Implementar `POST /api/turmas` em `backend/src/routes/turmas.ts`
- [X] T018 [P] [US2] Implementar `GET /api/turmas/:id/alunos` em `backend/src/routes/alunos.ts` per `specs/007-banco-de-dados/contracts/alunos.md`
- [X] T019 [P] [US2] Implementar `POST /api/turmas/:id/alunos` em `backend/src/routes/alunos.ts`
- [X] T020 [US2] Implementar `PATCH /api/alunos/:id` em `backend/src/routes/alunos.ts` (atualiza necessidades educacionais)
- [X] T021 [US2] Implementar `DELETE /api/alunos/:id` em `backend/src/routes/alunos.ts` (soft-delete LGPD: seta `excluido: true`, dissocia PII)

**Checkpoint**: US2 verificada — CRUD de turmas e alunos funciona corretamente com isolamento

---

## Phase 5: User Story 3 — Vínculo BNCC obrigatório (Prioridade: P1)

**Goal**: Banco impede criação de registros e rascunhos sem ao menos 1 competência BNCC vinculada.

**Independent Test**: Tentar criar registro de aluno sem `bncc_refs` — banco rejeita. Adicionar BNCC — funciona.

- [X] T022 [US3] Verificar que CHECK constraint `cardinality(bncc_refs) >= 1` da migração T007 está ativa via `SELECT` em `information_schema.check_constraints`
- [X] T023 [P] [US3] Implementar `GET /api/competencias` em `backend/src/routes/competencias.ts` (lista todas as competências BNCC com código, descrição, área de conhecimento)
- [X] T024 [US3] Implementar `POST /api/alunos/:id/registros` em `backend/src/routes/registros.ts` per `specs/007-banco-de-dados/contracts/registros.md` (valida `bncc_refs.length >= 1` antes do INSERT)
- [X] T025 [P] [US3] Implementar `GET /api/alunos/:id/registros` em `backend/src/routes/registros.ts` com paginação (20 itens/página)

**Checkpoint**: US3 verificada — sem BNCC, o banco rejeita; com BNCC, aceita

---

## Phase 6: User Story 4 — Histórico imutável de documentos (Prioridade: P1)

**Goal**: Trigger no banco garante que `versoes_documento` é INSERT-ONLY; histórico nunca é sobrescrito.

**Independent Test**: Finalizar documento, tentar UPDATE direto no banco — trigger rejeita. Verificar múltiplas versões coexistindo.

- [X] T026 [US4] Verificar que trigger `BEFORE UPDATE OR DELETE` na tabela `versoes_documento` da migração T008 está ativo via `SELECT * FROM pg_trigger`
- [X] T027 [US4] Implementar `GET /api/alunos/:id/documentos` em `backend/src/routes/documentos.ts` (lista `versoes_documento` por aluno, ordenado por `finalizado_em DESC`)

**Checkpoint**: US4 verificada — documentos finalizados são imutáveis

---

## Phase 7: User Story 5 — Contexto pedagógico por período (Prioridade: P2)

**Goal**: Professor registra metodologia e objetivos da turma por período; contexto disponível na geração de IA.

**Independent Test**: Cadastrar contexto para turma na semana 10/2026; verificar que aparece disponível para geração de documentos do mesmo período.

- [X] T028 [P] [US5] Implementar `GET /api/turmas/:id/contextos` em `backend/src/routes/contextos.ts` (lista contextos pedagógicos da turma filtrados por período)
- [X] T029 [US5] Implementar `POST /api/turmas/:id/contextos` em `backend/src/routes/contextos.ts`

**Checkpoint**: US5 verificada — contexto pedagógico cadastrado e disponível

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T030 [P] Criar `backend/src/plugins/error-handler.ts` com handler global Fastify (400/403/422/500 → JSON estruturado sem stack trace)
- [ ] T031 [P] Executar `npx prisma db seed` para popular tabela `competencias_bncc` com dados reais da BNCC
- [X] T032 Validar todos os endpoints retornam HTTP status corretos per `specs/007-banco-de-dados/contracts/` (turmas.md, alunos.md, registros.md)
- [X] T033 [P] Criar `backend/src/app.ts` com Fastify instance, registro de todos os plugins e routes, e `listen()` on `PORT`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — iniciar imediatamente
- **Foundational (Phase 2)**: Depende de Phase 1 — **BLOQUEIA** todas as user stories
- **US1 (Phase 3)**: Depende de Phase 2 — Sem dependências de outras stories
- **US2 (Phase 4)**: Depende de Phase 2 — Pode rodar em paralelo com US1
- **US3 (Phase 5)**: Depende de Phase 2 — Pode rodar em paralelo com US1 e US2
- **US4 (Phase 6)**: Depende de Phase 2 — Pode rodar em paralelo com US1, US2, US3
- **US5 (Phase 7)**: Depende de Phase 2 — Pode rodar após US1–US4 ou em paralelo
- **Polish (Phase 8)**: Depende da conclusão de todas as user stories

### Parallel Opportunities (User Story 2)

```
Phase 4 pode iniciar após Foundational:
  ├── T016 GET /api/turmas         (independente)
  ├── T017 POST /api/turmas        (independente)
  ├── T018 GET /api/turmas/:id/alunos  (independente)
  └── T019 POST /api/turmas/:id/alunos  (independente)
```

### MVP Sugerido

**MVP = Phases 1–2 + US1 (Phase 3) + US2 (Phase 4)**

Com Setup + Foundational + US1 + US2: o banco está criado com isolamento correto e o CRUD de turmas/alunos funciona. Isso desbloqueia features 001, 006, 003 e 004.
