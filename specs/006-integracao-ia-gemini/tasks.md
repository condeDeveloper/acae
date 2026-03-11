# Tasks: Integração com Google Gemini 2.0 Flash

**Input**: `specs/006-integracao-ia-gemini/` (plan.md, spec.md, data-model.md, quickstart.md, contracts/)
**Feature Branch**: `006-integracao-ia-gemini`
**Depende de**: 007 (Banco de Dados — tabelas `controle_cotas` e `rascunhos_documento`)
**Implementação**: Node.js 22 + Fastify 5 + `@google/genai` v1.44+

---

## Phase 1: Setup

**Purpose**: Instalação da SDK Gemini e configuração da chave de API

- [ ] T001 Instalar `@google/genai` v1.44+ em `backend/`: `npm install @google/genai`
- [ ] T002 [P] Adicionar `GEMINI_API_KEY` ao `backend/.env` (valor real do Google AI Studio) e confirmar que `backend/.env` consta no `.gitignore`
- [ ] T003 [P] Adicionar `GEMINI_API_KEY=` (placeholder vazio) ao `backend/.env.example`

---

## Phase 2: Foundational (Serviços base de IA)

**Purpose**: Cliente Gemini, builder de prompts e controle de cota — tudo que as user stories dependem.

**⚠️ CRÍTICO**: Fase 2 deve estar completa antes de qualquer rota de geração.

- [ ] T004 Criar `backend/src/services/gemini.service.ts` com `GoogleGenAI` inicializado com `GEMINI_API_KEY`, função `generateContent(prompt: string): Promise<string>` com `AbortSignal.timeout(30_000)` e model `gemini-2.0-flash`
- [ ] T005 Criar `backend/src/services/quota.service.ts` com `checkQuota()` (lê `controle_cotas` WHERE `data = today` — lança `QuotaExceededError` se `contagem >= 1500`) e `incrementQuota()` (INSERT OR UPDATE para hoje)
- [ ] T006 [P] Criar `backend/src/services/prompt-builder.ts` com função `pseudonymize(): string` usando `crypto.randomUUID()` (UUID descartável, não persistido) per Princípio IV
- [ ] T007 [P] Implementar `buildPromptPortfolio(dados)` em `backend/src/services/prompt-builder.ts` (aluno pseudonimizado + atividades + mediações + ocorrências + bncc_refs + contexto da turma)
- [ ] T008 Implementar `buildPromptRelatorio(dados)` em `backend/src/services/prompt-builder.ts` (compilação de múltiplas semanas)
- [ ] T009 [P] Implementar `buildPromptAtividade(dados)` em `backend/src/services/prompt-builder.ts` (objetivo + bncc_ref + contexto pedagógico dos alunos selecionados)
- [ ] T010 [P] Implementar `buildPromptResumo(dados)` em `backend/src/services/prompt-builder.ts` (agregado da turma, sem identificação nominal de alunos)

**Checkpoint**: Serviços prontos — rotas de geração podem ser integradas

---

## Phase 3: User Story 1 — Professor solicita geração e recebe rascunho (Prioridade: P1)

**Goal**: POST /api/documents/generate retorna rascunho em < 30s com dados anonimizados e BNCC no prompt.

**Independent Test**: Preencher dados obrigatórios de um documento, acionar geração e verificar rascunho retornado em < 30s sem nenhum nome real de aluno no payload enviado ao Gemini.

- [ ] T011 [US1] Implementar orquestração em `backend/src/services/document.service.ts`: 1) `checkQuota()`, 2) buscar dados do banco, 3) `pseudonymize()` + `buildPrompt*()`, 4) `generateContent()`, 5) salvar `RascunhoDocumento` no banco, 6) `incrementQuota()`
- [ ] T012 [US1] Implementar `POST /api/documents/generate` em `backend/src/routes/documents.ts` per `specs/006-integracao-ia-gemini/contracts/generate-document.md` (rota autenticada com `attachProfessor`)
- [ ] T013 [US1] Adicionar validação pré-geração em `document.service.ts`: bloquear se `bncc_refs.length === 0` → HTTP 422 com mensagem orientadora (Princípio III)
- [ ] T014 [US1] Adicionar validação pré-geração em `document.service.ts`: bloquear se não há registros de aluno no período → HTTP 422

**Checkpoint**: US1 verificada — geração funciona end-to-end, rascunho salvo no banco

---

## Phase 4: User Story 2 — Tratamento de falhas da API (Prioridade: P1)

**Goal**: Falhas do Gemini retornam mensagens amigáveis em PT-BR; dados do professor preservados.

**Independent Test**: Simular falha de rede/timeout e verificar que professor vê mensagem amigável sem detalhes técnicos; dados preenchidos permanecem na tela.

