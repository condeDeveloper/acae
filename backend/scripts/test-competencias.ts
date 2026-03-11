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

const res = await fetch('http://localhost:3000/api/competencias', {
  headers: { Authorization: `Bearer ${token}` },
})
console.log('Status:', res.status)

const body = await res.json() as { data: Array<{ codigo: string; area_conhecimento: string; descricao: string }>; total: number }
console.log('Total competências:', body.total)
console.log('\n=== Competências Gerais (CG01–CG10) ===')
const gerais = body.data.filter(c => c.codigo.startsWith('CG'))
gerais.forEach(c => console.log(`  ${c.codigo}: ${c.descricao.slice(0, 80)}...`))
console.log('\n=== Áreas presentes ===')
const areas = [...new Set(body.data.map(c => c.area_conhecimento))]
areas.forEach(a => {
  const count = body.data.filter(c => c.area_conhecimento === a).length
  console.log(`  ${a}: ${count} competência(s)`)
})
