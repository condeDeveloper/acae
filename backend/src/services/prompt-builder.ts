import { randomUUID } from 'crypto'

// Pseudonymize replaces a student's real name with a disposable UUID.
// The UUID is never persisted — it's discarded after the request.
export function pseudonymize(): string {
  return randomUUID()
}

interface PortfolioData {
  pseudo: string
  registros: Array<{
    periodo: string
    atividades: string
    objetivos: string
    medicoes: string
    ocorrencias: string
    bncc_refs: string[]
  }>
  contexto?: string
}

export function buildPromptPortfolio(dados: PortfolioData): string {
  const diasSemana: Record<string, string> = {
    '0': 'Domingo',
    '1': 'Segunda-feira',
    '2': 'Terça-feira',
    '3': 'Quarta-feira',
    '4': 'Quinta-feira',
    '5': 'Sexta-feira',
    '6': 'Sábado',
  }

  const registrosTexto = dados.registros.map((r) => {
    // r.periodo is already in DD/MM/YYYY format (converted by toBR in document.service.ts)
    const [d, m, y] = r.periodo.split('/')
    const diaSemana = y && m && d
      ? diasSemana[String(new Date(`${y}-${m}-${d}`).getDay())] ?? r.periodo
      : r.periodo

    return `**${diaSemana}, ${r.periodo}**

**1. IDENTIFICAÇÃO E OBJETIVOS (BNCC)**
${r.bncc_refs.join(' | ')}
Atividades: ${r.atividades}
Objetivos: ${r.objetivos}

**2. METODOLOGIA:**
${r.medicoes}

**3. REGISTRO DAS ATIVIDADES:**
Foco e mediação: ${r.ocorrencias || 'Não registrado'}`
  }).join('\n\n---\n\n')

  return `Você é um assistente pedagógico especializado em Educação Infantil e Anos Iniciais do Ensino Fundamental, alinhado à Base Nacional Comum Curricular (BNCC).

Gere o conteúdo do Portfólio Semanal para o aluno de referência "${dados.pseudo}" com base nos registros abaixo. O portfólio deve:
- Narrar as atividades de forma descritiva, acolhedora e profissional, ampliando os dados brutos fornecidos
- Relacionar cada atividade às competências BNCC mencionadas
- NÃO mencionar nenhum nome real — use "o aluno" ou "a criança"
- Manter EXATAMENTE o formato de seções abaixo, com as marcações **negrito** nos títulos
- Escrever em Português Brasileiro formal

${dados.contexto ? `Contexto pedagógico da turma: ${dados.contexto}\n\n` : ''}FORMATO ESPERADO PARA CADA DIA (já preenchido com os dados brutos — reescreva de forma narrativa e pedagógica):

${registrosTexto}

---

**ANÁLISE DE DESENVOLVIMENTO E AVDs**
[Escreva aqui uma síntese semanal do desenvolvimento do aluno observado nos registros acima. Mencione progressos em coordenação motora, socialização, atenção, autonomia e outras AVDs relevantes. Tom profissional e empático.]

Portfólio Semanal (mantenha os cabeçalhos dos dias e seções, reescrevendo o conteúdo de forma narrativa):`
}

interface RelatorioData {
  pseudo: string
  periodoGeral?: string
  registros: Array<{
    periodo: string
    atividades: string
    objetivos: string
    medicoes: string
    bncc_refs: string[]
  }>
  contexto?: string
}

export function buildPromptRelatorio(dados: RelatorioData): string {
  const registrosTexto = dados.registros.map((r) =>
    `Período: ${r.periodo} | BNCC: ${r.bncc_refs.join(', ')}
${r.atividades} — ${r.objetivos} — ${r.medicoes}`,
  ).join('\n')

  return `Você é um assistente pedagógico especializado em BNCC.

Gere um Relatório Individual consolidado para o aluno "${dados.pseudo}" com base em múltiplos períodos de registros. O relatório deve:
- Sintetizar o desenvolvimento do aluno ao longo do período completo
- Identificar progressos significativos e áreas de atenção
- Relacionar explicitamente às competências BNCC trabalhadas
- Usar linguagem profissional adequada para portfólio pedagógico
- NÃO usar nomes reais — use "o aluno" ou "a criança"
- Escrever em Português Brasileiro formal${dados.periodoGeral ? `
- O período de avaliação a ser mencionado no relatório é: ${dados.periodoGeral}` : ''}

${dados.contexto ? `Contexto: ${dados.contexto}\n\n` : ''}Registros consolidados:
${registrosTexto}

Relatório Individual:`
}

interface AtividadeData {
  alunos: Array<{ pseudo: string; contexto: string }>
  objetivo: string
  bncc_refs: string[]
}

export function buildPromptAtividade(dados: AtividadeData): string {
  const alunosTexto = dados.alunos.map((a, i) =>
    `Aluno ${i + 1} (${a.pseudo}): ${a.contexto}`,
  ).join('\n')

  return `Você é um assistente pedagógico especializado em adaptação de atividades.

Crie uma Atividade Adaptada para ${dados.alunos.length} aluno(s) considerando seus contextos individuais. A atividade deve:
- Ter objetivo claro alinhado às competências BNCC: ${dados.bncc_refs.join(', ')}
- Objetivo proposto: ${dados.objetivo}
- Incluir adaptações específicas para cada perfil de aluno
- Ser prática e aplicável em sala de aula
- Usar linguagem profissional
- NÃO mencionar nomes reais

Perfis dos alunos:
${alunosTexto}

Atividade Adaptada:`
}

interface ResumoData {
  totalAlunos: number
  periodoInicio: string
  periodoFim: string
  agregado: string
  bncc_refs: string[]
  contexto?: string
}

export function buildPromptResumo(dados: ResumoData): string {
  return `Você é um assistente pedagógico especializado em documentação escolar.

Gere um Resumo Pedagógico da turma referente ao período ${dados.periodoInicio} a ${dados.periodoFim}. O resumo deve:
- Apresentar uma visão geral narrativa do desenvolvimento coletivo da turma
- NÃO identificar alunos individualmente — descreva padrões coletivos
- Relacionar às competências BNCC trabalhadas: ${dados.bncc_refs.join(', ')}
- Ser adequado para apresentação à coordenação pedagógica
- Total de alunos com registros: ${dados.totalAlunos}
- Escrever em Português Brasileiro formal

${dados.contexto ? `Contexto pedagógico: ${dados.contexto}\n\n` : ''}Dados agregados da turma:
${dados.agregado}

Resumo Pedagógico:`
}
