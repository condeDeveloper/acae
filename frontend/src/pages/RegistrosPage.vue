<template>
  <Teleport to="#page-action-portal" defer>
    <Button label="Novo Registro" icon="pi pi-plus" @click="abrirDialogNovo" />
  </Teleport>

  <div class="page-container">
    <!-- Filtro: Todos / Por Turma -->
    <div class="filtro-bar">
      <div class="modo-switch" @click="toggleModo">
        <span :class="['sw-opt', modoFiltro !== 'todos' ? 'sw-opt--dim' : '']">Todos</span>
        <div :class="['sw-track', modoFiltro === 'turma' ? 'sw-track--on' : '']">
          <div class="sw-knob"></div>
        </div>
        <span :class="['sw-opt', modoFiltro !== 'turma' ? 'sw-opt--dim' : '']">Por Turma</span>
      </div>

      <template v-if="modoFiltro === 'turma'">
        <div class="field-inline">
          <label>Turma</label>
          <Select
            v-model="turma_id"
            :options="turmas"
            optionLabel="nome"
            optionValue="id"
            placeholder="Selecione a turma"
            style="min-width: 240px"
          />
        </div>
        <div class="field-inline">
          <label>Aluno</label>
          <Select
            v-model="aluno_id"
            :options="alunos"
            optionLabel="nome"
            optionValue="id"
            placeholder="Selecione o aluno"
            :loading="loadingAlunos"
            :disabled="!turma_id"
            style="min-width: 240px"
          />
        </div>
      </template>
    </div>

    <!-- Tabela -->
    <DataTable
      :value="registros"
      :loading="loading"
      stripedRows
      responsiveLayout="scroll"
      sortField="periodo"
      :sortOrder="-1"
      emptyMessage="Nenhum registro encontrado."
      :paginator="registros.length > 10"
      :rows="10"
      :rowsPerPageOptions="[10, 25, 50]"
      class="cursor-pointer-rows"
      @row-click="abrirCard($event.data)"
    >
      <Column v-if="modoFiltro === 'todos'" field="aluno_nome" header="Aluno" sortable>
        <template #body="{ data }">
          <div class="reg-nome-cell">
            <img
              v-if="getAvatarSrc(data.aluno_avatar_id)"
              :src="getAvatarSrc(data.aluno_avatar_id)!"
              class="reg-avatar"
              alt="avatar"
            />
            <AvatarInitials v-else :nome="data.aluno_nome" :seed="data.aluno_id ?? data.aluno_nome" :size="36" />
            <span>{{ data.aluno_nome }}</span>
          </div>
        </template>
      </Column>
      <Column v-if="modoFiltro === 'todos'" field="turma_nome" header="Turma" sortable />
      <Column field="periodo" header="Período" sortable>
        <template #body="{ data }">
          {{ formatarPeriodo(data.periodo) }}
        </template>
      </Column>
      <Column header="Competências BNCC">
        <template #body="{ data }">
          <span class="bncc-count">{{ data.bncc_refs.length }} competência{{ data.bncc_refs.length !== 1 ? 's' : '' }}</span>
        </template>
      </Column>
      <Column field="created_at" header="Criado em" sortable>
        <template #body="{ data }">
          {{ formatarData(data.created_at) }}
        </template>
      </Column>
      <Column header="Ações" style="width:110px">
        <template #body="{ data }">
          <div class="acoes-cell">
            <Button icon="pi pi-pencil" v-tooltip.top="'Editar'" text rounded @click.stop="abrirDialogEditar(data.id)" />
            <Button icon="pi pi-trash" v-tooltip.top="'Excluir'" text rounded severity="danger" @click.stop="confirmarExcluir(data)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Card Registro -->
    <Dialog v-model:visible="cardVisible" header="Detalhes do Registro" modal :style="{ width: '520px' }">
      <div v-if="cardLoading" class="loading-form">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: var(--acae-primary)" />
      </div>
      <div v-else-if="cardRegistro" class="card-detalhe">
        <div class="card-section-aluno">
          <div class="card-nome">{{ cardRegistro.aluno_nome }}</div>
          <div class="card-nascimento" v-if="cardRegistro.aluno_data_nascimento">
            {{ formatarPeriodo(cardRegistro.aluno_data_nascimento) }} ({{ calcularIdade(cardRegistro.aluno_data_nascimento) }} anos)
          </div>
        </div>
        <div class="card-campo"><span class="card-label">Turma</span><span class="card-valor">{{ cardRegistro.turma_nome }}</span></div>
        <div class="card-campo"><span class="card-label">Período</span><span class="card-valor">{{ formatarPeriodo(cardRegistro.periodo) }}</span></div>
        <div class="card-campo">
          <span class="card-label">Competências BNCC</span>
          <span class="card-valor">{{ cardRegistro.bncc_refs.join(', ') || '—' }}</span>
        </div>
        <div class="card-campo" v-if="cardRegistro.objetivos"><span class="card-label">Objetivos</span><span class="card-valor">{{ cardRegistro.objetivos }}</span></div>
        <div class="card-campo" v-if="cardRegistro.atividades"><span class="card-label">Atividades</span><span class="card-valor">{{ cardRegistro.atividades }}</span></div>
        <div class="card-campo" v-if="cardRegistro.mediacoes"><span class="card-label">Mediações</span><span class="card-valor">{{ cardRegistro.mediacoes }}</span></div>
        <div class="card-campo" v-if="cardRegistro.ocorrencias"><span class="card-label">Ocorrências</span><span class="card-valor">{{ cardRegistro.ocorrencias }}</span></div>
      </div>
      <template #footer>
        <Button label="Fechar" text @click="cardVisible = false" />
        <Button label="Editar" icon="pi pi-pencil" @click="cardVisible = false; abrirDialogEditar(cardRegistro!.id)" />
      </template>
    </Dialog>

    <!-- Dialog Novo / Editar -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="editandoId ? 'Editar Registro' : 'Novo Registro'"
      modal
      :style="{ width: '600px' }"
      :closable="!salvando"
    >
      <div class="dialog-form" v-if="!loadingForm">
        <template v-if="!editandoId">
          <div class="field">
            <label>Turma *</label>
            <Select
              v-model="form.turma_id"
              :options="turmas"
              optionLabel="nome"
              optionValue="id"
              placeholder="Selecione a turma"
              fluid
            />
          </div>
          <div class="field">
            <label>Aluno *</label>
            <Select
              v-model="form.aluno_id"
              :options="alunosDialog"
              optionLabel="nome"
              optionValue="id"
              placeholder="Selecione o aluno"
              :loading="loadingAlunosDialog"
              :disabled="!form.turma_id"
              fluid
            />
          </div>
        </template>
        <div class="field">
          <label>Período (semana de referência) *</label>
          <DatePicker
            v-model="form.periodo"
            dateFormat="dd/mm/yy"
            placeholder="Selecione a data de referência"
            fluid
            showIcon
          />
        </div>

        <div class="field">
          <label>Competências BNCC *</label>
          <BnccSelector v-model="form.bncc_refs" />
        </div>

        <div class="field">
          <label>Objetivos *</label>
          <Textarea
            v-model="form.objetivos"
            rows="3"
            placeholder="Descreva os objetivos pedagógicos do período (mín. 10 caracteres)"
            fluid
          />
          <small class="char-count">{{ form.objetivos.length }}/5000</small>
        </div>

        <div class="field">
          <label>Atividades desenvolvidas *</label>
          <Textarea
            v-model="form.atividades"
            rows="3"
            placeholder="Descreva as atividades realizadas (mín. 10 caracteres)"
            fluid
          />
          <small class="char-count">{{ form.atividades.length }}/5000</small>
        </div>

        <div class="field">
          <label>Mediações realizadas</label>
          <Textarea
            v-model="form.mediacoes"
            rows="2"
            placeholder="Descreva as mediações (opcional)"
            fluid
          />
        </div>

        <div class="field">
          <label>Ocorrências relevantes</label>
          <Textarea
            v-model="form.ocorrencias"
            rows="2"
            placeholder="Registre ocorrências importantes (opcional)"
            fluid
          />
        </div>

        <Message v-if="erroDialog" severity="error" :closable="false" class="mt-2">
          {{ erroDialog }}
        </Message>
      </div>

      <div v-else class="loading-form">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: var(--acae-primary)" />
        <p>Carregando registro...</p>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="info" :disabled="salvando" @click="dialogVisible = false" />
        <Button
          :label="editandoId ? 'Salvar Alterações' : 'Criar Registro'"
          icon="pi pi-check"
          severity="success"
          :loading="salvando"
          :disabled="!formValido || loadingForm"
          @click="salvar"
        />
      </template>
    </Dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Textarea from 'primevue/textarea'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import BnccSelector from '@/components/BnccSelector.vue'
