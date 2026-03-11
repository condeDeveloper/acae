# Especificação de Funcionalidade: Geração de Documentos Pedagógicos com IA

**Feature Branch**: `003-geracao-documentos-ia`
**Criado em**: 10 de março de 2026
**Status**: Rascunho
**Descrição de entrada**: "Módulo de geração de documentos pedagógicos com IA (portfólio, relatório, atividade adaptada, resumo pedagógico) para o Portal do Professor (ACAE)"

---

## Contexto e Motivação

Este módulo é o coração funcional do Portal do Professor (ACAE). Permite que professores gerem automaticamente quatro tipos de documentos pedagógicos com base nos dados cadastrados no sistema. Todo conteúdo gerado por IA é derivado exclusivamente de dados registrados — jamais inventado — em conformidade com o **Princípio II da Constituição** (Geração de IA Baseada em Dados). Todo documento referencia explicitamente competências ou habilidades da BNCC, em conformidade com o **Princípio III** (Rastreabilidade BNCC). Dados de alunos são anonimizados antes de qualquer transmissão a serviços externos de IA, em conformidade com o **Princípio IV** (LGPD). Documentos finalizados são imutáveis e exportáveis, em conformidade com o **Princípio V** (Fidelidade de Documentos).

Os quatro documentos cobertos por esta especificação são:

1. **Portfólio Semanal** — consolidado semanal por aluno
2. **Relatório Individual do Aluno** — relatório descritivo de desenvolvimento
3. **Atividade Adaptada** — atividade pedagógica por aluno ou grupo
4. **Resumo Pedagógico** — visão geral da turma no período

---

## Histórias de Usuário & Testes *(obrigatório)*

### História de Usuário 1 — Professor gera o Portfólio Semanal de um aluno (Prioridade: P1)

Um professor acessa o painel de documentos de uma turma, seleciona um aluno e a semana de referência, e solicita a geração do portfólio semanal. O sistema compila as atividades realizadas, ocorrências, contexto pedagógico e vínculos BNCC da semana e envia essas informações — com o nome do aluno anonimizado — para a API de IA, que retorna um rascunho em linguagem pedagógica. O professor revisa o rascunho, faz ajustes se necessário e finaliza o documento. Após a finalização, o portfólio fica disponível para exportação em Word e PDF e o histórico é preservado de forma imutável.

**Por que essa prioridade**: O portfólio semanal é o documento de maior frequência de uso — gerado toda semana por aluno. É o ponto de entrada mais imediato do professor no módulo de IA e o que entrega valor mais rapidamente.

**Teste independente**: Pode ser testado completamente cadastrando um aluno com atividades e ocorrências de uma semana, solicitando a geração do portfólio, revisando o rascunho gerado e finalizando — entrega um documento real exportável de forma autônoma.

**Cenários de Aceitação**:

1. **Dado** que o professor está autenticado e a turma possui registros de atividades e ocorrências para a semana selecionada, **Quando** solicita a geração do portfólio semanal de um aluno, **Então** o sistema verifica que existem ao menos uma atividade registrada e um vínculo BNCC associado antes de acionar a IA.

2. **Dado** que os pré-requisitos de dados estão atendidos, **Quando** o sistema envia a solicitação à API de IA, **Então** o identificador real do aluno é substituído por um pseudônimo interno antes da transmissão, e nenhum dado pessoal identificável (nome, turma, escola) é enviado em texto claro.

3. **Dado** que a IA retornou o rascunho, **Quando** o professor visualiza o portfólio gerado, **Então** o documento apresenta: resumo das atividades da semana, mediações realizadas pelo professor, ocorrências relevantes registradas, e as competências/habilidades BNCC vinculadas, tudo derivado exclusivamente dos dados cadastrados.

4. **Dado** que o professor está revisando o rascunho, **Quando** edita qualquer trecho do texto gerado, **Então** as alterações são salvas como parte do rascunho sem acionar nova geração pela IA, e a edição fica registrada como revisão do professor.

5. **Dado** que o professor está satisfeito com o portfólio revisado, **Quando** clica em "Finalizar", **Então** o sistema bloqueia edições futuras neste portfólio, gera as versões .docx e .pdf com conteúdo idêntico, e registra no histórico a data/hora de finalização e o professor responsável.

