# Contrato: Registros do Aluno por Período

**Rota**: `GET /api/alunos/:alunoId/registros` e `POST /api/alunos/:alunoId/registros`  
**Auth**: JWT obrigatório — `Authorization: Bearer <token>`  
**Princípio**: Registros são a base de dados para geração de documentos pela IA (Princípio II)

---

## POST /api/alunos/:alunoId/registros

Cria ou atualiza o registro pedagógico de um aluno em um período específico.

### Request

```http
POST /api/alunos/uuid-do-aluno/registros HTTP/1.1
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "periodo": "2026-semana-10",
  "objetivos": "Desenvolver autonomia na leitura de textos curtos",
  "atividades": "Atividade com fichas de leitura; jogo da memória com sílabas",
  "mediacoes": "Apoio individualizado nos 15 minutos iniciais de leitura",
  "ocorrencias": null,
  "bncc_refs": ["EF01LP01", "EF01LP02"]
}
```

**Body**

| Campo | Tipo | Obrig. | Validação |
|-------|------|--------|-----------|
| `periodo` | String | ✅ | Formato `YYYY-semana-NN` ou `YYYY-MM` |
| `objetivos` | String | ✅ | 10–5000 chars |
| `atividades` | String | ✅ | 10–5000 chars |
| `mediacoes` | String | ❌ | Máx. 3000 chars |
| `ocorrencias` | String | ❌ | Máx. 3000 chars |
| `bncc_refs` | String[] | ✅ | Mín. 1 elemento; códigos BNCC válidos |

### Response 201

```json
{
  "id": "uuid",
  "periodo": "2026-semana-10",
  "objetivos": "Desenvolver autonomia na leitura de textos curtos",
  "atividades": "Atividade com fichas de leitura; jogo da memória com sílabas",
  "mediacoes": "Apoio individualizado nos 15 minutos iniciais de leitura",
  "ocorrencias": null,
  "bncc_refs": ["EF01LP01", "EF01LP02"],
  "aluno_id": "uuid",
  "turma_id": "uuid",
  "created_at": "2026-03-10T14:30:00Z"
}
```

### Response 400 — Sem BNCC (Princípio III)

```json
{
  "error": "Vínculo BNCC obrigatório",
  "message": "Informe ao menos uma competência ou habilidade da BNCC para continuar."
}
```

### Response 409 — Registro já existe para o período

```json
{
  "error": "Já existe um registro para este aluno neste período",
  "existing_id": "uuid",
  "suggestion": "Use PATCH /api/registros/:id para atualizar"
}
```

---

## GET /api/alunos/:alunoId/registros

Retorna todos os registros pedagógicos de um aluno.

### Response 200

```json
{
  "data": [
    {
      "id": "uuid",
      "periodo": "2026-semana-10",
      "bncc_refs": ["EF01LP01", "EF01LP02"],
      "created_at": "2026-03-10T14:30:00Z",
      "updated_at": "2026-03-10T15:00:00Z"
    }
  ],
  "total": 1
}
```

---

## Regras de negócio

- `bncc_refs` é obrigatório e non-empty — validação na camada de serviço E no banco (CHECK constraint)
- Um único registro por `(aluno_id, periodo)` — Unique constraint no banco
- O registro é a entrada obrigatória para `POST /api/documents/generate`
- Registros não podem ser criados para alunos `excluidos`
