# Modelo de Dados: Relatório Individual do Aluno

**Branch**: `005-relatorio-individual` | **Data**: 2026-03-10

---

## Observação

Esta feature **não cria novas tabelas** além das definidas em `specs/007-banco-de-dados/data-model.md`. Usa `rascunhos_documento` e `versoes_documento` com `tipo = 'relatorio_individual'`.

---

## Entidades de banco utilizadas

```
alunos ──── rascunhos_documento ──── versoes_documento
              tipo = 'relatorio_individual'
              status: rascunho | em_revisao | finalizado
```

Campos relevantes de `rascunhos_documento` para esta feature:
| Campo | Tipo | Obrigatório para gerar | Obrigatório para finalizar |
|-------|------|----------------------|--------------------------|
| `tipo` | enum | `relatorio_individual` | `relatorio_individual` |
| `professor_id` | uuid | ✅ | ✅ |
| `aluno_id` | uuid | ✅ | ✅ |
| `turma_id` | uuid | ✅ | ✅ |
| `periodo_inicio` | date | ✅ | ✅ |
| `periodo_fim` | date | ✅ | ✅ |
| `bncc_refs` | varchar[] | ✅ (≥ 1) | ✅ (≥ 1) |
| `conteudo_gerado` | text | preenchido pela IA | ✅ |
| `conteudo_editado` | text | — | — (usa gerado se vazio) |
| `conteudo_final` | text | — | ✅ preenchido ao finalizar |
| `status` | enum | `rascunho` | `finalizado` |
| `finalizado_em` | timestamptz | — | ✅ |

---

## Estado de componente Vue (useRelatórioStore)

```typescript
// frontend/src/stores/relatorio.store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

interface RelatorioForm {
  aluno_id: string
  turma_id: string
  periodo_inicio: string   // ISO date YYYY-MM-DD
  periodo_fim: string
  bncc_refs: string[]      // ['EI03EO01', 'EI03ET03']
}

export const useRelatorioStore = defineStore('relatorio', () => {
  // Formulário de entrada
  const form = ref<RelatorioForm>({
    aluno_id: '',
    turma_id: '',
    periodo_inicio: '',
    periodo_fim: '',
    bncc_refs: [],
  })

  // Rascunho ativo
  const rascunho = ref<{
    id: string
    conteudo_gerado: string
    conteudo_editado: string
    status: 'rascunho' | 'em_revisao' | 'finalizado'
    gerado_em: string
  } | null>(null)

  // Estado da UI
  const etapa = ref<'formulario' | 'rascunho' | 'finalizado'>('formulario')
  const estaGerando = ref(false)
  const erroGeracao = ref<string | null>(null)

  // Conteúdo editável (sincronizado com rascunho.conteudo_editado)
  const conteudoEditado = computed({
    get: () => rascunho.value?.conteudo_editado || rascunho.value?.conteudo_gerado || '',
    set: (val: string) => {
      if (rascunho.value) rascunho.value.conteudo_editado = val
    },
  })

  // Validação do formulário (para habilitar botão "Gerar")
  const formularioValido = computed(() =>
    form.value.aluno_id &&
    form.value.turma_id &&
    form.value.periodo_inicio &&
    form.value.periodo_fim &&
    form.value.bncc_refs.length >= 1
  )

  // Pode finalizar?
  const podeFinalizarr = computed(() =>
    rascunho.value?.status !== 'finalizado' &&
    form.value.bncc_refs.length >= 1 &&
    conteudoEditado.value.trim().length > 0
  )

  async function gerarRelatorio() {
    estaGerando.value = true
    erroGeracao.value = null
    try {
      const res = await api.post('/api/documents/generate', {
        tipo: 'relatorio_individual',
        ...form.value,
        periodo: {
          inicio: form.value.periodo_inicio,
          fim: form.value.periodo_fim,
        },
      })
      rascunho.value = res.data
      etapa.value = 'rascunho'
    } catch (err: any) {
      erroGeracao.value = err.response?.data?.error ?? 'Erro ao gerar relatório'
    } finally {
      estaGerando.value = false
    }
  }

  async function autoSalvar(conteudo: string) {
    if (!rascunho.value || rascunho.value.status === 'finalizado') return
    await api.patch(`/api/documents/rascunhos/${rascunho.value.id}`, {
      conteudo_editado: conteudo,
      status: 'em_revisao',
    })
  }

  async function finalizar(conteudoFinal: string) {
    if (!rascunho.value) return
    await api.post(`/api/documents/rascunhos/${rascunho.value.id}/finalizar`, {
      conteudo_final: conteudoFinal,
    })
    rascunho.value.status = 'finalizado'
    etapa.value = 'finalizado'
  }

  async function carregarRascunhoAtivo(aluno_id: string) {
    const res = await api.get('/api/documents/rascunhos', {
      params: { aluno_id, tipo: 'relatorio_individual' },
    })
    if (res.data.length > 0) {
      rascunho.value = res.data[0]
      etapa.value = rascunho.value!.status === 'finalizado' ? 'finalizado' : 'rascunho'
    }
  }

  return {
    form, rascunho, etapa, estaGerando, erroGeracao,
    conteudoEditado, formularioValido, podeFinalizarr,
    gerarRelatorio, autoSalvar, finalizar, carregarRascunhoAtivo,
  }
})
```

---

## Máquina de estados da UI

```
formulario ──[Gerar Relatório]──▶ rascunho ──[Finalizar]──▶ finalizado
                                   │                              │
                              (editar/salvar                 (somente leitura
                               automaticamente)               + download)
                                   │
                              [Gerar novamente]
                                   │
                              (confirmar sobreescrita)
                                   ▼
                              formulario (rascunho anterior descartado)
```

---

## Layout de tela (RF-005, RF-006)

```
┌─────────────────────────────────────────────────┐
│  Relatório Individual                            │
│  Aluno: [João S.]  Turma: [Grupo A]             │
├───────────────────────┬─────────────────────────┤
│ Dados do Período      │  Rascunho               │  ← sticky em desktop
│                       │  ┌───────────────────┐  │
│ Data início: [____]   │  │ Texto gerado...   │  │
│ Data fim:    [____]   │  │                   │  │
│ BNCC:        [+Add]   │  │                   │  │
│                       │  └───────────────────┘  │
│ [Gerar Relatório]     │  ✓ Salvo às 14:23       │
│                       │  [⬇ Baixar .docx]       │
│                       │  [⬇ Baixar .pdf ]       │
│                       │                         │
│                       │  [Finalizar Relatório]  │
└───────────────────────┴─────────────────────────┘
```

Em mobile (< 1024px):
```
Formulário (col-12 completo)
────────────────────────────────
Rascunho (col-12)
[Baixar .docx] [Baixar .pdf]
[Finalizar]
```

---

## Estrutura de arquivos do frontend

```
frontend/src/
  pages/
    RelatórioIndividualPage.vue   # Página principal
  components/
    ─ DocumentoRevisor.vue         # Textarea + autosave status
    ─ BotaoExportar.vue            # Botão unificado (docx/pdf) chamando /export + download
    ─ HistoricoRelatorios.vue      # Lista read-only de versoes_documento
  stores/
    relatorio.store.ts             # useRelatorioStore (acima)
  composables/
    useAutoSave.ts                 # watchDebounced wrapper
```
