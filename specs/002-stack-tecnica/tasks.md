# Tasks: Stack Técnica — Vue 3 + Vite + PrimeVue ACAE

**Input**: `specs/002-stack-tecnica/` (plan.md, spec.md, data-model.md, quickstart.md, research.md)
**Feature Branch**: `002-stack-tecnica`
**Implementação**: TypeScript + Vue 3.4+ + Vite 6 + PrimeVue v4 (Aura preset customizado)

---

## Phase 1: Setup

**Purpose**: Scaffolding do projeto frontend e instalação de dependências

- [ ] T001 Criar projeto frontend com `npm create vite@latest frontend -- --template vue-ts` na raiz do repositório
- [ ] T002 Instalar dependências: `npm install primevue @primevue/themes vue-router@4 pinia axios @supabase/supabase-js @vueuse/core` em `frontend/`
- [ ] T003 [P] Criar `frontend/.env.local` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (valores de desenvolvimento)
- [ ] T004 [P] Criar `frontend/.env.example` com placeholders das variáveis obrigatórias

---

## Phase 2: Foundational (Infraestrutura compartilhada)

**Purpose**: Tema, bundler, roteamento e estado — tudo que qualquer feature futura depende.

**⚠️ CRÍTICO**: Sem esta fase, nenhuma page ou componente pode ser criado.

- [ ] T005 Configurar `frontend/vite.config.ts` com alias `@/` apontando para `frontend/src/`, `manualChunks` (primevue/vendor separados) e plugin `@vitejs/plugin-vue` per `specs/002-stack-tecnica/research.md`
- [ ] T006 Criar `frontend/src/theme/acae-preset.ts` com `definePreset(Aura, { ... })` usando primary `#7C3AED` e configurar `darkModeSelector: false` per `specs/002-stack-tecnica/plan.md` Decisão 4
- [ ] T007 Criar `frontend/src/styles/global.css` com variável CSS `--acae-yellow: #D97706` e import do PrimeVue theme
- [ ] T008 Configurar `frontend/src/main.ts`: criar app Vue, registrar PrimeVue com `AcaePreset`, registrar Pinia, registrar Vue Router, montar app
- [ ] T009 Configurar `frontend/src/router/index.ts` com `createWebHistory()`, rotas iniciais (`/login`, `/`, `/turmas`, `/alunos`, `/documentos`, `/perfil`) e `meta.requiresAuth`
- [ ] T010 Criar `frontend/src/layouts/AppLayout.vue` (layout autenticado com slot para conteúdo e sidebar)
- [ ] T011 [P] Criar `frontend/src/layouts/AuthLayout.vue` (layout público: card centralizado para login)

**Checkpoint**: `npm run dev` sobe < 5s com cores ACAE, sem erros no console

---

## Phase 3: User Story 1 — Desenvolvedor configura o projeto do zero (Prioridade: P1)

**Goal**: Repositório clonável → servidor dev funcional com tema ACAE em uma sequência de comandos.

**Independent Test**: Clonar em máquina limpa, rodar `npm install && npm run dev` → tela inicial com roxo e amarelo sem errors no console.

- [ ] T012 [P] [US1] Criar `frontend/src/App.vue` com `<RouterView>` e lógica de seleção de layout baseada em `route.meta.requiresAuth`
- [ ] T013 [P] [US1] Criar `frontend/src/pages/NotFoundPage.vue` (404 amigável com link para `/`)
- [ ] T014 [US1] Criar `README.md` (na raiz) com sequência completa: clone → install → .env.local → dev server
- [ ] T015 [US1] Executar `npm run build` e verificar que bundle gzip < 500KB per `specs/002-stack-tecnica/spec.md` CS-002

**Checkpoint**: US1 verificada — desenvolvedor novo consegue iniciar sem configuração manual adicional

---

## Phase 4: User Story 2 — Navegação entre seções (Prioridade: P1)

**Goal**: SPA com roteamento client-side, sem recarregamento de página na navegação.

**Independent Test**: Navegar entre 3 seções distintas via menu e verificar que URL muda sem reload.

