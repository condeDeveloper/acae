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

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error('E-mail ou senha inválidos')
    await fetchProfessor()
    const redirect = (router.currentRoute.value.query.redirect as string) || '/'
    await router.push(redirect)
  }

  async function logout() {
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
