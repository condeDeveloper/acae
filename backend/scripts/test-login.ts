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

async function main() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'professor@acae.edu.br',
    password: 'Acae@2026!',
  })

  if (error) {
    console.log('❌ ERRO login:', error.message)
  } else {
    console.log('✅ Login OK!')
    console.log('   User ID:', data.user?.id)
    console.log('   Email:', data.user?.email)
    console.log('   Papel (JWT):', (data.session?.access_token ? JSON.parse(atob(data.session.access_token.split('.')[1])).papel : 'N/A'))
  }
}

main().catch(e => console.error(e))
