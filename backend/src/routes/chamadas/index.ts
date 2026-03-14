import type { FastifyInstance } from 'fastify'
import { prisma } from '../../plugins/prisma.js'
import { gerarPdf } from '../../services/pdf.service.js'

export default async function chamadasRoutes(fastify: FastifyInstance) {
  // ──────────────────────────────────────────────────────────────
  // GET /api/chamadas?turma_id=&data=YYYY-MM-DD
  // Retorna (ou cria) a chamada do dia para a turma.
  // Se não existir, cria um registro vazio com todos os alunos como ausentes.
  // ──────────────────────────────────────────────────────────────
  fastify.get(
    '/api/chamadas',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const professor = request.professor
      const query = request.query as { turma_id?: string; data?: string }

      if (!query.turma_id) {
        return reply.code(400).send({ error: 'turma_id é obrigatório' })
      }

      // Verifica que a turma pertence ao professor
      const turma = await prisma.turma.findFirst({
        where: { id: query.turma_id, professor_id: professor.id },
        include: {
          alunos: {
            where: { status: { not: 'excluido' } },
            orderBy: { nome: 'asc' },
            include: { avatar: true },
          },
        },
      })
      if (!turma) {
        return reply.code(404).send({ error: 'Turma não encontrada' })
      }

      const dataStr = query.data ?? new Date().toISOString().slice(0, 10)
      const dataObj = new Date(dataStr + 'T00:00:00.000Z')

      // Compara strings YYYY-MM-DD para evitar problemas de fuso horário
      const hojeStr = new Date().toISOString().slice(0, 10)
      const bloqueada = dataStr < hojeStr

      // Busca chamada existente (que já foi salva pelo professor)
      let chamada = await prisma.chamada.findUnique({
        where: { turma_id_data: { turma_id: query.turma_id, data: dataObj } },
        include: {
          presencas: { include: { aluno: { include: { avatar: true } } } },
        },
      })

      if (!chamada) {
        // Chamada nunca foi salva — retorna dados virtuais sem criar no banco
        // O professor verá todos os alunos em estado neutro (azul)
        return reply.code(200).send({
          chamada: {
            id: null,
            data: dataStr,
            turma_id: query.turma_id,
            turma_nome: turma.nome,
            bloqueada,
            novo: true,
            presencas: turma.alunos.map((a) => ({
              id: null,
              aluno_id: a.id,
              aluno_nome: a.nome,
              avatar_id: a.avatar_id,
              presente: false,
            })),
          },
        })
      }

      // Chamada já existe — garante que alunos novos na turma também apareçam
      const alunosNaChamada = new Set(chamada.presencas.map((p) => p.aluno_id))
      const alunosNovos = turma.alunos.filter((a) => !alunosNaChamada.has(a.id))
      if (alunosNovos.length > 0) {
        await prisma.presencaChamada.createMany({
          data: alunosNovos.map((a) => ({
            chamada_id: chamada!.id,
            aluno_id: a.id,
            presente: false,
          })),
        })
        chamada = await prisma.chamada.findUnique({
          where: { id: chamada.id },
          include: {
            presencas: { include: { aluno: { include: { avatar: true } } } },
          },
        })
      }

      return reply.code(200).send({
        chamada: {
          id: chamada!.id,
          data: dataStr,
          turma_id: query.turma_id,
          turma_nome: turma.nome,
          bloqueada,
          novo: false,
          presencas: chamada!.presencas
            .slice()
            .sort((a, b) => a.aluno.nome.localeCompare(b.aluno.nome))
            .map((p) => ({
              id: p.id,
              aluno_id: p.aluno_id,
              aluno_nome: p.aluno.nome,
              avatar_id: p.aluno.avatar_id,
              presente: p.presente,
            })),
        },
      })
    }
  )

  // ──────────────────────────────────────────────────────────────
  // PUT /api/chamadas/salvar
  // Cria (se necessário) e salva as presenças da chamada. Idempotente.
  // Body: { turma_id: string, data: 'YYYY-MM-DD', presencas: [{ aluno_id, presente }] }
  // ──────────────────────────────────────────────────────────────
  fastify.put(
    '/api/chamadas/salvar',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['turma_id', 'data', 'presencas'],
          properties: {
            turma_id: { type: 'string' },
            data: { type: 'string' },
            presencas: {
              type: 'array',
              items: {
                type: 'object',
                required: ['aluno_id', 'presente'],
                properties: {
                  aluno_id: { type: 'string' },
                  presente: { type: 'boolean' },
                },
                additionalProperties: false,
              },
            },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const professor = request.professor
      const body = request.body as { turma_id: string; data: string; presencas: { aluno_id: string; presente: boolean }[] }

      // Verifica que a turma pertence ao professor
      const turma = await prisma.turma.findFirst({
        where: { id: body.turma_id, professor_id: professor.id },
      })
      if (!turma) {
        return reply.code(404).send({ error: 'Turma não encontrada' })
      }

      const dataObj = new Date(body.data + 'T00:00:00.000Z')

      // Cria a chamada se ainda não existe
      let chamada = await prisma.chamada.findUnique({
        where: { turma_id_data: { turma_id: body.turma_id, data: dataObj } },
      })
      if (!chamada) {
        chamada = await prisma.chamada.create({
          data: {
            data: dataObj,
            turma_id: body.turma_id,
            professor_id: professor.id,
          },
        })
      }

      const chamadaId = chamada.id

      // Upsert presenças em lote
      await Promise.all(
        body.presencas.map((p) =>
          prisma.presencaChamada.upsert({
            where: { chamada_id_aluno_id: { chamada_id: chamadaId, aluno_id: p.aluno_id } },
            update: { presente: p.presente },
            create: { chamada_id: chamadaId, aluno_id: p.aluno_id, presente: p.presente },
          })
        )
      )

      await prisma.chamada.update({ where: { id: chamadaId }, data: { updated_at: new Date() } })

      return reply.code(200).send({ ok: true, id: chamadaId })
    }
  )

  // ──────────────────────────────────────────────────────────────
  // GET /api/chamadas/historico?turma_id=
  // Lista todas as chamadas (com contagem de presentes) de uma turma.
  // ──────────────────────────────────────────────────────────────
  fastify.get(
    '/api/chamadas/historico',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const professor = request.professor
      const query = request.query as { turma_id?: string }

      if (!query.turma_id) {
        return reply.code(400).send({ error: 'turma_id é obrigatório' })
      }

      // Verifica que a turma do professor
      const turma = await prisma.turma.findFirst({
        where: { id: query.turma_id, professor_id: professor.id },
      })
      if (!turma) {
        return reply.code(404).send({ error: 'Turma não encontrada' })
      }

      const chamadas = await prisma.chamada.findMany({
        where: { turma_id: query.turma_id, professor_id: professor.id },
        orderBy: { data: 'desc' },
        include: {
          presencas: { select: { presente: true } },
        },
      })

      return reply.code(200).send({
        historico: chamadas.map((c) => {
          const total = c.presencas.length
          const presentes = c.presencas.filter((p) => p.presente).length
          return {
            id: c.id,
            data: c.data.toISOString().slice(0, 10),
            turma_id: c.turma_id,
            total_alunos: total,
            presentes,
            ausentes: total - presentes,
          }
        }),
      })
    }
  )

  // ──────────────────────────────────────────────────────────────
  // GET /api/chamadas/:id/pdf
  // Gera e retorna o PDF da chamada do dia selecionado.
  // ──────────────────────────────────────────────────────────────
  fastify.get(
    '/api/chamadas/:id/pdf',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const professor = request.professor
      const { id } = request.params as { id: string }

      const chamada = await prisma.chamada.findFirst({
        where: { id, professor_id: professor.id },
        include: {
          turma: true,
          presencas: {
            include: { aluno: true },
            orderBy: { aluno: { nome: 'asc' } },
          },
        },
      })
      if (!chamada) {
        return reply.code(404).send({ error: 'Chamada não encontrada' })
      }

      const dataFormatada = new Date(chamada.data).toLocaleDateString('pt-BR', {
        timeZone: 'UTC',
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })

      const presentes = chamada.presencas.filter((p) => p.presente).length
      const ausentes = chamada.presencas.length - presentes

      const linhasTabela = chamada.presencas
        .map(
          (p, i) => `
          <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
            <td class="num">${i + 1}</td>
            <td class="nome">${p.aluno.nome}</td>
            <td class="status presente ${p.presente ? 'sim' : ''}">
              ${p.presente ? '✓' : ''}
            </td>
            <td class="status ausente ${!p.presente ? 'sim' : ''}">
              ${!p.presente ? '✗' : ''}
            </td>
          </tr>`
        )
        .join('')

      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Chamada — ${chamada.turma.nome} — ${dataFormatada}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a2e; font-size: 13px; padding: 32px; }
    .header { border-bottom: 3px solid #6c63ff; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 22px; font-weight: 900; color: #6c63ff; letter-spacing: -0.5px; }
    .header h2 { font-size: 15px; font-weight: 600; color: #444; margin-top: 4px; }
    .header p  { font-size: 12px; color: #888; margin-top: 2px; text-transform: capitalize; }
    .summary { display: flex; gap: 24px; margin-bottom: 20px; }
    .pill { padding: 6px 16px; border-radius: 20px; font-weight: 700; font-size: 13px; }
    .pill.total    { background: #ede7ff; color: #5b50cc; }
    .pill.presente { background: #e6f9ee; color: #1d7d45; }
    .pill.ausente  { background: #fff0f0; color: #c0392b; }
    table { width: 100%; border-collapse: collapse; }
    thead th { background: #6c63ff; color: #fff; padding: 10px 12px; text-align: left; font-size: 12px; letter-spacing: 0.04em; }
    th.status, td.status { text-align: center; width: 80px; }
    tr.even td { background: #fafafa; }
    tr.odd  td { background: #fff; }
    td { padding: 9px 12px; border-bottom: 1px solid #eee; }
    td.num { color: #aaa; font-size: 11px; width: 36px; }
    td.nome { font-weight: 500; }
    td.presente.sim { color: #1d7d45; font-size: 16px; font-weight: 800; }
    td.ausente.sim  { color: #c0392b; font-size: 16px; font-weight: 800; }
    .footer { margin-top: 32px; border-top: 1px solid #eee; padding-top: 12px; font-size: 11px; color: #aaa; text-align: right; }
  </style>
</head>
<body>
  <div class="header">
    <h1>ACAE — Portal do Professor</h1>
    <h2>Chamada: ${chamada.turma.nome}</h2>
    <p>${dataFormatada}</p>
  </div>
  <div class="summary">
    <span class="pill total">Total: ${chamada.presencas.length}</span>
    <span class="pill presente">Presentes: ${presentes}</span>
    <span class="pill ausente">Ausentes: ${ausentes}</span>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Aluno</th>
        <th class="status">Presente</th>
        <th class="status">Ausente</th>
      </tr>
    </thead>
    <tbody>
      ${linhasTabela}
    </tbody>
  </table>
  <div class="footer">Gerado em ${new Date().toLocaleString('pt-BR')} — ACAE Portal do Professor</div>
</body>
</html>`

      const pdfBuffer = await gerarPdf(html)

      const nomeTurma = chamada.turma.nome.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      const dataStr = chamada.data.toISOString().slice(0, 10)
      const filename = `chamada_${nomeTurma}_${dataStr}.pdf`

      reply.header('Content-Type', 'application/pdf')
      reply.header('Content-Disposition', `attachment; filename="${filename}"`)
      return reply.send(pdfBuffer)
    }
  )
}
