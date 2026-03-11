# Pesquisa: Integração com Google Gemini 2.0 Flash

**Branch**: `006-integracao-ia-gemini` | **Data**: 2026-03-10
**Fase**: 0 — Resolução de incógnitas técnicas

---

## 1. SDK e Inicialização do Cliente Gemini

**Decisão**: Usar `@google/genai` v1.44+

**Justificativa**:
- O pacote antigo `@google/generative-ai` foi descontinuado em agosto de 2025 e não recebe manutenção ativa.
- O novo SDK `@google/genai` suporta Gemini 2.0+, tem tipagem completa e é mantido ativamente pelo Google.
- Nome correto do modelo: `gemini-2.0-flash`

**Alternativas consideradas**:
- `@google/generative-ai`: Descartado — descontinuado
- API REST direta: Descartada — mais verbosa, sem vantagens para este caso
- Vertex AI SDK: Descartado — foco enterprise, desnecessário para portal escolar

**Padrão de uso**:
```js
import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: 'gemini-2.0-flash',
  systemInstruction: '...',
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
  generationConfig: { maxOutputTokens: 2000, temperature: 0.7 }
});
const texto = response.text;
```

---

## 2. Controle de Cota Diária (1.500 req/dia)

**Decisão**: Contador em memória (Node.js) + persistência em PostgreSQL

**Justificativa**:
- Volume esperado: 5–30 gerações/dia → muito abaixo do limite. Solução simples é suficiente.
- Contador em memória garante verificação < 5ms (sem round-trip ao banco).
- PostgreSQL persiste o contador entre reinicializações do servidor.
- Redis seria superdimensionado para este volume e adicionaria complexidade operacional desnecessária.

**Alternativas consideradas**:
- Redis: Descartado — overkill para portal escolar de baixo volume
- Apenas banco de dados: Descartado — latência de leitura por requisição prejudica performance
- Apenas memória: Descartado — perde contador ao reiniciar o servidor

**Lógica**:
```js
// Na inicialização do servidor: carregar contador do dia atual do banco
// A cada requisição de geração: verificar contador em memória
// Se >= 1500: bloquear e retornar erro amigável
// Se < 1500: incrementar em memória e no banco, prosseguir
// À meia-noite (horário de Brasília): resetar contador
```

---

## 3. Construção do Prompt Pedagógico

**Decisão**: Instrução de sistema fixa + dados estruturados do cadastro (sem dados de nível de usuário inventados)

**Justificativa**:
- Instrução de sistema estabelece o papel pedagógico, o idioma (pt-BR) e as regras de anonimização.
- Dados do prompt vêm exclusivamente do que o professor cadastrou (Princípio II da Constituição).
- A BNCC é injetada como contexto obrigatório (Princípio III).
- Nome do aluno é sempre substituído por referência neutra antes de montar o prompt (LGPD).

**Estrutura do prompt por tipo de documento**:

```
[Instrução de sistema]
Você é um especialista em educação especial com foco em ACAE.
Idioma: português brasileiro.
NUNCA invente informações que não estejam nos dados fornecidos.
O sujeito pedagógico é referenciado como "o aluno", "a criança" ou "o estudante".

[Contexto pedagógico]
Turma: {nomeTurma} | Período: {periodo} | Professor: {nomeProfessor}
Competências BNCC: {bnccRefs}

[Dados do aluno — anonimizados]
Objetivos pedagógicos: {objetivos}
Atividades realizadas: {atividades}
Mediações: {mediacoes}
Ocorrências/justificativas: {ocorrencias}

[Instrução de geração]
Gere um {tipDocumento} com base exclusivamente nos dados acima.
O texto deve ter tom pedagógico, ser acessível e cobrir os aspectos registrados.
```

**Alternativas consideradas**:
- Zero-shot sem instrução de sistema: Descartado — qualidade inconsistente em português
- Prompt em inglês traduzido: Descartado — perde contexto cultural pedagógico brasileiro

---

## 4. Modo de Resposta: Streaming vs. Não-Streaming

**Decisão**: Não-streaming para geração de documentos

**Justificativa**:
- Documentos pedagógicos precisam do texto completo para validação antes de salvar.
- Timeout de 30s é suficiente para resposta não-streaming do Gemini (respostas típicas: 3–10s).
- Não-streaming simplifica: sem SSE, sem WebSocket, sem gestão de chunks parciais.
- Streaming seria útil apenas para interface de chat em tempo real — não é o caso aqui.

**Alternativas consideradas**:
- Streaming via SSE: Descartado — complexidade desnecessária para geração de documentos

---

## 5. Timeout da Requisição (30 segundos)

**Decisão**: `Promise.race` com timeout de 30 segundos

**Justificativa**:
- O SDK `@google/genai` não expõe signal de AbortController diretamente, mas `Promise.race` captura o timeout de forma confiável.
- 30 segundos cobre redes lentas de escolas sem prejudicar a experiência normal (respostas em 3–10s).

**Padrão**:
```js
async function chamarGeminiComTimeout(prompt, ms = 30000) {
  return Promise.race([
    chamarGemini(prompt),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), ms)
    )
  ]);
}
```

**Alternativas consideradas**:
- Sem timeout: Descartado — requisições penduradas bloqueiam o servidor
- Axios/fetch manual: Descartado — SDK já gerencia a camada HTTP

---

## 6. Segurança da Chave de API

**Decisão**: Variável de ambiente no servidor, nunca exposta ao frontend

**Justificativa**:
- Chave em `.env` (já criado e no `.gitignore`).
- Backend lê `process.env.GEMINI_API_KEY` na inicialização.
- Se a variável não estiver definida, o servidor não sobe (fail-fast).
- Chave nunca aparece em logs, respostas de API ou código-fonte.

**Alternativas consideradas**:
- Chave no frontend: JAMAIS — qualquer usuário com DevTools veria a chave
- Chave em arquivo de configuração versionado: Descartado — risco de commit acidental

---

## Incógnitas Resolvidas

| Incógnita | Resolução |
|-----------|-----------|
| Qual SDK usar para Gemini 2.0? | `@google/genai` v1.44+ (NOT `@google/generative-ai`) |
| Nome do modelo? | `gemini-2.0-flash` |
| Como controlar cota sem Redis? | Contador em memória + persistência PostgreSQL |
| Streaming ou não? | Não-streaming — suficiente para documentos pedagógicos |
| Como garantir timeout de 30s? | `Promise.race` com `setTimeout` |
| Como nunca vazar nome do aluno? | `prompt-builder.js` substitui antes de montar o prompt |
