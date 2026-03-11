const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

export async function generateContent(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('Serviço de IA não configurado.')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
      signal: controller.signal,
    })

    if (response.status === 429) {
      const quotaError = new Error('Cota da API de IA atingida. Aguarde alguns minutos e tente novamente.')
      ;(quotaError as Error & { statusCode: number }).statusCode = 429
      throw quotaError
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      console.error(`[Groq] Erro HTTP ${response.status}: ${body}`)
      throw new Error(`Groq API error ${response.status}: ${body}`)
    }

    const data = await response.json() as { choices: { message: { content: string } }[] }
    const text = data.choices?.[0]?.message?.content
    if (!text) throw new Error('Resposta vazia do Groq')
    return text
  } catch (err: unknown) {
    const error = err as Error & { statusCode?: number }
    if (error.statusCode) throw error
    if (error.name === 'AbortError') {
      const timeoutError = new Error('A geração demorou mais que o esperado. Tente novamente.')
      ;(timeoutError as Error & { statusCode: number }).statusCode = 504
      throw timeoutError
    }
    console.error('[Groq] Erro inesperado:', error.message)
    const serviceError = new Error(`Serviço de IA temporariamente indisponível: ${error.message}`)
    ;(serviceError as Error & { statusCode: number }).statusCode = 503
    throw serviceError
  } finally {
    clearTimeout(timeout)
  }
}