6. **Dado** que o portfólio foi finalizado, **Quando** o professor tenta editar o documento novamente, **Então** o sistema nega a edição com mensagem explicativa e oferece a opção de criar uma nova versão (sem sobrescrever a anterior).

7. **Dado** que a semana selecionada não possui atividades registradas ou não possui vínculo BNCC, **Quando** o professor solicita a geração, **Então** o sistema bloqueia a geração com mensagem clara indicando quais dados estão ausentes.

---

### História de Usuário 2 — Professor gera o Relatório Individual do Aluno (Prioridade: P1)

Um professor acessa o módulo de relatórios, seleciona um aluno e um período (intervalo de semanas), e solicita a geração do relatório individual. O sistema agrupa todos os registros do período — desenvolvimento observado, mediações realizadas, objetivos pedagógicos trabalhados e BNCC associada — e envia à IA (com dados anonimizados) para geração de um texto descritivo coeso. O professor revisa, edita se necessário e finaliza. O relatório finalizado é exportável e imutável.

**Por que essa prioridade**: O relatório individual é o documento entregue periodicamente às famílias e à coordenação. Tem alto impacto institucional e é o mais esperado pelos usuários internos.

**Teste independente**: Pode ser testado selecionando um aluno com múltiplas semanas de registros, gerando o relatório e verificando que o texto consolida corretamente os dados do período — entrega o relatório completo de forma autônoma.

**Cenários de Aceitação**:

1. **Dado** que o professor seleciona um aluno e um período com ao menos uma semana de registros e vínculo BNCC, **Quando** solicita a geração do relatório individual, **Então** o sistema compila os registros do período inteiro e verifica a existência de ao menos um objetivo pedagógico e uma competência BNCC vinculada antes de acionar a IA.

2. **Dado** que a compilação foi validada, **Quando** o sistema envia para a IA, **Então** o payload contém registros de desenvolvimento do aluno, mediações do professor, objetivos pedagógicos trabalhados e referências BNCC — nenhum dado com identificação pessoal do aluno em texto claro.

3. **Dado** que o rascunho foi gerado, **Quando** o professor visualiza o relatório, **Então** o documento apresenta: síntese do desenvolvimento do aluno no período, mediações pedagógicas realizadas, objetivos atingidos ou em progresso, e as competências BNCC correspondentes.

4. **Dado** que o relatório é finalizado, **Quando** o professor exporta o documento, **Então** ambas as versões (.docx e .pdf) incluem: nome do professor, nome da turma, período coberto, nome do aluno e as referências BNCC — com conteúdo textual idêntico entre os dois formatos.

5. **Dado** que o aluno não possui nenhum objetivo pedagógico cadastrado para o período selecionado, **Quando** o professor solicita a geração, **Então** o sistema bloqueia a geração e exibe mensagem orientando o professor a registrar ao menos um objetivo pedagógico antes de prosseguir.

---

### História de Usuário 3 — Professor gera uma Atividade Adaptada por aluno ou grupo (Prioridade: P2)

Um professor acessa o módulo de atividades adaptadas, seleciona um aluno individual ou um grupo de alunos, informa o objetivo pedagógico e a competência BNCC alvo, e solicita a geração. O sistema envia à IA (com dados anonimizados) as características pedagógicas dos alunos selecionados, o objetivo informado e a BNCC associada. A IA retorna uma proposta de atividade adaptada ao nível e contexto dos alunos. O professor revisa, ajusta e pode finalizar ou gerar novamente com parâmetros diferentes.

**Por que essa prioridade**: A atividade adaptada é uma ferramenta de planejamento pedagógico que reduz significativamente o tempo de preparação do professor. É de alta frequência, mas tem dependência de funcionalidades de cadastro de alunos e BNCC que devem ser confirmadas primeiro.

**Teste independente**: Pode ser testado selecionando um aluno ou grupo com contexto pedagógico cadastrado, informando objetivo e BNCC, gerando a atividade e verificando que o conteúdo é coerente com o contexto — entrega a atividade adaptada de forma autônoma.

**Cenários de Aceitação**:

