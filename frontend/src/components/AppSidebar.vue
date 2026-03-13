<template>
  <nav class="top-bar">
    <!-- Left: Logo -->
    <div class="top-bar__left">
      <div class="rail-logo">
        <img src="@/assets/drawings/acaeLogo.png" alt="ACAE" class="logo-img" />
      </div>
    </div>

    <!-- Right: Logout + Teacher avatar -->
    <div class="top-bar__right">
      <button class="top-action" title="Sair" @click="authStore.logout()">
        <i class="pi pi-sign-out" />
      </button>
      <div
        class="teacher-avatar"
        :title="authStore.professor?.nome ?? 'Professor'"
        @click="$router.push('/perfil')"
      >
        <img
          :src="teacherPhotoUrl"
          :alt="authStore.professor?.nome ?? 'Professor'"
          @error="onImgError"
          ref="imgRef"
        />
        <span class="teacher-initials" v-if="showInitials">{{ initials }}</span>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const showInitials = ref(false)
const imgRef = ref<HTMLImageElement | null>(null)
const teacherPhotoUrl = '/teacher.jpg'

const initials = computed(() => {
  const nome = authStore.professor?.nome ?? ''
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'P'
})

function onImgError() {
  showInitials.value = true
  if (imgRef.value) imgRef.value.style.display = 'none'
}
</script>

<style scoped>
.top-bar {
  position: sticky;
  top: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  background: var(--bg-surface);
  border-bottom: 1.5px solid var(--border);
  padding: 0 1.5rem;
  flex-shrink: 0;
  box-shadow: 0 1px 8px rgba(0,0,0,0.05);
}

.top-bar__left {
  display: flex;
  align-items: center;
}

.rail-logo {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.logo-img {
  height: 38px;
  width: auto;
  display: block;
  object-fit: contain;
}

.top-bar__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.top-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: none;
  color: var(--acae-red);
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}
.top-action:hover {
  background: var(--acae-red-dim);
}

.teacher-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  overflow: hidden;
  border: 2.5px solid var(--acae-primary);
  box-shadow: 0 0 0 2px var(--acae-primary-dim);
  cursor: pointer;
  flex-shrink: 0;
  transition: box-shadow 0.2s, transform 0.2s;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--acae-primary) 0%, #FFE066 100%);
}
.teacher-avatar:hover {
  box-shadow: 0 0 0 3px var(--acae-primary-glow);
  transform: scale(1.08);
}
.teacher-avatar img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
  position: absolute;
  inset: 0;
}
.teacher-initials {
  font-size: 0.72rem;
  font-weight: 900;
  color: var(--acae-primary-text);
  letter-spacing: 0.03em;
  pointer-events: none;
  user-select: none;
  font-family: 'Nunito', sans-serif;
}
</style>