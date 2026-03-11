# Tasks: Login — Portal do Professor

**Input**: `specs/001-login-acesso/` (plan.md, spec.md, data-model.md, quickstart.md, contracts/)
**Feature Branch**: `001-login-acesso`
**Depende de**: 002 (Stack Técnica — frontend scaffold), 007 (Banco — tabela `professores`)
**Implementação**: Node.js 22 + Fastify 5 + `@fastify/jwt` v9 + `@supabase/supabase-js` v2 + Vue 3

---

## Phase 1: Setup

**Purpose**: Dependências de autenticação instaladas em backend e frontend

- [ ] T001 Instalar `@fastify/jwt` v9 e `@fastify/rate-limit` v9 em `backend/`: `npm install @fastify/jwt @fastify/rate-limit`
- [ ] T002 [P] Confirmar que `@supabase/supabase-js` v2 está instalado em `frontend/` (adicionado pela feature 002)
- [ ] T003 [P] Adicionar `SUPABASE_JWT_SECRET` ao `backend/.env` (copiado de Supabase Dashboard → Project Settings → API → JWT Settings)

---

## Phase 2: Foundational (Plugins de autenticação Fastify + cliente Supabase)

**Purpose**: Plugin JWT, rate limiting e hook `attachProfessor` — tudo que as rotas protegidas dependem.

**⚠️ CRÍTICO**: Sem esta fase, nenhuma rota autenticada pode existir no backend.

- [ ] T004 Criar `frontend/src/services/supabase.ts` com `createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)` (se não criado pela feature 002 T029)
- [ ] T005 Criar `backend/src/plugins/auth.ts`: registrar `@fastify/jwt` com `SUPABASE_JWT_SECRET` (HS256) e `@fastify/rate-limit` (5 req / 15 min em rotas de auth) per `specs/001-login-acesso/quickstart.md`
- [ ] T006 Criar `backend/src/hooks/attach-professor.ts`: preHandler que extrai `req.user.sub` (JWT) → `prisma.professor.findUnique({ where: { supabase_user_id } })` → `req.professor = professor` → 401 se não encontrado

**Checkpoint**: Backend tem JWT verification; `attachProfessor` hook pronto para uso em rotas

---

## Phase 3: User Story 1 — Login com e-mail e senha (Prioridade: P1)

**Goal**: Professor informa credenciais → autenticado → redirecionado ao painel correto.

**Independent Test**: Abrir `/login`, inserir credenciais válidas, verificar redirecionamento ao painel com nome do professor exibido. Inserir credenciais inválidas → mensagem genérica sem identificar qual campo está errado.

- [ ] T007 [P] [US1] Criar `frontend/src/pages/LoginPage.vue` com campos Email e Password (PrimeVue `InputText` + `Password`), botão "Entrar" e mensagem de erro genérica "E-mail ou senha inválidos" em caso de falha (RF-004) — nunca indica qual campo está errado
- [ ] T008 [US1] Criar `frontend/src/stores/auth.ts` (Pinia) com state: `session`, `professor`, e actions: `login()`, `logout()`, `init()`
- [ ] T009 [US1] Implementar `login(email, password)` em `auth.ts`: `supabase.auth.signInWithPassword()` → em sucesso, salvar `session` → `router.push('/')` (ou `?redirect=` param)
- [ ] T010 [US1] Implementar `init()` em `auth.ts`: chamado em `main.ts` → `supabase.auth.getSession()` → restaurar sessão; registrar `supabase.auth.onAuthStateChange()` para sincronizar mudanças
- [ ] T011 [US1] Implementar `GET /api/auth/me` em `backend/src/routes/auth/index.ts`: `attachProfessor` preHandler → retorna `{ id, nome, email, papel }` per `specs/001-login-acesso/contracts/auth.md`
- [ ] T012 [US1] Chamar `GET /api/auth/me` após login bem-sucedido em `auth.ts` para popular `store.professor` com dados do banco

**Checkpoint**: US1 verificada — login funciona, painel exibe nome do professor

---

## Phase 4: User Story 4 — Controle de acesso por papel (Prioridade: P1)

**Goal**: Professors acessam apenas seus recursos; coordenadores acessam tudo.

**Independent Test**: Logar como professor → tentar acessar rota de coordenação → negado. Logar como coordenador → acesso permitido.

