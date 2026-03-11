import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../../.env') })

import { createClient } from '@supabase/supabase-js'

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
const { data, error } = await sb.auth.signInWithPassword({ email: 'professor@acae.edu.br', password: 'Acae@2026!' })
if (error || !data.session) { console.error('Login error:', error?.message); process.exit(1) }
const token = data.session.access_token

function req(method: string, path: string, body?: object) {
  return fetch(`http://localhost:3000${path}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async r => ({ status: r.status, body: await r.json().catch(() => null) }))
}

let passed = 0, failed = 0
function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) { console.log(`  ✅ ${label}`); passed++ }
  else { console.log(`  ❌ ${label}`); if (detail) console.log('     ', JSON.stringify(detail).slice(0, 300)); failed++ }
}

// ── 1. TURMAS ──────────────────────────────────────────────
console.log('\n=== 1. Turmas ===')
const turmasRes = await req('GET', '/api/turmas')
const turmaId = (turmasRes.body as { data: { id: string }[] }).data[0]?.id
check('GET /api/turmas → 200', turmasRes.status === 200 && !!turmaId, turmasRes.body)

// ── 2. ALUNOS ──────────────────────────────────────────────
console.log('\n=== 2. Adicionar Aluno ===')

// Só nome (sem data, sem necessidades)
const a1 = await req('POST', `/api/turmas/${turmaId}/alunos`, { nome: 'Teste Só Nome' })
check('POST aluno só nome → 201', a1.status === 201, a1.body)
const a1Id = (a1.body as { id?: string })?.id

// Com data + necessidades
const a2 = await req('POST', `/api/turmas/${turmaId}/alunos`, {
  nome: 'Teste Completo',
  data_nascimento: '2018-06-15',
  necessidades_educacionais: 'TEA leve',
})
check('POST aluno completo → 201', a2.status === 201, a2.body)
const a2Id = (a2.body as { id?: string })?.id

// PATCH
if (a1Id) {
  const p = await req('PATCH', `/api/alunos/${a1Id}`, { nome: 'Teste Editado' })
  check('PATCH aluno → 200', p.status === 200, p.body)
}

// Listar alunos da turma
const la = await req('GET', `/api/turmas/${turmaId}/alunos`)
check('GET alunos turma → 200', la.status === 200, { total: (la.body as { total: number }).total })

// ── 3. REGISTROS ───────────────────────────────────────────
console.log('\n=== 3. Registros ===')
const alunoId = a2Id! // usar aluno completo

// Pegar competências
const bnccRes = await req('GET', '/api/competencias')
const bnccRefs: string[] = ((bnccRes.body as { data?: { codigo: string }[] })?.data ?? []).slice(0, 2).map(c => c.codigo)
check('Competências BNCC disponíveis', bnccRefs.length > 0, { refs: bnccRefs })

// Criar registro
const r1 = await req('POST', `/api/alunos/${alunoId}/registros`, {
  periodo: '2026-03-03',
  objetivos: 'Desenvolver habilidades de coordenação motora e linguagem oral.',
  atividades: 'Atividades de pintura, leitura compartilhada e brincadeiras dirigidas.',
  mediacoes: 'Apoio individualizado durante as atividades de escrita.',
  ocorrencias: 'Nenhuma ocorrência relevante.',
  bncc_refs: bnccRefs,
})
check('POST registro → 201', r1.status === 201, r1.body)
const reg1Id = (r1.body as { id?: string })?.id

// Segundo registro
const r2 = await req('POST', `/api/alunos/${alunoId}/registros`, {
  periodo: '2026-03-10',
  objetivos: 'Consolidar aprendizados da semana anterior e introduzir novos conceitos.',
  atividades: 'Jogos cooperativos, contação de histórias e atividades de grupo.',
  bncc_refs: bnccRefs,
})
check('POST segundo registro → 201', r2.status === 201, r2.body)
const reg2Id = (r2.body as { id?: string })?.id

// GET detalhe
if (reg1Id) {
  const d = await req('GET', `/api/registros/${reg1Id}`)
  check('GET detalhe registro → 200', d.status === 200 && !!(d.body as { objetivos?: string })?.objetivos, d.body)
}

// PATCH registro
if (reg1Id) {
  const p = await req('PATCH', `/api/registros/${reg1Id}`, { objetivos: 'Objetivos atualizados pelo teste.' })
  check('PATCH registro → 200', p.status === 200, p.body)
}

// Listar registros
const lr = await req('GET', `/api/alunos/${alunoId}/registros`)
check('GET lista registros → 200 com 2', lr.status === 200 && (lr.body as { total: number }).total === 2)

// ── 4. GERAR DOCUMENTO ────────────────────────────────────
console.log('\n=== 4. Gerar Documento / Relatório ===')

// Com registros no período
const gen = await req('POST', '/api/documents/generate', {
  tipo: 'portfolio_semanal',
  aluno_id: alunoId,
  bncc_refs: bnccRefs,
  periodo_inicio: '2026-03-01',
  periodo_fim: '2026-03-31',
})
if (gen.status === 200 || gen.status === 201) {
  check('Gerar documento → sucesso', true)
  const rascunhoId = (gen.body as { rascunho?: { id: string } })?.rascunho?.id
  if (rascunhoId) {
    const save = await req('PATCH', `/api/documents/rascunhos/${rascunhoId}`, { conteudo_editado: 'Editado pelo teste.' })
    check('Auto-save rascunho → 200', save.status === 200)
  }
} else if (gen.status === 429 || gen.status === 503) {
  console.log(`  ⚠️  Geração retornou ${gen.status} — cota da API Gemini atingida (não é bug de código)`)
  passed++
} else {
  check('Gerar documento → esperava 200/201/429/503', false, { status: gen.status, body: gen.body })
}

// Sem registros no período → deve ser 422 (não 500)
const gen2 = await req('POST', '/api/documents/generate', {
  tipo: 'portfolio_semanal',
  aluno_id: alunoId,
  bncc_refs: bnccRefs,
  periodo_inicio: '2025-01-01',
  periodo_fim: '2025-01-31',
})
check('Gerar sem registros → 422 (não 500!)', gen2.status === 422, gen2.body)

// ── CLEANUP ────────────────────────────────────────────────
console.log('\n=== Cleanup ===')
for (const id of [reg1Id, reg2Id]) { if (id) await req('DELETE', `/api/registros/${id}`) }
for (const id of [a1Id, a2Id])     { if (id) await req('DELETE', `/api/alunos/${id}`) }
console.log('  Dados de teste removidos')

// ── RESULTADO ──────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`)
console.log(`Resultado: ${passed} passaram, ${failed} falharam`)
if (failed > 0) { console.log('❌ Alguns testes falharam!'); process.exit(1) }
else console.log('✅ Todos os testes passaram!')
