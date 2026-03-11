<!--
RELATÓRIO DE SINCRONIZAÇÃO
===========================
Alteração de versão: (nenhuma) → 1.0.0 (ratificação inicial da constituição)
Princípios modificados: N/A — criação inicial
Seções adicionadas:
  - Princípios Fundamentais (I–V)
  - Requisitos de Segurança e Privacidade
  - Fluxo de Desenvolvimento
  - Governança
Seções removidas: N/A
Templates que requerem atualizações:
  - .specify/templates/plan-template.md  ✅ Sem alterações necessárias
  - .specify/templates/spec-template.md  ✅ Sem alterações necessárias
  - .specify/templates/tasks-template.md ✅ Sem alterações necessárias
TODOs pendentes: Nenhum
-->

# Constituição — Portal do Professor (ACAE)

## Princípios Fundamentais

### I. Simplicidade para o Professor (NÃO-NEGOCIÁVEL)

Toda tela e fluxo de trabalho DEVE minimizar a carga cognitiva dos professores. A interface DEVE
ser operável com o mínimo de cliques, carregar em até 2 segundos em conexões escolares padrão e
não exigir treinamento além da alfabetização digital básica. A complexidade DEVE ser ocultada por
padrões inteligentes. Funcionalidades que não puderem ser simplificadas DEVEM ser adiadas ou
removidas.

**Justificativa**: Os professores são os usuários principais e seu tempo é escasso. Um portal que
exige esforço significativo não será adotado, tornando todas as demais funcionalidades irrelevantes.

### II. Geração de IA Baseada em Dados (NÃO-NEGOCIÁVEL)

Conteúdo gerado por IA (atividades, relatórios, portfólios, objetivos, metodologia, mediação) DEVE
ser derivado exclusivamente de dados cadastrados: registros do aluno, contexto da turma, associações
BNCC, contexto pedagógico e justificativas/ocorrências fornecidas pelo professor. Os conteúdos
gerados DEVEM sempre poder ser editados pelo professor antes da finalização. O sistema NÃO DEVE
produzir saídas que contradigam ou ignorem o contexto cadastrado.

**Justificativa**: Documentos pedagógicos são registros oficiais da escola. Saídas de IA alucinadas
ou sem contexto não têm lugar em um sistema educacional e podem prejudicar os alunos.

### III. Rastreabilidade BNCC

Todo documento pedagógico gerado DEVE referenciar pelo menos uma competência ou habilidade da BNCC
explicitamente vinculada durante o cadastro. As associações à BNCC são obrigatórias para geração de
atividades e relatórios. Qualquer documento sem vínculo rastreável à BNCC DEVE ser bloqueado para
finalização.

**Justificativa**: O alinhamento à Base Nacional Comum Curricular (BNCC) é um requisito regulatório
e institucional para as escolas da ACAE.

### IV. Privacidade de Dados e Conformidade com a LGPD (NÃO-NEGOCIÁVEL)

Todos os dados de alunos e professores são classificados como dados pessoais sensíveis sob a Lei
Geral de Proteção de Dados (LGPD). O sistema DEVE:
- Autenticar todo acesso via login seguro antes de qualquer dado ser acessível.
- Aplicar controle de acesso por papel: professores acessam apenas suas próprias turmas e alunos;
  coordenadores acessam todos os registros de sua unidade escolar.
- Nunca expor dados de alunos em URLs ou endpoints de API desprotegidos.
- Registrar todos os acessos a dados para fins de auditoria sem registrar PII em texto simples.
- Reter dados apenas pelo período legalmente determinado e suportar exclusão sob solicitação.
- Anonimizar ou pseudonimizar identificadores de alunos antes de qualquer transmissão a serviços
  externos de IA.

**Justificativa**: A exposição não autorizada de dados de alunos constitui uma violação da LGPD com
consequências legais para a ACAE.

### V. Fidelidade de Documentos e Integridade das Exportações

Todos os documentos gerados DEVEM ser exportáveis nos formatos Word (.docx) e PDF com conteúdo
idêntico. Os documentos exportados DEVEM incluir: nome do professor, turma, período/semana, nome do
aluno quando aplicável, e referências à BNCC. O histórico de documentos DEVE ser preservado e
imutável após a finalização. Um documento finalizado só pode ser substituído por uma nova versão —
nunca sobrescrito.

