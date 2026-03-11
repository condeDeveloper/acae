<template>
  <nav class="sidebar-nav">
    <div class="sidebar-logo">
      <span class="logo-text">ACAE</span>
    </div>

    <ul class="nav-items">
      <li v-for="item in navItems" :key="item.to">
        <RouterLink :to="item.to" class="nav-link" active-class="nav-link--active">
          <i :class="item.icon" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </li>
    </ul>

    <div class="sidebar-footer">
      <div class="professor-info" v-if="authStore.professor">
        <span class="professor-nome">{{ authStore.professor.nome }}</span>
        <span class="professor-papel">{{ authStore.professor.papel }}</span>
      </div>
      <button class="logout-btn" @click="authStore.logout()">
        <i class="pi pi-sign-out" />
        <span>Sair</span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const navItems = [
  { to: '/turmas', label: 'Turmas', icon: 'pi pi-users' },
  { to: '/alunos', label: 'Alunos', icon: 'pi pi-user' },
  { to: '/documentos/gerar', label: 'Gerar Documento', icon: 'pi pi-file-edit' },
  { to: '/documentos', label: 'Documentos', icon: 'pi pi-file' },
  { to: '/relatorio-individual', label: 'Relatório Individual', icon: 'pi pi-chart-bar' },
  { to: '/perfil', label: 'Perfil', icon: 'pi pi-cog' },
]
</script>

<style scoped>
.sidebar-nav {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1rem 0;
  color: #fff;
}
.sidebar-logo {
  padding: 0.5rem 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.15);
}
.logo-text {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: 0.05em;
}
.nav-items {
  list-style: none;
  margin: 1rem 0 0;
  padding: 0;
  flex: 1;
}
.nav-link {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 1.25rem;
  color: rgba(255,255,255,0.8);
  text-decoration: none;
  font-size: 0.875rem;
  transition: background 0.15s;
}
.nav-link:hover {
  background: rgba(255,255,255,0.1);
  color: #fff;
}
.nav-link--active {
  background: rgba(255,255,255,0.15);
  color: #fff;
  font-weight: 600;
}
.sidebar-footer {
  padding: 1rem 1.25rem 0;
  border-top: 1px solid rgba(255,255,255,0.15);
}
.professor-info {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.75rem;
}
.professor-nome {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #fff;
}
.professor-papel {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.65);
  text-transform: capitalize;
}
.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: rgba(255,255,255,0.75);
  cursor: pointer;
  padding: 0.5rem 0;
  font-size: 0.875rem;
  width: 100%;
}
.logout-btn:hover {
  color: #fff;
}
</style>
