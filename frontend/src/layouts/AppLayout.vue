<template>
  <div class="app-layout">
    <aside class="sidebar">
      <AppSidebar />
    </aside>
    <main class="main-content">
      <RouterView />
    </main>
    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import AppSidebar from '@/components/AppSidebar.vue'
import { useInactivityTimer } from '@/composables/useInactivityTimer'
import { onMounted, onUnmounted } from 'vue'

const { start, stop } = useInactivityTimer()
onMounted(start)
onUnmounted(stop)
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}
.sidebar {
  width: 240px;
  flex-shrink: 0;
  background: #7c3aed;
}
.main-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}
</style>
