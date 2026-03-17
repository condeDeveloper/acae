<template>
  <div class="page-container">
    <!-- Teleport action buttons to header portal -->
    <Teleport to="#page-action-portal" defer>
      <div class="header-actions">
        <Button
          v-if="chamada && (modoEdicao || !chamada.bloqueada)"
          label="Salvar Chamada"
          icon="pi pi-save"
          severity="success"
          :loading="salvando"
          @click="salvarChamada"
        />
        <Button
          v-if="chamada && chamada.bloqueada && !modoEdicao"
          label="Editar"
          icon="pi pi-pencil"
          severity="secondary"
          @click="modoEdicao = true"
        />
        <Button
          label="Histórico"
          icon="pi pi-history"
          severity="secondary"
          outlined
          @click="abrirHistorico"
        />
      </div>
    </Teleport>

    <!-- Controls bar -->
    <div class="controls-bar">
      <div class="control-field">
        <label>Turma</label>
        <Dropdown
          v-model="turmaSelecionada"
          :options="turmas"
          optionLabel="nome"
          optionValue="id"
          placeholder="Selecione a turma"
          :loading="loadingTurmas"
          style="min-width: 220px"
          @change="onTurmaChange"
        />
      </div>

      <div class="control-field">
        <label>Data da Chamada</label>
        <DatePicker
          v-model="dataSelecionada"
          dateFormat="dd/mm/yy"
          :maxDate="hoje"
          showIcon
          style="min-width: 175px"
          @update:modelValue="onDataChange"
        />
      </div>

      <Tag v-if="chamada?.bloqueada && !modoEdicao" value="Registro passado — somente leitura" severity="warn" />
      <Tag v-if="chamada && !chamada.bloqueada" value="Hoje" severity="success" />
    </div>

    <!-- Loading state -->
    <div v-if="loadingChamada" class="loading-card">
      <i class="pi pi-spin pi-spinner" />
      <span>Carregando chamada...</span>
    </div>

    <!-- No turma selected -->
    <div v-else-if="!turmaSelecionada" class="empty-card">
      <i class="pi pi-users" />
      <p>Selecione uma turma para iniciar a chamada</p>
    </div>

    <!-- Turma sem alunos -->
    <div v-else-if="chamada && chamada.presencas.length === 0" class="empty-card">
      <i class="pi pi-user-plus" />
      <p>Esta turma não tem alunos cadastrados</p>
      <p class="empty-hint">Adicione alunos na aba <strong>Alunos</strong> para registrar chamadas</p>
    </div>

    <!-- Data sem chamada -->
    <div v-else-if="!chamada" class="empty-card">
      <i class="pi pi-calendar-times" />
      <p>Nenhuma chamada registrada para esta data</p>
    </div>

    <!-- Attendance table -->
    <div v-else-if="chamada" class="chamada-card">
      <div class="chamada-header">
        <h3>
          <i class="pi pi-calendar-clock" />
          Chamada — {{ chamada.turma_nome }} — {{ dataFormatada }}
        </h3>
        <div class="chamada-stats">
          <span class="stat-pill presente">
            <i class="pi pi-check-circle" />
            {{ countPresentes }} presentes
          </span>
          <span class="stat-pill ausente">
            <i class="pi pi-times-circle" />
            {{ countAusentes }} ausentes
          </span>
          <span class="stat-pill total">
            {{ chamada.presencas.length }} alunos
          </span>
        </div>
      </div>

      <div class="alunos-grid">
        <div
          v-for="p in chamada.presencas"
          :key="p.aluno_id"
          class="aluno-card"
          :class="{
            'is-presente': p.presente && esTocado(p.aluno_id),
            'is-ausente': !p.presente && esTocado(p.aluno_id),
            'is-neutro': !esTocado(p.aluno_id),
            'is-bloqueado': chamada.bloqueada && !modoEdicao
          }"
        >
          <div class="aluno-avatar">
            <img
              v-if="getAvatarSrc(p.avatar_id)"
              :src="getAvatarSrc(p.avatar_id)!"
              :alt="p.aluno_nome"
              class="avatar-img"
            />
            <AvatarInitials v-else :nome="p.aluno_nome" :seed="p.aluno_id" :size="64" />
            <div class="status-badge" :class="{
              'badge-presente': p.presente && esTocado(p.aluno_id),
              'badge-ausente': !p.presente && esTocado(p.aluno_id),
              'badge-neutro': !esTocado(p.aluno_id)
            }">
              <i :class="{
                'pi pi-check': p.presente && esTocado(p.aluno_id),
                'pi pi-times': !p.presente && esTocado(p.aluno_id),
                'pi pi-minus': !esTocado(p.aluno_id)
              }" />
            </div>
          </div>

          <div class="aluno-nome">{{ p.aluno_nome }}</div>

          <div class="aluno-actions">
            <button
              class="check-btn presente-btn"
              :class="{ active: p.presente && esTocado(p.aluno_id) }"
              :disabled="chamada.bloqueada && !modoEdicao"
              @click="marcar(p.aluno_id, true)"
              title="Marcar como presente"
            >
              <i class="pi pi-check" />
            </button>
            <button
              class="check-btn ausente-btn"
              :class="{ active: !p.presente && esTocado(p.aluno_id) }"
              :disabled="chamada.bloqueada && !modoEdicao"
              @click="marcar(p.aluno_id, false)"
              title="Marcar como ausente"
            >
              <i class="pi pi-times" />
            </button>
          </div>
        </div>
      </div>

      <!-- Quick actions -->
      <div v-if="!chamada.bloqueada || modoEdicao" class="quick-actions">
        <Button label="Marcar todos presentes" icon="pi pi-check-square" severity="success" outlined size="small" @click="marcarTodos(true)" />
        <Button label="Marcar todos ausentes" icon="pi pi-times-circle" severity="danger" outlined size="small" @click="marcarTodos(false)" />
      </div>
    </div>

    <!-- Histórico Dialog -->
    <Dialog
      v-model:visible="historicoVisivel"
      header="Histórico de Chamadas"
      :modal="true"
      :style="{ width: '800px', maxWidth: '95vw' }"
      :closable="true"
    >
      <div class="historico-controls">
        <div class="control-field">
          <label>Turma</label>
          <Dropdown
            v-model="historicoTurmaId"
            :options="turmas"
            optionLabel="nome"
            optionValue="id"
            placeholder="Selecione a turma"
            style="min-width: 220px"
            @change="carregarHistorico"
          />
        </div>
      </div>

      <div v-if="loadingHistorico" class="loading-card">
        <i class="pi pi-spin pi-spinner" />
        <span>Carregando histórico...</span>
      </div>

      <DataTable
        v-else-if="historico.length > 0"
        :value="historico"
        class="historico-table"
        stripedRows
        :rows="20"
        paginator
      >
        <Column field="data" header="Data" sortable>
          <template #body="{ data }">
            {{ formatarData(data.data) }}
          </template>
        </Column>
        <Column header="Presentes" sortable field="presentes">
          <template #body="{ data }">
            <span class="stat-pill presente small">
              <i class="pi pi-check-circle" /> {{ data.presentes }}
            </span>
          </template>
        </Column>
        <Column header="Ausentes" sortable field="ausentes">
          <template #body="{ data }">
            <span class="stat-pill ausente small">
              <i class="pi pi-times-circle" /> {{ data.ausentes }}
            </span>
          </template>
        </Column>
        <Column header="Total" field="total_alunos">
          <template #body="{ data }">
            {{ data.total_alunos }} alunos
          </template>
        </Column>
        <Column header="PDF">
          <template #body="{ data }">
            <Button
              icon="pi pi-file-pdf"
              severity="danger"
              text
              rounded
              v-tooltip.top="'Baixar PDF'"
              :loading="downloadingId === data.id"
              @click="baixarPdf(data.id)"
            />
          </template>
        </Column>
      </DataTable>

      <div v-else-if="historicoTurmaId && !loadingHistorico" class="empty-card small">
        <i class="pi pi-inbox" />
        <p>Nenhuma chamada registrada para esta turma</p>
      </div>
      <div v-else-if="!historicoTurmaId" class="empty-card small">
        <i class="pi pi-arrow-up" />
        <p>Selecione uma turma para ver o histórico</p>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import Dropdown from 'primevue/dropdown'
