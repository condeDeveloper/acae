<template>
  <div class="page-container">
    <div class="ocorrencias-layout">
      <!-- ── Painel de Configuração ── -->
      <div class="filtros-card">
        <h3 class="filtros-titulo"><i class="pi pi-file-edit" /> Gerar Ocorrência</h3>

        <!-- Tipo de ocorrência -->
        <div class="field">
          <label>Tipo de Ocorrência</label>
          <div class="tipo-selector">
            <button
              v-for="t in tipos"
              :key="t.value"
              :class="['tipo-btn', `tipo-btn--${t.value}`, tipo === t.value ? 'tipo-btn--active' : '']"
              @click="tipo = t.value"
            >
              <i :class="t.icon" />
              {{ t.label }}
            </button>
          </div>
        </div>

        <!-- Turma -->
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

        <!-- Aluno -->
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

        <!-- Motivo -->
        <div class="field">
          <label>Motivo / Descrição</label>
          <Textarea
            v-model="motivo"
            :rows="5"
            placeholder="Descreva o motivo da ocorrência com o máximo de detalhes..."
            class="w-full motivo-textarea"
            :maxlength="2000"
            autoResize
          />
          <small class="text-muted">{{ motivo.length }}/2000 caracteres (mínimo 10)</small>
        </div>

        <Button
          label="Gerar Ocorrência"
          icon="pi pi-sparkles"
          class="w-full gerar-btn"
          :loading="loadingGerar"
          :disabled="!aluno_id || !tipo || motivo.length < 10"
          @click="gerarOcorrencia"
        />

        <div v-if="textoGerado && !loadingGerar" class="acoes-listagem">
          <Button
            label="Gerar Novamente"
            icon="pi pi-sync"
            class="w-full"
            size="small"
            outlined
            @click="gerarOcorrencia"
          />
        </div>
      </div>

      <!-- ── Área de Resultado ── -->
      <div class="resultado-area">
        <!-- Estado vazio -->
        <div v-if="!loadingGerar && !textoGerado && !erroGerar" class="estado-vazio">
          <i class="pi pi-file-edit estado-icone" />
          <p class="estado-texto">Configure e clique em <strong>Gerar Ocorrência</strong></p>
          <p class="estado-sub">A IA irá redigir o documento formal com base no motivo informado</p>
          <div class="tipos-info">
            <div v-for="t in tipos" :key="t.value" class="tipo-info-item">
              <i :class="[t.icon, `tipo-icon--${t.value}`]" />
              <div>
                <strong>{{ t.label }}</strong>
                <p>{{ t.descricao }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Erro -->
        <div v-if="erroGerar" class="estado-erro">
          <i class="pi pi-exclamation-triangle" />
          <span>{{ erroGerar }}</span>
        </div>

        <!-- Loading -->
        <div v-if="loadingGerar" class="estado-loading">
          <i class="pi pi-spin pi-spinner" style="font-size: 2.5rem; color: var(--acae-primary)" />
          <p>A IA está redigindo o documento...</p>
        </div>

        <!-- Documento gerado -->
        <div v-if="!loadingGerar && textoGerado" class="documento-resultado">
          <!-- Cabeçalho do resultado -->
          <div class="resultado-header">
            <div class="resultado-info">
              <span class="aluno-tag">
                <img v-if="getAvatarSrc(alunoAvatarId)" :src="getAvatarSrc(alunoAvatarId)!" class="aluno-tag-img" alt="avatar" />
                <AvatarInitials v-else :nome="alunoNome" :seed="alunoId" :size="26" />
                {{ alunoNome }}
              </span>
              <span :class="['tipo-badge', `tipo-badge--${tipoAtual}`]">
                <i :class="tipoIcone" />
                {{ tipoLabel }}
              </span>
            </div>
            <div class="resultado-acoes">
              <Button
                icon="pi pi-copy"
                label="Copiar"
                size="small"
                outlined
                @click="copiarTexto"
              />
              <Button
                icon="pi pi-print"
                label="Imprimir"
                size="small"
                outlined
                @click="imprimirDocumento"
              />
            </div>
          </div>

          <!-- Texto do documento -->
          <div class="documento-card" ref="documentoRef">
            <pre class="documento-texto">{{ textoGerado }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import { useToast } from 'primevue/usetoast'
import api from '@/services/api'
import { usePageLayout } from '@/composables/usePageLayout'
import { getAvatarSrc } from '@/composables/useAvatars'
import AvatarInitials from '@/components/AvatarInitials.vue'

usePageLayout({ title: 'Ocorrências', subtitle: 'Gere documentos de ocorrência escolar com IA' })

const toast = useToast()
const documentoRef = ref<HTMLElement | null>(null)

// ── Estado ─────────────────────────────────────────────────────
const turmas = ref<{ id: string; nome: string }[]>([])
const alunos = ref<{ id: string; nome: string; avatar_id: number | null }[]>([])
const turma_id = ref<string | undefined>()
const aluno_id = ref<string | undefined>()
const tipo = ref<'recado' | 'advertencia' | 'suspensao'>('recado')
const motivo = ref('')
const loadingAlunos = ref(false)
const loadingGerar = ref(false)
const erroGerar = ref('')
const textoGerado = ref('')
const alunoNome = ref('')
const alunoId = ref('')
const alunoAvatarId = ref<number | null>(null)
const tipoAtual = ref<string>('')
const tipoLabel = ref('')

const tipos = [
  {
    value: 'recado' as const,
    label: 'Recado',
    icon: 'pi pi-envelope',
    descricao: 'Comunicado amigável aos responsáveis com informações ou orientações.',
  },
  {
    value: 'advertencia' as const,
    label: 'Advertência',
    icon: 'pi pi-exclamation-circle',
    descricao: 'Registro formal de comportamento inadequado com orientações e consequências.',
  },
  {
    value: 'suspensao' as const,
    label: 'Suspensão',
    icon: 'pi pi-ban',
    descricao: 'Comunicação formal de afastamento temporário com condições de retorno.',
  },
]

const tipoIcone = computed(() => tipos.find(t => t.value === tipoAtual.value)?.icon ?? 'pi pi-file')

// ── Métodos ──────────────────────────────────────────────────
async function carregarTurmas() {
  const resp = await api.get('/api/turmas')
  turmas.value = resp.data.data ?? []
}

async function onTurmaChange() {
  aluno_id.value = undefined
  textoGerado.value = ''
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

async function gerarOcorrencia() {
  if (!aluno_id.value || !tipo.value || motivo.value.length < 10) return
  erroGerar.value = ''
  loadingGerar.value = true
  textoGerado.value = ''

  const aluno = alunos.value.find(a => a.id === aluno_id.value)
  alunoNome.value = aluno?.nome ?? ''
  alunoId.value = aluno?.id ?? ''
  alunoAvatarId.value = aluno?.avatar_id ?? null

  try {
    const resp = await api.post('/api/ocorrencias/gerar', {
      aluno_id: aluno_id.value,
      tipo: tipo.value,
      motivo: motivo.value,
    })
    textoGerado.value = resp.data.texto_gerado
    tipoAtual.value = resp.data.tipo
    tipoLabel.value = resp.data.tipo_label
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string } } }
    erroGerar.value = e.response?.data?.error ?? 'Erro ao gerar ocorrência. Tente novamente.'
  } finally {
    loadingGerar.value = false
  }
}

