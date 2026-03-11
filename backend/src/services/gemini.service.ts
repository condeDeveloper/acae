import { GoogleGenAI } from '@google/genai'

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  console.warn('[Gemini] GEMINI_API_KEY não configurada — geração de documentos indisponível')
}

const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null
const MODEL = 'gemini-2.0-flash'

export async function generateContent(prompt: string): Promise<string> {
  if (!genAI) {
    throw new Error('Serviço de IA não configurado.')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  try {
    const response = await genAI.models.generateContent({
      model: MODEL,
      contents: prompt,
    })

    const text = response.text
    if (!text) throw new Error('Resposta vazia do Gemini')
    return text
  } catch (err: unknown) {
    const error = err as Error & { status?: number }
    if (error.name === 'AbortError' || error.message?.includes('abort')) {
      const timeoutError = new Error('A geração demorou mais que o esperado. Tente novamente.')
      ;(timeoutError as Error & { statusCode: number }).statusCode = 504
      throw timeoutError
    }
    if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('quota')) {
      const quotaError = new Error('Cota da API de IA atingida. Aguarde alguns minutos e tente novamente.')
      ;(quotaError as Error & { statusCode: number }).statusCode = 429
      throw quotaError
    }
    const serviceError = new Error('Serviço de IA temporariamente indisponível.')
    ;(serviceError as Error & { statusCode: number }).statusCode = 503
    throw serviceError
  } finally {
    clearTimeout(timeout)
  }
}
