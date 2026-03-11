# Tasks: Relatório Individual do Aluno

**Input**: `specs/004-relatorio-individual/` (plan.md, spec.md, data-model.md, quickstart.md, contracts/)
**Feature Branch**: `005-relatorio-individual`
**Depende de**: 001 (Login), 002 (Stack), 003 (Geração de Documentos — backend de geração/export/download), 007 (Banco)
**Implementação**: Vue 3 + PrimeVue v4 + Pinia + `@vueuse/core` (watchDebounced)

---

## Phase 1: Setup

**Purpose**: Rota registrada e dependências verificadas

- [ ] T001 Adicionar rota `/relatorio-individual` em `frontend/src/router/index.ts` com `meta.requiresAuth: true` apontando para `RelatórioIndividualPage`
- [ ] T002 [P] Confirmar que `@vueuse/core` está instalado em `frontend/` (adicionado pela feature 001 para `useInactivityTimer`)

---

## Phase 2: Foundational (Store Pinia + composable de autosave)

**Purpose**: Estado central e autosave compartilhados por todos os componentes desta feature.

**⚠️ CRÍTICO**: Store e autosave devem existir antes de qualquer componente ser criado.

- [ ] T003 Criar `frontend/src/composables/useAutoSave.ts` com `watchDebounced(conteudo, saveFn, { debounce: 1500 })` retornando `status: Ref<'idle'|'saving'|'saved'|'error'>` per `specs/004-relatorio-individual/quickstart.md` seção 2
- [ ] T004 Criar `frontend/src/stores/relatorio.store.ts` (Pinia `useRelatorioStore`) com state: `form`, `rascunho`, `etapa`, `estaGerando`, `erroGeracao`, e computed: `conteudoEditado`, `formularioValido`, `podeFinalizarr` per `specs/004-relatorio-individual/data-model.md`
- [ ] T005 Implementar actions na store: `gerarRelatorio()` → `POST /api/documents/generate (tipo:relatorio_individual)`, `autoSalvar(texto)` → `PATCH /api/documents/rascunhos/:id`, `finalizar(conteudoFinal)` → `POST /.../finalizar`, `carregarRascunhoAtivo(aluno_id)` → `GET /api/documents/rascunhos?aluno_id=&tipo=relatorio_individual`

**Checkpoint**: Store importável e funcional — componentes podem usar `useRelatorioStore()`

---

## Phase 3: User Story 1 — Professor gera o Relatório Individual (Prioridade: P1) 🎯 MVP

**Goal**: Professor preenche formulário → clica "Gerar Relatório" → rascunho aparece na mesma tela com botão de download visível ao lado (sem scroll adicional).

**Independent Test**: Selecionar aluno com objetivos e BNCC cadastrados, preencher período, clicar "Gerar Relatório" → rascunho aparece no card sticky direito com botão de download visível sem rolar a página.

- [ ] T006 [P] [US1] Criar `frontend/src/components/BnccSelector.vue` com PrimeVue `MultiSelect` carregando competências de `GET /api/competencias` (reutilizável em outras features)
- [ ] T007 [US1] Criar `frontend/src/pages/RelatórioIndividualPage.vue` com layout grid duas colunas: `col-12 lg:col-5` (formulário) + `col-12 lg:col-7` (rascunho sticky) per `specs/004-relatorio-individual/data-model.md` seção "Layout de tela"
- [ ] T008 [US1] Adicionar campos ao formulário em `RelatórioIndividualPage.vue`: Dropdown aluno (carregado de `GET /api/turmas/:id/alunos`), Calendar início/fim, `BnccSelector`, Button "Gerar Relatório"
- [ ] T009 [US1] Conectar Button "Gerar Relatório" ao `store.gerarRelatorio()` (`:disabled="!store.formularioValido"`, `:loading="store.estaGerando"`)
- [ ] T010 [US1] Exibir `<Message severity="error">` com `store.erroGeracao` quando a geração falhar (RF-003 — mensagem indicando dado ausente)
- [ ] T011 [US1] Mostrar card sticky com rascunho (`v-if="store.etapa !== 'formulario'"`) após geração bem-sucedida (RF-005 — mesma tela, sem redirect)

