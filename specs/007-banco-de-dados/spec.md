# Especificação de Funcionalidade: Banco de Dados — PostgreSQL via Supabase

**Feature Branch**: `007-banco-de-dados`
**Criado em**: 10 de março de 2026
**Status**: Rascunho
**Entrada**: "Banco de dados PostgreSQL hospedado no Supabase com Prisma ORM para o Portal do Professor (ACAE)"

---

## Contexto e Motivação

O Portal do Professor requer um banco de dados relacional para armazenar professores, turmas, alunos, vínculos BNCC, contextos pedagógicos, registros por período e o histórico imutável de documentos gerados. O Supabase foi escolhido como provedor por oferecer PostgreSQL gerenciado gratuitamente, com infraestrutura na região de São Paulo (conformidade com LGPD), painel visual de administração e suporte a Row Level Security (RLS) para isolamento de dados por professor.

**Princípios da Constituição que regem esta spec:**
- **Princípio IV** (LGPD): dados de alunos são sensíveis; acesso isolado por papel (professor/coordenador); sem PII em logs
- **Princípio V** (Fidelidade): documentos finalizados são imutáveis; histórico preservado em versões INSERT-ONLY
- **Princípio III** (BNCC): estrutura do banco deve garantir vínculo BNCC obrigatório para cada documento gerado

---

## Histórias de Usuário & Testes

### História de Usuário 1 — Professor acessa apenas seus próprios dados (Prioridade: P1)

Um professor faz login e acessa somente as turmas e alunos que ele mesmo cadastrou. Não consegue ver turmas ou alunos de outros professores. Um coordenador, ao fazer login, tem acesso a todos os registros da escola.

**Por que esta prioridade**: Sem isolamento de dados por papel, há violação imediata da LGPD e do Princípio IV.

**Teste independente**: Criar dois professores com turmas distintas, logar como cada um e verificar que apenas as próprias turmas e alunos aparecem. Logar como coordenador e verificar acesso a todos.

**Cenários de Aceitação**:

1. **Dado** que o professor A está autenticado, **Quando** consulta a lista de turmas, **Então** vê apenas as turmas onde ele é o professor responsável.
2. **Dado** que o professor A tenta acessar um aluno de uma turma do professor B, **Quando** faz a requisição, **Então** o sistema nega o acesso com erro de permissão.
3. **Dado** que um coordenador está autenticado, **Quando** consulta turmas e alunos, **Então** vê todos os registros da escola.
4. **Dado** que um usuário não autenticado tenta acessar qualquer dado, **Quando** faz a requisição, **Então** o sistema nega o acesso com erro de autenticação.

---

### História de Usuário 2 — Cadastro e consulta de alunos com necessidades educacionais (Prioridade: P1)

O professor cadastra um aluno com suas informações pedagógicas relevantes (necessidades educacionais especiais, ano letivo, turma). Consegue consultar e atualizar os dados do aluno ao longo do ano. O sistema preserva o histórico de alterações relevantes.

**Por que esta prioridade**: Os alunos são o coração do sistema — sem eles, nenhum documento pode ser gerado.

**Teste independente**: Cadastrar um aluno, consultá-lo, atualizar uma informação e verificar que a atualização foi salva corretamente.

**Cenários de Aceitação**:

1. **Dado** que o professor está autenticado, **Quando** cadastra um novo aluno com nome, data de nascimento, turma e necessidades educacionais, **Então** o aluno é salvo e aparece na lista da turma.
2. **Dado** que um aluno foi cadastrado, **Quando** o professor atualiza suas necessidades educacionais, **Então** a atualização é salva e o valor anterior pode ser consultado no histórico.
3. **Dado** que um aluno muda de turma, **Quando** o professor atualiza a turma do aluno, **Então** o vínculo anterior é preservado no histórico e o novo vínculo passa a ser o ativo.

---

### História de Usuário 3 — Vínculo de BNCC obrigatório antes de gerar documento (Prioridade: P1)

Antes de gerar qualquer documento pedagógico, o professor deve ter vinculado ao menos uma competência ou habilidade da BNCC ao registro do aluno ou ao contexto da turma no período. O banco deve garantir essa restrição em nível de dados.

**Por que esta prioridade**: Sem vínculo BNCC, a geração de documentos é bloqueada (Princípio III). A validação começa no banco.

**Teste independente**: Tentar registrar um documento sem vínculo BNCC e verificar que o banco rejeita. Vincular uma competência BNCC e tentar novamente — deve funcionar.

