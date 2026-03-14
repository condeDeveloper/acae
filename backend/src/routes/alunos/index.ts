import type { FastifyInstance } from 'fastify'
import { prisma } from '../../plugins/prisma.js'

export default async function alunosRoutes(fastify: FastifyInstance) {
  // GET /api/alunos — lista todos os alunos ativos das turmas do professor
  fastify.get(
    '/api/alunos',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const professor = request.professor
      const query = request.query as { turma_id?: string }

      const alunos = await prisma.aluno.findMany({
        where: {
          status: 'ativo',
          turma: { professor_id: professor.id },
          ...(query.turma_id ? { turma_id: query.turma_id } : {}),
        },
        include: { turma: { select: { id: true, nome: true } } },
        orderBy: [{ turma: { nome: 'asc' } }, { nome: 'asc' }],
      })

      return reply.code(200).send({
        data: alunos.map((a) => ({
          id: a.id,
          nome: a.nome,
          turma_id: a.turma_id,
          turma_nome: a.turma.nome,
          data_nascimento: a.data_nascimento,
          necessidades_educacionais: a.necessidades_educacionais,
          avatar_id: a.avatar_id,
        })),
        total: alunos.length,
      })
    }
  )

  // GET /api/turmas/:turmaId/alunos
  fastify.get(
    '/api/turmas/:turmaId/alunos',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const professor = request.professor
      const { turmaId } = request.params as { turmaId: string }
      const query = request.query as { status?: string }

      // Verifica que a turma pertence ao professor
      const turma = await prisma.turma.findFirst({
        where: { id: turmaId, professor_id: professor.id },
      })
      if (!turma) {
        return reply.code(403).send({ error: 'Turma não pertence ao professor autenticado' })
      }

      const statusFilter = (query.status ?? 'ativo') as 'ativo' | 'inativo' | 'excluido'

      const alunos = await prisma.aluno.findMany({
        where: { turma_id: turmaId, status: statusFilter },
        orderBy: { nome: 'asc' },
      })

      return reply.code(200).send({
        data: alunos.map((a: typeof alunos[number]) => ({
          id: a.id,
          nome: a.nome,
          data_nascimento: a.data_nascimento,
          necessidades_educacionais: a.necessidades_educacionais,
          status: a.status,
          turma_id: a.turma_id,
          avatar_id: a.avatar_id,
          created_at: a.created_at,
        })),
        total: alunos.length,
      })
    }
  )

  // POST /api/turmas/:turmaId/alunos
  fastify.post(
    '/api/turmas/:turmaId/alunos',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['nome'],
          properties: {
            nome: { type: 'string', minLength: 2, maxLength: 200 },
            data_nascimento: { type: 'string', format: 'date', nullable: true },
            necessidades_educacionais: { type: 'string', maxLength: 2000, nullable: true },
            avatar_id: { type: 'integer', minimum: 1, maximum: 8, nullable: true },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const professor = request.professor
      const { turmaId } = request.params as { turmaId: string }
      const { nome, data_nascimento, necessidades_educacionais } = request.body as {
        nome: string
        data_nascimento?: string | null
        necessidades_educacionais?: string | null
        avatar_id?: number | null
      }
      const { avatar_id } = request.body as { avatar_id?: number | null }

      // Verifica que a turma pertence ao professor
      const turma = await prisma.turma.findFirst({
        where: { id: turmaId, professor_id: professor.id },
      })
      if (!turma) {
        return reply.code(403).send({ error: 'Turma não pertence ao professor autenticado' })
      }

      // Valida data não futura (apenas se fornecida)
      let nascimentoDate: Date | null = null
      if (data_nascimento) {
        nascimentoDate = new Date(data_nascimento)
        if (isNaN(nascimentoDate.getTime())) {
          return reply.code(400).send({ error: 'Data de nascimento inválida' })
        }
        if (nascimentoDate > new Date()) {
          return reply.code(400).send({
            error: 'Dados inválidos',
            details: [{ field: 'data_nascimento', message: 'Data de nascimento não pode ser no futuro' }],
          })
        }
      }

      const aluno = await prisma.aluno.create({
        data: {
          nome,
          ...(nascimentoDate ? { data_nascimento: nascimentoDate } : {}),
          necessidades_educacionais: necessidades_educacionais ?? null,
          avatar_id: avatar_id ?? null,
          turma_id: turmaId,
        },
      })

      return reply.code(201).send({
        id: aluno.id,
        nome: aluno.nome,
        data_nascimento: aluno.data_nascimento,
        necessidades_educacionais: aluno.necessidades_educacionais,
        avatar_id: aluno.avatar_id,
        status: aluno.status,
        turma_id: aluno.turma_id,
        created_at: aluno.created_at,
      })
    }
  )

  // PATCH /api/alunos/:alunoId — atualiza necessidades educacionais
  fastify.patch(
    '/api/alunos/:alunoId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          properties: {
            necessidades_educacionais: { type: 'string', maxLength: 2000, nullable: true },
            nome: { type: 'string', minLength: 2, maxLength: 200 },
            avatar_id: { type: ['integer', 'null'], minimum: 1, maximum: 8 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const professor = request.professor
      const { alunoId } = request.params as { alunoId: string }
      const body = request.body as { nome?: string; necessidades_educacionais?: string; avatar_id?: number | null }

      // Verifica que o aluno pertence a uma turma do professor
      const aluno = await prisma.aluno.findFirst({
        where: {
          id: alunoId,
          turma: { professor_id: professor.id },
          status: { not: 'excluido' },
        },
      })
      if (!aluno) {
        return reply.code(404).send({ error: 'Aluno não encontrado' })
      }

      const updateData: { nome?: string; necessidades_educacionais?: string | null; avatar_id?: number | null } = {}
      if (body.nome !== undefined) updateData.nome = body.nome
      if (body.necessidades_educacionais !== undefined)
        updateData.necessidades_educacionais = body.necessidades_educacionais || null
      if ('avatar_id' in body) updateData.avatar_id = body.avatar_id ?? null

      const updated = await prisma.aluno.update({
        where: { id: alunoId },
        data: updateData,
      })

      return reply.code(200).send({
        id: updated.id,
        nome: updated.nome,
        necessidades_educacionais: updated.necessidades_educacionais,
        avatar_id: updated.avatar_id,
        status: updated.status,
        turma_id: updated.turma_id,
      })
    }
  )

  // DELETE /api/alunos/:alunoId — soft-delete LGPD
  fastify.delete(
    '/api/alunos/:alunoId',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const professor = request.professor
      const { alunoId } = request.params as { alunoId: string }

      const aluno = await prisma.aluno.findFirst({
        where: {
          id: alunoId,
          turma: { professor_id: professor.id },
          status: { not: 'excluido' },
        },
      })
      if (!aluno) {
        return reply.code(404).send({ error: 'Aluno não encontrado' })
      }

      // Soft-delete LGPD: anonimiza PII, preserva histórico
      await prisma.aluno.update({
        where: { id: alunoId },
        data: {
          status: 'excluido',
          nome: '[DADOS REMOVIDOS]',
          necessidades_educacionais: null,
        },
      })

      return reply.code(200).send({ message: 'Dados do aluno excluídos conforme solicitação LGPD' })
    }
  )

  // GET /api/alunos/:alunoId/bncc-recentes — retorna BNCC refs mais usadas nos últimos registros
  fastify.get(
    '/api/alunos/:alunoId/bncc-recentes',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const professor = request.professor
      const { alunoId } = request.params as { alunoId: string }

      const aluno = await prisma.aluno.findFirst({
        where: { id: alunoId, turma: { professor_id: professor.id }, status: { not: 'excluido' } },
      })
      if (!aluno) return reply.code(404).send({ error: 'Aluno não encontrado' })

      const registros = await prisma.registroAluno.findMany({
        where: { aluno_id: alunoId },
        orderBy: { periodo: 'desc' },
        take: 10,
        select: { bncc_refs: true },
      })

      // Count frequency and return top refs
      const freq = new Map<string, number>()
      for (const r of registros) {
        for (const ref of (r.bncc_refs as string[])) {
          freq.set(ref, (freq.get(ref) ?? 0) + 1)
        }
      }
      const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([ref]) => ref)

      return reply.send({ bncc_refs: sorted })
    }
  )
}
