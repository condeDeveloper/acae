# Implementation Plan: Stack Técnica — Vue 3 + Vite + PrimeVue ACAE

**Branch**: `002-stack-tecnica` | **Date**: 2026-03-10 | **Spec**: `.specify/specs/stack-tecnica/spec.md`

## Summary

Configurar o projeto frontend do Portal do Professor com **Vue 3 (Composition API) + Vite + PrimeVue v4** (preset Aura customizado com as cores roxo e amarelo da ACAE). Estabelecer a estrutura de pastas, o tema visual, os aliases de caminho, os layouts autenticado/público, a instância Axios com interceptors e as bases do Vue Router + Pinia — tudo antes de qualquer funcionalidade de negócio.

## Technical Context

**Language/Version**: TypeScript + Vue 3.4+ + Vite 6  
**Primary Dependencies**: `primevue` v4, `@primevue/themes` (Aura), `vue-router` v4, `pinia`, `axios`, `@supabase/supabase-js` v2  
**Storage**: N/A (esta feature é puramente frontend — configuração)  
**Testing**: Vitest + Vue Test Utils v2 + happy-dom  
**Target Platform**: Browser (Chrome 80+, Firefox 78+, ES2020+); resolução mínima 1366×768  
**Project Type**: SPA (Single Page Application)  
**Performance Goals**: Bundle inicial < 500KB gzip; carregamento < 2s em 10 Mbps; cold start dev server < 5s  
**Constraints**: Light mode apenas; sem dark mode; sem CSS overrides globais no tema PrimeVue  
**Scale/Scope**: ~10 páginas; ~50 componentes estimados; 1 instância de escola

## Constitution Check

| Princípio | Status | Evidência |
|-----------|--------|-----------|
| **I — Simplicidade** | ✅ APROVADO | PrimeVue fornece componentes acessíveis prontos; bundle < 500KB garante carregamento < 2s; lazy loading por rota; padrões inteligentes de defaults. |
| **II — IA baseada em dados** | ✅ N/A | Stack técnica não envolve IA. |
| **III — Rastreabilidade BNCC** | ✅ N/A | Stack técnica não envolve documentos. |
| **IV — LGPD** | ✅ APROVADO | Axios interceptor não loga corpo de request; `Authorization` header injetado automaticamente; guards de rota impedem acesso sem auth; `?redirect=` não expõe dados sensíveis. |
| **V — Fidelidade de documentos** | ✅ N/A | Stack técnica não envolve documentos. |

**Resultado**: Todas as gates aplicáveis aprovadas.

## Project Structure

### Documentação (esta feature)

```text
specs/002-stack-tecnica/
├── plan.md              # Este arquivo
├── research.md          # Cores ACAE, Vite config, Axios interceptors, bundle size
├── data-model.md        # Token de design + estrutura de configuração
├── quickstart.md        # npm create vite + PrimeVue + tema + .env
└── tasks.md             # (gerado por /speckit.tasks)
```

### Código-fonte

```text
frontend/                         # Raiz do projeto Vue
├── vite.config.ts                # Aliases @/, manualChunks, plugin vue
├── tsconfig.json                 # Strict, paths: @/*
├── .env.local                    # VITE_SUPABASE_URL, VITE_API_BASE_URL
├── .env.production               # Valores de produção (preenchidos no CI)
├── index.html                    # Template HTML com <div id="app">
└── src/
    ├── main.ts                   # Bootstrap: Vue + PrimeVue(AcaePreset) + Pinia + Router
    ├── App.vue                   # Root: <RouterView> + inactivity timer (quando autenticado)
    ├── theme/
    │   └── acae-preset.ts        # definePreset(Aura, { primary: roxo ACAE })
    ├── assets/
    │   ├── acae-colors.css       # CSS vars: --acae-yellow, --acae-yellow-light
    │   └── main.css              # Reset + font-size base 14px
    ├── services/
    │   ├── supabase.ts           # createClient(SUPABASE_URL, ANON_KEY)
    │   └── api.ts                # Axios + interceptor JWT + interceptor error (401/403/5xx)
    ├── router/
    │   ├── index.ts              # createRouter(history) + rotas com meta.requiresAuth
    │   └── guards.ts             # beforeEach: auth + role check
    ├── stores/
    │   └── auth.ts               # Pinia authStore (usada por 001-login)
    ├── layouts/
    │   ├── LayoutPublico.vue     # Apenas <slot> centrado — para /login
    │   └── LayoutAutenticado.vue # Menu lateral roxo + topbar + <RouterView>
    ├── pages/
    │   ├── LoginPage.vue         # /login — formulário 2 campos
    │   ├── DashboardPage.vue     # /dashboard — painel inicial
    │   └── NaoEncontradoPage.vue # /404 — link para home
    └── components/
        └── ui/                   # (vazio inicialmente — crescerá com as features)
```

## Decisões de Implementação

### Decisão 1 — PrimeVue v4 com `definePreset(Aura)` — sem CSS overrides

Toda customização visual é feita via `definePreset`. Isso garante consistência, manutenibilidade e compatibilidade com futuras versões do PrimeVue. CSS overrides globais pontuais são proibidos (RF-012).

### Decisão 2 — Amarelo como CSS variable, não token PrimeVue primário

O sistema de tokens do PrimeVue espera contraste com texto branco para a cor primária. O amarelo `#D97706` tem baixo contraste com branco. Usar como variável CSS customizada (`--acae-yellow`) aplicada pontualmente em badges e destaques evita violações WCAG.

### Decisão 3 — `manualChunks` para chunks de vendor

Separar `vue/vue-router/pinia`, `primevue` e `@supabase/supabase-js` em chunks independentes permite que o browser faça cache por vendor — ao mudar código de aplicação, os vendor chunks não são baixados novamente.

### Decisão 4 — Light mode apenas (`darkModeSelector: false`)

Dark mode foi explicitamente descartado para esta versão (RF-015). A opção `darkModeSelector: false` desabilita completamente o mecanismo de dark mode do PrimeVue, evitando CSS extra desnecessário.

### Decisão 5 — Dois layouts: `LayoutPublico` e `LayoutAutenticado`

O Vue Router usa `component: LayoutAutenticado` no `children` de rotas protegidas e `component: LayoutPublico` para `/login`. Isso mantém o menu lateral e a topbar separados da tela de login sem condicionais no `App.vue`.

### Decisão 6 — `api.ts` nunca loga corpos de request/response

O interceptor de request do Axios não loga o `config.data`. O interceptor de response não loga `error.response.data`. Logs são emitidos apenas com metadados (status, URL, timestamp) — nenhum dado pedagógico ou pessoal (RF-006, Princípio IV).
