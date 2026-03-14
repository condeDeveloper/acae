<template>
  <div class="app-layout">
    <AppSidebar />

    <!-- Combined content header: title (left) | nav (center) | action btn (right) -->
    <div class="content-header">
      <div class="content-header__left">
        <h2 class="ch-title" v-if="pageLayout.title.value">{{ pageLayout.title.value }}</h2>
        <p class="ch-subtitle" v-if="pageLayout.subtitle.value">{{ pageLayout.subtitle.value }}</p>
      </div>

      <nav class="content-header__nav">
        <ul class="ch-nav-list">
          <li v-for="item in navItems" :key="item.to">
            <RouterLink :to="item.to" class="ch-link" active-class="ch-link--active">
              <i :class="item.icon" />
              <span class="ch-link__label">{{ item.label }}</span>
              <span class="ch-link__indicator" />
            </RouterLink>
          </li>
        </ul>
      </nav>

      <div class="content-header__right" id="page-action-portal"></div>
    </div>

    <main class="main-content">
      <RouterView />
    </main>
    <Toast position="bottom-right" />
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import AppSidebar from '@/components/AppSidebar.vue'
import { useInactivityTimer } from '@/composables/useInactivityTimer'
import { providePageLayout } from '@/composables/usePageLayout'
import { onMounted, onUnmounted } from 'vue'

const { start, stop } = useInactivityTimer()
onMounted(start)
onUnmounted(stop)

const pageLayout = providePageLayout()

const navItems = [
  { to: '/turmas',           label: 'Turmas',    icon: 'pi pi-users' },
  { to: '/alunos',           label: 'Alunos',    icon: 'pi pi-user' },
  { to: '/registros',        label: 'Registros', icon: 'pi pi-book' },
  { to: '/documentos/gerar', label: 'Gerar',     icon: 'pi pi-file-edit' },
  { to: '/documentos',       label: 'Histórico', icon: 'pi pi-file' },
  { to: '/chamada',          label: 'Chamada',   icon: 'pi pi-calendar-clock' },
  { to: '/atividades',       label: 'Atividades', icon: 'pi pi-th-large' },
  { to: '/ocorrencias',      label: 'Ocorrências', icon: 'pi pi-megaphone' },
  { to: '/perfil',           label: 'Perfil',    icon: 'pi pi-cog' },
]
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--bg-base);
}

/* ── Combined content header ── */
.content-header {
  position: sticky;
  top: 52px;
  z-index: 150;
  display: flex;
  align-items: center;
  min-height: 64px;
  background: var(--bg-surface);
  border-bottom: 3px solid var(--acae-primary);
  padding: 0.5rem 1.5rem 0;
  flex-shrink: 0;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  overflow: visible;
}

.content-header__left {
  flex: 0 0 auto;
  min-width: 200px;
  padding-bottom: 0.5rem;
}
.ch-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 900;
  color: var(--text-1);
  letter-spacing: -0.02em;
  font-family: 'Nunito', sans-serif;
  line-height: 1.2;
}
.ch-subtitle {
  margin: 0.1rem 0 0;
  font-size: 0.72rem;
  color: var(--text-2);
  font-weight: 500;
}

/* ── Nav tabs (centered) ── */
.content-header__nav {
  flex: 1;
  display: flex;
  justify-content: center;
  align-self: stretch;
  overflow: visible;
}
.ch-nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: flex-end;
  height: 100%;
  gap: 2px;
}

.ch-link {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 70px;
  padding: 0.5rem 0.8rem 0.6rem;
  color: var(--text-3);
  text-decoration: none;
  font-size: 1.1rem;
  gap: 2px;
  border-radius: 8px 8px 0 0;
  transition: color 0.18s, background 0.18s;
  overflow: visible;
}
.ch-link__label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  white-space: nowrap;
  text-transform: uppercase;
  transition: opacity 0.18s;
  font-family: 'Nunito', sans-serif;
}
.ch-link:hover {
  color: var(--acae-primary-text);
  background: var(--acae-primary-dim);
}
.ch-link--active {
  color: var(--acae-primary-text) !important;
  background: var(--acae-primary-dim);
}

/* Indicator line — attaches to the golden border-bottom */
.ch-link__indicator {
  position: absolute;
  bottom: -3px;
  left: 8%;
  width: 84%;
  height: 6px;
  border-radius: 3px 3px 0 0;
  background: var(--acae-primary);
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
  z-index: 1;
}
.ch-link--active .ch-link__indicator {
  transform: scaleX(1);
}

/* ── Right action slot ── */
.content-header__right {
  flex: 0 0 auto;
  min-width: 200px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-bottom: 0.5rem;
}

.main-content {
  flex: 1;
  padding: 1.5rem 2rem;
  overflow-y: auto;
  min-width: 0;
  font-family: 'Nunito', sans-serif;
}
</style>