**Justificativa**: Os documentos exportados servem como registros oficiais da escola. Seu conteúdo
deve ser reproduzível e auditável a qualquer momento.

## Requisitos de Segurança e Privacidade

- Autenticação é obrigatória; toda rota DEVE ser protegida por login.
- Tokens de sessão DEVEM expirar após um período de inatividade configurável; HTTPS é obrigatório
  em todos os ambientes, incluindo staging.
- PII de alunos (nome, idade, notas de desenvolvimento) NÃO DEVE aparecer em arquivos de log ou
  mensagens de erro.
- Todas as chamadas à API de IA DEVEM remover ou pseudonimizar identificadores de alunos antes da
  transmissão.
- Validação de entrada DEVE ser aplicada no servidor; validação no cliente é apenas complementar.
- Prevenção de injeção SQL/NoSQL é obrigatória em todos os pontos de entrada de dados (queries
  parametrizadas ou proteção equivalente via ORM).
- Exportações de arquivos DEVEM ser geradas no servidor e servidas via URLs de download assinadas
  e com prazo de validade.
- Prevenção de XSS é obrigatória: todo texto gerado pelo usuário renderizado no navegador DEVE ser
  escapado ou sanitizado.

## Fluxo de Desenvolvimento

- Funcionalidades são especificadas em `/specs/` antes do início da implementação.
- Cada funcionalidade DEVE ter uma spec (histórias de usuário + critérios de aceitação) e um plano
  de implementação antes de qualquer codificação começar.
- Os gates de verificação da Constituição em `plan.md` DEVEM ser verificados antes da fase de
  pesquisa (Fase 0) prosseguir.
- Pull requests DEVEM ser revisados contra todos os cinco Princípios Fundamentais antes do merge.
- Alterações de UI DEVEM ser validadas contra o Princípio I — nenhuma nova tela pode introduzir
  mais de dois padrões de interação novos sem justificativa explícita.
- Alterações de integração com IA DEVEM ser revisadas contra o Princípio II — alterações de prompt
  requerem aprovação explícita confirmando que a saída permanece baseada em dados cadastrados.
- Alterações sensíveis à LGPD (modelo de dados, exposição de API, logging) DEVEM ser revisadas
  contra o Princípio IV antes do merge.
- Testes automatizados DEVEM cobrir: fluxos de autenticação, validação de vinculação BNCC, pipeline
  de geração de documentos e integridade das exportações (equivalência de conteúdo entre .docx e .pdf).
- A geração de documentos DEVE ser testada por regressão contra seu template a cada release.

## Governança

Esta constituição substitui todas as demais convenções do projeto e acordos informais. Qualquer
decisão de implementação que conflite com estes princípios DEVE ser escalada ao líder do projeto
antes de prosseguir.

**Procedimento de emenda**:
1. Escrever uma proposta descrevendo a alteração, sua justificativa e o tipo de incremento de versão
   (MAJOR / MINOR / PATCH conforme as regras de versionamento abaixo).
2. Para alterações no Princípio I: revisão por pelo menos um representante usuário-professor.
3. Para alterações no Princípio IV: revisão jurídica ou de conformidade obrigatória.
4. Atualizar este arquivo, incrementar a versão e propagar para todos os templates afetados.
5. Registrar a emenda no Relatório de Sincronização (comentário HTML no topo deste arquivo).

**Política de versionamento**:
- MAJOR: alterações de governança incompatíveis com versões anteriores, remoções ou redefinições de princípios.
- MINOR: novo princípio ou seção adicionada, ou orientação materialmente expandida.
- PATCH: esclarecimentos, melhorias de redação ou refinamentos não semânticos.

Todos os agentes e desenvolvedores DEVEM reler esta constituição no início de cada ciclo de
funcionalidade principal. A constituição é a única fonte de verdade sobre o que o sistema Portal
do Professor pode e não pode fazer.

**Versão**: 1.0.0 | **Ratificada em**: 2026-03-10 | **Última emenda**: 2026-03-10
