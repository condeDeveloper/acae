import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../../.env') })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Check if the hook function exists and its body
  const result = await prisma.$queryRawUnsafe(`
    SELECT proname, prosrc 
    FROM pg_proc 
    WHERE proname = 'custom_access_token_hook'
  `) as Array<{ proname: string; prosrc: string }>

  if (result.length === 0) {
    console.log('❌ Função custom_access_token_hook NÃO EXISTE no banco.')
  } else {
    console.log('✅ Função encontrada. Código:')
    console.log(result[0].prosrc)
  }

  // Check if professor exists
  const prof = await prisma.professor.findFirst({ where: { email: 'professor@acae.edu.br' } })
  console.log('\n--- Professor ---')
  console.log(prof)

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
