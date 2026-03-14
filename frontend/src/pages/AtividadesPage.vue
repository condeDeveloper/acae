<template>
  <div class="page-container">
    <div class="atividades-layout">
      <!-- ── Painel de Filtros ── -->
      <div class="filtros-card">
        <h3 class="filtros-titulo"><i class="pi pi-sliders-h" /> Configurar Geração</h3>

        <div class="field">
          <label>Turma</label>
          <Select
            v-model="turma_id"
            :options="turmas"
            optionLabel="nome"
            optionValue="id"
            placeholder="Selecione a turma"
            class="w-full"
            @change="onTurmaChange"
          />
        </div>

        <div class="field">
          <label>Aluno</label>
          <Select
            v-model="aluno_id"
            :options="alunos"
            optionLabel="nome"
            optionValue="id"
            placeholder="Selecione o aluno"
            :loading="loadingAlunos"
            :disabled="!turma_id"
            class="w-full"
          />
        </div>

        <div class="field">
          <label>Número de Atividades</label>
          <div class="quantidade-selector">
            <button
              v-for="n in [1, 2, 3, 5, 8, 10]"
              :key="n"
              :class="['qtd-btn', quantidade === n ? 'qtd-btn--active' : '']"
              @click="quantidade = n"
            >{{ n }}</button>
          </div>
          <small class="text-muted">Ou digite: <InputNumber v-model="quantidade" :min="1" :max="20" :inputStyle="{ width: '60px' }" /></small>
        </div>

        <div class="field">
          <label>Área de Conhecimento <span class="badge-opt">opcional</span></label>
          <Select
            v-model="filtro.area"
            :options="areasOpcoes"
            optionLabel="label"
            optionValue="value"
            placeholder="Todas as áreas"
            showClear
            class="w-full"
          />
        </div>

        <div class="field">
          <label>Nível Educacional <span class="badge-opt">opcional</span></label>
          <Select
            v-model="filtro.nivel"
            :options="niveisOpcoes"
            optionLabel="label"
            optionValue="value"
            placeholder="Todos os níveis"
            showClear
            class="w-full"
          />
        </div>

        <div class="field">
          <label>Dificuldade <span class="badge-opt">opcional</span></label>
          <div class="dificuldade-selector">
            <button
              v-for="d in dificuldades"
              :key="d.value"
              :class="['dif-btn', `dif-btn--${d.value}`, filtro.dificuldade === d.value ? 'dif-btn--active' : '']"
              @click="filtro.dificuldade = filtro.dificuldade === d.value ? undefined : d.value"
            >{{ d.label }}</button>
          </div>
        </div>

        <Button
          label="Sortear Atividades"
          icon="pi pi-refresh"
          class="w-full gerar-btn"
          :loading="loadingGerar"
          :disabled="!aluno_id"
          @click="gerarAtividades"
        />

        <div v-if="aluno_id && !loadingGerar && atividadesGeradas.length > 0" class="acoes-listagem">
          <Button
            label="Novo Sorteio"
            icon="pi pi-sync"
            class="w-full novo-sorteio-btn"
            size="small"
            @click="gerarAtividades"
          />
        </div>
      </div>

      <!-- ── Área de Resultado ── -->
      <div class="resultado-area">

        <!-- Estado inicial -->
        <div v-if="!loadingGerar && atividadesGeradas.length === 0 && !erroGerar" class="estado-vazio">
          <i class="pi pi-book estado-icone" />
          <p class="estado-texto">Selecione um aluno e clique em <strong>Sortear Atividades</strong></p>
          <p class="estado-sub">As atividades são geradas instantaneamente do banco BNCC, sem custo de IA</p>
        </div>

        <!-- Erro -->
        <div v-if="erroGerar" class="estado-erro">
          <i class="pi pi-exclamation-triangle" />
          <span>{{ erroGerar }}</span>
        </div>

        <!-- Loading -->
        <div v-if="loadingGerar" class="estado-loading">
          <i class="pi pi-spin pi-spinner" style="font-size: 2.5rem; color: var(--acae-primary)" />
          <p>Sorteando atividades...</p>
        </div>

        <!-- Cabeçalho do resultado -->
        <div v-if="!loadingGerar && atividadesGeradas.length > 0" class="resultado-header">
          <div class="resultado-info">
            <span class="aluno-tag">
              <img v-if="getAvatarSrc(alunoAvatarId)" :src="getAvatarSrc(alunoAvatarId)!" class="aluno-tag-img" alt="avatar" />
              <AvatarInitials v-else :nome="alunoNome" :seed="alunoId || alunoNome" :size="26" />
              {{ alunoNome }}
            </span>
            <span class="count-tag">{{ atividadesGeradas.length }} atividade{{ atividadesGeradas.length !== 1 ? 's' : '' }} sorteada{{ atividadesGeradas.length !== 1 ? 's' : '' }}</span>
          </div>
        </div>

        <!-- Cards das atividades -->
        <div v-if="!loadingGerar && atividadesGeradas.length > 0" class="atividades-grid">
          <div
            v-for="(atividade, idx) in atividadesGeradas"
            :key="atividade.id"
            class="atividade-card"
          >
            <div class="atividade-card-header">
              <span class="atividade-numero">{{ idx + 1 }}</span>
              <div class="atividade-meta">
                <Tag :value="atividade.area_conhecimento" severity="warn" class="area-tag" />
                <Tag :value="labelDificuldade(atividade.dificuldade)" :severity="dificuldadeSeverity(atividade.dificuldade)" />
              </div>
            </div>

            <h4 class="atividade-titulo">{{ atividade.titulo }}</h4>
            <p class="atividade-descricao">{{ atividade.descricao }}</p>

            <div class="atividade-expandido" v-if="expandido === atividade.id">
              <div class="atividade-secao">
                <strong><i class="pi pi-list-check" /> Como fazer:</strong>
                <p>{{ atividade.como_fazer }}</p>
              </div>
              <div class="atividade-secao" v-if="atividade.materiais">
                <strong><i class="pi pi-box" /> Materiais:</strong>
                <p>{{ atividade.materiais }}</p>
              </div>
              <div class="atividade-secao" v-if="atividade.bncc_refs?.length">
                <strong><i class="pi pi-tag" /> Competências BNCC:</strong>
                <div class="bncc-tags">
                  <span v-for="ref in atividade.bncc_refs" :key="ref" class="bncc-tag">{{ ref }}</span>
                </div>
              </div>

              <!-- Adaptação IA -->
              <div v-if="adaptacoes[atividade.id]" class="adaptacao-resultado">
                <div class="adaptacao-header"><i class="pi pi-sparkles" /> Versão adaptada pela IA</div>
                <div class="atividade-secao">
                  <strong>Título adaptado:</strong>
                  <p>{{ adaptacoes[atividade.id].titulo_adaptado }}</p>
                </div>
                <div class="atividade-secao">
                  <strong>Descrição:</strong>
                  <p>{{ adaptacoes[atividade.id].descricao_adaptada }}</p>
                </div>
                <div class="atividade-secao">
                  <strong>Como fazer:</strong>
                  <p>{{ adaptacoes[atividade.id].como_fazer_adaptado }}</p>
                </div>
                <div class="atividade-secao" v-if="adaptacoes[atividade.id].materiais_adaptados">
                  <strong>Materiais:</strong>
                  <p>{{ adaptacoes[atividade.id].materiais_adaptados }}</p>
                </div>
                <div class="atividade-secao" v-if="adaptacoes[atividade.id].dicas_especificas">
                  <strong><i class="pi pi-lightbulb" /> Dicas para este aluno:</strong>
                  <p class="dica-texto">{{ adaptacoes[atividade.id].dicas_especificas }}</p>
                </div>
              </div>
            </div>

            <div class="atividade-acoes">
              <Button
                :label="expandido === atividade.id ? 'Recolher' : 'Ver detalhes'"
                :icon="expandido === atividade.id ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
                class="ver-detalhes-btn"
                text
                size="small"
                @click="toggleExpandido(atividade.id)"
              />

              <Button
                v-if="expandido === atividade.id && !adaptacoes[atividade.id]"
                label="Adaptar com IA"
                icon="pi pi-sparkles"
                size="small"
                severity="help"
                outlined
                :loading="loadingAdaptacao === atividade.id"
                @click="adaptarComIA(atividade)"
              />

              <Button
                v-if="adaptacoes[atividade.id]"
                icon="pi pi-sparkles"
                label="Adaptado"
                size="small"
                severity="help"
                disabled
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import Select from 'primevue/select'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import Tag from 'primevue/tag'
import api from '@/services/api'
import { usePageLayout } from '@/composables/usePageLayout'
import { getAvatarSrc } from '@/composables/useAvatars'
import AvatarInitials from '@/components/AvatarInitials.vue'

