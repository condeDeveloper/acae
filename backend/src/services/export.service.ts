import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
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
}

const TIPO_LABELS: Record<string, string> = {
  portfolio_semanal: 'PORTFÓLIO SEMANAL',
  relatorio_individual: 'RELATÓRIO INDIVIDUAL',
  atividade_adaptada: 'ATIVIDADE ADAPTADA',
  resumo_pedagogico: 'RESUMO PEDAGÓGICO',
}

export async function gerarDocx(dados: DocxData): Promise<Buffer> {
  const tituloDoc = TIPO_LABELS[dados.tipo] ?? dados.tipo.toUpperCase()

  const paragrafosConteudo = dados.conteudo
    .split('\n')
    .map(
      (linha) =>
        new Paragraph({
          children: [new TextRun({ text: linha || ' ', size: 24 })],
          spacing: { after: 160 },
        }),
    )

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'Portal do Professor — ACAE',
                bold: true,
                color: '7C3AED',
                size: 32,
              }),
            ],
            spacing: { after: 200 },
          }),

          // Document type
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: tituloDoc, bold: true, size: 28 })],
            spacing: { after: 400 },
          }),

          // Metadata
          new Paragraph({
            children: [
              new TextRun({ text: 'Professor: ', bold: true, size: 22 }),
              new TextRun({ text: dados.professorNome, size: 22 }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Turma: ', bold: true, size: 22 }),
              new TextRun({ text: dados.turmaNome, size: 22 }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Aluno: ', bold: true, size: 22 }),
              new TextRun({ text: dados.alunoNome, size: 22 }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Período: ', bold: true, size: 22 }),
              new TextRun({ text: dados.periodo, size: 22 }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Competências BNCC: ', bold: true, size: 22 }),
              new TextRun({ text: dados.bnccCodigos, size: 22 }),
            ],
            spacing: { after: 400 },
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            },
          }),

          // Content
          ...paragrafosConteudo,

          // Footer
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `Gerado em: ${dados.geradoEm}     Portal ACAE`, size: 18, color: '6B7280' }),
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

export function buildHtml(dados: DocxData): string {
  const tituloDoc = TIPO_LABELS[dados.tipo] ?? dados.tipo.toUpperCase()
  const conteudoHtml = dados.conteudo
    .split('\n')
    .map((l) => `<p>${l || '&nbsp;'}</p>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 12pt; margin: 0; padding: 20mm; color: #1C1917; }
  .header { text-align: center; margin-bottom: 16pt; }
  .title { color: #7C3AED; font-size: 18pt; font-weight: bold; }
  .doc-type { font-size: 14pt; font-weight: bold; margin-top: 8pt; }
  .meta { margin: 16pt 0; border-bottom: 1px solid #ccc; padding-bottom: 12pt; }
  .meta p { margin: 4pt 0; font-size: 11pt; }
  .meta strong { min-width: 140pt; display: inline-block; }
  .content p { line-height: 1.6; margin: 6pt 0; }
  .footer { margin-top: 16pt; border-top: 1px solid #ccc; padding-top: 8pt; text-align: right; font-size: 9pt; color: #6B7280; }
</style>
</head>
<body>
<div class="header">
  <div class="title">Portal do Professor — ACAE</div>
  <div class="doc-type">${tituloDoc}</div>
</div>
<div class="meta">
  <p><strong>Professor:</strong> ${dados.professorNome}</p>
  <p><strong>Turma:</strong> ${dados.turmaNome}</p>
  <p><strong>Aluno:</strong> ${dados.alunoNome}</p>
  <p><strong>Período:</strong> ${dados.periodo}</p>
  <p><strong>Competências BNCC:</strong> ${dados.bnccCodigos}</p>
</div>
<div class="content">${conteudoHtml}</div>
<div class="footer">Gerado em: ${dados.geradoEm} — Portal ACAE</div>
</body>
</html>`
}
