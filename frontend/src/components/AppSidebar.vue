<template>
  <nav class="top-bar">
    <!-- Left: Logo -->
    <div class="top-bar__left">
      <div class="rail-logo">
        <span class="logo-mark">A</span>
      </div>
    </div>

    <!-- Center: Nav Icons -->
    <ul class="top-bar__nav">
      <li v-for="item in navItems" :key="item.to">
        <RouterLink :to="item.to" class="top-link" active-class="top-link--active">
          <i :class="item.icon" />
          <span class="top-link__label">{{ item.label }}</span>
          <span class="top-link__indicator" />
        </RouterLink>
      </li>
    </ul>

    <!-- Right: Teacher photo + logout -->
    <div class="top-bar__right">
      <button class="top-action" title="Sair" @click="authStore.logout()">
        <i class="pi pi-sign-out" />
        <span class="top-tooltip top-tooltip--left">Sair</span>
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
// Use runtime URL to avoid Vite bundling the image (it lives in /public)
const teacherPhotoUrl = '/teacher.jpg'

const navItems = [
  { to: '/turmas',           label: 'Turmas',    icon: 'pi pi-users' },
  { to: '/alunos',           label: 'Alunos',    icon: 'pi pi-user' },
  { to: '/registros',        label: 'Registros', icon: 'pi pi-book' },
  { to: '/documentos/gerar', label: 'Gerar',     icon: 'pi pi-file-edit' },
  { to: '/documentos',       label: 'Histórico', icon: 'pi pi-file' },
  { to: '/atividades',       label: 'BNCC',      icon: 'pi pi-th-large' },
  { to: '/perfil',           label: 'Perfil',    icon: 'pi pi-cog' },
]

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
/* ── Top Bar ── */
.top-bar {
  position: sticky;
  top: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  height: 72px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  padding: 0 1.5rem;
  flex-shrink: 0;
  box-shadow: 0 2px 20px rgba(0,0,0,0.35);
}

/* Left */
.top-bar__left {
  display: flex;
  align-items: center;
  min-width: 56px;
}

/* Logo */
.rail-logo {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--acae-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 18px var(--acae-primary-glow);
  flex-shrink: 0;
}
.logo-mark {
  font-size: 1.25rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.02em;
}

/* Center nav */
.top-bar__nav {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 100%;
}

/* Top nav links */
.top-link {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  height: 72px;
  padding: 0 0.875rem;
  color: var(--text-3);
  text-decoration: none;
  font-size: 1.3rem;
  overflow: hidden;
  transition: color 0.18s;
  gap: 3px;
}

/* label under icon */
.top-link__label {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
  text-transform: uppercase;
  opacity: 0.75;
  transition: opacity 0.18s;
}
.top-link--active .top-link__label,
.top-link:hover .top-link__label {
  opacity: 1;
}

/* gradient fill on hover */
.top-link::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 0%, var(--acae-primary-dim) 100%);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
  pointer-events: none;
}
.top-link:hover::before {
  transform: scaleX(1);
}
.top-link:hover {
  color: var(--text-1);
}

/* Active state */
.top-link--active {
  color: var(--acae-primary) !important;
}
.top-link--active::before {
  transform: scaleX(1);
  background: linear-gradient(135deg, transparent 0%, var(--acae-primary-dim) 100%);
}

/* Bottom indicator bar */
.top-link__indicator {
  position: absolute;
  bottom: 0;
  left: 10%;
  width: 80%;
  height: 4px;
  border-radius: 4px 4px 0 0;
  background: linear-gradient(90deg, var(--acae-primary), #a78bfa);
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
}
.top-link--active .top-link__indicator {
  transform: scaleX(1);
}

/* Tooltip (appears below) */
.top-tooltip {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-overlay);
  border: 1px solid var(--border-hover);
  color: var(--text-1);
  font-size: 0.72rem;
  font-weight: 500;
  white-space: nowrap;
  padding: 0.28rem 0.6rem;
  border-radius: 6px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s;
  z-index: 300;
  box-shadow: 0 4px 16px rgba(0,0,0,0.5);
}
.top-tooltip--left {
  left: auto;
  right: 0;
  transform: none;
}
.top-link:hover .top-tooltip,
.top-action:hover .top-tooltip {
  opacity: 1;
}

/* Right section */
.top-bar__right {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 56px;
  justify-content: flex-end;
}

/* Logout button — red by default, gradient on hover */
.top-action {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: none;
  color: var(--color-error);
  cursor: pointer;
  font-size: 1.15rem;
  transition: background 0.22s, color 0.22s, box-shadow 0.22s;
}
.top-action:hover {
  background: linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.32));
  color: #ff7171;
  box-shadow: 0 0 14px rgba(239,68,68,0.35);
}

/* Teacher avatar photo */
.teacher-avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--acae-primary);
  box-shadow: 0 0 12px var(--acae-primary-glow);
  cursor: pointer;
  flex-shrink: 0;
  transition: box-shadow 0.2s, transform 0.2s;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--acae-primary) 0%, #a78bfa 100%);
}
.teacher-avatar:hover {
  box-shadow: 0 0 20px var(--acae-primary-glow);
  transform: scale(1.08);
}
.teacher-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  position: absolute;
  inset: 0;
}
.teacher-initials {
  font-size: 0.78rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.03em;
  pointer-events: none;
  user-select: none;
}
</style>
