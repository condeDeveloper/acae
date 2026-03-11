# Contrato: Gerenciamento de Turmas

**Rota**: `GET /api/turmas` e `POST /api/turmas`  
**Auth**: JWT obrigatório — `Authorization: Bearer <token>`  
**Princípio**: Isolamento por professor (apenas turmas do professor autenticado)

---

## GET /api/turmas

Retorna todas as turmas do professor autenticado.

### Request

```http
GET /api/turmas?ano_letivo=2026&status=ativa HTTP/1.1
Authorization: Bearer <jwt>
```

**Query params (opcionais)**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `ano_letivo` | Int | Filtrar por ano letivo (ex: 2026) |
| `status` | `ativa\|inativa` | Filtrar por status |

### Response 200

```json
{
  "data": [
    {
      "id": "uuid",
      "nome": "3º Ano A",
      "ano_letivo": 2026,
      "turno": "manha",
      "escola": "EMEF João Paulo II",
      "status": "ativa",
      "total_alunos": 24,
      "created_at": "2026-03-01T10:00:00Z"
    }
  ],
  "total": 1
}
```

### Response 401

```json
{ "error": "Token inválido ou expirado" }
```

---

## POST /api/turmas

Cria uma nova turma para o professor autenticado.

### Request

```http
POST /api/turmas HTTP/1.1
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "nome": "3º Ano B",
  "ano_letivo": 2026,
  "turno": "tarde",
  "escola": "EMEF João Paulo II"
}
```

**Body (todos obrigatórios)**

| Campo | Tipo | Validação |
|-------|------|-----------|
| `nome` | String | 1–100 chars |
| `ano_letivo` | Int | 2000–2100 |
| `turno` | `manha\|tarde\|integral` | Enum |
| `escola` | String | 1–200 chars |

### Response 201

```json
{
  "id": "uuid",
  "nome": "3º Ano B",
  "ano_letivo": 2026,
  "turno": "tarde",
  "escola": "EMEF João Paulo II",
  "status": "ativa",
  "professor_id": "uuid",
  "created_at": "2026-03-10T14:30:00Z"
}
```

### Response 400

```json
{
  "error": "Dados inválidos",
  "details": [
    { "field": "turno", "message": "Deve ser: manha, tarde ou integral" }
  ]
}
```

---

## Regras de negócio

- `professor_id` é sempre o id do professor autenticado (do JWT) — não aceito no body
- Professor só pode ver e criar turmas vinculadas a si
- Coordenador pode ver todas as turmas (leitura), mas não pode criar em nome de outro professor
