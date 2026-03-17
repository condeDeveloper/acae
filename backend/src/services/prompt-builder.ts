import { randomUUID } from 'crypto'

// Pseudonymize replaces a student's real name with a disposable UUID.
// The UUID is never persisted — it's discarded after the request.
export function pseudonymize(): string {
  return randomUUID()
}

// Map of BNCC code -> full description fetched from DB
type BnccMap = Record<string, string>

function formatBnccList(codes: string[], bnccMap: BnccMap): string {
  if (codes.length === 0) return '(não especificado)'
  return codes.map(c => bnccMap[c] ? `- ${c} – ${bnccMap[c]}` : `- ${c}`).join('\n')
}

// ─────────────────────────────────────────────────────────────
// PORTFOLIO SEMANAL / MENSAL
// ─────────────────────────────────────────────────────────────

interface PortfolioRegistro {
  periodo: string       // DD/MM/YYYY
  atividades: string
  objetivos: string
  mediacoes: string     // mediação pedagógica por aluno/grupo (RegistroAluno.mediacoes)
  ocorrencias: string   // fatos fora da rotina / justificativas (RegistroAluno.ocorrencias)
  bncc_refs: string[]
}

interface PortfolioData {
  pseudo: string
  tipo: 'portfolio_semanal' | 'portfolio_mensal'
  registros: PortfolioRegistro[]
  bnccDescricoes: BnccMap
  metodologiaTurma?: string  // ContextoPedagogico.metodologia
  dinamicaGrupo?: string     // ContextoPedagogico.dinamica_grupo (grupos de suporte)
}

const DIAS_SEMANA: Record<number, string> = {
  0: 'Domingo', 1: 'Segunda-feira', 2: 'Terça-feira',
  3: 'Quarta-feira', 4: 'Quinta-feira', 5: 'Sexta-feira', 6: 'Sábado',
}

function getDiaSemana(periodoDD_MM_YYYY: string): string {
  const [d, m, y] = periodoDD_MM_YYYY.split('/')
  if (!y || !m || !d) return periodoDD_MM_YYYY
  return DIAS_SEMANA[new Date(`${y}-${m}-${d}`).getDay()] ?? periodoDD_MM_YYYY
}

function getISOWeekLabel(periodoDD_MM_YYYY: string): string {
  const [d, m, y] = periodoDD_MM_YYYY.split('/')
  if (!y || !m || !d) return periodoDD_MM_YYYY
  const date = new Date(`${y}-${m}-${d}`)
  const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay()
  const monday = new Date(date)
  monday.setDate(date.getDate() - (dayOfWeek - 1))
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)
  const fmt = (dt: Date) =>
    `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`
  return `${fmt(monday)} a ${fmt(friday)}/${y}`
}

function buildDiaBlock(r: PortfolioRegistro, bnccMap: BnccMap): string {
  const dia = getDiaSemana(r.periodo)
  const bnccFormatado = formatBnccList(r.bncc_refs, bnccMap)
  const mediacao = r.mediacoes || 'Orientação geral e supervisão conforme necessidades individuais.'
  return `**${dia}, ${r.periodo}**

**Competências BNCC:**
${bnccFormatado}

**Atividades:** ${r.atividades}

**Objetivos:** ${r.objetivos}

**Mediação:** ${mediacao}`
}

function buildOcorrenciasBlock(registros: PortfolioRegistro[]): string {
  const textos = registros.map(r => r.ocorrencias).filter(Boolean).join(' ')
  return textos || '-'
}