1. **Dado** que o professor seleciona um aluno ou grupo e informa um objetivo pedagógico e uma competência BNCC, **Quando** solicita a geração da atividade, **Então** o sistema valida que todos os campos obrigatórios estão preenchidos e que os alunos selecionados possuem contexto pedagógico cadastrado antes de acionar a IA.

2. **Dado** que a validação foi bem-sucedida, **Quando** o sistema envia para a IA, **Então** o payload inclui: contexto pedagógico dos alunos (sem nome real), nível de desenvolvimento observado, histórico de atividades anteriores relevantes, objetivo pedagógico informado e a competência BNCC alvo.

3. **Dado** que a atividade foi gerada, **Quando** o professor visualiza a proposta, **Então** o documento apresenta: título da atividade, objetivo pedagógico, materiais sugeridos, descrição passo a passo da atividade, adaptações específicas por aluno (no caso de grupo), e a competência BNCC vinculada.

4. **Dado** que o professor não está satisfeito com a proposta gerada, **Quando** clica em "Gerar novamente", **Então** o sistema aciona nova geração pela IA com os mesmos parâmetros, preservando o rascunho anterior no histórico para comparação.

5. **Dado** que a atividade é finalizada para um grupo, **Quando** o professor exporta, **Então** o sistema exporta uma versão única da atividade com as adaptações por aluno visíveis, e opcionalmente versões individuais para cada aluno do grupo.

6. **Dado** que nenhuma competência BNCC foi vinculada ao objetivo informado, **Quando** o professor tenta solicitar a geração, **Então** o sistema bloqueia com mensagem informando que a vinculação BNCC é obrigatória para geração de atividades (Princípio III da Constituição).

---

### História de Usuário 4 — Professor gera o Resumo Pedagógico da turma (Prioridade: P2)

Um professor acessa o módulo de resumo pedagógico, seleciona a turma e o período, e solicita a geração. O sistema agrega dados de todos os alunos da turma no período — metodologia aplicada, objetivos coletivos trabalhados, progresso geral da turma e BNCC coberta — e envia à IA para produção de uma visão geral narrativa. O professor revisa, ajusta e finaliza. O resumo é exportável e ideal para compartilhamento com a coordenação pedagógica.

**Por que essa prioridade**: O resumo pedagógico é o documento voltado para a coordenação e serve como instrumento de gestão. É gerado com menor frequência que os documentos individuais, mas tem alto valor para a análise institucional.

**Teste independente**: Pode ser testado com uma turma que possua ao menos dois alunos com registros no período selecionado — verificando que o texto gerado reflete a metodologia e os objetivos da turma — entrega o resumo de turma de forma autônoma.

**Cenários de Aceitação**:

1. **Dado** que o professor seleciona uma turma e um período com ao menos dois alunos com atividades registradas, **Quando** solicita a geração do resumo pedagógico, **Então** o sistema verifica que a turma possui contexto pedagógico cadastrado e ao menos uma competência BNCC vinculada no período antes de acionar a IA.

2. **Dado** que a validação foi bem-sucedida, **Quando** o sistema envia para a IA, **Então** o payload contém dados agrupados e anônimos da turma (sem nomes individuais de alunos): metodologia registrada, objetivos pedagógicos coletivos, distribuição de competências BNCC trabalhadas, e síntese das ocorrências relevantes do período.

3. **Dado** que o rascunho foi gerado, **Quando** o professor visualiza o resumo, **Então** o documento apresenta: visão geral da turma no período, metodologia aplicada, competências BNCC trabalhadas coletivamente, resultados observados e próximos objetivos pedagógicos sugeridos com base no contexto registrado.

4. **Dado** que o resumo é finalizado, **Quando** exportado, **Então** ambas as versões (.docx e .pdf) incluem: nome do professor, nome da turma, período coberto e as competências BNCC referenciadas — sem identificação nominal de alunos individuais no corpo do texto.

---

### Histórias de Usuário 5 — Histórico e versionamento de documentos (Prioridade: P1)

Um professor acessa o histórico de documentos gerados para um aluno ou turma. Pode visualizar versões anteriores finalizadas, comparar com versões mais recentes e, quando necessário, criar uma nova versão de um documento já finalizado sem sobrescrever o histórico.

