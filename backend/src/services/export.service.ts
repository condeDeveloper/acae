import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  Packer,
  BorderStyle,
} from 'docx'

export interface DocxData {
  tipo: string
  professorNome: string
  turmaNome: string
  alunoNome: string
  periodo: string
  bnccCodigos: string
  conteudo: string
  geradoEm: string
  unidade?: string
  turno?: string
}

const TIPO_TITULOS: Record<string, string> = {
  portfolio_semanal: 'PORTFÓLIO DE ACOMPANHAMENTO PEDAGÓGICO',
  relatorio_individual: 'RELATÓRIO INDIVIDUAL CONSOLIDADO',
  atividade_adaptada: 'ATIVIDADE PEDAGÓGICA ADAPTADA',
  resumo_pedagogico: 'RESUMO PEDAGÓGICO DA TURMA',
}

const TURNO_LABELS: Record<string, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  integral: 'Integral',
}

/**
 * Parse a text line containing **bold** markers into a list of TextRun elements.
 * Odd-indexed segments (inside markers) become bold.
 */
function parseMarkdownLine(text: string, fontSize: number): TextRun[] {
  const parts = text.split(/\*\*(.*?)\*\*/)
  if (parts.length === 1) {
    return [new TextRun({ text: text || ' ', size: fontSize })]
  }
  return parts
    .map((part, i) => {
      // Skip empty normal-text segments (even indices), keep bold segments (odd indices)
      if (i % 2 === 0 && !part) return null
      return new TextRun({ text: part || ' ', bold: i % 2 === 1, size: fontSize })
    })
    .filter((r): r is TextRun => r !== null)
}

/** Convert a content line to a Paragraph, handling bullet points and bold markers. */
function contentLineToParagraph(linha: string): Paragraph {
  const trimmed = linha.trim()

  // Horizontal divider
  if (trimmed === '---' || trimmed === '___') {
    return new Paragraph({
      children: [],
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' } },
      spacing: { before: 160, after: 160 },
    })
  }

  // Bullet item: starts with "- " or "• "
  const bulletMatch = trimmed.match(/^[-•]\s+(.+)$/)
  if (bulletMatch) {
    return new Paragraph({
      children: [
        new TextRun({ text: '• ', size: 22 }),
        ...parseMarkdownLine(bulletMatch[1], 22),
      ],
      indent: { left: 360 },
      spacing: { after: 80 },
    })
  }

  // Numbered item: starts with "1. " etc.
  const numberedMatch = trimmed.match(/^(\d+\.)\s+(.+)$/)
  if (numberedMatch) {
    return new Paragraph({
      children: [
        new TextRun({ text: `${numberedMatch[1]} `, size: 22 }),
        ...parseMarkdownLine(numberedMatch[2], 22),
      ],
      indent: { left: 360 },
      spacing: { after: 80 },
    })
  }

  // Normal line (may contain **bold**)
  return new Paragraph({
    children: parseMarkdownLine(trimmed || ' ', 22),
    spacing: { after: 120 },
  })
}

