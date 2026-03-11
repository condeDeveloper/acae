<template>
  <form @submit.prevent="handleLogin" class="login-form">
    <div class="field">
      <label for="email">E-mail</label>
      <InputText
        id="email"
        v-model="email"
        type="email"
        placeholder="professor@escola.edu.br"
        autocomplete="email"
        required
        fluid
      />
    </div>

    <div class="field">
      <label for="password">Senha</label>
      <Password
        id="password"
        v-model="password"
        :feedback="false"
        placeholder="••••••••"
        autocomplete="current-password"
        required
        fluid
      />
    </div>

    <Message v-if="errorMsg" severity="error" :closable="false">{{ errorMsg }}</Message>

    <Button
      type="submit"
      label="Entrar"
      :loading="loading"
      fluid
      class="mt-3"
    />
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  loading.value = true
  errorMsg.value = ''
  try {
    await authStore.login(email.value, password.value)
  } catch {
    errorMsg.value = 'E-mail ou senha inválidos'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-form {
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
  font-weight: 500;
  color: #374151;
}
.mt-3 {
  margin-top: 0.5rem;
}
</style>
