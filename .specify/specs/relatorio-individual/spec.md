# Especificação de Funcionalidade: Relatório Individual do Aluno

**Feature Branch**: `005-relatorio-individual`
**Criado em**: 10 de março de 2026
**Status**: Rascunho
**Descrição de entrada**: "Relatório Individual do Aluno com download próximo ao conteúdo gerado pela IA"

---

## Contexto e Motivação

O Relatório Individual do Aluno é o documento entregue periodicamente às famílias e à coordenação pedagógica, descrevendo o desenvolvimento observado, as mediações realizadas e os objetivos trabalhados com o aluno em um determinado período. É um dos documentos de maior impacto institucional no Portal do Professor.

Esta spec detalha exclusivamente o Relatório Individual do Aluno, complementando as regras gerais estabelecidas na spec `003-geracao-documentos-ia`. Toda geração segue o **Princípio II** (IA baseada exclusivamente em dados cadastrados), toda vinculação segue o **Princípio III** (rastreabilidade BNCC obrigatória), toda exportação segue o **Princípio V** (fidelidade e imutabilidade após finalização) e toda transmissão externa segue o **Princípio IV** (LGPD — anonimização antes de envio à API de IA).

O diferencial desta funcionalidade em relação às regras gerais é o posicionamento do botão de download visível diretamente na tela de visualização do rascunho, sem que o professor precise navegar para outro menu ou área do portal.

---

## Histórias de Usuário & Testes *(obrigatório)*

### História de Usuário 1 — Professor gera o Relatório Individual de um aluno (Prioridade: P1)

O professor acessa o módulo de Relatório Individual, seleciona um aluno da sua turma e define o período de referência (data inicial e data final). Em seguida, preenche os campos pedagógicos: objetivos trabalhados, atividades realizadas, mediações aplicadas e ocorrências relevantes. Vincula ao menos uma competência ou habilidade da BNCC. Ao clicar em "Gerar Relatório", o sistema valida os dados, anonimiza o nome do aluno e aciona a IA para produzir o texto descritivo. O rascunho gerado é exibido na mesma tela, e o botão de download em .docx e .pdf aparece visivelmente logo abaixo ou ao lado do conteúdo, sem necessidade de navegação adicional.

**Por que essa prioridade**: É o núcleo da funcionalidade. Sem a geração e exibição do rascunho, nenhuma outra história pode ser testada independentemente.

**Teste independente**: Pode ser testado selecionando um aluno com objetivos e BNCC cadastrados, preenchendo todos os campos obrigatórios na tela de relatório, clicando em "Gerar Relatório" e verificando que o rascunho aparece na tela com o botão de download visível — entregando o rascunho com opção de download de forma autônoma.

**Cenários de Aceitação**:

1. **Dado** que o professor está autenticado e acessa o módulo de Relatório Individual, **Quando** seleciona um aluno e um período com ao menos um objetivo pedagógico cadastrado e ao menos uma competência BNCC vinculada, **Então** o sistema habilita o botão "Gerar Relatório".

2. **Dado** que todos os campos obrigatórios estão preenchidos e o professor clica em "Gerar Relatório", **Quando** o sistema processa a solicitação, **Então** o nome real do aluno é substituído por um pseudônimo interno antes de qualquer transmissão ao serviço externo de IA, e nenhum dado pessoal identificável (nome, turma, escola) é enviado em texto claro.

3. **Dado** que o serviço de IA retornou o texto gerado, **Quando** o professor visualiza a tela, **Então** o rascunho do relatório é exibido na própria tela, e o botão de download (com opções .docx e .pdf) está posicionado visivelmente logo abaixo ou ao lado do conteúdo gerado — sem que o professor precise rolar além do conteúdo ou navegar para outro menu.

4. **Dado** que o rascunho foi gerado, **Quando** o professor examina o conteúdo, **Então** o texto apresenta: síntese do desenvolvimento do aluno no período, descrição das mediações realizadas pelo professor, objetivos pedagógicos trabalhados ou em progresso, e as competências/habilidades BNCC correspondentes — tudo derivado exclusivamente dos dados informados naquele relatório.