export async function gerarDocx(dados: DocxData): Promise<Buffer> {
  const tituloDoc = TIPO_TITULOS[dados.tipo] ?? dados.tipo.toUpperCase()
  const turnoLabel = dados.turno ? (TURNO_LABELS[dados.turno] ?? dados.turno) : ''
  const paragrafosConteudo = dados.conteudo.split('\n').map(contentLineToParagraph)

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // ── Título principal ──────────────────────────────────────
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: tituloDoc, bold: true, size: 36, color: '1E3A5F' }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: '2026', bold: true, size: 28, color: '1E3A5F' }),
            ],
            spacing: { after: 20 },
            border: { bottom: { style: BorderStyle.THICK, size: 8, color: '1E3A5F' } },
          }),

          // ── IDENTIFICAÇÃO ─────────────────────────────────────────
          new Paragraph({
            children: [
              new TextRun({ text: 'IDENTIFICAÇÃO', bold: true, size: 24, color: '374151' }),
            ],
            spacing: { before: 240, after: 100 },
          }),

          // Data + Unidade
          new Paragraph({
            children: [
              new TextRun({ text: 'Data: ', bold: true, size: 22 }),
              new TextRun({ text: dados.periodo, size: 22 }),
              new TextRun({ text: '     Unidade: ', bold: true, size: 22 }),
              new TextRun({ text: dados.unidade || dados.turmaNome, size: 22 }),
            ],
            spacing: { after: 80 },
          }),

          // Turma + Período (turno) + Docente
          new Paragraph({
            children: [
              new TextRun({ text: 'Turma: ', bold: true, size: 22 }),
              new TextRun({ text: dados.turmaNome, size: 22 }),
              ...(turnoLabel
                ? [
                    new TextRun({ text: '     Período: ', bold: true, size: 22 }),
                    new TextRun({ text: turnoLabel, size: 22 }),
                  ]
                : []),
              new TextRun({ text: '     Docente: ', bold: true, size: 22 }),
              new TextRun({ text: dados.professorNome, size: 22 }),
            ],
            spacing: { after: 80 },
          }),

          // Aluno (apenas para documentos individuais)
          ...(dados.alunoNome
            ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Aluno: ', bold: true, size: 22 }),
                    new TextRun({ text: dados.alunoNome, size: 22 }),
                  ],
                  spacing: { after: 80 },
                }),
              ]
            : []),

          // Divisor
          new Paragraph({
            children: [],
            spacing: { after: 200 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: 'CCCCCC' } },
          }),

          // ── Conteúdo gerado pela IA ───────────────────────────────
          ...paragrafosConteudo,

          // ── Rodapé ───────────────────────────────────────────────
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `Gerado em: ${dados.geradoEm}  |  Portal ACAE`, size: 18, color: '6B7280' }),
            ],
            spacing: { before: 400 },
            border: {
              top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            },
          }),
        ],
      },
    ],
  })

  return Packer.toBuffer(doc)
}

/** Convert **bold** markdown to HTML <strong> tags and escape special chars. */
function markdownToHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}

export function buildHtml(dados: DocxData): string {
  const tituloDoc = TIPO_TITULOS[dados.tipo] ?? dados.tipo.toUpperCase()
  const turnoLabel = dados.turno ? (TURNO_LABELS[dados.turno] ?? dados.turno) : ''

  const conteudoHtml = dados.conteudo
    .split('\n')
    .map((l) => {
      const t = l.trim()
      if (t === '---' || t === '___') return '<hr style="border:none;border-top:1px solid #ddd;margin:8pt 0"/>'
      if (!t) return '<p>&nbsp;</p>'
      const bulletMatch = t.match(/^[-•]\s+(.+)$/)
      if (bulletMatch) return `<p style="padding-left:16pt">• ${markdownToHtml(bulletMatch[1])}</p>`
      return `<p>${markdownToHtml(t)}</p>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 12pt; margin: 0; padding: 20mm; color: #1C1917; }
  .titulo { text-align: center; color: #1E3A5F; font-size: 20pt; font-weight: bold; margin-bottom: 2pt; }
  .titulo-ano { text-align: center; color: #1E3A5F; font-size: 15pt; font-weight: bold;
    border-bottom: 3px solid #1E3A5F; padding-bottom: 8pt; margin-bottom: 14pt; }
  .identificacao-label { font-weight: bold; font-size: 11pt; color: #374151; border-bottom: none; margin-top: 12pt; }
  .identificacao { font-size: 11pt; margin: 4pt 0; }
  .divider { border: none; border-top: 1px solid #ccc; margin: 12pt 0; }
  .content p { line-height: 1.6; margin: 5pt 0; font-size: 11pt; }
  .footer { margin-top: 16pt; border-top: 1px solid #ccc; padding-top: 8pt; text-align: right; font-size: 9pt; color: #6B7280; }
</style>
</head>
<body>
<div class="titulo">${tituloDoc}</div>
<div class="titulo-ano">2026</div>
<div class="identificacao-label">IDENTIFICAÇÃO</div>
<p class="identificacao"><strong>Data:</strong> ${dados.periodo} &nbsp;&nbsp;&nbsp; <strong>Unidade:</strong> ${dados.unidade || dados.turmaNome}</p>
<p class="identificacao"><strong>Turma:</strong> ${dados.turmaNome}${turnoLabel ? ` &nbsp;&nbsp;&nbsp; <strong>Período:</strong> ${turnoLabel}` : ''} &nbsp;&nbsp;&nbsp; <strong>Docente:</strong> ${dados.professorNome}</p>
${dados.alunoNome ? `<p class="identificacao"><strong>Aluno:</strong> ${dados.alunoNome}</p>` : ''}
<hr class="divider">
<div class="content">${conteudoHtml}</div>
<div class="footer">Gerado em: ${dados.geradoEm} — Portal ACAE</div>
</body>
</html>`
}
