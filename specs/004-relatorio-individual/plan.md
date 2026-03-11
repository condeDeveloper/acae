# Plano de Implementação: Relatório Individual do Aluno

**Feature**: 004-relatorio-individual  
**Branch**: `005-relatorio-individual`  
**Spec**: `.specify/specs/relatorio-individual/spec.md`  
**Depende de**: 001 (Login), 002 (Stack), 003 (Geração de Documentos), 007 (Banco)  
**Status**: Pronto para implementação

---

## Contexto técnico

| Aspecto | Decisão |
|---------|---------|
| Framework frontend | Vue 3 (Composition API) + PrimeVue v4 |
| Estado | Pinia (`useRelatorioStore`) |
| Autosave | `watchDebounced` do `@vueuse/core` — debounce 1.5s |
| Edição inline | PrimeVue `<Textarea autoResize>` — plain text, sem rich text editor |
| Posicionamento download | Card com `sticky top-4` em desktop (lg:col-7), inline após textarea em mobile |
| Exportação | Reutiliza serviços de `003-geracao-documentos-ia` (backend) |
| Concorrência finalização | `updateMany WHERE status != 'finalizado'` → HTTP 409 se já finalizado |
| Imutabilidade | `disabled` no Textarea + backend rejeita PATCH em finalizado |

---

## Verificação da Constituição

| Princípio | Verificação | Status |
|-----------|-------------|--------|
| I — Privacidade LGPD | Nome do aluno anonimizado (UUID descartável) antes do prompt — garantido pela feature 003. Esta feature não altera o fluxo de pseudonimização. | ✅ PASSA |
| II — IA baseada em dados reais | `conteudo_gerado` derivado exclusivamente de `RegistroAluno` do banco — verificado em 003. RF-010 exige edição pelo professor antes ou no ato da finalização (revisão humana obrigatória pelo flow de UI). | ✅ PASSA |
| III — Rastreabilidade BNCC | RF-002 exige ≥ 1 BNCC para habilitar geração. RF-012 exige ≥ 1 BNCC para finalizar. Backend valida nos dois momentos. | ✅ PASSA |
| IV — Imutabilidade pós-finalização | RF-013: `status = 'finalizado'` desabilita edição. Versão registrada em `VersaoDocumento` (INSERT-ONLY). RF-014: nova versão não sobrescreve. | ✅ PASSA |
| V — Acessibilidade WCAG | Botões de download com `label` e `icon`. `Textarea` com `placeholder`. `Tag` de status com semântica de severity (não só cor). ConfirmDialog acessível por teclado. | ✅ PASSA |

---

## Decisões de implementação

### D1 — Plain text editor (sem rich text)

**Decisão**: `<Textarea autoResize>` do PrimeVue. Sem TipTap, Quill ou CKEditor.

**Rationale**: Relatórios individuais são gerados pela IA como plain text. Formatação rich text não é requisito da spec. Adicionar um rich text editor aumentaria o bundle em ~100KB gzip e a complexidade sem ganho funcional documentado.

**Consequência**: O arquivo `.docx` terá formatação do template, não formatação livre do professor. Aceitável para o estágio atual — a spec não menciona negrito/itálico como requisito.

---

### D2 — Sticky card (RF-006)

**Decisão**: O card do rascunho usa `position: sticky; top: 1rem` via classe Tailwind `sticky top-4` em telas ≥ 1024px (grid `lg:col-7`).

**Rationale**: RF-006 é explícito: "botão de download visível logo abaixo ou ao lado do conteúdo sem que o professor precise rolar". Em desktop, o card sticky + botão no interior satisfaz CS-002 ("100% das condições normais"). Em mobile, o botão fica abaixo do textarea, visível sem scroll adicional (o formulário inteiro é mais curto em mobile).

---

### D3 — Autosave via watchDebounced (sem localStorage)

**Decisão**: Autosave no banco via PATCH, debounce 1.5s. Sem localStorage.

