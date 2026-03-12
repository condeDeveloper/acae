import type { FastifyInstance } from 'fastify'
import { prisma } from '../../plugins/prisma.js'
import { generateContent } from '../../services/gemini.service.js'

export default async function atividadesRoutes(fastify: FastifyInstance) {

  // GET /api/atividades — lista todas com filtros
  fastify.get(
    '/api/atividades',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const query = request.query as {
        area?: string
        nivel?: string
        dificuldade?: string
        limit?: string
      }

      const atividades = await prisma.atividadeBNCC.findMany({
        where: {
          ...(query.area ? { area_conhecimento: { contains: query.area, mode: 'insensitive' } } : {}),
          ...(query.nivel ? { nivel_educacional: { contains: query.nivel, mode: 'insensitive' } } : {}),
          ...(query.dificuldade ? { dificuldade: query.dificuldade } : {}),
        },
        orderBy: [{ area_conhecimento: 'asc' }, { titulo: 'asc' }],
        take: query.limit ? Math.min(200, parseInt(query.limit)) : 200,
      })

      return reply.code(200).send({ data: atividades, total: atividades.length })
    }
  )

  // GET /api/atividades/areas — lista áreas únicas para filtros
  fastify.get(
    '/api/atividades/areas',
    { preHandler: [fastify.authenticate] },
    async (_request, reply) => {
      const areas = await prisma.atividadeBNCC.findMany({
        select: { area_conhecimento: true, nivel_educacional: true },
        distinct: ['area_conhecimento', 'nivel_educacional'],
        orderBy: [{ area_conhecimento: 'asc' }, { nivel_educacional: 'asc' }],
      })

      // Agrupa por área
      const agrupado: Record<string, string[]> = {}
      for (const a of areas) {
        if (!agrupado[a.area_conhecimento]) agrupado[a.area_conhecimento] = []
        if (!agrupado[a.area_conhecimento].includes(a.nivel_educacional)) {
          agrupado[a.area_conhecimento].push(a.nivel_educacional)
        }
      }

      return reply.code(200).send({ data: agrupado })
    }
  )

  // POST /api/alunos/:alunoId/atividades/gerar
  // Sorteia N atividades baseadas em filtros e perfil do aluno
  fastify.post(
    '/api/alunos/:alunoId/atividades/gerar',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['quantidade'],
          properties: {
            quantidade: { type: 'integer', minimum: 1, maximum: 20 },
            area_conhecimento: { type: 'string' },
            nivel_educacional: { type: 'string' },
            dificuldade: { type: 'string', enum: ['basica', 'intermediaria', 'avancada'] },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const professor = request.professor
      const { alunoId } = request.params as { alunoId: string }
      const body = request.body as {
        quantidade: number
        area_conhecimento?: string
        nivel_educacional?: string
        dificuldade?: string
      }

      // Verifica se o aluno pertence a uma turma do professor
      const aluno = await prisma.aluno.findFirst({
        where: {
          id: alunoId,
          turma: { professor_id: professor.id },
          status: 'ativo',
        },
        include: { turma: { select: { nome: true } } },
      })

      if (!aluno) {
        return reply.code(404).send({ error: 'Aluno não encontrado ou sem permissão.' })
      }

      // Busca atividades com filtros aplicados
      const candidatas = await prisma.atividadeBNCC.findMany({
        where: {
          ...(body.area_conhecimento ? { area_conhecimento: { contains: body.area_conhecimento, mode: 'insensitive' } } : {}),
          ...(body.nivel_educacional ? { nivel_educacional: { contains: body.nivel_educacional, mode: 'insensitive' } } : {}),
          ...(body.dificuldade ? { dificuldade: body.dificuldade } : {}),
        },
      })

      if (candidatas.length === 0) {
        return reply.code(404).send({ error: 'Nenhuma atividade encontrada com os filtros selecionados.' })
      }

      // Embaralha e sorteia N atividades (Fisher-Yates)
      const embaralhadas = [...candidatas]
      for (let i = embaralhadas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[embaralhadas[i], embaralhadas[j]] = [embaralhadas[j], embaralhadas[i]]
      }

      const sorteadas = embaralhadas.slice(0, Math.min(body.quantidade, embaralhadas.length))

      return reply.code(200).send({
        aluno: { id: aluno.id, nome: aluno.nome, turma: aluno.turma.nome },
        atividades: sorteadas,
        total_sorteadas: sorteadas.length,
        total_disponiveis: candidatas.length,
      })
    }
  )

  // POST /api/atividades/:id/adaptar-ia
  // Usa IA para personalizar uma atividade ao perfil do aluno
  fastify.post(
    '/api/atividades/:id/adaptar-ia',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['aluno_id'],
          properties: {
            aluno_id: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const professor = request.professor
      const { id } = request.params as { id: string }
      const { aluno_id } = request.body as { aluno_id: string }

      // Busca atividade e aluno em paralelo
      const [atividade, aluno] = await Promise.all([
        prisma.atividadeBNCC.findUnique({ where: { id } }),
        prisma.aluno.findFirst({
          where: {
            id: aluno_id,
            turma: { professor_id: professor.id },
            status: 'ativo',
          },
        }),
      ])

      if (!atividade) return reply.code(404).send({ error: 'Atividade não encontrada.' })
      if (!aluno) return reply.code(404).send({ error: 'Aluno não encontrado ou sem permissão.' })

      // Calcula idade do aluno se disponível
      let idadeTexto = ''
      if (aluno.data_nascimento) {
        const hoje = new Date()
        const nascimento = new Date(aluno.data_nascimento)
        const anos = hoje.getFullYear() - nascimento.getFullYear()
        idadeTexto = `${anos} anos`
      }

      const prompt = `Você é um pedagogo especializado em Educação Especial e Inclusiva.

Adapte a atividade pedagógica abaixo para um aluno específico, respeitando suas necessidades educacionais.

## ALUNO
- Nome: ${aluno.nome}${idadeTexto ? ` (${idadeTexto})` : ''}
- Necessidades educacionais: ${aluno.necessidades_educacionais ?? 'Não informadas'}

## ATIVIDADE ORIGINAL
Título: ${atividade.titulo}
Área: ${atividade.area_conhecimento}
Nível: ${atividade.nivel_educacional}
Dificuldade: ${atividade.dificuldade}
Descrição: ${atividade.descricao}
Como fazer: ${atividade.como_fazer}
Materiais: ${atividade.materiais ?? 'Não especificados'}

## INSTRUÇÕES
1. Mantenha o objetivo pedagógico central da atividade
2. Adapte linguagem, passos e materiais ao perfil do aluno
3. Sugira adaptações específicas para as necessidades indicadas
4. Se necessário, simplifique ou enriqueça os passos
5. Seja prático e direto

## FORMATO DE RESPOSTA (JSON)
{
  "titulo_adaptado": "...",
  "descricao_adaptada": "...",
  "como_fazer_adaptado": "...",
  "materiais_adaptados": "...",
  "dicas_especificas": "...",
  "nivel_adaptado": "basica | intermediaria | avancada"
}

Responda APENAS com o JSON válido, sem explicações adicionais.`

      let adaptacao: {
        titulo_adaptado: string
        descricao_adaptada: string
        como_fazer_adaptado: string
        materiais_adaptados: string
        dicas_especificas: string
        nivel_adaptado: string
      }

      try {
        const resposta = await generateContent(prompt)
        // Extrai JSON da resposta (caso venha com texto extra)
        const jsonMatch = resposta.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error('Resposta da IA não contém JSON válido')
        adaptacao = JSON.parse(jsonMatch[0])
      } catch (err) {
        const error = err as Error & { statusCode?: number }
        if (error.statusCode) throw error
        return reply.code(500).send({ error: 'Erro ao processar resposta da IA. Tente novamente.' })
      }

      return reply.code(200).send({
        atividade_original: {
          id: atividade.id,
          titulo: atividade.titulo,
          area_conhecimento: atividade.area_conhecimento,
          bncc_refs: atividade.bncc_refs,
        },
        aluno: { id: aluno.id, nome: aluno.nome },
        adaptacao,
      })
    }
  )
}
