import type { FastifyInstance } from 'fastify'
import { prisma } from '../../plugins/prisma.js'
import { gerarPdf } from '../../services/pdf.service.js'
import { gerarHtmlVineland } from '../../services/vineland-pdf.service.js'

export default async function vinelandRoutes(fastify: FastifyInstance) {
  fastify.get('/api/vineland', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const professor = request.professor
    const query = request.query as { aluno_id?: string; turma_id?: string }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const avaliacoes = await (prisma as any).avaliacaoVineland.findMany({
      where: {
        aluno: {
          turma: { professor_id: professor.id },
          ...(query.turma_id ? { turma_id: query.turma_id } : {}),
        },
        ...(query.aluno_id ? { aluno_id: query.aluno_id } : {}),
      },
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            data_nascimento: true,
            turma: { select: { id: true, nome: true } },
          },
        },
      },
      orderBy: [{ aluno: { nome: 'asc' } }, { data_teste: 'desc' }],
    })

    return reply.code(200).send({ data: avaliacoes, total: avaliacoes.length })
  })

  fastify.post('/api/vineland', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const professor = request.professor
    const body = request.body as {
      aluno_id: string
      avaliador: string
      data_teste: string
      com_bruta: number
      com_padrao: number
      com_nivel: string
      com_ic?: string
      com_percentil?: string
      avd_bruta: number
      avd_padrao: number
      avd_nivel: string
      avd_ic?: string
      avd_percentil?: string
      soc_bruta: number
      soc_padrao: number
      soc_nivel?: string
      soc_ic?: string
      soc_percentil?: string
      soma_padroes: number
      cca_composto: number
      cca_ic?: string
      cca_percentil?: string
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        id: body.aluno_id,
        turma: { professor_id: professor.id },
        status: { not: 'excluido' },
      },
    })
    if (!aluno) {
      return reply.code(403).send({ error: 'Aluno não encontrado ou sem permissão' })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const avaliacao = await (prisma as any).avaliacaoVineland.create({
      data: {
        aluno_id: body.aluno_id,
        avaliador: body.avaliador,
        data_teste: new Date(body.data_teste + 'T00:00:00.000Z'),
        com_bruta: body.com_bruta,
        com_padrao: body.com_padrao,
        com_nivel: body.com_nivel,
        com_ic: body.com_ic ?? null,
        com_percentil: body.com_percentil ?? null,
        avd_bruta: body.avd_bruta,
        avd_padrao: body.avd_padrao,
        avd_nivel: body.avd_nivel,
        avd_ic: body.avd_ic ?? null,
        avd_percentil: body.avd_percentil ?? null,
        soc_bruta: body.soc_bruta,
        soc_padrao: body.soc_padrao,
        soc_nivel: body.soc_nivel ?? null,
        soc_ic: body.soc_ic ?? null,
        soc_percentil: body.soc_percentil ?? null,
        soma_padroes: body.soma_padroes,
        cca_composto: body.cca_composto,
        cca_ic: body.cca_ic ?? null,
        cca_percentil: body.cca_percentil ?? null,
      },
    })

    return reply.code(201).send(avaliacao)
  })

  fastify.patch('/api/vineland/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const professor = request.professor
    const { id } = request.params as { id: string }
    const body = request.body as Record<string, unknown>

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exists = await (prisma as any).avaliacaoVineland.findFirst({
      where: { id, aluno: { turma: { professor_id: professor.id } } },
    })

    if (!exists) return reply.code(404).send({ error: 'Avaliação não encontrada' })

    if (typeof body.data_teste === 'string') {
      body.data_teste = new Date(body.data_teste + 'T00:00:00.000Z') as unknown as string
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const atualizado = await (prisma as any).avaliacaoVineland.update({ where: { id }, data: body })
    return reply.code(200).send(atualizado)
  })

  fastify.delete('/api/vineland/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const professor = request.professor
    const { id } = request.params as { id: string }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exists = await (prisma as any).avaliacaoVineland.findFirst({
      where: { id, aluno: { turma: { professor_id: professor.id } } },
    })
    if (!exists) return reply.code(404).send({ error: 'Avaliação não encontrada' })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).avaliacaoVineland.delete({ where: { id } })
    return reply.code(204).send()
  })

  fastify.get('/api/vineland/:id/pdf', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const professor = request.professor
    const { id } = request.params as { id: string }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const avaliacao = await (prisma as any).avaliacaoVineland.findFirst({
      where: { id, aluno: { turma: { professor_id: professor.id } } },
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            data_nascimento: true,
            turma: { select: { id: true, nome: true } },
          },
        },
      },
    })

    if (!avaliacao) return reply.code(404).send({ error: 'Avaliação não encontrada' })

    const html = gerarHtmlVineland(avaliacao)
    const pdfBuffer = await gerarPdf(html)
    const nomeArquivo = `vineland_${avaliacao.aluno.nome.replace(/\s+/g, '_')}_${new Date(avaliacao.data_teste).toISOString().slice(0, 10)}.pdf`

    return reply
      .code(200)
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="${nomeArquivo}"`)
      .send(pdfBuffer)
  })
}