5. **Dado** que o professor não preencheu ao menos um objetivo pedagógico ou não vinculou nenhuma competência BNCC, **Quando** clica em "Gerar Relatório", **Então** o sistema bloqueia a geração e exibe mensagem clara indicando qual dado obrigatório está ausente, orientando o professor sobre o que preencher.

6. **Dado** que o serviço de IA está temporariamente indisponível, **Quando** o professor solicita a geração, **Então** o sistema exibe mensagem amigável informando a indisponibilidade temporária, não salva rascunhos corrompidos e preserva todos os dados preenchidos pelo professor para nova tentativa.

---

### História de Usuário 2 — Professor faz download do relatório gerado (Prioridade: P1)

Após visualizar o rascunho na tela, o professor clica diretamente no botão de download — posicionado próximo ao conteúdo gerado — e escolhe entre os formatos .docx e .pdf. O arquivo baixado já contém o cabeçalho institucional completo: nome do professor, nome do aluno, nome da turma, período coberto e as referências BNCC vinculadas. O conteúdo é idêntico entre os dois formatos.

**Por que essa prioridade**: O download é a entrega final do relatório para as famílias e a coordenação. É usado mesmo antes da finalização formal, quando o professor deseja uma cópia prévia para revisão.

**Teste independente**: Pode ser testado gerando um relatório, clicando no botão de download em cada formato e verificando que ambos os arquivos contêm o mesmo texto e o cabeçalho completo — entrega o arquivo exportável de forma autônoma.

**Cenários de Aceitação**:

1. **Dado** que o rascunho do relatório está visível na tela, **Quando** o professor olha para a área do conteúdo gerado, **Então** o botão de download é visível sem que seja necessário rolar a página, acessar menus ocultos ou navegar para outra tela.

2. **Dado** que o professor clica no botão de download e seleciona o formato .docx, **Quando** o arquivo é gerado, **Então** o documento .docx inclui: nome completo do professor, nome completo do aluno, nome da turma, período coberto (data inicial e data final) e a lista de competências/habilidades BNCC vinculadas — além do texto gerado pela IA com as edições do professor, se houver.

3. **Dado** que o professor clica no botão de download e seleciona o formato .pdf, **Quando** o arquivo é gerado, **Então** o conteúdo textual do .pdf é idêntico ao do .docx gerado para o mesmo relatório — sem diferenças de texto, estrutura de seções ou referências BNCC.

4. **Dado** que o professor editou o rascunho antes de fazer o download, **Quando** o arquivo é gerado, **Então** o arquivo exportado reflete o texto editado pelo professor — não a versão original da IA.

5. **Dado** que o professor faz download antes de finalizar o relatório, **Quando** o arquivo é recebido, **Então** o arquivo é funcional e completo, mas o sistema não altera o estado do rascunho — o relatório continua em modo de edição até que o professor clique em "Finalizar".

---

### História de Usuário 3 — Professor edita o rascunho antes de finalizar (Prioridade: P1)

Após visualizar o rascunho gerado pela IA, o professor pode editar qualquer trecho do texto diretamente na tela — corrigindo, ajustando ou complementando o conteúdo. As edições são salvas automaticamente. O professor pode fazer novos downloads a qualquer momento durante a edição. Ao finalizar, o texto editado é o que fica registrado como versão oficial.

**Por que essa prioridade**: A editabilidade antes da finalização é um requisito não-negociável do Princípio II da Constituição. O relatório não pode ser finalizado sem que o professor tenha a oportunidade de revisar e ajustar o texto gerado.

**Teste independente**: Pode ser testado gerando um relatório, editando um trecho do texto, salvando, fechando o navegador, retornando ao rascunho e verificando que a edição foi preservada — entrega a persistência de rascunho de forma autônoma.

**Cenários de Aceitação**:

1. **Dado** que o rascunho foi gerado e está visível na tela, **Quando** o professor clica em qualquer trecho do texto, **Então** o campo se torna editável e o professor pode digitar, apagar ou reformular o conteúdo livremente.

