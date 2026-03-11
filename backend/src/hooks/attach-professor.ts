import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { prisma } from '../plugins/prisma.js'

declare module 'fastify' {
  interface FastifyRequest {
    professor: {
      id: string
      nome: string
      email: string
      papel: string
      escola: string
    }
  }
}

export default fp(async function attachProfessorPlugin(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request, reply) => {
    // Rotas públicas — sem autenticação
    if (
      request.method === 'OPTIONS' ||
      request.url.startsWith('/api/downloads/') ||
      request.url === '/health' ||
      request.url === '/api/auth/register'
    ) return

    try {
      const auth = request.headers.authorization
      if (!auth?.startsWith('Bearer ')) throw new Error('No token')
      const payload = await fastify.verifyJwt(auth.slice(7))
      const userId = payload.sub

      const professor = await prisma.professor.findUnique({
        where: { supabase_user_id: userId },
        select: { id: true, nome: true, email: true, papel: true, escola: true },
      })

      if (!professor) {
        return reply.code(401).send({ error: 'Professor não encontrado' })
      }

      request.professor = professor
    } catch {
      return reply.code(401).send({ error: 'Token inválido ou expirado' })
    }
  })
})
