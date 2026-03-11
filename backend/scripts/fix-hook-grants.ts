import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../../.env') })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Check grants on the function
  const grants = await prisma.$queryRawUnsafe(`
    SELECT grantee, privilege_type, routine_name
    FROM information_schema.routine_privileges
    WHERE routine_name = 'custom_access_token_hook'
    AND routine_schema = 'public'
  `)
  console.log('=== GRANTS na função ===')
  console.log(grants)

  // Check if supabase_auth_admin has access to the professores table
  const tableGrants = await prisma.$queryRawUnsafe(`
    SELECT grantee, privilege_type, table_name
    FROM information_schema.table_privileges
    WHERE table_name = 'professores'
    AND table_schema = 'public'
  `)
  console.log('\n=== GRANTS na tabela professores ===')
  console.log(tableGrants)

  // Try to fix: grant permissions
  console.log('\n=== Aplicando GRANTs... ===')
  
  await prisma.$executeRawUnsafe(`
    GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
  `)
  console.log('✅ GRANT USAGE ON SCHEMA public TO supabase_auth_admin')

  await prisma.$executeRawUnsafe(`
    GRANT SELECT ON TABLE public.professores TO supabase_auth_admin;
  `)
  console.log('✅ GRANT SELECT ON public.professores TO supabase_auth_admin')

  await prisma.$executeRawUnsafe(`
    GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
  `)
  console.log('✅ GRANT EXECUTE ON FUNCTION custom_access_token_hook TO supabase_auth_admin')

  await prisma.$executeRawUnsafe(`
    REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM authenticated, anon;
  `)
  console.log('✅ REVOKE EXECUTE FROM authenticated, anon')

  console.log('\n🎉 Permissões aplicadas. Tente fazer login novamente!')

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