// ── Estado ────────────────────────────────────────────────────────
usePageLayout({ title: 'Atividades BNCC', subtitle: 'Sorteie atividades pedagógicas baseadas na BNCC com IA' })
const turmas = ref<{ id: string; nome: string }[]>([])
const alunos = ref<{ id: string; nome: string; avatar_id: number | null }[]>([])
const turma_id = ref<string | undefined>()
const aluno_id = ref<string | undefined>()
const alunoNome = ref('')
const alunoId = ref('')
const alunoAvatarId = ref<number | null>(null)
const loadingAlunos = ref(false)
const quantidade = ref(3)
const loadingGerar = ref(false)
const erroGerar = ref('')
const atividadesGeradas = ref<Atividade[]>([])
const expandido = ref<string | undefined>()
const loadingAdaptacao = ref<string | undefined>()
const adaptacoes = ref<Record<string, Adaptacao>>({})

const filtro = ref<{
  area?: string
  nivel?: string
  dificuldade?: string
}>({})

const areasDisponiveis = ref<Record<string, string[]>>({})

interface Atividade {
  id: string
  titulo: string
  descricao: string
  como_fazer: string
  materiais?: string
  area_conhecimento: string
  nivel_educacional: string
  bncc_refs: string[]
  dificuldade: string
}

