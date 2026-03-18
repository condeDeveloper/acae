<template>
  <div class="page-container">

    <!-- Seta animada de scroll (task 7) -->
    <Transition name="seta">
      <button v-if="mostrarSeta" class="seta-scroll" title="Ver rascunho completo" @click="irParaFim">
        <i class="pi pi-angle-down" />
      </button>
    </Transition>

    <!-- Toolbar superior (task 8) -->
    <div class="page-toolbar">
      <Button
        label="Histórico"
        icon="pi pi-history"
        class="btn-historico-grad"
        size="small"
        @click="abrirHistorico"
      />
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

          <div class="field" v-if="precisaDeDatas">
            <label>
              {{ tipoFixoPeriodo ? 'Data de início' : 'Período Início' }}
              <Tag v-if="labelDias(form.periodo_inicio)" :value="labelDias(form.periodo_inicio)" severity="warn" />
            </label>
            <DatePicker
              v-model="form.periodo_inicio"
              dateFormat="dd/mm/yy"
              fluid
              showIcon
              :maxDate="tipoFixoPeriodo ? hoje : (form.periodo_fim ?? hoje)"
              :minDate="tipoFixoPeriodo ? undefined : minInicio"
              @update:modelValue="onInicioChange"
            />
          </div>

          <div class="field" v-if="precisaDeDatas">
            <label>
              Período Fim
              <Tag v-if="form.periodo_fim" :value="labelPeriodoAutoFim" severity="info" />
            </label>
            <div class="periodo-fim-locked">
              <i class="pi pi-lock" />
              <span>{{ form.periodo_fim ? form.periodo_fim.toLocaleDateString('pt-BR') : 'calculado automaticamente' }}</span>
            </div>
          </div>

          <!-- BNCC: apenas para atividade_adaptada (task 6) -->
          <div class="field" v-if="form.tipo === 'atividade_adaptada'">
            <label>Competências BNCC</label>
            <BnccSelector v-model="form.bncc_refs" />
          </div>

          <!-- Indicador de quota de IA -->
          <div v-if="quota" class="quota-bar" :class="quotaClass">
            <i :class="quotaIcon" class="quota-icon" />
            <span>{{ quotaLabel }}</span>
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
      </div>

      <!-- Rascunho / Empty state -->
      <div class="col-12 lg:col-7">
        <!-- Empty state -->
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
          </ul>
        </div>

        <!-- Loading -->
        <div v-if="estaGerando" class="empty-state-card sticky top-4 loading-state">
          <i class="pi pi-spin pi-spinner empty-state-icon" style="color: var(--acae-blue)" />
          <h3 class="empty-state-title">Gerando documento com IA...</h3>
          <p class="empty-state-desc">Aguarde enquanto a inteligência artificial cria seu documento personalizado.</p>
        </div>

        <!-- Rascunho -->
        <div v-if="rascunho" class="rascunho-card sticky top-4">
          <!-- task 7: tag à esquerda, botões à direita -->
          <div class="rascunho-header">
            <Tag :value="rascunho.status" />
            <div class="rascunho-header-actions">
              <BotaoExportar :rascunho-id="rascunho.id" />
              <Button
                v-if="rascunho.status !== 'finalizado'"
                label="Finalizar"
                icon="pi pi-check"
                severity="success"
                :disabled="!podeFinalizar"
                @click="confirmarFinalizacao"
              />
            </div>
          </div>

          <DocumentoRevisor
            :rascunho="rascunho"
            @save="autoSalvar"
          />
        </div>
      </div>
    </div>

    <!-- ── Modal Histórico (task 8) ──────────────────────────────────── -->
    <Dialog
      v-model:visible="historicoVisible"
      header="Histórico de Documentos"
      :modal="true"
      :style="{ width: '960px', maxWidth: '96vw' }"
      :draggable="false"
      class="hist-dialog"
      @show="onHistoricoAberto"
    >
      <!-- Filtro todos / por turma -->
      <div class="hist-filtros">
        <div class="hist-modo-toggle">
          <button
            class="hist-modo-btn"
            :class="{ active: histModo === 'todos' }"
            @click="histModo = 'todos'"
          >Todos</button>
          <button
            class="hist-modo-btn"
            :class="{ active: histModo === 'turma' }"
            @click="histModo = 'turma'"
          >Por turma</button>
        </div>

        <Select
          v-if="histModo === 'turma'"
          v-model="histTurmaId"
          :options="turmas"
          optionLabel="nome"
          optionValue="id"
          placeholder="Selecione a turma"
          style="min-width: 220px"
        />
      </div>

      <!-- Empty state -->
      <div v-if="!histLoading && documentosFiltrados.length === 0" class="hist-empty">
        <i class="pi pi-file" style="font-size: 2.5rem; opacity: 0.35;" />
        <p class="hist-empty-title">Nenhum documento encontrado</p>
        <p class="hist-empty-sub">
          {{ histModo === 'turma' && histTurmaId ? 'Nenhum documento para esta turma.' : 'Gere um documento na aba Gerar para ele aparecer aqui.' }}
        </p>
      </div>

      <!-- Tabela -->
      <DataTable
        v-else
        :value="documentosFiltrados"
        :loading="histLoading"
        :paginator="documentosFiltrados.length > 7"
        :rows="7"
        sortField="finalizado_em"
        :sortOrder="-1"
        class="cursor-pointer-rows"
        :pt="{ wrapper: { style: 'overflow-x: hidden' } }"
        @row-click="abrirDownload($event.data)"
      >
        <Column field="aluno_nome" header="Aluno" sortable style="width: 24%">
          <template #body="{ data }">
            <div class="hist-nome-cell">
              <img
                v-if="getAvatarSrc(data.aluno_avatar_id)"
                :src="getAvatarSrc(data.aluno_avatar_id)!"
                class="hist-avatar"
                alt="avatar"
              />
              <AvatarInitials
                v-else
                :nome="data.aluno_nome ?? '?'"
                :seed="data.aluno_nome ?? '?'"
                :size="32"
              />
              <span class="hist-cell-text">{{ data.aluno_nome ?? '—' }}</span>
            </div>
          </template>
        </Column>
        <Column field="tipo" header="Tipo" sortable style="width: 22%">
          <template #body="{ data }">
            <span class="hist-cell-text">{{ tipoLabel(data.tipo) }}</span>
          </template>
        </Column>
        <Column v-if="!isMobile" field="periodo" header="Período" style="width: 28%" />
        <Column v-if="!isMobile" field="finalizado_em" header="Data" sortable style="width: 18%">
          <template #body="{ data }">
            {{ data.finalizado_em ? new Date(data.finalizado_em).toLocaleDateString('pt-BR') : '—' }}
          </template>
        </Column>
        <Column header="" style="width: 8%; text-align: center">
          <template #body="{ data }">
            <Button icon="pi pi-download" text rounded @click.stop="abrirFormato(data)" />
          </template>
        </Column>
      </DataTable>
    </Dialog>

    <!-- Sub-dialog: detalhes + download -->
    <Dialog v-model:visible="downloadVisible" header="Baixar Documento" :modal="true" :style="{ width: '380px' }" appendTo="body">
      <div v-if="docSelecionado" class="doc-info">
        <div class="doc-campo"><span class="doc-label">Aluno</span><span class="doc-valor">{{ docSelecionado.aluno_nome || '—' }}</span></div>
        <div class="doc-campo"><span class="doc-label">Tipo</span><span class="doc-valor">{{ tipoLabel(docSelecionado.tipo) }}</span></div>
        <div class="doc-campo"><span class="doc-label">Período</span><span class="doc-valor">{{ docSelecionado.periodo }}</span></div>
        <div class="doc-campo"><span class="doc-label">Gerado em</span><span class="doc-valor">{{ docSelecionado.finalizado_em ? new Date(docSelecionado.finalizado_em).toLocaleDateString('pt-BR') : '—' }}</span></div>
        <div class="doc-download">
          <p class="doc-download-label">Selecione o formato:</p>
          <BotaoExportar :rascunho-id="docSelecionado.rascunho_id" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import Dropdown from 'primevue/dropdown'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import BnccSelector from '@/components/BnccSelector.vue'
