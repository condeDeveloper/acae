<template>
  <div class="page-container">
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
              {{ tipoFixoPeriodo ? 'Data de início' : 'Período Início' }}
              <Tag v-if="labelDias(form.periodo_inicio)" :value="labelDias(form.periodo_inicio)" severity="warn" />
            </label>
            <DatePicker
              v-model="form.periodo_inicio"
              dateFormat="dd/mm/yy"
              fluid
              :maxDate="tipoFixoPeriodo ? hoje : (form.periodo_fim ?? hoje)"
              :minDate="tipoFixoPeriodo ? undefined : minInicio"
              @update:modelValue="onInicioChange"
            />
          </div>

          <div class="field" v-if="precisaDeDatas">
            <label>
              Período Fim
              <Tag v-if="tipoFixoPeriodo && form.periodo_fim" :value="labelPeriodoAutoFim" severity="info" />
              <Tag v-else-if="!tipoFixoPeriodo && labelDias(form.periodo_fim)" :value="labelDias(form.periodo_fim)" severity="warn" />
            </label>
            <DatePicker
              v-model="form.periodo_fim"
              dateFormat="dd/mm/yy"
              fluid
              :disabled="tipoFixoPeriodo"
              :maxDate="tipoFixoPeriodo ? undefined : hoje"
              :minDate="tipoFixoPeriodo ? undefined : (form.periodo_inicio ?? undefined)"
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
            class="btn-gerar-azul"
            @click="gerarDocumento"
            fluid
          />
        </div>

        <!-- Histórico de relatórios (apenas para relatorio_individual) -->
        <div class="historico-section" v-if="form.tipo === 'relatorio_individual' && form.aluno_id">
          <HistoricoRelatorios
            :aluno-id="form.aluno_id"
            :aluno-avatar-id="alunoSelecionado?.avatar_id ?? null"
            :aluno-nome="alunoSelecionado?.nome ?? ''"
          />
        </div>
      </div>

      <!-- Rascunho / Empty state -->
      <div class="col-12 lg:col-7">
        <!-- Empty state when no document generated yet -->
        <div v-if="!rascunho && !estaGerando" class="empty-state-card sticky top-4">
          <i class="pi pi-file-edit empty-state-icon" />
          <h3 class="empty-state-title">Nenhum documento gerado ainda</h3>
          <p class="empty-state-desc">
            Preencha o formulário ao lado e clique em
            <strong>Gerar Documento</strong> para criar um rascunho com IA.
          </p>
          <ul class="empty-state-tips">
            <li><i class="pi pi-check-circle" /> Selecione o tipo de documento</li>
            <li><i class="pi pi-check-circle" /> Escolha o aluno</li>
            <li><i class="pi pi-check-circle" /> Defina o período</li>
            <li><i class="pi pi-check-circle" /> Vincule competências BNCC</li>
          </ul>
        </div>

        <!-- Loading state -->
        <div v-if="estaGerando" class="empty-state-card sticky top-4 loading-state">
          <i class="pi pi-spin pi-spinner empty-state-icon" style="color: var(--acae-blue)" />
          <h3 class="empty-state-title">Gerando documento com IA...</h3>
          <p class="empty-state-desc">Aguarde enquanto a inteligência artificial cria seu documento personalizado.</p>
        </div>

        <!-- Rascunho when generated -->
        <div v-if="rascunho" class="rascunho-card sticky top-4">
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
import { usePageLayout } from '@/composables/usePageLayout'

interface Aluno { id: string; nome: string; turma_id: string; turma_nome: string; avatar_id?: number | null }
interface Rascunho { id: string; status: string; conteudo_gerado: string; conteudo_editado?: string }

const confirm = useConfirm()
const toast = useToast()

usePageLayout({ title: 'Gerar Documento', subtitle: 'Selecione o tipo e preencha os dados' })

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

const alunoSelecionado = computed(() => alunos.value.find(a => a.id === form.value.aluno_id) ?? null)

const precisaDeDatas = computed(() => form.value.tipo !== 'resumo_pedagogico' && form.value.tipo !== 'atividade_adaptada')

