// Gera o HTML do relatório Vineland-3 para conversão em PDF via Puppeteer

interface AvaliacaoVinelandComAluno {
  id: string
  avaliador: string
  data_teste: Date
  com_bruta: number
  com_padrao: number
  com_nivel: string
  com_ic: string | null
  com_percentil: string | null
  avd_bruta: number
  avd_padrao: number
  avd_nivel: string
  avd_ic: string | null
  avd_percentil: string | null
  soc_bruta: number
  soc_padrao: number
  soc_nivel: string | null
  soc_ic: string | null
  soc_percentil: string | null
  soma_padroes: number
  cca_composto: number
  cca_ic: string | null
  cca_percentil: string | null
  aluno: {
    id: string
    nome: string
    data_nascimento: Date | null
    turma: { id: string; nome: string }
  }
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

function calcularIdade(nascimento: Date | null, teste: Date): string {
  if (!nascimento) return '—'
  const n = new Date(nascimento)
  const t = new Date(teste)
  let anos = t.getFullYear() - n.getFullYear()
  let meses = t.getMonth() - n.getMonth()
  if (meses < 0) { anos--; meses += 12 }
  return `${anos} anos e ${meses} meses`
}

// Gera uma barra SVG para o gráfico
function barSvg(bruta: number, padrao: number, dominio: string, maxVal = 130): string {
  const W = 380
  const H = 54
  const barH = 16
  const labelW = 0
  const chartW = W - labelW

  const bW = Math.round((bruta / maxVal) * chartW)
  const pW = Math.round((padrao / maxVal) * chartW)

  return `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="display:block;">
    <text x="0" y="13" font-size="11" font-family="Arial,sans-serif" fill="#333" font-weight="bold">${dominio}</text>
    <!-- Pontuação Bruta -->
    <rect x="${labelW}" y="18" width="${bW}" height="${barH}" fill="#5b85c8" rx="3"/>
    <text x="${labelW + bW + 4}" y="30" font-size="10" font-family="Arial,sans-serif" fill="#5b85c8">${bruta}</text>
    <!-- Pontuação Padrão -->
    <rect x="${labelW}" y="37" width="${pW}" height="${barH}" fill="#e07b39" rx="3"/>
    <text x="${labelW + pW + 4}" y="49" font-size="10" font-family="Arial,sans-serif" fill="#e07b39">${padrao}</text>
  </svg>`
}

export function gerarHtmlVineland(av: AvaliacaoVinelandComAluno): string {
  const idadeStr = calcularIdade(av.aluno.data_nascimento, av.data_teste)
  const dataTesteStr = formatDate(av.data_teste)
  const dataNascStr = av.aluno.data_nascimento ? formatDate(av.aluno.data_nascimento) : '—'

  const maxVal = Math.max(av.com_bruta, av.com_padrao, av.avd_bruta, av.avd_padrao, av.soc_bruta, av.soc_padrao, 80)

  const nivelLabel = (n: string | null) => n ?? '—'
  const icLabel = (ic: string | null) => ic ?? '—'
  const pctLabel = (p: string | null) => p ?? '—'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', Arial, sans-serif;
    font-size: 11pt;
    color: #222;
    background: #fff;
    padding: 24px 32px;
  }
  h1 {
    font-size: 15pt;
    font-weight: 700;
    color: #2a4e8f;
    border-bottom: 2px solid #2a4e8f;
    padding-bottom: 6px;
    margin-bottom: 16px;
    letter-spacing: -0.02em;
  }
  h2 {
    font-size: 11pt;
    font-weight: 700;
    color: #2a4e8f;
    margin: 20px 0 8px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .header-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 32px;
    margin-bottom: 18px;
    background: #f4f7fc;
    border: 1px solid #d0daea;
    border-radius: 6px;
    padding: 12px 16px;
  }
  .header-grid .field { display: flex; gap: 8px; align-items: baseline; }
  .header-grid .label { font-size: 9pt; color: #666; min-width: 110px; }
  .header-grid .value { font-size: 10pt; font-weight: 600; color: #1a1a2e; }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10pt;
    margin-bottom: 8px;
  }
  thead tr { background: #2a4e8f; color: #fff; }
  thead th { padding: 7px 10px; text-align: left; font-weight: 600; font-size: 9.5pt; }
  tbody tr:nth-child(even) { background: #f4f7fc; }
  tbody td { padding: 6px 10px; border-bottom: 1px solid #e0e8f0; }
  .total-row { background: #dbe8f7 !important; font-weight: 700; }
  .composto-row { background: #2a4e8f !important; color: #fff !important; font-weight: 700; }
  .composto-row td { color: #fff; }
  .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
  .chart-box {
    background: #f9fbff;
    border: 1px solid #d0daea;
    border-radius: 6px;
    padding: 14px 16px;
  }
  .chart-box h3 { font-size: 10pt; font-weight: 700; color: #2a4e8f; margin-bottom: 10px; }
  .legend { display: flex; gap: 16px; margin-bottom: 8px; font-size: 9pt; }
  .legend-dot { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 4px; vertical-align: middle; }
  .footer {
    margin-top: 28px;
    border-top: 1px solid #ccc;
    padding-top: 10px;
    font-size: 8.5pt;
    color: #888;
  }
  .nivel-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 9pt;
    font-weight: 600;
  }
  .nivel-baixo { background: #fee2e2; color: #b91c1c; }
  .nivel-medio { background: #fef9c3; color: #92400e; }
  .nivel-adequado { background: #dcfce7; color: #166534; }
  .nivel-alto { background: #dbeafe; color: #1e40af; }
</style>
</head>
<body>

<h1>VINELAND-3 — Escala de Comportamento Adaptativo</h1>

<div class="header-grid">
  <div class="field"><span class="label">Nome:</span><span class="value">${av.aluno.nome}</span></div>
  <div class="field"><span class="label">Turma:</span><span class="value">${av.aluno.turma.nome}</span></div>
  <div class="field"><span class="label">Data de nascimento:</span><span class="value">${dataNascStr}</span></div>
  <div class="field"><span class="label">Data do teste:</span><span class="value">${dataTesteStr}</span></div>
  <div class="field"><span class="label">Idade cronológica:</span><span class="value">${idadeStr}</span></div>
  <div class="field"><span class="label">Avaliador(a):</span><span class="value">${av.avaliador}</span></div>
</div>

<h2>Resumo da Pontuação</h2>

<table>
  <thead>
    <tr>
      <th>Domínio</th>
      <th>Pont. Bruta</th>
      <th>Pont. Padrão</th>
      <th>Nível Adaptativo</th>
      <th>IC (90%)</th>
      <th>Percentil</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Comunicação (COM)</strong></td>
      <td>${av.com_bruta}</td>
      <td>${av.com_padrao}</td>
      <td><span class="nivel-badge ${nivelClass(av.com_nivel)}">${nivelLabel(av.com_nivel)}</span></td>
      <td>${icLabel(av.com_ic)}</td>
      <td>${pctLabel(av.com_percentil)}</td>
    </tr>
    <tr>
      <td><strong>Atividades de Vida Diária (AVD)</strong></td>
      <td>${av.avd_bruta}</td>
      <td>${av.avd_padrao}</td>
      <td><span class="nivel-badge ${nivelClass(av.avd_nivel)}">${nivelLabel(av.avd_nivel)}</span></td>
      <td>${icLabel(av.avd_ic)}</td>
      <td>${pctLabel(av.avd_percentil)}</td>
    </tr>
    <tr>
      <td><strong>Socialização (SOC)</strong></td>
      <td>${av.soc_bruta}</td>
      <td>${av.soc_padrao}</td>
      <td><span class="nivel-badge ${nivelClass(av.soc_nivel ?? '')}">${nivelLabel(av.soc_nivel)}</span></td>
      <td>${icLabel(av.soc_ic)}</td>
      <td>${pctLabel(av.soc_percentil)}</td>
    </tr>
    <tr class="total-row">
      <td>Soma das Pontuações Padrão</td>
      <td colspan="2">${av.soma_padroes}</td>
      <td colspan="3"></td>
    </tr>
    <tr class="composto-row">
      <td>Composto de Comportamento Adaptativo (CCA)</td>
      <td></td>
      <td>${av.cca_composto}</td>
      <td></td>
      <td>${icLabel(av.cca_ic)}</td>
      <td>${pctLabel(av.cca_percentil)}</td>
    </tr>
  </tbody>
</table>

<div class="charts">
  <div class="chart-box">
    <h3>Desempenho por Domínio — Barras Verticais</h3>
    <div class="legend">
      <span><span class="legend-dot" style="background:#5b85c8"></span>Pontuação Bruta</span>
      <span><span class="legend-dot" style="background:#e07b39"></span>Pontuação Padrão</span>
    </div>
    ${barSvg(av.com_bruta, av.com_padrao, 'Comunicação', maxVal)}
    ${barSvg(av.avd_bruta, av.avd_padrao, 'Vida Diária', maxVal)}
    ${barSvg(av.soc_bruta, av.soc_padrao, 'Socialização', maxVal)}
  </div>

  <div class="chart-box">
    <h3>Composto de Comportamento Adaptativo</h3>
    <div style="margin-top: 10px;">
      ${horizontalBar(av.com_bruta, av.com_padrao, 'Comunicação', maxVal)}
      ${horizontalBar(av.avd_bruta, av.avd_padrao, 'Vida Diária', maxVal)}
      ${horizontalBar(av.soc_bruta, av.soc_padrao, 'Socialização', maxVal)}
    </div>
    <div style="margin-top:16px; background:#2a4e8f; color:#fff; padding:8px 12px; border-radius:6px; font-size:10pt; font-weight:700;">
      CCA Composto: ${av.cca_composto}
      ${av.cca_ic ? `&nbsp;|&nbsp; IC: ${av.cca_ic}` : ''}
      ${av.cca_percentil ? `&nbsp;|&nbsp; Percentil: ${av.cca_percentil}` : ''}
    </div>
  </div>
</div>

<div class="footer">
  Gerado pelo sistema ACAE &nbsp;•&nbsp; Avaliação registrada em ${dataTesteStr} &nbsp;•&nbsp; Instrumento: Vineland-3 — Escala de Comportamento Adaptativo de Vineland, 3ª edição
</div>

</body>
</html>`
}

function nivelClass(nivel: string): string {
  const n = nivel.toLowerCase()
  if (n.includes('baixo')) return 'nivel-baixo'
  if (n.includes('médio') || n.includes('medio') || n.includes('moderado')) return 'nivel-medio'
  if (n.includes('adequado') || n.includes('médio alto') || n.includes('alto') && !n.includes('baixo')) return 'nivel-adequado'
  if (n.includes('elevado') || n.includes('superior')) return 'nivel-alto'
  return ''
}

function horizontalBar(bruta: number, padrao: number, label: string, maxVal: number): string {
  const W = 330
  const labelW = 90
  const chartW = W - labelW - 10
  const bW = Math.round((bruta / maxVal) * chartW)
  const pW = Math.round((padrao / maxVal) * chartW)

  return `
  <svg width="${W}" height="46" viewBox="0 0 ${W} 46" xmlns="http://www.w3.org/2000/svg" style="display:block; margin-bottom:4px;">
    <text x="0" y="14" font-size="9.5" font-family="Arial,sans-serif" fill="#333" font-weight="bold">${label}</text>
    <rect x="${labelW}" y="0" width="${bW}" height="14" fill="#5b85c8" rx="2"/>
    <text x="${labelW + bW + 3}" y="11" font-size="9" font-family="Arial,sans-serif" fill="#5b85c8">${bruta}</text>
    <rect x="${labelW}" y="17" width="${pW}" height="14" fill="#e07b39" rx="2"/>
    <text x="${labelW + pW + 3}" y="28" font-size="9" font-family="Arial,sans-serif" fill="#e07b39">${padrao}</text>
  </svg>`
}
