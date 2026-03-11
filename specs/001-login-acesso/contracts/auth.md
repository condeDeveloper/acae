# Contrato: Autenticação

**Base**: `/api/auth`  
**Auth**: rotas públicas (sem JWT) exceto onde indicado

---

## GET /api/auth/me

Retorna o `Professor` autenticado com base no JWT. Usado pelo frontend após login para carregar os dados do professor.

**Auth**: JWT obrigatório

### Response 200

```json
{
  "id": "uuid",
  "nome": "Ana Lima",
  "email": "ana.lima@escola.edu.br",
  "papel": "professor",
  "escola": "EMEF João Paulo II",
  "status": "ativo"
}
```

### Response 401

```json
{ "error": "Token inválido ou expirado" }
```

### Response 403

```json
{ "error": "Professor não encontrado ou inativo" }
```

---

## POST /api/auth/logout

Invalida a sessão server-side (usado complementarmente ao `supabase.auth.signOut()` no frontend). Registra o evento de logout no log de auditoria.

**Auth**: JWT obrigatório (para registrar quem fez logout)

### Response 200

```json
{ "message": "Sessão encerrada" }
```

---

## Regras de segurança

- O login de credenciais (e-mail + senha) é feito **diretamente no Supabase Auth** pelo cliente JS — não passa pelo backend Fastify
- O backend apenas valida JWTs emitidos pelo Supabase (nunca gera tokens próprios)
- Rate limiting: `POST /api/auth/me` — 5 requisições por 15 minutos por IP (via `@fastify/rate-limit`)
- Logs de falha nunca incluem e-mail ou nome do professor
- Resposta de erro é sempre genérica: nunca indica se o e-mail existe ou não
