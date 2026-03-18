<template>
  <div class="app-layout">
    <AppSidebar />

    <div class="content-area">
      <!-- Top bar: title + action slot -->
      <div class="content-header">
        <div class="content-header__left">
          <h2 class="ch-title" v-if="pageLayout.title.value">{{ pageLayout.title.value }}</h2>
          <p class="ch-subtitle" v-if="pageLayout.subtitle.value">{{ pageLayout.subtitle.value }}</p>
        </div>
        <div class="content-header__right" id="page-action-portal"></div>
      </div>

      <main class="main-content">
        <Transition name="page-overlay">
          <div v-if="isPageLoading" class="page-loading-overlay">
            <div class="page-loading-bar" />
          </div>
        </Transition>
        <RouterView />
      </main>
    </div>

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
import { usePageLoading } from '@/composables/usePageLoading'
import { onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const { start, stop } = useInactivityTimer()
onMounted(start)
onUnmounted(stop)

const pageLayout = providePageLayout()

const { isPageLoading, beginNav } = usePageLoading()
const route = useRoute()
watch(() => route.path, () => beginNav(), { immediate: true })
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: row;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-base);
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100vh;
  overflow: hidden;
}

/* ── Top content header ── */
.content-header {
  position: sticky;
  top: 0;
  z-index: 150;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  background: var(--bg-surface);
  border-bottom: 1.5px solid var(--border);
  padding: 0 1.5rem;
  flex-shrink: 0;
  box-shadow: 0 1px 6px rgba(0,0,0,0.05);
}

.content-header__left {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}
.ch-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 900;
  color: var(--text-1);
  letter-spacing: -0.02em;
  font-family: 'Nunito', sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ch-subtitle {
  margin: 0;
  font-size: 0.72rem;
  color: var(--text-2);
  font-weight: 500;
}

.content-header__right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

/* ── Main content ── */
.main-content {
  flex: 1;
  overflow-y: auto;
  position: relative;
  font-family: 'Nunito', sans-serif;
  padding: 1.25rem 1.5rem;
}

/* ── Page loading ── */
.page-loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  background: var(--bg-base);
  pointer-events: none;
}
.page-loading-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  overflow: hidden;
}
.page-loading-bar::after {
  content: '';
  display: block;
  height: 100%;
  width: 45%;
  background: linear-gradient(90deg, transparent, var(--acae-primary), transparent);
  border-radius: 99px;
  animation: page-bar-slide 1.2s ease-in-out infinite;
}
@keyframes page-bar-slide {
  0%   { transform: translateX(-200%); }
  100% { transform: translateX(500%); }
}
.page-overlay-leave-active { transition: opacity 0.22s ease; }
.page-overlay-leave-to { opacity: 0; }

/* ── Mobile ── */
@media (max-width: 768px) {
  .app-layout {
    flex-direction: column;
  }
  .content-header {
    padding: 0 1rem;
    height: 52px;
  }
  .ch-subtitle { display: none; }
}
</style>