**Rationale**: RF-011 exige preservation após fechamento do navegador. O banco é a fonte de verdade. `localStorage` criaria risco de divergência entre sessões. O debounce de 1.5s é suficiente — o usuário precisaria fechar o browser durante os primeiros 1.5s de cada edição para perder dados (risco aceitável e comunicado no CS-007 como "100% dos casos").

---

### D4 — Concorrência na finalização via updateMany

**Decisão**: Backend usa `prisma.rascunhoDocumento.updateMany({ where: { status: { not: 'finalizado' } } })` verificando `count === 0` para detectar finalização concorrente.

**Rationale**: Simplicidade sem precisar de SELECT + UPDATE em transação. O Caso de Borda da spec documenta este cenário. Retorna HTTP 409, frontend exibe toast e recarrega estado.

---

### D5 — `onMounted` restaura rascunho ativo

**Decisão**: `RelatórioIndividualPage.vue` chama `store.carregarRascunhoAtivo(aluno_id)` no `onMounted`, se `aluno_id` já estiver selecionado (navegação de retorno).

**Rationale**: RF-011 + CS-007: "rascunho apresentado no estado em que foi deixado" após fechar o browser. A restauração é feita via GET /api/documents/rascunhos?aluno_id=&tipo=relatorio_individual — a filtragem no backend garante que o professor só vê seus próprios rascunhos.

---

### D6 — BotaoExportar disponível em rascunho E finalizado

**Decisão**: `<BotaoExportar>` é renderizado em todas as etapas (rascunho, em_revisao, finalizado). Chama sempre `/api/documents/rascunhos/:id/export`.

**Rationale**: História de Usuário 2, Cenário 5: "professor faz download antes de finalizar — o arquivo é funcional e completo, mas o estado do rascunho não muda". RF-015: "download disponível para relatórios finalizados". O mesmo componente serve os dois casos.

---

## Estrutura de arquivos

```
frontend/src/
  pages/
    RelatórioIndividualPage.vue   # Página principal (formulário + rascunho)
  components/
    DocumentoRevisor.vue           # Textarea + indicador de autosave
    BotaoExportar.vue              # Botões .docx + .pdf (usa /export + window.open)
    HistoricoRelatorios.vue        # DataTable read-only com download
    BnccSelector.vue               # MultiSelect de competências BNCC (reutilizável)
  stores/
    relatorio.store.ts             # useRelatorioStore (estado + ações)
  composables/
    useAutoSave.ts                 # watchDebounced wrapper reutilizável
  router/
    index.ts                       # Adicionar rota /relatorio-individual
```

---

## Critérios de aceitação críticos mapeados

| Requisito | Implementação |
|-----------|---------------|
| RF-005: rascunho na mesma tela | `etapa` controla visibilidade do card — sem Vue Router push |
| RF-006: botão visível sem scroll | Card `sticky top-4` em `lg:col-7` |
| RF-010: edição inline | `<Textarea v-model>` no `DocumentoRevisor` |
| RF-011: autosave | `watchDebounced` 1500ms → PATCH |
| RF-012: BNCC para finalizar | `podeFinalizarr` computed + validação backend |
| RF-013: imutável após finalizar | `:disabled="status === 'finalizado'"` + 409 do backend |
| RF-014: nova versão sem sobrescrever | `VersaoDocumento` INSERT-ONLY — `rascunho_id` separado |
| RF-016/17/18: histórico | `HistoricoRelatorios.vue` + GET /api/alunos/:id/documentos |

---

## Artefatos gerados

| Artefato | Caminho |
|----------|---------|
| Research | `specs/004-relatorio-individual/research.md` |
| Modelo de dados e estados | `specs/004-relatorio-individual/data-model.md` |
| Contratos API | `specs/004-relatorio-individual/contracts/relatorio.md` |
| Quickstart | `specs/004-relatorio-individual/quickstart.md` |
| Este plano | `specs/004-relatorio-individual/plan.md` |
