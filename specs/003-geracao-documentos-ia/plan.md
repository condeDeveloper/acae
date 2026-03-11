# Plano de Implementação: Geração de Documentos Pedagógicos com IA

**Feature**: 003-geracao-documentos-ia  
**Branch**: `003-geracao-documentos-ia`  
**Spec**: `specs/003-geracao-documentos-ia/spec.md`  
**Status**: Pronto para implementação

---

## Contexto técnico

| Aspecto | Decisão |
|---------|---------|
| Runtime | Node.js 22 LTS + Fastify 5 |
| IA | Google Gemini 2.0 Flash (`@google/genai`) — integrado via feature 006 |
| Banco | PostgreSQL + Prisma 6.x — schema definido em feature 007 |
| Exportação DOCX | `docxtemplater` + `pizzip` |
| Exportação PDF | `puppeteer` + `@sparticuz/chromium` (Railway) |
| Tokens de download | UUID efêmero em Map em memória, TTL 10 min, uso único |
| Geração | Síncrona com timeout 30 s (sem fila) |
| Pseudonimização | UUID gerado por-requisição, não persistido — nome real nunca enviado ao Gemini |
| Frontend | Vue 3 + PrimeVue v4 (feature 002) |

---

## Verificação da Constituição

| Princípio | Verificação | Status |
|-----------|-------------|--------|
| I — Privacidade LGPD | Nomes reais substituídos por UUID antes do prompt Gemini. Sem PII em logs. `bncc_refs` e `prompt_hash` são armazenados, não nomes. | ✅ PASSA |
| II — Dados reais na IA | `conteudo_gerado` só usa dados de `RegistroAluno` e `ContextoPedagogico` do banco — nunca texto livre do professor sem base em registro. | ✅ PASSA |
| III — Alinhamento BNCC | Validação pré-geração: ao menos 1 `bncc_ref` associada ao aluno/período. `VersaoDocumento` exige `bncc_refs` não-vazio. | ✅ PASSA |
| IV — Imutabilidade | `VersaoDocumento` é INSERT-ONLY. Rascunhos são editáveis; versões finalizadas não. | ✅ PASSA |
| V — Acessibilidade WCAG | Interfaces de revisão de documentos usam PrimeVue + tokens ACAE (feature 002). Botões de download acessíveis por teclado. | ✅ PASSA |

---

## Decisões de implementação

### D1 — Geração síncrona (sem fila)

**Decisão**: Sem BullMQ ou worker threads. Geração via `await gemini.generateContent(prompt)` com timeout de 30 s.

**Rationale**: Escala esperada é < 50 professores simultâneos. API Gemini é rápida (< 5 s para textos pedagógicos curtos). Complexidade de fila injustificável.

**Se virar problema**: Adicionar BullMQ + Redis no Railway. Os serviços já estão desacoplados (`document.service.ts` → `gemini.service.ts`) para facilitar essa mudança.

---

### D2 — Tokens efêmeros em memória (sem Redis)

**Decisão**: `Map<string, DownloadEntry>` em memória do processo Fastify. Sem banco de dados, sem Redis.

**Rationale**: Tokens expiram em 10 min. Railway reinicia containers com baixa frequência. Perda de tokens em reinicialização é tolerável (professor reexporta).

**Alternativa rejeitada**: Redis — overhead operacional desnecessário para o volume esperado.

---

### D3 — PDF gerado server-side com Puppeteer

**Decisão**: HTML renderizado pelo backend → Puppeteer gera PDF. O HTML replica o layout do template `.docx` com CSS.

**Rationale**: PDF gerado pelo servidor tem fidelidade garantida, independente do browser/SO do usuário. Frontend não precisa de biblioteca de PDF.

**Nota Railway**: Usar `@sparticuz/chromium` para evitar Dockerfile customizado. Adicionar `NODE_OPTIONS=--max-old-space-size=512` no Railway se necessário.

---

### D4 — Templates `.docx` são arquivos estáticos no repositório

**Decisão**: Templates em `backend/src/templates/*.docx`. Commitados no Git.

**Rationale**: Templates são criados pelo time pedagógico, raramente alterados. Sem necessidade de edição dinâmica de templates.

**Consequência**: Alteração de layout de template requer deploy. Aceitável para o estágio atual.

---

### D5 — Pseudonimização por UUID gerado-por-requisição

**Decisão**: `crypto.randomUUID()` gerado fresh em cada chamada a `buildPrompt()`. UUID não é armazenado.

**Rationale**: Se o UUID fosse armazenado e associado ao `aluno_id`, tornaria-se um dado de ligação — violaria Princípio I. UUID descartável impede re-identificação.

**Armazenado**: Apenas `prompt_hash = SHA-256(prompt)` para fins de auditoria de duplicatas. Não contém nem nome nem UUID.

---

### D6 — Endpoint de download sem JWT

**Decisão**: `GET /api/downloads/:token` não exige `Authorization` header.

**Rationale**: O download é acionado por `window.open(url, '_blank')` ou tag `<a href>` — browsers não enviam headers customizados nesses contextos. O token UUID é suficiente como autorizador (unguessable, uso único, TTL 10 min).

**Segurança**: Token de 128 bits (UUID v4) — probabilidade de força bruta negligenciável no TTL de 10 min.

---

## Estrutura de arquivos do projeto

```
backend/src/
  routes/
    documents.ts          # POST /generate, PATCH /:id, POST /:id/finalizar, GET /:id/export
    downloads.ts          # GET /api/downloads/:token (sem JWT)
  services/
    document.service.ts   # Orquestra: busca dados → pseudonimiza → chama Gemini → persiste
    export.service.ts     # docxtemplater (.docx) + html-builder para Puppeteer
    pdf.service.ts        # Puppeteer → Buffer PDF
    download-token.service.ts  # Map + TTL + consumo único
    prompt-builder.ts     # 4 funções buildPrompt* (já definidas em feature 006)
  templates/
    portfolio-semanal.docx
    relatorio-individual.docx
    atividade-adaptada.docx
    resumo-pedagogico.docx

frontend/src/
  pages/
    DocumentosPage.vue    # Listagem de documentos gerados por aluno
    GerarDocumentoPage.vue # Formulário → geração → revisão → exportação
  components/
    DocumentoRevisor.vue  # Editor de texto simples para revisão do conteúdo gerado
    BotaoExportar.vue     # Botão que chama /export e abre download_url
  composables/
    useDocumentoGerador.ts # Lógica de estado da geração (loading, erro, etapa atual)
```

---

## Dependências a instalar

```bash
# Backend
npm install docxtemplater pizzip puppeteer @sparticuz/chromium

# Frontend (nenhuma nova dependência — usa PrimeVue da feature 002)
```

---

## Artefatos gerados

| Artefato | Caminho |
|----------|---------|
| Research | `specs/003-geracao-documentos-ia/research.md` |
| Modelo de dados | `specs/003-geracao-documentos-ia/data-model.md` |
| Contratos API | `specs/003-geracao-documentos-ia/contracts/generate.md` |
| Quickstart | `specs/003-geracao-documentos-ia/quickstart.md` |
| Este plano | `specs/003-geracao-documentos-ia/plan.md` |
