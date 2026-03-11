# Implementation Plan: Login — Portal do Professor

**Branch**: `001-login-acesso` | **Date**: 2026-03-10 | **Spec**: `specs/001-login-acesso/spec.md`

## Summary

Implementar autenticação completa do Portal do Professor usando **Supabase Auth** (e-mail + senha) com verificação JWT no backend Fastify. O frontend Vue 3 gerencia estado de sessão via Pinia, protege rotas com guards Vue Router, implementa expiração automática por inatividade (30 min) e controle de acesso por papel (professor/coordenador). O backend valida JWTs via `@fastify/jwt` e aplica rate limiting de 5 tentativas em 15 minutos.

## Technical Context

**Language/Version**: Node.js 22 LTS (backend) + Vue 3 + TypeScript (frontend)  
**Primary Dependencies**: `@supabase/supabase-js` v2, `@fastify/jwt` v9.x, `@fastify/rate-limit` v9.x, `pinia`, `vue-router` v4  
**Storage**: Supabase Auth (credenciais) + tabela `professores` (dados de aplicação) — sem novas tabelas  
**Testing**: Vitest + Vue Test Utils (frontend) + Supertest (backend)  
**Target Platform**: Browser moderno (ES2020+, Chrome 80+) + servidor Linux (Railway)  
**Project Type**: Web application (SPA Vue 3 + API Fastify)  
**Performance Goals**: Tela de login carrega < 2s; autenticação completa < 5s em conexão escolar  
**Constraints**: Sem sessão server-side (JWT stateless); sem MFA nesta versão; sem SSO  
**Scale/Scope**: ~20 professores por escola; login ocasional (1–2 vezes/dia por usuário)

## Constitution Check

| Princípio | Status | Evidência |
|-----------|--------|-----------|
| **I — Simplicidade** | ✅ APROVADO | Tela de login com 2 campos. Login em < 30s. `useInactivityTimer` automático sem intervenção do professor. |
| **II — IA baseada em dados** | ✅ N/A | Esta feature não envolve geração de IA. |
| **III — Rastreabilidade BNCC** | ✅ N/A | Esta feature não envolve documentos. |
| **IV — LGPD** | ✅ APROVADO | Logs sem PII; erro genérico "E-mail ou senha inválidos"; sessão expira por inatividade; logout invalida refresh token; rate limiting contra brute force. |
| **V — Fidelidade de documentos** | ✅ N/A | Esta feature não envolve documentos. |

**Resultado**: Todas as gates aplicáveis aprovadas.

## Project Structure

### Documentação (esta feature)

```text
specs/001-login-acesso/
├── plan.md              # Este arquivo
├── research.md          # Supabase Auth flow, JWT, rate limiting, inactivity timer
├── data-model.md        # Pinia authStore + fluxo de estado
├── quickstart.md        # Setup @fastify/jwt + Supabase client + Vue Router guards
├── contracts/
│   └── auth.md          # GET /api/auth/me, POST /api/auth/logout
└── tasks.md             # (gerado por /speckit.tasks)
```

### Código-fonte

```text
backend/
├── src/
│   ├── plugins/
│   │   └── auth.ts            # @fastify/jwt + @fastify/rate-limit + decorator authenticate
│   ├── hooks/
│   │   └── attach-professor.ts # preHandler: JWT.sub → Professor no req
│   └── routes/
│       └── auth/
│           └── index.ts       # GET /api/auth/me, POST /api/auth/logout

frontend/
├── src/
│   ├── services/
│   │   └── supabase.ts        # createClient(@supabase/supabase-js)
│   ├── stores/
│   │   └── auth.ts            # Pinia: session, professor, login(), logout(), init()
│   ├── composables/
│   │   └── useInactivityTimer.ts  # Timer 30min com reset em eventos de interação
│   ├── router/
│   │   ├── index.ts           # rotas + meta.requiresAuth
│   │   └── guards.ts          # beforeEach: redirect para /login se não autenticado
│   └── pages/
│       └── LoginPage.vue      # Tela de login: formulário + mensagem de erro genérica
```

## Decisões de Implementação

### Decisão 1 — Autenticação via Supabase Auth (não backend próprio)

O login (e-mail + senha) é feito diretamente pelo cliente Supabase JS no frontend. O backend Fastify **nunca recebe a senha** — apenas verifica o JWT emitido pelo Supabase. Isso elimina a necessidade de hash de senha, reset de senha e gestão de refresh tokens próprios.

### Decisão 2 — Sessão stateless com JWT + Pinia

Não há sessão server-side. O JWT do Supabase é armazenado em memória pelo cliente Supabase JS (não em localStorage diretamente — o Supabase usa `supabase.auth.getSession()` com storage em `localStorage` por padrão). Ao recarregar a app, `authStore.init()` chama `supabase.auth.getSession()` para restaurar o estado.

### Decisão 3 — Inatividade no frontend (não no servidor)

A expiração por inatividade é implementada como composable Vue no frontend. O servidor emite JWTs com expiração de 1 hora (configuração padrão Supabase). A expiração por inatividade (30 min) encerra a sessão antes da expiração natural do token.

### Decisão 4 — Rate limiting em `GET /api/auth/me`

O endpoint mais chamado após login é `GET /api/auth/me` (carrega dados do professor). O rate limit de 5 req/15min neste endpoint protege contra enumeração de usuários via token válido. O Supabase Auth já protege o endpoint de credenciais diretamente.

### Decisão 5 — Erro genérico para credenciais inválidas

A mensagem de erro exibida é sempre "E-mail ou senha inválidos" — independent de o e-mail existir ou não. O Supabase Auth retorna `{ error: 'Invalid login credentials' }` para ambos os casos, e o frontend exibe a mesma mensagem genérica (RF-004).

### Decisão 6 — Controle de acesso por papel via `request.professor.papel`

Após `attachProfessor`, toda rota tem `request.professor.papel` disponível. Guards de rota no Vue Router verificam `authStore.papel` para restringir acesso a páginas de coordenação. O backend verifica o papel em cada endpoint sensível.