import DatePicker from 'primevue/datepicker'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import { getAvatarSrc } from '@/composables/useAvatars'
import AvatarInitials from '@/components/AvatarInitials.vue'
import api from '@/services/api'
import { usePageLayout } from '@/composables/usePageLayout'

interface Turma { id: string; nome: string }
interface PresencaRow {
  id: string | null
  aluno_id: string
  aluno_nome: string
  avatar_id: number | null
  presente: boolean
}
interface ChamadaData {
  id: string | null
  data: string
  turma_id: string
  turma_nome: string
  bloqueada: boolean
  novo: boolean
  presencas: PresencaRow[]
}
interface HistoricoItem {
  id: string
  data: string
  turma_id: string
  total_alunos: number
  presentes: number
  ausentes: number
}

const toast = useToast()
usePageLayout({ title: 'Chamada', subtitle: 'Frequência diária dos alunos' })

const hoje = new Date()
hoje.setHours(23, 59, 59, 999)

const turmas = ref<Turma[]>([])
const loadingTurmas = ref(false)
const turmaSelecionada = ref<string>('')
const dataSelecionada = ref<Date>(new Date())
const chamada = ref<ChamadaData | null>(null)
const loadingChamada = ref(false)
const salvando = ref(false)
const modoEdicao = ref(false)
// Alunos que o professor já tocou explicitamente (clicou em presente/ausente)
// Se a chamada for nova, começa vazio → cards ficam neutros (azul)
// Se a chamada já existia, todos entram como tocados → mostram estado salvo
const tocados = ref<Set<string>>(new Set())

