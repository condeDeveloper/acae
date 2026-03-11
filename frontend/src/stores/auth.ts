import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'
import type { Session } from '@supabase/supabase-js'
import router from '@/router'
import api from '@/services/api'

interface Professor {
  id: string
  nome: string
  email: string
  papel: 'professor' | 'coordenador'
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null)
  const professor = ref<Professor | null>(null)

  const isAuthenticated = computed(() => !!session.value)
  const papel = computed(() => professor.value?.papel ?? null)

  async function login(email: string, password: string, rememberMe = true) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error('E-mail ou senha inválidos')
    // Set session immediately so isAuthenticated is true before router.push
    session.value = data.session
    if (!rememberMe) {
      sessionStorage.setItem('acae:session-only', '1')
      localStorage.setItem('acae:had-session-only', '1')
    } else {
      sessionStorage.removeItem('acae:session-only')
      localStorage.removeItem('acae:had-session-only')
    }
    await fetchProfessor()
    // If professor is still null (user exists in Supabase but not in our DB),
    // create the profile now — handles first-time logins after manual user creation or
    // cases where registration completed in Supabase but the DB record was never saved.
    if (!professor.value && data.session) {
      await createProfile(data.session)
    }
    const redirect = (router.currentRoute.value.query.redirect as string) || '/'
    await router.push(redirect)
  }

  /** Registers a new user with email + password. Returns 'confirm-email' if confirmation is needed. */
  async function register(nome: string, email: string, password: string): Promise<'ok' | 'confirm-email'> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: nome } },
    })
    if (error) throw new Error(error.message)

    // Auto-confirmed (Supabase project has "Confirm email" disabled)
    if (data.session) {
      session.value = data.session
      await createProfile(data.session, nome)
      const redirect = (router.currentRoute.value.query.redirect as string) || '/'
      await router.push(redirect)
      return 'ok'
    }

    // Email confirmation required — session is null until user confirms
    return 'confirm-email'
  }

  /** Initiates Google OAuth flow — browser will redirect to Google. */
  async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) throw new Error(error.message)
  }

  /** Creates/upserts the professor record in our DB after first sign-up or OAuth. */
  async function createProfile(sess: Session, nome?: string, escola = '') {
    try {
      const resolvedNome = nome
        || sess.user.user_metadata?.full_name
        || sess.user.user_metadata?.name
        || 'Professor'
      const { data } = await api.post<Professor>('/api/auth/register', { nome: resolvedNome, escola })
      professor.value = data
    } catch {
      await fetchProfessor()
    }
  }

  async function logout() {
    sessionStorage.removeItem('acae:session-only')
    localStorage.removeItem('acae:had-session-only')
    await supabase.auth.signOut()
    session.value = null
    professor.value = null
    await router.push('/login')
  }

  async function fetchProfessor() {
    try {
      const { data } = await api.get<Professor>('/api/auth/me')
      professor.value = data
    } catch {
      // professor not in DB yet or request failed
    }
  }

  async function init() {
    const { data } = await supabase.auth.getSession()
    // If this was a session-only login (rememberMe=false) and sessionStorage was cleared
    // (i.e. browser/tab was closed and reopened), sign out to honor the user's choice
    if (data.session && !sessionStorage.getItem('acae:session-only')) {
      const hadSessionOnly = localStorage.getItem('acae:had-session-only') === '1'
      if (hadSessionOnly) {
        localStorage.removeItem('acae:had-session-only')
        await supabase.auth.signOut()
        return
      }
    }
    session.value = data.session
    if (data.session) await fetchProfessor()

    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      session.value = newSession
      if (!newSession) {
        professor.value = null
        return
      }
      // Only handle OAuth providers here (Google etc.).
      // Email/password login and register are handled explicitly by login() and register().
      const provider = newSession.user.app_metadata?.provider
      if (provider && provider !== 'email' && !professor.value) {
        try {
          const { data } = await api.get<Professor>('/api/auth/me')
          professor.value = data
        } catch {
          await createProfile(newSession)
        }
        const redirect = (router.currentRoute.value.query.redirect as string) || '/'
        await router.push(redirect)
      }
    })
  }

  return { session, professor, isAuthenticated, papel, login, register, loginWithGoogle, logout, init, fetchProfessor }
})
