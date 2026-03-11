import { randomUUID } from 'crypto'

interface DownloadEntry {
  buffer: Buffer
  filename: string
  mimeType: string
  expiresAt: number
}

const tokens = new Map<string, DownloadEntry>()

// Cleanup expired tokens every minute
setInterval(() => {
  const now = Date.now()
  for (const [token, entry] of tokens) {
    if (entry.expiresAt < now) tokens.delete(token)
  }
}, 60_000)

export function criarToken(entry: Omit<DownloadEntry, 'expiresAt'>): string {
  const token = randomUUID()
  tokens.set(token, { ...entry, expiresAt: Date.now() + 10 * 60 * 1000 })
  return token
}

export function consumirToken(token: string): DownloadEntry | null {
  const entry = tokens.get(token)
  if (!entry) return null
  if (entry.expiresAt < Date.now()) {
    tokens.delete(token)
    return null
  }
  tokens.delete(token) // single-use
  return entry
}
