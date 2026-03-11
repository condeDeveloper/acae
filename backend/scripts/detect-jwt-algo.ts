import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../../.env') })

import { createClient } from '@supabase/supabase-js'

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
const { data, error } = await sb.auth.signInWithPassword({
  email: 'professor@acae.edu.br',
  password: 'Acae@2026!',
})
if (error || !data.session) { console.error('Login error:', error?.message); process.exit(1) }

const token = data.session.access_token
const headerB64 = token.split('.')[0]
const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString())
console.log('JWT header:', JSON.stringify(header))

const secret = process.env.SUPABASE_JWT_SECRET ?? ''
console.log('SUPABASE_JWT_SECRET type:', secret.startsWith('-----BEGIN') ? 'PEM key' : 'raw string')
console.log('SUPABASE_JWT_SECRET length:', secret.length)
console.log('First 20 chars (masked):', secret.substring(0, 20).replace(/./g, '*').substring(0, 20) + '...')