async function copiarTexto() {
  try {
    await navigator.clipboard.writeText(textoGerado.value)
    toast.add({ severity: 'success', summary: 'Copiado!', detail: 'Texto copiado para a área de transferência.', life: 2500 })
  } catch {
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível copiar o texto.', life: 3000 })
  }
}

function imprimirDocumento() {
  const conteudo = textoGerado.value
  const janela = window.open('', '_blank')
  if (!janela) return
  janela.document.write(`
    <html>
      <head>
        <title>Ocorrência — ${tipoLabel.value} — ${alunoNome.value}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 13pt; margin: 3cm 2.5cm; line-height: 1.8; color: #000; }
          pre { white-space: pre-wrap; font-family: inherit; font-size: inherit; }
        </style>
      </head>
      <body><pre>${conteudo.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body>
    </html>`)
  janela.document.close()
  janela.focus()
  janela.print()
}

onMounted(carregarTurmas)
</script>

<style scoped>
.page-container {
  padding: 1.5rem;
}

.ocorrencias-layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 1.5rem;
  align-items: start;
}

@media (max-width: 900px) {
  .ocorrencias-layout {
    grid-template-columns: 1fr;
  }
}

/* ── Painel de filtros ── */
.filtros-card {
  background: var(--bg-surface);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--border-1);
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  position: sticky;
  top: 130px;
}

