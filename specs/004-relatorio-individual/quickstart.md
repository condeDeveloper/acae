# Quickstart: Relatório Individual do Aluno

**Pré-requisito**: features 001 (Login), 002 (Stack), 003 (Geração de Documentos) completas.

---

## 1. Nenhuma nova dependência de runtime

Esta feature usa exclusivamente:
- `@vueuse/core` — já instalada (feature 001, `useInactivityTimer`)
- PrimeVue v4 — já instalada (feature 002)
- A store Pinia e o `api.ts` — já configurados

```bash
# Confirmar que @vueuse/core está instalada
npm list @vueuse/core
```

---

## 2. Composable `useAutoSave`

**`frontend/src/composables/useAutoSave.ts`**:

```typescript
import { ref, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'
import type { Ref } from 'vue'

type Status = 'idle' | 'saving' | 'saved' | 'error'

export function useAutoSave(
  conteudo: Ref<string>,
  saveFn: (texto: string) => Promise<void>,
  opts = { debounce: 1500 }
) {
  const status = ref<Status>('idle')

  watchDebounced(
    conteudo,
    async (novoConteudo) => {
      status.value = 'saving'
      try {
        await saveFn(novoConteudo)
        status.value = 'saved'
        setTimeout(() => { status.value = 'idle' }, 3000)
      } catch {
        status.value = 'error'
      }
    },
    { debounce: opts.debounce }
  )

  return { status }
}
```

---

## 3. Componente `DocumentoRevisor.vue`

**`frontend/src/components/DocumentoRevisor.vue`**:

```vue
<template>
  <div class="documento-revisor">
    <div class="flex align-items-center justify-content-between mb-2">
      <span class="font-semibold text-color">Rascunho gerado pela IA</span>
      <Tag
        v-if="autoSaveStatus !== 'idle'"
        :value="statusLabel"
        :severity="statusSeverity"
        class="text-xs"
      />
    </div>

    <Textarea
      v-model="conteudoLocal"
      autoResize
      class="w-full"
      :disabled="disabled"
      rows="12"
      placeholder="O rascunho será exibido aqui após a geração..."
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useAutoSave } from '@/composables/useAutoSave'
import Textarea from 'primevue/textarea'
import Tag from 'primevue/tag'

const props = defineProps<{
  modelValue: string
  disabled?: boolean
  onSave: (texto: string) => Promise<void>
}>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const conteudoLocal = ref(props.modelValue)

watch(conteudoLocal, (val) => emit('update:modelValue', val))
watch(() => props.modelValue, (val) => { conteudoLocal.value = val })

const { status: autoSaveStatus } = useAutoSave(conteudoLocal, props.onSave)

const statusLabel = computed(() => ({
  idle: '',
  saving: 'Salvando...',
  saved: 'Salvo',
  error: 'Erro ao salvar',
}[autoSaveStatus.value]))

const statusSeverity = computed(() => ({
  idle: 'secondary',
  saving: 'info',
  saved: 'success',
  error: 'danger',
}[autoSaveStatus.value]))
</script>
```

---

## 4. Componente `BotaoExportar.vue`

**`frontend/src/components/BotaoExportar.vue`**:

```vue
<template>
  <div class="flex gap-2 mt-3">
    <Button
      label=".docx"
      icon="pi pi-file-word"
      outlined
      :loading="baixandoDocx"
      :disabled="!rascunhoId"
      @click="baixar('docx')"
    />
    <Button
      label=".pdf"
      icon="pi pi-file-pdf"
      outlined
      :loading="baixandoPdf"
      :disabled="!rascunhoId"
      @click="baixar('pdf')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import api from '@/services/api'

const props = defineProps<{ rascunhoId: string | null }>()
const toast = useToast()
const baixandoDocx = ref(false)
const baixandoPdf = ref(false)

async function baixar(formato: 'docx' | 'pdf') {
  if (!props.rascunhoId) return
  const flag = formato === 'docx' ? baixandoDocx : baixandoPdf
  flag.value = true
  try {
    const res = await api.get(
      `/api/documents/rascunhos/${props.rascunhoId}/export`,
      { params: { formato } }
    )
    window.open(res.data.download_url, '_blank')
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Não foi possível gerar o arquivo. Tente novamente.',
      life: 4000,
    })
  } finally {
    flag.value = false
  }
}
</script>
```

---

## 5. Página principal `RelatórioIndividualPage.vue`

**`frontend/src/pages/RelatórioIndividualPage.vue`**:

