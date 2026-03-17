import { prisma } from '../plugins/prisma.js'

const DAILY_LIMIT = 14400
const WARNING_THRESHOLD = 13000

export class QuotaExceededError extends Error {
  statusCode = 429
  retornaEm: string

  constructor() {
    const midnight = new Date()
    midnight.setUTCHours(3, 0, 0, 0) // midnight BRT = 03:00 UTC
    if (midnight <= new Date()) midnight.setUTCDate(midnight.getUTCDate() + 1)
    super('Limite diário de geração atingido. Retorna à meia-noite (Brasília).')
    this.retornaEm = midnight.toISOString()
  }
}

function todayBRT(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

export async function checkQuota(): Promise<number> {
  const today = todayBRT()
  const cota = await prisma.controleCotas.findUnique({
    where: { data: new Date(today) },
  })
  const count = cota?.contagem_requisicoes ?? 0
  if (count >= DAILY_LIMIT) throw new QuotaExceededError()
  return DAILY_LIMIT - count
}

export async function incrementQuota(): Promise<number> {
  const today = todayBRT()
  const now = new Date()
  const cota = await prisma.controleCotas.upsert({
    where: { data: new Date(today) },
    create: { data: new Date(today), contagem_requisicoes: 1, ultima_requisicao_em: now },
    update: { contagem_requisicoes: { increment: 1 }, ultima_requisicao_em: now },
  })
  return cota.contagem_requisicoes
}

export function isQuotaWarning(remaining: number): boolean {
  return remaining <= DAILY_LIMIT - WARNING_THRESHOLD
}

export async function getQuotaInfo(): Promise<{
  restante: number
  total: number
  percentual_restante: number
  bloqueado: boolean
  retorna_em?: string
}> {
  const today = todayBRT()
  const cota = await prisma.controleCotas.findUnique({
    where: { data: new Date(today) },
  })
  const count = cota?.contagem_requisicoes ?? 0
  const restante = Math.max(0, DAILY_LIMIT - count)
  const percentual_restante = Math.round((restante / DAILY_LIMIT) * 100)
  const bloqueado = restante === 0

  if (bloqueado) {
    const midnight = new Date()
    midnight.setUTCHours(3, 0, 0, 0)
    if (midnight <= new Date()) midnight.setUTCDate(midnight.getUTCDate() + 1)
    return { restante: 0, total: DAILY_LIMIT, percentual_restante: 0, bloqueado: true, retorna_em: midnight.toISOString() }
  }

  return { restante, total: DAILY_LIMIT, percentual_restante, bloqueado: false }
}
