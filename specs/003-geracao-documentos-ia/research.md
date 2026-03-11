# Research: Geração de Documentos Pedagógicos com IA

**Branch**: `003-geracao-documentos-ia` | **Data**: 2026-03-10

---

## Incerteza 1 — Exportação .docx com docxtemplater

### Decisão

**`docxtemplater`** com **`pizzip`** para geração de arquivos `.docx` no servidor (Node.js). Usar templates `.docx` com marcadores `{variable}` para cada seção do documento.

```bash
npm install docxtemplater pizzip
```

### Padrão de uso (servidor Fastify)

```typescript
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import fs from 'fs'
import path from 'path'

function generateDocx(templateName: string, data: Record<string, string>): Buffer {
  const templatePath = path.join(__dirname, '../templates', `${templateName}.docx`)
  const content = fs.readFileSync(templatePath, 'binary')
  const zip = new PizZip(content)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  })
  doc.setData(data)
  doc.render()
  return doc.getZip().generate({ type: 'nodebuffer' }) as Buffer
}
```

Templates ficam em `backend/src/templates/`:
- `portfolio-semanal.docx`
- `relatorio-individual.docx`
- `atividade-adaptada.docx`
- `resumo-pedagogico.docx`

---

## Incerteza 2 — Exportação PDF com Puppeteer

### Decisão

**`puppeteer`** (headless Chromium) para renderizar HTML e gerar PDF no servidor. O HTML é montado com os dados do documento + estilos inline para garantir fidelidade visual.

```bash
npm install puppeteer
```

```typescript
import puppeteer from 'puppeteer'

async function generatePdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })
  const pdf = await page.pdf({
    format: 'A4',
    margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
    printBackground: true,
  })
  await browser.close()
  return Buffer.from(pdf)
}
```

**Considerações Railway**: Puppeteer no Railway requer adicionar `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` e usar `puppeteer-core` + `@sparticuz/chromium` para ambiente de produção. Configurar no Dockerfile Railway.

---

## Incerteza 3 — URLs de download assinadas (RF-032, Princípio IV)

### Decisão

Gerar arquivos no servidor → armazenar temporariamente no sistema de arquivos ou em memória → servir com **token de download efêmero** (UUID) com expiração.

**Abordagem**: Armazenar em `Map` em memória com TTL de 10 minutos (suficiente para download). Não persistir em banco — os arquivos são descartáveis.

```typescript
// backend/src/services/download-token.service.ts
interface DownloadToken {
  buffer: Buffer
  filename: string
  mimeType: string
  expiresAt: number
}

const tokens = new Map<string, DownloadToken>()

export function createDownloadToken(buffer: Buffer, filename: string, mimeType: string): string {
  const token = crypto.randomUUID()
  tokens.set(token, {
    buffer,
    filename,
    mimeType,
    expiresAt: Date.now() + 10 * 60 * 1000,  // 10 minutos
  })
  // Limpeza automática
  setTimeout(() => tokens.delete(token), 10 * 60 * 1000)
  return token
}

export function consumeDownloadToken(token: string): DownloadToken | null {
  const entry = tokens.get(token)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    tokens.delete(token)
    return null
  }
  tokens.delete(token)  // consume uma vez
  return entry
}
```

O endpoint de download:
```
GET /api/downloads/:token
```
Retorna o arquivo com `Content-Disposition: attachment`. Não requer JWT (o token já é o mecanismo de autorização efêmero).

---

## Incerteza 4 — Construção de prompts pedagógicos (vs. feature 006)

### Decisão

A lógica de construção de prompt está em `backend/src/services/prompt-builder.ts` (definida na feature 006). Esta feature adiciona os 4 tipos de documento, cada um com sua função `buildPrompt`:

```typescript
// Já existente em 006:
export function buildPortfolioSemanalPrompt(data: PortfolioInput): string
export function buildRelatorioIndividualPrompt(data: RelatorioInput): string
export function buildAtividadeAdaptadaPrompt(data: AtividadeInput): string
export function buildResumoPedagogicoPrompt(data: ResumoInput): string
```

Cada função recebe dados do banco (com nome do aluno já substituído por pseudônimo UUID) e retorna o prompt em português para o Gemini.

---

## Incerteza 5 — Geração assíncrona para documentos grandes

### Decisão

Para esta versão, **geração síncrona com timeout de 30 segundos** (igual ao definido em feature 006). O Gemini 2.0 Flash responde tipicamente em 2–5 segundos para documentos de tamanho normal. Geração assíncrona com fila (BullMQ/Redis) não é necessária no volume esperado (~500 alunos, gerações não simultâneas em horário escolar).

Se o tempo exceder 30s → retorna 408 com mensagem amigável e orientação para tentar novamente.

---

## Decisões consolidadas

| Tópico | Decisão | Pacote |
|--------|---------|--------|
| Exportar .docx | `docxtemplater` + `pizzip` | `docxtemplater`, `pizzip` |
| Exportar PDF | `puppeteer` (headless Chromium) | `puppeteer` / `puppeteer-core` |
| URLs de download | Tokens UUID efêmeros em memória (TTL 10min) | nativo `crypto.randomUUID()` |
| Templates .docx | Arquivos em `backend/src/templates/` com marcadores `{var}` | gerado uma vez |
| Geração | Síncrona, 30s timeout (igual feature 006) | — |
| Pseudonimização | UUID gerado por request, substituído antes do prompt | nativo |