- [ ] T016 [P] [US2] Criar `frontend/src/components/AppSidebar.vue` com PrimeVue `Menu` listando itens: Turmas, Alunos, Documentos, Perfil — com `<router-link>`
- [ ] T017 [P] [US2] Adicionar rota `/404` em `frontend/src/router/index.ts` com `NotFoundPage.vue` e `{ path: '/:pathMatch(.*)*', redirect: '/404' }`
- [ ] T018 [US2] Integrar `AppSidebar.vue` dentro de `AppLayout.vue` como coluna esquerda fixa

**Checkpoint**: US2 verificada — navegação SPA funciona sem recarregamento

---

## Phase 5: User Story 3 — Interface responsiva em dispositivos escolares (Prioridade: P2)

**Goal**: Interface legível e operável em 1366×768 e tablets 768px; contraste WCAG AA.

**Independent Test**: Abrir em viewport 1366×768 e verificar que todos os elementos são operáveis sem scroll horizontal.

- [ ] T019 [P] [US3] Verificar ratio de contraste purple `#7C3AED` sobre branco: 5.72:1 — documentado em `specs/002-stack-tecnica/research.md`, nenhuma ação adicional necessária
- [ ] T020 [US3] Confirmar que `darkModeSelector: false` em `acae-preset.ts` está ativo (light mode forçado em todos os componentes PrimeVue)
- [ ] T021 [US3] Testar layout em viewport 768px: verificar sidebar colapsa e conteúdo principal vai para coluna única sem scroll horizontal

**Checkpoint**: US3 verificada — interface legível em hardware escolar comum

---

## Phase 6: User Story 4 — Consumo da API do backend (Prioridade: P2)

**Goal**: Instância Axios com JWT interceptor automático e tratamento centralizado de erros 401/403/500.

**Independent Test**: Fazer chamada com JWT válido e verificar header Authorization; simular 401 e verificar redirect para /login.

- [ ] T022 [P] [US4] Criar `frontend/src/services/api.ts` com instância Axios, `baseURL = import.meta.env.VITE_API_URL` e request interceptor injetando `Authorization: Bearer {token}` per `specs/002-stack-tecnica/research.md`
- [ ] T023 [US4] Adicionar response interceptor 401 em `api.ts`: chama `authStore.logout()` e redireciona para `/login`
- [ ] T024 [US4] Adicionar response interceptor 403 em `api.ts`: exibe toast PrimeVue "Acesso negado" (sem detalhe interno)
- [ ] T025 [US4] Adicionar response interceptor 500/network error em `api.ts`: exibe toast "Algo deu errado, tente novamente" (sem stack trace)

**Checkpoint**: US4 verificada — todas as chamadas ao backend têm JWT automático e erros são tratados centralmente

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T026 [P] Instalar Vitest + Vue Test Utils v2 + happy-dom: `npm install -D vitest @vue/test-utils happy-dom`
- [ ] T027 [P] Configurar `vitest.config.ts` em `frontend/` com `environment: 'happy-dom'`
- [ ] T028 Verificar que `VITE_SUPABASE_URL` e `VITE_API_URL` nunca aparecem como `undefined` no runtime com log de inicialização em `main.ts`
- [ ] T029 [P] Criar `frontend/src/services/supabase.ts` com `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)` (usado pela feature 001)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — iniciar imediatamente
- **Foundational (Phase 2)**: Depende de Phase 1 — **BLOQUEIA** todas as user stories
- **US1 (Phase 3)**: Depende de Phase 2 — MVP mínimo
- **US2 (Phase 4)**: Depende de Phase 2 — Pode rodar em paralelo com US1
- **US3 (Phase 5)**: Depende de Phase 2 — Pode rodar em paralelo com US1 e US2
- **US4 (Phase 6)**: Depende de Phase 2 — Pode rodar em paralelo com US1, US2, US3
- **Polish (Phase 7)**: Depende de US1–US4

### Parallel Opportunities (Foundational)

```
Phase 2 (após Phase 1 completa):
  ├── T005 vite.config.ts           (independente)
  ├── T006 acae-preset.ts           (independente)
  ├── T007 global.css               (independente)
  └── T010/T011 Layouts             (independentes entre si)
```

### MVP Sugerido

**MVP = Phases 1–2 + US1 (Phase 3) + US4 (Phase 6)**

Com Setup + Foundational + US1 + US4: o projeto roda localmente com tema correto, e desenvolvedores já podem consumir a API do backend com JWT automático. Isso desbloqueia feature 001 (Login).