**Checkpoint**: US1 verificada — geração funciona, rascunho na mesma tela, botão de download visível (RF-005, RF-006)

---

## Phase 4: User Story 2 — Download do relatório gerado (Prioridade: P1)

**Goal**: Botão de download visível logo abaixo/ao lado do rascunho sem scroll; .docx e .pdf com conteúdo idêntico.

**Independent Test**: Gerar relatório. Verificar que botões ".docx" e ".pdf" são visíveis na viewport sem scroll adicional. Baixar ambos e comparar conteúdo textual.

- [ ] T012 [P] [US2] Criar `frontend/src/components/BotaoExportar.vue` com botões PrimeVue ".docx" (ícone `pi-file-word`) e ".pdf" (ícone `pi-file-pdf`) com estados `loading`; chama `GET /api/documents/rascunhos/:id/export?formato=` → `window.open(download_url, '_blank')` per `specs/004-relatorio-individual/quickstart.md` seção 4
- [ ] T013 [US2] Posicionar `<BotaoExportar>` imediatamente após `<DocumentoRevisor>` dentro do card sticky (RF-006: botão visível sem scroll)
- [ ] T014 [US2] Adicionar `class="sticky top-4"` ao card do rascunho em `RelatórioIndividualPage.vue` (telas ≥ 1024px via CSS/PrimeGrid) per `specs/004-relatorio-individual/plan.md` Decisão D2
- [ ] T015 [US2] Adicionar tratamento de erro em `BotaoExportar.vue`: exibir toast PrimeVue "Não foi possível gerar o arquivo" em caso de falha na exportação

**Checkpoint**: US2 verificada — botão de download visível e funcional para .docx e .pdf (CS-002, CS-003)

---

## Phase 5: User Story 3 — Edição do rascunho antes de finalizar (Prioridade: P1)

**Goal**: Professor pode editar texto livremente; edições salvas automaticamente; rascunho preservado após fechar o browser.

**Independent Test**: Gerar relatório. Editar um trecho. Fechar e reabrir o browser. Navegar de volta ao relatório → texto editado está preservado (RF-011, CS-007).

- [ ] T016 [P] [US3] Criar `frontend/src/components/DocumentoRevisor.vue` com `<Textarea autoResize>` PrimeVue + `<Tag>` de status autosave ("Salvando…" / "Salvo" / "Erro ao salvar") per `specs/004-relatorio-individual/quickstart.md` seção 3
- [ ] T017 [US3] Integrar `useAutoSave` em `DocumentoRevisor.vue`: `watchDebounced(conteudoLocal, props.onSave, { debounce: 1500 })` — `onSave` chama `store.autoSalvar(texto)` → `PATCH /api/documents/rascunhos/:id`
- [ ] T018 [US3] Desabilitar `<Textarea>` em `DocumentoRevisor.vue` quando `rascunho.status === 'finalizado'` (RF-013 — imutabilidade no frontend)
- [ ] T019 [US3] Implementar `onMounted` em `RelatórioIndividualPage.vue`: se `form.aluno_id` definido → `store.carregarRascunhoAtivo(aluno_id)` para restaurar rascunho após reload (RF-011, CS-007)

**Checkpoint**: US3 verificada — autosave funcional a cada 1.5s; rascunho restaurado após reload do browser

---

## Phase 6: User Story 4 — Finalização do relatório (Prioridade: P1)

**Goal**: Professor clica "Finalizar" → confirmação explícita → documento imutável registrado; nenhuma edição direta possível após.

**Independent Test**: Gerar e revisar relatório. Clicar "Finalizar" e confirmar. Tentar editar → Textarea desabilitado. Tentar editar diretamente via API → 409 do backend.

