import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../../.env') })

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const turmas = await prisma.turma.findMany({ include: { alunos: true, professor: true } })
console.log('TURMAS:', turmas.length)
for (const t of turmas) {
  console.log(`  - ${t.nome} (professor: ${t.professor.email}) | alunos: ${t.alunos.length}`)
  for (const a of t.alunos) console.log(`      * ${a.nome} [${a.status}]`)
}
await prisma.$disconnect()
