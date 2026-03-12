import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Public routes
    {
      path: '/login',
      component: () => import('@/layouts/AuthLayout.vue'),
      children: [
        { path: '', name: 'login', component: () => import('@/pages/LoginPage.vue') },
      ],
    },
    // Protected routes
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'dashboard', redirect: '/turmas' },
        { path: 'turmas', name: 'turmas', component: () => import('@/pages/TurmasPage.vue') },
        { path: 'alunos', name: 'alunos', component: () => import('@/pages/AlunosPage.vue') },
        { path: 'registros', name: 'registros', component: () => import('@/pages/RegistrosPage.vue'), meta: { requiresAuth: true } },
        { path: 'documentos', name: 'documentos', component: () => import('@/pages/DocumentosPage.vue'), meta: { requiresAuth: true } },
        { path: 'documentos/gerar', name: 'gerar-documento', component: () => import('@/pages/GerarDocumentoPage.vue'), meta: { requiresAuth: true } },
        { path: 'relatorio-individual', name: 'relatorio-individual', component: () => import('@/pages/RelatorioIndividualPage.vue'), meta: { requiresAuth: true } },
        { path: 'atividades', name: 'atividades', component: () => import('@/pages/AtividadesPage.vue'), meta: { requiresAuth: true } },
        { path: 'perfil', name: 'perfil', component: () => import('@/pages/PerfilPage.vue') },
        { path: '403', name: 'forbidden', component: () => import('@/pages/ForbiddenPage.vue') },
      ],
    },
    { path: '/404', name: 'not-found', component: () => import('@/pages/NotFoundPage.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/404' },
  ],
})

// Navigation guard
router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.meta.role === 'coordenador' && authStore.papel !== 'coordenador') {
    return { path: '/403' }
  }
})

export default router
