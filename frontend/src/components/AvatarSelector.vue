<template>
  <!-- Trigger / preview (inline no form) -->
  <div class="avatar-picker" @click="abrirSeletor">
    <div class="avatar-preview-circle">
      <img
        v-if="src"
        :src="src"
        class="avatar-preview-img"
        alt="Avatar selecionado"
      />
      <div v-else class="avatar-preview-anon">
        <i class="pi pi-user" />
      </div>
    </div>
    <div class="avatar-picker-hint">
      <span>{{ modelValue ? 'Alterar avatar' : 'Escolher avatar' }}</span>
      <i class="pi pi-pencil" style="font-size: 0.72rem" />
    </div>
  </div>

  <!-- Dialog de seleção -->
  <Dialog
    v-model:visible="seletorVisivel"
    header="Escolher Avatar"
    modal
    :style="{ width: '500px' }"
    :draggable="false"
    :blockScroll="true"
  >
    <div class="avatar-grid">
      <!-- Sem avatar -->
      <div
        class="avatar-opt"
        :class="{ 'avatar-opt--selecionado': interno === null }"
        @click="interno = null"
      >
        <div class="avatar-opt-circle avatar-opt-circle--anon">
          <i class="pi pi-user" />
        </div>
        <span>Sem avatar</span>
      </div>

      <!-- Avatares disponíveis -->
      <div
        v-for="av in AVATARES"
        :key="av.id"
        class="avatar-opt"
        :class="{ 'avatar-opt--selecionado': interno === av.id }"
        @click="interno = av.id"
      >
        <img :src="av.src" :alt="av.nome" class="avatar-opt-img" />
        <span>{{ av.nome }}</span>
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" severity="secondary" text @click="seletorVisivel = false" />
      <Button label="Confirmar" icon="pi pi-check" severity="success" @click="confirmar" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { AVATARES, getAvatarSrc } from '@/composables/useAvatars'

const props = defineProps<{ modelValue: number | null }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: number | null): void }>()

const seletorVisivel = ref(false)
const interno = ref<number | null>(props.modelValue)

watch(() => props.modelValue, v => { interno.value = v })

const src = computed(() => getAvatarSrc(props.modelValue))

function abrirSeletor() {
  interno.value = props.modelValue
  seletorVisivel.value = true
}

function confirmar() {
  emit('update:modelValue', interno.value)
  seletorVisivel.value = false
}
</script>

<style scoped>
/* ── Trigger ── */
.avatar-picker {
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  padding: 0.75rem 1rem;
  border: 2px dashed var(--border);
  border-radius: 12px;
  transition: border-color 0.2s, background 0.2s;
}
.avatar-picker:hover {
  border-color: var(--acae-primary);
  background: var(--bg-hover);
}
.avatar-preview-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}
.avatar-preview-img {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 2.5px solid var(--acae-primary);
  box-shadow: 0 2px 8px var(--acae-primary-dim);
}
.avatar-preview-anon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--bg-overlay);
  border: 2px dashed var(--border-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  color: var(--text-3);
}
.avatar-picker-hint {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.875rem;
  color: var(--text-2);
  font-weight: 600;
}

/* ── Grid de opções ── */
.avatar-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  padding: 0.25rem 0;
}
.avatar-opt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  padding: 0.75rem 0.5rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-2);
  text-align: center;
}
.avatar-opt:hover {
  border-color: var(--acae-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 14px var(--acae-primary-dim);
}
.avatar-opt--selecionado {
  border-color: var(--acae-primary);
  background: var(--acae-primary-dim);
  color: var(--acae-primary-text);
}
.avatar-opt-img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}
.avatar-opt-circle--anon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--bg-overlay);
  border: 2px dashed var(--border-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: var(--text-3);
}
</style>
