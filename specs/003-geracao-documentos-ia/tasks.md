# Tasks: Geração de Documentos Pedagógicos com IA

**Input**: `specs/003-geracao-documentos-ia/` (plan.md, spec.md, data-model.md, quickstart.md, contracts/)
**Feature Branch**: `003-geracao-documentos-ia`
**Depende de**: 007 (Banco), 006 (Gemini — `prompt-builder.ts`, `gemini.service.ts`), 001 (Login), 002 (Stack)
**Implementação**: Node.js 22 + Fastify 5 + `docxtemplater` + `puppeteer` + Vue 3 + PrimeVue v4

---

## Phase 1: Setup

**Purpose**: Dependências de exportação instaladas e templates criados

- [ ] T001 Instalar dependências de exportação em `backend/`: `npm install docxtemplater pizzip puppeteer @sparticuz/chromium`
- [ ] T002 [P] Criar diretório `backend/src/templates/` com os 4 arquivos `.docx` de template: `portfolio-semanal.docx`, `relatorio-individual.docx`, `atividade-adaptada.docx`, `resumo-pedagogico.docx` per `specs/003-geracao-documentos-ia/quickstart.md` (seção 2)
- [ ] T003 [P] Adicionar rota `/documentos/gerar` e `/documentos` em `frontend/src/router/index.ts` com `meta.requiresAuth: true`

---

## Phase 2: Foundational (Serviços de exportação + tokens de download)

**Purpose**: Infraestrutura de exportação .docx/.pdf e download tokenizado — compartilhada por todos os 4 tipos de documento.

**⚠️ CRÍTICO**: Fase 2 deve estar completa antes de implementar qualquer rota de geração/exportação.

- [ ] T004 Criar `backend/src/services/export.service.ts` com `gerarDocx(tipo, dados)` usando `docxtemplater` + `pizzip` per `specs/003-geracao-documentos-ia/quickstart.md` seção 3
- [ ] T005 Criar `backend/src/services/pdf.service.ts` com `gerarPdf(html)` usando Puppeteer + `@sparticuz/chromium` (detecção de `NODE_ENV=production` para Railway) per `specs/003-geracao-documentos-ia/quickstart.md` seção 4
- [ ] T006 Criar `backend/src/services/download-token.service.ts` com `criarToken(entry)` e `consumirToken(token)` usando `Map` em memória (UUID v4, TTL 10 min, uso único) per `specs/003-geracao-documentos-ia/quickstart.md` seção 5
- [ ] T007 Criar `backend/src/routes/downloads.ts` com `GET /api/downloads/:token` (sem JWT) — chama `consumirToken()`, retorna 404 se inválido/expirado, envia buffer com `Content-Disposition: attachment` per `specs/003-geracao-documentos-ia/contracts/generate.md`
- [ ] T008 Registrar `downloadsRoutes` em `backend/src/app.ts`

**Checkpoint**: `criarToken()` + `GET /api/downloads/:token` funcional — download sem JWT testável com curl

---

## Phase 3: User Story 1 — Professor gera Portfólio Semanal (Prioridade: P1) 🎯 MVP

**Goal**: Professor seleciona aluno + semana → clica "Gerar" → rascunho aparece na tela com botão de download .docx e .pdf.

**Independent Test**: Cadastrar aluno com atividades e BNCC de uma semana. Gerar portfólio. Verificar rascunho na tela, fazer download .docx e .pdf — ambos com cabeçalho correto e conteúdo idêntico.

