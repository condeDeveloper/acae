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
      emptyMessage="Nenhum documento encontrado"
    >
      <Column field="tipo" header="Tipo" />
      <Column field="periodo" header="Período" />
      <Column field="finalizado_em" header="Data" />
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

const documentos = ref<Record<string, unknown>[]>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const { data } = await api.get('/api/documentos')
    documentos.value = data
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
