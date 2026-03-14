import type { FastifyInstance } from 'fastify'
import { prisma } from '../../plugins/prisma.js'

export default async function turmasRoutes(fastify: FastifyInstance) {
  // GET /api/turmas — lista turmas do professor autenticado
  fastify.get(
    '/api/turmas',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const professor = request.professor
      const query = request.query as { ano_letivo?: string; status?: string }

      const turmas = await prisma.turma.findMany({
        where: {
          professor_id: professor.id,
          ...(query.ano_letivo ? { ano_letivo: parseInt(query.ano_letivo) } : {}),
          ...(query.status ? { status: query.status as 'ativa' | 'inativa' } : {}),
        },
        include: {
          _count: { select: { alunos: { where: { status: 'ativo' } } } },
          alunos: {
            where: { status: 'ativo' },
            orderBy: { created_at: 'desc' },
            take: 3,
            select: { id: true, nome: true, avatar_id: true },
          },
        },
        orderBy: { created_at: 'desc' },
      })

      return reply.code(200).send({
        data: turmas.map((t: typeof turmas[number]) => ({
          id: t.id,
          nome: t.nome,
          ano_letivo: t.ano_letivo,
          turno: t.turno,
          escola: t.escola,
          status: t.status,
          total_alunos: t._count.alunos,
          alunos_preview: t.alunos.map(a => ({ id: a.id, nome: a.nome, avatar_id: a.avatar_id })),
          created_at: t.created_at,
        })),
        total: turmas.length,
      })
    }
  )

  // POST /api/turmas — cria nova turma
  fastify.post(
    '/api/turmas',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['nome', 'ano_letivo', 'turno', 'escola'],
          properties: {
            nome: { type: 'string', minLength: 1, maxLength: 100 },
            ano_letivo: { type: 'integer', minimum: 2000, maximum: 2100 },
            turno: { type: 'string', enum: ['manha', 'tarde', 'integral'] },
            escola: { type: 'string', minLength: 1, maxLength: 200 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const professor = request.professor
      const { nome, ano_letivo, turno, escola } = request.body as {
        nome: string
        ano_letivo: number
        turno: 'manha' | 'tarde' | 'integral'
        escola: string
      }

      const turma = await prisma.turma.create({
        data: {
          nome,
          ano_letivo,
          turno,
          escola,
          professor_id: professor.id,
        },
      })

      return reply.code(201).send({
        id: turma.id,
        nome: turma.nome,
        ano_letivo: turma.ano_letivo,
        turno: turma.turno,
        escola: turma.escola,
        status: turma.status,
        professor_id: turma.professor_id,
        created_at: turma.created_at,
      })
    }
  )

  // PATCH /api/turmas/:turmaId — atualiza turma
  fastify.patch(
    '/api/turmas/:turmaId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          properties: {
            nome: { type: 'string', minLength: 1, maxLength: 100 },
            turno: { type: 'string', enum: ['manha', 'tarde', 'integral'] },
            escola: { type: 'string', minLength: 1, maxLength: 200 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const professor = request.professor
      const { turmaId } = request.params as { turmaId: string }
      const body = request.body as { nome?: string; turno?: 'manha' | 'tarde' | 'integral'; escola?: string }

      const turma = await prisma.turma.findFirst({
        where: { id: turmaId, professor_id: professor.id },
      })
      if (!turma) return reply.code(404).send({ error: 'Turma não encontrada' })

      const atualizada = await prisma.turma.update({
        where: { id: turmaId },
        data: body,
      })

      return reply.code(200).send({
        id: atualizada.id,
        nome: atualizada.nome,
        ano_letivo: atualizada.ano_letivo,
        turno: atualizada.turno,
        escola: atualizada.escola,
        status: atualizada.status,
        created_at: atualizada.created_at,
      })
    }
  )
}
