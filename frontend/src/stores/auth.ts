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
      // Mark session-only: sessionStorage survives reloads but clears on tab close.
      // localStorage flag lets init() detect that a new tab reopened without the flag.
      sessionStorage.setItem('acae:session-only', '1')
      localStorage.setItem('acae:had-session-only', '1')
    } else {
      sessionStorage.removeItem('acae:session-only')
      localStorage.removeItem('acae:had-session-only')
    }
    await fetchProfessor()
    const redirect = (router.currentRoute.value.query.redirect as string) || '/'
    await router.push(redirect)
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

    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
      if (!newSession) {
        professor.value = null
      }
    })
  }

  return { session, professor, isAuthenticated, papel, login, logout, init, fetchProfessor }
})
