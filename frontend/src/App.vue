<template>
  <RouterView />
  <Transition name="app-fade">
    <AppLoading v-if="appLoading" />
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLoading from '@/components/AppLoading.vue'

const router = useRouter()
const appLoading = ref(true)

router.isReady().then(() => {
  setTimeout(() => { appLoading.value = false }, 400)
})
</script>

<style>
.app-fade-leave-active {
  transition: opacity 0.5s ease;
}
.app-fade-leave-to {
  opacity: 0;
}
</style>
