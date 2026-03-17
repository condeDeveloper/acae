<template>
  <div class="revisor">
    <div v-if="rascunho.status !== 'finalizado'" class="toolbar">
      <button
        class="toolbar-btn toolbar-btn--text"
        :class="{ active: editor?.isActive('bold') }"
        title="Negrito"
        @click="editor?.chain().focus().toggleBold().run()"
      >
        <strong>B</strong>
      </button>
      <button
        class="toolbar-btn toolbar-btn--text"
        :class="{ active: editor?.isActive('italic') }"
        title="Itálico"
        @click="editor?.chain().focus().toggleItalic().run()"
      >
        <em>I</em>
      </button>
      <div class="toolbar-sep" />
      <button
        class="toolbar-btn"
        :class="{ active: editor?.isActive('bulletList') }"
        title="Lista com marcadores"
        @click="editor?.chain().focus().toggleBulletList().run()"
      >
        <i class="pi pi-list" />
      </button>
      <button
        class="toolbar-btn"
        :class="{ active: editor?.isActive('orderedList') }"
        title="Lista numerada"
        @click="editor?.chain().focus().toggleOrderedList().run()"
      >
        <i class="pi pi-sort-numeric-down" />
      </button>
      <div class="toolbar-sep" />
      <button
        class="toolbar-btn"
        title="Linha separadora"
        @click="editor?.chain().focus().setHorizontalRule().run()"
      >
        <i class="pi pi-minus" />
      </button>
    </div>

    <EditorContent :editor="editor" class="revisor-editor" :class="{ readonly: rascunho.status === 'finalizado' }" />

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
import { ref, watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
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

// ── Markdown ↔ HTML conversion ──────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatInline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
}

function markdownToHtml(markdown: string): string {
  const lines = markdown.split('\n')
  const out: string[] = []
  let inUl = false
  let inOl = false

  const closeUl = () => { if (inUl) { out.push('</ul>'); inUl = false } }
  const closeOl = () => { if (inOl) { out.push('</ol>'); inOl = false } }

  for (const line of lines) {
    if (/^[-•]\s/.test(line)) {
      closeOl()
      if (!inUl) { out.push('<ul>'); inUl = true }
      out.push(`<li><p>${formatInline(line.slice(2))}</p></li>`)
    } else if (/^\d+\.\s/.test(line)) {
      closeUl()
      if (!inOl) { out.push('<ol>'); inOl = true }
      out.push(`<li><p>${formatInline(line.replace(/^\d+\.\s/, ''))}</p></li>`)
    } else {
      closeUl()
      closeOl()
      if (line === '---' || line === '___') {
        out.push('<hr>')
      } else if (line.startsWith('### ')) {
        out.push(`<h3>${formatInline(line.slice(4))}</h3>`)
      } else if (line.startsWith('## ')) {
        out.push(`<h2>${formatInline(line.slice(3))}</h2>`)
      } else if (line.startsWith('# ')) {
        out.push(`<h1>${formatInline(line.slice(2))}</h1>`)
      } else {
        out.push(`<p>${formatInline(line)}</p>`)
      }
    }
  }
  closeUl()
  closeOl()
  return out.join('')
}

function nodeToMarkdownText(el: Element): string {
  let text = ''
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent ?? ''
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const child = node as Element
      switch (child.tagName.toLowerCase()) {
        case 'strong': text += `**${child.textContent}**`; break
        case 'em': text += `*${child.textContent}*`; break
        case 'p': text += nodeToMarkdownText(child); break
        default: text += child.textContent ?? ''
      }
    }
  }
  return text
}

function htmlToMarkdown(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  const lines: string[] = []

  for (const node of div.childNodes) {
    if (node.nodeType !== Node.ELEMENT_NODE) continue
    const el = node as Element
    switch (el.tagName.toLowerCase()) {
      case 'p':
        lines.push(nodeToMarkdownText(el))
        break
      case 'h1': lines.push(`# ${nodeToMarkdownText(el)}`); break
      case 'h2': lines.push(`## ${nodeToMarkdownText(el)}`); break
      case 'h3': lines.push(`### ${nodeToMarkdownText(el)}`); break
      case 'ul':
        for (const li of el.querySelectorAll(':scope > li'))
          lines.push(`- ${nodeToMarkdownText(li)}`)
        break
      case 'ol': {
        let i = 1
        for (const li of el.querySelectorAll(':scope > li'))
          lines.push(`${i++}. ${nodeToMarkdownText(li)}`)
        break
      }
      case 'hr':
        lines.push('---')
        break
    }
  }
  return lines.join('\n')
}

