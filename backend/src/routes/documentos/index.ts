import type { FastifyInstance } from 'fastify'
import { prisma } from '../../plugins/prisma.js'

export default async function documentosRoutes(fastify: FastifyInstance) {
  // GET /api/alunos/:alunoId/documentos — histórico de documentos finalizados
  fastify.get(
    '/api/alunos/:alunoId/documentos',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const professor = request.professor
      const { alunoId } = request.params as { alunoId: string }
      const query = request.query as { tipo?: string; page?: string }

      const aluno = await prisma.aluno.findFirst({
        where: { id: alunoId, turma: { professor_id: professor.id } },
      })
      if (!aluno) {
        return reply.code(404).send({ error: 'Aluno não encontrado' })
      }

      const page = Math.max(1, parseInt(query.page ?? '1'))
      const limit = 20
      const skip = (page - 1) * limit

      const [versoes, total] = await Promise.all([
        prisma.versaoDocumento.findMany({
          where: {
            aluno_id: alunoId,
            professor_id: professor.id,
            ...(query.tipo ? { rascunho: { tipo: query.tipo as any } } : {}),
          },
          include: {
            rascunho: { select: { tipo: true, id: true } },
            professor: { select: { nome: true } },
          },
          orderBy: { finalizado_em: 'desc' },
          skip,
          take: limit,
        }),
        prisma.versaoDocumento.count({
          where: {
            aluno_id: alunoId,
            professor_id: professor.id,
            ...(query.tipo ? { rascunho: { tipo: query.tipo as any } } : {}),
          },
        }),
      ])

      return reply.code(200).send({
        data: versoes.map((v: typeof versoes[number]) => ({
          id: v.id,
          rascunho_id: v.rascunho_id,
          tipo: v.rascunho.tipo,
          numero_versao: v.numero_versao,
          periodo: v.periodo,
          bncc_refs: v.bncc_refs,
          professor: v.professor.nome,
          finalizado_em: v.finalizado_em,
          created_at: v.created_at,
        })),
        total,
        page,
        total_pages: Math.ceil(total / limit),
      })
    }
  )
}
