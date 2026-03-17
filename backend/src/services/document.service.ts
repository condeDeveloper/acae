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

// Helper: fetch BNCC descriptions for a list of codes from DB
async function fetchBnccDescricoes(codes: string[]): Promise<Record<string, string>> {
  if (codes.length === 0) return {}
  const unique = Array.from(new Set(codes))
  const records = await prisma.competenciaBNCC.findMany({
    where: { codigo: { in: unique } },
    select: { codigo: true, descricao: true },
  })
  return Object.fromEntries(records.map(b => [b.codigo, b.descricao]))
}

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

function toBR(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function calcularIdade(nascimento: Date | null): number | undefined {
  if (!nascimento) return undefined
  const hoje = new Date()
  let anos = hoje.getFullYear() - nascimento.getFullYear()
  const m = hoje.getMonth() - nascimento.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) anos--
  return anos
}

function extrairSintese(conteudo: string): string {
  // Tenta extrair a seção de síntese final; fallback: últimos 700 chars
  const marcadores = ['SÍNTESE DE DESENVOLVIMENTO', 'Síntese de Desenvolvimento', 'síntese de desenvolvimento']
  for (const m of marcadores) {
    const idx = conteudo.lastIndexOf(m)
    if (idx !== -1) return conteudo.slice(idx).slice(0, 900)
  }
  return conteudo.slice(-700)
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
  let pseudo = ''

  if (tipo === 'portfolio_semanal' || tipo === 'portfolio_mensal' || tipo === 'relatorio_individual') {
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

    // Perfil do aluno
    const alunoPerfil = {
      idadeAnos: calcularIdade(aluno.data_nascimento),
      necessidades: aluno.necessidades_educacionais ?? undefined,
    }

    // Último documento do mesmo tipo para este aluno (para contexto de progressão)
    // O documento atual ainda não foi salvo, então o mais recente é sempre o anterior
    const ultimoDoc = await prisma.rascunhoDocumento.findFirst({
      where: { aluno_id: params.aluno_id, tipo: tipo as never },
      orderBy: { created_at: 'desc' },
      select: { conteudo_gerado: true },
    })
    const documentoAnterior = ultimoDoc?.conteudo_gerado
      ? extrairSintese(ultimoDoc.conteudo_gerado)
      : undefined

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

    // Fetch BNCC descriptions for all codes present in the registros
    const allCodes = Array.from(new Set(registros.flatMap(r => r.bncc_refs as string[])))
    const bnccDescricoes = await fetchBnccDescricoes(allCodes)

    pseudo = pseudonymize()
    const registrosMapped = registros.map((r) => ({
      periodo: toBR(r.periodo),
      atividades: r.atividades ?? '',
      objetivos: r.objetivos ?? '',
      mediacoes: r.mediacoes ?? '',    // mediação pedagógica por aluno/grupo
      ocorrencias: r.ocorrencias ?? '', // fatos fora da rotina / justificativas
      bncc_refs: r.bncc_refs as string[],
    }))

    if (tipo === 'portfolio_semanal' || tipo === 'portfolio_mensal') {
      prompt = buildPromptPortfolio({
        pseudo,
        tipo,
        registros: registrosMapped,
        bnccDescricoes,
        metodologiaTurma: contexto?.metodologia ?? undefined,
        dinamicaGrupo: contexto?.dinamica_grupo ?? undefined,
        alunoPerfil,
        documentoAnterior,
      })
    } else {
      // relatorio_individual — build combined context string for narrative
      const descricaoContexto = contexto
        ? `${contexto.objetivos}\n\n${contexto.metodologia}${contexto.dinamica_grupo ? '\n\n' + contexto.dinamica_grupo : ''}`
        : undefined
      const periodoGeral = params.periodo_inicio && params.periodo_fim
        ? `${toBR(params.periodo_inicio)} a ${toBR(params.periodo_fim)}`
        : undefined
      prompt = buildPromptRelatorio({
        pseudo,
        periodoGeral,
        registros: registrosMapped,
        bnccDescricoes,
        contexto: descricaoContexto,
        alunoPerfil,
        documentoAnterior,
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
        registros: { orderBy: { periodo: 'desc' }, take: 3, select: { atividades: true, objetivos: true, bncc_refs: true } },
      },
    })

    alunoId = resolvedIds[0]
    alunoNome = alunos.map((a) => a.nome).join(', ')
    turmaNome = alunos[0]?.turma.nome ?? ''
    turmaId = alunos[0]?.turma_id ?? ''

    // Fetch BNCC descriptions
    const bnccDescricoes = await fetchBnccDescricoes(params.bncc_refs ?? [])

    const pseudo = pseudonymize()
    prompt = buildPromptAtividade({
      alunos: alunos.map((a) => {
        const historicoRecente = a.registros
          .map(r => [r.atividades, r.objetivos].filter(Boolean).join(' | '))
          .filter(Boolean)
          .join('; ')
        return {
          pseudo: `${pseudo}-${a.id.slice(0, 8)}`,
          necessidades: a.necessidades_educacionais ?? 'Não especificado',
          historicoRecente: historicoRecente || 'Sem histórico recente registrado',
        }
      }),
      objetivo: params.objetivo ?? '',
      bncc_refs: params.bncc_refs ?? [],
      bnccDescricoes,
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
      select: {
        aluno_id: true,
        atividades: true,
        objetivos: true,
        mediacoes: true,
        bncc_refs: true,
      },
    })

    const alunoUnicoIds = new Set(registros.map((r) => r.aluno_id))
    if (alunoUnicoIds.size < 2) {
      throw Object.assign(
        new Error('Ao menos 2 alunos com registros são necessários para o resumo pedagógico.'),
        { statusCode: 422 },
      )
    }

    // Fetch BNCC descriptions for all codes in the period
    const allCodes = Array.from(new Set([
      ...(params.bncc_refs ?? []),
      ...registros.flatMap(r => r.bncc_refs as string[]),
    ]))
    const bnccDescricoes = await fetchBnccDescricoes(allCodes)

    // Pseudonymize each student consistently across their registros
    const pseudoMap = new Map<string, string>()
    const registrosAgregados = registros.map(r => {
      if (!pseudoMap.has(r.aluno_id)) pseudoMap.set(r.aluno_id, pseudonymize())
      return {
        pseudo: pseudoMap.get(r.aluno_id)!,
        atividades: r.atividades ?? '',
        objetivos: r.objetivos ?? '',
        mediacoes: r.mediacoes ?? '',
        bncc_refs: r.bncc_refs as string[],
      }
    })

    prompt = buildPromptResumo({
      totalAlunos: alunoUnicoIds.size,
      periodoInicio: toBR(params.periodo_inicio),
      periodoFim: toBR(params.periodo_fim),
      registrosAgregados,
      bnccDescricoes,
      bncc_refs: allCodes,
    })
  } else {
    throw Object.assign(new Error(`Tipo de documento inválido: ${tipo}`), { statusCode: 400 })
  }

  // Call AI
  let conteudoGerado = await generateContent(prompt)

  // Replace pseudo UUID with real student name in the generated content
  if (pseudo && alunoNome) {
    conteudoGerado = conteudoGerado.replaceAll(pseudo, alunoNome)
  }

  const periodo = params.periodo_inicio && params.periodo_fim
    ? `${toBR(params.periodo_inicio)} a ${toBR(params.periodo_fim)}`
    : (params.periodo_inicio ? toBR(params.periodo_inicio) : params.periodo_fim ? toBR(params.periodo_fim) : 'Sem período')

  // Save draft
  const rascunho = await prisma.rascunhoDocumento.create({
    data: {
      professor_id: professor.id,
      aluno_id: alunoId ?? null,
      turma_id: turmaId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tipo: tipo as any,
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
