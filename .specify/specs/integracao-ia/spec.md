# Especificação de Funcionalidade: Integração com Google Gemini 2.0 Flash

**Feature Branch**: `006-integracao-ia-gemini`
**Criado em**: 10 de março de 2026
**Status**: Rascunho
**Descrição de entrada**: "Integração com Google Gemini 2.0 Flash para geração de documentos pedagógicos no Portal do Professor (ACAE)"

---

## Contexto e Motivação

Este módulo especifica a camada de integração com o serviço externo de inteligência artificial do Portal do Professor — o Google Gemini 2.0 Flash. A integração é o elo entre os dados pedagógicos cadastrados pelo professor (contexto da turma, registros do aluno, vínculos BNCC) e o texto gerado automaticamente para os quatro tipos de documentos do sistema.

A especificação do **que** é gerado e **quando** está coberta pela spec `003-geracao-documentos-ia`. Esta spec cobre exclusivamente **como** o sistema se conecta ao Gemini, **quais dados transitam** nessa conexão, **como as cotas e falhas são tratadas** e **como a segurança e a conformidade LGPD são garantidas** durante toda a integração.

O Gemini 2.0 Flash foi escolhido como provedor por:
- Excelente qualidade de geração em português brasileiro
- Plano gratuito com cota adequada ao volume esperado (1.500 requisições/dia, 1 milhão de tokens/minuto)
- Conformidade com requisitos de anonimização: recebe apenas dados pedagógicos sem identificadores pessoais

A integração deve ser invisível para o professor: ele clica em "Gerar", aguarda e recebe o rascunho. Todo tratamento de erros, controle de cota e comunicação com a API são responsabilidade do backend.

**Princípios da Constituição que regem esta spec:**
- **Princípio II** (IA Baseada em Dados): a IA só recebe dados que o professor cadastrou; o conteúdo gerado é sempre editável antes da finalização.
- **Princípio III** (Rastreabilidade BNCC): referências BNCC são obrigatórias no prompt enviado ao Gemini.
- **Princípio IV** (LGPD): nenhum identificador pessoal de aluno é transmitido ao Gemini; o nome real é sempre substituído por identificador neutro antes do envio.

---

## Histórias de Usuário & Testes *(obrigatório)*

### História de Usuário 1 — Professor solicita geração e recebe o rascunho (Prioridade: P1)

O professor preenche os dados pedagógicos na tela de um dos quatro tipos de documento, clica em "Gerar" e aguarda. O sistema monta o prompt com os dados anonimizados e as referências BNCC, envia ao Gemini, recebe o texto gerado e exibe o rascunho na tela para revisão. O professor vê o conteúdo em até 30 segundos — sem saber nada sobre a API externa.

**Por que essa prioridade**: É o fluxo principal da integração. Sem ele, nenhuma geração de documento funciona.

**Teste independente**: Pode ser testado preenchendo os dados obrigatórios de qualquer tipo de documento, acionando a geração e verificando que o rascunho aparece na tela dentro do prazo — sem qualquer erro visível ao professor.

**Cenários de Aceitação:**

1. **Dado** que o professor preencheu todos os dados obrigatórios para um documento (contexto pedagógico, atividades, vínculos BNCC), **Quando** clica em "Gerar", **Então** o sistema exibe indicação visual de processamento e aguarda a resposta do Gemini — sem bloquear a navegação geral do portal.

2. **Dado** que o sistema está processando a solicitação, **Quando** a resposta do Gemini chega com sucesso, **Então** o rascunho gerado é exibido ao professor em até 30 segundos a partir do clique em "Gerar".

3. **Dado** que o rascunho foi exibido, **Quando** o professor examina o conteúdo, **Então** o texto é coerente com os dados pedagógicos cadastrados — não contém informações nem afirmações que não estejam presentes nos dados enviados.

4. **Dado** que o sistema monta o prompt antes do envio, **Quando** o payload é transmitido ao Gemini, **Então** o nome real do aluno NÃO está presente — apenas referências neutras como "o aluno", "a criança" ou "o estudante" são usadas para identificar o sujeito pedagógico.

