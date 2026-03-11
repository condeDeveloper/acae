# Research: Stack Técnica — Vue 3 + Vite + PrimeVue ACAE

**Branch**: `002-stack-tecnica` | **Data**: 2026-03-10

---

## Incerteza 1 — Cores ACAE: valores hexadecimais acessíveis

### Decisão

**Roxo primário âncora**: `#7C3AED` (Violet 600) — contraste 5.72:1 sobre branco ✅ WCAG AA  
**Amarelo secundário âncora**: `#D97706` (Amber 600) — contraste 3.23:1 sobre branco ✅ WCAG AA (componentes UI)

O amarelo puro (`#FBBF24`) tem apenas 1.85:1 sobre branco — não pode ser usado para texto. Usar amarelo como cor de fundo (badges, destaques) com texto escuro (`#1C1917`) para manter conformidade WCAG.

### Paleta gerada pelo PrimeVue `$dt()` via definePreset

```typescript
// frontend/src/theme/acae-preset.ts
import { definePreset } from '@primevue/themes'
import Aura from '@primevue/themes/aura'

export const AcaePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',  // ← âncora (botões primários, links ativos)
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
      950: '#2e1065',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{primary.600}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.700}',
          activeColor: '{primary.800}',
        },
        highlight: {
          background: '{primary.50}',
          focusBackground: '{primary.100}',
          color: '{primary.700}',
          focusColor: '{primary.800}',
        },
      },
    },
  },
  components: {
    button: {
      colorScheme: {
        light: {
          root: {
            background: '{primary.600}',
            hoverBackground: '{primary.700}',
            activeBackground: '{primary.800}',
            borderColor: '{primary.600}',
            color: '#ffffff',
          },
        },
      },
    },
  },
})
```

O amarelo (`#D97706`) é definido como variável CSS customizada e aplicado pontualmente em badges e destaques — não como token PrimeVue primário, pois o sistema de tokens do PrimeVue espera uma cor com bom contraste para texto branco.

```css
/* frontend/src/assets/acae-colors.css */
:root {
  --acae-yellow: #D97706;
  --acae-yellow-light: #FEF3C7;
  --acae-yellow-text: #92400E; /* texto sobre fundo amarelo claro */
}
```

---

## Incerteza 2 — Estrutura Vite com aliases e variáveis de ambiente

### Decisão

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-primevue': ['primevue'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
})
```

---

## Incerteza 3 — Instância Axios com interceptors

### Decisão

```typescript
// frontend/src/services/api.ts
import axios from 'axios'
import { supabase } from './supabase'
import router from '@/router'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30_000,
})

// Request: injeta token de autenticação
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession()
  if (data.session?.access_token) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`
  }
  return config
})

// Response: trata erros comuns
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    if (status === 401) {
      // Sessão expirada → redireciona para login
      router.push('/login?expired=1')
    } else if (status === 403) {
      // Sem permissão → não fazer nada automaticamente (componente trata)
    }
    // Nunca loga corpo da resposta (pode conter dados pedagógicos)
    return Promise.reject(error)
  },
)

export default api
```

---

## Incerteza 4 — Bundle size < 500KB (gzip)

### Decisão

- Code splitting automático por rota (Vite lazy loading com `() => import(...)`)
- `manualChunks` para separar vendor chunks (vue, primevue, supabase)
- PrimeVue v4 com tree-shaking automático (importar apenas componentes usados)
- PrimeIcons: importar apenas o CSS necessário

Estimativa de bundle (gzip): Vue 3 ~30KB, Vue Router ~10KB, Pinia ~5KB, PrimeVue (Aura + componentes usados) ~80–120KB, Supabase JS ~35KB. Total estimado: ~200–220KB gzip — bem abaixo de 500KB. ✅

---

## Decisões consolidadas

| Tópico | Decisão | Detalhe |
|--------|---------|---------|
| Roxo primário | `#7C3AED` (Violet 600) | 5.72:1 sobre branco, WCAG AA ✅ |
| Amarelo secundário | `#D97706` (Amber 600) em badges | CSS var, não token PrimeVue |
| Tema base | PrimeVue Aura preset com `definePreset` | Sem CSS overrides globais |
| Aliases Vite | `@/` → `src/` | Configurado em `vite.config.ts` |
| Code splitting | `manualChunks` + lazy routes | Bundle estimado ~220KB gzip |
| Axios | Instância única em `services/api.ts` | Sem PII em logs de request |
| Modo | Light mode apenas | Dark mode fora do escopo |
| Compatibilidade | Chrome 80+, Firefox 78+, ES2020+ | Aviso para navegadores antigos |
