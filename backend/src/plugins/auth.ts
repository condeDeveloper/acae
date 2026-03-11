import fp from 'fastify-plugin'
import rateLimit from '@fastify/rate-limit'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    verifyJwt: (token: string) => Promise<{ sub: string; [k: string]: unknown }>
  }
}

export default fp(async function authPlugin(fastify: FastifyInstance) {
  const supabaseUrl = process.env.SUPABASE_URL
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL não está definido nas variáveis de ambiente')
  }

  // Supabase uses ES256 asymmetric signing — verify via the project's JWKS endpoint.
  // This works automatically for all key rotations and both HS256 and ES256 projects.
  const JWKS = createRemoteJWKSet(
    new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`)
  )

  fastify.decorate(
    'verifyJwt',
    async function (token: string) {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: `${supabaseUrl}/auth/v1`,
        audience: 'authenticated',
      })
      return payload as { sub: string; [k: string]: unknown }
    }
  )

  await fastify.register(rateLimit, {
    global: false,
    max: 100,
    timeWindow: '1 minute',
  })

  fastify.decorate(
    'authenticate',
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        const auth = request.headers.authorization
        if (!auth?.startsWith('Bearer ')) throw new Error('No token')
        const token = auth.slice(7)
        await fastify.verifyJwt(token)
      } catch {
        reply.code(401).send({ error: 'Token inválido ou expirado' })
      }
    }
  )
})
