import type { FastifyInstance } from 'fastify'
import { prisma } from '../../plugins/prisma.js'
import { generateContent } from '../../services/gemini.service.js'

const TIPO_LABELS: Record<string, string> = {
  recado: 'Recado',
  advertencia: 'Advertência',
  suspensao: 'Suspensão',
}

export default async function ocorrenciasRoutes(fastify: FastifyInstance) {
  // POST /api/ocorrencias/gerar
  fastify.post('/api/ocorrencias/gerar', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['aluno_id', 'tipo', 'motivo'],
        properties: {
          aluno_id: { type: 'string' },
          tipo: { type: 'string', enum: ['recado', 'advertencia', 'suspensao'] },
          motivo: { type: 'string', minLength: 10, maxLength: 2000 },
        },
        additionalProperties: false,
      },
    },
  }, async (request, reply) => {
    const professor = request.professor
    const { aluno_id, tipo, motivo } = request.body as {
      aluno_id: string
      tipo: 'recado' | 'advertencia' | 'suspensao'
      motivo: string
    }

    const aluno = await prisma.aluno.findFirst({
      where: { id: aluno_id, turma: { professor_id: professor.id }, status: 'ativo' },
      include: { turma: { select: { nome: true } } },
    })
    if (!aluno) return reply.code(404).send({ error: 'Aluno não encontrado ou sem permissão.' })

    const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    const tipoLabel = TIPO_LABELS[tipo]

    let idadeTexto = ''
    if (aluno.data_nascimento) {
      const agora = new Date()
      const nascimento = new Date(aluno.data_nascimento)
      const anos = agora.getFullYear() - nascimento.getFullYear()
      idadeTexto = `, ${anos} anos`
    }

    const instrucoesPorTipo: Record<string, string> = {
      recado: 'Escreva um recado cordial e informativo para os responsáveis, em tom amigável e profissional. Máximo 150 palavras no corpo.',
      advertencia: 'Escreva uma advertência formal, descrevendo a ocorrência, as orientações dadas e as consequências caso o comportamento se repita. Tom firme, respeitoso e pedagógico. Máximo 200 palavras no corpo.',
      suspensao: 'Escreva uma comunicação de suspensão, descrevendo a gravidade da ocorrência, o período de suspensão (deixar um espaço em branco para preenchimento posterior), as orientações para retorno e as condições para o acompanhamento. Tom formal e respeitoso. Máximo 250 palavras no corpo.',
    }

    const prompt = `Você é um pedagogo especialista em educação. Redija um documento formal de "${tipoLabel}" escolar seguindo as normas pedagógicas brasileiras.

Dados:
- Escola: ${professor.escola}
- Professor(a): ${professor.nome}
- Turma: ${aluno.turma.nome}
- Aluno(a): ${aluno.nome}${idadeTexto}
- Tipo de ocorrência: ${tipoLabel}
- Data: ${hoje}
- Motivo informado: ${motivo}

Instruções:
- ${instrucoesPorTipo[tipo]}
- Use linguagem formal brasileira, clara e objetiva.
- Inclua cabeçalho com nome da escola, data e tipo do documento.
- Inclua espaço para assinatura da escola e do responsável no final.
- NÃO adicione comentários, explicações ou textos fora do documento.

Responda APENAS com o texto completo do documento formatado como texto simples com quebras de linha.`

    const texto = await generateContent(prompt)

    return reply.code(200).send({
      aluno: { id: aluno.id, nome: aluno.nome, turma: aluno.turma.nome },
      tipo,
      tipo_label: tipoLabel,
      texto_gerado: texto.trim(),
    })
  })
}
