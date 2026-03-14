<template>
  <div class="historico">
    <div class="historico-header">
      <div class="historico-aluno-info" v-if="alunoNome || getAvatarSrc(alunoAvatarId)">
        <img v-if="getAvatarSrc(alunoAvatarId)" :src="getAvatarSrc(alunoAvatarId)!" class="historico-avatar-img" alt="avatar" />
        <div v-else class="historico-avatar-anon"><i class="pi pi-user" /></div>
        <span class="historico-aluno-nome">{{ alunoNome }}</span>
      </div>
      <h4>Histórico de Relatórios</h4>
    </div>

    <!-- Empty state -->
    <div v-if="!loading && versoes.length === 0" class="empty-state">
      <i class="pi pi-file-edit empty-icon" />
      <p class="empty-title">Nenhum relatório gerado ainda</p>
      <p class="empty-sub">Gere um relatório individual para que ele apareça aqui</p>
    </div>

    <DataTable
      v-else
      :value="versoes"
      :loading="loading"
      :paginator="versoes.length > 20"
      :rows="20"
      class="historico-table"
    >
      <Column field="periodo" header="Período" />
      <Column field="finalizado_em" header="Finalizado em">
        <template #body="{ data }">
          {{ data.finalizado_em ? new Date(data.finalizado_em).toLocaleDateString('pt-BR') : '-' }}
        </template>
      </Column>
      <Column header="Download" style="width:130px;text-align:center">
        <template #body="{ data }">
          <div class="download-cell">
            <BotaoExportar :rascunho-id="data.rascunho_id" compacto />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import BotaoExportar from './BotaoExportar.vue'
import api from '@/services/api'
import { getAvatarSrc } from '@/composables/useAvatars'

interface VersaoDocumento {
  rascunho_id: string
  periodo: string
  finalizado_em: string | null
}

interface ApiResponse {
  data: VersaoDocumento[]
  total: number
}

const props = defineProps<{
  alunoId: string
  alunoAvatarId?: number | null
  alunoNome?: string
}>()

const versoes = ref<VersaoDocumento[]>([])
const loading = ref(false)

async function carregar() {
  if (!props.alunoId) return
  loading.value = true
  try {
    const { data } = await api.get<ApiResponse>(`/api/alunos/${props.alunoId}/documentos`, {
      params: { tipo: 'relatorio_individual' },
    })
    versoes.value = data.data ?? []
  } catch {
    /* handled by interceptor */
  } finally {
    loading.value = false
  }
}

onMounted(carregar)
watch(() => props.alunoId, carregar)
</script>

<style scoped>
.historico { margin-top: 1rem; }
.historico-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.historico-header h4 { margin: 0; color: var(--text-1); font-size: 0.95rem; font-weight: 700; }
.historico-aluno-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.historico-avatar-img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--acae-primary);
}
.historico-avatar-anon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-overlay);
  border: 2px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  color: var(--text-3);
}
.historico-aluno-nome {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-2);
}
.download-cell {
  display: flex;
  justify-content: center;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1rem;
  text-align: center;
  gap: 0.5rem;
}
.empty-icon { font-size: 2.5rem; color: var(--text-3); }
.empty-title { font-size: 0.95rem; font-weight: 700; color: var(--text-2); margin: 0; }
.empty-sub { font-size: 0.8rem; color: var(--text-3); margin: 0; }
</style>
