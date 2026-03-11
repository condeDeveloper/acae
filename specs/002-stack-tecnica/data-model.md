# Modelo de Dados: Stack Técnica

**Branch**: `002-stack-tecnica` | **Data**: 2026-03-10

---

## Observação

Esta feature é de **configuração de projeto** — não cria tabelas no banco de dados. Os "modelos" documentados aqui são as entidades de configuração e os tokens de design.

---

## Token de Design ACAE (`AcaePreset`)

Entidade de configuração que define toda a identidade visual do portal.

| Token | Valor | Uso |
|-------|-------|-----|
| `primary.600` | `#7C3AED` | Botões primários, links ativos, menu selecionado |
| `primary.700` | `#6D28D9` | Hover de botões primários |
| `primary.50` | `#F5F3FF` | Fundo de itens destacados, hover de itens de lista |
| `--acae-yellow` | `#D97706` | Badges, alertas informativos, destaques secundários |
| `--acae-yellow-light` | `#FEF3C7` | Fundo de badges amarelos |
| `--acae-yellow-text` | `#92400E` | Texto sobre fundo amarelo (contraste 4.6:1 ✅) |
| Fundo padrão | `#FFFFFF` | Todas as superfícies de conteúdo |
| Texto principal | `#1C1917` (Stone 950) | Texto de corpo e headings |
| Texto secundário | `#57534E` (Stone 500) | Labels, placeholders |
| Borda | `#E7E5E4` (Stone 200) | Divisores, inputs |

---

## Estrutura de Configuração do Projeto

```text
frontend/
├── vite.config.ts          # Aliases (@/), build chunks, plugins
├── tsconfig.json           # Strict mode, path mapping
├── .env.local              # VITE_SUPABASE_URL, VITE_API_BASE_URL, VITE_SESSION_TIMEOUT_MS
├── .env.production         # Valores de produção (sem chaves reais — usar CI)
└── src/
    ├── main.ts             # Bootstrap: Vue + PrimeVue + Router + Pinia
    ├── App.vue             # Root: RouterView + useInactivityTimer (quando autenticado)
    ├── theme/
    │   └── acae-preset.ts  # definePreset(Aura, { primary: roxo ACAE })
    ├── assets/
    │   ├── acae-colors.css # CSS vars: --acae-yellow, --acae-yellow-light, --acae-yellow-text
    │   └── main.css        # reset + tipografia base
    ├── services/
    │   ├── supabase.ts     # createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    │   └── api.ts          # Axios instance com interceptors JWT + error handling
    ├── router/
    │   ├── index.ts        # createRouter(history, routes[])
    │   └── guards.ts       # beforeEach: requiresAuth + role check
    ├── stores/
    │   └── auth.ts         # authStore (Pinia): session, professor, login, logout, init
    ├── layouts/
    │   ├── LayoutPublico.vue    # Tela de login (sem menu)
    │   └── LayoutAutenticado.vue # Menu lateral + topbar + RouterView
    └── pages/
        ├── LoginPage.vue   # /login
        ├── DashboardPage.vue # /dashboard
        └── NaoEncontradoPage.vue  # 404
```

---

## Configuração de `main.ts`

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import 'primeicons/primeicons.css'

import App from './App.vue'
import router from './router'
import { AcaePreset } from './theme/acae-preset'
import './assets/acae-colors.css'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: AcaePreset,
    options: {
      darkModeSelector: false,  // Light mode apenas
      cssLayer: false,
    },
  },
})
app.use(ToastService)
app.use(ConfirmationService)

app.mount('#app')
```
