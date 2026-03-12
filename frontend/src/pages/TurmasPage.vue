<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2>Turmas</h2>
        <p>Gerencie suas turmas do ano letivo</p>
      </div>
      <Button label="Nova Turma" icon="pi pi-plus" @click="abrirDialogNova" />
    </div>

    <DataTable
      :value="turmas"
      :loading="loading"
      stripedRows
      responsiveLayout="scroll"
      sortField="nome"
      :sortOrder="1"
      :paginator="turmas.length > 10"
      :rows="10"
      :rowsPerPageOptions="[10, 25, 50]"
      emptyMessage="Nenhuma turma cadastrada. Clique em 'Nova Turma' para começar."
      class="cursor-pointer-rows"
      @row-click="abrirCard($event.data)"
    >
      <Column field="nome" header="Nome da Turma" sortable />
      <Column field="ano_letivo" header="Ano Letivo" sortable style="width:110px" />
      <Column field="turno" header="Turno" sortable style="width:100px">
        <template #body="{ data }">
          <Tag :value="turnoLabel(data.turno)" :severity="turnoSeverity(data.turno)" />
        </template>
      </Column>
      <Column field="escola" header="Escola" sortable />
      <Column field="total_alunos" header="Alunos" sortable style="width:80px;text-align:center" />
      <Column header="Ações" style="width:80px">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" text rounded @click.stop="abrirDialogEditar(data)" />
        </template>
      </Column>
    </DataTable>

    <!-- Card Turma -->
    <Dialog v-model:visible="cardVisible" header="Detalhes da Turma" modal :style="{ width: '400px' }">
      <div v-if="cardTurma" class="card-detalhe">
        <div class="card-campo"><span class="card-label">Nome</span><span class="card-valor">{{ cardTurma.nome }}</span></div>
        <div class="card-campo"><span class="card-label">Ano Letivo</span><span class="card-valor">{{ cardTurma.ano_letivo }}</span></div>
        <div class="card-campo"><span class="card-label">Turno</span><span class="card-valor"><Tag :value="turnoLabel(cardTurma.turno)" :severity="turnoSeverity(cardTurma.turno)" /></span></div>
        <div class="card-campo"><span class="card-label">Escola</span><span class="card-valor">{{ cardTurma.escola }}</span></div>
        <div class="card-campo"><span class="card-label">Total de Alunos</span><span class="card-valor">{{ cardTurma.total_alunos }}</span></div>
      </div>
      <template #footer>
        <Button label="Fechar" text @click="cardVisible = false" />
        <Button label="Editar" icon="pi pi-pencil" @click="cardVisible = false; abrirDialogEditar(cardTurma!)" />
      </template>
    </Dialog>

    <!-- Dialog Nova / Editar Turma -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="editando ? 'Editar Turma' : 'Nova Turma'"
      modal
      :style="{ width: '420px' }"
    >
      <div class="dialog-form">
        <div class="field">
          <label>Nome da Turma *</label>
          <InputText v-model="form.nome" placeholder="Ex: Turma A – Infantil 5" fluid />
        </div>
        <div class="field">
          <label>Ano Letivo *</label>
          <InputNumber v-model="form.ano_letivo" :min="2020" :max="2035" fluid />
        </div>
        <div class="field">
          <label>Turno *</label>
          <Select
            v-model="form.turno"
            :options="turnosOpcoes"
            optionLabel="label"
            optionValue="value"
            placeholder="Selecione o turno"
            fluid
          />
        </div>
        <div class="field">
          <label>Escola *</label>
          <InputText v-model="form.escola" placeholder="Nome da escola" fluid />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" text @click="dialogVisible = false" />
        <Button
          :label="editando ? 'Salvar' : 'Criar Turma'"
          icon="pi pi-check"
          :loading="salvando"
          :disabled="!formValido"
          @click="salvar"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

interface Turma {
  id: string
  nome: string
  ano_letivo: number
  turno: string
  escola: string
  status: string
  total_alunos: number
}

const toast = useToast()
const authStore = useAuthStore()

const turmas = ref<Turma[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const salvando = ref(false)
const editando = ref<Turma | null>(null)
const cardVisible = ref(false)
const cardTurma = ref<Turma | null>(null)

function abrirCard(turma: Turma) {
  cardTurma.value = turma
  cardVisible.value = true
}

const form = ref({ nome: '', ano_letivo: new Date().getFullYear(), turno: '', escola: '' })

const turnosOpcoes = [
  { label: 'Manhã', value: 'manha' },
  { label: 'Tarde', value: 'tarde' },
  { label: 'Integral', value: 'integral' },
]

const formValido = computed(() =>
  form.value.nome.trim().length > 0 &&
  form.value.turno !== '' &&
  form.value.escola.trim().length > 0
)

function turnoLabel(t: string) {
  return { manha: 'Manhã', tarde: 'Tarde', integral: 'Integral' }[t] ?? t
}

function turnoSeverity(t: string) {
  return { manha: 'info', tarde: 'warn', integral: 'success' }[t] ?? 'secondary'
}

async function carregar() {
  loading.value = true
  try {
    const { data } = await api.get<{ data: Turma[] }>('/api/turmas')
    turmas.value = data.data
  } finally {
    loading.value = false
  }
}

function abrirDialogNova() {
  editando.value = null
  form.value = {
    nome: '',
    ano_letivo: new Date().getFullYear(),
    turno: '',
    escola: authStore.professor?.escola ?? '',
  }
  dialogVisible.value = true
}

function abrirDialogEditar(turma: Turma) {
  editando.value = turma
  form.value = {
    nome: turma.nome,
    ano_letivo: turma.ano_letivo,
    turno: turma.turno,
    escola: turma.escola,
  }
  dialogVisible.value = true
}

async function salvar() {
  salvando.value = true
  try {
    if (editando.value) {
      await api.patch(`/api/turmas/${editando.value.id}`, {
        nome: form.value.nome,
        turno: form.value.turno,
        escola: form.value.escola,
      })
      toast.add({ severity: 'success', summary: 'Turma atualizada', life: 3000 })
    } else {
      await api.post('/api/turmas', form.value)
      toast.add({ severity: 'success', summary: 'Turma criada com sucesso', life: 3000 })
    }
    dialogVisible.value = false
    await carregar()
  } catch {
    toast.add({ severity: 'error', summary: 'Erro ao salvar turma', life: 3000 })
  } finally {
    salvando.value = false
  }
}

onMounted(carregar)
</script>

<style scoped>
.page-container { padding: 1rem; }
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}
.page-header h2 { margin: 0 0 0.25rem; font-size: 1.5rem; color: var(--acae-primary); }
.page-header p { margin: 0; color: var(--text-2); font-size: 0.875rem; }
.dialog-form { display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 0; }
.field { display: flex; flex-direction: column; gap: 0.375rem; }
.field label { font-size: 0.875rem; font-weight: 500; color: var(--text-2); }
.card-detalhe { display: flex; flex-direction: column; gap: 0.875rem; padding: 0.25rem 0; }
.card-campo { display: flex; flex-direction: column; gap: 0.2rem; }
.card-label { font-size: 0.75rem; font-weight: 600; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.05em; }
.card-valor { font-size: 0.9375rem; color: var(--text-1); }
:deep(.cursor-pointer-rows .p-datatable-tbody > tr) { cursor: pointer; }
</style>

