<template>
  <div class="page-container">
    <DataTable
      :value="documentos"
      :loading="loading"
      :paginator="documentos.length > 20"
      :rows="20"
      :rowsPerPageOptions="[10, 20, 50]"
      sortField="finalizado_em"
      :sortOrder="-1"
      emptyMessage="Nenhum documento encontrado"
      class="cursor-pointer-rows"
      @row-click="abrirDownload($event.data)"
    >
      <Column field="aluno_nome" header="Aluno" sortable style="width:25%" />
      <Column field="tipo" header="Tipo" sortable style="width:30%">
        <template #body="{ data }">{{ tipoLabel(data.tipo) }}</template>
      </Column>
      <Column field="periodo" header="Período" sortable style="width:25%" />
      <Column field="finalizado_em" header="Data" sortable style="width:12%">
        <template #body="{ data }">
          {{ data.finalizado_em ? new Date(data.finalizado_em).toLocaleDateString('pt-BR') : '—' }}
        </template>
      </Column>
      <Column header="Download" style="width:8%; text-align: center">
        <template #body="{ data }">
          <Button icon="pi pi-download" text rounded @click.stop="abrirFormato(data)" />
        </template>
      </Column>
    </DataTable>

    <!-- Dialog pequeno: selecionar formato -->
    <Dialog v-model:visible="formatoVisible" header="Selecione o formato" modal :style="{ width: '280px' }">
      <div v-if="selecionadoFormato" class="formato-dialog">
        <BotaoExportar :rascunho-id="selecionadoFormato.rascunho_id" />
      </div>
    </Dialog>

    <!-- Dialog de Download -->
    <Dialog v-model:visible="downloadVisible" header="Baixar Documento" modal :style="{ width: '380px' }">
      <div v-if="selecionado" class="doc-info">
        <div class="doc-campo"><span class="doc-label">Aluno</span><span class="doc-valor">{{ selecionado.aluno_nome || '—' }}</span></div>
        <div class="doc-campo"><span class="doc-label">Tipo</span><span class="doc-valor">{{ tipoLabel(selecionado.tipo) }}</span></div>
        <div class="doc-campo"><span class="doc-label">Período</span><span class="doc-valor">{{ selecionado.periodo }}</span></div>
        <div class="doc-campo"><span class="doc-label">Gerado em</span><span class="doc-valor">{{ selecionado.finalizado_em ? new Date(selecionado.finalizado_em).toLocaleDateString('pt-BR') : '—' }}</span></div>
        <div class="doc-download">
          <p class="doc-download-label">Selecione o formato:</p>
          <BotaoExportar :rascunho-id="selecionado.rascunho_id" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import BotaoExportar from '@/components/BotaoExportar.vue'
import api from '@/services/api'
import { usePageLayout } from '@/composables/usePageLayout'
import { usePageLoading } from '@/composables/usePageLoading'

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
usePageLayout({ title: 'Histórico de Documentos', subtitle: 'Clique em um documento para baixar' })
const { trackLoad } = usePageLoading()
const loading = ref(false)
const downloadVisible = ref(false)
const selecionado = ref<Documento | null>(null)
const formatoVisible = ref(false)
const selecionadoFormato = ref<Documento | null>(null)

const TIPO_LABELS: Record<string, string> = {
  relatorio_individual: 'Relatório Individual',
  portfolio_mensal: 'Portfólio Mensal',
  plano_aula: 'Plano de Aula',
  ata_reuniao: 'Ata de Reunião',
}

function tipoLabel(tipo: string) {
  return TIPO_LABELS[tipo] ?? tipo
}

function abrirDownload(doc: Documento) {
  selecionado.value = doc
  downloadVisible.value = true
}

function abrirFormato(doc: Documento) {
  selecionadoFormato.value = doc
  formatoVisible.value = true
}

onMounted(() => {
  loading.value = true
  trackLoad(
    api.get<{ data: Documento[] }>('/api/documentos')
      .then(({ data }) => { documentos.value = data.data })
      .catch(() => { /* handled by interceptor */ })
      .finally(() => { loading.value = false })
  )
})
</script>

<style scoped>
.page-container { padding: 1rem; }
.page-header { margin-bottom: 1.5rem; }
.page-header h2 { margin: 0 0 0.25rem; font-size: 1.75rem; font-weight: 900; font-family: 'Nunito', sans-serif; color: var(--text-1); }
.page-header p { margin: 0; color: var(--text-2); }
.doc-info { display: flex; flex-direction: column; gap: 0.875rem; padding: 0.25rem 0; }
.doc-campo { display: flex; flex-direction: column; gap: 0.2rem; }
.doc-label { font-size: 0.75rem; font-weight: 600; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.05em; }
.doc-valor { font-size: 0.9375rem; color: var(--text-1); }
.doc-download { margin-top: 0.5rem; padding-top: 1rem; border-top: 1px solid var(--border); }
.doc-download-label { margin: 0 0 0.75rem; font-size: 0.875rem; font-weight: 500; color: var(--text-2); }
.formato-dialog { display: flex; justify-content: center; padding: 0.5rem 0 0.25rem; }
:deep(.cursor-pointer-rows .p-datatable-tbody > tr) { cursor: pointer; }
</style>
