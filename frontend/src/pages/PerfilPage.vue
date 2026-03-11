<template>
  <div class="page-placeholder">
    <h2>Perfil</h2>
    <p v-if="authStore.professor">
      {{ authStore.professor.nome }} — {{ authStore.professor.papel }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
</script>

<style scoped>
.page-placeholder { padding: 1rem; }
</style>
