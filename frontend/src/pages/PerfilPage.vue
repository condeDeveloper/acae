<template>
  <div class="perfil-container">
    <div class="perfil-card">
      <!-- Avatar -->
      <div class="avatar-section">
        <AvatarSelector v-model="avatarId" />
      </div>

      <!-- Campos -->
      <div class="fields">
        <div class="field">
          <label for="nome">Nome completo</label>
          <InputText id="nome" v-model="nome" placeholder="Seu nome" fluid />
        </div>

        <div class="field">
          <label for="escola">Escola</label>
          <InputText id="escola" v-model="escola" placeholder="Nome da escola" fluid />
        </div>

        <div class="field">
          <label><i class="pi pi-lock" style="font-size: 0.75rem; opacity: 0.6;" /> E-mail</label>
          <InputText :value="authStore.professor?.email" disabled fluid />
        </div>

        <div class="field">
          <label><i class="pi pi-lock" style="font-size: 0.75rem; opacity: 0.6;" /> Perfil</label>
          <InputText :value="authStore.professor?.papel === 'coordenador' ? 'Coordenador' : 'Professor'" disabled fluid />
        </div>
      </div>

      <Message v-if="errorMsg" severity="error" :closable="false">{{ errorMsg }}</Message>
      <Message v-if="successMsg" severity="success" :closable="false">{{ successMsg }}</Message>

      <Button
        label="Salvar alterações"
        icon="pi pi-check"
        :loading="salvando"
        :disabled="!temAlteracao"
        fluid
        @click="salvar"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'
import AvatarSelector from '@/components/AvatarSelector.vue'
import { useAuthStore } from '@/stores/auth'
import { usePageLayout } from '@/composables/usePageLayout'
import api from '@/services/api'

const authStore = useAuthStore()
usePageLayout({ title: 'Perfil', subtitle: 'Suas informações de conta' })

const nome = ref(authStore.professor?.nome ?? '')
const escola = ref(authStore.professor?.escola ?? '')
const avatarId = ref<number | null>(authStore.professor?.avatar_id ?? null)
const salvando = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const temAlteracao = computed(() =>
  nome.value.trim() !== (authStore.professor?.nome ?? '') ||
  escola.value.trim() !== (authStore.professor?.escola ?? '') ||
  avatarId.value !== (authStore.professor?.avatar_id ?? null)
)

async function salvar() {
  errorMsg.value = ''
  successMsg.value = ''
  if (!nome.value.trim()) {
    errorMsg.value = 'O nome não pode estar vazio.'
    return
  }
  salvando.value = true
  try {
    const { data } = await api.patch('/api/auth/perfil', {
      nome: nome.value.trim(),
      escola: escola.value.trim(),
      avatar_id: avatarId.value,
    })
    authStore.professor = data
    successMsg.value = 'Perfil atualizado com sucesso!'
  } catch {
    errorMsg.value = 'Erro ao salvar. Tente novamente.'
  } finally {
    salvando.value = false
  }
}
</script>

<style scoped>
.perfil-container {
  padding: 1.5rem;
  display: flex;
  justify-content: center;
}

.perfil-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 480px;
}

.avatar-section {
  display: flex;
  justify-content: center;
}

.fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.field label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-2);
}
</style>