**Por que essa prioridade**: O histórico imutável é um pilar da Constituição (Princípio V) e uma garantia legal e institucional. Professores precisam acessar registros anteriores para acompanhamento longitudinal do aluno e para eventuais auditorias ou reuniões com coordenação e famílias.

**Teste independente**: Pode ser testado finalizando dois documentos do mesmo tipo para o mesmo aluno em semanas diferentes e verificando que ambos aparecem no histórico com conteúdo intacto — entrega a rastreabilidade completa de forma autônoma.

**Cenários de Aceitação**:

1. **Dado** que o professor acessa o perfil de um aluno, **Quando** navega para a aba de histórico de documentos, **Então** o sistema exibe a lista de todos os documentos finalizados para aquele aluno, ordenados por data, com tipo do documento, período coberto e data de finalização.

2. **Dado** que o professor clica em um documento finalizado no histórico, **Quando** o documento é exibido, **Então** o conteúdo é apresentado em modo somente leitura, sem opção de edição direta, mas com opção de criar uma nova versão.

3. **Dado** que o professor decide criar uma nova versão de um documento finalizado, **Quando** seleciona "Criar nova versão", **Então** o sistema cria um novo rascunho pré-preenchido com os dados atuais (não os dados históricos) e mantém o documento anterior intacto no histórico como versão anterior.

4. **Dado** que existem múltiplas versões de um mesmo tipo de documento para o mesmo aluno no mesmo período, **Quando** o professor acessa o histórico, **Então** as versões são exibidas em ordem cronológica com indicação clara de qual é a mais recente e quais são versões anteriores.

---

### Casos de Borda

- O que acontece se a API de IA estiver indisponível no momento da geração? → O sistema exibe mensagem amigável ("O serviço de geração está temporariamente indisponível. Tente novamente em alguns instantes."), não salva rascunhos parciais corrompidos e permite nova tentativa sem perder os dados de entrada.

- O que acontece se a IA retornar conteúdo que contradiz os dados cadastrados? → O professor pode editar livremente o rascunho na etapa de revisão. O sistema não impede edições, mas registra que o texto foi modificado em relação ao gerado. O conteúdo finalizado é sempre de responsabilidade do professor.

- O que acontece se o professor fechar o navegador durante a etapa de revisão do rascunho? → O rascunho é salvo automaticamente a cada alteração. Ao retornar, o professor encontra o rascunho no ponto em que estava.

- O que acontece se a turma for muito grande e a geração do resumo pedagógico demorar muito? → O sistema inicia a geração de forma assíncrona, exibe uma indicação de progresso e notifica o professor quando o rascunho estiver pronto, sem bloquear outras ações no portal.

- O que acontece se dois professores tentarem finalizar o mesmo documento simultaneamente? → O sistema permite apenas um responsável por turma/aluno. A tentativa de finalização simultânea deve tratar o conflito registrando apenas a primeira finalização e notificando o segundo com mensagem clara.

- O que acontece se o aluno é removido da turma após a geração de documentos? → Os documentos já gerados e finalizados são preservados no histórico e continuam acessíveis. A remoção do aluno impede apenas a geração de novos documentos vinculados a esse aluno nessa turma.

- O que acontece se o professor tentar gerar um documento sem ter registrado nenhuma atividade ou contexto pedagógico? → O sistema bloqueia a solicitação de geração com mensagem específica indicando quais dados obrigatórios estão ausentes e oferece atalho direto para a tela de cadastro correspondente.

- O que acontece se um documento exported via .docx for aberto em versão antiga do Word? → O sistema gera arquivos compatíveis com Word 2010 ou superior. Não há garantia de compatibilidade com versões anteriores.

---

## Requisitos *(obrigatório)*

### Requisitos Funcionais — Regras Gerais de Geração com IA