2. **Dado** que o professor está editando o rascunho, **Quando** realiza alterações no texto, **Então** as edições são salvas automaticamente sem que o professor precise clicar em um botão de salvar explícito — o sistema confirma o salvamento com indicação visual discreta.

3. **Dado** que o professor fechou o navegador durante a edição do rascunho, **Quando** retorna ao módulo de relatório daquele aluno, **Então** o rascunho é apresentado no estado em que foi deixado — com todas as edições preservadas.

4. **Dado** que o professor editou o rascunho e clica em "Gerar novamente", **Quando** nova geração é solicitada, **Então** o sistema solicita confirmação antes de sobrescrever o rascunho editado, alertando que as edições atuais serão perdidas.

5. **Dado** que o professor está satisfeito com o texto revisado e clica em "Finalizar", **Quando** a finalização é confirmada, **Então** o sistema registra o texto editado como a versão oficial do relatório — não a versão original gerada pela IA.

---

### História de Usuário 4 — Professor finaliza o relatório (Prioridade: P1)

O professor, após revisar e editar o rascunho, clica em "Finalizar". O sistema solicita confirmação da ação, registra o relatório como documento oficial imutável, associa ao histórico do aluno e mantém o botão de download disponível para a versão finalizada.

**Por que essa prioridade**: A finalização é o ato que converte um rascunho em registro oficial. Sem ela, o documento não tem validade institucional e não entra no histórico auditável exigido pelo Princípio V.

**Teste independente**: Pode ser testado gerando e revisando um relatório, clicando em "Finalizar", tentando editar o documento após a finalização e verificando que a edição é negada — entregando a imutabilidade de forma autônoma.

**Cenários de Aceitação**:

1. **Dado** que o professor revisou o rascunho e clica em "Finalizar", **Quando** o sistema exibe a confirmação, **Então** o professor precisa confirmar explicitamente a finalização antes que qualquer alteração seja aplicada.

2. **Dado** que a finalização foi confirmada, **Quando** o sistema processa a ação, **Então** o relatório passa para o estado imutável — nenhum campo do texto pode ser editado diretamente neste documento.

3. **Dado** que o relatório foi finalizado, **Quando** o professor tenta editar o texto, **Então** o sistema nega a edição com mensagem explicativa e oferece ao professor a opção de criar uma nova versão (sem sobrescrever a versão atual).

4. **Dado** que o relatório foi finalizado, **Quando** o professor acessa o documento, **Então** o botão de download (.docx e .pdf) permanece visível e funcional para a versão finalizada.

5. **Dado** que uma nova versão é criada para um relatório já finalizado, **Quando** a nova versão é gerada e finalizada, **Então** o sistema preserva a versão anterior íntegra no histórico — nunca sobrescrita — e registra a nova versão como entrada separada com data e professor responsável.

---

### História de Usuário 5 — Professor consulta o histórico de relatórios de um aluno (Prioridade: P2)

O professor acessa o histórico de relatórios individuais de um aluno e visualiza uma lista de todos os relatórios finalizados, ordenados do mais recente ao mais antigo. Cada entrada exibe o período coberto, a data de geração e o nome do professor responsável. O professor pode fazer download de qualquer versão histórica diretamente da listagem.

**Por que essa prioridade**: O histórico é necessário para rastreabilidade e auditoria institucional, mas não bloqueia o uso principal da funcionalidade — pode ser implementado após as histórias P1 estarem funcionando.

**Teste independente**: Pode ser testado finalizando dois relatórios do mesmo aluno em períodos diferentes e verificando que ambos aparecem no histórico com dados corretos e download funcional — entregando a rastreabilidade de forma autônoma.

**Cenários de Aceitação**:

1. **Dado** que o professor acessa o perfil de um aluno, **Quando** navega para a aba ou seção de histórico de relatórios, **Então** o sistema exibe a lista de todos os relatórios individuais finalizados para aquele aluno, ordenados da versão mais recente para a mais antiga.

2. **Dado** que a lista de histórico está exibida, **Quando** o professor visualiza cada entrada, **Então** cada item mostra claramente: período coberto pelo relatório (data inicial e data final), data de geração (finalização) e nome do professor responsável.