**Cenários de Aceitação**:

1. **Dado** que um registro de aluno não tem nenhuma competência BNCC vinculada, **Quando** o sistema tenta criar um rascunho de documento para ele, **Então** a operação é bloqueada com erro de validação.
2. **Dado** que o professor vincula ao menos uma competência BNCC ao registro do aluno, **Quando** o sistema tenta criar o rascunho, **Então** a operação é permitida.
3. **Dado** que uma competência BNCC existe no banco, **Quando** o professor consulta as competências disponíveis, **Então** ve código, descrição e área de conhecimento de cada uma.

---

### História de Usuário 4 — Histórico imutável de documentos finalizados (Prioridade: P1)

Após um professor finalizar um documento, o conteúdo é gravado como uma versão imutável. Novas alterações criam novas versões — o documento original nunca é sobrescrito. O professor pode consultar todas as versões anteriores.

**Por que esta prioridade**: Documentos pedagógicos são registros oficiais. Sobrescrever viola o Princípio V e pode ter implicações legais.

**Teste independente**: Finalizar um documento, tentar alterar seu conteúdo diretamente e verificar que a alteração é rejeitada. Gerar uma nova versão e verificar que ambas coexistem no histórico.

**Cenários de Aceitação**:

1. **Dado** que um documento foi finalizado, **Quando** qualquer operação tenta modificar seu conteúdo diretamente, **Então** o banco rejeita a operação — o conteúdo finalizado é READ-ONLY.
2. **Dado** que um professor quer alterar um documento já finalizado, **Quando** aciona uma nova geração para o mesmo aluno/período/tipo, **Então** uma nova versão é criada com número incremental, preservando a versão anterior.
3. **Dado** que existem múltiplas versões de um documento para um aluno, **Quando** o professor consulta o histórico, **Então** vê todas as versões com data de finalização, número da versão e professor responsável.

---

### História de Usuário 5 — Registro de contexto pedagógico por período (Prioridade: P2)

O professor registra o contexto pedagógico da turma para uma semana ou mês específico: metodologia aplicada, objetivos do período, dinâmica de grupo. Esse contexto é usado como base para a geração de documentos do período.

**Por que esta prioridade**: O contexto pedagógico enriquece a geração de IA, mas documentos podem ser gerados com informações mínimas do aluno, tornando esta storia menos crítica que as anteriores.

**Teste independente**: Cadastrar um contexto pedagógico para uma turma em uma semana específica e verificar que aparece disponível para seleção na geração de documentos daquele período.

**Cenários de Aceitação**:

1. **Dado** que o professor está autenticado, **Quando** cadastra um contexto pedagógico para a turma na semana 10 de 2026, **Então** o contexto é salvo e vinculado à turma e ao período.
2. **Dado** que existe um contexto pedagógico para uma turma em um período, **Quando** o professor inicia a geração de um documento para um aluno daquela turma naquele período, **Então** o contexto está disponível automaticamente como dado de entrada.
3. **Dado** que não existe contexto pedagógico cadastrado para um período, **Quando** o professor gera um documento, **Então** o sistema procede sem contexto de turma (não bloqueia a geração).

---

### Casos de Borda

- O que acontece se o professor tentar excluir um aluno que tem documentos finalizados? → A exclusão deve ser bloqueada ou o aluno marcado como inativo sem apagar o histórico (LGPD — retenção obrigatória).
- O que acontece se a cota diária de requisições ao Gemini zerar e o servidor reiniciar? → O contador é persistido no banco; ao reiniciar, o servidor lê o valor atual do banco antes de aceitar novas requisições.
- O que acontece se o mesmo professor for removido da escola mas seus alunos continuarem ativos? → Os registros e documentos gerados por ele permanecem intactos; apenas o acesso ativo é desativado.

---

## Requisitos

### Requisitos Funcionais

