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
      emptyMessage="Nenhuma turma cadastrada. Clique em 'Nova Turma' para começar."
    >
      <Column field="nome" header="Nome da Turma" />
      <Column field="ano_letivo" header="Ano Letivo" style="width:110px" />
      <Column field="turno" header="Turno" style="width:100px">
        <template #body="{ data }">
          <Tag :value="turnoLabel(data.turno)" :severity="turnoSeverity(data.turno)" />
        </template>
      </Column>
      <Column field="escola" header="Escola" />
      <Column field="total_alunos" header="Alunos" style="width:80px;text-align:center" />
      <Column header="Ações" style="width:80px">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" text rounded @click="abrirDialogEditar(data)" />
        </template>
      </Column>
    </DataTable>

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
.page-header h2 { margin: 0 0 0.25rem; font-size: 1.5rem; color: #7c3aed; }
.page-header p { margin: 0; color: #6b7280; font-size: 0.875rem; }
.dialog-form { display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 0; }
.field { display: flex; flex-direction: column; gap: 0.375rem; }
.field label { font-size: 0.875rem; font-weight: 500; color: #374151; }
</style>

