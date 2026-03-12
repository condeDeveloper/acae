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
              @change="onAlunoChange"
            />
          </div>

          <div class="field" v-if="precisaDeDatas">
            <label>
              Período Início
              <span class="label-badge">{{ labelDias(form.periodo_inicio) }}</span>
            </label>
            <DatePicker
              v-model="form.periodo_inicio"
              dateFormat="dd/mm/yy"
              fluid
              :maxDate="form.periodo_fim ?? hoje"
              :minDate="minInicio"
              @update:modelValue="onInicioChange"
            />
          </div>

          <div class="field" v-if="precisaDeDatas">
            <label>
              Período Fim
              <span class="label-badge">{{ labelDias(form.periodo_fim) }}</span>
            </label>
            <DatePicker
              v-model="form.periodo_fim"
              dateFormat="dd/mm/yy"
              fluid
              :maxDate="hoje"
              :minDate="form.periodo_inicio ?? undefined"
              @update:modelValue="onFimChange"
            />
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

        <!-- Histórico de relatórios (apenas para relatorio_individual) -->
        <div class="historico-section" v-if="form.tipo === 'relatorio_individual' && form.aluno_id">
          <HistoricoRelatorios :aluno-id="form.aluno_id" />
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
import { ref, computed, watch, onMounted } from 'vue'
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
import api from '@/services/api'

interface Aluno { id: string; nome: string; turma_id: string; turma_nome: string }
interface Rascunho { id: string; status: string; conteudo_gerado: string; conteudo_editado?: string }

const confirm = useConfirm()
const toast = useToast()

const hoje = new Date()
hoje.setHours(23, 59, 59, 999)

const tiposDocumento = [
  { label: 'Portfólio Semanal', value: 'portfolio_semanal' },
  { label: 'Portfólio Mensal', value: 'portfolio_mensal' },
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

const precisaDeDatas = computed(() => form.value.tipo !== 'resumo_pedagogico' && form.value.tipo !== 'atividade_adaptada')

// Min inicio based on tipo and current fim
const minInicio = computed(() => {
  if (form.value.tipo === 'portfolio_semanal' && form.value.periodo_fim) {
    const d = new Date(form.value.periodo_fim)
    d.setDate(d.getDate() - 7)
    return d
  }
  if (form.value.tipo === 'portfolio_mensal' && form.value.periodo_fim) {
    const d = new Date(form.value.periodo_fim)
    d.setMonth(d.getMonth() - 1)
    return d
  }
  return undefined
})

function labelDias(date: Date | null): string {
  if (!date) return ''
  const agora = new Date()
  agora.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const diff = Math.round((agora.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'hoje'
  if (diff === 1) return 'ontem'
  if (diff > 0) return `${diff} dias atrás`
  return ''
}

function setDatasAutomaticas(tipo: string) {
  const fim = new Date()
  fim.setHours(0, 0, 0, 0)
  if (tipo === 'portfolio_semanal') {
    const inicio = new Date(fim)
    inicio.setDate(inicio.getDate() - 7)
    form.value.periodo_fim = new Date(fim)
    form.value.periodo_inicio = inicio
  } else if (tipo === 'portfolio_mensal') {
    const inicio = new Date(fim)
    inicio.setMonth(inicio.getMonth() - 1)
    form.value.periodo_fim = new Date(fim)
    form.value.periodo_inicio = inicio
  } else if (tipo === 'relatorio_individual') {
    // Keep as is — user sets manually
  } else {
    form.value.periodo_inicio = null
    form.value.periodo_fim = null
  }
}

// Clamp period_inicio when period_fim changes (enforce max range)
function onFimChange(val: Date | null) {
  if (!val) return
  if (form.value.tipo === 'portfolio_semanal' && form.value.periodo_inicio) {
    const minI = new Date(val)
    minI.setDate(minI.getDate() - 7)
    if (form.value.periodo_inicio < minI) form.value.periodo_inicio = minI
  }
  if (form.value.tipo === 'portfolio_mensal' && form.value.periodo_inicio) {
    const minI = new Date(val)
    minI.setMonth(minI.getMonth() - 1)
    if (form.value.periodo_inicio < minI) form.value.periodo_inicio = minI
  }
}

// Clamp period_fim when period_inicio changes (enforce max range)
function onInicioChange(val: Date | null) {
  if (!val) return
  if (form.value.tipo === 'portfolio_semanal' && form.value.periodo_fim) {
    const maxF = new Date(val)
    maxF.setDate(maxF.getDate() + 7)
    if (form.value.periodo_fim > maxF) form.value.periodo_fim = maxF
  }
  if (form.value.tipo === 'portfolio_mensal' && form.value.periodo_fim) {
    const maxF = new Date(val)
    maxF.setMonth(maxF.getMonth() + 1)
    if (form.value.periodo_fim > maxF) form.value.periodo_fim = maxF
  }
}

watch(() => form.value.tipo, (novoTipo) => {
  rascunho.value = null
  erroGeracao.value = ''
  setDatasAutomaticas(novoTipo)
}, { immediate: true })

async function onAlunoChange() {
  if (!form.value.aluno_id) return
  try {
    const { data } = await api.get<{ bncc_refs: string[] }>(`/api/alunos/${form.value.aluno_id}/bncc-recentes`)
    if (data.bncc_refs?.length) {
      form.value.bncc_refs = data.bncc_refs
    }
  } catch {
    /* non-critical */
  }
}

const formularioValido = computed(() => {
  if (!form.value.tipo || !form.value.aluno_id || form.value.bncc_refs.length === 0) return false
  if (precisaDeDatas.value && (!form.value.periodo_inicio || !form.value.periodo_fim)) return false
  return true
})

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
    const error = err as { response?: { data?: { error?: string; message?: string } } }
    const msg = error?.response?.data?.message ?? error?.response?.data?.error ?? 'Erro ao gerar documento. Tente novamente.'
    if (msg.includes('registros') || msg.includes('período')) {
      erroGeracao.value = msg + ' Acesse a tela de Registros para cadastrar as atividades do aluno antes de gerar o documento.'
    } else {
      erroGeracao.value = msg
    }
  } finally {
    estaGerando.value = false
  }
}

async function autoSalvar(texto: string) {
  if (!rascunho.value) return
  try {
    await api.patch(`/api/documents/rascunhos/${rascunho.value.id}`, { conteudo_editado: texto })
  } catch {
    /* handled silently */
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
.page-header h2 { margin: 0 0 0.25rem; font-size: 1.5rem; color: var(--acae-primary); }
.page-header p { margin: 0; color: var(--text-2); }
.form-card, .rascunho-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 1.5rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 1rem;
}
.field label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-2);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.label-badge {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--acae-primary);
  background: var(--acae-primary-dim);
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
}
.rascunho-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.rascunho-header h3 { margin: 0; color: var(--text-1); }
.rascunho-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}
.historico-section { margin-top: 1.25rem; }
.sticky { position: sticky; }
.top-4 { top: 1rem; }
.grid { display: flex; flex-wrap: wrap; gap: 1.5rem; }
.col-12 { flex: 1 1 100%; }
@media (min-width: 1024px) {
  .lg\:col-5 { flex: 0 0 calc(41.6667% - 0.75rem); }
  .lg\:col-7 { flex: 0 0 calc(58.3333% - 0.75rem); }
}
</style>
