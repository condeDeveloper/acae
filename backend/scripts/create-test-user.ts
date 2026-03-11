/**
 * Script para criar um usuário de teste no Supabase Auth + Professor no banco.
 * 
 * Uso: npx tsx scripts/create-test-user.ts
 */
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../../.env') })

import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'

const EMAIL = process.env.TEST_EMAIL!
const PASSWORD = process.env.TEST_PASSWORD!
const NOME = process.env.TEST_NOME ?? 'Maria Silva'
const ESCOLA = process.env.TEST_ESCOLA ?? 'EMEI ML'

if (!EMAIL || !PASSWORD) {
  console.error('❌ Configure TEST_EMAIL e TEST_PASSWORD no .env')
  process.exit(1)
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL
  // Use service_role key to create users via admin API
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPA_SERVICE_ROLE_KEY
  const anonKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    console.error('❌ SUPABASE_URL não configurado no .env')
    process.exit(1)
  }

  // Try service_role first, fall back to anon for signUp
  const key = serviceRoleKey || anonKey
  if (!key) {
    console.error('❌ Nenhuma chave Supabase disponível no .env')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const prisma = new PrismaClient()

  try {
    console.log('🔑 Criando usuário no Supabase Auth...')

    let userId: string

    if (serviceRoleKey) {
      // Admin API — cria e confirma automaticamente
      const { data, error } = await supabase.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
      })
      if (error) {
        if (error.message?.includes('already been registered') || error.message?.includes('already exists')) {
          console.log('ℹ️  Usuário já existe no Supabase Auth.')
          const { data: listData } = await supabase.auth.admin.listUsers()
          const existing = listData?.users?.find((u) => u.email === EMAIL)
          if (!existing) {
            console.error('❌ Não foi possível localizar o usuário existente')
            process.exit(1)
          }
          userId = existing.id
        } else {
          console.error('❌ Erro ao criar usuário:', error.message)
          process.exit(1)
        }
      } else {
        userId = data.user!.id
        console.log(`✅ Usuário criado: ${data.user!.email} (${userId})`)
      }
    } else {
      // Sem service_role — usa signUp (precisa confirmar email no dashboard)
      console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY não encontrado. Usando signUp (email precisa ser confirmado no dashboard).')
      const { data, error } = await supabase.auth.signUp({
        email: EMAIL,
        password: PASSWORD,
      })
      if (error) {
        console.error('❌ Erro ao criar usuário:', error.message)
        process.exit(1)
      }
      userId = data.user!.id
      console.log(`✅ Usuário criado: ${EMAIL} (${userId})`)
      console.log('⚠️  Vá ao Supabase Dashboard > Auth > Users e confirme o email do usuário!')
    }

    console.log('👨‍🏫 Criando professor no banco...')

    const existing = await prisma.professor.findUnique({
      where: { supabase_user_id: userId },
    })

    if (existing) {
      console.log(`ℹ️  Professor já existe: ${existing.nome} (${existing.id})`)
    } else {
      const professor = await prisma.professor.create({
        data: {
          nome: NOME,
          email: EMAIL,
          papel: 'professor',
          escola: ESCOLA,
          supabase_user_id: userId,
        },
      })
      console.log(`✅ Professor criado: ${professor.nome} (${professor.id})`)
    }

    // Criar turma de exemplo
    const professorRecord = await prisma.professor.findUnique({
      where: { supabase_user_id: userId },
    })
    if (!professorRecord) throw new Error('Professor não encontrado')

    const turmaExistente = await prisma.turma.findFirst({
      where: { professor_id: professorRecord.id },
    })

    let turmaId: string
    if (turmaExistente) {
      turmaId = turmaExistente.id
      console.log(`ℹ️  Turma já existe: ${turmaExistente.nome}`)
    } else {
      const turma = await prisma.turma.create({
        data: {
          nome: 'Turma A - Infantil 5',
          ano_letivo: 2026,
          turno: 'manha',
          escola: ESCOLA,
          professor_id: professorRecord.id,
        },
      })
      turmaId = turma.id
      console.log(`✅ Turma criada: ${turma.nome}`)
    }

    // Criar alunos de exemplo
    const alunosExistentes = await prisma.aluno.count({ where: { turma_id: turmaId } })
    if (alunosExistentes > 0) {
      console.log(`ℹ️  ${alunosExistentes} alunos já existem na turma.`)
    } else {
      const nomes = [
        { nome: 'Ana Clara', nascimento: '2021-03-15' },
        { nome: 'Pedro Henrique', nascimento: '2021-06-22' },
        { nome: 'Sofia Ribeiro', nascimento: '2021-01-10', necessidades: 'TEA — necessita de adaptações visuais e rotina estruturada' },
        { nome: 'Lucas Santos', nascimento: '2021-09-05' },
        { nome: 'Isabela Costa', nascimento: '2021-04-18' },
      ]
      for (const a of nomes) {
        await prisma.aluno.create({
          data: {
            nome: a.nome,
            data_nascimento: new Date(a.nascimento),
            turma_id: turmaId,
            necessidades_educacionais: a.necessidades ?? null,
          },
        })
      }
      console.log(`✅ 5 alunos criados na turma.`)
    }

    console.log('\n' + '═'.repeat(50))
    console.log('🎉 PRONTO! Use estas credenciais para login:')
    console.log(`   Email:  ${EMAIL}`)
    console.log(`   Senha:  ${PASSWORD}`)
    console.log('═'.repeat(50))

  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
