<template>
  <Teleport to="#page-action-portal" defer>
    <Button label="Nova Turma" icon="pi pi-plus" @click="abrirDialogNova" />
  </Teleport>

  <div class="page-container">
    <!-- Empty state quando não há turmas -->
    <div v-if="!loading && turmas.length === 0" class="empty-state">
      <i class="pi pi-graduation-cap empty-icon" />
      <p class="empty-title">Nenhuma turma cadastrada ainda</p>
      <p class="empty-sub">Clique em "Nova Turma" para começar a organizar seus alunos</p>
    </div>

    <div v-else class="table-scroll-wrapper">
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
      style="min-width: 600px"
      @row-click="abrirCard($event.data)"
    >
      <Column field="nome" header="Nome da Turma" sortable style="min-width: 140px" />
      <Column field="ano_letivo" header="Ano Letivo" sortable />
      <Column field="turno" header="Turno" sortable>
        <template #body="{ data }">
          <Tag :value="turnoLabel(data.turno)" :severity="turnoSeverity(data.turno)" />
        </template>
      </Column>
      <Column field="escola" header="Escola" sortable />
      <Column field="total_alunos" header="Alunos" sortable style="width:160px">
        <template #body="{ data }">
          <div :class="['alunos-stack-cell', data.total_alunos === 0 && 'alunos-stack-cell--zero']">
            <div v-if="data.total_alunos > 0" class="alunos-stack">
              <div
                v-for="(al, i) in (data.alunos_preview ?? []).slice(0, 3)"
                :key="al.id"
                class="stack-bubble"
                :style="{ marginLeft: i > 0 ? '-10px' : '0', zIndex: 3 - i }"
              >
                <img v-if="getAvatarSrc(al.avatar_id)" :src="getAvatarSrc(al.avatar_id)!" class="stack-img" :alt="al.nome" />
                <AvatarInitials v-else :nome="al.nome" :seed="al.id" :size="30" />
              </div>
              <div
                v-if="data.total_alunos > 3"
                class="stack-bubble stack-dots"
                :style="{ marginLeft: '-10px', zIndex: 0 }"
              >···</div>
            </div>
            <span class="alunos-count">{{ data.total_alunos }}</span>
          </div>
        </template>
      </Column>
      <Column header="Ações" style="width:90px">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" v-tooltip.top="'Editar'" text rounded @click.stop="abrirDialogEditar(data)" />
        </template>
      </Column>
    </DataTable>
    </div>

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
        <Button label="Fechar" severity="info" @click="cardVisible = false" />
        <Button label="Editar" icon="pi pi-pencil" severity="success" @click="cardVisible = false; abrirDialogEditar(cardTurma!)" />
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
        <Button label="Cancelar" severity="info" @click="dialogVisible = false" />
        <Button
          :label="editando ? 'Salvar' : 'Criar Turma'"
          icon="pi pi-check"
          severity="success"
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
import { usePageLayout } from '@/composables/usePageLayout'
import { usePageLoading } from '@/composables/usePageLoading'
import { getAvatarSrc } from '@/composables/useAvatars'
import AvatarInitials from '@/components/AvatarInitials.vue'

interface AlunoPreview { id: string; nome: string; avatar_id: number | null }

interface Turma {
  id: string
  nome: string
  ano_letivo: number
  turno: string
  escola: string
  status: string
  total_alunos: number
  alunos_preview: AlunoPreview[]
}

const toast = useToast()
const authStore = useAuthStore()

usePageLayout({ title: 'Turmas', subtitle: 'Gerencie suas turmas do ano letivo' })
const { trackLoad } = usePageLoading()

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

onMounted(() => trackLoad(carregar()))
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
.page-header p { margin: 0; color: var(--text-2); font-size: 0.875rem; }
.dialog-form { display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 0; }
.field { display: flex; flex-direction: column; gap: 0.375rem; }
.field label { font-size: 0.875rem; font-weight: 500; color: var(--text-2); }
.card-detalhe { display: flex; flex-direction: column; gap: 0.875rem; padding: 0.25rem 0; }
.card-campo { display: flex; flex-direction: column; gap: 0.2rem; }
.card-label { font-size: 0.75rem; font-weight: 600; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.05em; }
.card-valor { font-size: 0.9375rem; color: var(--text-1); }
:deep(.cursor-pointer-rows .p-datatable-tbody > tr) { cursor: pointer; }

/* ── Avatar stack na coluna Alunos ── */
.alunos-stack-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.alunos-stack {
  display: flex;
  align-items: center;
  position: relative;
}
.stack-bubble {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid var(--bg-card);
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
}
.stack-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.15s ease;
}
.stack-anon {
  width: 100%;
  height: 100%;
  background: var(--bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-3);
  font-size: 0.85rem;
}
.stack-dots {
  background: var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 700;
  color: var(--text-2);
  letter-spacing: -1px;
}
.alunos-count {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--text-1);
}
.alunos-stack-cell--zero {
  justify-content: flex-start;
}
:deep(tr:hover .avatar-initials-circle) {
  transform: scale(1.15);
  box-shadow: 0 3px 10px rgba(0,0,0,0.18);
}
:deep(tr:hover .stack-img) {
  transform: scale(1.15);
}

/* ── Mobile: scroll horizontal na tabela ── */
.table-scroll-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  width: 100%;
}

/* ── Empty state ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 2rem;
  text-align: center;
  gap: 0.75rem;
}
.empty-icon {
  font-size: 3.5rem;
  color: var(--text-3);
}
.empty-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-2);
  margin: 0;
}
.empty-sub {
  font-size: 0.875rem;
  color: var(--text-3);
  margin: 0;
}
</style>

