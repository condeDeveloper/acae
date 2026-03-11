import { config } from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// Carrega .env da raiz do monorepo (um nível acima do backend/)
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../../.env') })
import Fastify from 'fastify'
import prismaPlugin from './plugins/prisma.js'
import authPlugin from './plugins/auth.js'
import errorHandlerPlugin from './plugins/error-handler.js'
import attachProfessorPlugin from './hooks/attach-professor.js'
import turmasRoutes from './routes/turmas/index.js'
import alunosRoutes from './routes/alunos/index.js'
import registrosRoutes from './routes/registros/index.js'
import competenciasRoutes from './routes/competencias/index.js'
import contextosRoutes from './routes/contextos/index.js'
import documentosRoutes from './routes/documentos/index.js'
import authRoutes from './routes/auth/index.js'
import documentsRoutes from './routes/documents/index.js'
import downloadsRoutes from './routes/downloads/index.js'

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    // Nunca loga nomes de alunos — apenas IDs (LGPD)
    redact: ['req.headers.authorization'],
  },
})

async function build() {
  // Plugins
  await fastify.register(prismaPlugin)
  await fastify.register(authPlugin)
  await fastify.register(errorHandlerPlugin)
  await fastify.register(attachProfessorPlugin)

  // Rotas
  await fastify.register(turmasRoutes)
  await fastify.register(alunosRoutes)
  await fastify.register(registrosRoutes)
  await fastify.register(competenciasRoutes)
  await fastify.register(contextosRoutes)
  await fastify.register(documentosRoutes)
  await fastify.register(authRoutes)
  await fastify.register(documentsRoutes)
  await fastify.register(downloadsRoutes)

  // Health check (sem auth)
  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  return fastify
}

async function start() {
  try {
    const app = await build()
    const port = parseInt(process.env.PORT ?? '3000')
    const host = process.env.HOST ?? '0.0.0.0'

    await app.listen({ port, host })
    console.log(`✅ Servidor rodando em http://${host}:${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