export function buildPromptPortfolio(dados: PortfolioData): string {
  const { registros, bnccDescricoes, metodologiaTurma, dinamicaGrupo, tipo } = dados

  const metodoSection = metodologiaTurma
    ? `\n**Metodologia da Turma:** ${metodologiaTurma}\n`
    : ''
  const dinamicaSection = dinamicaGrupo
    ? `\n**Dinâmica de Grupos (estratégias de mediação por perfil):** ${dinamicaGrupo}\n`
    : ''

  let corpoRegistros: string
  let instrucaoTipo: string

  if (tipo === 'portfolio_mensal') {
    // Group registros by ISO week (Mon-Fri label)
    const weeks = new Map<string, PortfolioRegistro[]>()
    for (const r of registros) {
      const wk = getISOWeekLabel(r.periodo)
      if (!weeks.has(wk)) weeks.set(wk, [])
      weeks.get(wk)!.push(r)
    }
    const semanaBlocks = Array.from(weeks.entries()).map(([semana, regs], i) => {
      const diasBlocks = regs.map(r => buildDiaBlock(r, bnccDescricoes)).join('\n\n')
      const ocorrencias = buildOcorrenciasBlock(regs)
      return `### SEMANA ${i + 1}: ${semana}\n\n${diasBlocks}\n\n**JUSTIFICATIVA / OCORRÊNCIAS DA SEMANA:**\n${ocorrencias}`
    }).join('\n\n---\n\n')
    corpoRegistros = semanaBlocks
    instrucaoTipo = 'Portfólio Mensal completo, com todas as semanas do período. Cada semana deve ter seus dias detalhados e a seção de justificativas ao final.'
  } else {
    // Portfolio semanal: lista os dias individualmente
    const diasBlocks = registros.map(r => buildDiaBlock(r, bnccDescricoes)).join('\n\n')
    const ocorrencias = buildOcorrenciasBlock(registros)
    corpoRegistros = `${diasBlocks}\n\n**JUSTIFICATIVA / OCORRÊNCIAS DA SEMANA:**\n${ocorrencias}`
    instrucaoTipo = 'Portfólio Semanal de uma única semana, com cada dia detalhado e seção de justificativas ao final.'
  }

  return `Você é um assistente pedagógico especializado em Educação Especial e Atendimento Educacional Especializado (AEE), alinhado à Base Nacional Comum Curricular (BNCC).

Gere o ${instrucaoTipo} para o aluno de referência "${dados.pseudo}". O portfólio deve:
- Narrar as atividades de forma descritiva, acolhedora e profissional, ampliando os dados fornecidos
- Para cada competência BNCC listada, explicar brevemente como a atividade a contemplou
- NÃO mencionar nenhum nome real — use "o aluno" ou "a criança"
- Reescrever a seção de MEDIAÇÃO de forma narrativa e pedagógica, respeitando os grupos de apoio e perfis descritos
- Manter EXATAMENTE o formato de seções (cabeçalhos em **negrito**)
- Incluir ao final a seção JUSTIFICATIVA / OCORRÊNCIAS com os eventos registrados
- Escrever em Português Brasileiro formal
${metodoSection}${dinamicaSection}
DADOS PEDAGÓGICOS (reescreva de forma narrativa e pedagógica):

${corpoRegistros}

---

**SÍNTESE DE DESENVOLVIMENTO (AVDs)**
[Escreva uma síntese do desenvolvimento observado no período: habilidades de comunicação, socialização, autonomia, coordenação motora e outras atividades de vida diária relevantes. Tom profissional e empático.]

Portfólio (mantenha os cabeçalhos e seções, reescrevendo o conteúdo de forma narrativa e pedagógica):`
}

// ─────────────────────────────────────────────────────────────
// RELATÓRIO INDIVIDUAL
// ─────────────────────────────────────────────────────────────

interface RelatorioData {
  pseudo: string
  periodoGeral?: string
  registros: Array<{
    periodo: string
    atividades: string
    objetivos: string
    mediacoes: string
    bncc_refs: string[]
  }>
  bnccDescricoes: BnccMap
  contexto?: string
}

export function buildPromptRelatorio(dados: RelatorioData): string {
  const registrosTexto = dados.registros.map((r) => {
    const bncc = formatBnccList(r.bncc_refs, dados.bnccDescricoes)
    return `Período: ${r.periodo}
BNCC:
${bncc}
Atividades: ${r.atividades}
Objetivos: ${r.objetivos}
Mediação: ${r.mediacoes}`
  }).join('\n\n---\n')

  return `Você é um assistente pedagógico especializado em Educação Especial e AEE, alinhado à BNCC.

Gere um Relatório Individual consolidado para o aluno "${dados.pseudo}"${dados.periodoGeral ? ` referente ao período ${dados.periodoGeral}` : ''}. O relatório deve:
- Sintetizar o desenvolvimento do aluno ao longo do período completo
- Identificar progressos significativos e áreas que requerem atenção contínua
- Para cada competência BNCC trabalhada, descrever como o aluno respondeu
- Incluir uma seção sobre habilidades de vida diária (AVDs): comunicação, socialização, autonomia e atividades cotidianas
- Descrever as estratégias de mediação utilizadas e sua efetividade
- Usar linguagem profissional adequada para portfólio pedagógico e comunicação com família
- NÃO usar nomes reais — use "o aluno" ou "a criança"
- Escrever em Português Brasileiro formal

${dados.contexto ? `Contexto pedagógico da turma: ${dados.contexto}\n\n` : ''}Registros do período:
${registrosTexto}

Relatório Individual:`
}