// Tipos onde o fim é calculado automaticamente a partir do início
const tipoFixoPeriodo = computed(() =>
  form.value.tipo === 'portfolio_semanal' || form.value.tipo === 'portfolio_mensal'
)

// Min inicio — só relevante para relatorio_individual
const minInicio = computed(() => {
  if (form.value.tipo === 'relatorio_individual' && form.value.periodo_fim) {
    const d = new Date(form.value.periodo_fim)
    d.setFullYear(d.getFullYear() - 2)
    return d
  }
  return undefined
})

// Label informativo do fim auto-calculado
const labelPeriodoAutoFim = computed(() => {
  if (!form.value.periodo_fim) return ''
  return `até ${form.value.periodo_fim.toLocaleDateString('pt-BR')}`
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
  if (tipo === 'portfolio_semanal') {
    // Default: semana atual começando na segunda-feira
    const hoje2 = new Date()
    hoje2.setHours(0, 0, 0, 0)
    const diaSemana = hoje2.getDay() === 0 ? 7 : hoje2.getDay()
    const inicio = new Date(hoje2)
    inicio.setDate(hoje2.getDate() - (diaSemana - 1))
    form.value.periodo_inicio = inicio
    const fim = new Date(inicio)
    fim.setDate(inicio.getDate() + 6)
    form.value.periodo_fim = fim
  } else if (tipo === 'portfolio_mensal') {
    // Default: mês atual (1º ao último dia)
    const hoje2 = new Date()
    const inicio = new Date(hoje2.getFullYear(), hoje2.getMonth(), 1)
    const fim = new Date(hoje2.getFullYear(), hoje2.getMonth() + 1, 0)
    form.value.periodo_inicio = inicio
    form.value.periodo_fim = fim
  } else if (tipo === 'relatorio_individual') {
    // Usuário define manualmente — não pré-preencher
  } else {
    form.value.periodo_inicio = null
    form.value.periodo_fim = null
  }
}

// Fim livre apenas para relatorio_individual
function onFimChange(_val: Date | null) {
  // noop para semanal/mensal (fim é sempre auto-calculado)
}

// Ao mudar início: auto-calcula fim para semanal/mensal
function onInicioChange(val: Date | null) {
  if (!val) return
  if (form.value.tipo === 'portfolio_semanal') {
    const fim = new Date(val)
    fim.setDate(fim.getDate() + 6) // 7 dias inclusivos
    form.value.periodo_fim = fim
  } else if (form.value.tipo === 'portfolio_mensal') {
    const fim = new Date(val)
    fim.setMonth(fim.getMonth() + 1)
    fim.setDate(fim.getDate() - 1) // último dia do mês
    form.value.periodo_fim = fim
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
.page-header h2 { margin: 0 0 0.25rem; font-size: 1.75rem; font-weight: 900; font-family: 'Nunito', sans-serif; color: var(--text-1); }
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
:deep(.btn-gerar-azul.p-button) {
  background: linear-gradient(135deg, var(--acae-blue) 0%, #2d6bc4 100%) !important;
  border-color: #2d6bc4 !important;
  color: #fff !important;
  font-weight: 700;
}
:deep(.btn-gerar-azul.p-button:hover:not(:disabled)) {
  background: linear-gradient(135deg, #3d84d8 0%, #2460b5 100%) !important;
  border-color: #2460b5 !important;
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

/* ── Empty state ── */
.empty-state-card {
  background: var(--bg-card);
  border: 2px dashed var(--border);
  border-radius: 10px;
  padding: 3rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  min-height: 340px;
  justify-content: center;
}
.loading-state { border-style: solid; border-color: var(--acae-blue); }
.empty-state-icon {
  font-size: 3.5rem;
  color: var(--text-3);
  opacity: 0.6;
}
.empty-state-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-2);
  font-family: 'Nunito', sans-serif;
}
.empty-state-desc {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-3);
  max-width: 360px;
  line-height: 1.5;
}
.empty-state-tips {
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  text-align: left;
}
.empty-state-tips li {
  font-size: 0.8rem;
  color: var(--text-3);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.empty-state-tips li i { color: var(--acae-primary); font-size: 0.8rem; }
</style>