5. **Dado** que o sistema monta o prompt antes do envio, **Quando** o payload é transmitido ao Gemini, **Então** ao menos uma competência ou habilidade da BNCC está explicitamente incluída no prompt como contexto obrigatório.

6. **Dado** que o sistema monta o prompt antes do envio, **Quando** o payload é inspecionado, **Então** nenhum dos seguintes dados pessoais está presente: nome completo do aluno, nome da escola, nome do município, CPF, data de nascimento ou qualquer outro identificador pessoal direto.

---

### História de Usuário 2 — Sistema lida com falha na API de forma amigável (Prioridade: P1)

A API do Gemini retorna um erro (indisponibilidade temporária, timeout, resposta inválida). O professor vê uma mensagem clara e amigável — nunca mensagens técnicas de erro da API. Os dados preenchidos são preservados para nova tentativa. O professor pode tentar novamente sem precisar preencher tudo de novo.

**Por que essa prioridade**: Falhas de API são inevitáveis. Um fluxo de erro mal tratado pode fazer o professor perder dados que levou tempo para cadastrar e gerar desconfiança no sistema.

**Teste independente**: Pode ser testado simulando uma falha de API (desconexão de rede ou resposta de erro) e verificando que a mensagem ao professor é amigável, os dados foram preservados e a opção de tentar novamente está disponível.

**Cenários de Aceitação:**

1. **Dado** que o professor solicitou a geração, **Quando** a API do Gemini retorna qualquer tipo de erro (timeout, erro HTTP, resposta malformada), **Então** o sistema exibe mensagem amigável em português ao professor — como "Não foi possível gerar o documento agora. Tente novamente em alguns instantes." — sem revelar detalhes técnicos da API.

2. **Dado** que ocorreu falha na geração, **Quando** o professor visualiza a mensagem de erro, **Então** todos os dados pedagógicos preenchidos antes da tentativa de geração são preservados — o professor não precisa reinserir nenhuma informação.

3. **Dado** que ocorreu falha na geração, **Quando** o professor clica em "Tentar novamente", **Então** o sistema reapresenta os mesmos dados e permite uma nova tentativa de geração sem recarregar a página.

4. **Dado** que a API do Gemini está demorando mais que o esperado, **Quando** o tempo máximo de espera é atingido, **Então** o sistema cancela a solicitação, exibe mensagem amigável e preserva os dados do professor para nova tentativa.

---

### História de Usuário 3 — Sistema bloqueia geração quando o limite diário é atingido (Prioridade: P1)

O sistema controla o uso da cota diária de requisições ao Gemini (1.500/dia no plano gratuito). Quando o limite é atingido, a geração é bloqueada com mensagem explicativa ao professor e previsão de retorno. O professor sabe o que aconteceu e quando poderá tentar novamente — sem ver erros técnicos.

**Por que essa prioridade**: O plano gratuito tem limite diário real. Sem controle de cota, o sistema pode falhar silenciosamente ou exibir erros incompreensíveis para todos os professores simultaneamente.

**Teste independente**: Pode ser testado configurando um limite simulado de 1 requisição/dia, acionando a geração duas vezes e verificando que a segunda tentativa exibe mensagem explicativa com previsão de retorno.

**Cenários de Aceitação:**

1. **Dado** que o limite diário de requisições ao Gemini foi atingido, **Quando** qualquer professor tenta acionar a geração de qualquer tipo de documento, **Então** o sistema bloqueia a solicitação antes mesmo de tentar contatar a API e exibe mensagem amigável informando o limite diário e a previsão de retorno (meia-noite, horário de Brasília).

2. **Dado** que o limite diário está próximo de ser atingido (menos de 10% restante), **Quando** um professor solicita uma geração bem-sucedida, **Então** o sistema exibe aviso discreto informando que o limite diário de gerações está próximo — sem bloquear a funcionalidade atual.

