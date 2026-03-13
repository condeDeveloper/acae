<template>
  <Teleport to="#page-action-portal" defer>
    <Button label="Novo Aluno" icon="pi pi-plus" @click="abrirDialogNovo" />
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

      <Select
        v-model="turmaSelecionada"
        :options="turmas"
        optionLabel="nome"
        optionValue="id"
        placeholder="Selecione uma turma"
        :style="{
          minWidth: '260px',
          opacity: modoFiltro === 'turma' ? 1 : 0,
          pointerEvents: modoFiltro === 'turma' ? 'auto' : 'none',
          transition: 'opacity 0.2s'
        }"
      />
    </div>

    <DataTable
      :value="alunosFiltrados"
      :loading="loading"
      stripedRows
      responsiveLayout="scroll"
      emptyMessage="Nenhum aluno encontrado."
      sortField="turma_nome"
      :sortOrder="1"
      :paginator="alunosFiltrados.length > 10"
      :rows="10"
      :rowsPerPageOptions="[10, 25, 50]"
      class="cursor-pointer-rows"
      @row-click="abrirCard($event.data)"
    >
      <Column header="" style="width:60px">
        <template #body="{ index }">
          <img :src="getKidImage(index)" class="aluno-avatar" alt="avatar" />
        </template>
      </Column>
      <Column field="nome" header="Nome" sortable />
      <Column field="turma_nome" header="Turma" sortable />
      <Column field="data_nascimento" header="Nascimento">
        <template #body="{ data }">
          {{ data.data_nascimento ? formatarData(data.data_nascimento) : '—' }}
        </template>
      </Column>
      <Column field="necessidades_educacionais" header="Necessidades Especiais">
        <template #body="{ data }">
          {{ data.necessidades_educacionais || '—' }}
        </template>
      </Column>
      <Column header="Ações" style="width:90px">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" text rounded @click.stop="abrirDialogEditar(data)" />
          <Button icon="pi pi-trash" text rounded severity="danger" @click.stop="confirmarExcluir(data)" />
        </template>
      </Column>
    </DataTable>

    <!-- Card Aluno -->
    <Dialog v-model:visible="cardVisible" header="Detalhes do Aluno" modal :style="{ width: '420px' }">
      <div v-if="cardAluno" class="card-detalhe">
        <div class="card-avatar-wrap">
          <img :src="getKidImage(alunos.findIndex(a => a.id === cardAluno!.id))" class="card-avatar-img" alt="avatar" />
        </div>
        <div class="card-nome">{{ cardAluno.nome }}</div>
        <div class="card-campo"><span class="card-label">Turma</span><span class="card-valor">{{ cardAluno.turma_nome }}</span></div>
        <div class="card-campo">
          <span class="card-label">Nascimento</span>
          <span class="card-valor">
            {{ cardAluno.data_nascimento ? formatarData(cardAluno.data_nascimento) + ' (' + calcularIdade(cardAluno.data_nascimento) + ' anos)' : '—' }}
          </span>
        </div>
        <div class="card-campo">
          <span class="card-label">Necessidades Educacionais Especiais</span>
          <span class="card-valor">{{ cardAluno.necessidades_educacionais || '—' }}</span>
        </div>
      </div>
      <template #footer>
        <Button label="Fechar" text @click="cardVisible = false" />
        <Button label="Editar" icon="pi pi-pencil" @click="cardVisible = false; abrirDialogEditar(cardAluno!)" />
      </template>
    </Dialog>

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
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import api from '@/services/api'
import { usePageLayout } from '@/composables/usePageLayout'

// ── Kid avatars (drawings) ──────────────────────────────────────────────────
usePageLayout({ title: 'Alunos', subtitle: 'Gerencie os alunos das suas turmas' })
const kidModules = import.meta.glob('@/assets/drawings/kid*.png', { eager: true })
const kidImages: string[] = Object.values(kidModules).map((m: any) => m.default)

function getKidImage(index: number): string {
  if (kidImages.length === 0) return ''
  return kidImages[Math.abs(index) % kidImages.length]
}
// ───────────────────────────────────────────────────────────────────────────

interface Turma { id: string; nome: string }
interface Aluno {
  id: string
  nome: string
  data_nascimento: string | null
  necessidades_educacionais: string | null
  turma_id: string
  turma_nome: string
}

const toast = useToast()
const confirm = useConfirm()

const turmas = ref<Turma[]>([])
const alunos = ref<Aluno[]>([])
const loading = ref(false)
const modoFiltro = ref<'todos' | 'turma'>('todos')
const turmaSelecionada = ref<string | null>(null)
const dialogVisible = ref(false)
const salvando = ref(false)
const editando = ref<Aluno | null>(null)
const cardVisible = ref(false)
const cardAluno = ref<Aluno | null>(null)