// ─────────────────────────────────────────────────────────────
// ATIVIDADE ADAPTADA
// ─────────────────────────────────────────────────────────────

interface AlunoAtividade {
  pseudo: string
  necessidades: string
  historicoRecente: string  // últimas atividades e objetivos trabalhados
}

interface AtividadeData {
  alunos: AlunoAtividade[]
  objetivo: string
  bncc_refs: string[]
  bnccDescricoes: BnccMap
}

export function buildPromptAtividade(dados: AtividadeData): string {
  const bnccFormatado = formatBnccList(dados.bncc_refs, dados.bnccDescricoes)
  const alunosTexto = dados.alunos.map((a, i) =>
    `**Aluno ${i + 1} (${a.pseudo}):**
- Necessidades educacionais: ${a.necessidades}
- Histórico pedagógico recente: ${a.historicoRecente}`
  ).join('\n\n')

  return `Você é um assistente pedagógico especializado em adaptação de atividades para Educação Especial e AEE.

Crie uma Atividade Adaptada para ${dados.alunos.length} aluno(s), respeitando as necessidades e histórico pedagógico de cada um.

**Competências BNCC a contemplar:**
${bnccFormatado}

**Objetivo da atividade:** ${dados.objetivo}

**Perfis dos alunos:**
${alunosTexto}

A atividade deve:
- Ter um enunciado geral comum a todos os alunos
- Para cada aluno (ou grupo com perfil semelhante), especificar as adaptações necessárias: materiais, nível de complexidade, forma de resposta e estratégia de mediação
- Considerar o histórico pedagógico recente para garantir progressão e evitar repetição
- Descrever a sequência didática passo a passo
- NÃO mencionar nomes reais
- Escrever em Português Brasileiro formal

Atividade Adaptada:`
}

// ─────────────────────────────────────────────────────────────
// RESUMO PEDAGÓGICO
// ─────────────────────────────────────────────────────────────

interface ResumoRegistroAgregado {
  pseudo: string
  atividades: string
  objetivos: string
  mediacoes: string
  bncc_refs: string[]
}

interface ResumoData {
  totalAlunos: number
  periodoInicio: string
  periodoFim: string
  registrosAgregados: ResumoRegistroAgregado[]
  bnccDescricoes: BnccMap
  bncc_refs: string[]   // todos os códigos únicos do período
  contexto?: string
}

export function buildPromptResumo(dados: ResumoData): string {
  // Agrupar registros por pseudo (cada pseudo = um aluno anonimizado)
  const pseudoMap = new Map<string, ResumoRegistroAgregado[]>()
  for (const r of dados.registrosAgregados) {
    if (!pseudoMap.has(r.pseudo)) pseudoMap.set(r.pseudo, [])
    pseudoMap.get(r.pseudo)!.push(r)
  }

  const resumoAlunos = Array.from(pseudoMap.entries()).map(([pseudo, regs]) => {
    const atividadesText = regs.map(r => r.atividades).filter(Boolean).join('; ')
    const mediacaoText = regs.map(r => r.mediacoes).filter(Boolean).join('; ')
    return `**${pseudo}:** ${atividadesText}${mediacaoText ? ` | Mediação: ${mediacaoText}` : ''}`
  }).join('\n')

  const bnccGeral = formatBnccList(dados.bncc_refs, dados.bnccDescricoes)

  return `Você é um assistente pedagógico especializado em documentação escolar para Educação Especial e AEE.

Gere um Resumo Pedagógico da turma referente ao período ${dados.periodoInicio} a ${dados.periodoFim}. O resumo deve:
- Apresentar uma visão narrativa do desenvolvimento coletivo da turma no período
- Descrever padrões observados: progressos coletivos, desafios comuns, estratégias de mediação utilizadas e sua efetividade
- NÃO identificar alunos individualmente — descreva padrões e tendências do grupo
- Relacionar explicitamente às competências BNCC trabalhadas no período
- Incluir observações sobre AVDs coletivas: comunicação, socialização, autonomia
- Ser adequado para apresentação à coordenação pedagógica
- Total de alunos: ${dados.totalAlunos}
- Escrever em Português Brasileiro formal

${dados.contexto ? `Contexto pedagógico da turma: ${dados.contexto}\n\n` : ''}**Competências BNCC trabalhadas no período:**
${bnccGeral}

**Registros individuais anonimizados do período:**
${resumoAlunos}

Resumo Pedagógico:`
}