- [ ] T015 [US2] Adicionar try/catch em `gemini.service.ts`: timeout → HTTP 504 `{ error: "A geração demorou mais que o esperado. Tente novamente." }`, erro de rede → HTTP 503 `{ error: "Serviço de IA temporariamente indisponível." }` — sem stack trace
- [ ] T016 [US2] Mapear outros erros da API Gemini (resposta malformada, erro HTTP 4xx/5xx) para HTTP 503 com mensagem genérica amigável em `gemini.service.ts`
- [ ] T017 [US2] Verificar que frontend em `GerarDocumentoPage.vue` (feature 003) exibe toast de erro e mantém formulário preenchido após falha de geração

**Checkpoint**: US2 verificada — falhas não causam perda de dados nem mensagens técnicas

---

## Phase 5: User Story 3 — Bloqueio quando limite diário é atingido (Prioridade: P1)

**Goal**: Sistema bloqueia geração quando cota de 1.500 req/dia é atingida; professor sabe quando retorna.

**Independent Test**: Configurar limite simulado de 1 req/dia, acionar geração 2x — segunda tentativa deve retornar mensagem com previsão de retorno (meia-noite BRT).

- [ ] T018 [US3] Verificar que `checkQuota()` em `quota.service.ts` lança erro antes de contatar Gemini quando `contagem >= 1500` → HTTP 429 com `{ error: "Limite diário de geração atingido. Retorna à meia-noite (Brasília).", retorna_em: "2026-03-11T03:00:00Z" }`
- [ ] T019 [US3] Implementar aviso de cota próxima em `document.service.ts`: quando `contagem >= 1350` (< 10% restante), adicionar header `X-Quota-Remaining` na resposta de sucesso per `specs/006-integracao-ia-gemini/spec.md` US3 Cenário 2
- [ ] T020 [US3] Verificar reset diário: `contagem` da tabela `controle_cotas` é isolada por `data` (DATE) — novo dia = nova linha, sem necessidade de cron job adicional

**Checkpoint**: US3 verificada — cota diária controlada com feedback correto ao professor

---

## Phase 6: User Story 4 — Segurança da chave de API (Prioridade: P1)

**Goal**: `GEMINI_API_KEY` nunca exposta ao browser; toda comunicação com Gemini passa pelo backend.

**Independent Test**: Inspecionar bundle frontend compilado e verificar ausência de string `GEMINI_API_KEY` ou `AIza`.

- [ ] T021 [P] [US4] Confirmar que `GEMINI_API_KEY` é lida SOMENTE em `backend/src/services/gemini.service.ts` via `process.env.GEMINI_API_KEY` — nenhuma referência no `frontend/`
- [ ] T022 [US4] Confirmar que nenhuma variável `VITE_GEMINI_*` existe em qualquer `.env` do frontend (variáveis `VITE_` são expostas ao bundle pelo Vite)
- [ ] T023 [P] [US4] Executar `npm run build` no frontend e verificar com `grep -r "AIza" frontend/dist/` — deve retornar vazio

**Checkpoint**: US4 verificada — chave de API não vazada ao browser

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T024 [P] Adicionar logging estruturado em `quota.service.ts`: logar incremento (sem PII) para auditoria de uso da API
- [ ] T025 Validar contrato de geração contra `specs/006-integracao-ia-gemini/contracts/generate-document.md` (campos obrigatórios, status codes, validações)
- [ ] T026 [P] Criar `backend/src/plugins/gemini-quota.ts` exportando `quota.service.ts` como plugin Fastify (opcional — para facilitar injeção de dependência em testes)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Depende de feature 007 (banco criado com tabela `controle_cotas`)
- **Foundational (Phase 2)**: Depende de Phase 1
- **US1 (Phase 3)**: Depende de Phase 2 — MVP mínimo
- **US2 (Phase 4)**: Depende de Phase 2 — Pode rodar em paralelo com US1 após T011 estar completo
- **US3 (Phase 5)**: Depende de Phase 2 — Pode rodar em paralelo com US1
- **US4 (Phase 6)**: Depende de Foundational — Verificação pode ser feita em paralelo com US1
- **Polish (Phase 7)**: Depende de US1–US4

### Parallel Opportunities (Foundational)

```
Phase 2 (após Phase 1):
  ├── T006 pseudonymize()             (independente)
  ├── T007 buildPromptPortfolio()     (independente)
  ├── T009 buildPromptAtividade()     (independente)
  └── T010 buildPromptResumo()        (independente)
       ↓
  T008 buildPromptRelatorio()         (pode rodar junto com acima)
```

### MVP Sugerido

**MVP = Phases 1–2 + US1 (Phase 3) + US4 (Phase 6)**

Com Foundational + US1 + US4: geração de qualquer tipo de documento funciona com segurança. US2 e US3 melhoram resiliência mas não bloqueiam o fluxo principal.
