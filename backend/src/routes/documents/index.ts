import type { FastifyInstance } from 'fastify'
import { gerarDocumento } from '../../services/document.service.js'
import { gerarDocx, buildHtml } from '../../services/export.service.js'
import { gerarPdf } from '../../services/pdf.service.js'
import { criarToken } from '../../services/download-token.service.js'
import { prisma } from '../../plugins/prisma.js'
import { QuotaExceededError, getQuotaInfo } from '../../services/quota.service.js'

export default async function documentsRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/documents/generate
   * Generate a pedagogical document using Gemini AI.
   */
  fastify.post('/api/documents/generate', async (request, reply) => {
    const body = request.body as {
      tipo: string
      aluno_id?: string
      turma_id?: string
      aluno_ids?: string[]
      grupo_id?: string
      objetivo?: string
      bncc_refs?: string[]
      periodo_inicio?: string
      periodo_fim?: string
    }

    try {
      const result = await gerarDocumento({
        professor: request.professor,
        tipo: body.tipo,
        aluno_id: body.aluno_id,
        turma_id: body.turma_id,
        aluno_ids: body.aluno_ids,
        grupo_id: body.grupo_id,
        objetivo: body.objetivo,
        bncc_refs: body.bncc_refs,
        periodo_inicio: body.periodo_inicio,
        periodo_fim: body.periodo_fim,
      })

      return reply.code(201).send(result)
    } catch (err: unknown) {
      const error = err as Error & { statusCode?: number; retornaEm?: string }

      if (err instanceof QuotaExceededError) {
        return reply.code(429).send({
          error: error.message,
          retorna_em: error.retornaEm,
        })
      }

      const status = error.statusCode ?? 500
      return reply.code(status).send({ error: error.message ?? 'Erro de servidor' })
    }
  })

  /**
   * PATCH /api/documents/rascunhos/:id
   * Update draft content (autosave).
   */
  fastify.patch('/api/documents/rascunhos/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { conteudo_editado } = request.body as { conteudo_editado: string }

    const rascunho = await prisma.rascunhoDocumento.findUnique({ where: { id } })
    if (!rascunho) return reply.code(404).send({ error: 'Rascunho não encontrado' })
    if (rascunho.professor_id !== request.professor.id) return reply.code(403).send({ error: 'Acesso negado' })
    if (rascunho.status === 'finalizado') {
      return reply.code(409).send({ error: 'Rascunho já finalizado — não pode ser editado' })
    }

    const updated = await prisma.rascunhoDocumento.update({
      where: { id },
      data: { conteudo_editado, status: 'em_revisao' },
    })

    return {
      rascunho_id: updated.id,
      status: updated.status,
      conteudo_editado: updated.conteudo_editado,
      atualizado_em: updated.updated_at,
    }
  })

  /**
   * POST /api/documents/rascunhos/:id/finalizar
   * Finalize a draft — creates an immutable VersaoDocumento record.
   */
  fastify.post('/api/documents/rascunhos/:id/finalizar', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { conteudo_final } = request.body as { conteudo_final: string }

    const rascunho = await prisma.rascunhoDocumento.findUnique({ where: { id } })
    if (!rascunho) return reply.code(404).send({ error: 'Rascunho não encontrado' })
    if (rascunho.professor_id !== request.professor.id) return reply.code(403).send({ error: 'Acesso negado' })
    if (rascunho.status === 'finalizado') {
      return reply.code(409).send({ error: 'Este rascunho já foi finalizado' })
    }
    if (!conteudo_final || conteudo_final.trim() === '') {
      return reply.code(422).send({ error: 'conteudo_final não pode estar vazio' })
    }
    if (!rascunho.bncc_refs || (rascunho.bncc_refs as string[]).length === 0) {
      return reply.code(422).send({ error: 'bncc_refs obrigatório para finalizar' })
    }

    // Count existing versions to set numero_versao
    const versaoCount = await prisma.versaoDocumento.count({ where: { rascunho_id: rascunho.id } })

    // Create immutable version
    await prisma.versaoDocumento.create({
      data: {
        rascunho_id: rascunho.id,
        professor_id: rascunho.professor_id,
        aluno_id: rascunho.aluno_id ?? null,
        turma_id: rascunho.turma_id,
        numero_versao: versaoCount + 1,
        conteudo: conteudo_final,
        bncc_refs: rascunho.bncc_refs as string[],
        periodo: rascunho.periodo,
        finalizado_em: new Date(),
      },
    })

    await prisma.rascunhoDocumento.update({
      where: { id },
      data: { status: 'finalizado', conteudo_editado: conteudo_final },
    })

    return reply.code(200).send({ status: 'finalizado' })
  })

  /**
   * GET /api/documents/rascunhos/:id/export
   * Export draft as .docx or .pdf — returns a download token URL.
   */
  fastify.get('/api/documents/rascunhos/:id/export', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { formato = 'docx' } = request.query as { formato?: string }

    const rascunho = await prisma.rascunhoDocumento.findUnique({
      where: { id },
      include: {
        professor: { select: { nome: true, escola: true } },
        aluno: { select: { nome: true } },
        turma: { select: { nome: true, escola: true, turno: true } },
      },
    })
    if (!rascunho) return reply.code(404).send({ error: 'Rascunho não encontrado' })
    if (rascunho.professor_id !== request.professor.id) return reply.code(403).send({ error: 'Acesso negado' })

    const conteudo = rascunho.conteudo_editado ?? rascunho.conteudo_gerado
    const dados = {
      tipo: rascunho.tipo,
      professorNome: rascunho.professor.nome,
      turmaNome: rascunho.turma?.nome ?? '',
      alunoNome: rascunho.aluno?.nome ?? '',
      periodo: rascunho.periodo,
      bnccCodigos: (rascunho.bncc_refs as string[]).join(', '),
      conteudo,
      geradoEm: new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      unidade: rascunho.turma?.escola ?? '',
      turno: rascunho.turma?.turno ?? '',
    }

    let buffer: Buffer
    let mimeType: string
    let ext: string

    if (formato === 'pdf') {
      const html = buildHtml(dados)
      buffer = await gerarPdf(html)
      mimeType = 'application/pdf'
      ext = 'pdf'
    } else {
      buffer = await gerarDocx(dados)
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ext = 'docx'
    }

    const tipo_label = rascunho.tipo.replace('_', '-')
    const filename = `${tipo_label}-${id.slice(0, 8)}.${ext}`
    const token = criarToken({ buffer, filename, mimeType })

    const baseUrl = process.env.APP_URL ?? `http://localhost:${process.env.PORT ?? 3000}`
    const expira = new Date(Date.now() + 10 * 60 * 1000)

    return {
      download_url: `${baseUrl}/api/downloads/${token}`,
      expira_em: expira.toISOString(),
      formato: ext,
    }
  })

  /**
   * GET /api/documents/quota
   * Returns current daily AI quota status.
   */
  fastify.get('/api/documents/quota', async (_request, reply) => {
    const info = await getQuotaInfo()
    return reply.send(info)
  })

  /**
   * GET /api/documents/rascunhos
   * List active drafts by aluno_id and tipo.
   */
  fastify.get('/api/documents/rascunhos', async (request) => {
    const { aluno_id, tipo } = request.query as { aluno_id?: string; tipo?: string }

    const rascunho = await prisma.rascunhoDocumento.findFirst({
      where: {
        professor_id: request.professor.id,
        aluno_id: aluno_id ?? undefined,
        tipo: tipo as 'portfolio_semanal' | 'relatorio_individual' | 'atividade_adaptada' | 'resumo_pedagogico' | undefined,
        status: { not: 'finalizado' },
      },
      orderBy: { created_at: 'desc' },
    })

    return { rascunho }
  })
}
