<template>
  <aside class="sidebar">
    <!-- Logo -->
    <div class="sidebar-logo">
      <img src="@/assets/drawings/acaeLogo.png" alt="ACAE" class="logo-img" />
    </div>

    <!-- Nav -->
    <nav class="sidebar-nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        active-class="nav-item--active"
      >
        <i :class="item.icon" />
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>

    <!-- Footer: avatar + nome + logout -->
    <div class="sidebar-footer">
      <div class="user-card" @click="$router.push('/perfil')" title="Editar perfil">
        <div class="user-avatar">
          <img
            v-if="avatarSrc"
            :src="avatarSrc"
            :key="avatarSrc"
            :alt="authStore.professor?.nome"
            @error="onImgError"
            ref="imgRef"
          />
          <span class="user-initials" v-if="!avatarSrc || showInitials">{{ initials }}</span>
        </div>
        <div class="user-info">
          <span class="user-name">{{ authStore.professor?.nome ?? 'Professor' }}</span>
          <span class="user-role">{{ authStore.professor?.papel === 'coordenador' ? 'Coordenador' : 'Professor' }}</span>
        </div>
      </div>
      <button class="logout-btn" title="Sair" @click="authStore.logout()">
        <i class="pi pi-sign-out" />
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getAvatarSrc } from '@/composables/useAvatars'

const authStore = useAuthStore()
const showInitials = ref(false)
const imgRef = ref<HTMLImageElement | null>(null)

const avatarSrc = computed(() => getAvatarSrc(authStore.professor?.avatar_id ?? null))

const initials = computed(() => {
  const nome = authStore.professor?.nome ?? ''
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'P'
})

watch(avatarSrc, () => {
  showInitials.value = false
  if (imgRef.value) imgRef.value.style.display = 'block'
})

function onImgError() {
  showInitials.value = true
  if (imgRef.value) imgRef.value.style.display = 'none'
}

const navItems = [
  { to: '/turmas',           label: 'Turmas',      icon: 'pi pi-users' },
  { to: '/alunos',           label: 'Alunos',      icon: 'pi pi-user' },
  { to: '/registros',        label: 'Registros',   icon: 'pi pi-book' },
  { to: '/documentos/gerar', label: 'Gerar Doc.',  icon: 'pi pi-file-edit' },
  { to: '/chamada',          label: 'Chamada',     icon: 'pi pi-calendar-clock' },
  { to: '/atividades',       label: 'Atividades',  icon: 'pi pi-th-large' },
  { to: '/ocorrencias',      label: 'Ocorrências', icon: 'pi pi-megaphone' },
  { to: '/vineland',         label: 'Vineland',    icon: 'pi pi-chart-bar' },
]
</script>

<style scoped>
.sidebar {
  width: 220px;
  flex-shrink: 0;
  height: 100vh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  border-right: 1.5px solid var(--border);
  overflow: hidden;
}

/* Logo */
.sidebar-logo {
  display: flex;
  align-items: center;
  padding: 1.25rem 1.25rem 1rem;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.logo-img {
  height: 36px;
  width: auto;
  object-fit: contain;
}

/* Nav */
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0.75rem 0.75rem;
  overflow-y: auto;
  scrollbar-width: none;
}
.sidebar-nav::-webkit-scrollbar { display: none; }

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.875rem;
  border-radius: 8px;
  color: var(--text-2);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: 'Nunito', sans-serif;
  transition: background 0.15s, color 0.15s;
}
.nav-item i {
  font-size: 1rem;
  flex-shrink: 0;
  width: 18px;
  text-align: center;
}
.nav-item:hover:not(.nav-item--active) {
  background: var(--acae-primary-dim);
  color: var(--text-1);
}
.nav-item--active {
  background: linear-gradient(135deg, rgba(255, 204, 2, 0.85) 0%, rgba(255, 204, 2, 0.50) 100%);
  color: var(--acae-primary-text);
}
.nav-item--active i {
  color: var(--acae-primary-text);
}

/* Footer */
.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 0.75rem;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.user-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  cursor: pointer;
  border-radius: 8px;
  padding: 0.375rem 0.5rem;
  transition: background 0.15s;
  min-width: 0;
}
.user-card:hover {
  background: var(--bg-hover);
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--acae-primary) 0%, #FFE066 100%);
  border: 2px solid var(--acae-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}
.user-avatar img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.user-initials {
  font-size: 0.68rem;
  font-weight: 900;
  color: var(--acae-primary-text);
  letter-spacing: 0.02em;
  font-family: 'Nunito', sans-serif;
  pointer-events: none;
}

.user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.user-name {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'Nunito', sans-serif;
}
.user-role {
  font-size: 0.7rem;
  color: var(--text-3);
  font-weight: 500;
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: none;
  color: var(--acae-red);
  cursor: pointer;
  font-size: 0.95rem;
  flex-shrink: 0;
  transition: background 0.15s;
}
.logout-btn:hover {
  background: var(--acae-red-dim);
}
</style>
