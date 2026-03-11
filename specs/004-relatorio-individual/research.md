# Research: Relatório Individual do Aluno

**Feature**: 004-relatorio-individual  
**Branch**: `005-relatorio-individual`  
**Data**: 2026-03-10

---

## Contexto

Esta feature é um sub-conjunto especializado de `003-geracao-documentos-ia`. O backend (geração via Gemini, exportação .docx/.pdf, tokens de download) é 100% reaproveitado da feature 003. Este documento foca nas **incertezas exclusivas desta feature**: edição inline, autosave, posicionamento de botão de download e gerenciamento de estado do rascunho no frontend Vue 3.

---

## Incerteza 1 — Edição inline do rascunho (RF-010)

**Pergunta**: Como implementar um campo de texto editável de forma simples e confiável no Vue 3 + PrimeVue?

**Decisão**: `<Textarea>` do PrimeVue v4 com `v-model` e `autoResize`. Sem rich text editor (TipTap, Quill) — o relatório é plain text, rich text aumentaria complexidade sem ganho pedagógico.

**Rationale**:
- `<Textarea autoResize>` cresce conforme o conteúdo — sem barra de scroll interna
- Compatível com o sistema de design PrimeVue v4 (tokens ACAE, feature 002)
- Fácil de testar e manter
- Se o requisito evoluir para rich text, a troca para TipTap é localizada no `DocumentoRevisor.vue`

```vue
<Textarea
  v-model="conteudoEditado"
  autoResize
  class="w-full"
  :disabled="relatorio.status === 'finalizado'"
/>
```

---

## Incerteza 2 — Autosave (RF-011)

**Pergunta**: Como salvar automaticamente sem spam de requisições ao backend?

**Decisão**: Debounce de 1500ms com `watchDebounced` do VueUse. Status visual "Salvando..." → "Salvo" com `<Tag>` PrimeVue.

**Implementação**:

```typescript
import { watchDebounced } from '@vueuse/core'

const autoSaveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')

watchDebounced(
  conteudoEditado,
  async (novoConteudo) => {
    if (relatorio.value?.status === 'finalizado') return
    autoSaveStatus.value = 'saving'
    try {
      await api.patch(`/api/documents/rascunhos/${rascunhoId.value}`, {
        conteudo_editado: novoConteudo,
        status: 'em_revisao',
      })
      autoSaveStatus.value = 'saved'
    } catch {
      autoSaveStatus.value = 'error'
    }
  },
  { debounce: 1500 }
)
```

**Dependência**: `@vueuse/core` (já usada no projeto para `useInactivityTimer` — feature 001).

---

## Incerteza 3 — Posicionamento do botão de download (RF-006)

**Pergunta**: Como garantir que o botão de download fique visível logo abaixo/ao lado do conteúdo sem necessidade de scroll?

**Decisão**: Layout de duas colunas em telas ≥ 1024px (PrimeGrid col-8/col-4): coluna esquerda = formulário de dados, coluna direita = rascunho gerado + botão download. Em telas menores (mobile), coluna única com botão imediatamente após o textarea.

**Princípio de posicionamento**:
- O rascunho (`<Textarea>`) e o `<BotaoExportar>` ficam no mesmo card PrimeVue
- O card tem `position: sticky; top: 1rem` em telas largas → botão sempre visível ao lado dos dados
- Em mobile: botão logo após `<Textarea>` sem sticky

```html
<!-- Desktop: col-4 sticky -->
<div class="col-12 lg:col-4">
  <Card class="sticky top-4">
    <template #title>Rascunho Gerado</template>
    <template #content>
      <Textarea v-model="conteudoEditado" autoResize class="w-full" />
      <BotaoExportar :rascunho-id="rascunhoId" class="mt-3" />
    </template>
  </Card>
</div>
```

Esta abordagem satisfaz CS-002: "botão visível sem rolagem em 100% das condições normais de uso".

---

## Incerteza 4 — Concorrência na finalização (caso de borda da spec)

**Pergunta**: Como tratar dois professores tentando finalizar o mesmo rascunho simultaneamente?

**Decisão**: Backend resolve com `UPDATE ... WHERE status != 'finalizado' RETURNING id` — se zero linhas afetadas, retorna HTTP 409 Conflict. Frontend exibe toast "Este relatório já foi finalizado" e recarrega estado.

**Implementação backend** (Prisma):
```typescript
const updated = await prisma.rascunhoDocumento.updateMany({
  where: { id: rascunhoId, status: { not: 'finalizado' } },
  data: { status: 'finalizado', finalizado_em: new Date() }
})
if (updated.count === 0) {
  throw new Error('ALREADY_FINALIZED')
}
```

---

## Incerteza 5 — Preservar rascunho após fechar o browser (RF-011, CS-007)

**Pergunta**: O autosave no banco é suficiente, ou preciso de `localStorage` como fallback?

**Decisão**: Autosave no banco (via PATCH debounced) é a fonte de verdade. Sem `localStorage`. Ao recarregar, o `onMounted` busca o rascunho ativo do aluno/período via `GET /api/documents/rascunhos?aluno_id=&tipo=relatorio_individual`.

**Rationale**: `localStorage` criaria divergência entre dispositivos e requer lógica de conflito. O autosave com debounce de 1.5s garante, na prática, que o último estado editado está no banco antes do usuário fechar o browser (exceto nos primeiros 1.5s de edição — risco aceitável).

---

## Conclusão: Novas dependências

| Dependência | Uso |
|-------------|-----|
| `@vueuse/core` | `watchDebounced` para autosave — **já usada** na feature 001 |
| PrimeVue v4 `Textarea`, `Card`, `Tag`, `ConfirmDialog` | UI — **já disponível** na feature 002 |

**Nenhuma nova dependência de runtime** necessária para esta feature.
