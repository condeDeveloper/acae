import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../../.env') })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPA_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  // 1. Listar usuários
  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) { console.error('Erro:', error.message); process.exit(1) }

  console.log(`\n=== ${data.users.length} usuário(s) no Supabase Auth ===\n`)
  for (const u of data.users) {
    console.log(`  ${u.email}`)
    console.log(`    ID: ${u.id}`)
    console.log(`    Confirmado: ${u.email_confirmed_at ? 'SIM (' + u.email_confirmed_at + ')' : '❌ NÃO'}`)
    console.log()
  }

  // 2. Testar login
  const EMAIL = 'professor@acae.edu.br'
  const PASSWORD = 'Acae@2026!'

  const anonClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
  )

  console.log(`Testando login com ${EMAIL}...`)
  const { data: loginData, error: loginError } = await anonClient.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  })

  if (loginError) {
    console.error(`❌ Login falhou: ${loginError.message}`)

    // Tentar resetar a senha via admin
    console.log('\n🔧 Atualizando senha via admin API...')
    const user = data.users.find(u => u.email === EMAIL)
    if (user) {
      const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, {
        password: PASSWORD,
        email_confirm: true,
      })
      if (updateErr) {
        console.error('❌ Falha ao atualizar:', updateErr.message)
      } else {
        console.log('✅ Senha atualizada e email confirmado!')

        // Testar de novo
        const { error: retryErr } = await anonClient.auth.signInWithPassword({
          email: EMAIL,
          password: PASSWORD,
        })
        if (retryErr) {
          console.error('❌ Login ainda falha:', retryErr.message)
        } else {
          console.log('✅ Login funcionou!')
        }
      }
    } else {
      console.log(`Usuário ${EMAIL} não encontrado. Criando...`)
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
      })
      if (createErr) {
        console.error('❌ Erro ao criar:', createErr.message)
      } else {
        console.log(`✅ Usuário criado: ${newUser.user.id}`)
      }
    }
  } else {
    console.log(`✅ Login OK! Token: ${loginData.session?.access_token?.slice(0, 20)}...`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
