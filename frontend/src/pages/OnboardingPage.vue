<template>
  <div class="onboarding-wrapper">
    <div class="onboarding-card">
      <!-- Logo / Marca -->
      <div class="onboarding-logo">
          <img :src="acaeLogo" alt="ACAE" class="logo-img" />
      </div>

      <!-- Indicador de passos -->
      <div class="step-indicator">
        <div
          v-for="n in 3"
          :key="n"
          class="step-dot"
          :class="{ active: passo === n, done: passo > n }"
        />
      </div>

      <!-- ── Passo 1: Bem-vindo ── -->
      <Transition name="slide" mode="out-in">
        <div v-if="passo === 1" key="1" class="step-content">
          <div class="step-icon">
            <i class="pi pi-sparkles" />
          </div>
          <h1 class="step-title">Bem-vindo ao ACAE!</h1>
          <p class="step-desc">
            O ACAE é a plataforma para professores da educação especial criarem registros pedagógicos, gerar documentos com IA e acompanhar o desenvolvimento dos alunos.
          </p>
          <ul class="features-list">
            <li><i class="pi pi-check-circle" /> Registros de alunos organizados por turma</li>
            <li><i class="pi pi-check-circle" /> Geração de documentos com IA em segundos</li>
            <li><i class="pi pi-check-circle" /> Chamada, ocorrências e avaliações integradas</li>
          </ul>
          <Button label="Começar configuração" icon="pi pi-arrow-right" iconPos="right" class="btn-next" @click="passo = 2" />
        </div>

        <!-- ── Passo 2: Escola ── -->
        <div v-else-if="passo === 2" key="2" class="step-content">
          <div class="step-icon">
            <i class="pi pi-building" />
          </div>
          <h1 class="step-title">Sua escola</h1>
          <p class="step-desc">
            Informe o nome da escola onde você trabalha. Ele será usado automaticamente nos documentos gerados.
          </p>
          <div class="field">
            <label>Nome da escola *</label>
            <InputText
              v-model="escola"
              placeholder="Ex: EMEF Maria Aparecida"
              fluid
              autofocus
              @keyup.enter="escola.trim() && (passo = 3)"
            />
          </div>
          <div class="step-actions">
            <Button label="Voltar" severity="secondary" text @click="passo = 1" />
            <Button
              label="Continuar"
              icon="pi pi-arrow-right"
              iconPos="right"
              class="btn-next"
              :disabled="!escola.trim()"
              @click="passo = 3"
            />
          </div>
        </div>

        <!-- ── Passo 3: Primeira turma ── -->
        <div v-else key="3" class="step-content">
          <div class="step-icon">
            <i class="pi pi-graduation-cap" />
          </div>
          <h1 class="step-title">Crie sua primeira turma</h1>
          <p class="step-desc">
            Uma turma agrupa seus alunos. Você pode criar mais turmas depois.
          </p>
          <div class="fields-grid">
            <div class="field">
              <label>Nome da turma *</label>
              <InputText v-model="turmaForm.nome" placeholder="Ex: Turma A – AEE Manhã" fluid />
            </div>
            <div class="field">
              <label>Turno *</label>
              <Select
                v-model="turmaForm.turno"
                :options="turnosOpcoes"
                optionLabel="label"
                optionValue="value"
                placeholder="Selecione"
                fluid
              />
            </div>
          </div>
          <div class="step-actions">
            <Button label="Voltar" severity="secondary" text @click="passo = 2" />
            <Button
              label="Concluir"
              icon="pi pi-check"
              class="btn-next"
              :loading="salvando"
              :disabled="!turmaValida"
              @click="concluir"
            />
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { useToast } from 'primevue/usetoast'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import acaeLogo from '@/assets/drawings/acaeLogo.png'

const toast = useToast()
const router = useRouter()
const authStore = useAuthStore()

const passo = ref(1)
const escola = ref(authStore.professor?.escola ?? '')
const salvando = ref(false)

const turmaForm = ref({ nome: '', turno: '' })
const turnosOpcoes = [
  { label: 'Manhã', value: 'manha' },
  { label: 'Tarde', value: 'tarde' },
  { label: 'Integral', value: 'integral' },
]
const turmaValida = computed(() => turmaForm.value.nome.trim().length > 0 && turmaForm.value.turno !== '')

async function concluir() {
  salvando.value = true
  try {
    // 1. Marca onboarding concluído e salva escola
    const { data: professor } = await api.patch('/api/auth/onboarding', { escola: escola.value.trim() })
    authStore.professor = professor

    // 2. Cria a primeira turma
    await api.post('/api/turmas', {
      nome: turmaForm.value.nome.trim(),
      ano_letivo: new Date().getFullYear(),
      turno: turmaForm.value.turno,
      escola: escola.value.trim(),
    })

    toast.add({ severity: 'success', summary: 'Tudo pronto!', detail: 'Sua conta está configurada.', life: 4000 })
    await router.push('/turmas')
  } catch {
    toast.add({ severity: 'error', summary: 'Erro ao salvar', detail: 'Tente novamente.', life: 3000 })
  } finally {
    salvando.value = false
  }
}
</script>

<style scoped>
.onboarding-wrapper {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-base, #f5f5f5);
  padding: 1.5rem;
}

.onboarding-card {
  background: var(--bg-card, #fff);
  border-radius: 1.25rem;
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.10);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
}

.onboarding-logo {
  margin-bottom: 0.25rem;
}
.logo-img { height: 40px; }
.logo-text { font-size: 1.5rem; font-weight: 900; color: var(--acae-blue, #4A90E2); letter-spacing: -0.03em; }

.step-indicator {
  display: flex;
  gap: 0.5rem;
}
.step-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border, #e2e8f0);
  transition: all 0.25s;
}
.step-dot.active {
  width: 24px;
  border-radius: 4px;
  background: var(--acae-blue, #4A90E2);
}
.step-dot.done {
  background: var(--acae-blue, #4A90E2);
  opacity: 0.4;
}

.step-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.step-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--acae-blue, #4A90E2) 12%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
}
.step-icon .pi {
  font-size: 1.75rem;
  color: var(--acae-blue, #4A90E2);
}

.step-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-1, #111);
  margin: 0;
  text-align: center;
}

.step-desc {
  font-size: 0.9375rem;
  color: var(--text-2, #555);
  margin: 0;
  text-align: center;
  line-height: 1.55;
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}
.features-list li {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 0.9rem;
  color: var(--text-1, #111);
}
.features-list .pi {
  color: var(--acae-blue, #4A90E2);
  font-size: 1rem;
  flex-shrink: 0;
}

.field {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.field label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-2, #555);
}

.fields-grid {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.btn-next { width: 100%; justify-content: center; }

.step-actions {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.25rem;
}
.step-actions .btn-next { flex: 1; }

/* Slide transition */
.slide-enter-active,
.slide-leave-active { transition: all 0.25s ease; }
.slide-enter-from { opacity: 0; transform: translateX(20px); }
.slide-leave-to { opacity: 0; transform: translateX(-20px); }
</style>
