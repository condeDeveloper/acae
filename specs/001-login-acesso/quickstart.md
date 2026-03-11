# Quickstart: Login — Supabase Auth + Fastify + Vue

**Branch**: `001-login-acesso`

---

## Pré-requisitos

- Projeto Supabase criado (feature 007)
- Backend Fastify inicializado com Prisma (feature 007)
- Frontend Vue 3 + Vite criado (feature 002)

---

## Backend — Configurar @fastify/jwt e rate limiting

```powershell
cd backend
npm install @fastify/jwt @fastify/rate-limit
```

### `backend/src/plugins/auth.ts`

```typescript
import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'

export default fp(async (fastify) => {
  // JWT verification com segredo Supabase (HS256)
  await fastify.register(fastifyJwt, {
    secret: process.env.SUPABASE_JWT_SECRET!,
    verify: { algorithms: ['HS256'] },
  })

  // Rate limiting global
  await fastify.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
  })

  // Decorator: verifica JWT e rejeita se inválido
  fastify.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.code(401).send({ error: 'Token inválido ou expirado' })
    }
  })
})
```

### `backend/src/hooks/attach-professor.ts`

```typescript
import { FastifyRequest, FastifyReply } from 'fastify'

export async function attachProfessor(request: FastifyRequest, reply: FastifyReply) {
  const supabaseUserId = (request.user as any).sub
  const professor = await request.server.prisma.professor.findUnique({
    where: { supabase_user_id: supabaseUserId },
  })
  if (!professor || professor.status === 'inativo') {
    return reply.code(403).send({ error: 'Professor não encontrado ou inativo' })
  }
  ;(request as any).professor = professor
}
```

### `backend/src/routes/auth/index.ts`

```typescript
import { attachProfessor } from '../../hooks/attach-professor'

export async function authRoutes(fastify: any) {
  // GET /api/auth/me — retorna professor autenticado
  fastify.get('/api/auth/me', {
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
    onRequest: [fastify.authenticate],
    preHandler: [attachProfessor],
    handler: async (request: any) => {
      const { id, nome, email, papel, escola, status } = request.professor
      return { id, nome, email, papel, escola, status }
    },
  })

  // POST /api/auth/logout — registra evento de logout
  fastify.post('/api/auth/logout', {
    onRequest: [fastify.authenticate],
    handler: async (request: any, reply: any) => {
      fastify.log.info({ event: 'auth.logout', professor_id: request.user.sub })
      return { message: 'Sessão encerrada' }
    },
  })
}
```

---

## Frontend — Instalar Supabase client e configurar

```powershell
cd frontend
npm install @supabase/supabase-js
```

### `frontend/src/services/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
```

### `frontend/.env.local`

```dotenv
VITE_SUPABASE_URL=https://[PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_BASE_URL=http://localhost:3000
VITE_SESSION_TIMEOUT_MS=1800000
```

---

## Frontend — Vue Router com guards

### `frontend/src/router/guards.ts`

```typescript
import { useAuthStore } from '@/stores/auth'

export function setupGuards(router: any) {
  router.beforeEach(async (to: any, _from: any, next: any) => {
    const auth = useAuthStore()

    if (to.meta.requiresAuth && !auth.isLoggedIn) {
      next({ name: 'login', query: { redirect: to.fullPath } })
    } else if (to.name === 'login' && auth.isLoggedIn) {
      next({ name: 'dashboard' })
    } else {
      next()
    }
  })
}
```

### `frontend/src/composables/useInactivityTimer.ts`

```typescript
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

export function useInactivityTimer() {
  const auth = useAuthStore()
  const router = useRouter()
  const TIMEOUT = Number(import.meta.env.VITE_SESSION_TIMEOUT_MS ?? 1_800_000)
  let timer: ReturnType<typeof setTimeout>

  const reset = () => {
    clearTimeout(timer)
    timer = setTimeout(async () => {
      await auth.logout()
      router.push('/login?expired=1')
    }, TIMEOUT)
  }

  const events = ['click', 'keydown', 'mousemove', 'touchstart']

  onMounted(() => {
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    reset()
  })

  onUnmounted(() => {
    events.forEach((e) => window.removeEventListener(e, reset))
    clearTimeout(timer)
  })
}
```

Usar em `App.vue` (apenas quando autenticado):

```typescript
// frontend/src/App.vue
import { useInactivityTimer } from '@/composables/useInactivityTimer'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
if (auth.isLoggedIn) useInactivityTimer()
```

---

## Verificar que funciona

1. Acessar `http://localhost:5173` → deve redirecionar para `/login`
2. Login com credenciais válidas → deve redirecionar para `/dashboard`
3. Tentar acessar `/dashboard` sem login → deve redirecionar para `/login?redirect=/dashboard`
4. Após login, verificar que `/dashboard` é carregado
5. Aguardar timeout de inatividade (reduzir para 10s em dev) → deve redirecionar para `/login?expired=1`
