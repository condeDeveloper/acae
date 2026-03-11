# Contrato: Geração de Documentos Pedagógicos

**Base URL**: `https://api.acae.app` | **Auth**: Bearer JWT (exceto `/api/downloads/:token`)

---

## POST /api/documents/generate

Gera um documento pedagógico usando IA Gemini. Cria ou substitui o rascunho ativo do aluno/turma/tipo no período.

**Auth**: obrigatório (`attachProfessor` hook)

### Corpo da requisição

```json
{
  "tipo": "portfolio_semanal",
  "turma_id": "uuid",
  "aluno_id": "uuid",
  "periodo": {
    "inicio": "2025-09-01",
    "fim": "2025-09-07"
  }
}
```

**Tipos válidos**: `portfolio_semanal | relatorio_individual | atividade_adaptada | resumo_pedagogico`

Para `atividade_adaptada`:
```json
{
  "tipo": "atividade_adaptada",
  "turma_id": "uuid",
  "aluno_ids": ["uuid", "uuid"],
  "objetivo": "Explorar conceitos de quantidade até 10",
  "bncc_ref": "EI03ET01"
}
```

Para `resumo_pedagogico`:
```json
{
  "tipo": "resumo_pedagogico",
  "turma_id": "uuid",
  "periodo": {
    "inicio": "2025-08-01",
    "fim": "2025-08-31"
  }
}
```

### Resposta 201 Created

```json
{
  "rascunho_id": "uuid",
  "tipo": "portfolio_semanal",
  "status": "rascunho",
  "conteudo_gerado": "Texto gerado pela IA...",
  "bncc_refs": ["EI03EO01", "EI03EO02"],
  "gerado_em": "2025-09-07T14:23:01Z"
}
```

### Erros

| Código | Motivo |
|--------|--------|
| 400    | `tipo` inválido, campos obrigatórios ausentes, `aluno_id` não pertence à `turma_id` |
| 403    | Professor não é regente da turma |
| 422    | Sem registros de aluno no período para gerar documento |
| 429    | Cota diária de IA esgotada (1 500 req/dia) |
| 504    | Timeout da API Gemini (> 30 s) |

---

## PATCH /api/documents/rascunhos/:rascunho_id

Edita o conteúdo do rascunho antes de finalizar.

**Auth**: obrigatório

### Corpo

```json
{
  "conteudo_editado": "Texto revisado pelo professor...",
  "status": "em_revisao"
}
```

### Resposta 200 OK

```json
{
  "rascunho_id": "uuid",
  "status": "em_revisao",
  "conteudo_editado": "...",
  "atualizado_em": "2025-09-07T14:30:00Z"
}
```

---

## POST /api/documents/rascunhos/:rascunho_id/finalizar

Finaliza o rascunho e cria uma `VersaoDocumento` imutável.

**Auth**: obrigatório

### Corpo

```json
{
  "conteudo_final": "Texto final (pode ser igual ao gerado ou ao editado)"
}
```

### Resposta 201 Created

```json
{
  "versao_id": "uuid",
  "rascunho_id": "uuid",
  "finalizado_em": "2025-09-07T14:45:00Z"
}
```

---

## GET /api/documents/rascunhos/:rascunho_id/export

Solicita exportação de um rascunho ou versão finalizada. Retorna um token de download efêmero.

**Auth**: obrigatório

### Query params

| Param   | Tipo                | Obrigatório | Descrição |
|---------|---------------------|-------------|-----------|
| formato | `docx` \| `pdf`    | sim         | Formato de exportação |

### Resposta 200 OK

```json
{
  "download_url": "/api/downloads/3f7a2b1c-4521-4a9f-9ab2-9f0a1b2c3d4e",
  "expira_em": "2025-09-07T15:00:00Z",
  "formato": "pdf"
}
```

---

## GET /api/downloads/:token

Baixa o arquivo. **Não requer JWT** — o token efêmero é a única autorização.

| Parâmetro | Tipo   | Descrição |
|-----------|--------|-----------|
| token     | UUID v4 | Token efêmero retornado por `/export` |

### Resposta 200 OK

```
Content-Type: application/pdf  (ou application/vnd.openxmlformats-officedocument.wordprocessingml.document)
Content-Disposition: attachment; filename="portfolio-semanal-2025-09-07.pdf"
```

Corpo: bytes do arquivo gerado.

**Token é consumido ao baixar** — uso único. Expiração automática em 10 min.

### Erros

| Código | Motivo |
|--------|--------|
| 404    | Token não existe (já usado ou nunca criado) |
| 410    | Token expirado |

---

## GET /api/alunos/:aluno_id/documentos

Lista as versões finalizadas de documentos de um aluno.

**Auth**: obrigatório

### Query params

| Param | Tipo   | Padrão | Descrição |
|-------|--------|--------|-----------|
| page  | int    | 1      | Paginação (20 itens/página) |
| tipo  | string | —      | Filtro por tipo de documento |

### Resposta 200 OK

```json
{
  "data": [
    {
      "versao_id": "uuid",
      "tipo": "portfolio_semanal",
      "finalizado_em": "2025-09-07T14:45:00Z",
      "bncc_refs": ["EI03EO01"]
    }
  ],
  "total": 12,
  "page": 1,
  "per_page": 20
}
```