3. **Dado** que o limite diário foi atingido, **Quando** o professor vê a mensagem de bloqueio, **Então** a mensagem informa claramente: que o limite diário do serviço de IA foi atingido, e que as gerações serão liberadas novamente a partir de meia-noite.

4. **Dado** que um novo dia se iniciou (após meia-noite, horário de Brasília), **Quando** o professor tenta gerar um documento, **Então** o sistema processa normalmente — o contador diário foi reiniciado.

---

### História de Usuário 4 — Chave da API gerenciada com segurança pelo backend (Prioridade: P1)

A chave de API do Gemini nunca é exposta ao navegador do professor. Todo o tráfego com o Gemini passa pelo servidor backend. A chave é armazenada como variável de ambiente no servidor — nunca em código-fonte, arquivos versionados ou logs.

**Por que essa prioridade**: Exposição da chave de API é uma vulnerabilidade de segurança crítica. Qualquer acesso não autorizado à chave pode resultar em uso indevido (custos inesperados, vazamento de dados) e violação do contrato com o provedor.

**Teste independente**: Pode ser testado inspecionando o tráfego de rede do navegador para verificar que nenhuma chave de API aparece nas requisições do frontend, e auditando o repositório de código para confirmar que nenhuma chave está presente no código-fonte.

**Cenários de Aceitação:**

1. **Dado** que o professor está usando o portal, **Quando** qualquer requisição de geração é feita pelo navegador, **Então** o tráfego de rede do lado do cliente NÃO contém a chave de API do Gemini — a chave é usada exclusivamente pelo servidor backend.

2. **Dado** que o código-fonte do projeto está versionado, **Quando** o repositório é inspecionado, **Então** nenhuma chave de API do Gemini está presente em nenhum arquivo do repositório, incluindo arquivos de configuração, arquivos de ambiente de exemplo ou histórico de commits.

3. **Dado** que o backend precisa da chave para autenticar com o Gemini, **Quando** a aplicação servidor é inicializada, **Então** a chave é lida de uma variável de ambiente configurada no ambiente de execução — nunca de um valor literal no código.

4. **Dado** que o sistema registra logs de operação e de erros, **Quando** os logs são inspecionados, **Então** a chave de API do Gemini NÃO aparece em nenhum log — nem completa, nem parcialmente.

---

### Casos de Borda

- **O que acontece se o Gemini retornar um texto que contradiz os dados pedagógicos cadastrados?** → O professor pode editar livremente o rascunho antes da finalização (conforme Princípio II). O sistema não valida semanticamente o conteúdo gerado — a revisão humana é obrigatória e garantida pela etapa de edição.

- **O que acontece se o prompt ficar muito longo para o limite de tokens do Gemini?** → O backend deve truncar ou resumir os dados de entrada de forma inteligente, priorizando os dados mais recentes e os vínculos BNCC. O professor não é notificado sobre o truncamento técnico — o rascunho gerado pode ser menos detalhado, mas nunca inventado.

- **O que acontece se o Gemini retornar um texto vazio ou inválido?** → O sistema trata a resposta vazia/inválida como falha e exibe a mensagem amigável padrão de erro, preservando os dados do professor para nova tentativa.

- **O que acontece se vários professores gerarem documentos simultaneamente e o limite de tokens por minuto (1M TPM) for atingido?** → O backend deve implementar fila de solicitações ou retentativas com backoff. O professor vê o indicador de processamento por tempo maior, mas não recebe mensagem de erro — a solicitação é processada assim que a janela de tokens se recupera.

- **O que acontece se a variável de ambiente com a chave do Gemini não estiver configurada no servidor?** → O backend deve falhar na inicialização com erro claro no log do servidor (não visível ao professor), impedindo que a aplicação suba sem a configuração obrigatória. O professor verá a mensagem amigável padrão de indisponibilidade.

- **O que acontece se o professor tentar gerar um documento do mesmo aluno em duas abas simultaneamente?** → O sistema deve tratar ambas as solicitações de forma independente. Duas requisições ao Gemini são feitas; o professor verá dois rascunhos gerados, um em cada aba. Apenas um pode ser finalizado por vez (controle de concorrência coberto pela spec `003-geracao-documentos-ia`).

