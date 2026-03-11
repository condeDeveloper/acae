import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

interface Rascunho {
  id: string
  status: string
  conteudo_gerado: string
  conteudo_editado?: string
}

interface FormState {
  aluno_id: string
  periodo_inicio: Date | null
  periodo_fim: Date | null
  bncc_refs: string[]
}

export const useRelatorioStore = defineStore('relatorio', () => {
  const form = ref<FormState>({
    aluno_id: '',
    periodo_inicio: null,
    periodo_fim: null,
    bncc_refs: [],
  })

  const rascunho = ref<Rascunho | null>(null)
  const etapa = ref<'formulario' | 'revisao' | 'finalizado'>('formulario')
  const estaGerando = ref(false)
  const erroGeracao = ref('')

  const conteudoEditado = computed(
    () => rascunho.value?.conteudo_editado ?? rascunho.value?.conteudo_gerado ?? '',
  )

  const formularioValido = computed(
    () =>
      !!form.value.aluno_id &&
      !!form.value.periodo_inicio &&
      !!form.value.periodo_fim &&
      form.value.bncc_refs.length > 0,
  )

  const podeFinalizar = computed(
    () => !!rascunho.value && rascunho.value.status !== 'finalizado',
  )

  async function gerarRelatorio() {
    estaGerando.value = true
    erroGeracao.value = ''
    try {
      const payload = {
        tipo: 'relatorio_individual',
        aluno_id: form.value.aluno_id,
        bncc_refs: form.value.bncc_refs,
        periodo_inicio: form.value.periodo_inicio?.toISOString().slice(0, 10),
        periodo_fim: form.value.periodo_fim?.toISOString().slice(0, 10),
      }
      const { data } = await api.post<{ rascunho: Rascunho }>('/api/documents/generate', payload)
      rascunho.value = data.rascunho
      etapa.value = 'revisao'
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      erroGeracao.value = error?.response?.data?.error ?? 'Erro ao gerar relatório.'
    } finally {
      estaGerando.value = false
    }
  }

  async function autoSalvar(texto: string) {
    if (!rascunho.value) return
    await api.patch(`/api/documents/rascunhos/${rascunho.value.id}`, { conteudo_editado: texto })
    if (rascunho.value) rascunho.value.conteudo_editado = texto
  }

  async function finalizar(conteudoFinal: string) {
    if (!rascunho.value) return
    await api.post(`/api/documents/rascunhos/${rascunho.value.id}/finalizar`, { conteudo_final: conteudoFinal })
    if (rascunho.value) {
      rascunho.value.status = 'finalizado'
      etapa.value = 'finalizado'
    }
  }

  async function carregarRascunhoAtivo(alunoId: string) {
    try {
      const { data } = await api.get<{ rascunho: Rascunho | null }>(
        `/api/documents/rascunhos`,
        { params: { aluno_id: alunoId, tipo: 'relatorio_individual' } },
      )
      if (data.rascunho) {
        rascunho.value = data.rascunho
        etapa.value = data.rascunho.status === 'finalizado' ? 'finalizado' : 'revisao'
      }
    } catch {
      /* no active draft */
    }
  }

  return {
    form, rascunho, etapa, estaGerando, erroGeracao,
    conteudoEditado, formularioValido, podeFinalizar,
    gerarRelatorio, autoSalvar, finalizar, carregarRascunhoAtivo,
  }
})
