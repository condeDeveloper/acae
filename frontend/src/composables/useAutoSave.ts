import { ref } from 'vue'
import { watchDebounced } from '@vueuse/core'
import type { Ref } from 'vue'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useAutoSave(conteudo: Ref<string>, saveFn: (text: string) => Promise<void>) {
  const status = ref<SaveStatus>('idle')

  watchDebounced(
    conteudo,
    async (val) => {
      status.value = 'saving'
      try {
        await saveFn(val)
        status.value = 'saved'
      } catch {
        status.value = 'error'
      }
    },
    { debounce: 1500 },
  )

  return { status }
}