import DocumentoRevisor from '@/components/DocumentoRevisor.vue'
import BotaoExportar from '@/components/BotaoExportar.vue'
import AvatarInitials from '@/components/AvatarInitials.vue'
import { getAvatarSrc } from '@/composables/useAvatars'
import api from '@/services/api'
import { usePageLayout } from '@/composables/usePageLayout'
import { useIsMobile } from '@/composables/useIsMobile'

interface Aluno { id: string; nome: string; turma_id: string; turma_nome: string; avatar_id?: number | null }
interface Rascunho { id: string; status: string; conteudo_gerado: string; conteudo_editado?: string }
interface QuotaInfo { restante: number; total: number; percentual_restante: number; bloqueado: boolean; retorna_em?: string }
interface Turma { id: string; nome: string }
interface Documento {
  id: string
  rascunho_id: string
  tipo: string
  aluno_nome: string | null
  aluno_avatar_id: number | null
  turma_id: string | null
  turma_nome: string | null
  numero_versao: number
  periodo: string
  finalizado_em: string | null
  created_at: string
}

const confirm = useConfirm()
const toast = useToast()
const { isMobile } = useIsMobile()

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

const TIPO_LABELS: Record<string, string> = {
  relatorio_individual: 'Relatório Individual',
  portfolio_semanal: 'Portfólio Semanal',
  portfolio_mensal: 'Portfólio Mensal',
  atividade_adaptada: 'Atividade Adaptada',
  resumo_pedagogico: 'Resumo Pedagógico',
  plano_aula: 'Plano de Aula',
  ata_reuniao: 'Ata de Reunião',
}