// ── Editor setup ─────────────────────────────────────────────────────────────

const initialContent = props.rascunho.conteudo_editado ?? props.rascunho.conteudo_gerado
const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const editorHtml = ref('')

const editor = useEditor({
  content: markdownToHtml(initialContent),
  editable: props.rascunho.status !== 'finalizado',
  extensions: [StarterKit],
  onUpdate({ editor: e }) {
    editorHtml.value = e.getHTML()
  },
})

// Watch for rascunho id change (different document loaded)
watch(() => props.rascunho.id, () => {
  const content = props.rascunho.conteudo_editado ?? props.rascunho.conteudo_gerado
  editor.value?.commands.setContent(markdownToHtml(content), false)
  editor.value?.setEditable(props.rascunho.status !== 'finalizado')
  editorHtml.value = ''
  saveStatus.value = 'idle'
})

watch(() => props.rascunho.status, (val) => {
  editor.value?.setEditable(val !== 'finalizado')
})

// Debounced auto-save whenever editorHtml changes
watchDebounced(
  editorHtml,
  async (val) => {
    if (!val || props.rascunho.status === 'finalizado') return
    saveStatus.value = 'saving'
    try {
      emit('save', htmlToMarkdown(val))
      saveStatus.value = 'saved'
    } catch {
      saveStatus.value = 'error'
    }
  },
  { debounce: 1500 },
)

onBeforeUnmount(() => editor.value?.destroy())
</script>

<style scoped>
.revisor {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.5rem;
  background: var(--p-surface-100, #f3f4f6);
  border: 1px solid var(--p-surface-300, #d1d5db);
  border-radius: 6px 6px 0 0;
}

.toolbar-btn--text {
  font-size: 1rem;
  font-family: Georgia, serif;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  color: var(--p-text-color, #374151);
  font-size: 0.875rem;
  transition: background 0.15s;
}

.toolbar-btn:hover {
  background: var(--p-surface-200, #e5e7eb);
}

.toolbar-btn.active {
  background: var(--p-primary-100, #dbeafe);
  color: var(--p-primary-600, #2563eb);
}

.toolbar-sep {
  width: 1px;
  height: 1.25rem;
  background: var(--p-surface-300, #d1d5db);
  margin: 0 0.25rem;
}

/* Editor area */
.revisor-editor {
  border: 1px solid var(--p-surface-300, #d1d5db);
  border-top: none;
  border-radius: 0 0 6px 6px;
  min-height: 200px;
  background: var(--p-surface-0, #ffffff);
}

.revisor-editor.readonly {
  border-radius: 6px;
  border-top: 1px solid var(--p-surface-300, #d1d5db);
  background: var(--p-surface-50, #f9fafb);
}

:deep(.tiptap) {
  padding: 0.75rem 1rem;
  min-height: 200px;
  outline: none;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--p-text-color, #111827);
}

:deep(.tiptap p) { margin: 0 0 0.5rem; }
:deep(.tiptap p:last-child) { margin-bottom: 0; }
:deep(.tiptap ul),
:deep(.tiptap ol) { padding-left: 1.5rem; margin: 0 0 0.5rem; }
:deep(.tiptap li) { margin-bottom: 0.25rem; }
:deep(.tiptap li p) { margin: 0; }
:deep(.tiptap hr) {
  border: none;
  border-top: 2px solid var(--p-surface-300, #d1d5db);
  margin: 1rem 0;
}
:deep(.tiptap h1) { font-size: 1.375rem; font-weight: 700; margin: 0 0 0.5rem; }
:deep(.tiptap h2) { font-size: 1.125rem; font-weight: 700; margin: 0 0 0.5rem; }
:deep(.tiptap h3) { font-size: 1rem; font-weight: 700; margin: 0 0 0.5rem; }

/* Status */
.save-status { font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem; }
.status-saving { color: #6b7280; }
.status-saved { color: #059669; }
.status-error { color: #dc2626; }
</style>
