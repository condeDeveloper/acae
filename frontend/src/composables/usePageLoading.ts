import { ref } from 'vue'

// Module-level singleton — shared by all component instances
const _isLoading = ref(false)
let _count = 0
let _autoHide: ReturnType<typeof setTimeout> | null = null

export function usePageLoading() {
  /**
   * Called by AppLayout whenever the route changes.
   * Shows the overlay immediately and sets a fallback auto-hide
   * for pages that don't register any trackLoad() calls (form/tool pages).
   */
  function beginNav() {
    if (_autoHide) { clearTimeout(_autoHide); _autoHide = null }
    _count = 0
    _isLoading.value = true
    // Auto-hide after 600 ms for pages that never call trackLoad
    _autoHide = setTimeout(() => {
      _count = 0
      _isLoading.value = false
      _autoHide = null
    }, 600)
  }

  /**
   * Wraps a data-fetching promise.
   * Cancels the auto-hide timer and keeps the overlay visible until
   * ALL tracked promises have settled.
   */
  function trackLoad<T>(promise: Promise<T>): Promise<T> {
    if (_autoHide) { clearTimeout(_autoHide); _autoHide = null }
    _count++
    _isLoading.value = true
    return promise.finally(() => {
      _count = Math.max(0, _count - 1)
      if (_count === 0) _isLoading.value = false
    }) as Promise<T>
  }

  return { isPageLoading: _isLoading, beginNav, trackLoad }
}
