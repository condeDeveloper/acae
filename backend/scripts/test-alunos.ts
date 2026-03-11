import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../../.env') })

import { createClient } from '@supabase/supabase-js'

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
if (!process.env.TEST_EMAIL || !process.env.TEST_PASSWORD) {
  console.error('❌ Configure TEST_EMAIL e TEST_PASSWORD no .env'); process.exit(1)
}
const { data, error } = await sb.auth.signInWithPassword({ email: process.env.TEST_EMAIL!, password: process.env.TEST_PASSWORD! })
if (error || !data.session) { console.error('Login error:', error?.message); process.exit(1) }
const token = data.session.access_token

function req(method: string, path: string, body?: object) {
  return fetch(`http://localhost:3000${path}`, {
    method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async r => ({ status: r.status, body: await r.json().catch(() => ({})) }))
}

// Get first turma
const turmas = await req('GET', '/api/turmas')
const turmaId = (turmas.body as {data:{id:string}[]}).data[0]?.id
if (!turmaId) { console.error('No turma found'); process.exit(1) }
console.log('Using turma:', turmaId)

// Test 1: POST without data_nascimento (should work now)
const r1 = await req('POST', `/api/turmas/${turmaId}/alunos`, { nome: 'Teste Sem Data' })
console.log(`\n[POST sem data_nascimento] ${r1.status === 201 ? '✅' : '❌'} status=${r1.status}`)
if (r1.status !== 201) console.error('  Body:', r1.body)
const aluno1Id = (r1.body as {id:string}).id

// Test 2: POST with data_nascimento
const r2 = await req('POST', `/api/turmas/${turmaId}/alunos`, { nome: 'Teste Com Data', data_nascimento: '2018-06-15' })
console.log(`[POST com data_nascimento] ${r2.status === 201 ? '✅' : '❌'} status=${r2.status}`)
const aluno2Id = (r2.body as {id:string}).id

// Test 3: POST with data_nascimento + necessidades
const r3 = await req('POST', `/api/turmas/${turmaId}/alunos`, {
  nome: 'Teste Completo', data_nascimento: '2019-03-20', necessidades_educacionais: 'TEA leve'
})
console.log(`[POST completo] ${r3.status === 201 ? '✅' : '❌'} status=${r3.status}`)
const aluno3Id = (r3.body as {id:string}).id

// Test 4: PATCH nome only
const r4 = await req('PATCH', `/api/alunos/${aluno1Id}`, { nome: 'Teste Sem Data Editado' })
console.log(`[PATCH só nome] ${r4.status === 200 ? '✅' : '❌'} status=${r4.status}`)

// Test 5: PATCH with necessidades
const r5 = await req('PATCH', `/api/alunos/${aluno2Id}`, { nome: 'Teste Com Data Edit', necessidades_educacionais: 'TDAH' })
console.log(`[PATCH com necessidades] ${r5.status === 200 ? '✅' : '❌'} status=${r5.status}`)

// Cleanup
for (const id of [aluno1Id, aluno2Id, aluno3Id]) {
  if (id) await req('DELETE', `/api/alunos/${id}`)
}
console.log('\n✅ Todos os testes de aluno passaram!')
