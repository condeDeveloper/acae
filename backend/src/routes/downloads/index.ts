import type { FastifyInstance } from 'fastify'
import { consumirToken } from '../../services/download-token.service.js'

export default async function downloadsRoutes(fastify: FastifyInstance) {
  // Esta rota é pública — o token de download é de uso único e expira em 10min.
  fastify.get<{ Params: { token: string } }>(
    '/api/downloads/:token',
    async (request, reply) => {
      const { token } = request.params
      const entry = consumirToken(token)

      if (!entry) {
        return reply.code(404).send({ error: 'Token inválido ou expirado' })
      }

      return reply
        .header('Content-Type', entry.mimeType)
        .header('Content-Disposition', `attachment; filename="${entry.filename}"`)
        .send(entry.buffer)
    }
  )
}
