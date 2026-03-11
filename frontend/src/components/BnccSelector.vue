<template>
  <MultiSelect
    v-model="selected"
    :options="competencias"
    optionLabel="descricao"
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
import { ref, onMounted } from 'vue'
import MultiSelect from 'primevue/multiselect'
import api from '@/services/api'

interface Competencia { codigo: string; descricao: string; area: string }

const props = defineProps<{ modelValue: string[] }>()
defineEmits<{ 'update:modelValue': [value: string[]] }>()

const selected = ref<string[]>(props.modelValue)
const competencias = ref<Competencia[]>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const { data } = await api.get<Competencia[]>('/api/competencias')
    competencias.value = data
  } catch {
    /* handled by interceptor */
  } finally {
    loading.value = false
  }
})
</script>
