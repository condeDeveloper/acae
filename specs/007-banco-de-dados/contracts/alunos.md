# Contrato: Gerenciamento de Alunos

**Rota**: `GET /api/turmas/:turmaId/alunos` e `POST /api/turmas/:turmaId/alunos`  
**Auth**: JWT obrigatório — `Authorization: Bearer <token>`  
**Princípio**: Isolamento LGPD — apenas alunos das turmas do professor autenticado

---

## GET /api/turmas/:turmaId/alunos

Retorna todos os alunos de uma turma. Requer que a turma pertença ao professor autenticado.

### Request

```http
GET /api/turmas/uuid-da-turma/alunos?status=ativo HTTP/1.1
Authorization: Bearer <jwt>
```

**Query params (opcionais)**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `status` | `ativo\|inativo\|excluido` | Filtrar por status (default: ativo) |

### Response 200

```json
{
  "data": [
    {
      "id": "uuid",
      "nome": "João Silva",
      "data_nascimento": "2018-05-20",
      "necessidades_educacionais": "TDAH — requer atividades com foco em blocos curtos",
      "status": "ativo",
      "turma_id": "uuid",
      "created_at": "2026-03-01T10:00:00Z"
    }
  ],
  "total": 1
}
```

### Response 403

```json
{ "error": "Turma não pertence ao professor autenticado" }
```

---

## POST /api/turmas/:turmaId/alunos

Cadastra um novo aluno na turma especificada.

### Request

```http
POST /api/turmas/uuid-da-turma/alunos HTTP/1.1
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "nome": "Maria Souza",
  "data_nascimento": "2017-11-03",
  "necessidades_educacionais": "Dislexia — apoio com leitura oral"
}
```

**Body**

| Campo | Tipo | Obrig. | Validação |
|-------|------|--------|-----------|
| `nome` | String | ✅ | 2–200 chars |
| `data_nascimento` | String (YYYY-MM-DD) | ✅ | Data válida, não futura |
| `necessidades_educacionais` | String | ❌ | Máx. 2000 chars |

### Response 201

```json
{
  "id": "uuid",
  "nome": "Maria Souza",
  "data_nascimento": "2017-11-03",
  "necessidades_educacionais": "Dislexia — apoio com leitura oral",
  "status": "ativo",
  "turma_id": "uuid",
  "created_at": "2026-03-10T14:30:00Z"
}
```

### Response 400

```json
{
  "error": "Dados inválidos",
  "details": [
    { "field": "data_nascimento", "message": "Data de nascimento não pode ser no futuro" }
  ]
}
```

---

## DELETE /api/alunos/:alunoId (LGPD — exclusão de dados)

Marca o aluno como `excluido` (soft-delete). Documentos finalizados existentes são **preservados** mas não vinculados ao identificador pessoal do aluno (LGPD — dissociação).

### Response 200

```json
{ "message": "Dados do aluno excluídos conforme solicitação LGPD" }
```

> **Nota**: O nome e dados pessoais do aluno são anonimizados. O histórico de documentos finalizados é preservado com referência ao `aluno_id` mas o campo `nome` é sobrescrito com `[DADOS REMOVIDOS]`.

---

## Regras de negócio

- Professor não pode acessar alunos de turmas que não sejam suas
- Alunos com `status = excluido` não aparecem nas listagens (exceto com `?status=excluido`)
- Novos documentos não podem ser gerados para alunos `excluidos` ou `inativos`
- Nomes de alunos nunca são registrados em logs — apenas UUID nos audit logs
