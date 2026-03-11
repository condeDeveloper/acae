# Contrato: Relatório Individual do Aluno

**Base URL**: `https://api.acae.app` | **Auth**: Bearer JWT (todos os endpoints)

> Esta feature reutiliza os endpoints genéricos de `specs/003-geracao-documentos-ia/contracts/generate.md`. Os contratos abaixo especificam particularidades do tipo `relatorio_individual`.

---

## POST /api/documents/generate (tipo: relatorio_individual)

Gera o rascunho do Relatório Individual de um aluno em um período.

**Auth**: obrigatório

### Corpo

```json
{
  "tipo": "relatorio_individual",
  "turma_id": "uuid",
  "aluno_id": "uuid",
  "periodo": {
    "inicio": "2025-08-01",
    "fim": "2025-08-31"
  }
}
```

**Obs**: Os dados pedagógicos (objetivos, atividades, mediações, BNCC) são lidos do banco via `registros_aluno` — o professor não os envia no corpo da requisição. O frontend valida a existência desses registros antes de habilitar o botão "Gerar".

### Resposta 201 Created

```json
{
  "rascunho_id": "uuid",
  "tipo": "relatorio_individual",
  "status": "rascunho",
  "conteudo_gerado": "Ao longo do mês de agosto, foram trabalhadas...",
  "bncc_refs": ["EI03EO01", "EI03EO02"],
  "gerado_em": "2025-09-01T09:10:00Z"
}
```

### Validações específicas

| Condição | Código | Mensagem |
|----------|--------|----------|
| `aluno_id` sem registros no período | 422 | `"Sem registros de desenvolvimento para o aluno no período informado"` |
| `aluno_id` sem nenhum `bncc_ref` associado | 422 | `"Ao menos uma competência BNCC deve estar vinculada antes de gerar"` |
| Professor não regente da turma | 403 | `"Acesso negado: você não é regente desta turma"` |
| Já existe rascunho não-finalizado para aluno+período | 200 | (retorna o rascunho existente, sem criar novo) |

---

## GET /api/documents/rascunhos

Lista rascunhos ativos (não finalizados) do professor autenticado.

**Auth**: obrigatório

### Query params

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `aluno_id` | uuid | não | Filtra por aluno |
| `tipo` | string | não | Filtra por tipo de documento |
| `status` | string | não | `rascunho \| em_revisao \| finalizado` |

### Resposta 200 OK

```json
[
  {
    "id": "uuid",
    "tipo": "relatorio_individual",
    "status": "em_revisao",
    "aluno_id": "uuid",
    "turma_id": "uuid",
    "periodo_inicio": "2025-08-01",
    "periodo_fim": "2025-08-31",
    "conteudo_gerado": "...",
    "conteudo_editado": "... (versão editada pelo professor)",
    "bncc_refs": ["EI03EO01"],
    "gerado_em": "2025-09-01T09:10:00Z"
  }
]
```

---

## PATCH /api/documents/rascunhos/:rascunho_id

Salva edições do professor (autosave). Idêntico ao contrato genérico de 003.

**Auth**: obrigatório

### Corpo

```json
{
  "conteudo_editado": "Texto revisado...",
  "status": "em_revisao"
}
```

### Resposta 200 OK

```json
{
  "rascunho_id": "uuid",
  "status": "em_revisao",
  "atualizado_em": "2025-09-01T09:25:00Z"
}
```

### Validações específicas

| Condição | Código | Mensagem |
|----------|--------|----------|
| Rascunho já finalizado | 409 | `"Este relatório já foi finalizado e não pode ser editado"` |
| Rascunho não pertence ao professor autenticado | 403 | `"Acesso negado"` |

---

## POST /api/documents/rascunhos/:rascunho_id/finalizar

Finaliza o rascunho criando uma `VersaoDocumento` imutável.

**Auth**: obrigatório

### Corpo

```json
{
  "conteudo_final": "Texto a ser registrado como versão oficial"
}
```

### Resposta 201 Created

```json
{
  "versao_id": "uuid",
  "rascunho_id": "uuid",
  "tipo": "relatorio_individual",
  "finalizado_em": "2025-09-01T10:00:00Z"
}
```

### Validações específicas

| Condição | Código | Mensagem |
|----------|--------|----------|
| Já finalizado por outro professor (concorrência) | 409 | `"Este relatório já foi finalizado"` |
| `bncc_refs` vazio no rascunho | 422 | `"Ao menos uma competência BNCC é obrigatória para finalizar"` |
| `conteudo_final` vazio | 422 | `"O conteúdo final não pode estar vazio"` |

---

## GET /api/documents/rascunhos/:rascunho_id/export

Solicita exportação do rascunho ou versão finalizada. Retorna token de download efêmero (10 min).

**Auth**: obrigatório

### Query params

| Param | Tipo | Obrigatório |
|-------|------|-------------|
| `formato` | `docx \| pdf` | sim |

### Resposta 200 OK

```json
{
  "download_url": "/api/downloads/3f7a2b1c-...",
  "expira_em": "2025-09-01T10:10:00Z",
  "formato": "pdf"
}
```

> **Nota RF-006**: O frontend chama este endpoint e abre `download_url` via `window.open(url, '_blank')` diretamente na ação do botão — sem redirect de página.

---

## GET /api/alunos/:aluno_id/documentos?tipo=relatorio_individual

Histórico de relatórios finalizados de um aluno (RF-016, RF-017).

**Auth**: obrigatório

### Resposta 200 OK

```json
{
  "data": [
    {
      "versao_id": "uuid",
      "tipo": "relatorio_individual",
      "periodo_inicio": "2025-08-01",
      "periodo_fim": "2025-08-31",
      "finalizado_em": "2025-09-01T10:00:00Z",
      "professor_nome": "Maria Silva",
      "bncc_refs": ["EI03EO01", "EI03EO02"]
    }
  ],
  "total": 3,
  "page": 1,
  "per_page": 20
}
```

Ordenado por `finalizado_em DESC` (mais recente primeiro — RF-017).
