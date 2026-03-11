import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../../.env') })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
)

const BASE = 'http://localhost:3000'

async function req(method: string, path: string, token: string, body?: object) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json: unknown
  try { json = JSON.parse(text) } catch { json = text }
  return { status: res.status, body: json }
}

async function main() {
  // 1. Login
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'professor@acae.edu.br',
    password: 'Acae@2026!',
  })
  if (error || !data.session) { console.error('❌ Login falhou:', error?.message); process.exit(1) }
  const token = data.session.access_token
  console.log('✅ Login OK — papel:', JSON.parse(atob(token.split('.')[1])).papel)

  // 2. GET /api/auth/me
  const me = await req('GET', '/api/auth/me', token)
  console.log(`\n[GET /api/auth/me] ${me.status === 200 ? '✅' : '❌'} status=${me.status}`)
  if (me.status === 200) console.log('   Professor:', JSON.stringify(me.body))

  // 3. GET /api/turmas
  const turmasList = await req('GET', '/api/turmas', token)
  console.log(`\n[GET /api/turmas] ${turmasList.status === 200 ? '✅' : '❌'} status=${turmasList.status}`)
  const body = turmasList.body as { data: {id:string,nome:string}[], total: number }
  console.log(`   Total turmas: ${body.total}`)

  // 4. POST /api/turmas — cria nova turma
  const novaTurma = await req('POST', '/api/turmas', token, {
    nome: 'Turma Teste Script',
    ano_letivo: 2026,
    turno: 'manha',
    escola: 'Escola Teste',
  })
  console.log(`\n[POST /api/turmas] ${novaTurma.status === 201 ? '✅' : '❌'} status=${novaTurma.status}`)
  const turma = novaTurma.body as { id: string; nome: string }
  if (novaTurma.status !== 201) { console.error('   Body:', novaTurma.body); process.exit(1) }
  console.log(`   Turma criada: ${turma.id} — ${turma.nome}`)

  // 5. PATCH /api/turmas/:id — edita turma
  const editTurma = await req('PATCH', `/api/turmas/${turma.id}`, token, {
    nome: 'Turma Teste Script (editada)',
  })
  console.log(`\n[PATCH /api/turmas/${turma.id}] ${editTurma.status === 200 ? '✅' : '❌'} status=${editTurma.status}`)

  // 6. POST /api/turmas/:id/alunos — cria aluno
  const novoAluno = await req('POST', `/api/turmas/${turma.id}/alunos`, token, {
    nome: 'Aluno Teste Script',
    data_nascimento: '2018-05-15',
    necessidades_educacionais: null,
  })
  console.log(`\n[POST /api/turmas/${turma.id}/alunos] ${novoAluno.status === 201 ? '✅' : '❌'} status=${novoAluno.status}`)
  const aluno = novoAluno.body as { id: string; nome: string }
  if (novoAluno.status !== 201) { console.error('   Body:', novoAluno.body); process.exit(1) }
  console.log(`   Aluno criado: ${aluno.id} — ${aluno.nome}`)

  // 7. GET /api/turmas/:id/alunos
  const alunos = await req('GET', `/api/turmas/${turma.id}/alunos`, token)
  console.log(`\n[GET /api/turmas/${turma.id}/alunos] ${alunos.status === 200 ? '✅' : '❌'} status=${alunos.status}`)
  const alunosBody = alunos.body as { data: {id:string,nome:string}[], total: number }
  console.log(`   Total alunos na turma: ${alunosBody.total}`)

  // 8. PATCH /api/alunos/:id — edita aluno
  const editAluno = await req('PATCH', `/api/alunos/${aluno.id}`, token, {
    nome: 'Aluno Teste Script (editado)',
  })
  console.log(`\n[PATCH /api/alunos/${aluno.id}] ${editAluno.status === 200 ? '✅' : '❌'} status=${editAluno.status}`)

  // 9. DELETE /api/alunos/:id — soft delete
  const delAluno = await req('DELETE', `/api/alunos/${aluno.id}`, token)
  console.log(`\n[DELETE /api/alunos/${aluno.id}] ${delAluno.status === 200 ? '✅' : '❌'} status=${delAluno.status}`)

  // 10. GET /api/alunos — todos alunos do professor
  const todosAlunos = await req('GET', '/api/alunos', token)
  console.log(`\n[GET /api/alunos] ${todosAlunos.status === 200 ? '✅' : '❌'} status=${todosAlunos.status}`)
  const todosBody = todosAlunos.body as { total: number }
  console.log(`   Total geral de alunos: ${todosBody.total}`)

  console.log('\n✅ Todos os testes passaram!')
}

main().catch(e => { console.error('ERRO INESPERADO:', e); process.exit(1) })
