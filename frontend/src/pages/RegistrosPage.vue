<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2>Registros Pedagógicos</h2>
        <p>Registre as atividades semanais dos alunos para gerar documentos e relatórios</p>
      </div>
      <Button
        label="Novo Registro"
        icon="pi pi-plus"
        :disabled="modoFiltro === 'todos' || !aluno_id"
        @click="abrirDialogNovo"
      />
    </div>

    <!-- Filtro: Todos / Por Turma -->
    <div class="filtro-bar">
      <div class="modo-toggle">
        <button
          :class="['toggle-btn', modoFiltro === 'todos' ? 'toggle-btn--active' : '']"
          @click="modoFiltro = 'todos'"
        >Todos</button>
        <button
          :class="['toggle-btn', modoFiltro === 'turma' ? 'toggle-btn--active' : '']"
          @click="modoFiltro = 'turma'"
        >Por Turma</button>
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
    >
      <Column v-if="modoFiltro === 'todos'" field="aluno_nome" header="Aluno" sortable style="min-width: 150px" />
      <Column v-if="modoFiltro === 'todos'" field="turma_nome" header="Turma" sortable style="min-width: 150px" />
      <Column field="periodo" header="Período" sortable style="width: 130px">
        <template #body="{ data }">
          {{ formatarPeriodo(data.periodo) }}
        </template>
      </Column>
      <Column header="Competências BNCC" style="width: 180px">
        <template #body="{ data }">
          <span class="bncc-count">{{ data.bncc_refs.length }} competência{{ data.bncc_refs.length !== 1 ? 's' : '' }}</span>
        </template>
      </Column>
      <Column field="created_at" header="Criado em" sortable style="width: 150px">
        <template #body="{ data }">
          {{ formatarData(data.created_at) }}
        </template>
      </Column>
      <Column header="Ações" style="width: 100px">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" text rounded @click="abrirDialogEditar(data.id)" />
          <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmarExcluir(data)" />
        </template>
      </Column>
    </DataTable>

    <!-- Dialog Novo / Editar -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="editandoId ? 'Editar Registro' : 'Novo Registro'"
      modal
      :style="{ width: '600px' }"
      :closable="!salvando"
    >
      <div class="dialog-form" v-if="!loadingForm">
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
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: #7c3aed" />
        <p>Carregando registro...</p>
      </div>

      <template #footer>
        <Button label="Cancelar" text :disabled="salvando" @click="dialogVisible = false" />
        <Button
          :label="editandoId ? 'Salvar Alterações' : 'Criar Registro'"
          icon="pi pi-check"
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

interface Turma { id: string; nome: string }
interface Aluno  { id: string; nome: string }
interface Registro {
  id: string
  periodo: string
  bncc_refs: string[]
  created_at: string
  updated_at: string
  aluno_nome?: string
  turma_nome?: string
}
interface RegistroFull extends Registro {
  objetivos: string
  atividades: string
  mediacoes: string | null
  ocorrencias: string | null
}

const toast   = useToast()
const confirm = useConfirm()

const modoFiltro    = ref<'todos' | 'turma'>('todos')
const turmas        = ref<Turma[]>([])
const alunos        = ref<Aluno[]>([])
const registros     = ref<Registro[]>([])
const turma_id      = ref<string | null>(null)
const aluno_id      = ref<string | null>(null)
const loading       = ref(false)
const loadingAlunos = ref(false)
const loadingForm   = ref(false)
const dialogVisible = ref(false)
const salvando      = ref(false)
const editandoId    = ref<string | null>(null)
const erroDialog    = ref('')

const form = ref({
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
  form.value.atividades.trim().length >= 10,
)

function resetForm() {
  form.value = { periodo: null, bncc_refs: [], objetivos: '', atividades: '', mediacoes: '', ocorrencias: '' }
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
  if (!editandoId.value && !aluno_id.value) return
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
      await api.post(`/api/alunos/${aluno_id.value}/registros`, payload)
      toast.add({ severity: 'success', summary: 'Registro criado', life: 3000 })
    }
    dialogVisible.value = false
    if (modoFiltro.value === 'todos') await carregarTodos()
    else if (aluno_id.value) await carregarRegistros(aluno_id.value)
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

onMounted(async () => {
  await carregarTurmas()
  await carregarTodos()
})
</script>

<style scoped>
.page-container { padding: 1rem; }
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}
.page-header h2 { margin: 0 0 0.25rem; font-size: 1.5rem; color: #7c3aed; }
.page-header p  { margin: 0; color: #6b7280; }

.filtro-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}
.modo-toggle {
  display: flex;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
}
.toggle-btn {
  padding: 0.375rem 0.875rem;
  font-size: 0.875rem;
  border: none;
  background: #fff;
  cursor: pointer;
  color: #374151;
  transition: background 0.15s, color 0.15s;
}
.toggle-btn:hover { background: #f3f4f6; }
.toggle-btn--active {
  background: #7c3aed;
  color: #fff;
  font-weight: 600;
}
.field-inline {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.field-inline label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #374151;
}

.dialog-form { display: flex; flex-direction: column; gap: 0.25rem; }
.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 0.875rem;
}
.field label { font-size: 0.875rem; font-weight: 500; color: #374151; }
.char-count  { font-size: 0.75rem; color: #9ca3af; align-self: flex-end; }
.bncc-count  { font-size: 0.8125rem; color: #6b7280; }

.loading-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem 0;
  color: #6b7280;
}

.mt-2 { margin-top: 0.5rem; }
</style>