function tipoLabel(tipo: string) {
  return TIPO_LABELS[tipo] ?? tipo
}

// ── Formulário ────────────────────────────────────────────────────────────────

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
const quota = ref<QuotaInfo | null>(null)
let quotaInterval: ReturnType<typeof setInterval> | null = null

// ── Histórico (task 8) ────────────────────────────────────────────────────────

const historicoVisible = ref(false)
const documentos = ref<Documento[]>([])
const histLoading = ref(false)
const histModo = ref<'todos' | 'turma'>('todos')
const histTurmaId = ref<string | null>(null)
const turmas = ref<Turma[]>([])
const downloadVisible = ref(false)
const docSelecionado = ref<Documento | null>(null)

const documentosFiltrados = computed(() => {
  if (histModo.value === 'todos' || !histTurmaId.value) return documentos.value
  return documentos.value.filter(d => d.turma_id === histTurmaId.value)
})

async function onHistoricoAberto() {
  if (documentos.value.length > 0) return
  histLoading.value = true
  try {
    const [docsRes, turmasRes] = await Promise.all([
      api.get<{ data: Documento[] }>('/api/documentos'),
      api.get<{ data: Turma[] }>('/api/turmas'),
    ])
    documentos.value = docsRes.data.data
    turmas.value = turmasRes.data.data
  } catch {
    /* handled by interceptor */
  } finally {
    histLoading.value = false
  }
}

function abrirHistorico() {
  historicoVisible.value = true
}

function abrirDownload(doc: Documento) {
  docSelecionado.value = doc
  downloadVisible.value = true
}

function abrirFormato(doc: Documento) {
  docSelecionado.value = doc
  downloadVisible.value = true
}

// ── Scroll arrow (task 7) ─────────────────────────────────────────────────────

const mostrarSeta = ref(false)
let lastScrollY = 0

function onScroll() {
  if (window.scrollY > lastScrollY) {
    mostrarSeta.value = false
  }
  lastScrollY = window.scrollY
}

function irParaFim() {
  window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
  mostrarSeta.value = false
}

// ── Quota ─────────────────────────────────────────────────────────────────────

const quotaClass = computed(() => {
  if (!quota.value) return ''
  if (quota.value.bloqueado) return 'quota-blocked'
  if (quota.value.percentual_restante < 20) return 'quota-critical'
  if (quota.value.percentual_restante < 50) return 'quota-warn'
  return 'quota-ok'
})

const quotaIcon = computed(() => {
  if (!quota.value) return ''
  if (quota.value.bloqueado) return 'pi pi-ban'
  if (quota.value.percentual_restante < 20) return 'pi pi-exclamation-triangle'
  return 'pi pi-check-circle'
})