```vue
<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Relatório Individual</h1>

    <div class="grid">
      <!-- Coluna: Formulário -->
      <div class="col-12 lg:col-5">
        <Card>
          <template #title>Dados do Período</template>
          <template #content>
            <div class="flex flex-column gap-3">
              <div>
                <label class="block mb-1 font-medium">Aluno</label>
                <Dropdown
                  v-model="store.form.aluno_id"
                  :options="alunos"
                  option-label="nome"
                  option-value="id"
                  placeholder="Selecione um aluno"
                  class="w-full"
                />
              </div>
              <div class="grid">
                <div class="col-6">
                  <label class="block mb-1 font-medium">Data início</label>
                  <Calendar v-model="store.form.periodo_inicio" class="w-full" date-format="yy-mm-dd" />
                </div>
                <div class="col-6">
                  <label class="block mb-1 font-medium">Data fim</label>
                  <Calendar v-model="store.form.periodo_fim" class="w-full" date-format="yy-mm-dd" />
                </div>
              </div>
              <div>
                <label class="block mb-1 font-medium">Competências BNCC</label>
                <BnccSelector v-model="store.form.bncc_refs" />
              </div>
              <Button
                label="Gerar Relatório"
                icon="pi pi-sparkles"
                :disabled="!store.formularioValido"
                :loading="store.estaGerando"
                @click="store.gerarRelatorio()"
              />
              <Message v-if="store.erroGeracao" severity="error" :life="5000">
                {{ store.erroGeracao }}
              </Message>
            </div>
          </template>
        </Card>
      </div>

      <!-- Coluna: Rascunho (sticky) -->
      <div v-if="store.etapa !== 'formulario'" class="col-12 lg:col-7">
        <Card class="sticky top-4">
          <template #title>
            <span>Rascunho</span>
            <Tag
              v-if="store.rascunho?.status === 'finalizado'"
              value="Finalizado"
              severity="success"
              class="ml-2"
            />
          </template>
          <template #content>
            <DocumentoRevisor
              v-model="store.conteudoEditado"
              :disabled="store.rascunho?.status === 'finalizado'"
              :on-save="store.autoSalvar"
            />

            <!-- RF-006: Botão de download visível imediatamente após o conteúdo -->
            <BotaoExportar :rascunho-id="store.rascunho?.id ?? null" />

            <!-- Finalizar -->
            <div v-if="store.rascunho?.status !== 'finalizado'" class="mt-3">
              <Button
                label="Finalizar Relatório"
                icon="pi pi-check-circle"
                severity="success"
                :disabled="!store.podeFinalizarr"
                @click="confirmarFinalizacao()"
              />
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Histórico (abaixo, após geração ou na aba de histórico) -->
    <HistoricoRelatorios
      v-if="store.form.aluno_id"
      :aluno-id="store.form.aluno_id"
      class="mt-4"
    />

    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRelatorioStore } from '@/stores/relatorio.store'
import { useConfirm } from 'primevue/useconfirm'
// Importações PrimeVue: Card, Button, Calendar, Dropdown, Message, Tag, ConfirmDialog

const store = useRelatorioStore()
const confirm = useConfirm()

const alunos = ref([])  // Carregado via GET /api/turmas/:id/alunos

function confirmarFinalizacao() {
  confirm.require({
    message: 'Ao finalizar, o relatório se tornará imutável. Deseja continuar?',
    header: 'Finalizar Relatório',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Finalizar',
    rejectLabel: 'Cancelar',
    accept: () => store.finalizar(store.conteudoEditado),
  })
}

onMounted(async () => {
  // RF-011: Recuperar rascunho ativo ao recarregar página
  if (store.form.aluno_id) {
    await store.carregarRascunhoAtivo(store.form.aluno_id)
  }
})
</script>
```

---

## 6. Componente `HistoricoRelatorios.vue`

**`frontend/src/components/HistoricoRelatorios.vue`** (modo read-only — RF-016 a RF-018):

```vue
<template>
  <Card v-if="versoes.length > 0">
    <template #title>Histórico de Relatórios</template>
    <template #content>
      <DataTable :value="versoes" :rows="5" paginator>
        <Column field="periodo" header="Período" />
        <Column field="finalizado_em" header="Gerado em" />
        <Column field="professor_nome" header="Professor" />
        <Column header="Download">
          <template #body="{ data }">
            <BotaoExportar :rascunho-id="data.rascunho_id" />
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const props = defineProps<{ alunoId: string }>()
const versoes = ref([])

onMounted(async () => {
  const res = await api.get(`/api/alunos/${props.alunoId}/documentos`, {
    params: { tipo: 'relatorio_individual' }
  })
  versoes.value = res.data.data
})
</script>
```

---

## 7. Rota no Vue Router

```typescript
// frontend/src/router/index.ts
{
  path: '/relatorio-individual',
  name: 'RelatorioIndividual',
  component: () => import('@/pages/RelatórioIndividualPage.vue'),
  meta: { requiresAuth: true }
}
```