interface Adaptacao {
  titulo_adaptado: string
  descricao_adaptada: string
  como_fazer_adaptado: string
  materiais_adaptados: string
  dicas_especificas: string
  nivel_adaptado: string
}

const dificuldades = [
  { value: 'basica', label: 'Básica' },
  { value: 'intermediaria', label: 'Intermediária' },
  { value: 'avancada', label: 'Avançada' },
]

const areasOpcoes = computed(() =>
  Object.keys(areasDisponiveis.value).map(a => ({ label: a, value: a }))
)

const niveisOpcoes = computed(() => {
  if (!filtro.value.area || !areasDisponiveis.value[filtro.value.area]) {
    const todos = new Set<string>()
    Object.values(areasDisponiveis.value).forEach(ns => ns.forEach(n => todos.add(n)))
    return [...todos].sort().map(n => ({ label: n, value: n }))
  }
  return areasDisponiveis.value[filtro.value.area].map(n => ({ label: n, value: n }))
})

// ── Métodos ──────────────────────────────────────────────────
async function carregarTurmas() {
  const resp = await api.get('/api/turmas')
  turmas.value = resp.data.data ?? []
}

async function onTurmaChange() {
  aluno_id.value = undefined
  atividadesGeradas.value = []
  erroGerar.value = ''
  if (!turma_id.value) return
  loadingAlunos.value = true
  try {
    const resp = await api.get(`/api/turmas/${turma_id.value}/alunos`)
    alunos.value = (resp.data.data ?? []).filter((a: { status: string }) => a.status === 'ativo')
  } finally {
    loadingAlunos.value = false
  }
}

async function carregarAreas() {
  const resp = await api.get('/api/atividades/areas')
  areasDisponiveis.value = resp.data.data ?? {}
}