const quotaLabel = computed(() => {
  if (!quota.value) return ''
  if (quota.value.bloqueado) {
    const hora = quota.value.retorna_em
      ? new Date(quota.value.retorna_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
      : 'meia-noite'
    return `Limite de IA atingido — retorna às ${hora} (Brasília)`
  }
  if (quota.value.percentual_restante < 20) return `IA com capacidade reduzida (${quota.value.percentual_restante}% disponível)`
  return 'IA disponível'
})

// ── Formulário helpers ────────────────────────────────────────────────────────

const precisaDeDatas = computed(() => form.value.tipo !== 'resumo_pedagogico' && form.value.tipo !== 'atividade_adaptada')

const tipoFixoPeriodo = computed(() =>
  form.value.tipo === 'portfolio_semanal' || form.value.tipo === 'portfolio_mensal'
)

const minInicio = computed(() => {
  if (form.value.tipo === 'relatorio_individual' && form.value.periodo_fim) {
    const d = new Date(form.value.periodo_fim)
    d.setFullYear(d.getFullYear() - 2)
    return d
  }
  return undefined
})

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
    const hoje2 = new Date()
    const inicio = new Date(hoje2.getFullYear(), hoje2.getMonth(), 1)
    const fim = new Date(hoje2.getFullYear(), hoje2.getMonth() + 1, 0)
    form.value.periodo_inicio = inicio
    form.value.periodo_fim = fim
  } else if (tipo === 'relatorio_individual') {
    // Usuário define manualmente
  } else {
    form.value.periodo_inicio = null
    form.value.periodo_fim = null
  }
}

function onInicioChange(val: Date | null) {
  if (!val) return
  if (form.value.tipo === 'portfolio_semanal') {
    const fim = new Date(val)
    fim.setDate(fim.getDate() + 6)
    form.value.periodo_fim = fim
  } else if (form.value.tipo === 'portfolio_mensal') {
    const fim = new Date(val)
    fim.setMonth(fim.getMonth() + 1)
    fim.setDate(fim.getDate() - 1)
    form.value.periodo_fim = fim
  } else {
    form.value.periodo_fim = new Date(val)
  }
}

watch(() => form.value.tipo, (novoTipo) => {
  rascunho.value = null
  erroGeracao.value = ''
  setDatasAutomaticas(novoTipo)
}, { immediate: true })

const formularioValido = computed(() => {
  if (!form.value.tipo || !form.value.aluno_id) return false
  if (precisaDeDatas.value && (!form.value.periodo_inicio || !form.value.periodo_fim)) return false
  if (form.value.tipo === 'atividade_adaptada' && form.value.bncc_refs.length === 0) return false
  return true
})

const podeFinalizar = computed(() => !!rascunho.value && rascunho.value.status !== 'finalizado')

async function fetchQuota() {
  try {
    const { data } = await api.get<QuotaInfo>('/api/documents/quota')
    quota.value = data
  } catch {
    /* non-critical */
  }
}

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
  fetchQuota()
  quotaInterval = setInterval(fetchQuota, 60_000)
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  if (quotaInterval) clearInterval(quotaInterval)
  window.removeEventListener('scroll', onScroll)
})

async function gerarDocumento() {
  estaGerando.value = true
  erroGeracao.value = ''
  mostrarSeta.value = false
  try {
    const payload: Record<string, unknown> = {
      tipo: form.value.tipo,
      aluno_id: form.value.aluno_id,
      periodo_inicio: form.value.periodo_inicio?.toISOString().slice(0, 10),
      periodo_fim: form.value.periodo_fim?.toISOString().slice(0, 10),
    }
    if (form.value.tipo === 'atividade_adaptada') {
      payload.bncc_refs = form.value.bncc_refs
    }
    const { data } = await api.post<{ rascunho: Rascunho }>('/api/documents/generate', payload)
    rascunho.value = data.rascunho
    // Invalida cache do histórico para forçar recarregamento na próxima abertura
    documentos.value = []
    fetchQuota()
    lastScrollY = window.scrollY
    await nextTick()
    setTimeout(() => {
      if (document.documentElement.scrollHeight > window.innerHeight + 50) {
        mostrarSeta.value = true
      }
    }, 300)
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
    documentos.value = [] // invalida cache do histórico
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
.page-container { padding: 0; }

/* ── Toolbar superior (task 8) ── */
.page-toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
}
:deep(.btn-historico-grad.p-button) {
  background: linear-gradient(135deg, #FFFFFF 0%, #EBEBEB 55%, #D8D8D8 100%) !important;
  border: 1.5px solid #B8B8B8 !important;
  color: var(--text-1) !important;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.14), inset 0 1px 0 rgba(255,255,255,0.8) !important;
  font-weight: 700 !important;
  letter-spacing: 0.02em !important;
}
:deep(.btn-historico-grad.p-button:hover) {
  background: linear-gradient(135deg, #F5F5F5 0%, #E0E0E0 55%, #CACACA 100%) !important;
  border-color: #A0A0A0 !important;
  box-shadow: 0 5px 16px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255,255,255,0.6) !important;
  transform: translateY(-1px) !important;
}
:deep(.btn-historico-grad.p-button:active) {
  transform: translateY(0) !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12) !important;
}

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
.periodo-fim-locked {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #F0F4F8;
  border: 1px solid var(--border-hover);
  border-radius: 10px;
  color: var(--text-3);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: not-allowed;
  user-select: none;
}
.periodo-fim-locked .pi-lock {
  font-size: 0.8rem;
  opacity: 0.6;
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

/* ── Rascunho header (task 7) ── */
.rascunho-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.rascunho-header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* ── Seta de scroll animada (task 7) ── */
.seta-scroll {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: var(--acae-blue);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  animation: bounce 1.4s ease-in-out infinite;
}
.seta-scroll:hover { background: #2d6bc4; }

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(7px); }
}