import api from '@/services/api'
import { usePageLayout } from '@/composables/usePageLayout'
import { usePageLoading } from '@/composables/usePageLoading'
import { getAvatarSrc } from '@/composables/useAvatars'
import AvatarInitials from '@/components/AvatarInitials.vue'

interface Turma { id: string; nome: string }
interface Aluno  { id: string; nome: string }
interface Registro {
  id: string
  periodo: string
  bncc_refs: string[]
  created_at: string
  updated_at: string
  aluno_id?: string
  aluno_nome?: string
  aluno_avatar_id?: number | null
  turma_nome?: string
}
interface RegistroFull extends Registro {
  objetivos: string
  atividades: string
  mediacoes: string | null
  ocorrencias: string | null
  aluno_nome?: string
  aluno_data_nascimento?: string | null
  turma_nome?: string
}

usePageLayout({ title: 'Registros Pedagógicos', subtitle: 'Registre as atividades semanais dos alunos' })
const { trackLoad } = usePageLoading()



const toast   = useToast()
const confirm = useConfirm()

const modoFiltro         = ref<'todos' | 'turma'>('todos')
const turmas             = ref<Turma[]>([])
const alunos             = ref<Aluno[]>([])
const alunosDialog       = ref<Aluno[]>([])
const registros          = ref<Registro[]>([])
const turma_id           = ref<string | null>(null)
const aluno_id           = ref<string | null>(null)
const loading            = ref(false)
const loadingAlunos      = ref(false)
const loadingAlunosDialog = ref(false)
const loadingForm        = ref(false)
const dialogVisible      = ref(false)
const salvando           = ref(false)
const editandoId         = ref<string | null>(null)
const erroDialog         = ref('')
const cardVisible        = ref(false)
const cardLoading        = ref(false)
const cardRegistro       = ref<RegistroFull | null>(null)

