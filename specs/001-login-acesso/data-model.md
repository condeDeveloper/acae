# Modelo de Dados: Login

**Branch**: `001-login-acesso` | **Data**: 2026-03-10

---

## Entidades

A feature de Login **não cria novas tabelas** no banco. Ela consome as entidades já definidas em `specs/007-banco-de-dados/data-model.md`:

- **`professores`** — a tabela central, com `supabase_user_id` (FK para Supabase Auth), `papel`, `status`
- **Supabase Auth** — gerencia credenciais (e-mail + senha), tokens JWT, refresh tokens

---

## Estado de sessão no frontend (Pinia Store)

```typescript
// frontend/src/stores/auth.ts
import { defineStore } from 'pinia'
import { supabase } from '@/services/supabase'
import type { Professor } from '@/types'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    session: null as any | null,        // Supabase session
    professor: null as Professor | null, // dados do Professor (do banco)
    isLoading: false,
  }),
  getters: {
    isLoggedIn: (state) => !!state.session,
    papel: (state) => state.professor?.papel ?? null,
    isCoordenador: (state) => state.professor?.papel === 'coordenador',
  },
  actions: {
    async login(email: string, password: string) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      this.session = data.session
      await this.loadProfessor()
    },
    async loadProfessor() {
      const { data } = await api.get<Professor>('/api/auth/me')
      this.professor = data
    },
    async logout() {
      await supabase.auth.signOut()
      this.session = null
      this.professor = null
    },
    async init() {
      // Restaurar sessão ao carregar o app
      const { data } = await supabase.auth.getSession()
      this.session = data.session
      if (this.session) await this.loadProfessor()
      // Escutar mudanças de estado de auth
      supabase.auth.onAuthStateChange((_event, session) => {
        this.session = session
        if (!session) this.professor = null
      })
    },
  },
})
```

---

## Entidade de Auditoria (RF-014)

Eventos de autenticação são registrados em logs estruturados no backend. **Não é uma tabela separada** — são logs de aplicação (Fastify logger com Pino) enviados para o serviço de logging do Railway.

**Formato do log de auditoria**:

```json
{
  "level": "info",
  "event": "auth.login_success",
  "professor_id": "uuid-opaco",
  "papel": "professor",
  "timestamp": "2026-03-10T14:30:00Z"
}
```

```json
{
  "level": "warn",
  "event": "auth.login_failed",
  "reason": "professor_not_found",
  "timestamp": "2026-03-10T14:30:00Z"
}
```

**O que NUNCA aparece nos logs**: e-mail, nome, `supabase_user_id`, dados de alunos.

---

## Fluxo de estado de sessão

```
[Usuário chega] → authStore.init()
    ↓
supabase.auth.getSession() → session existe?
    ├── Sim → loadProfessor() → professor carregado → redireciona para /dashboard
    └── Não → permanece em /login

[Login] → supabase.auth.signInWithPassword()
    ├── Sucesso → authStore.session + loadProfessor() → redirect para URL original ou /dashboard
    └── Erro → exibe "E-mail ou senha inválidos"

[Inatividade 30min] → useInactivityTimer dispara
    → supabase.auth.signOut() → authStore.logout() → /login?expired=1

[Backend retorna 401] → Axios interceptor
    → authStore.logout() → /login

[Logout manual] → supabase.auth.signOut() → authStore.logout() → /login
```
