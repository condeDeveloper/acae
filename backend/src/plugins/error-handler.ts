import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyError } from 'fastify'

export default fp(async function errorHandlerPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler(function (error: FastifyError, _request, reply) {
    const statusCode = error.statusCode ?? 500

    if (statusCode >= 500) {
      fastify.log.error(error)
    } else {
      fastify.log.warn(error)
    }

    reply.code(statusCode).send({
      error: error.message ?? 'Erro interno do servidor',
      ...(error.validation
        ? {
            details: error.validation.map((v) => ({
              field: v.instancePath?.replace('/', '') ?? v.params?.missingProperty ?? 'desconhecido',
              message: v.message ?? 'Valor inválido',
            })),
          }
        : {}),
    })
  })
})
