<template>
  <div class="page-placeholder">
    <p v-if="authStore.professor">
      {{ authStore.professor.nome }} — {{ authStore.professor.papel }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { usePageLayout } from '@/composables/usePageLayout'
const authStore = useAuthStore()
usePageLayout({ title: 'Perfil', subtitle: authStore.professor?.nome ?? '' })
</script>

<style scoped>
.page-placeholder { padding: 1rem; }
</style>
