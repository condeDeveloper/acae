import fp from 'fastify-plugin'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

export default fp(async function authPlugin(fastify: FastifyInstance) {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET
  if (!jwtSecret) {
    throw new Error('SUPABASE_JWT_SECRET não está definido nas variáveis de ambiente')
  }

  await fastify.register(jwt, {
    secret: jwtSecret,
    sign: { algorithm: 'HS256' },
  })

  await fastify.register(rateLimit, {
    global: false, // apply per-route with config.rateLimit
    max: 100,
    timeWindow: '1 minute',
  })

  fastify.decorate(
    'authenticate',
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify()
      } catch {
        reply.code(401).send({ error: 'Token inválido ou expirado' })
      }
    }
  )
})