3. **Dado** que o professor clica em um relatório no histórico, **Quando** o documento é exibido, **Então** o conteúdo é apresentado em modo somente leitura, sem possibilidade de edição direta, e o botão de download (.docx e .pdf) está disponível.

4. **Dado** que o aluno possui múltiplos relatórios finalizados para períodos que se sobrepõem ou são sequenciais, **Quando** o professor acessa o histórico, **Então** cada versão é exibida como entrada independente — permitindo rastrear a evolução dos relatórios ao longo do tempo.

5. **Dado** que o professor faz download de uma versão histórica, **Quando** o arquivo é gerado, **Então** o arquivo reflete exatamente o conteúdo que foi finalizado naquela data — sem alterações decorrentes de dados inseridos posteriormente.

---

### Casos de Borda

- **O que acontece se o professor selecionar um período sem nenhum registro de atividade?** → O sistema bloqueia a geração e exibe mensagem indicando que é necessário ao menos um registro de atividade ou desenvolvimento observado no período para gerar o relatório.

- **O que acontece se nenhuma competência BNCC estiver vinculada?** → O sistema bloqueia tanto a geração quanto a finalização do relatório, exibindo mensagem que referencia a obrigatoriedade da BNCC (Princípio III da Constituição). O professor é orientado a vincular ao menos uma competência antes de prosseguir.

- **O que acontece se o professor tentar finalizar sem ter revisado o rascunho?** → O sistema não impede a finalização, mas exibe uma confirmação que informa ao professor que o texto gerado pela IA será registrado como versão oficial sem edições.

- **O que acontece se o arquivo exportado for muito grande?** → O arquivo é gerado no servidor e disponibilizado via link de download seguro e com prazo de validade. O professor não precisa aguardar na tela — pode ser notificado quando o arquivo estiver pronto.

- **O que acontece se o aluno for removido da turma após a geração do relatório?** → Os relatórios já finalizados são preservados integralmente no histórico. A remoção do aluno impede apenas a geração de novos relatórios, não afeta os registros históricos.

- **O que acontece se dois professores tentarem finalizar o mesmo rascunho simultaneamente?** → Apenas a primeira finalização é registrada. O segundo professor recebe mensagem informando que o documento já foi finalizado e deve criar uma nova versão se necessário.

- **O que acontece se o texto editado pelo professor contiver caracteres especiais ou formatação incompatível?** → O sistema sanitiza o conteúdo antes da exportação, preservando o texto mas removendo formatações que possam comprometer a integridade do arquivo — sem alterar o significado do conteúdo registrado.

---

## Requisitos *(obrigatório)*

### Requisitos Funcionais

- **RF-001**: O sistema DEVE permitir ao professor selecionar um aluno da sua turma e definir um período (data inicial e data final) para o relatório individual.

- **RF-002**: O sistema DEVE exigir o preenchimento dos seguintes campos antes de habilitar a geração: objetivos pedagógicos trabalhados, atividades realizadas, mediações aplicadas e ao menos uma competência ou habilidade BNCC vinculada.

- **RF-003**: O sistema DEVE bloquear a geração e exibir mensagem orientadora quando qualquer campo obrigatório estiver ausente — identificando especificamente o que falta.

- **RF-004**: O sistema DEVE anonimizar o identificador do aluno (substituindo o nome real por pseudônimo interno) antes de qualquer transmissão de dados ao serviço externo de IA.

- **RF-005**: O rascunho gerado pela IA DEVE ser exibido na mesma tela em que o professor preencheu os dados — sem redirecionamento para outra página.

- **RF-006**: O botão de download DEVE estar posicionado visível logo abaixo ou ao lado do conteúdo gerado, sem que o professor precise rolar a página além do conteúdo ou navegar para outro menu ou tela.

- **RF-007**: O sistema DEVE oferecer download do relatório nos formatos .docx e .pdf a partir do mesmo botão ou seletor próximo ao conteúdo.

- **RF-008**: O documento exportado (em ambos os formatos) DEVE incluir obrigatoriamente: nome completo do professor, nome completo do aluno, nome da turma, período coberto (data inicial e data final) e a lista de competências/habilidades BNCC vinculadas ao relatório.

