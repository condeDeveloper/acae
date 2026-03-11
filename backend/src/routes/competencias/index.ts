import type { FastifyInstance } from 'fastify'
import { prisma } from '../../plugins/prisma.js'

export default async function competenciasRoutes(fastify: FastifyInstance) {
  // GET /api/competencias — lista todas as competências BNCC
  fastify.get(
    '/api/competencias',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const query = request.query as { area?: string; nivel?: string }

      const competencias = await prisma.competenciaBNCC.findMany({
        where: {
          ...(query.area ? { area_conhecimento: { contains: query.area, mode: 'insensitive' } } : {}),
          ...(query.nivel ? { nivel_educacional: { contains: query.nivel, mode: 'insensitive' } } : {}),
        },
        orderBy: [{ area_conhecimento: 'asc' }, { codigo: 'asc' }],
      })

      return reply.code(200).send({
        data: competencias.map((c: typeof competencias[number]) => ({
          id: c.id,
          codigo: c.codigo,
          descricao: c.descricao,
          area_conhecimento: c.area_conhecimento,
          nivel_educacional: c.nivel_educacional,
        })),
        total: competencias.length,
      })
    }
  )
}