---

## Requisitos *(obrigatório)*

### Requisitos Funcionais — Construção e Envio do Prompt

- **RF-001**: O sistema DEVE construir o prompt para o Gemini exclusivamente a partir dos dados pedagógicos registrados pelo professor no sistema — nunca introduzindo contexto externo, suposições ou dados de outras fontes.

- **RF-002**: O prompt enviado ao Gemini DEVE incluir obrigatoriamente ao menos uma competência ou habilidade BNCC explicitamente vinculada ao documento solicitado (Princípio III da Constituição). A geração DEVE ser bloqueada se nenhuma BNCC estiver associada.

- **RF-003**: O prompt enviado ao Gemini NÃO DEVE conter: nome completo do aluno, nome da escola, nome do município, CPF, data de nascimento ou qualquer outro identificador pessoal direto (Princípio IV / LGPD). O sujeito pedagógico deve ser referenciado como "o aluno", "a criança" ou "o estudante".

- **RF-004**: O prompt DEVE ser construído e enviado exclusivamente pelo servidor backend — nunca pelo frontend/navegador do professor.

- **RF-005**: O prompt DEVE especificar claramente o tipo de documento solicitado (portfólio semanal, relatório individual, atividade adaptada ou resumo pedagógico) para orientar o estilo e a estrutura da resposta do Gemini.

- **RF-006**: O sistema DEVE incluir no prompt o período de referência do documento (semana ou intervalo de datas), o contexto pedagógico da turma/aluno e os registros de atividades e mediações do professor.

### Requisitos Funcionais — Recebimento e Exibição da Resposta

- **RF-007**: O sistema DEVE retornar o texto gerado pelo Gemini ao frontend para exibição ao professor em modo de rascunho editável — nunca finalizando o documento automaticamente.

- **RF-008**: O rascunho gerado DEVE aparecer para o professor em até 30 segundos a partir do acionamento da geração, em condições normais de operação do serviço.

- **RF-009**: O sistema DEVE exibir indicação visual de processamento enquanto aguarda a resposta do Gemini — sem bloquear a navegação geral do portal.

- **RF-010**: O sistema NÃO DEVE exibir mensagens técnicas da API (erros HTTP, trace de exceção, nome do provedor) ao professor — toda comunicação de erro deve ser em linguagem amigável em português.

### Requisitos Funcionais — Tratamento de Erros e Falhas

- **RF-011**: O sistema DEVE tratar qualquer tipo de falha na comunicação com o Gemini (timeout, erro HTTP 4xx/5xx, resposta malformada, resposta vazia) e exibir mensagem amigável ao professor sem revelar detalhes técnicos.

- **RF-012**: Após uma falha de geração, o sistema DEVE preservar todos os dados pedagógicos preenchidos pelo professor — nenhuma informação inserida pelo professor pode ser perdida em decorrência de falha da API.

- **RF-013**: O sistema DEVE oferecer ao professor a opção de tentar novamente após qualquer falha de geração, sem necessidade de reinserir os dados.

- **RF-014**: O sistema DEVE definir um tempo máximo de espera pela resposta do Gemini. Se esse tempo for excedido, a solicitação é cancelada e o professor é notificado com mensagem amigável.

### Requisitos Funcionais — Controle de Cota Diária

- **RF-015**: O sistema DEVE controlar o número de requisições realizadas ao Gemini por dia, respeitando o limite de 1.500 requisições/dia do plano gratuito.

- **RF-016**: O sistema DEVE bloquear novas solicitações de geração quando o limite diário for atingido, antes de tentar contatar a API — evitando erros retornados pelo provedor.

- **RF-017**: Quando o limite diário for atingido, o sistema DEVE exibir mensagem amigável ao professor informando que o serviço de geração está temporariamente indisponível e que retornará após a meia-noite (horário de Brasília).

- **RF-018**: O sistema DEVE alertar o professor (de forma discreta, sem bloquear a funcionalidade) quando o volume de requisições estiver próximo do limite diário — definido como menos de 10% do limite restante.

