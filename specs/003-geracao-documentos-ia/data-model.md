# Modelo de Dados: Geração de Documentos Pedagógicos com IA

**Branch**: `003-geracao-documentos-ia` | **Data**: 2026-03-10

---

## Observação

Esta feature **não cria novas tabelas** no banco. Utiliza as entidades já definidas em `specs/007-banco-de-dados/data-model.md` e `specs/006-integracao-ia-gemini/data-model.md`.

Tabelas consumidas:
- `professores` — identidade do gerador
- `turmas` — contexto da turma
- `alunos` — sujeito do documento (nome anonimizado antes do prompt)
- `grupos` + `grupos_alunos` — para atividades adaptadas coletivas
- `competencias_bncc` — referências obrigatórias
- `contextos_pedagogicos` — contexto da turma no período
- `registros_aluno` — dados do aluno no período (objetivos, atividades, mediações)
- `rascunhos_documento` — onde o resultado da IA é armazenado
- `versoes_documento` — histórico imutável ao finalizar
- `controle_cotas` — controle diário de uso da API Gemini

---

## Fluxo de dados por tipo de documento

### Portfólio Semanal

```
Input do professor → [aluno_id, semana (periodo), turma_id]
    ↓
Consultas ao banco:
  - RegistroAluno (aluno_id, periodo) → objetivos, atividades, mediações, ocorrências, bncc_refs
  - ContextoPedagogico (turma_id, periodo) → metodologia, objetivos da turma
  - Aluno.nome → substituído por UUID pseudônimo
Validação:
  - bncc_refs.length >= 1  [Princípio III]
  - contagem_requisicoes do dia < 1500  [RF cotas]
    ↓
Prompt para Gemini (sem nome real do aluno)
    ↓
Resposta da IA → salva em RascunhoDocumento
  { tipo: 'portfolio_semanal', status: 'rascunho', conteudo_gerado, bncc_refs, prompt_hash }
    ↓
Professor revisa → edita conteudo_editado → finaliza
    ↓
VersaoDocumento criada (INSERT-ONLY)
Exportação: .docx + .pdf via token efêmero
```

### Relatório Individual

```
Input: [aluno_id, data_inicio, data_fim, turma_id]
    ↓
Consultas: RegistroAluno[] do período → agrega objetivos, atividades, mediações
    ↓
(mesma lógica de validação + prompt + armazenamento)
```

### Atividade Adaptada

```
Input: [aluno_ids[] | grupo_id, objetivo (texto), bncc_ref, turma_id]
    ↓
Consultas: Aluno[] → contexto pedagógico de cada aluno
    ↓
(mesma lógica)
Exportação: uma versão unificada + versões individuais por aluno (opcional)
```

### Resumo Pedagógico

```
Input: [turma_id, periodo]
    ↓
Consultas: RegistroAluno[] de todos os alunos da turma no período (agregado)
           ContextoPedagogico (turma_id, periodo)
Validação: ao menos 2 alunos com registros no período
    ↓
(mesma lógica — sem identificação nominal de alunos no prompt)
```

---

## Transições de estado: `RascunhoDocumento.status`

```
rascunho ──→ em_revisao ──→ finalizado
rascunho ──────────────────→ finalizado  (sem edição manual)
                             ↓
                      VersaoDocumento (INSERT-ONLY, imutável)
```

**Campos obrigatórios ao finalizar**:
- `conteudo_final` preenchido (cópia de `conteudo_editado` ou `conteudo_gerado`)
- `finalizado_em` preenchido
- `bncc_refs.length >= 1`

---

## Payload do prompt (pseudonimização)

O nome real do aluno é **nunca** enviado ao Gemini. O campo identificador no prompt é um UUID gerado por-requisição:

```typescript
// backend/src/services/prompt-builder.ts
function pseudonymize(nome: string): string {
  return crypto.randomUUID()  // ex: "3f7a2b1c-..."
  // Nota: o UUID não é armazenado — é gerado fresh por chamada
}
```

O `prompt_hash` armazenado é `SHA-256(prompt_string_after_pseudonymization)` — não contém o UUID gerado (que seria reversível via lookup), apenas o hash do conteúdo enviado.

---

## Estrutura de templates `.docx`

Cada tipo de documento tem um template Word com marcadores:

**`portfolio-semanal.docx`**:
```
Professor: {professor_nome}       Turma: {turma_nome}
Aluno: {aluno_nome}               Semana: {semana_descricao}
BNCC: {bncc_codigos}

{conteudo}
```

**`relatorio-individual.docx`**, **`atividade-adaptada.docx`**, **`resumo-pedagogico.docx`**: estrutura análoga adaptada para cada tipo.
