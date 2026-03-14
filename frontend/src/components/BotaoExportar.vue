<template>
  <div :class="['botao-exportar', compacto ? 'botao-exportar--compacto' : '']">
    <Button
      :label="compacto ? undefined : '.docx'"
      icon="pi pi-file-word"
      :severity="compacto ? undefined : 'secondary'"
      :text="compacto"
      :rounded="compacto"
      :v-tooltip="compacto ? '.docx' : undefined"
      :class="compacto ? 'btn-download-azul' : ''"
      :loading="loadingDocx"
      @click="exportar('docx')"
    />
    <Button
      :label="compacto ? undefined : '.pdf'"
      icon="pi pi-file-pdf"
      :severity="compacto ? undefined : 'secondary'"
      :text="compacto"
      :rounded="compacto"
      :class="compacto ? 'btn-download-azul' : ''"
      :loading="loadingPdf"
      @click="exportar('pdf')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import api from '@/services/api'

const props = defineProps<{ rascunhoId: string; compacto?: boolean }>()
const toast = useToast()

const loadingDocx = ref(false)
const loadingPdf = ref(false)

async function exportar(formato: 'docx' | 'pdf') {
  const loading = formato === 'docx' ? loadingDocx : loadingPdf
  loading.value = true
  try {
    const { data } = await api.get<{ download_url: string }>(
      `/api/documents/rascunhos/${props.rascunhoId}/export`,
      { params: { formato } },
    )
    window.open(data.download_url, '_blank')
  } catch {
    toast.add({ severity: 'error', summary: 'Não foi possível gerar o arquivo', life: 4000 })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.botao-exportar {
  display: flex;
  gap: 0.5rem;
}
.botao-exportar--compacto {
  gap: 0.25rem;
  justify-content: center;
}
:deep(.btn-download-azul.p-button) {
  color: var(--acae-blue) !important;
}
:deep(.btn-download-azul.p-button:hover) {
  background: var(--acae-blue-dim) !important;
  color: var(--acae-blue) !important;
}
</style>