- **RF-019**: O contador de requisições diárias DEVE ser reiniciado automaticamente à meia-noite, horário de Brasília.

### Requisitos Funcionais — Segurança da Chave de API

- **RF-020**: A chave de API do Google Gemini DEVE ser armazenada exclusivamente como variável de ambiente no servidor backend — nunca em código-fonte, arquivos de configuração versionados ou arquivos de exemplo commitados no repositório.

- **RF-021**: A chave de API NUNCA DEVE ser transmitida ao navegador do professor — nem diretamente, nem indiretamente via resposta de API, comentário de código ou configuração de cliente.

- **RF-022**: O sistema DEVE impedir a inicialização da funcionalidade de geração se a variável de ambiente com a chave do Gemini não estiver configurada — registrando o erro no log do servidor de forma clara para o administrador.

- **RF-023**: A chave de API NÃO DEVE aparecer em logs de sistema, logs de erro ou mensagens de depuração — nem completa, nem parcialmente.

### Entidades-Chave *(seção de dados)*

- **Solicitação de Geração**: representa uma requisição de geração de documento; contém tipo do documento, referência ao aluno/turma, período, dados pedagógicos de entrada, identificador de requisição e status (pendente, concluída, falha).

- **Prompt Pedagógico**: payload montado pelo backend antes do envio ao Gemini; contém contexto pedagógico anonimizado, referências BNCC, tipo de documento e período. Nunca contém identificadores pessoais.

- **Rascunho Gerado**: texto retornado pelo Gemini após processamento da solicitação; vinculado à Solicitação de Geração e ao documento correspondente; disponível para edição pelo professor até a finalização.

- **Contador de Cota Diária**: controle interno do número de requisições realizadas ao Gemini na data corrente; reiniciado à meia-noite; consultado antes de cada nova solicitação para verificar disponibilidade.

---

## Pressupostos

- O plano gratuito do Google Gemini 2.0 Flash oferece 1.500 requisições/dia e 1 milhão de tokens/minuto — suficiente para o volume esperado de uso interno da ACAE.
- O tempo de resposta do Gemini, em condições normais, é inferior a 30 segundos para os tamanhos de prompt esperados.
- O backend tem acesso a variáveis de ambiente de servidor configuráveis pelo administrador do sistema.
- O volume de uso simultâneo de professores é baixo (sistema interno de escola), reduzindo a probabilidade de atingir o limite de tokens por minuto.
- O limite diário de 1.500 requisições é compartilhado por todos os professores do sistema — não por professor individualmente.

---

## Critérios de Sucesso *(obrigatório)*

### Resultados Mensuráveis

- **SC-001**: O professor recebe o rascunho gerado em até 30 segundos a partir do clique em "Gerar" em 95% das solicitações, em condições normais de operação do serviço externo.

- **SC-002**: 100% dos prompts enviados ao Gemini passam pelas regras de anonimização — nenhum identificador pessoal de aluno (nome, CPF, data de nascimento) é transmitido ao serviço externo.

- **SC-003**: 100% dos prompts enviados ao Gemini incluem ao menos uma referência BNCC explícita — nenhuma geração ocorre sem vinculação BNCC verificada previamente.

- **SC-004**: Nenhuma mensagem técnica de erro da API do Gemini é exibida ao professor — 100% dos erros são interceptados pelo backend e convertidos em mensagens amigáveis em português.

- **SC-005**: A chave de API do Gemini não aparece em nenhum inspetor de rede, log de sistema ou arquivo versionado — verificável por auditoria de segurança.

- **SC-006**: O sistema bloqueia corretamente novas gerações quando o limite diário de requisições é atingido, com mensagem explicativa ao professor em 100% das ocorrências.

- **SC-007**: Após qualquer falha de geração, 100% dos dados pedagógicos preenchidos pelo professor são preservados — o professor não perde nenhuma informação inserida.

- **SC-008**: O alerta de cota próxima ao limite (menos de 10% restante) é exibido ao professor em 100% das situações em que esse limiar é atingido.
