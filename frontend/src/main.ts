import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import 'primeicons/primeicons.css'

import { AcaePreset } from '@/theme/acae-preset'
import '@/assets/main.css'

import App from './App.vue'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(PrimeVue, {
  theme: {
    preset: AcaePreset,
    options: {
      darkModeSelector: false,
    },
  },
})
app.use(ConfirmationService)
app.use(ToastService)
app.use(router)

// Validate required env vars
const requiredEnv = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_API_BASE_URL'] as const
for (const key of requiredEnv) {
  if (!import.meta.env[key]) {
    console.error(`[ACAE] Missing required env var: ${key}`)
  }
}

// Initialize auth state before mounting
const authStore = useAuthStore()
authStore.init().then(() => {
  app.mount('#app')
})
