import axios from 'axios'
import { supabase } from './supabase'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL as string,
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
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status
    if (status === 401) {
      // import lazily to avoid circular deps
      const { useAuthStore } = await import('@/stores/auth')
      const authStore = useAuthStore()
      await authStore.logout()
    }
    // Never log request/response body (may contain pedagogical data)
    return Promise.reject(error)
  },
)

export default api
