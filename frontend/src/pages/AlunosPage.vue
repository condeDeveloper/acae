<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2>Alunos</h2>
        <p>Gerencie os alunos das suas turmas</p>
      </div>
      <Button label="Novo Aluno" icon="pi pi-plus" @click="abrirDialogNovo" :disabled="!turmaSelecionada" />
    </div>

    <div class="filtro-turma">
      <label>Turma</label>
      <Select
        v-model="turmaSelecionada"
        :options="turmas"
        optionLabel="nome"
        optionValue="id"
        placeholder="Selecione uma turma"
        style="min-width: 280px"
      />
    </div>

    <DataTable
      :value="alunos"
      :loading="loading"
      stripedRows
      responsiveLayout="scroll"
      emptyMessage="Nenhum aluno encontrado nesta turma."
    >
      <Column field="nome" header="Nome" />
      <Column field="data_nascimento" header="Nascimento" style="width:130px">
        <template #body="{ data }">
          {{ data.data_nascimento ? formatarData(data.data_nascimento) : '—' }}
        </template>
      </Column>
      <Column field="necessidades_educacionais" header="Necessidades Especiais">
        <template #body="{ data }">
          {{ data.necessidades_educacionais || '—' }}
        </template>
      </Column>
      <Column header="Ações" style="width:100px">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" text rounded @click="abrirDialogEditar(data)" />
          <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmarExcluir(data)" />
        </template>
      </Column>
    </DataTable>

    <!-- Dialog Novo / Editar Aluno -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="editando ? 'Editar Aluno' : 'Novo Aluno'"
      modal
      :style="{ width: '440px' }"
    >
      <div class="dialog-form">
        <div class="field">
          <label>Nome Completo *</label>
          <InputText v-model="form.nome" placeholder="Nome do aluno" fluid />
        </div>
        <div class="field">
          <label>Turma *</label>
          <Select
            v-model="form.turma_id"
            :options="turmas"
            optionLabel="nome"
            optionValue="id"
            placeholder="Selecione a turma"
            fluid
            :disabled="!!editando"
          />
        </div>
        <div class="field">
          <label>Data de Nascimento</label>
          <DatePicker v-model="form.data_nascimento" dateFormat="dd/mm/yy" fluid showIcon />
        </div>
        <div class="field">
          <label>Necessidades Educacionais Especiais</label>
          <Textarea
            v-model="form.necessidades_educacionais"
            placeholder="Descreva as necessidades (opcional)"
            rows="3"
            fluid
          />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" text @click="dialogVisible = false" />
        <Button
          :label="editando ? 'Salvar' : 'Adicionar Aluno'"
          icon="pi pi-check"
          :loading="salvando"
          :disabled="!formValido"
          @click="salvar"
        />
      </template>
    </Dialog>

    <!-- Confirmação de exclusão -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Textarea from 'primevue/textarea'
import ConfirmDialog from 'primevue/confirmdialog'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import api from '@/services/api'

interface Turma { id: string; nome: string }
interface Aluno {
  id: string
  nome: string
  data_nascimento: string | null
  necessidades_educacionais: string | null
  turma_id: string
}

const toast = useToast()
const confirm = useConfirm()

const turmas = ref<Turma[]>([])
const alunos = ref<Aluno[]>([])
const loading = ref(false)
const turmaSelecionada = ref<string | null>(null)
const dialogVisible = ref(false)
const salvando = ref(false)
const editando = ref<Aluno | null>(null)

const form = ref<{
  nome: string
  turma_id: string
  data_nascimento: Date | null
  necessidades_educacionais: string
}>({ nome: '', turma_id: '', data_nascimento: null, necessidades_educacionais: '' })

const formValido = computed(() => form.value.nome.trim().length > 0 && form.value.turma_id !== '')

function formatarData(iso: string) {
  const [y, m, d] = iso.split('T')[0].split('-')
  return `${d}/${m}/${y}`
}

async function carregarTurmas() {
  const { data } = await api.get<{ data: Turma[] }>('/api/turmas')
  turmas.value = data.data
  if (turmas.value.length > 0 && !turmaSelecionada.value) {
    turmaSelecionada.value = turmas.value[0].id
  }
}

async function carregarAlunos() {
  if (!turmaSelecionada.value) return
  loading.value = true
  try {
    const { data } = await api.get<{ data: Aluno[] }>(`/api/turmas/${turmaSelecionada.value}/alunos`)
    alunos.value = data.data
  } finally {
    loading.value = false
  }
}

watch(turmaSelecionada, () => {
  carregarAlunos()
})

function abrirDialogNovo() {
  editando.value = null
  form.value = {
    nome: '',
    turma_id: turmaSelecionada.value ?? '',
    data_nascimento: null,
    necessidades_educacionais: '',
  }
  dialogVisible.value = true
}

function abrirDialogEditar(aluno: Aluno) {
  editando.value = aluno
  form.value = {
    nome: aluno.nome,
    turma_id: aluno.turma_id,
    data_nascimento: aluno.data_nascimento ? new Date(aluno.data_nascimento) : null,
    necessidades_educacionais: aluno.necessidades_educacionais ?? '',
  }
  dialogVisible.value = true
}

function confirmarExcluir(aluno: Aluno) {
  confirm.require({
    message: `Deseja excluir o aluno "${aluno.nome}"?`,
    header: 'Confirmar Exclusão',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Excluir',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: () => excluir(aluno.id),
  })
}

async function excluir(id: string) {
  try {
    await api.delete(`/api/alunos/${id}`)
    toast.add({ severity: 'success', summary: 'Aluno excluído', life: 3000 })
    await carregarAlunos()
  } catch {
    toast.add({ severity: 'error', summary: 'Erro ao excluir aluno', life: 3000 })
  }
}

async function salvar() {
  salvando.value = true
  try {
    if (editando.value) {
      const patch: Record<string, string> = { nome: form.value.nome }
      if (form.value.necessidades_educacionais.trim())
        patch.necessidades_educacionais = form.value.necessidades_educacionais.trim()
      await api.patch(`/api/alunos/${editando.value.id}`, patch)
      toast.add({ severity: 'success', summary: 'Aluno atualizado', life: 3000 })
    } else {
      const payload: Record<string, string> = { nome: form.value.nome.trim() }
      if (form.value.data_nascimento)
        payload.data_nascimento = form.value.data_nascimento.toISOString().split('T')[0]
      if (form.value.necessidades_educacionais.trim())
        payload.necessidades_educacionais = form.value.necessidades_educacionais.trim()
      await api.post(`/api/turmas/${form.value.turma_id}/alunos`, payload)
      toast.add({ severity: 'success', summary: 'Aluno adicionado', life: 3000 })
    }
    dialogVisible.value = false
    if (form.value.turma_id !== turmaSelecionada.value) {
      turmaSelecionada.value = form.value.turma_id
    }
    await carregarAlunos()
  } catch {
    toast.add({ severity: 'error', summary: 'Erro ao salvar aluno', life: 3000 })
  } finally {
    salvando.value = false
  }
}

onMounted(carregarTurmas)
</script>

<style scoped>
.page-container { padding: 1rem; }
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
}
.page-header h2 { margin: 0 0 0.25rem; font-size: 1.5rem; color: #7c3aed; }
.page-header p { margin: 0; color: #6b7280; font-size: 0.875rem; }
.filtro-turma {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}
.filtro-turma label { font-size: 0.875rem; font-weight: 500; color: #374151; }
.dialog-form { display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 0; }
.field { display: flex; flex-direction: column; gap: 0.375rem; }
.field label { font-size: 0.875rem; font-weight: 500; color: #374151; }
</style>