- [ ] T009 [US1] Criar `backend/src/services/document.service.ts` com `gerarDocumento(tipo, params)`: busca `RegistroAluno` + `ContextoPedagogico`, chama `prompt-builder.buildPrompt*()`, chama `gemini.service.generateContent()`, salva `RascunhoDocumento` no banco
- [ ] T010 [US1] Implementar fluxo `tipo=portfolio_semanal` em `document.service.ts` (busca registros da semana + contexto + BNCC; valida bncc_refs >= 1)
- [ ] T011 [US1] Implementar `POST /api/documents/generate` em `backend/src/routes/documents.ts` per `specs/003-geracao-documentos-ia/contracts/generate.md` (autenticado com `attachProfessor`)
- [ ] T012 [US1] Implementar `GET /api/documents/rascunhos/:id/export` em `backend/src/routes/documents.ts`: gera .docx ou .pdf → chama `criarToken()` → retorna `{ download_url, expira_em, formato }`
- [ ] T013 [US1] Implementar `PATCH /api/documents/rascunhos/:id` em `backend/src/routes/documents.ts` (salva `conteudo_editado`, muda status para `em_revisao`) — rejeita com 409 se já `finalizado`
- [ ] T014 [US1] Implementar `POST /api/documents/rascunhos/:id/finalizar` em `backend/src/routes/documents.ts` (cria `VersaoDocumento` INSERT-ONLY; verifica `bncc_refs >= 1` e `conteudo_final` não vazio)
- [ ] T015 [P] [US1] Criar `frontend/src/pages/GerarDocumentoPage.vue` com formulário `tipo=portfolio_semanal`: Dropdown aluno, seletor de semana, BNCC, botão "Gerar Portfólio"
- [ ] T016 [P] [US1] Criar `frontend/src/components/DocumentoRevisor.vue`: `<Textarea autoResize>` PrimeVue com indicador de salvamento (Tag: Salvando… / Salvo / Erro)
- [ ] T017 [P] [US1] Criar `frontend/src/components/BotaoExportar.vue`: botões ".docx" e ".pdf" que chamam `GET /api/documents/rascunhos/:id/export?formato=` e abrem `download_url` via `window.open(url, '_blank')`
- [ ] T018 [US1] Exibir `DocumentoRevisor` + `BotaoExportar` na mesma tela após geração bem-sucedida (sem redirecionamento)

**Checkpoint**: Portfólio Semanal completo end-to-end — geração, revisão, edição, export .docx e .pdf funcionando

---

## Phase 4: User Story 2 — Professor gera Relatório Individual (Prioridade: P1)

**Goal**: Professor seleciona aluno + período → gera relatório consolidando múltiplas semanas de registros.

**Independent Test**: Aluno com registros em 3 semanas consecutivas. Gerar relatório com período cobrindo as 3 semanas. Verificar que conteúdo consolida todas as semanas; download correto.

- [ ] T019 [P] [US2] Implementar fluxo `tipo=relatorio_individual` em `backend/src/services/document.service.ts` (busca `RegistroAluno[]` do período, agrega objetivos/atividades/mediações, aplica `buildPromptRelatorio()`)
- [ ] T020 [US2] Confirmar que `relatorio-individual.docx` template criado em T002 tem todos os marcadores corretos per `specs/003-geracao-documentos-ia/data-model.md` (seção "Estrutura de templates")

**Checkpoint**: US2 verificada — Relatório Individual gerado com dados consolidados do período

---

## Phase 5: User Story 3 — Professor gera Atividade Adaptada (Prioridade: P2)

**Goal**: Professor seleciona aluno(s) ou grupo + objetivo + BNCC → gera atividade adaptada ao nível do aluno.

**Independent Test**: Selecionar grupo de 2 alunos com contexto pedagógico cadastrado. Informar objetivo e BNCC. Gerar. Verificar atividade com adaptações por aluno visíveis.

- [ ] T021 [P] [US3] Implementar fluxo `tipo=atividade_adaptada` em `backend/src/services/document.service.ts` (suporta `aluno_ids[]` e/ou `grupo_id`; aplica `buildPromptAtividade()` com contexto pedagógico de cada aluno)
- [ ] T022 [US3] Adicionar validação em `document.service.ts` para `atividade_adaptada`: rejeita se `aluno_ids` e `grupo_id` ambos ausentes → HTTP 400
- [ ] T023 [P] [US3] Confirmar que `atividade-adaptada.docx` template em `backend/src/templates/` tem marcadores corretos

