# Quickstart: Stack Técnica — Vue 3 + Vite + PrimeVue

**Branch**: `002-stack-tecnica`  
**Tempo estimado**: 20–30 minutos

---

## Passo 1 — Criar o projeto Vue 3 + Vite

```powershell
cd C:\Projetos\acae
npm create vite@latest frontend -- --template vue-ts
cd frontend
npm install
```

---

## Passo 2 — Instalar dependências principais

```powershell
# UI e roteamento
npm install vue-router@4 pinia

# PrimeVue v4
npm install primevue @primevue/themes primeicons

# HTTP e auth
npm install axios @supabase/supabase-js

# Utilitários de desenvolvimento
npm install -D @types/node
```

---

## Passo 3 — Configurar Vite

Substituir `vite.config.ts`:

```typescript
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
          'vendor-primevue': ['primevue', '@primevue/themes'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
})
```

Configurar `tsconfig.json` (paths):

```json
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

---

## Passo 4 — Criar o preset de tema ACAE

```powershell
mkdir src\theme
```

Criar `src/theme/acae-preset.ts` com o conteúdo do `research.md` (seção "Incerteza 1").

---

## Passo 5 — Criar arquivos CSS base

```powershell
mkdir src\assets
```

`src/assets/acae-colors.css`:

```css
:root {
  --acae-yellow: #D97706;
  --acae-yellow-light: #FEF3C7;
  --acae-yellow-text: #92400E;
}
```

`src/assets/main.css`:

```css
*, *::before, *::after {
  box-sizing: border-box;
}
body {
  margin: 0;
  font-family: var(--p-font-family, system-ui, sans-serif);
  font-size: 14px;
  color: #1C1917;
  background-color: #FFFFFF;
}
```

---

## Passo 6 — Configurar `main.ts`

Substituir o conteúdo pelo `main.ts` do arquivo `data-model.md`.

---

## Passo 7 — Criar `.env.local`

```dotenv
VITE_SUPABASE_URL=https://[PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_BASE_URL=http://localhost:3000
VITE_SESSION_TIMEOUT_MS=1800000
```

---

## Passo 8 — Verificar

```powershell
npm run dev
```

Abrir `http://localhost:5173`. Deve exibir a tela inicial com o tema roxo ACAE aplicado nos componentes PrimeVue. Verificar no console do navegador que não há erros.

```powershell
npm run build
```

Verificar que o bundle principal é < 500KB gzip:

```powershell
npx vite-bundle-visualizer
```

---

## Próximos passos

Após este quickstart, continuar com feature **001-login-acesso** (LoginPage.vue + authStore + Vue Router guards).