async function abrirCard(registro: Registro) {
  cardRegistro.value = null
  cardVisible.value = true
  cardLoading.value = true
  try {
    const { data } = await api.get<RegistroFull>(`/api/registros/${registro.id}`)
    cardRegistro.value = data
  } catch {
    toast.add({ severity: 'error', summary: 'Erro ao carregar detalhes', life: 3000 })
    cardVisible.value = false
  } finally {
    cardLoading.value = false
  }
}

function calcularIdade(iso: string): number {
  const nasc = new Date(iso)
  const hoje = new Date()
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

const form = ref({
  turma_id:   '',
  aluno_id:   '',
  periodo:    null as Date | null,
  bncc_refs:  [] as string[],
  objetivos:  '',
  atividades: '',
  mediacoes:  '',
  ocorrencias:'',
})

const formValido = computed(() =>
  !!form.value.periodo &&
  form.value.bncc_refs.length > 0 &&
  form.value.objetivos.trim().length >= 10 &&
  form.value.atividades.trim().length >= 10 &&
  (!editandoId.value ? !!(form.value.aluno_id || aluno_id.value) : true),
)

function resetForm() {
  form.value = { turma_id: '', aluno_id: '', periodo: null, bncc_refs: [], objetivos: '', atividades: '', mediacoes: '', ocorrencias: '' }
  alunosDialog.value = []
  erroDialog.value = ''
}

function formatarPeriodo(iso: string) {
  const [y, m, d] = iso.split('T')[0].split('-')
  return `${d}/${m}/${y}`
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

async function carregarTurmas() {
  try {
    const { data } = await api.get<{ data: Turma[] }>('/api/turmas')
    turmas.value = data.data
  } catch {
    toast.add({ severity: 'error', summary: 'Erro ao carregar turmas', life: 3000 })
  }
}

async function carregarTodos() {
  loading.value = true
  try {
    const { data } = await api.get<{ data: Registro[] }>('/api/registros?limit=200')
    registros.value = data.data
  } catch {
    toast.add({ severity: 'error', summary: 'Erro ao carregar registros', life: 3000 })
  } finally {
    loading.value = false
  }
}

async function carregarAlunos(tid: string) {
  loadingAlunos.value = true
  try {
    const { data } = await api.get<{ data: Aluno[] }>(`/api/turmas/${tid}/alunos`)
    alunos.value = data.data
  } catch {
    toast.add({ severity: 'error', summary: 'Erro ao carregar alunos', life: 3000 })
  } finally {
    loadingAlunos.value = false
  }
}

async function carregarRegistros(aid: string) {
  loading.value = true
  try {
    const { data } = await api.get<{ data: Registro[]; total: number }>(
      `/api/alunos/${aid}/registros?limit=50`,
    )
    registros.value = data.data
  } catch {
    toast.add({ severity: 'error', summary: 'Erro ao carregar registros', life: 3000 })
  } finally {
    loading.value = false
  }
}

watch(modoFiltro, (novo) => {
  registros.value = []
  if (novo === 'todos') {
    turma_id.value = null
    aluno_id.value = null
    alunos.value = []
    carregarTodos()
  }
})

watch(() => form.value.turma_id, async (tid) => {
  form.value.aluno_id = ''
  alunosDialog.value = []
  if (!tid) return
  loadingAlunosDialog.value = true
  try {
    const { data } = await api.get<{ data: Aluno[] }>(`/api/turmas/${tid}/alunos`)
    alunosDialog.value = data.data
  } catch {
    /* silently fail */
  } finally {
    loadingAlunosDialog.value = false
  }
})

function toggleModo() {
  modoFiltro.value = modoFiltro.value === 'todos' ? 'turma' : 'todos'
}

watch(turma_id, (novoId) => {
  aluno_id.value = null
  alunos.value = []
  registros.value = []
  if (novoId) carregarAlunos(novoId)
})

watch(aluno_id, (novoId) => {
  registros.value = []
  if (novoId) carregarRegistros(novoId)
})

function abrirDialogNovo() {
  editandoId.value = null
  resetForm()
  // prefill turma/aluno if currently filtering by turma
  if (modoFiltro.value === 'turma' && turma_id.value) {
    form.value.turma_id = turma_id.value
    if (aluno_id.value) form.value.aluno_id = aluno_id.value
  }
  dialogVisible.value = true
}

async function abrirDialogEditar(id: string) {
  editandoId.value = id
  resetForm()
  dialogVisible.value = true
  loadingForm.value = true
  try {
    const { data } = await api.get<RegistroFull>(`/api/registros/${id}`)
    form.value.periodo     = new Date(data.periodo)
    form.value.bncc_refs   = data.bncc_refs
    form.value.objetivos   = data.objetivos
    form.value.atividades  = data.atividades
    form.value.mediacoes   = data.mediacoes ?? ''
    form.value.ocorrencias = data.ocorrencias ?? ''
  } catch {
    toast.add({ severity: 'error', summary: 'Erro ao carregar registro', life: 3000 })
    dialogVisible.value = false
  } finally {
    loadingForm.value = false
  }
}

async function salvar() {
  if (!formValido.value) return
  if (!editandoId.value && !form.value.aluno_id && !aluno_id.value) return
  salvando.value  = true
  erroDialog.value = ''

  const periodoStr = form.value.periodo!.toISOString().slice(0, 10)

  const payload = {
    periodo:     periodoStr,
    bncc_refs:   form.value.bncc_refs,
    objetivos:   form.value.objetivos.trim(),
    atividades:  form.value.atividades.trim(),
    mediacoes:   form.value.mediacoes.trim() || undefined,
    ocorrencias: form.value.ocorrencias.trim() || undefined,
  }

  try {
    if (editandoId.value) {
      await api.patch(`/api/registros/${editandoId.value}`, payload)
      toast.add({ severity: 'success', summary: 'Registro atualizado', life: 3000 })
    } else {
      const targetAlunoId = form.value.aluno_id || aluno_id.value
      await api.post(`/api/alunos/${targetAlunoId}/registros`, payload)
      toast.add({ severity: 'success', summary: 'Registro criado', life: 3000 })
    }
    dialogVisible.value = false
    if (modoFiltro.value === 'todos') await carregarTodos()
    else if (aluno_id.value) await carregarRegistros(aluno_id.value)
    else await carregarTodos()
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string; message?: string } } }
    const msg = e?.response?.data?.message ?? e?.response?.data?.error ?? 'Erro ao salvar registro.'
    erroDialog.value = msg
  } finally {
    salvando.value = false
  }
}

