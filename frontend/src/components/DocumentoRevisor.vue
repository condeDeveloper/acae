<template>
  <div class="revisor">
    <Textarea
      v-model="conteudoLocal"
      :disabled="rascunho.status === 'finalizado'"
      autoResize
      rows="12"
      class="revisor-textarea"
      @input="onInput"
    />
    <div class="save-status">
      <span v-if="saveStatus === 'saving'" class="status-saving">
        <i class="pi pi-spin pi-spinner" /> Salvando…
      </span>
      <span v-else-if="saveStatus === 'saved'" class="status-saved">
        <i class="pi pi-check" /> Salvo
      </span>
      <span v-else-if="saveStatus === 'error'" class="status-error">
        <i class="pi pi-times" /> Erro ao salvar
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Textarea from 'primevue/textarea'
import { watchDebounced } from '@vueuse/core'

interface Rascunho {
  id: string
  status: string
  conteudo_gerado: string
  conteudo_editado?: string
}

const props = defineProps<{
  rascunho: Rascunho
}>()

const emit = defineEmits<{
  save: [text: string]
}>()

const conteudoLocal = ref(props.rascunho.conteudo_editado ?? props.rascunho.conteudo_gerado)
const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')

watch(() => props.rascunho.conteudo_editado, (val) => {
  if (val !== undefined) conteudoLocal.value = val
})

let pendingSave = false
function onInput() {
  pendingSave = true
}

watchDebounced(
  conteudoLocal,
  async (val) => {
    if (!pendingSave || props.rascunho.status === 'finalizado') return
    pendingSave = false
    saveStatus.value = 'saving'
    try {
      emit('save', val)
      saveStatus.value = 'saved'
    } catch {
      saveStatus.value = 'error'
    }
  },
  { debounce: 1500 },
)
</script>

<style scoped>
.revisor { display: flex; flex-direction: column; gap: 0.5rem; }
.revisor-textarea { width: 100%; min-height: 200px; }
.save-status { font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem; }
.status-saving { color: #6b7280; }
.status-saved { color: #059669; }
.status-error { color: #dc2626; }
</style>