- [ ] T013 [P] [US4] Criar `frontend/src/router/guards.ts` com `beforeEach`: se `meta.requiresAuth && !authStore.session` → `router.push('/login?redirect=...')` per `specs/001-login-acesso/quickstart.md`
- [ ] T014 [P] [US4] Adicionar `meta.requiresAuth: true` a todas as rotas protegidas e `meta.role: 'coordenador'` às rotas exclusivas de coordenação em `frontend/src/router/index.ts`
- [ ] T015 [US4] Adicionar verificação de papel em `guards.ts`: se `meta.role === 'coordenador' && authStore.professor.papel !== 'coordenador'` → `router.push('/403')` (acesso negado sem revelar se o recurso existe)
- [ ] T016 [US4] Confirmar que Supabase Custom Access Token Hook injeта claim `papel` no JWT (configurado em feature 007 T010) — verificar via decode do JWT em ambiente de dev

**Checkpoint**: US4 verificada — RBAC funciona no frontend e o backend (via RLS) reforça no nível de banco

---

## Phase 5: User Story 2 — Expiração de sessão por inatividade (Prioridade: P2)

**Goal**: Sessão expira após 30 min de inatividade; professor recebe aviso e é redirecionado ao login.

**Independent Test**: Configurar timer de 5s em desenvolvimento, ficar inativo → sessão expira → redirect para /login com mensagem.

- [ ] T017 [P] [US2] Criar `frontend/src/composables/useInactivityTimer.ts`: monitora eventos `click`, `keydown`, `mousemove`, `touchstart` no `document`; reseta contador a cada evento per `specs/001-login-acesso/quickstart.md`
- [ ] T018 [US2] Implementar timeout de 30 min em `useInactivityTimer.ts`: ao expirar, exibe toast PrimeVue "Sessão encerrada por inatividade" e chama `authStore.logout()`
- [ ] T019 [US2] Registrar `useInactivityTimer()` em `frontend/src/layouts/AppLayout.vue` (somente em sessão autenticada, `onMounted`/`onUnmounted`)

**Checkpoint**: US2 verificada — inatividade de 30 min encerra sessão automaticamente

---

## Phase 6: User Story 3 — Logout manual (Prioridade: P2)

**Goal**: Professor clica em "Sair" → sessão encerrada → dados inacessíveis mesmo via botão Voltar do browser.

**Independent Test**: Logar, fazer logout, usar botão Voltar do browser → sistema detecta sessão encerrada e redireciona para /login.

- [ ] T020 [US3] Implementar `logout()` em `frontend/src/stores/auth.ts`: `supabase.auth.signOut()` → limpar `store.session` e `store.professor` → `router.push('/login')`
- [ ] T021 [US3] Implementar `POST /api/auth/logout` em `backend/src/routes/auth/index.ts`: `attachProfessor` → responde 204 (JWT é stateless; logout é efetivo via Supabase client) per `specs/001-login-acesso/contracts/auth.md`
- [ ] T022 [US3] Adicionar botão "Sair" ao `frontend/src/components/AppSidebar.vue` chamando `authStore.logout()`

**Checkpoint**: US3 verificada — logout manual encerra sessão; dados protegidos

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T023 [P] Verificar rate limiting 5 req/15 min nas rotas de auth: testar 6 tentativas consecutivas de login incorreto e verificar HTTP 429
- [ ] T024 [P] Criar `frontend/src/pages/ForbiddenPage.vue` (403 — acesso negado) linkada pelo router guard de papel
- [ ] T025 Validar que eventos de autenticação são logados (login, logout, falha) sem PII em texto claro nos logs do Fastify (RF-014)
- [ ] T026 [P] Verificar que tela de login carrega < 2s em rede simulada de 10Mbps via DevTools Throttle (RF Princípio I)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Depende de features 002 e 007 estarem concluídas
- **Foundational (Phase 2)**: Depende de Phase 1
- **US1 (Phase 3)**: Depende de Phase 2 — MVP mínimo
- **US4 (Phase 4)**: Depende de Phase 2 — Pode rodar em paralelo com US1
- **US2 (Phase 5)**: Depende de US1 (precisa de `authStore.logout()`) — P2
- **US3 (Phase 6)**: Depende de US1 (precisa de `authStore.logout()`) — P2
- **Polish (Phase 7)**: Depende de US1–US4

### Parallel Opportunities (User Story 1)

```
Phase 3 (após Foundational):
  ├── T007 LoginPage.vue             (frontend, independente)
  └── T011 GET /api/auth/me          (backend, independente)
       ↑ então T008→T009→T010→T012 (sequencial no store)
```

### MVP Sugerido

**MVP = Phases 1–2 + US1 (Phase 3) + US4 (Phase 4)**

Com Login + RBAC: o portal é acessível com segurança por professores e coordenadores. US2 e US3 (inatividade + logout) aumentam segurança mas não bloqueiam a funcionalidade principal.
