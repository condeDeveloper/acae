<template>
  <div class="page-container">
    <div class="grid">
      <!-- Formulário -->
      <div class="col-12 lg:col-5">
        <div class="form-card">
          <div class="field">
            <label>Aluno</label>
            <Dropdown
              v-model="store.form.aluno_id"
              :options="alunos"
              optionLabel="nome"
              optionValue="id"
              placeholder="Selecione o aluno"
              :loading="loadingAlunos"
              fluid
              @change="onAlunoChange"
            />
          </div>

          <div class="field">
            <label>Período Início</label>
            <DatePicker v-model="store.form.periodo_inicio" dateFormat="dd/mm/yy" fluid />
          </div>

          <div class="field">
            <label>Período Fim</label>
            <DatePicker v-model="store.form.periodo_fim" dateFormat="dd/mm/yy" fluid />
          </div>

          <div class="field">
            <label>Competências BNCC</label>
            <BnccSelector v-model="store.form.bncc_refs" />
          </div>

          <Message v-if="store.erroGeracao" severity="error" :closable="false">
            {{ store.erroGeracao }}
          </Message>

          <Button
            label="Gerar Relatório"
            icon="pi pi-sparkles"
            :loading="store.estaGerando"
            :disabled="!store.formularioValido"
            @click="store.gerarRelatorio()"
            fluid
          />
        </div>

        <!-- Histórico -->
        <div class="historico-section" v-if="store.form.aluno_id">
          <HistoricoRelatorios :aluno-id="store.form.aluno_id" />
        </div>
      </div>

      <!-- Rascunho -->
      <div class="col-12 lg:col-7" v-if="store.rascunho">
        <div class="rascunho-card sticky top-4">
          <div class="rascunho-header">
            <h3>Relatório Individual</h3>
            <Tag :value="store.rascunho.status" />
          </div>

          <DocumentoRevisor
            :rascunho="store.rascunho"
            @save="store.autoSalvar"
          />

          <div class="rascunho-actions">
            <BotaoExportar :rascunho-id="store.rascunho.id" />

            <Button
              v-if="store.rascunho.status !== 'finalizado'"
              label="Finalizar Relatório"
              icon="pi pi-check"
              severity="success"
              :disabled="!store.podeFinalizar"
              @click="confirmarFinalizacao"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Dropdown from 'primevue/dropdown'
import DatePicker from 'primevue/datepicker'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import BnccSelector from '@/components/BnccSelector.vue'
import DocumentoRevisor from '@/components/DocumentoRevisor.vue'
import BotaoExportar from '@/components/BotaoExportar.vue'
import HistoricoRelatorios from '@/components/HistoricoRelatorios.vue'
import { useRelatorioStore } from '@/stores/relatorio.store'
import api from '@/services/api'
import { usePageLayout } from '@/composables/usePageLayout'

interface Aluno { id: string; nome: string; turma_id: string; turma_nome: string }

const confirm = useConfirm()
const toast = useToast()
const store = useRelatorioStore()
usePageLayout({ title: 'Relatório Individual', subtitle: 'Gere e gerencie relatórios individuais dos alunos' })

const alunos = ref<Aluno[]>([])
const loadingAlunos = ref(false)

onMounted(async () => {
  loadingAlunos.value = true
  try {
    const { data } = await api.get<{ data: Aluno[] }>('/api/alunos')
    alunos.value = data.data
  } catch {
    /* handled by interceptor */
  } finally {
    loadingAlunos.value = false
  }
  if (store.form.aluno_id) {
    await store.carregarRascunhoAtivo(store.form.aluno_id)
  }
})

async function onAlunoChange() {
  if (store.form.aluno_id) {
    await store.carregarRascunhoAtivo(store.form.aluno_id)
  }
}

function confirmarFinalizacao() {
  confirm.require({
    message: 'Ao finalizar, o relatório se tornará imutável. Confirmar?',
    header: 'Finalizar Relatório',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Finalizar',
    rejectLabel: 'Cancelar',
    accept: finalizar,
  })
}

async function finalizar() {
  try {
    await store.finalizar(store.conteudoEditado)
    toast.add({ severity: 'success', summary: 'Relatório finalizado', life: 3000 })
  } catch (err: unknown) {
    const error = err as { response?: { status?: number } }
    if (error?.response?.status === 409) {
      toast.add({ severity: 'warn', summary: 'Este relatório já foi finalizado', life: 4000 })
      await store.carregarRascunhoAtivo(store.form.aluno_id)
    } else {
      toast.add({ severity: 'error', summary: 'Erro ao finalizar', life: 3000 })
    }
  }
}
</script>

<style scoped>
.page-container { padding: 1rem; }
.page-header { margin-bottom: 1.5rem; }
.page-header h2 { margin: 0 0 0.25rem; font-size: 1.75rem; font-weight: 900; font-family: 'Nunito', sans-serif; color: var(--text-1); }
.page-header p { margin: 0; color: #6b7280; }
.form-card, .rascunho-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 1rem;
}
.field label { font-size: 0.875rem; font-weight: 500; color: #374151; }
.historico-section { margin-top: 1.5rem; }
.rascunho-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.rascunho-header h3 { margin: 0; }
.rascunho-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}
.sticky { position: sticky; }
.top-4 { top: 1rem; }
.grid { display: flex; flex-wrap: wrap; gap: 1.5rem; }
.col-12 { flex: 1 1 100%; }
@media (min-width: 1024px) {
  .lg\:col-5 { flex: 0 0 calc(41.6667% - 0.75rem); }
  .lg\:col-7 { flex: 0 0 calc(58.3333% - 0.75rem); }
}
</style>
