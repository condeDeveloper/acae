import type { FastifyInstance } from 'fastify'
import { prisma } from '../../plugins/prisma.js'

export default async function registrosRoutes(fastify: FastifyInstance) {
  // POST /api/alunos/:alunoId/registros
  fastify.post(
    '/api/alunos/:alunoId/registros',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['periodo', 'objetivos', 'atividades', 'bncc_refs'],
          properties: {
            periodo: { type: 'string', minLength: 1 },
            objetivos: { type: 'string', minLength: 10, maxLength: 5000 },
            atividades: { type: 'string', minLength: 10, maxLength: 5000 },
            mediacoes: { type: 'string', maxLength: 3000 },
            ocorrencias: { type: 'string', maxLength: 3000 },
            bncc_refs: { type: 'array', items: { type: 'string' }, minItems: 1 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const professor = request.professor
      const { alunoId } = request.params as { alunoId: string }
      const body = request.body as {
        periodo: string
        objetivos: string
        atividades: string
        mediacoes?: string
        ocorrencias?: string
        bncc_refs: string[]
      }

      // Validação BNCC na camada de serviço (defesa em profundidade)
      if (!body.bncc_refs || body.bncc_refs.length === 0) {
        return reply.code(400).send({
          error: 'Vínculo BNCC obrigatório',
          message: 'Informe ao menos uma competência ou habilidade da BNCC para continuar.',
        })
      }

      // Verifica que o aluno pertence a uma turma do professor
      const aluno = await prisma.aluno.findFirst({
        where: {
          id: alunoId,
          turma: { professor_id: professor.id },
          status: { not: 'excluido' },
        },
        include: { turma: true },
      })
      if (!aluno) {
        return reply.code(404).send({ error: 'Aluno não encontrado ou inativo' })
      }

      // Verifica conflito de período único
      const existente = await prisma.registroAluno.findUnique({
        where: { aluno_id_periodo: { aluno_id: alunoId, periodo: body.periodo } },
      })
      if (existente) {
        return reply.code(409).send({
          error: 'Já existe um registro para este aluno neste período',
          existing_id: existente.id,
          suggestion: `Use PATCH /api/registros/${existente.id} para atualizar`,
        })
      }

      const registro = await prisma.registroAluno.create({
        data: {
          periodo: body.periodo,
          objetivos: body.objetivos,
          atividades: body.atividades,
          mediacoes: body.mediacoes ?? null,
          ocorrencias: body.ocorrencias ?? null,
          bncc_refs: body.bncc_refs,
          aluno_id: alunoId,
          turma_id: aluno.turma_id,
        },
      })

      return reply.code(201).send({
        id: registro.id,
        periodo: registro.periodo,
        objetivos: registro.objetivos,
        atividades: registro.atividades,
        mediacoes: registro.mediacoes,
        ocorrencias: registro.ocorrencias,
        bncc_refs: registro.bncc_refs,
        aluno_id: registro.aluno_id,
        turma_id: registro.turma_id,
        created_at: registro.created_at,
      })
    }
  )

  // GET /api/alunos/:alunoId/registros — lista registros do aluno com paginação
  fastify.get(
    '/api/alunos/:alunoId/registros',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const professor = request.professor
      const { alunoId } = request.params as { alunoId: string }
      const query = request.query as { page?: string; limit?: string }

      // Verifica que o aluno pertence a uma turma do professor
      const aluno = await prisma.aluno.findFirst({
        where: { id: alunoId, turma: { professor_id: professor.id } },
      })
      if (!aluno) {
        return reply.code(404).send({ error: 'Aluno não encontrado' })
      }

      const page = Math.max(1, parseInt(query.page ?? '1'))
      const limit = Math.min(50, Math.max(1, parseInt(query.limit ?? '20')))
      const skip = (page - 1) * limit

      const [registros, total] = await Promise.all([
        prisma.registroAluno.findMany({
          where: { aluno_id: alunoId },
          orderBy: { periodo: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            periodo: true,
            bncc_refs: true,
            created_at: true,
            updated_at: true,
          },
        }),
        prisma.registroAluno.count({ where: { aluno_id: alunoId } }),
      ])

      return reply.code(200).send({ data: registros, total })
    }
  )
}