function confirmarExcluir(registro: Registro) {
  confirm.require({
    message: `Excluir o registro do período ${formatarPeriodo(registro.periodo)}?`,
    header: 'Confirmar Exclusão',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Excluir',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    rejectClass: 'p-button-info',
    accept: () => excluir(registro.id),
  })
}

async function excluir(id: string) {
  try {
    await api.delete(`/api/registros/${id}`)
    registros.value = registros.value.filter(r => r.id !== id)
    toast.add({ severity: 'success', summary: 'Registro excluído', life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Erro ao excluir registro', life: 3000 })
  }
}

onMounted(() => trackLoad((async () => {
  await carregarTurmas()
  await carregarTodos()
})()))
</script>

<style scoped>
.page-container { padding: 1rem; }
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}
.page-header h2 { margin: 0 0 0.25rem; font-size: 1.75rem; font-weight: 900; font-family: 'Nunito', sans-serif; color: var(--text-1); }
.page-header p  { margin: 0; color: var(--text-2); }

.filtro-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}
/* Switch roxo estilo iOS */
.modo-switch { display: flex; align-items: center; gap: 0.625rem; cursor: pointer; user-select: none; }
.sw-opt { font-size: 0.875rem; font-weight: 600; color: var(--text-2); transition: color 0.2s; }
.sw-opt--dim { color: var(--text-3); font-weight: 400; }
.sw-track {
  width: 44px; height: 24px; border-radius: 12px;
  background: var(--bg-overlay); border: 1px solid var(--border);
  position: relative; transition: background 0.28s, border-color 0.28s;
}
.sw-track--on { background: var(--acae-primary); border-color: var(--acae-primary); box-shadow: 0 0 10px var(--acae-primary-glow); }
.sw-knob {
  position: absolute; top: 3px; left: 3px;
  width: 16px; height: 16px; border-radius: 50%;
  background: #fff; transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
}
.sw-track--on .sw-knob { transform: translateX(20px); }
.field-inline {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.field-inline label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-2);
}

