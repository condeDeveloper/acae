<template>
  <!-- Tabs -->
  <div class="tabs">
    <button
      :class="['tab', { active: aba === 'login' }]"
      type="button"
      @click="switchAba('login')"
    >Entrar</button>
    <button
      :class="['tab', { active: aba === 'cadastro' }]"
      type="button"
      @click="switchAba('cadastro')"
    >Criar Conta</button>
  </div>

  <!-- Google button -->
  <button class="google-btn" type="button" :disabled="loadingGoogle" @click="handleGoogle">
    <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.16 0 5.99 1.09 8.22 2.87l6.13-6.13C34.7 3.1 29.64 1 24 1 14.82 1 6.96 6.41 3.26 14.17l7.24 5.62C12.36 13.38 17.73 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.5 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.68c-.55 2.97-2.2 5.48-4.67 7.17l7.17 5.57C43.48 37.24 46.5 31.33 46.5 24.5z"/>
      <path fill="#FBBC05" d="M10.5 28.21A14.56 14.56 0 0 1 9.5 24c0-1.47.25-2.9.69-4.21L2.95 14.17A23.06 23.06 0 0 0 1 24c0 3.71.89 7.21 2.46 10.3l7.04-6.09z"/>
      <path fill="#34A853" d="M24 47c6.48 0 11.93-2.15 15.91-5.83l-7.17-5.57C30.71 37.41 27.52 38.5 24 38.5c-6.27 0-11.64-3.88-13.5-9.29l-7.04 6.09C7.21 43 15.07 47 24 47z"/>
    </svg>
    <span>{{ loadingGoogle ? 'Redirecionando…' : 'Continuar com Google' }}</span>
  </button>

  <div class="divider"><span>ou</span></div>

  <!-- Alert -->
  <Message v-if="errorMsg" severity="error" :closable="false" class="mb-0">{{ errorMsg }}</Message>
  <Message v-if="successMsg" severity="success" :closable="false" class="mb-0">{{ successMsg }}</Message>

  <!-- LOGIN form -->
  <form v-if="aba === 'login'" @submit.prevent="handleLogin" class="auth-form">
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

    <div class="field-row">
      <div class="field-check">
        <Checkbox v-model="lembrar" :binary="true" inputId="lembrar" />
        <label for="lembrar">Lembrar de mim</label>
      </div>
    </div>

    <Button type="submit" label="Entrar" :loading="loading" fluid />
  </form>

  <!-- CADASTRO form -->
  <form v-else @submit.prevent="handleCadastro" class="auth-form">
    <div class="field">
      <label for="nome">Nome completo</label>
      <InputText
        id="nome"
        v-model="nome"
        type="text"
        placeholder="Ana Lucia"
        autocomplete="name"
        required
        fluid
      />
    </div>

    <div class="field">
      <label for="email-cad">E-mail</label>
      <InputText
        id="email-cad"
        v-model="email"
        type="email"
        placeholder="professor@escola.edu.br"
        autocomplete="email"
        required
        fluid
      />
    </div>

    <div class="field">
      <label for="senha-cad">Senha</label>
      <Password
        id="senha-cad"
        v-model="password"
        placeholder="Mínimo 6 caracteres"
        autocomplete="new-password"
        required
        fluid
        :pt="{ input: { minlength: '6' } }"
      />
    </div>

    <div class="field">
      <label for="senha-conf">Confirmar senha</label>
      <Password
        id="senha-conf"
        v-model="passwordConf"
        :feedback="false"
        placeholder="Repita a senha"
        autocomplete="new-password"
        required
        fluid
      />
    </div>

    <Button type="submit" label="Criar Conta" :loading="loading" fluid />
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Checkbox from 'primevue/checkbox'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()

const aba = ref<'login' | 'cadastro'>(route.query.tab === 'cadastro' ? 'cadastro' : 'login')
const nome = ref('')
const email = ref('')
const password = ref('')
const passwordConf = ref('')
const lembrar = ref(true)
const loading = ref(false)
const loadingGoogle = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

function switchAba(nova: 'login' | 'cadastro') {
  aba.value = nova
  errorMsg.value = ''
  successMsg.value = ''
}

async function handleLogin() {
  loading.value = true
  errorMsg.value = ''
  try {
    await authStore.login(email.value, password.value, lembrar.value)
  } catch {
    errorMsg.value = 'E-mail ou senha inválidos.'
  } finally {
    loading.value = false
  }
}

async function handleCadastro() {
  errorMsg.value = ''
  successMsg.value = ''
  if (password.value !== passwordConf.value) {
    errorMsg.value = 'As senhas não coincidem.'
    return
  }
  if (password.value.length < 6) {
    errorMsg.value = 'A senha deve ter no mínimo 6 caracteres.'
    return
  }
  loading.value = true
  try {
    const resultado = await authStore.register(nome.value, email.value, password.value)
    if (resultado === 'confirm-email') {
      successMsg.value = 'Conta criada! Verifique seu e-mail para ativar o acesso.'
      password.value = ''
      passwordConf.value = ''
    }
  } catch (err: unknown) {
    const msg = (err instanceof Error ? err.message : '') || ''
    if (msg.includes('already registered') || msg.includes('already in use')) {
      errorMsg.value = 'Este e-mail já está cadastrado. Tente entrar.'
    } else if (msg.toLowerCase().includes('invalid') && msg.toLowerCase().includes('email')) {
      errorMsg.value = 'E-mail inválido. Use um endereço real (ex: gmail.com) — o domínio precisa existir na internet.'
    } else {
      errorMsg.value = msg || 'Erro ao criar conta. Tente novamente.'
    }
  } finally {
    loading.value = false
  }
}

async function handleGoogle() {
  loadingGoogle.value = true
  errorMsg.value = ''
  try {
    await authStore.loginWithGoogle()
    // Browser will redirect to Google — no need to set loadingGoogle = false
  } catch {
    errorMsg.value = 'Não foi possível conectar com o Google. Tente novamente.'
    loadingGoogle.value = false
  }
}
</script>

<style scoped>
.tabs {
  display: flex;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border);
  margin-bottom: 1.25rem;
}
.tab {
  flex: 1;
  padding: 0.625rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  background: var(--bg-card);
  color: var(--text-3);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.tab:hover { background: var(--bg-hover); color: var(--text-1); }
.tab.active {
  background: var(--acae-primary);
  color: var(--acae-primary-text);
  font-weight: 800;
}

.google-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.625rem 1rem;
  border: 1px solid var(--border-hover);
  border-radius: 8px;
  background: var(--bg-card);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-1);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.google-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  border-color: rgba(255,255,255,0.2);
}
.google-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1rem 0;
  color: var(--text-3);
  font-size: 0.8125rem;
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

.auth-form {
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
  color: var(--text-2);
}
.field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.field-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-2);
}
.mb-0 {
  margin-bottom: 0;
}
</style>

