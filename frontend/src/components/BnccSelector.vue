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