function abrirCard(aluno: Aluno) {
  cardAluno.value = aluno
  cardVisible.value = true
}

function calcularIdade(iso: string): number {
  const nasc = new Date(iso)
  const hoje = new Date()
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

const form = ref<{
  nome: string
  turma_id: string
  data_nascimento: Date | null
  necessidades_educacionais: string
}>({ nome: '', turma_id: '', data_nascimento: null, necessidades_educacionais: '' })

const formValido = computed(() => form.value.nome.trim().length > 0 && form.value.turma_id !== '')

const alunosFiltrados = computed(() => {
  if (modoFiltro.value === 'turma' && turmaSelecionada.value) {
    return alunos.value.filter(a => a.turma_id === turmaSelecionada.value)
  }
  return alunos.value
})

function formatarData(iso: string) {
  const [y, m, d] = iso.split('T')[0].split('-')
  return `${d}/${m}/${y}`
}

async function carregarTurmas() {
  const { data } = await api.get<{ data: Turma[] }>('/api/turmas')
  turmas.value = data.data
}

async function carregarAlunos() {
  loading.value = true
  try {
    const { data } = await api.get<{ data: Aluno[] }>('/api/alunos')
    alunos.value = data.data
  } finally {
    loading.value = false
  }
}

watch(modoFiltro, (novo) => {
  if (novo === 'todos') turmaSelecionada.value = null
})

function toggleModo() {
  modoFiltro.value = modoFiltro.value === 'todos' ? 'turma' : 'todos'
}

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
    await carregarAlunos()
  } catch {
    toast.add({ severity: 'error', summary: 'Erro ao salvar aluno', life: 3000 })
  } finally {
    salvando.value = false
  }
}

onMounted(async () => {
  await Promise.all([carregarTurmas(), carregarAlunos()])
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
.page-header h2 {
  margin: 0 0 0.25rem;
  font-size: 1.75rem;
  color: var(--text-1);
  font-weight: 900;
  font-family: 'Nunito', sans-serif;
}
.page-header p { margin: 0; color: var(--text-2); font-size: 0.9rem; font-weight: 600; }

/* ── Filtro bar ── */
.filtro-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}
/* Switch estilo iOS */
.modo-switch { display: flex; align-items: center; gap: 0.625rem; cursor: pointer; user-select: none; }
.sw-opt { font-size: 0.875rem; font-weight: 700; color: var(--text-2); transition: color 0.2s; font-family: 'Nunito', sans-serif; }
.sw-opt--dim { color: var(--text-3); font-weight: 600; }
.sw-track {
  width: 44px; height: 24px; border-radius: 12px;
  background: #E0E7EF; border: 1.5px solid var(--border);
  position: relative; transition: background 0.28s, border-color 0.28s;
}
.sw-track--on { background: var(--acae-primary); border-color: var(--acae-primary); box-shadow: 0 0 12px var(--acae-primary-glow); }
.sw-knob {
  position: absolute; top: 3px; left: 3px;
  width: 16px; height: 16px; border-radius: 50%;
  background: #fff; transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
}
.sw-track--on .sw-knob { transform: translateX(20px); }

/* ── Avatar na tabela ── */
.aluno-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2.5px solid var(--acae-primary);
  box-shadow: 0 2px 8px var(--acae-primary-dim);
  display: block;
}

/* ── Card detalhe avatar ── */
.card-avatar-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 0.5rem;
}
.card-avatar-img {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid var(--acae-primary);
  box-shadow: 0 4px 18px var(--acae-primary-glow);
}

/* ── Form ── */
.dialog-form { display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 0; }
.field { display: flex; flex-direction: column; gap: 0.375rem; }
.field label { font-size: 0.875rem; font-weight: 700; color: var(--text-2); font-family: 'Nunito', sans-serif; }

/* ── Card detalhe ── */
.card-detalhe { display: flex; flex-direction: column; gap: 0.875rem; padding: 0.25rem 0; align-items: center; }
.card-nome { font-size: 1.35rem; font-weight: 900; color: var(--text-1); font-family: 'Nunito', sans-serif; text-align: center; }
.card-campo { display: flex; flex-direction: column; gap: 0.2rem; width: 100%; border-radius: 10px; padding: 0.3rem 0.5rem; transition: background 0.18s; }
.card-campo:hover { background: var(--bg-hover); }
.card-label { font-size: 0.72rem; font-weight: 800; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.06em; }
.card-valor { font-size: 0.9375rem; color: var(--text-1); white-space: pre-wrap; font-weight: 600; }
:deep(.cursor-pointer-rows .p-datatable-tbody > tr) { cursor: pointer; }
</style>



