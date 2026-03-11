# Quickstart: Geração de Documentos Pedagógicos com IA

**Pré-requisito**: feature 006 (Gemini) e feature 007 (Banco) completas e funcionando.

---

## 1. Instalar dependências de exportação

```bash
# No diretório backend/
npm install docxtemplater pizzip

# Puppeteer (geração de PDF)
npm install puppeteer

# Para Railway (Chromium headless sem instalar browser localmente no build)
npm install @sparticuz/chromium
```

---

## 2. Criar templates `.docx`

Criar os arquivos de template em `backend/src/templates/`:

```
backend/src/templates/
  portfolio-semanal.docx
  relatorio-individual.docx
  atividade-adaptada.docx
  resumo-pedagogico.docx
```

Cada template é um arquivo Word normal. Os marcadores seguem a sintaxe `{variavel}`.

**Exemplo (`portfolio-semanal.docx`)**:
```
[Logo ACAE]

PORTFÓLIO SEMANAL

Professor: {professor_nome}
Turma: {turma_nome}
Aluno: {aluno_nome}
Período: {periodo}
Competências BNCC: {bncc_codigos}

─────────────────────────────────────────

{conteudo}

─────────────────────────────────────────
Gerado em: {gerado_em}     Portal ACAE
```

> **IMPORTANTE**: Os marcadores devem estar em runs de texto simples no Word. Não formatar apenas parte de um marcador (negrito, cor) — o marcador deve estar num único run para o `docxtemplater` reconhecer.

---

## 3. Serviço de exportação (`.docx`)

**`backend/src/services/export.service.ts`**:

```typescript
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import { readFileSync } from 'fs'
import { join } from 'path'

const TEMPLATES_DIR = join(__dirname, '../templates')

export function gerarDocx(
  tipo: string,
  dados: Record<string, string>
): Buffer {
  const templatePath = join(TEMPLATES_DIR, `${tipo}.docx`)
  const templateBuf = readFileSync(templatePath)

  const zip = new PizZip(templateBuf)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  })

  doc.setData(dados)

  try {
    doc.render()
  } catch (err: any) {
    // Lança erro se marcador não encontrado no template
    throw new Error(`Erro ao renderizar template ${tipo}: ${err.message}`)
  }

  return doc.getZip().generate({ type: 'nodebuffer' })
}
```

---

## 4. Serviço de exportação (PDF via Puppeteer)

**`backend/src/services/pdf.service.ts`**:

```typescript
import puppeteer from 'puppeteer'

// Para Railway — usa chromium pré-instalado no layer
async function getBrowser() {
  if (process.env.NODE_ENV === 'production') {
    const chromium = await import('@sparticuz/chromium')
    return puppeteer.launch({
      executablePath: await chromium.default.executablePath(),
      args: chromium.default.args,
      headless: true,
    })
  }
  return puppeteer.launch({ headless: true })
}

export async function gerarPdf(html: string): Promise<Buffer> {
  const browser = await getBrowser()
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
      printBackground: true,
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
```

> **Railway**: adicionar `puppeteer` ao `Dockerfile` com `apt-get install -y chromium` OU usar `@sparticuz/chromium` (recomendado — sem Dockerfile customizado).

---

## 5. Serviço de tokens de download

**`backend/src/services/download-token.service.ts`**:

```typescript
import { randomUUID } from 'crypto'

interface DownloadEntry {
  buffer: Buffer
  filename: string
  mimeType: string
  expiresAt: number  // Date.now() + 10 minutos em ms
}

const tokens = new Map<string, DownloadEntry>()

// Limpeza periódica a cada minuto
setInterval(() => {
  const now = Date.now()
  for (const [token, entry] of tokens) {
    if (entry.expiresAt < now) tokens.delete(token)
  }
}, 60_000)

export function criarToken(entry: Omit<DownloadEntry, 'expiresAt'>): string {
  const token = randomUUID()
  tokens.set(token, { ...entry, expiresAt: Date.now() + 10 * 60 * 1000 })
  return token
}

export function consumirToken(token: string): DownloadEntry | null {
  const entry = tokens.get(token)
  if (!entry) return null
  if (entry.expiresAt < Date.now()) {
    tokens.delete(token)
    return null
  }
  tokens.delete(token)  // consumo único
  return entry
}
```

---

## 6. Endpoint de download no Fastify

**`backend/src/routes/downloads.ts`**:

```typescript
import { FastifyPluginAsync } from 'fastify'
import { consumirToken } from '../services/download-token.service'

const downloadsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: { token: string } }>(
    '/api/downloads/:token',
    async (request, reply) => {
      const entry = consumirToken(request.params.token)

      if (!entry) {
        return reply.code(404).send({ error: 'Token inválido ou expirado' })
      }

      reply.header('Content-Type', entry.mimeType)
      reply.header(
        'Content-Disposition',
        `attachment; filename="${entry.filename}"`
      )
      return reply.send(entry.buffer)
    }
  )
}

export default downloadsRoutes
```

Registrar em `backend/src/app.ts`:
```typescript
fastify.register(downloadsRoutes)
```

---

## 7. Fluxo completo de geração + exportação

Sequência de chamadas no frontend:

```typescript
// 1. Gerar documento
const { rascunho_id, conteudo_gerado } = await api.post('/api/documents/generate', {
  tipo: 'portfolio_semanal',
  turma_id,
  aluno_id,
  periodo: { inicio: '2025-09-01', fim: '2025-09-07' },
})

// 2. (Opcional) Professor edita → PATCH /api/documents/rascunhos/:id

// 3. Finalizar
await api.post(`/api/documents/rascunhos/${rascunho_id}/finalizar`, {
  conteudo_final: conteudoEditado,
})

// 4. Solicitar exportação PDF
const { download_url } = await api.get(
  `/api/documents/rascunhos/${rascunho_id}/export?formato=pdf`
)

// 5. Baixar (abre em nova aba — sem JWT no header)
window.open(download_url, '_blank')
```

---

## 8. Variáveis de ambiente adicionais

Nenhuma nova variável de ambiente é necessária além das já definidas em features 006 e 007.

O `GEMINI_API_KEY` já cobre a geração de texto. A exportação é local (sem serviços externos).
