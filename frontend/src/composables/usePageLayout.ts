import { inject, provide, ref, type Ref } from 'vue'

interface PageLayoutState {
  title: Ref<string>
  subtitle: Ref<string>
}

const PAGE_LAYOUT_KEY = Symbol('pageLayout')

export function providePageLayout(): PageLayoutState {
  const state: PageLayoutState = {
    title: ref(''),
    subtitle: ref(''),
  }
  provide(PAGE_LAYOUT_KEY, state)
  return state
}

export function usePageLayout(init?: { title: string; subtitle?: string }): PageLayoutState {
  const state = inject<PageLayoutState>(PAGE_LAYOUT_KEY)!
  if (init) {
    state.title.value = init.title
    state.subtitle.value = init.subtitle ?? ''
  }
  return state
}
