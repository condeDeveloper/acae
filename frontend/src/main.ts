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
      darkModeSelector: 'html',
    },
  },
})
app.use(ConfirmationService)
app.use(ToastService)
// NOTE: router is intentionally NOT installed here.
// Vue Router fires its initial navigation inside app.use(router),
// which would run beforeEach guards before auth is initialized.
// We install the router AFTER init() so auth is ready first.

// Validate required env vars
const requiredEnv = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_API_BASE_URL'] as const
for (const key of requiredEnv) {
  if (!import.meta.env[key]) {
    console.error(`[ACAE] Missing required env var: ${key}`)
  }
}

// Initialize auth state, then install router and mount
const authStore = useAuthStore()
authStore.init().then(() => {
  app.use(router)   // installed AFTER auth is ready → beforeEach sees correct session
  app.mount('#app')
})