- **RF-001**: O sistema DEVE verificar a presença de todos os dados obrigatórios antes de acionar a API de IA para qualquer tipo de documento.
- **RF-002**: O sistema NÃO DEVE acionar a IA se o aluno ou a turma não possuir ao menos uma competência ou habilidade BNCC explicitamente associada ao período solicitado (Princípio III).
- **RF-003**: O sistema DEVE anonimizar o identificador do aluno (substituindo o nome real por um pseudônimo interno temporário) antes de qualquer transmissão à API de IA (Princípio IV / LGPD).
- **RF-004**: O sistema NÃO DEVE transmitir à API de IA: nome completo do aluno, nome da escola, nome da cidade ou qualquer dado que permita identificação direta.
- **RF-005**: Todo rascunho gerado pela IA DEVE ser apresentado ao professor para revisão antes de qualquer possibilidade de finalização — a geração nunca é automática e final.
- **RF-006**: O professor DEVE poder editar livremente qualquer trecho do rascunho gerado pela IA antes da finalização.
- **RF-007**: O sistema DEVE registrar se o texto finalizado foi alterado em relação ao rascunho original gerado pela IA, indicando no histórico que houve revisão manual.
- **RF-008**: O sistema DEVE salvar rascunhos automaticamente durante a etapa de revisão, sem necessidade de ação explícita do professor.
- **RF-009**: A geração assíncrona (para documentos que possam demandar mais tempo) DEVE exibir indicação de progresso e notificar o professor quando o rascunho estiver disponível.
- **RF-010**: O sistema DEVE permitir nova geração (regeneração) de um rascunho com os mesmos parâmetros, preservando o rascunho anterior para comparação.

### Requisitos Funcionais — Portfólio Semanal

- **RF-011**: O sistema DEVE exigir como dados de entrada obrigatórios para o portfólio semanal: ao menos uma atividade registrada na semana, o contexto pedagógico do período e ao menos uma competência BNCC associada.
- **RF-012**: O portfólio semanal DEVE ser gerado por aluno e por semana — um portfólio por aluno por semana.
- **RF-013**: O conteúdo gerado pela IA para o portfólio DEVE incluir, exclusivamente com base nos dados cadastrados: resumo das atividades realizadas na semana, mediações pedagógicas aplicadas pelo professor, ocorrências registradas relevantes e as competências/habilidades BNCC associadas.
- **RF-014**: O portfólio finalizado DEVE incluir no cabeçalho: nome do professor, nome da turma, nome do aluno, semana de referência (data de início e fim) e as referências BNCC.

### Requisitos Funcionais — Relatório Individual do Aluno

- **RF-015**: O sistema DEVE exigir como dados de entrada obrigatórios para o relatório individual: ao menos um objetivo pedagógico cadastrado para o aluno no período, ao menos uma atividade registrada, e ao menos uma competência BNCC associada.
- **RF-016**: O período de referência do relatório individual DEVE ser selecionável pelo professor (escolha de data de início e data de fim), com granularidade mínima de uma semana.
- **RF-017**: O conteúdo gerado pela IA para o relatório DEVE incluir, exclusivamente com base nos dados cadastrados: síntese do desenvolvimento do aluno no período, mediações pedagógicas realizadas, objetivos pedagógicos atingidos ou em progresso, e as competências BNCC correspondentes.
- **RF-018**: O relatório finalizado DEVE incluir no cabeçalho: nome do professor, nome da turma, nome do aluno, período coberto (data de início e fim) e as referências BNCC.

### Requisitos Funcionais — Atividade Adaptada

- **RF-019**: O sistema DEVE exigir como dados de entrada obrigatórios para a atividade adaptada: seleção de ao menos um aluno ou grupo, um objetivo pedagógico informado pelo professor e ao menos uma competência BNCC vinculada.
- **RF-020**: A atividade adaptada pode ser gerada para um aluno individual ou para um grupo de alunos da mesma turma.
- **RF-021**: O conteúdo gerado pela IA para a atividade DEVE incluir: título da atividade, objetivo pedagógico, materiais sugeridos, descrição passo a passo, adaptações específicas por aluno (em caso de grupo) e a competência BNCC vinculada.
- **RF-022**: Para atividades de grupo, o sistema DEVE permitir exportação unificada (uma atividade com adaptações por aluno listadas) e opcionalmente exportações individuais por aluno.
- **RF-023**: A atividade adaptada finalizada DEVE incluir no rodapé: nome do professor, nome da turma, aluno(s) beneficiário(s), data de geração e a referência BNCC.

### Requisitos Funcionais — Resumo Pedagógico

