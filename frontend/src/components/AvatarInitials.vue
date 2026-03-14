<template>
  <div class="avatar-initials-circle" :style="circleStyle">{{ initials }}</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getAvatarColor, AVATAR_COLOR_STYLES } from '@/composables/useAvatars'

const props = defineProps<{
  nome: string
  seed: string   // aluno_id — ensures consistent color per student
  size?: number  // diameter in px, default 40
}>()

const px = computed(() => props.size ?? 40)

const color = computed(() => AVATAR_COLOR_STYLES[getAvatarColor(props.seed)])

const initials = computed(() =>
  props.nome.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('')
)

const circleStyle = computed(() => {
  const size = px.value
  const fontSize = size >= 80 ? '1.5rem' : size >= 55 ? '1.2rem' : size >= 35 ? '0.88rem' : '0.68rem'
  return {
    width:          `${size}px`,
    height:         `${size}px`,
    background:     color.value.bg,
    color:          color.value.text,
    border:         `2px solid ${color.value.border}`,
    fontSize,
    borderRadius:   '50%',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontWeight:     '900',
    fontFamily:     "'Nunito', sans-serif",
    flexShrink:     '0',
    userSelect:     'none',
  }
})
</script>
