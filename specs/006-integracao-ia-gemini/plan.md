# Plano de Implementação: Integração com Google Gemini 2.0 Flash

**Branch**: `006-integracao-ia-gemini` | **Data**: 2026-03-10 | **Spec**: [spec.md](.specify/specs/integracao-ia/spec.md)
**Input**: Especificação da funcionalidade em `.specify/specs/integracao-ia/spec.md`

## Resumo

Camada de integração entre o backend (Node.js + Fastify) e a API Google Gemini 2.0 Flash para geração de rascunhos de documentos pedagógicos. O backend recebe dados anonimizados do professor, monta o prompt com contexto pedagógico e BNCC, chama o Gemini, retorna o texto gerado. O professor revisa e edita o rascunho antes de finalizar. Limite diário de 1.500 requisições controlado no servidor.

## Contexto Técnico

**Linguagem/Versão**: Node.js 22 LTS (backend) + Vue 3 (frontend)
**Dependências principais**: Fastify 5, `@google/genai` v1.44+, PostgreSQL, dotenv
**Armazenamento**: PostgreSQL — tabelas `ai_quota_usage` e `document_drafts`
**Testes**: Vitest (unitários), Supertest (integração de rota Fastify)
**Plataforma**: Servidor Linux (Node.js), navegador moderno (Vue 3)
**Tipo de projeto**: Aplicação web (frontend SPA + backend REST API)
**Metas de performance**: Resposta do Gemini em até 30 segundos; verificação de cota < 5ms
**Restrições**: 1.500 requisições Gemini/dia (plano gratuito); chave de API nunca exposta ao frontend
**Escala/Escopo**: Portal escolar interno, estimativa de 5–30 gerações/dia

## Verificação da Constituição

*GATE: Deve passar antes da Fase 0. Reavaliado após a Fase 1.*

| Princípio | Gate | Status | Justificativa |
|-----------|------|--------|---------------|
| I — Simplicidade | Professor não vê detalhes técnicos da API; mensagens de erro são amigáveis | ✅ PASSOU | Toda comunicação com Gemini é tratada no backend; erros traduzidos em mensagens simples |
| II — IA baseada em dados | Prompt construído exclusivamente com dados cadastrados pelo professor | ✅ PASSOU | Serviço de construção de prompt proibido de usar dados externos ao cadastro |
| III — Rastreabilidade BNCC | BNCC obrigatória no prompt; geração bloqueada sem vínculo | ✅ PASSOU | Validação no backend antes de qualquer chamada à API |
| IV — LGPD | Nome real do aluno nunca enviado ao Gemini; chave só no servidor | ✅ PASSOU | Anonimização enforçada no serviço de prompt; chave em variável de ambiente |
| V — Fidelidade | Rascunho gerado exibido integralmente; editável antes de finalizar | ✅ PASSOU | Resposta do Gemini devolvida sem truncamento ao professor |

**Resultado do Gate**: ✅ APROVADO — pode prosseguir para Fase 0.

## Estrutura do Projeto

### Documentação (esta feature)

```text
specs/006-integracao-ia-gemini/
├── plan.md              ← este arquivo
├── research.md          ← Fase 0
├── data-model.md        ← Fase 1
├── quickstart.md        ← Fase 1
├── contracts/
│   └── generate-document.md   ← Fase 1
└── tasks.md             ← Fase 2 (/speckit.tasks — ainda não criado)
```

### Código-fonte (raiz do repositório)

```text
backend/
├── src/
│   ├── services/
│   │   ├── gemini.service.js       ← cliente Gemini + timeout + retry
│   │   ├── prompt-builder.js       ← monta prompt anonimizado por tipo de doc
│   │   └── quota.service.js        ← controle de cota diária (DB + memória)
│   ├── plugins/
│   │   └── gemini.plugin.js        ← registra serviço como plugin Fastify
│   ├── routes/
│   │   └── documents/
│   │       └── generate.route.js   ← POST /api/documents/generate
│   └── models/
│       ├── ai-quota-usage.model.js
│       └── document-draft.model.js
└── tests/
    ├── unit/
    │   ├── gemini.service.test.js
    │   ├── prompt-builder.test.js
    │   └── quota.service.test.js
    └── integration/
        └── generate.route.test.js

frontend/
└── src/
    └── services/
        └── document-generation.service.js  ← chama POST /api/documents/generate
```

## Decisões Tomadas (da Pesquisa — Fase 0)

Veja `research.md` para detalhes completos. Resumo:

| Decisão | Escolha | Alternativa rejeitada |
|---------|---------|----------------------|
| SDK Gemini | `@google/genai` v1.44+ | `@google/generative-ai` (descontinuado) |
| Modelo | `gemini-2.0-flash` | `gemini-2.5-flash` (mais novo, testar depois) |
| Modo de resposta | Não-streaming | Streaming (desnecessário para geração de docs) |
| Timeout | `Promise.race` 30 segundos | Sem timeout (requisições penduradas) |
| Controle de cota | PostgreSQL + contador em memória | Redis (complexidade desnecessária para portal escolar) |
| Estrutura do prompt | Instrução de sistema + dados estruturados | Zero-shot (qualidade inconsistente) |

## Verificação da Constituição Pós-Design

*Reavaliação após Fase 1 (data-model + contracts definidos)*

| Princípio | Status pós-design | Observação |
|-----------|------------------|------------|
| I — Simplicidade | ✅ | Endpoint único, resposta simples JSON |
| II — IA baseada em dados | ✅ | `prompt-builder.js` recebe apenas campos do cadastro; sem dados externos |
| III — BNCC | ✅ | Campo `bnccRefs` obrigatório no contrato da rota; `quota.service` valida antes de chamar a API |
| IV — LGPD | ✅ | `prompt-builder.js` substitui `studentName` por `"o aluno"` / `"a criança"` antes de montar o prompt |
| V — Fidelidade | ✅ | Resposta devolvida integralmente; truncamento só em último caso (>8000 tokens) |
