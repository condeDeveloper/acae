import type { FastifyInstance } from 'fastify'
import { prisma } from '../../plugins/prisma.js'

export default async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/auth/register
   * Creates a professor profile after Supabase sign-up or Google OAuth.
   * Does NOT require an existing professor record — validates JWT directly.
   */
  fastify.post('/api/auth/register', async (request, reply) => {
    const auth = request.headers.authorization
    if (!auth?.startsWith('Bearer ')) return reply.code(401).send({ error: 'Token obrigatório' })

    let payload: { sub: string; email?: string; user_metadata?: { full_name?: string; name?: string } }
    try {
      payload = await fastify.verifyJwt(auth.slice(7)) as typeof payload
    } catch {
      return reply.code(401).send({ error: 'Token inválido' })
    }

    const body = request.body as { nome?: string; escola?: string }
    const nome = body.nome
      || payload.user_metadata?.full_name
      || payload.user_metadata?.name
      || 'Professor'
    const email = (payload.email as string | undefined) ?? ''
    const supabase_user_id = payload.sub

    // Upsert by supabase_user_id. If email already exists with a different UID
    // (e.g. seeded/migrated account), re-link by updating the supabase_user_id.
    let professor
    try {
      professor = await prisma.professor.upsert({
        where: { supabase_user_id },
        create: { supabase_user_id, nome, email, escola: body.escola ?? '' },
        update: {},
        select: { id: true, nome: true, email: true, papel: true, escola: true, onboarding_concluido: true },
      })
    } catch (e: unknown) {
      // P2002 = unique constraint violation (email already taken by different UID)
      const prismaErr = e as { code?: string }
      if (prismaErr?.code === 'P2002' && email) {
        professor = await prisma.professor.update({
          where: { email },
          data: { supabase_user_id },
          select: { id: true, nome: true, email: true, papel: true, escola: true, onboarding_concluido: true },
        })
      } else {
        throw e
      }
    }

    return reply.code(201).send(professor)
  })

  /**
   * GET /api/auth/me
   * Returns the authenticated professor's profile.
   * Rate limited to 60 requests / 15 min (allows multiple tabs and page refreshes).
   */
  fastify.get(
    '/api/auth/me',
    {
      config: {
        rateLimit: { max: 60, timeWindow: '15 minutes' },
      },
    },
    async (request) => {
      const p = request.professor
      // Fetch full profile including onboarding_concluido (not in professor middleware by default)
      const full = await prisma.professor.findUnique({
        where: { id: p.id },
        select: { id: true, nome: true, email: true, papel: true, escola: true, onboarding_concluido: true },
      })
      return full
    },
  )

  /**
   * PATCH /api/auth/onboarding
   * Completes the onboarding: saves escola and marks onboarding_concluido = true.
   */
  fastify.patch('/api/auth/onboarding', async (request) => {
    const p = request.professor
    const body = request.body as { escola?: string }
    const updated = await prisma.professor.update({
      where: { id: p.id },
      data: {
        escola: body.escola ?? p.escola,
        onboarding_concluido: true,
      },
      select: { id: true, nome: true, email: true, papel: true, escola: true, onboarding_concluido: true },
    })
    return updated
  })

  /**
   * POST /api/auth/logout
   * Stateless logout — JWT is invalidated by Supabase client.
   * Backend just acknowledges.
   */
  fastify.post('/api/auth/logout', async (_request, reply) => {
    return reply.code(204).send()
  })
}