// Histórico
const historicoVisivel = ref(false)
const historicoTurmaId = ref<string>('')
const historico = ref<HistoricoItem[]>([])
const loadingHistorico = ref(false)
const downloadingId = ref<string | null>(null)

const dataFormatada = computed(() => {
  if (!dataSelecionada.value) return ''
  return dataSelecionada.value.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
})

const countPresentes = computed(() => chamada.value?.presencas.filter((p) => p.presente).length ?? 0)
const countAusentes = computed(() => chamada.value?.presencas.filter((p) => !p.presente).length ?? 0)

function iniciais(nome: string): string {
  return nome.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join('')
}

function formatarData(dataStr: string): string {
  return new Date(dataStr + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
}

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function carregarTurmas() {
  loadingTurmas.value = true
  try {
    const { data } = await api.get<{ data: Turma[] }>('/api/turmas')
    turmas.value = data.data
    // Auto-seleciona se só tem uma turma
    if (turmas.value.length === 1 && !turmaSelecionada.value) {
      turmaSelecionada.value = turmas.value[0].id
      await carregarChamada()
    }
  } catch (err) {
    console.error('Erro ao carregar turmas:', err)
    toast.add({ severity: 'error', summary: 'Erro ao carregar turmas', detail: 'Verifique sua conexão e tente recarregar a página.', life: 5000 })
  } finally {
    loadingTurmas.value = false
  }
}

async function carregarChamada() {
  if (!turmaSelecionada.value || !dataSelecionada.value) return
  loadingChamada.value = true
  modoEdicao.value = false
  tocados.value = new Set()
  try {
    const dataStr = toDateStr(dataSelecionada.value)
    const { data } = await api.get<{ chamada: ChamadaData }>('/api/chamadas', {
      params: { turma_id: turmaSelecionada.value, data: dataStr },
    })
    chamada.value = data.chamada
    // Chamada já existia: marca todos como tocados para mostrar o estado salvo
    if (!data.chamada.novo) {
      tocados.value = new Set(data.chamada.presencas.map(p => p.aluno_id))
    }
  } catch {
    chamada.value = null
  } finally {
    loadingChamada.value = false
  }
}

async function salvarChamada() {
  if (!chamada.value) return
  salvando.value = true
  try {
    const dataStr = toDateStr(dataSelecionada.value)
    const { data } = await api.put<{ ok: boolean; id: string }>('/api/chamadas/salvar', {
      turma_id: chamada.value.turma_id,
      data: dataStr,
      presencas: chamada.value.presencas.map((p) => ({
        aluno_id: p.aluno_id,
        presente: p.presente,
      })),
    })
    // Atualiza o ID localmente (primeira vez que salva)
    chamada.value.id = data.id
    // Após salvar, todos viram tocados para manter as cores
    tocados.value = new Set(chamada.value.presencas.map((p) => p.aluno_id))
    modoEdicao.value = false
    toast.add({ severity: 'success', summary: 'Chamada salva com sucesso!', life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Erro ao salvar chamada', life: 3000 })
  } finally {
    salvando.value = false
  }
}

function esTocado(alunoId: string) {
  return tocados.value.has(alunoId)
}

function marcar(alunoId: string, presente: boolean) {
  if (!chamada.value) return
  const p = chamada.value.presencas.find((p) => p.aluno_id === alunoId)
  if (p) {
    p.presente = presente
    tocados.value = new Set([...tocados.value, alunoId])
  }
}

function marcarTodos(presente: boolean) {
  if (!chamada.value) return
  chamada.value.presencas.forEach((p) => (p.presente = presente))
  tocados.value = new Set(chamada.value.presencas.map(p => p.aluno_id))
}

function onTurmaChange() {
  chamada.value = null
  carregarChamada()
}

function onDataChange() {
  chamada.value = null
  if (turmaSelecionada.value) carregarChamada()
}

async function abrirHistorico() {
  historicoVisivel.value = true
  historicoTurmaId.value = turmaSelecionada.value
  if (historicoTurmaId.value) await carregarHistorico()
}

async function carregarHistorico() {
  if (!historicoTurmaId.value) return
  loadingHistorico.value = true
  try {
    const { data } = await api.get<{ historico: HistoricoItem[] }>('/api/chamadas/historico', {
      params: { turma_id: historicoTurmaId.value },
    })
    historico.value = data.historico
  } catch {
    historico.value = []
  } finally {
    loadingHistorico.value = false
  }
}

async function baixarPdf(chamadaId: string) {
  downloadingId.value = chamadaId
  try {
    const response = await api.get(`/api/chamadas/${chamadaId}/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    const cd = response.headers['content-disposition'] ?? ''
    const match = cd.match(/filename="([^"]+)"/)
    a.download = match ? match[1] : `chamada_${chamadaId}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    toast.add({ severity: 'error', summary: 'Erro ao baixar PDF', life: 3000 })
  } finally {
    downloadingId.value = null
  }
}

onMounted(carregarTurmas)

watch(turmaSelecionada, () => {
  chamada.value = null
  tocados.value = new Set()
})
</script>

<style scoped>
.page-container { padding: 1rem; display: flex; flex-direction: column; gap: 1.25rem; }

/* ── Controls bar ── */
.controls-bar {
  display: flex;
  align-items: flex-end;
  gap: 1.25rem;
  flex-wrap: wrap;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 1rem 1.25rem;
}
.control-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.control-field label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-2);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

/* ── Loading / empty ── */
.loading-card, .empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: var(--bg-card);
  border: 2px dashed var(--border);
  border-radius: 10px;
  padding: 3rem 2rem;
  color: var(--text-3);
  font-size: 0.95rem;
  min-height: 200px;
}
.loading-card i, .empty-card i { font-size: 2rem; opacity: 0.5; }
.empty-card.small { min-height: 120px; padding: 1.5rem; }
.empty-hint { font-size: 0.85rem; color: var(--text-3); margin: 0; }

/* ── Chamada card ── */
.chamada-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.chamada-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.chamada-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Nunito', sans-serif;
  text-transform: capitalize;
}
.chamada-stats { display: flex; gap: 0.5rem; flex-wrap: wrap; }

/* ── Stat pills ── */
.stat-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.85rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
}
.stat-pill.presente { background: #e6f9ee; color: #1d7d45; }
.stat-pill.ausente  { background: #fff0f0; color: #c0392b; }
.stat-pill.total    { background: var(--bg-base); color: var(--text-2); border: 1px solid var(--border); }
.stat-pill.small { font-size: 0.75rem; padding: 0.2rem 0.6rem; }

/* ── Alunos grid (cards) ── */
.alunos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
}

.aluno-card {
  background: var(--bg-surface);
  border: 2px solid var(--border);
  border-radius: 12px;
  padding: 1rem 0.75rem 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
  cursor: default;
}
.aluno-card.is-neutro {
  border-color: var(--acae-blue);
  border-style: dashed;
  background: var(--bg-surface);
  opacity: 0.85;
}
.aluno-card.is-presente {
  border-color: #4ade8088;
  background: #f0fdf4;
  box-shadow: 0 0 0 1px #4ade8044;
  opacity: 1;
}
.aluno-card.is-ausente {
  border-color: #f87171aa;
  background: #fff5f5;
  box-shadow: 0 0 0 1px #f8717144;
  opacity: 1;
}
.aluno-card.is-bloqueado { opacity: 0.82; }

/* Avatar */
.aluno-avatar { position: relative; }
.avatar-img {
  width: 64px;
  height: 64px;
  object-fit: contain;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: var(--bg-card);
}
/* avatar-initials now handled by AvatarInitials.vue component */
.status-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 800;
  border: 2px solid #fff;
}
.badge-presente { background: #22c55e; color: #fff; }
.badge-ausente  { background: #ef4444; color: #fff; }
.badge-neutro   { background: var(--acae-blue); color: #fff; opacity: 0.7; }

.aluno-nome {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-1);
  text-align: center;
  line-height: 1.3;
  word-break: break-word;
}

/* Check buttons */
.aluno-actions {
  display: flex;
  gap: 0.4rem;
}
.check-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, border-color 0.15s, transform 0.1s;
  background: var(--bg-card);
  color: var(--text-3);
}
.check-btn:hover:not(:disabled) { transform: scale(1.1); }
.check-btn:disabled { cursor: not-allowed; opacity: 0.5; }

.presente-btn {
  background: var(--bg-card);
  border-color: #4ade80;
  color: #16a34a;
}
.presente-btn.active {
  background: #22c55e;
  border-color: #16a34a;
  color: #fff;
  box-shadow: 0 2px 8px #22c55e66;
}
.presente-btn:not(.active):hover:not(:disabled) {
  background: #dcfce7;
  border-color: #4ade80;
  color: #16a34a;
}

.ausente-btn {
  background: var(--bg-card);
  border-color: #f87171;
  color: #dc2626;
}
.ausente-btn.active {
  background: #ef4444;
  border-color: #dc2626;
  color: #fff;
  box-shadow: 0 2px 8px #ef444466;
}
.ausente-btn:not(.active):hover:not(:disabled) {
  background: #fee2e2;
  border-color: #f87171;
  color: #dc2626;
}

/* Quick actions */
.quick-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  border-top: 1px solid var(--border);
  padding-top: 1rem;
}

/* ── Histórico dialog ── */
.historico-controls {
  margin-bottom: 1.25rem;
}
.historico-table { margin-top: 0; }
</style>