- **RF-024**: O sistema DEVE exigir como dados de entrada obrigatórios para o resumo pedagógico: ao menos dois alunos com atividades registradas na turma no período, o contexto pedagógico da turma e ao menos uma competência BNCC associada à turma no período.
- **RF-025**: O resumo pedagógico DEVE ser gerado por turma e por período selecionado pelo professor.
- **RF-026**: O conteúdo gerado pela IA para o resumo DEVE incluir, exclusivamente com base nos dados coletivos da turma: visão geral do progresso da turma no período, metodologia aplicada, competências BNCC trabalhadas coletivamente e próximos objetivos pedagógicos sugeridos com base no contexto registrado.
- **RF-027**: O resumo pedagógico NÃO DEVE identificar nominalmente alunos individuais no corpo do texto, apenas dados agregados da turma.
- **RF-028**: O resumo finalizado DEVE incluir no cabeçalho: nome do professor, nome da turma, período coberto e as referências BNCC coletivas.

### Requisitos Funcionais — Fluxo de Revisão, Finalização e Exportação

- **RF-029**: Todo documento gerado pela IA percorre o fluxo obrigatório: Rascunho Gerado → Revisão pelo Professor → Edição (opcional) → Finalização. Nenhuma etapa pode ser pulada.
- **RF-030**: Um documento finalizado é imutável. Qualquer alteração posterior exige a criação de uma nova versão — o documento original é preservado no histórico (Princípio V).
- **RF-031**: O sistema DEVE gerar os arquivos .docx e .pdf no servidor, com conteúdo textual idêntico entre os dois formatos.
- **RF-032**: Os arquivos exportados DEVEM ser servidos ao professor via URLs de download assinadas com prazo de validade, nunca expostas publicamente (Princípio IV / Requisitos de Segurança).
- **RF-033**: O sistema DEVE armazenar o histórico completo de documentos finalizados por aluno e por turma, acessível ao professor responsável e à coordenação.
- **RF-034**: O histórico DEVE exibir para cada documento: tipo, período coberto, data de finalização, professor responsável, e indicação se houve revisão manual em relação ao rascunho gerado pela IA.

### Requisitos Funcionais — Vinculação BNCC (Princípio III)

- **RF-035**: Todo documento gerado DEVE referenciar explicitamente ao menos uma competência ou habilidade da BNCC vinculada durante o cadastro — sem exceções.
- **RF-036**: O sistema DEVE bloquear a finalização de qualquer documento que não possua vínculo rastreável à BNCC, exibindo mensagem explicativa ao professor.
- **RF-037**: As referências BNCC DEVEM aparecer visivamente no documento gerado (rascunho, documento finalizado e exportações) de forma clara e rastreável.

### Requisitos Funcionais — Privacidade e LGPD (Princípio IV)

- **RF-038**: O sistema DEVE substituir o identificador real do aluno por um pseudônimo temporário (não reversível externamente) em toda e qualquer chamada à API de IA.
- **RF-039**: O sistema NÃO DEVE registrar em logs as cargas enviadas à API de IA que contenham dados pedagógicos — apenas metadados de controle (timestamp, tipo de documento, status da resposta).
- **RF-040**: Documentos exportados (.docx e .pdf) DEVEM ser gerados e armazenados em área de servidor protegida por autenticação, nunca em pastas de acesso público.
- **RF-041**: A coordenação pedagógica DEVE ter acesso ao histórico de documentos de todos os alunos da unidade escolar; professores DEVEM ter acesso apenas aos documentos de suas próprias turmas.

### Entidades Principais

- **DocumentoPedagógico**: Representa qualquer documento gerado pelo sistema. Atributos: identificador único, tipo (portfólio_semanal | relatório_individual | atividade_adaptada | resumo_pedagógico), status (rascunho | finalizado), data de criação, data de finalização, professor responsável, turma, aluno (opcional — nulo para resumo pedagógico), período de referência (data início/fim), referências BNCC vinculadas, indicador de revisão manual, versão.

- **RascunhoIA**: Representa o conteúdo bruto retornado pela API de IA antes da revisão do professor. Atributos: identificador único, referência ao documentoPedagógico, conteúdo textual gerado, data/hora de geração, pseudônimo utilizado para anonimização, parâmetros enviados à API (sem dados pessoais).

