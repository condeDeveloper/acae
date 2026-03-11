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
  const registrosTexto = dados.registros.map((r) =>
    `Período: ${r.periodo}
Atividades: ${r.atividades}
Objetivos de aprendizagem: ${r.objetivos}
Mediações pedagógicas: ${r.medicoes}
Ocorrências relevantes: ${r.ocorrencias}
Competências BNCC: ${r.bncc_refs.join(', ')}`,
  ).join('\n\n---\n\n')

  return `Você é um assistente pedagógico especializado em Educação Infantil e Anos Iniciais do Ensino Fundamental, alinhado à Base Nacional Comum Curricular (BNCC).

Gere um Portfólio Semanal para o aluno de referência "${dados.pseudo}" com base nos registros abaixo. O portfólio deve:
- Descrever o desenvolvimento observado de forma narrativa e acolhedora
- Relacionar as atividades às competências BNCC informadas
- Destacar avanços, mediações e possibilidades de continuidade
- Ter tom profissional e empático, adequado para comunicação com famílias e coordenação
- NÃO mencionar nenhum nome real — use "o aluno" ou "a criança"
- Escrever em Português Brasileiro formal

${dados.contexto ? `Contexto pedagógico da turma: ${dados.contexto}\n\n` : ''}Registros:
${registrosTexto}

Portfólio Semanal:`
}

interface RelatorioData {
  pseudo: string
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
- Escrever em Português Brasileiro formal

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
