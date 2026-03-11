import type { FastifyInstance } from 'fastify'

export default async function authRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/auth/me
   * Returns the authenticated professor's profile.
   * Rate limited to 5 requests / 15 min.
   */
  fastify.get(
    '/api/auth/me',
    {
      config: {
        rateLimit: { max: 5, timeWindow: '15 minutes' },
      },
    },
    async (request) => {
      const p = request.professor
      return {
        id: p.id,
        nome: p.nome,
        email: p.email,
        papel: p.papel,
        escola: p.escola,
      }
    },
  )

  /**
   * POST /api/auth/logout
   * Stateless logout — JWT is invalidated by Supabase client.
   * Backend just acknowledges.
   */
  fastify.post('/api/auth/logout', async (_request, reply) => {
    return reply.code(204).send()
  })
}