- [ ] T020 [US4] Adicionar Button "Finalizar Relatório" ao card sticky em `RelatórioIndividualPage.vue` (`v-if`: status não finalizado, `:disabled="!store.podeFinalizarr"`)
- [ ] T021 [US4] Implementar `ConfirmDialog` PrimeVue via `useConfirm()` em `RelatórioIndividualPage.vue`: mensagem "Ao finalizar, o relatório se tornará imutável. Confirmar?" com botões "Finalizar" / "Cancelar"
- [ ] T022 [US4] Chamar `store.finalizar(store.conteudoEditado)` ao confirmar → `POST /api/documents/rascunhos/:id/finalizar`; atualizar `rascunho.status` para `'finalizado'` e `etapa` para `'finalizado'`
- [ ] T023 [US4] Tratar HTTP 409 (concorrência) em `store.finalizar()`: exibir toast PrimeVue "Este relatório já foi finalizado" e chamar `store.carregarRascunhoAtivo()` para recarregar estado per `specs/004-relatorio-individual/research.md` Incerteza 4

**Checkpoint**: US4 verificada — finalização imutável, concorrência tratada, Textarea desabilitado (RF-013)

---

## Phase 7: User Story 5 — Histórico de relatórios (Prioridade: P2)

**Goal**: Professor visualiza todos os relatórios finalizados de um aluno ordenados do mais recente; pode baixar qualquer versão histórica.

**Independent Test**: Finalizar 2 relatórios do mesmo aluno em períodos diferentes. Acessar histórico → ambos aparecem com período, data e professor. Download funcional para cada um.

- [ ] T024 [P] [US5] Criar `frontend/src/components/HistoricoRelatorios.vue` com PrimeVue `DataTable` (colunas: Período, Gerado em, Professor, Download) — busca `GET /api/alunos/:id/documentos?tipo=relatorio_individual` (paginação 20/página, ordenado por `finalizado_em DESC`)
- [ ] T025 [US5] Adicionar coluna de download em `HistoricoRelatorios.vue` com `<BotaoExportar :rascunho-id="data.rascunho_id" />` para cada versão histórica (RF-015, RF-018)
- [ ] T026 [US5] Renderizar `<HistoricoRelatorios :aluno-id="store.form.aluno_id">` em `RelatórioIndividualPage.vue` abaixo do grid principal (`v-if="store.form.aluno_id"`)

**Checkpoint**: US5 verificada — histórico exibe todas as versões finalizadas com download disponível (CS-004, CS-008)

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T027 [P] Verificar layout sticky em viewport 768px (mobile): card rascunho vai para coluna única abaixo do formulário; botão de download visível sem scroll
- [ ] T028 Validar todas as chamadas de API contra `specs/004-relatorio-individual/contracts/relatorio.md` (status codes, campos obrigatórios, mensagens de erro)
- [ ] T029 [P] Testar cenário de sessão expirada durante autosave: interceptor 401 do Axios redireciona para `/login` preservando rascunho no banco (RF-011 Cenário 3)
- [ ] T030 Verificar CS-002: abrir em viewport 1366×768 e confirmar que botão de download é visível sem scroll além do conteúdo gerado

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Depende de features 001, 002, 003, 007 concluídas
- **Foundational (Phase 2)**: Depende de Phase 1 — BLOQUEIA todas as US
- **US1 (Phase 3)**: Depende de Phase 2 — MVP (apenas frontend UI)
- **US2 (Phase 4)**: Depende de US1 (precisa de `rascunhoId`) — pode rodar em paralelo após T011
- **US3 (Phase 5)**: Depende de Phase 2 — pode rodar em paralelo com US1 e US2
- **US4 (Phase 6)**: Depende de US1 e US3 (precisa de rascunho editado)
- **US5 (Phase 7)**: Depende de US4 (precisa de versões finalizadas) — P2
- **Polish (Phase 8)**: Depende de US1–US5

### Parallel Opportunities (User Story 1)

```
Phase 3 (após Foundational):
  ├── T006 BnccSelector.vue        (independente)
  ├── T007–T011 RelatórioPage      (sequencial internamente)
  └── T012 BotaoExportar.vue       (US2 — pode rodar junto com T006)
```

### MVP Sugerido

**MVP = Phases 1–2 + US1 (Phase 3) + US2 (Phase 4) + US3 (Phase 5) + US4 (Phase 6)**

Todas as 4 histórias P1 formam o MVP desta feature — são inseparáveis funcionalmente. US5 (histórico) é a única P2 e pode ser entregue em iteração posterior.