.filtros-titulo {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-2);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.text-muted {
  color: var(--text-3);
  font-size: 0.75rem;
}

/* ── Tipo selector ── */
.tipo-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tipo-btn {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  border: 2px solid var(--border-1);
  background: transparent;
  color: var(--text-1);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.tipo-btn:hover {
  border-color: var(--acae-primary);
  background: color-mix(in srgb, var(--acae-primary) 8%, transparent);
}

.tipo-btn--recado.tipo-btn--active {
  border-color: var(--acae-blue);
  background: color-mix(in srgb, var(--acae-blue) 12%, transparent);
  color: var(--acae-blue);
}

.tipo-btn--advertencia.tipo-btn--active {
  border-color: #E89B1A;
  background: color-mix(in srgb, #E89B1A 12%, transparent);
  color: #E89B1A;
}

.tipo-btn--suspensao.tipo-btn--active {
  border-color: var(--acae-red);
  background: color-mix(in srgb, var(--acae-red) 12%, transparent);
  color: var(--acae-red);
}

.motivo-textarea {
  resize: vertical;
  min-height: 100px;
  font-size: 0.9rem;
}

.gerar-btn {
  background: var(--acae-primary) !important;
  color: #000 !important;
  border: none !important;
  font-weight: 700;
}

.gerar-btn:not([disabled]):hover {
  filter: brightness(1.08);
}

/* ── Área de resultado ── */
.resultado-area {
  min-height: 400px;
}

/* ── Estados ── */
.estado-vazio,
.estado-erro,
.estado-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 2rem;
  text-align: center;
  background: var(--bg-surface);
  border-radius: 12px;
  border: 1px solid var(--border-1);
}

.estado-icone {
  font-size: 3rem;
  color: var(--text-3);
}

.estado-texto {
  margin: 0;
  font-size: 1rem;
  color: var(--text-2);
}

.estado-sub {
  margin: 0;
  font-size: 0.83rem;
  color: var(--text-3);
}

.estado-erro {
  color: var(--acae-red);
  border-color: var(--acae-red);
  background: color-mix(in srgb, var(--acae-red) 8%, transparent);
  flex-direction: row;
  font-size: 0.9rem;
}

/* ── Tipos info no estado vazio ── */
.tipos-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
  width: 100%;
  max-width: 480px;
  text-align: left;
}

.tipo-info-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  background: var(--bg-base);
  border: 1px solid var(--border-1);
}

.tipo-info-item i {
  font-size: 1.2rem;
  margin-top: 2px;
  flex-shrink: 0;
}

.tipo-icon--recado { color: var(--acae-blue); }
.tipo-icon--advertencia { color: #E89B1A; }
.tipo-icon--suspensao { color: var(--acae-red); }

.tipo-info-item strong {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-1);
  display: block;
  margin-bottom: 0.2rem;
}

.tipo-info-item p {
  margin: 0;
  font-size: 0.78rem;
  color: var(--text-3);
}

/* ── Documento gerado ── */
.documento-resultado {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.resultado-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.resultado-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.resultado-acoes {
  display: flex;
  gap: 0.5rem;
}

.aluno-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-1);
  border-radius: 999px;
  padding: 0.25rem 0.75rem 0.25rem 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-1);
}

.aluno-tag-img {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
}

.tipo-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.8rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
}

.tipo-badge--recado {
  background: color-mix(in srgb, var(--acae-blue) 15%, transparent);
  color: var(--acae-blue);
}

.tipo-badge--advertencia {
  background: color-mix(in srgb, #E89B1A 15%, transparent);
  color: #E89B1A;
}

.tipo-badge--suspensao {
  background: color-mix(in srgb, var(--acae-red) 15%, transparent);
  color: var(--acae-red);
}

/* ── Texto do documento ── */
.documento-card {
  background: var(--bg-surface);
  border-radius: 12px;
  border: 1px solid var(--border-1);
  padding: 2rem 2.5rem;
}

.documento-texto {
  white-space: pre-wrap;
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 0.95rem;
  line-height: 1.9;
  color: var(--text-1);
  margin: 0;
}

.acoes-listagem {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
