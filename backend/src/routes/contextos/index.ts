import type { FastifyInstance } from 'fastify'
import { prisma } from '../../plugins/prisma.js'

export default async function contextosRoutes(fastify: FastifyInstance) {
  // GET /api/turmas/:turmaId/contextos
  fastify.get(
    '/api/turmas/:turmaId/contextos',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const professor = request.professor
      const { turmaId } = request.params as { turmaId: string }
      const query = request.query as { periodo?: string }

      const turma = await prisma.turma.findFirst({
        where: { id: turmaId, professor_id: professor.id },
      })
      if (!turma) {
        return reply.code(403).send({ error: 'Turma não pertence ao professor autenticado' })
      }

      const contextos = await prisma.contextoPedagogico.findMany({
        where: {
          turma_id: turmaId,
          ...(query.periodo ? { periodo: { contains: query.periodo } } : {}),
        },
        orderBy: { periodo: 'desc' },
      })

      return reply.code(200).send({ data: contextos, total: contextos.length })
    }
  )

  // POST /api/turmas/:turmaId/contextos
  fastify.post(
    '/api/turmas/:turmaId/contextos',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['periodo', 'metodologia', 'objetivos'],
          properties: {
            periodo: { type: 'string', minLength: 1 },
            metodologia: { type: 'string', minLength: 10 },
            objetivos: { type: 'string', minLength: 10 },
            dinamica_grupo: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const professor = request.professor
      const { turmaId } = request.params as { turmaId: string }
      const body = request.body as {
        periodo: string
        metodologia: string
        objetivos: string
        dinamica_grupo?: string
      }

      const turma = await prisma.turma.findFirst({
        where: { id: turmaId, professor_id: professor.id },
      })
      if (!turma) {
        return reply.code(403).send({ error: 'Turma não pertence ao professor autenticado' })
      }

      // Upsert: um contexto por turma por período (unique constraint)
      const contexto = await prisma.contextoPedagogico.upsert({
        where: { turma_id_periodo: { turma_id: turmaId, periodo: body.periodo } },
        create: {
          turma_id: turmaId,
          periodo: body.periodo,
          metodologia: body.metodologia,
          objetivos: body.objetivos,
          dinamica_grupo: body.dinamica_grupo ?? null,
        },
        update: {
          metodologia: body.metodologia,
          objetivos: body.objetivos,
          dinamica_grupo: body.dinamica_grupo ?? null,
        },
      })

      return reply.code(201).send(contexto)
    }
  )
}