- **VersãoFinalizada**: Representa uma versão imutável de um documento finalizado. Atributos: identificador único, referência ao documentoPedagógico, conteúdo textual finalizado (após revisão), data/hora de finalização, professor que finalizou, caminho do arquivo .docx, caminho do arquivo .pdf, número de versão sequencial.

- **ReferencíaBNCC**: Representa um vínculo explícito a uma competência ou habilidade da BNCC. Atributos: código BNCC (ex.: EF01MA01), descrição resumida, área de conhecimento, nível de ensino aplicável.

- **SolicitaçãoGeração**: Representa o conjunto de parâmetros enviados à API de IA para uma geração. Atributos: tipo de documento, pseudônimo do aluno, contexto pedagógico anonimizado, lista de competências BNCC (por código), objetivo pedagógico, período de referência. Nunca contém nome real do aluno.

---

## Critérios de Sucesso *(obrigatório)*

### Resultados Mensuráveis

- **CS-001**: O professor consegue completar o fluxo completo de geração, revisão e finalização de qualquer tipo de documento em menos de 10 minutos, contando o tempo de resposta da IA.

- **CS-002**: 100% dos documentos finalizados possuem ao menos uma referência BNCC explícita e rastreável — nenhum documento sem vínculo BNCC pode ser finalizado.

- **CS-003**: 100% das chamadas à API de IA transmitem dados com o identificador do aluno anonimizado — nenhuma transmissão com nome real ocorre.

- **CS-004**: 100% dos documentos finalizados são exportáveis simultaneamente em .docx e .pdf com conteúdo textual idêntico.

- **CS-005**: O histórico de documentos finalizados é preservado integralmente — nenhuma versão finalizada pode ser sobrescrita ou excluída pelo professor.

- **CS-006**: Professores conseguem localizar um documento histórico de um aluno específico em menos de 3 cliques a partir do painel principal.

- **CS-007**: Rascunhos são salvos automaticamente e o professor nunca perde trabalho por fechamento acidental do navegador durante a etapa de revisão.

- **CS-008**: Documentos concluídos (rascunho gerado) aparecem em tela para revisão em até 30 segundos após a solicitação de geração em condições normais de rede.

- **CS-009**: 100% dos documentos gerados derivam seu conteúdo exclusivamente dos dados cadastrados pelo professor — o sistema não produz saídas que contradigam ou ignorem o contexto registrado (Princípio II).

- **CS-010**: A coordenação pedagógica consegue acessar o histórico completo de documentos de qualquer turma da unidade escolar sem necessidade de intervenção técnica.

---

## Premissas e Dependências

### Premissas

- O professor já cadastrou o aluno, a turma e as informações pedagógicas necessárias antes de solicitar a geração de qualquer documento. Este módulo não cobre o cadastro desses dados.
- Existe uma API de IA externa com a qual o sistema se comunica. A escolha e configuração dessa API são decisões de implementação, fora do escopo desta especificação.
- O sistema de autenticação e controle de acesso por papel (professor × coordenação) já está implementado conforme a especificação de Login (`001-login-acesso`).
- A vinculação de competências e habilidades BNCC a alunos, turmas e objetivos pedagógicos já foi realizada nas telas de cadastro, antes da solicitação de geração.

### Dependências

- Módulo de Login e controle de acesso por papel (`001-login-acesso/spec.md`) — obrigatório estar implementado.
- Módulo de cadastro de aluno, turma, contexto pedagógico, objetivos pedagógicos e vínculos BNCC — necessários para que haja dados de entrada para geração.
- API de IA externa — necessária para gerar rascunhos. A indisponibilidade da API deve ser tratada com degradação graciosa (mensagem ao professor, sem perda de dados cadastrados).

### Restrições

- Nenhum documento pode ser gerado sem dados suficientes cadastrados — a IA não é usada para "completar" informações ausentes.
- O sistema não armazena os rascunhos brutos da IA por mais de 30 dias após a data de geração, para fins de minimização de dados (LGPD).
- Documentos finalizados não podem ser excluídos pelo professor — apenas pela coordenação com justificativa registrada, ou por obrigação legal.
