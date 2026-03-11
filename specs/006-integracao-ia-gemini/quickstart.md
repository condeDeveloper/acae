# Quickstart: Integração com Google Gemini 2.0 Flash

**Branch**: `006-integracao-ia-gemini` | **Data**: 2026-03-10

Este guia descreve como configurar e rodar a integração com o Gemini localmente.

---

## Pré-requisitos

- Node.js 22 LTS instalado
- PostgreSQL rodando localmente (ou Docker)
- Chave de API do Gemini 2.0 Flash (obtida em [aistudio.google.com](https://aistudio.google.com))
- Arquivo `.env` na raiz do projeto com `GEMINI_API_KEY` preenchido

---

## 1. Instalar dependências do backend

```bash
cd backend
npm install
```

Pacotes principais instalados:
- `@google/genai` — SDK oficial do Gemini 2.0
- `fastify` — servidor HTTP
- `dotenv` — leitura de variáveis de ambiente
- `pg` — cliente PostgreSQL

---

## 2. Verificar variável de ambiente

O servidor **não sobe** se `GEMINI_API_KEY` estiver ausente. Verifique:

```bash
# No PowerShell
Get-Content .env
```

Deve mostrar `GEMINI_API_KEY=sua_chave_aqui` (não vazia).

---

## 3. Criar tabelas no banco

```bash
cd backend
npm run migrate
```

Cria as tabelas:
- `ai_quota_usage`
- `document_drafts`
- `document_versions`

---

## 4. Rodar o servidor backend

```bash
cd backend
npm run dev
```

Saída esperada:
```
✓ GEMINI_API_KEY carregada do ambiente
✓ Banco de dados conectado
✓ Servidor rodando em http://localhost:3000
```

---

## 5. Testar a geração (exemplo com curl)

```bash
curl -X POST http://localhost:3000/api/documents/generate \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "relatorio_individual",
    "classId": "uuid-da-turma",
    "studentId": "uuid-do-aluno",
    "period": "2026-semana-10",
    "bnccRefs": ["EF01LP01"],
    "pedagogicalData": {
      "objectives": "Desenvolver autonomia na leitura",
      "activities": "Leitura com figuras de apoio",
      "mediations": "Prancha de comunicação",
      "occurrences": ""
    }
  }'
```

Resposta esperada:
```json
{
  "draftId": "...",
  "generatedContent": "O aluno demonstrou...",
  "status": "rascunho",
  "quotaRemaining": 1499
}
```

---

## 6. Verificar que a chave nunca aparece no frontend

Abra o DevTools do navegador → aba Network → inspecione qualquer requisição da página de geração.

✅ A chave `GEMINI_API_KEY` **não deve aparecer** em nenhuma requisição, header ou resposta.

---

## Estrutura dos arquivos principais

```
backend/src/
├── services/
│   ├── gemini.service.js     ← cliente + timeout 30s
│   ├── prompt-builder.js     ← anonimização + montagem do prompt
│   └── quota.service.js      ← contador em memória + persistência PostgreSQL
├── routes/documents/
│   └── generate.route.js     ← POST /api/documents/generate
└── models/
    ├── ai-quota-usage.model.js
    └── document-draft.model.js
```

---

## Troubleshooting

| Problema | Causa provável | Solução |
|----------|---------------|---------|
| `GEMINI_API_KEY environment variable not set` | `.env` ausente ou vazio | Verificar arquivo `.env` na raiz |
| `Quota diária atingida` | 1.500 req consumidas | Aguardar meia-noite (Brasília) ou criar nova chave |
| `GENERATION_TIMEOUT` | Rede lenta ou Gemini sobrecarregado | Tentar novamente em alguns instantes |
| `403 Forbidden` | JWT expirado ou turma incorreta | Refazer login; verificar `classId` |
