import type { FastifyInstance } from 'fastify'
import { prisma } from '../../plugins/prisma.js'

export default async function registrosRoutes(fastify: FastifyInstance) {
  // GET /api/registros — lista todos os registros das turmas do professor
  fastify.get(
    '/api/registros',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const professor = request.professor
      const query = request.query as { limit?: string }
      const limit = Math.min(200, Math.max(1, parseInt(query.limit ?? '200')))

      const registros = await prisma.registroAluno.findMany({
        where: { turma: { professor_id: professor.id } },
        orderBy: { periodo: 'desc' },
        take: limit,
        select: {
          id: true,
          periodo: true,
          bncc_refs: true,
          created_at: true,
          updated_at: true,
          aluno: { select: { id: true, nome: true } },
          turma: { select: { id: true, nome: true } },
        },
      })

      return reply.code(200).send({
        data: registros.map((r) => ({
          id: r.id,
          periodo: r.periodo,
          bncc_refs: r.bncc_refs,
          created_at: r.created_at,
          updated_at: r.updated_at,
          aluno_id: r.aluno.id,
          aluno_nome: r.aluno.nome,
          turma_id: r.turma.id,
          turma_nome: r.turma.nome,
        })),
        total: registros.length,
      })
    }
  )

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

  // GET /api/registros/:registroId — detalhe completo
  fastify.get(
    '/api/registros/:registroId',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const professor = request.professor
      const { registroId } = request.params as { registroId: string }

      const registro = await prisma.registroAluno.findFirst({
        where: {
          id: registroId,
          turma: { professor_id: professor.id },
        },
      })
      if (!registro) {
        return reply.code(404).send({ error: 'Registro não encontrado' })
      }

      return reply.code(200).send({
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
        updated_at: registro.updated_at,
      })
    }
  )

  // PATCH /api/registros/:registroId — atualiza registro
  fastify.patch(
    '/api/registros/:registroId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          properties: {
            periodo:     { type: 'string', minLength: 1 },
            objetivos:   { type: 'string', minLength: 10, maxLength: 5000 },
            atividades:  { type: 'string', minLength: 10, maxLength: 5000 },
            mediacoes:   { type: 'string', maxLength: 3000, nullable: true },
            ocorrencias: { type: 'string', maxLength: 3000, nullable: true },
            bncc_refs:   { type: 'array', items: { type: 'string' }, minItems: 1 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const professor = request.professor
      const { registroId } = request.params as { registroId: string }
      const body = request.body as {
        periodo?: string
        objetivos?: string
        atividades?: string
        mediacoes?: string | null
        ocorrencias?: string | null
        bncc_refs?: string[]
      }

      const registro = await prisma.registroAluno.findFirst({
        where: { id: registroId, turma: { professor_id: professor.id } },
      })
      if (!registro) {
        return reply.code(404).send({ error: 'Registro não encontrado' })
      }

      // Conflito de período (só se mudar o período)
      if (body.periodo && body.periodo !== registro.periodo) {
        const conflito = await prisma.registroAluno.findUnique({
          where: { aluno_id_periodo: { aluno_id: registro.aluno_id, periodo: body.periodo } },
        })
        if (conflito) {
          return reply.code(409).send({ error: 'Já existe um registro para este aluno neste período' })
        }
      }

      const updateData: Record<string, unknown> = {}
      if (body.periodo !== undefined)     updateData.periodo     = body.periodo
      if (body.objetivos !== undefined)   updateData.objetivos   = body.objetivos
      if (body.atividades !== undefined)  updateData.atividades  = body.atividades
      if (body.mediacoes !== undefined)   updateData.mediacoes   = body.mediacoes ?? null
      if (body.ocorrencias !== undefined) updateData.ocorrencias = body.ocorrencias ?? null
      if (body.bncc_refs !== undefined)   updateData.bncc_refs   = body.bncc_refs

      const atualizado = await prisma.registroAluno.update({
        where: { id: registroId },
        data: updateData,
      })

      return reply.code(200).send({
        id: atualizado.id,
        periodo: atualizado.periodo,
        objetivos: atualizado.objetivos,
        atividades: atualizado.atividades,
        mediacoes: atualizado.mediacoes,
        ocorrencias: atualizado.ocorrencias,
        bncc_refs: atualizado.bncc_refs,
        updated_at: atualizado.updated_at,
      })
    }
  )

  // DELETE /api/registros/:registroId
  fastify.delete(
    '/api/registros/:registroId',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const professor = request.professor
      const { registroId } = request.params as { registroId: string }

      const registro = await prisma.registroAluno.findFirst({
        where: { id: registroId, turma: { professor_id: professor.id } },
      })
      if (!registro) {
        return reply.code(404).send({ error: 'Registro não encontrado' })
      }

      await prisma.registroAluno.delete({ where: { id: registroId } })
      return reply.code(204).send()
    }
  )
}
