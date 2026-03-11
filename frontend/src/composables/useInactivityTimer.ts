import { useAuthStore } from '@/stores/auth'

const TIMEOUT_MS = Number(import.meta.env.VITE_SESSION_TIMEOUT_MS) || 30 * 60 * 1000
const EVENTS = ['click', 'keydown', 'mousemove', 'touchstart'] as const

export function useInactivityTimer() {
  const authStore = useAuthStore()
  let timerId: ReturnType<typeof setTimeout> | null = null

  function reset() {
    if (timerId) clearTimeout(timerId)
    timerId = setTimeout(async () => {
      await authStore.logout()
    }, TIMEOUT_MS)
  }

  function start() {
    reset()
    for (const event of EVENTS) {
      document.addEventListener(event, reset, { passive: true })
    }
  }

  function stop() {
    if (timerId) clearTimeout(timerId)
    for (const event of EVENTS) {
      document.removeEventListener(event, reset)
    }
  }

  return { start, stop }
}