.seta-enter-active, .seta-leave-active { transition: opacity 0.3s ease; }
.seta-enter-from, .seta-leave-to { opacity: 0; }

/* ── Histórico modal (task 8) ── */
.hist-filtros {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.hist-modo-toggle {
  display: flex;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.hist-modo-btn {
  padding: 0.4rem 1.1rem;
  border: none;
  background: var(--bg-card);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-2);
  transition: background 0.15s, color 0.15s;
  font-family: 'Nunito', sans-serif;
  line-height: 1;
}
.hist-modo-btn.active {
  background: var(--acae-blue);
  color: #fff;
}
.hist-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: var(--text-3);
  text-align: center;
}
.hist-empty-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-2);
}
.hist-empty-sub {
  margin: 0;
  font-size: 0.85rem;
}
.hist-nome-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.hist-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--acae-primary);
  box-shadow: 0 2px 6px var(--acae-primary-dim);
  flex-shrink: 0;
  transition: transform 0.18s ease;
}
:deep(tr:hover .hist-avatar) { transform: scale(1.12); }
:deep(.cursor-pointer-rows .p-datatable-tbody > tr) { cursor: pointer; }

/* ── Download info ── */
.doc-info { display: flex; flex-direction: column; gap: 0.875rem; padding: 0.25rem 0; }
.doc-campo { display: flex; flex-direction: column; gap: 0.2rem; }
.doc-label { font-size: 0.75rem; font-weight: 600; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.05em; }
.doc-valor { font-size: 0.9375rem; color: var(--text-1); }
.doc-download { margin-top: 0.5rem; padding-top: 1rem; border-top: 1px solid var(--border); }
.doc-download-label { margin: 0 0 0.75rem; font-size: 0.875rem; font-weight: 500; color: var(--text-2); }

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
.empty-state-icon { font-size: 3.5rem; color: var(--text-3); opacity: 0.6; }
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

/* ── Quota indicator ── */
.quota-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
}
.quota-ok { background: #f0faf0; color: #2d7a2d; border: 1px solid #b6e6b6; }
.quota-warn { background: #fffbea; color: #7a5f00; border: 1px solid #ffe082; }
.quota-critical { background: #fff4e5; color: #a04000; border: 1px solid #ffb347; }
.quota-blocked { background: #ffeaea; color: #b00020; border: 1px solid #f5b8b8; }
.quota-icon { font-size: 0.85rem; }
</style>

<!-- Estilos globais: Dialog é teleportado para <body>, fora do DOM scoped -->
<style>
.hist-dialog {
  overflow: hidden;
}
.hist-dialog .p-dialog-content {
  padding-top: 1rem;
  overflow-x: hidden;
}
.hist-dialog .p-datatable-wrapper {
  overflow-x: hidden;
}
.hist-dialog .p-datatable table {
  table-layout: fixed;
  width: 100%;
}
.hist-dialog .p-datatable .p-datatable-thead > tr > th,
.hist-dialog .p-datatable .p-datatable-tbody > tr > td {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.hist-cell-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}
</style>
