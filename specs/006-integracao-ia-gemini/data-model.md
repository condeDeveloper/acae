# Modelo de Dados: Integração com Google Gemini 2.0 Flash

**Branch**: `006-integracao-ia-gemini` | **Data**: 2026-03-10

---

## Entidades

### 1. `ai_quota_usage` — Controle de cota diária

Rastreia o consumo diário de requisições à API do Gemini para garantir respeito ao limite de 1.500/dia.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `id` | UUID | ✅ | Identificador único |
| `date` | DATE | ✅ | Data de referência (YYYY-MM-DD, horário de Brasília) |
| `request_count` | INTEGER | ✅ | Número de requisições realizadas no dia |
| `last_request_at` | TIMESTAMPTZ | ✅ | Timestamp da última requisição |
| `created_at` | TIMESTAMPTZ | ✅ | Criação do registro |
| `updated_at` | TIMESTAMPTZ | ✅ | Última atualização |

**Restrições**:
- `date` é UNIQUE — um registro por dia
- `request_count` nunca negativo
- `request_count >= 1350` dispara aviso de cota próxima (90%)

---

### 2. `document_drafts` — Rascunhos gerados pela IA

Armazena os rascunhos gerados pelo Gemini antes da revisão e finalização pelo professor.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `id` | UUID | ✅ | Identificador único |
| `document_type` | ENUM | ✅ | `portfolio_semanal`, `relatorio_individual`, `atividade_adaptada`, `resumo_pedagogico` |
| `status` | ENUM | ✅ | `rascunho`, `em_revisao`, `finalizado` |
| `generated_content` | TEXT | ✅ | Texto gerado pelo Gemini (íntegro, sem truncamento) |
| `edited_content` | TEXT | ❌ | Texto após edição do professor (null se não editado) |
| `final_content` | TEXT | ❌ | Conteúdo final imutável após finalização |
| `teacher_id` | UUID | ✅ | FK → professores (quem gerou) |
| `student_id` | UUID | ❌ | FK → alunos (null para resumo de turma) |
| `class_id` | UUID | ✅ | FK → turmas |
| `period` | VARCHAR(20) | ✅ | Ex: `2026-semana-10`, `2026-03` |
| `bncc_refs` | TEXT[] | ✅ | Array de códigos BNCC (mín. 1) |
| `prompt_hash` | VARCHAR(64) | ✅ | SHA-256 do prompt enviado (auditoria, sem PII) |
| `generation_duration_ms` | INTEGER | ❌ | Tempo de resposta da API em ms |
| `finalized_at` | TIMESTAMPTZ | ❌ | Timestamp de finalização (null até finalizar) |
| `created_at` | TIMESTAMPTZ | ✅ | Criação |
| `updated_at` | TIMESTAMPTZ | ✅ | Última atualização |

**Restrições e Regras**:
- `status = 'finalizado'` → `final_content` obrigatório e `finalized_at` preenchido
- `status = 'finalizado'` → campos `generated_content`, `edited_content`, `final_content` tornam-se READ-ONLY (imutabilidade — Princípio V)
- `bncc_refs` deve ter ao menos 1 elemento antes de gerar (Princípio III)
- `prompt_hash` é SHA-256 do prompt **após anonimização** — nunca contém PII (Princípio IV)

**Transições de estado válidas**:
```
rascunho → em_revisao → finalizado
rascunho → finalizado (sem edição)
```
Não existe transição retrógrada — status nunca volta.

---

### 3. `document_versions` — Histórico imutável de documentos finalizados

Cada finalização cria um registro de versão. Documentos finalizados nunca são sobrescritos — nova versão exige nova geração (Princípio V).

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `id` | UUID | ✅ | Identificador único |
| `draft_id` | UUID | ✅ | FK → `document_drafts.id` |
| `version_number` | INTEGER | ✅ | Versão incremental por aluno+tipo+período |
| `content` | TEXT | ✅ | Conteúdo finalizado (cópia imutável) |
| `teacher_id` | UUID | ✅ | FK → professores |
| `student_id` | UUID | ❌ | FK → alunos (null para resumo de turma) |
| `class_id` | UUID | ✅ | FK → turmas |
| `period` | VARCHAR(20) | ✅ | Período de referência |
| `document_type` | ENUM | ✅ | Tipo do documento |
| `bncc_refs` | TEXT[] | ✅ | Referências BNCC no momento da finalização |
| `finalized_at` | TIMESTAMPTZ | ✅ | Timestamp exato de finalização |
| `created_at` | TIMESTAMPTZ | ✅ | Criação do registro de versão |

**Restrições**:
- Registros são INSERT-ONLY — nunca UPDATE ou DELETE
- `version_number` auto-incrementado por `(teacher_id, student_id, document_type, period)`

---

## Relacionamentos

```
professores ──── document_drafts ──── alunos
                      │
                      ├──── document_versions (histórico imutável)
                      └──── ai_quota_usage (por data, não por draft)

turmas ──────── document_drafts
```

---

## Dados que NUNCA entram no banco relacionados à IA

Para conformidade com LGPD (Princípio IV):

- O prompt enviado ao Gemini **não é armazenado** — apenas o `prompt_hash` (SHA-256)
- A resposta bruta do Gemini é armazenada em `generated_content` — mas já foi construída sem PII
- Logs do servidor **não** contêm `student_id` em texto plano nos registros de chamada à API