async function gerarAtividades() {
  if (!aluno_id.value) return
  erroGerar.value = ''
  loadingGerar.value = true
  atividadesGeradas.value = []
  adaptacoes.value = {}
  expandido.value = undefined

  const aluno = alunos.value.find(a => a.id === aluno_id.value)
  alunoNome.value = aluno?.nome ?? ''
  alunoId.value = aluno?.id ?? ''
  alunoAvatarId.value = aluno?.avatar_id ?? null

  try {
    const resp = await api.post(`/api/alunos/${aluno_id.value}/atividades/gerar`, {
      quantidade: quantidade.value,
      ...(filtro.value.area ? { area_conhecimento: filtro.value.area } : {}),
      ...(filtro.value.nivel ? { nivel_educacional: filtro.value.nivel } : {}),
      ...(filtro.value.dificuldade ? { dificuldade: filtro.value.dificuldade } : {}),
    })
    atividadesGeradas.value = resp.data.atividades
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string } } }
    erroGerar.value = e.response?.data?.error ?? 'Erro ao gerar atividades. Tente novamente.'
  } finally {
    loadingGerar.value = false
  }
}

async function adaptarComIA(atividade: Atividade) {
  loadingAdaptacao.value = atividade.id
  try {
    const resp = await api.post(`/api/atividades/${atividade.id}/adaptar-ia`, {
      aluno_id: aluno_id.value,
    })
    adaptacoes.value[atividade.id] = resp.data.adaptacao
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string } } }
    alert(e.response?.data?.error ?? 'Erro ao adaptar com IA.')
  } finally {
    loadingAdaptacao.value = undefined
  }
}

function toggleExpandido(id: string) {
  expandido.value = expandido.value === id ? undefined : id
}

function labelDificuldade(d: string) {
  return { basica: 'Básica', intermediaria: 'Intermediária', avancada: 'Avançada' }[d] ?? d
}

function dificuldadeSeverity(d: string): 'success' | 'warn' | 'danger' | 'secondary' {
  return ({ basica: 'success', intermediaria: 'warn', avancada: 'danger' } as Record<string, 'success' | 'warn' | 'danger'>)[d] ?? 'secondary'
}

onMounted(() => {
  carregarTurmas()
  carregarAreas()
})
</script>

<style scoped>
.atividades-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.5rem;
  align-items: start;
}

@media (max-width: 900px) {
  .atividades-layout { grid-template-columns: 1fr; }
}

/* ── Filtros ── */
.filtros-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: sticky;
  top: 1rem;
}

.filtros-titulo {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-1);
  margin: 0 0 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.field { display: flex; flex-direction: column; gap: 0.35rem; }
.field label { font-size: 0.85rem; font-weight: 600; color: var(--text-2); }
.badge-opt { font-size: 0.7rem; font-weight: 400; color: var(--text-3); margin-left: 4px; }
.w-full { width: 100%; }

/* Quantidade */
.quantidade-selector {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-bottom: 0.4rem;
}

.qtd-btn {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  border: 2px solid var(--border);
  background: var(--bg-surface);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  color: var(--text-2);
  transition: all .15s;
}

.qtd-btn:hover { border-color: var(--acae-primary); color: var(--acae-primary); }
.qtd-btn--active { border-color: var(--acae-primary); background: var(--acae-primary); color: #fff; }

/* Dificuldade */
.dificuldade-selector { display: flex; gap: 0.5rem; }

.dif-btn {
  flex: 1;
  padding: 0.4rem 0.5rem;
  border-radius: 8px;
  border: 2px solid var(--border);
  background: var(--bg-surface);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  color: var(--text-2);
  transition: all .15s;
}

.dif-btn--basica:hover, .dif-btn--basica.dif-btn--active { border-color: #16a34a; background: #16a34a; color: #fff; }
.dif-btn--intermediaria:hover, .dif-btn--intermediaria.dif-btn--active { border-color: #d97706; background: #d97706; color: #fff; }
.dif-btn--avancada:hover, .dif-btn--avancada.dif-btn--active { border-color: #dc2626; background: #dc2626; color: #fff; }

.gerar-btn { margin-top: 0.5rem; }
.acoes-listagem { margin-top: -0.25rem; }
.text-muted { color: var(--text-2); font-size: 0.8rem; display: flex; align-items: center; gap: 0.5rem; }

/* ── Resultado ── */
.resultado-area { display: flex; flex-direction: column; gap: 1rem; min-height: 400px; }

.estado-vazio, .estado-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--text-3);
  background: var(--bg-card);
  border-radius: 12px;
  border: 2px dashed var(--border-hover);
  gap: 1rem;
}

.estado-icone { font-size: 3rem; color: var(--text-3); }
.estado-texto { font-size: 1rem; color: var(--text-2); margin: 0; }
.estado-sub { font-size: 0.85rem; color: var(--text-3); margin: 0; }

.estado-erro {
  padding: 1rem 1.25rem;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.25);
  border-radius: 8px;
  color: var(--color-error);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
}

.resultado-header {
  background: var(--bg-card);
  border-radius: 10px;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
}

.resultado-info { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }

.aluno-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--acae-primary-dim);
  color: var(--acae-primary);
  padding: 0.3rem 0.75rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.875rem;
}

