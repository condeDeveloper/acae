<template>
  <div class="historico">
    <h4>Histórico de Relatórios</h4>
    <DataTable
      :value="versoes"
      :loading="loading"
      paginator
      :rows="20"
      emptyMessage="Nenhum relatório gerado ainda"
      class="historico-table"
    >
      <Column field="periodo" header="Período" />
      <Column field="finalizado_em" header="Finalizado em">
        <template #body="{ data }">
          {{ data.finalizado_em ? new Date(data.finalizado_em).toLocaleDateString('pt-BR') : '-' }}
        </template>
      </Column>
      <Column header="Download">
        <template #body="{ data }">
          <BotaoExportar :rascunho-id="data.rascunho_id" />
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

interface VersaoDocumento {
  rascunho_id: string
  periodo: string
  finalizado_em: string | null
}

const props = defineProps<{ alunoId: string }>()

const versoes = ref<VersaoDocumento[]>([])
const loading = ref(false)

async function carregar() {
  if (!props.alunoId) return
  loading.value = true
  try {
    const { data } = await api.get<VersaoDocumento[]>(`/api/alunos/${props.alunoId}/documentos`, {
      params: { tipo: 'relatorio_individual' },
    })
    versoes.value = data
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
.historico h4 { margin: 0 0 0.75rem; color: #374151; }
</style>
