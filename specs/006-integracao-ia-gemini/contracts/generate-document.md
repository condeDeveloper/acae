# Contrato de API: Geração de Documento Pedagógico

**Endpoint**: `POST /api/documents/generate`
**Branch**: `006-integracao-ia-gemini` | **Data**: 2026-03-10

---

## Descrição

Recebe os dados pedagógicos do professor, constrói o prompt anonimizado, chama o Gemini 2.0 Flash e retorna o rascunho gerado para revisão. A chave de API nunca trafega no frontend.

**Autenticação**: JWT Bearer token obrigatório (todas as rotas protegidas — Princípio IV)

---

## Request

**Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body**:
```json
{
  "documentType": "relatorio_individual",
  "classId": "uuid-da-turma",
  "studentId": "uuid-do-aluno",
  "period": "2026-semana-10",
  "bnccRefs": ["EF01LP01", "EF01MA01"],
  "pedagogicalData": {
    "objectives": "Desenvolver autonomia na leitura de palavras simples",
    "activities": "Leitura de sílabas com apoio de figuras; bingo de palavras",
    "mediations": "Uso de prancha de comunicação e apontamento direto",
    "occurrences": "Demonstrou interesse elevado nas atividades com cores"
  }
}
```

**Campos obrigatórios**:

| Campo | Tipo | Regras |
|-------|------|--------|
| `documentType` | string ENUM | `portfolio_semanal`, `relatorio_individual`, `atividade_adaptada`, `resumo_pedagogico` |
| `classId` | UUID | Deve pertencer ao professor autenticado |
| `period` | string | Formato `YYYY-semana-NN` ou `YYYY-MM` |
| `bnccRefs` | string[] | Mínimo 1 elemento — bloqueado sem vínculo BNCC (Princípio III) |
| `pedagogicalData` | object | Ao menos um campo interno preenchido |

**Campo condicional**:
| Campo | Condição |
|-------|----------|
| `studentId` | Obrigatório para `relatorio_individual`, `atividade_adaptada` e `portfolio_semanal`; omitido para `resumo_pedagogico` |

---

## Response — Sucesso (200)

```json
{
  "draftId": "uuid-do-rascunho",
  "documentType": "relatorio_individual",
  "generatedContent": "O aluno demonstrou progresso significativo na identificação de sílabas...",
  "bnccRefs": ["EF01LP01", "EF01MA01"],
  "generationDurationMs": 4230,
  "status": "rascunho",
  "quotaRemaining": 1487
}
```

---

## Response — Erros

### 400 — Dados inválidos
```json
{
  "error": "VALIDATION_ERROR",
  "message": "O campo bnccRefs deve conter ao menos uma competência BNCC.",
  "field": "bnccRefs"
}
```

### 401 — Não autenticado
```json
{
  "error": "UNAUTHORIZED",
  "message": "Sessão expirada. Faça login novamente."
}
```

### 403 — Acesso negado
```json
{
  "error": "FORBIDDEN",
  "message": "Você não tem acesso a esta turma."
}
```

### 429 — Limite diário atingido
```json
{
  "error": "QUOTA_EXCEEDED",
  "message": "O limite diário de gerações foi atingido. As gerações serão liberadas novamente a partir de meia-noite (horário de Brasília).",
  "resetAt": "2026-03-11T03:00:00Z"
}
```

### 408 — Timeout
```json
{
  "error": "GENERATION_TIMEOUT",
  "message": "Não foi possível gerar o documento agora. Tente novamente em alguns instantes."
}
```

### 503 — Gemini indisponível
```json
{
  "error": "AI_SERVICE_UNAVAILABLE",
  "message": "Não foi possível gerar o documento agora. Tente novamente em alguns instantes."
}
```

---

## Regras de Segurança

- A chave `GEMINI_API_KEY` **nunca** aparece em nenhum campo de request ou response
- O nome real do aluno **nunca** é transmitido ao Gemini — substituído por referência neutra no backend
- O `studentId` identifica o aluno no banco do sistema, mas **não** é enviado ao Gemini
- Logs registram apenas `draftId`, `documentType`, `classId` e `duration` — sem PII
- Toda requisição exige JWT válido; `classId` é validado contra as turmas do professor autenticado