.count-tag {
  color: var(--text-2);
  font-size: 0.875rem;
}

/* ── Cards de atividade ── */
.atividades-grid { display: flex; flex-direction: column; gap: 1rem; }

.atividade-card {
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border);
  padding: 1.25rem;
  transition: box-shadow .2s, border-color .2s, transform .15s;
}

.atividade-card:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  border-color: rgba(139,92,246,0.3);
  transform: translateY(-1px);
}

.atividade-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.atividade-numero {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--acae-blue);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.atividade-meta { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }

.atividade-titulo {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-1);
  margin: 0 0 0.5rem;
}

.atividade-descricao {
  font-size: 0.875rem;
  color: var(--text-2);
  line-height: 1.6;
  margin: 0;
}

.atividade-expandido {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.atividade-secao { display: flex; flex-direction: column; gap: 0.25rem; }
.atividade-secao strong { font-size: 0.82rem; color: var(--text-2); display: flex; align-items: center; gap: 0.35rem; }
.atividade-secao p { font-size: 0.875rem; color: var(--text-2); line-height: 1.6; margin: 0; white-space: pre-line; }

.bncc-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.25rem; }
.bncc-tag {
  font-size: 0.72rem;
  background: var(--bg-overlay);
  color: var(--text-2);
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  border: 1px solid var(--border);
}

/* Adaptação IA */
.adaptacao-resultado {
  background: var(--acae-primary-dim);
  border: 1px solid rgba(139,92,246,0.25);
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.adaptacao-header {
  font-weight: 700;
  color: var(--acae-primary);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.dica-texto {
  background: rgba(139,92,246,0.15);
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  font-style: italic;
  color: #c4b5fd !important;
}

.atividade-acoes {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
}

/* ── Aluno tag avatar ── */
.aluno-tag-img {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255,204,2,0.4);
  flex-shrink: 0;
}

.aluno-tag-anon {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--bg-overlay);
  border: 2px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: var(--text-3);
  flex-shrink: 0;
}

:deep(.area-tag.p-tag) {
  font-size: 0.72rem;
  font-weight: 600;
}

:deep(.ver-detalhes-btn.p-button) { color: var(--acae-blue) !important; }
:deep(.ver-detalhes-btn.p-button:hover) { background: var(--acae-blue-dim) !important; color: var(--acae-blue) !important; }

:deep(.gerar-btn.p-button) {
  background: linear-gradient(135deg, #FFCC02 0%, #E8A800 100%) !important;
  border-color: #E8A800 !important;
  color: #1a1a1a !important;
  font-weight: 700 !important;
}
:deep(.gerar-btn.p-button:hover:not(:disabled)) {
  background: linear-gradient(135deg, #f0be00 0%, #d49800 100%) !important;
}

:deep(.novo-sorteio-btn.p-button) {
  background: linear-gradient(135deg, var(--acae-blue) 0%, #2d6bc4 100%) !important;
  border-color: #2d6bc4 !important;
  color: #fff !important;
  font-weight: 700 !important;
}
:deep(.novo-sorteio-btn.p-button:hover:not(:disabled)) {
  background: linear-gradient(135deg, #3d84d8 0%, #2460b5 100%) !important;
}
</style>
