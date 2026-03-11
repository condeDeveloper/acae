# Research: Login — Supabase Auth + Fastify + Vue Router

**Branch**: `001-login-acesso` | **Data**: 2026-03-10

---

## Incerteza 1 — Fluxo de autenticação: Supabase Auth + Fastify

### Decisão

**Frontend**: Usar `@supabase/supabase-js` v2 para autenticação. O cliente Supabase gerencia o token JWT, o refresh automático e o estado de sessão.

**Backend**: Verificar o JWT de cada requisição com `@fastify/jwt` v9.x (HS256 com `SUPABASE_JWT_SECRET`). Não há sessão server-side — o JWT é stateless.

### Fluxo completo

```
1. Professor preenche e-mail + senha na tela Vue
2. Frontend chama supabase.auth.signInWithPassword({ email, password })
3. Supabase retorna: { session: { access_token, refresh_token, expires_at } }
4. Frontend armazena session na Pinia store (authStore)
5. Axios interceptor injeta: Authorization: Bearer <access_token> em cada request
6. Fastify recebe request → @fastify/jwt verifica assinatura HS256
7. attachProfessor hook → busca Professor no banco via supabase_user_id = JWT.sub
8. Rota acessa request.professor com dados completos
```

### Refresh automático de token

O Supabase client (`@supabase/supabase-js`) verifica automaticamente o `expires_at` e usa `refresh_token` para renovar o `access_token` sem interação do usuário. O evento `SIGNED_OUT` é emitido quando o refresh falha (ex: refresh token expirado). O frontend escuta `supabase.auth.onAuthStateChange` e redireciona para login quando o evento for `SIGNED_OUT`.

---

## Incerteza 2 — Rate limiting para 5 tentativas falhas

### Decisão

**`@fastify/rate-limit`** v9.x no endpoint `POST /api/auth/session` (rota que valida se o professor existe no banco após login Supabase) + detecção no frontend com contador local.

**Nota**: O Supabase Auth já tem rate limiting próprio por padrão (~5 requisições de login por hora por IP via endpoint `/auth/v1/token`). Para compliance com RF-015 (bloqueio após 5 falhas), combinamos:
1. Supabase Auth rate limit (protege contra brute force no IDP)
2. `@fastify/rate-limit` no backend Fastify (protege rotas de aplicação)

```typescript
// Backend: rate limit no endpoint de sessão
fastify.register(rateLimit, {
  global: false,
})

fastify.post('/api/auth/session', {
  config: {
    rateLimit: {
      max: 5,
      timeWindow: '15 minutes',
    },
  },
  handler: async (request, reply) => { /* ... */ },
})
```

---

## Incerteza 3 — Redirecionamento pós-login para URL original (RF-016)

### Decisão

**Vue Router navigation guard** + **query param `redirect`**.

```typescript
// router/guards.ts
router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

// Após login bem-sucedido:
const redirect = route.query.redirect as string || '/dashboard'
router.push(redirect)
```

---

## Incerteza 4 — Logout e invalidação de sessão (RF-009, RF-010)

### Decisão

`supabase.auth.signOut()` invalida o `refresh_token` no servidor Supabase. O `access_token` é stateless e não pode ser revogado antes do `expires_at`, mas como tem expiração curta (1 hora padrão), o risco é aceitável. O frontend limpa o store Pinia imediatamente.

Para o botão "voltar" após logout (RF-010): o Axios interceptor detecta 401 e chama `authStore.logout()` + `router.push('/login')`.

---

## Incerteza 5 — Expiração de sessão por inatividade (RF-005)

### Decisão

**Implementação no frontend** com `composable useInactivityTimer`:
- Eventos monitorados: `click`, `keydown`, `mousemove`, `touchstart`
- Timer padrão: 30 minutos (`VITE_SESSION_TIMEOUT_MS=1800000`)
- Ao expirar: `supabase.auth.signOut()` + `authStore.logout()` + `router.push('/login?expired=1')`
- A mensagem "Sessão expirada por inatividade" é mostrada quando `?expired=1` está na query

---

## Incerteza 6 — Como o backend distingue professor de coordenador

### Decisão

Via **Custom Access Token Hook** do Supabase (definido em feature 007). O JWT contém `papel: 'professor' | 'coordenador'`. O backend lê `request.user.papel` após verificação do JWT, ou usa `request.professor.papel` após o hook `attachProfessor`.

---

## Decisões consolidadas

| Tópico | Decisão | Pacote |
|--------|---------|--------|
| Auth no frontend | `@supabase/supabase-js` v2 | `@supabase/supabase-js` |
| JWT verification backend | `@fastify/jwt` v9.x, HS256 | `@fastify/jwt` |
| Rate limiting | `@fastify/rate-limit` v9.x, 5 req / 15min | `@fastify/rate-limit` |
| Session state frontend | Pinia `authStore` | `pinia` |
| Inactivity timeout | `useInactivityTimer` composable (30 min) | nativo |
| Post-login redirect | Vue Router `?redirect=` query param | `vue-router` |
| Logout | `supabase.auth.signOut()` + clear Pinia | `@supabase/supabase-js` |
