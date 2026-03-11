import { createHash } from 'crypto'
import { prisma } from '../plugins/prisma.js'
import { generateContent } from './gemini.service.js'
import { checkQuota, incrementQuota, QuotaExceededError } from './quota.service.js'
import {
  pseudonymize,
  buildPromptPortfolio,
  buildPromptRelatorio,
  buildPromptAtividade,
  buildPromptResumo,
} from './prompt-builder.js'

interface Professor {
  id: string
  nome: string
  escola: string
}

interface GenerateParams {
  professor: Professor
  tipo: string
  aluno_id?: string
  turma_id?: string
  aluno_ids?: string[]
  grupo_id?: string
  periodo_inicio?: string
  periodo_fim?: string
  objetivo?: string
  bncc_refs?: string[]
}

export async function gerarDocumento(params: GenerateParams) {
  const { professor, tipo } = params

  // Validate BNCC refs
  if (!params.bncc_refs || params.bncc_refs.length === 0) {
    const err = new Error('Pelo menos uma competência BNCC é obrigatória para gerar o documento.')
    ;(err as Error & { statusCode: number }).statusCode = 422
    throw err
  }

  // Check quota before calling Gemini
  await checkQuota()

  let prompt: string
  let alunoId: string | undefined = params.aluno_id
  let turmaId = ''
  let turmaNome = ''
  let alunoNome = ''

  if (tipo === 'portfolio_semanal' || tipo === 'relatorio_individual') {
    if (!params.aluno_id) throw Object.assign(new Error('aluno_id obrigatório'), { statusCode: 400 })
    if (!params.periodo_inicio || !params.periodo_fim) {
      throw Object.assign(new Error('periodo_inicio e periodo_fim obrigatórios'), { statusCode: 400 })
    }

    const aluno = await prisma.aluno.findUnique({
      where: { id: params.aluno_id },
      include: { turma: true },
    })
    if (!aluno) throw Object.assign(new Error('Aluno não encontrado'), { statusCode: 404 })

    // Ownership check
    if (aluno.turma.professor_id !== professor.id) {
      throw Object.assign(new Error('Acesso negado a este aluno'), { statusCode: 403 })
    }

    alunoNome = aluno.nome
    turmaNome = aluno.turma.nome
    turmaId = aluno.turma_id

    const registros = await prisma.registroAluno.findMany({
      where: {
        aluno_id: params.aluno_id,
        periodo: {
          gte: params.periodo_inicio,
          lte: params.periodo_fim,
        },
      },
      orderBy: { periodo: 'asc' },
    })

    if (registros.length === 0) {
      throw Object.assign(
        new Error('Não há registros do aluno no período informado.'),
        { statusCode: 422 },
      )
    }

    const contexto = await prisma.contextoPedagogico.findFirst({
      where: { turma_id: aluno.turma_id },
      orderBy: { updated_at: 'desc' },
    })

    const descricaoContexto = contexto
      ? `${contexto.objetivos}\n\n${contexto.metodologia}${contexto.dinamica_grupo ? '\n\n' + contexto.dinamica_grupo : ''}`
      : undefined

    const pseudo = pseudonymize()
    const registrosMapped = registros.map((r) => ({
      periodo: r.periodo,
      atividades: r.atividades ?? '',
      objetivos: r.objetivos ?? '',
      medicoes: r.mediacoes ?? '',
      ocorrencias: r.ocorrencias ?? '',
      bncc_refs: r.bncc_refs as string[],
    }))

    if (tipo === 'portfolio_semanal') {
      prompt = buildPromptPortfolio({
        pseudo,
        registros: registrosMapped,
        contexto: descricaoContexto,
      })
    } else {
      prompt = buildPromptRelatorio({
        pseudo,
        registros: registrosMapped,
        contexto: descricaoContexto,
      })
    }
  } else if (tipo === 'atividade_adaptada') {
    const alunoIds = params.aluno_ids ?? (params.aluno_id ? [params.aluno_id] : [])
    if (alunoIds.length === 0 && !params.grupo_id) {
      throw Object.assign(new Error('aluno_ids ou grupo_id é obrigatório'), { statusCode: 400 })
    }

    let resolvedIds = alunoIds
    if (params.grupo_id && alunoIds.length === 0) {
      const membros = await prisma.grupoAluno.findMany({ where: { grupo_id: params.grupo_id } })
      resolvedIds = membros.map((m) => m.aluno_id)
    }

    const alunos = await prisma.aluno.findMany({
      where: { id: { in: resolvedIds } },
      include: {
        turma: true,
        registros: { orderBy: { periodo: 'desc' }, take: 3 },
      },
    })

    alunoId = resolvedIds[0]
    alunoNome = alunos.map((a) => a.nome).join(', ')
    turmaNome = alunos[0]?.turma.nome ?? ''
    turmaId = alunos[0]?.turma_id ?? ''

    const pseudo = pseudonymize()
    prompt = buildPromptAtividade({
      alunos: alunos.map((a) => ({
        pseudo: `${pseudo}-${a.id.slice(0, 8)}`,
        contexto: a.necessidades_educacionais ?? 'Sem necessidades específicas registradas',
      })),
      objetivo: params.objetivo ?? '',
      bncc_refs: params.bncc_refs,
    })
  } else if (tipo === 'resumo_pedagogico') {
    if (!params.turma_id) throw Object.assign(new Error('turma_id obrigatório'), { statusCode: 400 })
    if (!params.periodo_inicio || !params.periodo_fim) {
      throw Object.assign(new Error('periodo_inicio e periodo_fim obrigatórios'), { statusCode: 400 })
    }

    const turma = await prisma.turma.findUnique({ where: { id: params.turma_id } })
    if (!turma) throw Object.assign(new Error('Turma não encontrada'), { statusCode: 404 })
    if (turma.professor_id !== professor.id) {
      throw Object.assign(new Error('Acesso negado a esta turma'), { statusCode: 403 })
    }

    turmaNome = turma.nome
    turmaId = params.turma_id

    const registros = await prisma.registroAluno.findMany({
      where: {
        aluno: { turma_id: params.turma_id },
        periodo: {
          gte: params.periodo_inicio,
          lte: params.periodo_fim,
        },
      },
      include: { aluno: true },
    })

    const alunoUnicoIds = new Set(registros.map((r) => r.aluno_id))
    if (alunoUnicoIds.size < 2) {
      throw Object.assign(
        new Error('Ao menos 2 alunos com registros são necessários para o resumo pedagógico.'),
        { statusCode: 422 },
      )
    }

    const agregado = `${registros.length} registros de ${alunoUnicoIds.size} alunos no período.`
    prompt = buildPromptResumo({
      totalAlunos: alunoUnicoIds.size,
      periodoInicio: params.periodo_inicio,
      periodoFim: params.periodo_fim,
      agregado,
      bncc_refs: params.bncc_refs,
    })
  } else {
    throw Object.assign(new Error(`Tipo de documento inválido: ${tipo}`), { statusCode: 400 })
  }

  // Call Gemini
  const conteudoGerado = await generateContent(prompt)

  const periodo = params.periodo_inicio && params.periodo_fim
    ? `${params.periodo_inicio} a ${params.periodo_fim}`
    : (params.periodo_inicio ?? params.periodo_fim ?? 'Sem período')

  // Save draft
  const rascunho = await prisma.rascunhoDocumento.create({
    data: {
      professor_id: professor.id,
      aluno_id: alunoId ?? null,
      turma_id: turmaId,
      tipo: tipo as 'portfolio_semanal' | 'relatorio_individual' | 'atividade_adaptada' | 'resumo_pedagogico',
      status: 'rascunho',
      conteudo_gerado: conteudoGerado,
      bncc_refs: params.bncc_refs ?? [],
      periodo,
      prompt_hash: createHash('sha256').update(prompt).digest('hex'),
    },
  })

  // Increment quota
  await incrementQuota()

  return {
    rascunho: {
      id: rascunho.id,
      tipo: rascunho.tipo,
      status: rascunho.status,
      conteudo_gerado: rascunho.conteudo_gerado,
      bncc_refs: rascunho.bncc_refs,
      gerado_em: rascunho.created_at,
      aluno_nome: alunoNome,
      turma_nome: turmaNome,
      periodo,
    },
  }
}
