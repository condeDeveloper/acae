<template>
  <div class="page-container">
    <div class="page-header">
      <h2>Documentos</h2>
      <p>Histórico de documentos gerados</p>
    </div>

    <DataTable
      :value="documentos"
      :loading="loading"
      paginator
      :rows="20"
      :rowsPerPageOptions="[10, 20, 50]"
      sortField="finalizado_em"
      :sortOrder="-1"
      emptyMessage="Nenhum documento encontrado"
    >
      <Column field="aluno_nome" header="Aluno" sortable />
      <Column field="tipo" header="Tipo" sortable>
        <template #body="{ data }">{{ tipoLabel(data.tipo) }}</template>
      </Column>
      <Column field="periodo" header="Período" sortable />
      <Column field="finalizado_em" header="Data" sortable>
        <template #body="{ data }">
          {{ data.finalizado_em ? new Date(data.finalizado_em).toLocaleDateString('pt-BR') : '—' }}
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
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import BotaoExportar from '@/components/BotaoExportar.vue'
import api from '@/services/api'

interface Documento {
  id: string
  rascunho_id: string
  tipo: string
  aluno_nome: string | null
  numero_versao: number
  periodo: string
  finalizado_em: string | null
  created_at: string
}

const documentos = ref<Documento[]>([])
const loading = ref(false)

const TIPO_LABELS: Record<string, string> = {
  relatorio_individual: 'Relatório Individual',
  portfolio_mensal: 'Portfólio Mensal',
  plano_aula: 'Plano de Aula',
  ata_reuniao: 'Ata de Reunião',
}

function tipoLabel(tipo: string) {
  return TIPO_LABELS[tipo] ?? tipo
}

onMounted(async () => {
  loading.value = true
  try {
    const { data } = await api.get<{ data: Documento[] }>('/api/documentos')
    documentos.value = data.data
  } catch {
    /* handled by interceptor */
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-container { padding: 1rem; }
.page-header { margin-bottom: 1.5rem; }
.page-header h2 { margin: 0 0 0.25rem; font-size: 1.5rem; color: #7c3aed; }
.page-header p { margin: 0; color: #6b7280; }
</style>
