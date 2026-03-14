<template>
  <MultiSelect
    v-model="selected"
    :options="grupos"
    optionGroupLabel="area"
    optionGroupChildren="items"
    optionLabel="label"
    optionValue="codigo"
    :loading="loading"
    placeholder="Selecione competências BNCC"
    display="chip"
    filter
    filterPlaceholder="Buscar competência"
    fluid
    :maxSelectedLabels="999"
    scrollHeight="320px"
    @update:modelValue="$emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MultiSelect from 'primevue/multiselect'
import api from '@/services/api'

interface Competencia {
  id: string
  codigo: string
  descricao: string
  area_conhecimento: string
  nivel_educacional: string
}

const props = defineProps<{ modelValue: string[] }>()
defineEmits<{ 'update:modelValue': [value: string[]] }>()

const selected = ref<string[]>(props.modelValue)
const competencias = ref<Competencia[]>([])
const loading = ref(false)

// Group by area_conhecimento for easier scanning
const grupos = computed(() => {
  const map = new Map<string, { codigo: string; label: string }[]>()
  for (const c of competencias.value) {
    const area = c.area_conhecimento ?? 'Outras'
    if (!map.has(area)) map.set(area, [])
    map.get(area)!.push({
      codigo: c.codigo,
      label: `${c.codigo} — ${c.descricao.length > 80 ? c.descricao.slice(0, 80) + '…' : c.descricao}`,
    })
  }
  return Array.from(map.entries()).map(([area, items]) => ({ area, items }))
})

onMounted(async () => {
  loading.value = true
  try {
    const { data } = await api.get<{ data: Competencia[] }>('/api/competencias')
    competencias.value = data.data
  } catch {
    /* handled by interceptor */
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* Allow the chip area to grow vertically when many chips are selected */
:deep(.p-multiselect-label) {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 4px !important;
  height: auto !important;
  max-height: none !important;
  padding: 0.375rem !important;
  white-space: normal !important;
  overflow: visible !important;
}
:deep(.p-multiselect) {
  height: auto !important;
  min-height: 2.5rem;
}
:deep(.p-multiselect-label-container) {
  height: auto !important;
  overflow: visible !important;
}
</style>
