<template>
  <div class="page-container">
    <div class="page-header">
      <h2>Gerar Documento</h2>
      <p>Selecione o tipo e preencha os dados para gerar um documento pedagógico</p>
    </div>

    <div class="grid">
      <!-- Formulário -->
      <div class="col-12 lg:col-5">
        <div class="form-card">
          <div class="field">
            <label>Tipo de Documento</label>
            <Dropdown
              v-model="form.tipo"
              :options="tiposDocumento"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecione o tipo"
              fluid
            />
          </div>

          <div class="field">
            <label>Aluno</label>
            <Dropdown
              v-model="form.aluno_id"
              :options="alunos"
              optionLabel="nome"
              optionValue="id"
              placeholder="Selecione o aluno"
              :loading="loadingAlunos"
              fluid
            />
          </div>

          <div class="field" v-if="form.tipo !== 'resumo_pedagogico'">
            <label>Período Início</label>
            <DatePicker v-model="form.periodo_inicio" dateFormat="dd/mm/yy" fluid />
          </div>

          <div class="field" v-if="form.tipo !== 'resumo_pedagogico'">
            <label>Período Fim</label>
            <DatePicker v-model="form.periodo_fim" dateFormat="dd/mm/yy" fluid />
          </div>

          <div class="field">
            <label>Competências BNCC</label>
            <BnccSelector v-model="form.bncc_refs" />
          </div>

          <Message v-if="erroGeracao" severity="error" :closable="false">
            {{ erroGeracao }}
          </Message>

          <Button
            label="Gerar Documento"
            icon="pi pi-sparkles"
            :loading="estaGerando"
            :disabled="!formularioValido"
            @click="gerarDocumento"
            fluid
          />
        </div>
      </div>

      <!-- Rascunho -->
      <div class="col-12 lg:col-7" v-if="rascunho">
        <div class="rascunho-card sticky top-4">
          <div class="rascunho-header">
            <h3>Rascunho Gerado</h3>
            <Tag :value="rascunho.status" />
          </div>

          <DocumentoRevisor
            :rascunho="rascunho"
            @save="autoSalvar"
          />

          <div class="rascunho-actions">
            <BotaoExportar :rascunho-id="rascunho.id" />

            <Button
              v-if="rascunho.status !== 'finalizado'"
              label="Finalizar Documento"
              icon="pi pi-check"
              severity="success"
              :disabled="!podeFinalizar"
              @click="confirmarFinalizacao"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
import api from '@/services/api'

interface Aluno { id: string; nome: string; turma_id: string; turma_nome: string }
interface Rascunho { id: string; status: string; conteudo_gerado: string; conteudo_editado?: string }

const confirm = useConfirm()
const toast = useToast()

const tiposDocumento = [
  { label: 'Portfólio Semanal', value: 'portfolio_semanal' },
  { label: 'Relatório Individual', value: 'relatorio_individual' },
  { label: 'Atividade Adaptada', value: 'atividade_adaptada' },
  { label: 'Resumo Pedagógico', value: 'resumo_pedagogico' },
]

const form = ref({
  tipo: 'portfolio_semanal',
  aluno_id: '',
  periodo_inicio: null as Date | null,
  periodo_fim: null as Date | null,
  bncc_refs: [] as string[],
})

const alunos = ref<Aluno[]>([])
const loadingAlunos = ref(false)
const rascunho = ref<Rascunho | null>(null)
const estaGerando = ref(false)
const erroGeracao = ref('')

const formularioValido = computed(() =>
  !!form.value.tipo &&
  !!form.value.aluno_id &&
  form.value.bncc_refs.length > 0,
)

const podeFinalizar = computed(() => !!rascunho.value && rascunho.value.status !== 'finalizado')

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
})

async function gerarDocumento() {
  estaGerando.value = true
  erroGeracao.value = ''
  try {
    const payload = {
      tipo: form.value.tipo,
      aluno_id: form.value.aluno_id,
      bncc_refs: form.value.bncc_refs,
      periodo_inicio: form.value.periodo_inicio?.toISOString().slice(0, 10),
      periodo_fim: form.value.periodo_fim?.toISOString().slice(0, 10),
    }
    const { data } = await api.post<{ rascunho: Rascunho }>('/api/documents/generate', payload)
    rascunho.value = data.rascunho
  } catch (err: unknown) {
    const error = err as { response?: { data?: { error?: string } } }
    erroGeracao.value = error?.response?.data?.error ?? 'Erro ao gerar documento. Tente novamente.'
  } finally {
    estaGerando.value = false
  }
}

async function autoSalvar(texto: string) {
  if (!rascunho.value) return
  try {
    await api.patch(`/api/documents/rascunhos/${rascunho.value.id}`, { conteudo_editado: texto })
  } catch {
    /* handled silently — DocumentoRevisor shows error state */
  }
}

function confirmarFinalizacao() {
  confirm.require({
    message: 'Ao finalizar, o documento se tornará imutável. Confirmar?',
    header: 'Finalizar Documento',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Finalizar',
    rejectLabel: 'Cancelar',
    accept: finalizar,
  })
}

async function finalizar() {
  if (!rascunho.value) return
  try {
    await api.post(`/api/documents/rascunhos/${rascunho.value.id}/finalizar`, {
      conteudo_final: rascunho.value.conteudo_editado ?? rascunho.value.conteudo_gerado,
    })
    rascunho.value.status = 'finalizado'
    toast.add({ severity: 'success', summary: 'Documento finalizado', life: 3000 })
  } catch (err: unknown) {
    const error = err as { response?: { status?: number } }
    if (error?.response?.status === 409) {
      toast.add({ severity: 'warn', summary: 'Este documento já foi finalizado', life: 4000 })
    } else {
      toast.add({ severity: 'error', summary: 'Erro ao finalizar', life: 3000 })
    }
  }
}
</script>

<style scoped>
.page-container { padding: 1rem; }
.page-header { margin-bottom: 1.5rem; }
.page-header h2 { margin: 0 0 0.25rem; font-size: 1.5rem; color: #7c3aed; }
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