- **RF-009**: O conteúdo textual do arquivo .docx e do arquivo .pdf gerados para o mesmo relatório DEVE ser idêntico — sem divergência de texto, seções ou referências BNCC.

- **RF-010**: O professor DEVE poder editar qualquer trecho do texto gerado pela IA diretamente na tela, antes de finalizar o relatório.

- **RF-011**: O sistema DEVE salvar automaticamente as edições do professor no rascunho — sem exigir ação explícita de salvar — e preservar o estado do rascunho mesmo após o fechamento do navegador.

- **RF-012**: O sistema DEVE exigir ao menos uma competência BNCC vinculada para permitir a finalização do relatório — bloqueando a ação caso nenhuma esteja associada.

- **RF-013**: Após a finalização, o relatório DEVE se tornar imutável: nenhum campo do documento pode ser editado diretamente. O sistema DEVE negar tentativas de edição com mensagem explicativa.

- **RF-014**: O sistema DEVE permitir a criação de uma nova versão de um relatório já finalizado, sem sobrescrever ou alterar a versão anterior — registrando a nova versão como entrada independente no histórico.

- **RF-015**: O download DEVE permanecer disponível para relatórios finalizados, tanto na tela de visualização quanto no histórico do aluno.

- **RF-016**: O sistema DEVE manter um histórico de todos os relatórios finalizados por aluno, exibindo para cada entrada: período coberto, data de geração e nome do professor responsável.

- **RF-017**: O histórico DEVE ser acessível no perfil do aluno e apresentar as versões em ordem cronológica decrescente (mais recente primeiro).

- **RF-018**: Documentos no histórico DEVE ser apresentados em modo somente leitura, com botão de download funcional para cada versão.

### Entidades-Chave

- **Relatório Individual**: documento pedagógico descritivo de um aluno em um período; possui estado (rascunho ou finalizado), conteúdo gerado e editado, e metadados (professor, aluno, turma, período, data de geração, competências BNCC).

- **Versão do Relatório**: cada finalização registra uma versão imutável e independente; múltiplas versões podem existir para o mesmo aluno e período, preservadas integralmente no histórico.

- **Professor**: responsável pela geração e finalização; acessa apenas alunos das suas próprias turmas.

- **Aluno**: sujeito do relatório; identificado pelo nome real no portal, mas anonimizado antes de qualquer transmissão externa.

- **Período**: intervalo de tempo definido pelo professor (data inicial e data final) que delimita os dados compilados para o relatório.

- **Competência BNCC**: código de competência ou habilidade da Base Nacional Comum Curricular, vinculada pelo professor ao relatório; obrigatória para geração e finalização.

---

## Critérios de Sucesso *(obrigatório)*

### Resultados Mensuráveis

- **CS-001**: O professor completa o fluxo desde o preenchimento dos dados até o download do relatório em menos de 5 minutos, com todos os campos obrigatórios já cadastrados previamente.

- **CS-002**: O botão de download está visível ao professor sem necessidade de rolagem além do conteúdo gerado ou navegação para outro menu em 100% das condições normais de uso.

- **CS-003**: O conteúdo textual dos arquivos .docx e .pdf gerados para o mesmo relatório é idêntico em 100% das exportações realizadas.

- **CS-004**: 100% dos relatórios finalizados permanecem acessíveis e inalterados no histórico pelo período determinado pela política de retenção da instituição.

- **CS-005**: O sistema bloqueia a geração ou finalização em 100% dos casos em que a vinculação BNCC obrigatória está ausente — sem exceções.

- **CS-006**: Nenhum dado pessoal identificável do aluno (nome, turma, escola) é transmitido ao serviço externo de IA em 100% das gerações realizadas.

- **CS-007**: Rascunhos em edição são preservados integralmente após fechamento inesperado do navegador em 100% dos casos — o professor retorna exatamente ao ponto em que parou.

- **CS-008**: O histórico exibe corretamente período, data de geração e professor responsável para 100% dos relatórios finalizados.
