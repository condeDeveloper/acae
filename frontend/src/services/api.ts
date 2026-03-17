import axios from 'axios'
import { supabase } from './supabase'

// Em dev: usa VITE_API_BASE_URL (ex: http://localhost:3000)
// Em prod: baseURL vazio = chamadas relativas (front e back no mesmo domínio)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30_000,
})

// Request: inject JWT token
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession()
  if (data.session?.access_token) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`
  }
  return config
})

// Response: handle common errors
let isLoggingOut = false
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status
    const errorBody: string = error.response?.data?.error ?? ''
    // Only auto-logout for genuine token errors — NOT for 'Professor não encontrado'
    // which happens normally during registration before the profile is created.
    const isTokenError =
      !errorBody ||
      errorBody.toLowerCase().includes('token') ||
      errorBody.toLowerCase().includes('expirado')
    if (status === 401 && !isLoggingOut && isTokenError) {
      isLoggingOut = true
      try {
        // import lazily to avoid circular deps
        const { useAuthStore } = await import('@/stores/auth')
        const authStore = useAuthStore()
        await authStore.logout()
      } finally {
        isLoggingOut = false
      }
    }
    // Never log request/response body (may contain pedagogical data)
    return Promise.reject(error)
  },
)

export default api