.dialog-form { display: flex; flex-direction: column; gap: 0.25rem; }
.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 0.875rem;
}
.field label { font-size: 0.875rem; font-weight: 500; color: var(--text-2); }
.char-count  { font-size: 0.75rem; color: var(--text-3); align-self: flex-end; }
.bncc-count  { font-size: 0.8125rem; color: var(--text-2); }
.reg-avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--acae-primary);
  box-shadow: 0 2px 8px var(--acae-primary-dim);
  display: block;
  flex-shrink: 0;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
:deep(tr:hover .reg-avatar) {
  transform: scale(1.13);
  box-shadow: 0 4px 14px var(--acae-primary-dim);
}
:deep(tr:hover .avatar-initials-circle) {
  transform: scale(1.13);
  box-shadow: 0 3px 10px rgba(0,0,0,0.18);
}
.reg-avatar-anon {
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: var(--surface-100, #f3f4f6);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--text-3);
  font-size: 1rem;
}
.reg-nome-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.acoes-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.loading-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem 0;
  color: var(--text-2);
}

.mt-2 { margin-top: 0.5rem; }

.card-detalhe { display: flex; flex-direction: column; gap: 0.875rem; padding: 0.25rem 0; }
.card-section-aluno { padding-bottom: 0.5rem; border-bottom: 1px solid var(--border); margin-bottom: 0.25rem; }
.card-nome { font-size: 1.25rem; font-weight: 700; color: var(--text-1); }
.card-nascimento { font-size: 0.9rem; color: var(--text-2); margin-top: 0.15rem; }
.card-campo { display: flex; flex-direction: column; gap: 0.2rem; }
.card-label { font-size: 0.75rem; font-weight: 600; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.05em; }
.card-valor { font-size: 0.9375rem; color: var(--text-1); white-space: pre-wrap; }
:deep(.cursor-pointer-rows .p-datatable-tbody > tr) { cursor: pointer; }
</style>