**Checkpoint**: US3 verificada — Atividade Adaptada gerada para aluno ou grupo

---

## Phase 6: User Story 4 — Professor gera Resumo Pedagógico (Prioridade: P2)

**Goal**: Professor seleciona turma + período → gera visão geral narrativa da turma para a coordenação.

**Independent Test**: Turma com ao menos 2 alunos com registros no período. Gerar resumo pedagógico. Verificar que NENHUM nome de aluno aparece no prompt enviado ao Gemini.

- [ ] T024 [P] [US4] Implementar fluxo `tipo=resumo_pedagogico` em `backend/src/services/document.service.ts` (agrega dados de todos os alunos da turma no período, sem identificação individual; aplica `buildPromptResumo()`)
- [ ] T025 [US4] Adicionar validação em `document.service.ts` para `resumo_pedagogico`: rejeita se menos de 2 alunos com registros no período → HTTP 422 `"Ao menos 2 alunos com registros são necessários para o resumo"`
- [ ] T026 [P] [US4] Confirmar que `resumo-pedagogico.docx` template em `backend/src/templates/` tem marcadores corretos

**Checkpoint**: US4 verificada — Resumo Pedagógico gerado sem identificação nominal de alunos

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T027 [P] Implementar `GET /api/alunos/:id/documentos` em `backend/src/routes/documentos.ts` (lista `versoes_documento` por aluno, com paginação e filtro por `tipo`) per `specs/003-geracao-documentos-ia/contracts/generate.md`
- [ ] T028 [P] Criar `frontend/src/pages/DocumentosPage.vue` com PrimeVue `DataTable` listando histórico de documentos por aluno (tipo, período, data de geração, botão download)
- [ ] T029 Validar todos os endpoints contra `specs/003-geracao-documentos-ia/contracts/generate.md` (status codes, campos obrigatórios, validações de 422)
- [ ] T030 [P] Verificar que download token expira corretamente em 10 min e é consumido uma única vez (testar com mesma URL duas vezes → 2ª retorna 404)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Depende de features 006 e 007 estarem concluídas
- **Foundational (Phase 2)**: Depende de Phase 1 — BLOQUEIA todas as US
- **US1 (Phase 3)**: Depende de Phase 2 — MVP mínimo
- **US2 (Phase 4)**: Depende de Phase 2 — Pode rodar em paralelo com US1 após T009 estar completo
- **US3 (Phase 5)**: Depende de Phase 2 — Pode rodar em paralelo com US1 e US2
- **US4 (Phase 6)**: Depende de Phase 2 — Pode rodar em paralelo com US1, US2, US3
- **Polish (Phase 7)**: Depende de US1–US4

### Parallel Opportunities (Foundational)

```
Phase 2 (após Phase 1):
  ├── T004 export.service.ts (docxtemplater)   (independente)
  ├── T005 pdf.service.ts (Puppeteer)           (independente)
  └── T006 download-token.service.ts            (independente)
       ↓ todos prontos
  T007 GET /api/downloads/:token               (depende de T006)
```

### Parallel Opportunities (User Story 1)

```
Phase 3 (após T009 document.service base):
  ├── T015 GerarDocumentoPage.vue  (frontend, independente)
  ├── T016 DocumentoRevisor.vue    (frontend, independente)
  └── T017 BotaoExportar.vue       (frontend, independente)
       ↑ T011/T012/T013/T014 no backend podem iniciar em paralelo com frontend
```

### MVP Sugerido

**MVP = Phases 1–2 + US1 (Phase 3)**

Com Setup + Foundational + US1: o professor já consegue gerar, revisar, editar e baixar um portfólio semanal. Os demais 3 tipos de documento (US2–US4) reusam a mesma infraestrutura com pequenas variações.
