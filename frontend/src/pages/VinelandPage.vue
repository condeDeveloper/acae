<template>
  <div class="page-container">
    <div class="vineland-layout">
      <!-- ── Coluna Esquerda: Filtros + Lista ── -->
      <div class="lista-panel">
        <div class="filtros-card">
          <div class="filtros-header">
            <h3 class="filtros-titulo"><i class="pi pi-filter" /> Filtros</h3>
            <Button
              v-if="!mostrarFormulario"
              label="Nova Avaliação"
              icon="pi pi-plus"
              size="small"
              @click="abrirNova"
            />
            <Button
              v-if="mostrarFormulario"
              label="Cancelar"
              icon="pi pi-times"
              severity="secondary"
              outlined
              size="small"
              @click="fecharFormulario"
            />
          </div>

          <div class="field">
            <label>Turma</label>
            <Select
              v-model="filtraTurma"
              :options="turmas"
              optionLabel="nome"
              optionValue="id"
              placeholder="Todas as turmas"
              showClear
              class="w-full"
              :optionDisabled="(t: { id: string }) => !turmasComAvaliacoes.has(t.id)"
              @change="onFiltraTurmaChange"
            >
              <template #option="{ option }">
                <span>{{ option.nome }}</span>
                <span v-if="!turmasComAvaliacoes.has(option.id)" style="color: var(--acae-red); font-size: 0.8em; margin-left: 4px">— Avalie um aluno</span>
              </template>
            </Select>
          </div>

          <div class="field">
            <label>Aluno</label>
            <Select
              v-model="filtraAluno"
              :options="alunosFiltrados"
              optionLabel="nome"
              optionValue="id"
              placeholder="Todos os alunos"
              showClear
              :disabled="!filtraTurma"
              class="w-full"
              @change="carregarAvaliacoes"
            >
              <template #option="{ option }">
                <span>{{ option.nome }}</span>
                <span v-if="!alunosComAvaliacoes.has(option.id)" style="color: var(--acae-red); font-size: 0.8em; margin-left: 4px">— avalie um aluno</span>
              </template>
            </Select>
          </div>
        </div>

        <!-- Lista de avaliações -->
        <div v-if="loadingLista" class="loading-card">
          <i class="pi pi-spin pi-spinner" />
          <span>Carregando...</span>
        </div>

        <div v-else-if="avaliacoes.length === 0" class="empty-card">
          <i class="pi pi-chart-bar" />
          <p>Nenhuma avaliação encontrada.<br/>Clique em "Nova Avaliação" para começar.</p>
        </div>

        <div v-else class="avaliacoes-lista">
          <div
            v-for="av in avaliacoes"
            :key="av.id"
            class="avaliacao-card"
            :class="{ 'avaliacao-card--ativa': avaliacaoSelecionada?.id === av.id }"
            @click="selecionarAvaliacao(av)"
          >
            <div class="av-header">
              <span class="av-nome">{{ av.aluno.nome }}</span>
              <span class="av-data">{{ formatDate(av.data_teste) }}</span>
            </div>
            <div class="av-turma">{{ av.aluno.turma.nome }}</div>
            <div class="av-scores">
              <span class="score-chip score-com">COM {{ av.com_padrao }}</span>
              <span class="score-chip score-avd">AVD {{ av.avd_padrao }}</span>
              <span class="score-chip score-soc">SOC {{ av.soc_padrao }}</span>
              <span class="score-chip score-cca">CCA {{ av.cca_composto }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Coluna Direita: Formulário ou Detalhe ── -->
      <div class="conteudo-panel">

        <!-- FORMULÁRIO nova/edição -->
        <div v-if="mostrarFormulario" class="form-card">
          <h3 class="form-titulo">
            <i class="pi pi-pencil" />
            {{ editandoId ? 'Editar Avaliação' : 'Nova Avaliação Vineland-3' }}
          </h3>

          <!-- Aluno -->
          <div class="form-section">
            <h4>Identificação</h4>
            <div class="form-row">
              <div class="field">
                <label>Turma <span class="required">*</span></label>
                <Select
                  v-model="form.turma_id"
                  :options="turmas"
                  optionLabel="nome"
                  optionValue="id"
                  placeholder="Ex: AEE - Manhã"
                  class="w-full"
                  @change="onFormTurmaChange"
                />
                <small class="field-hint">Exemplo: AEE - Manhã</small>
              </div>
              <div class="field">
                <label>Aluno <span class="required">*</span></label>
                <Select
                  v-model="form.aluno_id"
                  :options="alunosForm"
                  optionLabel="nome"
                  optionValue="id"
                  placeholder="Ex: Iris Bueno Ozório"
                  :disabled="!form.turma_id"
                  :loading="loadingAlunosForm"
                  class="w-full"
                />
                <small class="field-hint">Exemplo: Iris Bueno Ozório</small>
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Avaliador(a) <span class="required">*</span></label>
                <InputText v-model="form.avaliador" placeholder="Ex: Ana Lucia M. Magalhães Cavalcante" class="w-full" />
                <small class="field-hint">Exemplo: Ana Lucia M. Magalhães Cavalcante</small>
              </div>
              <div class="field">
                <label>Data do Teste <span class="required">*</span></label>
                <DatePicker
                  v-model="form.data_teste"
                  dateFormat="dd/mm/yy"
                  :maxDate="hoje"
                  showIcon
                  fluid
                  placeholder="Ex: 09/03/2026"
                />
                <small class="field-hint">Exemplo: 09/03/2026</small>
              </div>
            </div>
          </div>

          <!-- COM -->
          <div class="form-section">
            <h4><span class="dom-badge dom-com">COM</span> Comunicação</h4>
            <div class="form-row form-row--4">
              <div class="field">
                <label>Pont. Bruta</label>
                <InputNumber v-model="form.com_bruta" :min="0" :max="999" placeholder="Ex: 38" class="w-full" />
                <small class="field-hint">Exemplo: 38</small>
              </div>
              <div class="field">
                <label>Pont. Padrão (CCA)</label>
                <InputNumber v-model="form.com_padrao" :min="20" :max="160" placeholder="Ex: 56" class="w-full" @update:modelValue="recalcularSoma" />
                <small class="field-hint">Exemplo: 56</small>
              </div>
              <div class="field">
                <label>Nível Adaptativo</label>
                <Select
                  v-model="form.com_nivel"
                  :options="niveisAdaptativos"
                  placeholder="Ex: Baixo"
                  class="w-full"
                />
                <small class="field-hint">Exemplo: Baixo</small>
              </div>
              <div class="field">
                <label>Intervalo Confiança</label>
                <InputText v-model="form.com_ic" placeholder="ex: 51-61" class="w-full" />
                <small class="field-hint">Exemplo: 51-61</small>
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Percentil</label>
                <InputText v-model="form.com_percentil" placeholder="ex: &lt;1" class="w-full" />
                <small class="field-hint">Exemplo: &lt;1</small>
              </div>
            </div>
          </div>

          <!-- AVD -->
          <div class="form-section">
            <h4><span class="dom-badge dom-avd">AVD</span> Atividades de Vida Diária</h4>
            <div class="form-row form-row--4">
              <div class="field">
                <label>Pont. Bruta</label>
                <InputNumber v-model="form.avd_bruta" :min="0" :max="999" placeholder="Ex: 36" class="w-full" />
                <small class="field-hint">Exemplo: 36</small>
              </div>
              <div class="field">
                <label>Pont. Padrão (CCA)</label>
                <InputNumber v-model="form.avd_padrao" :min="20" :max="160" placeholder="Ex: 46" class="w-full" @update:modelValue="recalcularSoma" />
                <small class="field-hint">Exemplo: 46</small>
              </div>
              <div class="field">
                <label>Nível Adaptativo</label>
                <Select
                  v-model="form.avd_nivel"
                  :options="niveisAdaptativos"
                  placeholder="Ex: Baixo"
                  class="w-full"
                />
                <small class="field-hint">Exemplo: Baixo</small>
              </div>
              <div class="field">
                <label>Intervalo Confiança</label>
                <InputText v-model="form.avd_ic" placeholder="ex: 40-52" class="w-full" />
                <small class="field-hint">Exemplo: 40-52</small>
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Percentil</label>
                <InputText v-model="form.avd_percentil" placeholder="ex: &lt;1" class="w-full" />
                <small class="field-hint">Exemplo: &lt;1</small>
              </div>
            </div>
          </div>

          <!-- SOC -->
          <div class="form-section">
            <h4><span class="dom-badge dom-soc">SOC</span> Socialização</h4>
            <div class="form-row form-row--4">
              <div class="field">
                <label>Pont. Bruta</label>
                <InputNumber v-model="form.soc_bruta" :min="0" :max="999" placeholder="Ex: 64" class="w-full" />
                <small class="field-hint">Exemplo: 64</small>
              </div>
              <div class="field">
                <label>Pont. Padrão (CCA)</label>
                <InputNumber v-model="form.soc_padrao" :min="20" :max="160" placeholder="Ex: 112" class="w-full" @update:modelValue="recalcularSoma" />
                <small class="field-hint">Exemplo: 112</small>
              </div>
              <div class="field">
                <label>Nível Adaptativo</label>
                <Select
                  v-model="form.soc_nivel"
                  :options="niveisAdaptativos"
                  placeholder="Ex: (opcional)"
                  class="w-full"
                />
                <small class="field-hint">Exemplo: deixar vazio quando não houver</small>
              </div>
              <div class="field">
                <label>Intervalo Confiança</label>
                <InputText v-model="form.soc_ic" placeholder="ex: 59-69" class="w-full" />
                <small class="field-hint">Exemplo: 59-69</small>
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Percentil</label>
                <InputText v-model="form.soc_percentil" placeholder="ex: 75" class="w-full" />
                <small class="field-hint">Exemplo: 75</small>
              </div>
            </div>
          </div>

          <!-- CCA Composto -->
          <div class="form-section form-section--cca">
            <div class="cca-header">
              <h4>Composto de Comportamento Adaptativo</h4>
              <Button
                label="Baixar Manual"
                icon="pi pi-download"
                severity="contrast"
                size="small"
                @click="baixarManualVineland"
              />
            </div>
            <div class="form-row form-row--4">
              <div class="field">
                <label>Soma das Pontuações Padrão</label>
                <InputNumber v-model="form.soma_padroes" :min="0" :max="480" class="w-full" disabled />
                <small class="field-hint">Exemplo automático: 214 (56 + 46 + 112)</small>
              </div>
              <div class="field">
                <label>CCA Composto <span class="required">*</span></label>
                <InputNumber v-model="form.cca_composto" :min="20" :max="160" placeholder="Ex: 70" class="w-full" />
                <small class="field-hint">Exemplo: 70 (obtido no manual)</small>
              </div>
              <div class="field">
                <label>Intervalo Confiança</label>
                <InputText v-model="form.cca_ic" placeholder="ex: 66-74" class="w-full" />
                <small class="field-hint">Exemplo: 66-74</small>
              </div>
              <div class="field">
                <label>Percentil</label>
                <InputText v-model="form.cca_percentil" placeholder="ex: 2" class="w-full" />
                <small class="field-hint">Exemplo: 2</small>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <Button
              label="Cancelar"
              severity="secondary"
              outlined
              @click="fecharFormulario"
            />
            <Button
              :label="editandoId ? 'Salvar Alterações' : 'Salvar Avaliação'"
              icon="pi pi-save"
              :loading="salvando"
              @click="salvar"
            />
          </div>
        </div>

        <!-- DETALHE da avaliação selecionada -->
        <div v-else-if="avaliacaoSelecionada && !mostrarFormulario" class="detalhe-card">
          <div class="detalhe-header">
            <div>
              <h3>{{ avaliacaoSelecionada.aluno.nome }}</h3>
              <p class="detalhe-subinfo">
                {{ avaliacaoSelecionada.aluno.turma.nome }}
                &nbsp;•&nbsp; Avaliado em {{ formatDate(avaliacaoSelecionada.data_teste) }}
                &nbsp;•&nbsp; por {{ avaliacaoSelecionada.avaliador }}
              </p>
            </div>
            <div class="detalhe-acoes">
              <Button
                label="Editar"
                icon="pi pi-pencil"
                severity="secondary"
                outlined
                size="small"
                @click="editarAvaliacao(avaliacaoSelecionada)"
              />
              <Button
                label="Gerar PDF"
                icon="pi pi-file-pdf"
                severity="danger"
                size="small"
                :loading="gerandoPdf"
                @click="gerarPdf(avaliacaoSelecionada.id)"
              />
              <Button
                icon="pi pi-trash"
                severity="danger"
                outlined
                size="small"
                @click="confirmarExcluir(avaliacaoSelecionada.id)"
              />
            </div>
          </div>

          <!-- Tabela de Pontuações -->
          <table class="tabela-pontuacoes">
            <thead>
              <tr>
                <th>Domínio</th>
                <th>Pont. Bruta</th>
                <th>Pont. Padrão</th>
                <th>Nível Adaptativo</th>
                <th>IC (90%)</th>
                <th>Percentil</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="dom-badge dom-com">COM</span> Comunicação</td>
                <td>{{ avaliacaoSelecionada.com_bruta }}</td>
                <td><strong>{{ avaliacaoSelecionada.com_padrao }}</strong></td>
                <td><span :class="['nivel-badge', nivelClass(avaliacaoSelecionada.com_nivel)]">{{ avaliacaoSelecionada.com_nivel }}</span></td>
                <td>{{ avaliacaoSelecionada.com_ic ?? '—' }}</td>
                <td>{{ avaliacaoSelecionada.com_percentil ?? '—' }}</td>
              </tr>
              <tr>
                <td><span class="dom-badge dom-avd">AVD</span> Vida Diária</td>
                <td>{{ avaliacaoSelecionada.avd_bruta }}</td>
                <td><strong>{{ avaliacaoSelecionada.avd_padrao }}</strong></td>
                <td><span :class="['nivel-badge', nivelClass(avaliacaoSelecionada.avd_nivel)]">{{ avaliacaoSelecionada.avd_nivel }}</span></td>
                <td>{{ avaliacaoSelecionada.avd_ic ?? '—' }}</td>
                <td>{{ avaliacaoSelecionada.avd_percentil ?? '—' }}</td>
              </tr>
              <tr>
                <td><span class="dom-badge dom-soc">SOC</span> Socialização</td>
                <td>{{ avaliacaoSelecionada.soc_bruta }}</td>
                <td><strong>{{ avaliacaoSelecionada.soc_padrao }}</strong></td>
                <td><span :class="['nivel-badge', nivelClass(avaliacaoSelecionada.soc_nivel ?? '')]">{{ avaliacaoSelecionada.soc_nivel ?? '—' }}</span></td>
                <td>{{ avaliacaoSelecionada.soc_ic ?? '—' }}</td>
                <td>{{ avaliacaoSelecionada.soc_percentil ?? '—' }}</td>
              </tr>
              <tr class="total-row">
                <td colspan="2"><strong>Soma das Pontuações Padrão</strong></td>
                <td><strong>{{ avaliacaoSelecionada.soma_padroes }}</strong></td>
                <td colspan="3"></td>
              </tr>
              <tr class="cca-row">
                <td colspan="2"><strong>Composto de Comportamento Adaptativo (CCA)</strong></td>
                <td><strong>{{ avaliacaoSelecionada.cca_composto }}</strong></td>
                <td></td>
                <td>{{ avaliacaoSelecionada.cca_ic ?? '—' }}</td>
                <td>{{ avaliacaoSelecionada.cca_percentil ?? '—' }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Mini gráfico de barras -->
          <div class="grafico-section">
            <h4>Desempenho por Domínio</h4>
            <div class="grafico-barras">
              <div v-for="dom in dominiosGrafico" :key="dom.label" class="barra-grupo">
                <div class="barra-label">{{ dom.label }}</div>
                <div class="barra-wrap">
                  <div
                    class="barra barra-bruta"
                    :style="{ width: barWidth(dom.bruta) + '%' }"
                    :title="`Bruta: ${dom.bruta}`"
                  ></div>
                  <span class="barra-val">{{ dom.bruta }}</span>
                </div>
                <div class="barra-wrap">
                  <div
                    class="barra barra-padrao"
                    :style="{ width: barWidth(dom.padrao) + '%' }"
                    :title="`Padrão: ${dom.padrao}`"
                  ></div>
                  <span class="barra-val">{{ dom.padrao }}</span>
                </div>
              </div>
            </div>
            <div class="grafico-legenda">
              <span><span class="leg-dot leg-bruta"></span> Pont. Bruta</span>
              <span><span class="leg-dot leg-padrao"></span> Pont. Padrão</span>
            </div>
          </div>
        </div>

        <!-- Vazio -->
        <div v-else class="empty-detalhe">
          <i class="pi pi-chart-bar" />
          <p>Selecione uma avaliação ao lado ou clique em<br/><strong>"Nova Avaliação"</strong> para registrar.</p>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { usePageLayout } from '@/composables/usePageLayout'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import Button from 'primevue/button'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import DatePicker from 'primevue/datepicker'

// ── Layout ──
const pageLayout = usePageLayout()
pageLayout.title.value = 'Vineland-3'
pageLayout.subtitle.value = 'Escala de Comportamento Adaptativo'

const toast = useToast()
const confirm = useConfirm()
const authStore = useAuthStore()

// ── State ──
const turmas = ref<{ id: string; nome: string }[]>([])
const alunosFiltrados = ref<{ id: string; nome: string }[]>([])
const alunosForm = ref<{ id: string; nome: string }[]>([])
const avaliacoes = ref<AvaliacaoVineland[]>([])
const todasAvaliacoes = ref<AvaliacaoVineland[]>([])

const turmasComAvaliacoes = computed(() => new Set(todasAvaliacoes.value.map(av => av.aluno.turma.id)))
const alunosComAvaliacoes = computed(() => new Set(todasAvaliacoes.value.map(av => av.aluno.id)))
const avaliacaoSelecionada = ref<AvaliacaoVineland | null>(null)
const mostrarFormulario = ref(false)
const editandoId = ref<string | null>(null)
const loadingLista = ref(false)
const loadingAlunosForm = ref(false)
const salvando = ref(false)
const gerandoPdf = ref(false)
const filtraTurma = ref<string | null>(null)
const filtraAluno = ref<string | null>(null)
const hoje = new Date()

const niveisAdaptativos = ['Baixo', 'Moderado', 'Adequado', 'Médio Alto', 'Alto', 'Elevado']
const manualVinelandUrl = '/manuais/vineland-3-manual.pdf'

interface AvaliacaoVineland {
  id: string
  avaliador: string
  data_teste: string
  com_bruta: number; com_padrao: number; com_nivel: string; com_ic: string | null; com_percentil: string | null
  avd_bruta: number; avd_padrao: number; avd_nivel: string; avd_ic: string | null; avd_percentil: string | null
  soc_bruta: number; soc_padrao: number; soc_nivel: string | null; soc_ic: string | null; soc_percentil: string | null
  soma_padroes: number; cca_composto: number; cca_ic: string | null; cca_percentil: string | null
  aluno: { id: string; nome: string; data_nascimento: string | null; turma: { id: string; nome: string } }
}

const formVazio = () => ({
  turma_id: '' as string,
  aluno_id: '' as string,
  avaliador: authStore.professor?.nome ?? '',
  data_teste: new Date() as Date,
  com_bruta: null as number | null,
  com_padrao: null as number | null,
  com_nivel: '' as string,
  com_ic: '' as string,
  com_percentil: '' as string,
  avd_bruta: null as number | null,
  avd_padrao: null as number | null,
  avd_nivel: '' as string,
  avd_ic: '' as string,
  avd_percentil: '' as string,
  soc_bruta: null as number | null,
  soc_padrao: null as number | null,
  soc_nivel: '' as string,
  soc_ic: '' as string,
  soc_percentil: '' as string,
  soma_padroes: null as number | null,
  cca_composto: null as number | null,
  cca_ic: '' as string,
  cca_percentil: '' as string,
})

const form = ref(formVazio())

// ── Computed ──
const dominiosGrafico = computed(() => {
  if (!avaliacaoSelecionada.value) return []
  const av = avaliacaoSelecionada.value
  return [
    { label: 'COM', bruta: av.com_bruta, padrao: av.com_padrao },
    { label: 'AVD', bruta: av.avd_bruta, padrao: av.avd_padrao },
    { label: 'SOC', bruta: av.soc_bruta, padrao: av.soc_padrao },
  ]
})

function barWidth(val: number): number {
  if (!avaliacaoSelecionada.value) return 0
  const av = avaliacaoSelecionada.value
  const max = Math.max(av.com_bruta, av.com_padrao, av.avd_bruta, av.avd_padrao, av.soc_bruta, av.soc_padrao, 1)
  return Math.round((val / max) * 100)
}

// ── Helpers ──
function formatDate(d: string | Date): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

function nivelClass(nivel: string): string {
  const n = nivel.toLowerCase()
  if (n.includes('baixo')) return 'nivel-baixo'
  if (n.includes('moderado') || n === 'médio') return 'nivel-medio'
  if (n.includes('adequado') || n.includes('médio alto')) return 'nivel-adequado'
  if (n.includes('alto') || n.includes('elevado') || n.includes('superior')) return 'nivel-alto'
  return ''
}

function recalcularSoma() {
  const c = form.value.com_padrao ?? 0
  const a = form.value.avd_padrao ?? 0
  const s = form.value.soc_padrao ?? 0
  form.value.soma_padroes = c + a + s
}

function baixarManualVineland() {
  const a = document.createElement('a')
  a.href = manualVinelandUrl
  a.download = 'vineland-3-manual.pdf'
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ── Data loading ──
async function carregarTurmas() {
  const res = await api.get('/api/turmas')
  turmas.value = res.data.data ?? []
}

async function carregarAlunos(turmaId: string, target: 'filtro' | 'form') {
  if (target === 'form') loadingAlunosForm.value = true
  const res = await api.get('/api/alunos', { params: { turma_id: turmaId } })
  const lista = res.data.data ?? []
  if (target === 'filtro') alunosFiltrados.value = lista
  else alunosForm.value = lista
  if (target === 'form') loadingAlunosForm.value = false
}

async function carregarAvaliacoes() {
  loadingLista.value = true
  try {
    const params: Record<string, string> = {}
    if (filtraTurma.value) params.turma_id = filtraTurma.value
    if (filtraAluno.value) params.aluno_id = filtraAluno.value
    const res = await api.get('/api/vineland', { params })
    avaliacoes.value = res.data.data ?? []
    if (avaliacaoSelecionada.value) {
      avaliacaoSelecionada.value = avaliacoes.value.find(a => a.id === avaliacaoSelecionada.value!.id) ?? null
    }
  } finally {
    loadingLista.value = false
  }
}

// ── Handlers ──
function onFiltraTurmaChange() {
  filtraAluno.value = null
  alunosFiltrados.value = []
  if (filtraTurma.value) carregarAlunos(filtraTurma.value, 'filtro')
  carregarAvaliacoes()
}

async function onFormTurmaChange() {
  form.value.aluno_id = ''
  alunosForm.value = []
  if (form.value.turma_id) await carregarAlunos(form.value.turma_id, 'form')
}

function selecionarAvaliacao(av: AvaliacaoVineland) {
  avaliacaoSelecionada.value = av
  mostrarFormulario.value = false
  editandoId.value = null
}

function abrirNova() {
  editandoId.value = null
  form.value = formVazio()
  mostrarFormulario.value = true
  avaliacaoSelecionada.value = null
}

function fecharFormulario() {
  mostrarFormulario.value = false
  editandoId.value = null
}

function editarAvaliacao(av: AvaliacaoVineland) {
  editandoId.value = av.id
  form.value = {
    turma_id: av.aluno.turma.id,
    aluno_id: av.aluno.id,
    avaliador: av.avaliador,
    data_teste: new Date(av.data_teste + 'T00:00:00'),
    com_bruta: av.com_bruta,
    com_padrao: av.com_padrao,
    com_nivel: av.com_nivel,
    com_ic: av.com_ic ?? '',
    com_percentil: av.com_percentil ?? '',
    avd_bruta: av.avd_bruta,
    avd_padrao: av.avd_padrao,
    avd_nivel: av.avd_nivel,
    avd_ic: av.avd_ic ?? '',
    avd_percentil: av.avd_percentil ?? '',
    soc_bruta: av.soc_bruta,
    soc_padrao: av.soc_padrao,
    soc_nivel: av.soc_nivel ?? '',
    soc_ic: av.soc_ic ?? '',
    soc_percentil: av.soc_percentil ?? '',
    soma_padroes: av.soma_padroes,
    cca_composto: av.cca_composto,
    cca_ic: av.cca_ic ?? '',
    cca_percentil: av.cca_percentil ?? '',
  }
  carregarAlunos(av.aluno.turma.id, 'form')
  mostrarFormulario.value = true
}

async function salvar() {
  if (!form.value.aluno_id || !form.value.avaliador || !form.value.data_teste) {
    toast.add({ severity: 'warn', summary: 'Campos obrigatórios', detail: 'Preencha turma, aluno, avaliador e data.', life: 4000 })
    return
  }
  if (form.value.com_bruta === null || form.value.com_padrao === null ||
      form.value.avd_bruta === null || form.value.avd_padrao === null ||
      form.value.soc_bruta === null || form.value.soc_padrao === null ||
      form.value.cca_composto === null) {
    toast.add({ severity: 'warn', summary: 'Pontuações', detail: 'Preencha as pontuações de todos os domínios e o CCA composto.', life: 4000 })
    return
  }

  salvando.value = true
  try {
    const dataStr = form.value.data_teste instanceof Date
      ? form.value.data_teste.toISOString().slice(0, 10)
      : String(form.value.data_teste).slice(0, 10)

    const payload = {
      aluno_id: form.value.aluno_id,
      avaliador: form.value.avaliador,
      data_teste: dataStr,
      com_bruta: form.value.com_bruta,
      com_padrao: form.value.com_padrao,
      com_nivel: form.value.com_nivel || 'Baixo',
      com_ic: form.value.com_ic || null,
      com_percentil: form.value.com_percentil || null,
      avd_bruta: form.value.avd_bruta,
      avd_padrao: form.value.avd_padrao,
      avd_nivel: form.value.avd_nivel || 'Baixo',
      avd_ic: form.value.avd_ic || null,
      avd_percentil: form.value.avd_percentil || null,
      soc_bruta: form.value.soc_bruta,
      soc_padrao: form.value.soc_padrao,
      soc_nivel: form.value.soc_nivel || null,
      soc_ic: form.value.soc_ic || null,
      soc_percentil: form.value.soc_percentil || null,
      soma_padroes: form.value.soma_padroes ?? ((form.value.com_padrao ?? 0) + (form.value.avd_padrao ?? 0) + (form.value.soc_padrao ?? 0)),
      cca_composto: form.value.cca_composto,
      cca_ic: form.value.cca_ic || null,
      cca_percentil: form.value.cca_percentil || null,
    }

    if (editandoId.value) {
      await api.patch(`/api/vineland/${editandoId.value}`, payload)
      toast.add({ severity: 'success', summary: 'Salvo', detail: 'Avaliação atualizada.', life: 3000 })
    } else {
      await api.post('/api/vineland', payload)
      toast.add({ severity: 'success', summary: 'Salvo', detail: 'Avaliação registrada com sucesso.', life: 3000 })
    }

    await carregarAvaliacoes()
    fecharFormulario()
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao salvar'
    toast.add({ severity: 'error', summary: 'Erro', detail: msg, life: 5000 })
  } finally {
    salvando.value = false
  }
}

async function gerarPdf(id: string) {
  gerandoPdf.value = true
  try {
    const res = await api.get(`/api/vineland/${id}/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `vineland_${id}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível gerar o PDF.', life: 4000 })
  } finally {
    gerandoPdf.value = false
  }
}

function confirmarExcluir(id: string) {
  confirm.require({
    message: 'Deseja excluir esta avaliação? Esta ação não pode ser desfeita.',
    header: 'Confirmar Exclusão',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Excluir',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await api.delete(`/api/vineland/${id}`)
        toast.add({ severity: 'success', summary: 'Removido', detail: 'Avaliação excluída.', life: 3000 })
        if (avaliacaoSelecionada.value?.id === id) avaliacaoSelecionada.value = null
        await carregarAvaliacoes()
      } catch {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível excluir.', life: 4000 })
      }
    },
  })
}

// ── Init ──
onMounted(async () => {
  await carregarTurmas()
  await carregarAvaliacoes()
  todasAvaliacoes.value = [...avaliacoes.value]
})
</script>

<style scoped>
.page-container { padding: 0; display: flex; flex-direction: column; gap: 0.75rem; }

.vineland-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.5rem;
  align-items: start;
}

/* ── Filtros + Lista ── */
.filtros-card, .form-card, .detalhe-card, .empty-detalhe {
  background: var(--bg-surface);
  border: 1px solid var(--border-1);
  border-radius: 10px;
  padding: 1.25rem;
}
.filtros-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.filtros-header .filtros-titulo { margin-bottom: 0; }
.filtros-titulo, .form-titulo {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.field { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 0.75rem; }
.field label { font-size: 0.8rem; font-weight: 600; color: var(--text-2); }
.field-hint { font-size: 0.72rem; color: var(--text-3); }
.required { color: var(--acae-primary); }
.w-full { width: 100%; }

.loading-card, .empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 0.75rem;
  color: var(--text-3);
  text-align: center;
  background: var(--bg-surface);
  border: 1px solid var(--border-1);
  border-radius: 10px;
  margin-top: 0.75rem;
}
.loading-card i, .empty-card i { font-size: 2rem; }

.avaliacoes-lista { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.75rem; }

.avaliacao-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-1);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.avaliacao-card:hover { border-color: var(--acae-primary); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.avaliacao-card--ativa { border-color: var(--acae-primary); background: var(--bg-hover, #f0f4ff); }

.av-header { display: flex; justify-content: space-between; align-items: baseline; }
.av-nome { font-weight: 700; font-size: 0.9rem; color: var(--text-1); }
.av-data { font-size: 0.78rem; color: var(--text-3); }
.av-turma { font-size: 0.78rem; color: var(--text-2); margin: 0.2rem 0 0.5rem; }
.av-scores { display: flex; gap: 0.35rem; flex-wrap: wrap; }

.score-chip {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 20px;
}
.score-com { background: #dbeafe; color: #1e40af; }
.score-avd { background: #dcfce7; color: #166534; }
.score-soc { background: #fef9c3; color: #92400e; }
.score-cca { background: #f3e8ff; color: #6b21a8; }

/* ── Formulário ── */
.form-section {
  border-top: 1px solid var(--border-1);
  padding-top: 1rem;
  margin-top: 1rem;
}
.form-section h4 {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-1);
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.cca-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}
.cca-header h4 {
  margin-bottom: 0;
}
.form-section--cca { background: var(--bg-hover, #f8faff); border-radius: 8px; padding: 1rem; margin-top: 0.5rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.form-row--4 { grid-template-columns: repeat(4, 1fr); }
.form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem; border-top: 1px solid var(--border-1); padding-top: 1rem; }

/* ── Dom badges ── */
.dom-badge {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 4px;
  letter-spacing: 0.02em;
}
.dom-com { background: #dbeafe; color: #1e40af; }
.dom-avd { background: #dcfce7; color: #166534; }
.dom-soc { background: #fef9c3; color: #92400e; }

/* ── Detalhe ── */
.detalhe-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
  gap: 1rem;
}
.detalhe-header h3 { font-size: 1.1rem; font-weight: 700; color: var(--text-1); margin: 0; }
.detalhe-subinfo { font-size: 0.8rem; color: var(--text-2); margin-top: 0.25rem; }
.detalhe-acoes { display: flex; gap: 0.5rem; flex-shrink: 0; }

.tabela-pontuacoes {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
  margin-bottom: 1.5rem;
}
.tabela-pontuacoes thead tr { background: var(--acae-primary); color: #fff; }
.tabela-pontuacoes thead th { padding: 8px 12px; text-align: left; font-weight: 600; font-size: 0.8rem; }
.tabela-pontuacoes tbody tr:nth-child(even) { background: var(--bg-hover, #f8faff); }
.tabela-pontuacoes tbody td { padding: 7px 12px; border-bottom: 1px solid var(--border-1); }
.total-row { background: #e8edf5 !important; }
.cca-row { background: var(--acae-primary) !important; color: #fff !important; }
.cca-row td { color: #fff; }

/* ── Nível badges ── */
.nivel-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
}
.nivel-baixo { background: #fee2e2; color: #b91c1c; }
.nivel-medio { background: #fef9c3; color: #92400e; }
.nivel-adequado { background: #dcfce7; color: #166534; }
.nivel-alto { background: #dbeafe; color: #1e40af; }

/* ── Gráfico ── */
.grafico-section h4 { font-size: 0.85rem; font-weight: 700; color: var(--text-1); margin-bottom: 0.75rem; }
.grafico-barras { display: flex; flex-direction: column; gap: 0.75rem; }
.barra-grupo { display: grid; grid-template-columns: 60px 1fr; grid-template-rows: auto auto; align-items: center; gap: 0.2rem 0.75rem; }
.barra-label { font-size: 0.78rem; font-weight: 700; color: var(--text-2); grid-row: span 2; }
.barra-wrap { display: flex; align-items: center; gap: 0.5rem; }
.barra { height: 14px; border-radius: 3px; transition: width 0.3s; min-width: 2px; }
.barra-bruta { background: #5b85c8; }
.barra-padrao { background: #e07b39; }
.barra-val { font-size: 0.75rem; font-weight: 700; color: var(--text-2); min-width: 24px; }

.grafico-legenda { display: flex; gap: 1.5rem; margin-top: 0.75rem; font-size: 0.78rem; color: var(--text-2); }
.leg-dot { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 4px; vertical-align: middle; }
.leg-bruta { background: #5b85c8; }
.leg-padrao { background: #e07b39; }

.empty-detalhe {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 1rem;
  color: var(--text-3);
  text-align: center;
}
.empty-detalhe i { font-size: 3rem; }

.header-actions { display: flex; gap: 0.5rem; }

/* Responsive: stack on mobile */
@media (max-width: 900px) {
  .vineland-layout { grid-template-columns: 1fr; }
  .form-row--4 { grid-template-columns: 1fr 1fr; }
}
</style>
