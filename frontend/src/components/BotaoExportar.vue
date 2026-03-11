<template>
  <div class="botao-exportar">
    <Button
      label=".docx"
      icon="pi pi-file-word"
      severity="secondary"
      :loading="loadingDocx"
      @click="exportar('docx')"
    />
    <Button
      label=".pdf"
      icon="pi pi-file-pdf"
      severity="secondary"
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

const props = defineProps<{ rascunhoId: string }>()
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
</style>