- **RF-001**: O banco DEVE armazenar professores com: nome completo, email único, papel (professor/coordenador), escola e status (ativo/inativo).
- **RF-002**: O banco DEVE armazenar turmas com: nome, ano letivo, turno, escola e professor responsável vinculado.
- **RF-003**: O banco DEVE armazenar alunos com: nome, data de nascimento, necessidades educacionais especiais, turma atual e status.
- **RF-004**: O banco DEVE armazenar grupos de alunos dentro de uma turma para atividades coletivas.
- **RF-005**: O banco DEVE armazenar competências BNCC com: código único, descrição, área de conhecimento e nível educacional.
- **RF-006**: O banco DEVE armazenar vínculos entre alunos/turmas e competências BNCC por período.
- **RF-007**: O banco DEVE garantir que nenhum rascunho de documento seja criado sem ao menos um vínculo BNCC (restrição em nível de dados).
- **RF-008**: O banco DEVE armazenar contextos pedagógicos por turma e período.
- **RF-009**: O banco DEVE armazenar registros individuais do aluno por período: objetivos, atividades, mediações, ocorrências.
- **RF-010**: O banco DEVE armazenar rascunhos de documentos com: tipo, status (rascunho/em revisão/finalizado), conteúdo gerado, conteúdo editado e conteúdo final.
- **RF-011**: O banco DEVE garantir que documentos finalizados tenham seu conteúdo imutável (sem UPDATE no conteúdo após finalização).
- **RF-012**: O banco DEVE armazenar versões históricas de documentos finalizados de forma INSERT-ONLY.
- **RF-013**: O banco DEVE armazenar o controle de cota diária de requisições ao Gemini (contador por data).
- **RF-014**: O banco DEVE aplicar Row Level Security (RLS) para que professores acessem apenas seus próprios dados.
- **RF-015**: O banco DEVE permitir que coordenadores acessem todos os registros da escola via política de RLS.
- **RF-016**: O banco NÃO DEVE armazenar o prompt enviado ao Gemini em texto plano — apenas o hash SHA-256 do prompt anonimizado.
- **RF-017**: O banco DEVE registrar timestamps com fuso horário (timestamptz) em todos os registros.
- **RF-018**: O banco DEVE suportar exclusão de dados de aluno sob solicitação (LGPD), mantendo os documentos finalizados dissociados do identificador pessoal.

### Entidades Principais

- **Professor**: Usuário do sistema com papel definido (professor ou coordenador); acessa apenas seus dados.
- **Turma**: Agrupamento de alunos sob responsabilidade de um professor em um ano letivo.
- **Aluno**: Pessoa atendida pela escola; possui necessidades educacionais especiais registradas; vinculado a uma turma ativa.
- **Grupo**: Subconjunto de alunos de uma turma para atividades adaptadas coletivas.
- **Competência BNCC**: Código e descrição de competência ou habilidade da Base Nacional Comum Curricular.
- **Contexto Pedagógico**: Registro de metodologia e objetivos da turma por período (semana ou mês).
- **Registro do Aluno**: Dados pedagógicos do aluno em um período específico (objetivos, atividades, mediações, ocorrências).
- **Rascunho de Documento**: Texto gerado pela IA antes da finalização; editável pelo professor.
- **Versão de Documento**: Cópia imutável do documento após finalização; representa o histórico oficial.
- **Controle de Cota de IA**: Contador de requisições diárias à API do Gemini; persistido para sobreviver reinicializações.

---

## Critérios de Sucesso

1. **Isolamento de dados**: 100% das consultas de professores retornam apenas seus próprios registros — nenhum dado de outro professor é acessível.
2. **Bloqueio sem BNCC**: 100% das tentativas de criar rascunho sem vínculo BNCC são rejeitadas pelo banco antes de chegar à IA.
3. **Imutabilidade**: 0 documentos finalizados são alterados diretamente — toda mudança gera uma nova versão.
4. **Histórico completo**: 100% dos documentos finalizados têm ao menos uma versão histórica consultável.
5. **Controle de cota persistido**: O contador diário de requisições ao Gemini sobrevive a reinicializações do servidor sem perda de dados.
6. **Conformidade LGPD**: Nenhum nome real de aluno aparece no hash do prompt; dados de aluno excluídos por solicitação não afetam o histórico de documentos finalizados.
7. **Disponibilidade**: Banco disponível para todas as operações do portal em horário escolar (7h–19h, horário de Brasília) — garantia do Supabase com plano gratuito.

---

## Premissas e Dependências

- **Premissa**: O Supabase oferece PostgreSQL com RLS e região São Paulo disponível no plano gratuito (validado em março de 2026).
- **Premissa**: O volume esperado de dados (< 500MB) cabe no plano gratuito do Supabase.
- **Dependência**: Spec de Login (`001-login`) — a autenticação define como os papéis (professor/coordenador) são atribuídos.
- **Dependência**: Spec de Integração com IA (`006-integracao-ia-gemini`) — define as entidades `ai_quota_usage` e `document_drafts` já detalhadas em `data-model.md`.
- **Dependência**: Spec de Geração de Documentos (`003-geracao-documentos-ia`) — define os tipos de documento e o fluxo de finalização.
