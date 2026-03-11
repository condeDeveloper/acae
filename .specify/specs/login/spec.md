# Especificação de Funcionalidade: Login do Portal do Professor

**Feature Branch**: `001-login-acesso`
**Criado em**: 10 de março de 2026
**Status**: Rascunho
**Descrição de entrada**: "Login do Portal do Professor (ACAE) com controle de acesso por papel, sessão com expiração por inatividade, HTTPS obrigatório e conformidade com LGPD"

---

## Histórias de Usuário & Testes *(obrigatório)*

### História de Usuário 1 — Login com e-mail e senha (Prioridade: P1)

Um professor ou coordenador pedagógico acessa a página inicial do Portal, informa seu e-mail institucional e senha cadastrados e recebe acesso ao painel principal correspondente ao seu papel (professor ou coordenação).

**Por que essa prioridade**: Sem autenticação, nenhuma outra funcionalidade do sistema pode ser acessada. É o pré-requisito absoluto de toda a aplicação. Sem esse fluxo funcionando corretamente, o portal não existe para o usuário.

**Teste independente**: Pode ser testado de forma completa abrindo a página inicial, preenchendo credenciais válidas e verificando o redirecionamento ao painel correto — entrega o acesso seguro à aplicação de forma autônoma.

**Cenários de Aceitação**:

1. **Dado** que o professor possui cadastro ativo no sistema, **Quando** informa e-mail e senha corretos na tela de login, **Então** o sistema autentica a sessão e redireciona para o painel do professor com seu nome exibido.

2. **Dado** que o coordenador pedagógico possui cadastro ativo, **Quando** informa e-mail e senha corretos, **Então** o sistema autentica a sessão e redireciona para o painel de coordenação, que possui acesso amplo a todos os registros da unidade escolar.

3. **Dado** que o usuário informa e-mail ou senha incorretos, **Quando** tenta fazer login, **Então** o sistema exibe mensagem de erro genérica ("E-mail ou senha inválidos") sem indicar qual dos dois campos está errado, e não realiza o login.

4. **Dado** que o usuário informa e-mail em formato inválido (ex.: sem `@`), **Quando** tenta submeter o formulário, **Então** o sistema exibe validação de formato no campo antes de qualquer requisição ao servidor.

5. **Dado** que o usuário é redirecionado para uma URL protegida sem estar autenticado, **Quando** tenta acessar a URL diretamente, **Então** o sistema redireciona para a tela de login e, após autenticação bem-sucedida, retorna à URL original.

---

### História de Usuário 2 — Expiração de sessão por inatividade (Prioridade: P2)

Um professor deixa o portal aberto no navegador sem interagir. Após um período de inatividade, o sistema encerra a sessão automaticamente e redireciona para a tela de login, protegendo os dados pedagógicos em caso de ausência ou esquecimento.

**Por que essa prioridade**: Requisito de segurança e conformidade com o Princípio IV da Constituição. Professores frequentemente utilizam computadores compartilhados ou saem da sala sem fazer logout. A expiração automática evita acesso não autorizado a dados de alunos.

**Teste independente**: Pode ser testado de forma independente configurando um tempo de inatividade curto em ambiente de teste e verificando o comportamento de redirecionamento após o tempo decorrido — entrega proteção de sessão de forma autônoma.

**Cenários de Aceitação**:

1. **Dado** que o professor está autenticado e ativo, **Quando** não realiza nenhuma ação no sistema pelo período configurado de inatividade, **Então** o sistema encerra a sessão automaticamente e redireciona para a tela de login com mensagem informando que a sessão expirou por inatividade.

2. **Dado** que o professor realiza ações no portal antes do tempo de inatividade se esgotar, **Quando** há interação (clique, digitação, navegação), **Então** o temporizador de inatividade é reiniciado e a sessão permanece ativa.

3. **Dado** que a sessão expirou durante o preenchimento de um formulário, **Quando** o professor tenta salvar os dados, **Então** o sistema exibe mensagem clara informando que a sessão expirou, preserva os dados preenchidos quando tecnicamente possível, e redireciona para login.

4. **Dado** que o professor faz login após sessão expirada, **Quando** autenticado novamente, **Então** recebe uma nova sessão válida e é redirecionado à última página acessada.

---

### História de Usuário 3 — Logout manual (Prioridade: P2)

O professor ou coordenador decide encerrar sua sessão manualmente ao término do uso, garantindo que nenhum dado fique acessível após o uso voluntário do sistema.

**Por que essa prioridade**: Complemento direto à autenticação. Sem logout, os dados pedagógicos ficam expostos em máquinas compartilhadas. É essencial para a conformidade com LGPD e com o Princípio IV da Constituição.

**Teste independente**: Pode ser testado clicando na opção de logout e verificando que a sessão é encerrada e os dados não estão mais acessíveis — entrega encerramento seguro de sessão de forma autônoma.

**Cenários de Aceitação**:

1. **Dado** que o usuário está autenticado, **Quando** clica na opção de logout disponível no painel, **Então** o sistema encerra a sessão, invalida o token/cookie de autenticação no servidor e redireciona para a tela de login.

2. **Dado** que o usuário realizou logout, **Quando** tenta acessar qualquer página protegida usando o botão "voltar" do navegador, **Então** o sistema detecta que a sessão foi encerrada e redireciona novamente para a tela de login, sem exibir dados protegidos.

3. **Dado** que o usuário está autenticado em múltiplas abas do mesmo navegador, **Quando** realiza logout em uma aba, **Então** as demais abas redirecionam para login ao tentar qualquer ação que requer autenticação.

---

### História de Usuário 4 — Controle de acesso por papel (Prioridade: P1)

O sistema diferencia os acessos de professores e coordenadores pedagógicos. Professores acessam apenas seus próprios registros e turmas. Coordenadores acessam todos os registros da unidade escolar.

**Por que essa prioridade**: Requisito não-negociável da Constituição (Princípio IV — Controle de Acesso por Papel). Sem essa separação, dados de alunos ficariam expostos a usuários não autorizados, configurando violação de LGPD.

**Teste independente**: Pode ser testado autenticando um professor e tentando acessar registros de outro professor — o acesso deve ser negado; testando o mesmo com coordenador — o acesso deve ser permitido.

**Cenários de Aceitação**:

1. **Dado** que o professor A está autenticado, **Quando** tenta acessar registros, turmas ou alunos de outro professor, **Então** o sistema nega o acesso com mensagem de erro apropriada (sem expor informações que confirmem a existência dos dados).

2. **Dado** que o coordenador está autenticado, **Quando** acessa a listagem geral de turmas, professores e alunos da unidade escolar, **Então** o sistema exibe todos os registros disponíveis na unidade sem restrição por docente.

3. **Dado** que o professor tenta acessar diretamente uma URL de painel de coordenação, **Quando** o sistema verifica as permissões, **Então** nega o acesso e redireciona para o painel do professor com mensagem de acesso negado.

4. **Dado** que o papel do usuário mudou (ex.: professor promovido a coordenador), **Quando** o usuário faz login após a alteração, **Então** o sistema aplica as permissões do novo papel imediatamente, sem necessidade de intervenção técnica adicional.

---

### Casos de Borda

- O que acontece se o usuário tentar fazer login com uma conta desativada pelo administrador? → O sistema deve exibir mensagem genérica indicando que o acesso não está disponível, sem confirmar que a conta existe.
- O que acontece se o usuário tenta múltiplas autenticações com credenciais erradas em sequência? → Após 5 tentativas falhas consecutivas no mesmo período, o sistema bloqueia temporariamente novas tentativas da mesma origem por um período definido, e exibe mensagem apropriada.
- O que acontece se o e-mail do usuário muda após o cadastro? → O login continuará funcionando com o e-mail anterior até que um administrador atualize o cadastro.
- O que acontece se o sistema fica indisponível durante o processo de login? → O usuário vê uma mensagem de erro genérica ("Serviço temporariamente indisponível") e pode tentar novamente.
- O que acontece se o token de sessão é interceptado? → O token deve ser vinculado à sessão e expirar em tempo configurado; o sistema não oferece garantias além do que o protocolo HTTPS provê.
- O que acontece em conexão lenta (conexão escolar)? → A tela de login deve carregar em até 2 segundos conforme Princípio I da Constituição; campos devem permanecer responsivos durante a validação.

---

## Requisitos *(obrigatório)*

### Requisitos Funcionais

- **RF-001**: O sistema DEVE exigir autenticação antes de qualquer dado pedagógico ser exibido ou acessado.
- **RF-002**: O sistema DEVE aceitar e-mail e senha como credenciais de acesso.
- **RF-003**: O sistema DEVE validar o formato do e-mail no lado do servidor; a validação no cliente é apenas complementar.
- **RF-004**: O sistema DEVE exibir mensagem de erro genérica em caso de credenciais inválidas, sem indicar qual campo está errado (e-mail ou senha).
- **RF-005**: O sistema DEVE encerrar sessões automaticamente após um período de inatividade configurável (padrão: 30 minutos).
- **RF-006**: O sistema DEVE reiniciar o temporizador de inatividade a cada interação do usuário com o sistema.
- **RF-007**: O sistema DEVE notificar o usuário quando a sessão expirar por inatividade antes de redirecioná-lo para login.
- **RF-008**: O sistema DEVE permitir logout manual em qualquer tela autenticada por meio de opção claramente acessível.
- **RF-009**: O sistema DEVE invalidar o token/cookie de sessão no servidor no momento do logout.
- **RF-010**: O sistema DEVE impedir acesso a rotas protegidas após logout, mesmo via histórico do navegador.
- **RF-011**: O sistema DEVE aplicar controle de acesso baseado em papel: professores acessam apenas suas próprias turmas e alunos; coordenadores acessam todos os registros da unidade escolar.
- **RF-012**: O sistema DEVE bloquear tentativas de acesso a recursos de outro papel, retornando erro de acesso negado sem revelar se o recurso existe.
- **RF-013**: O sistema DEVE operar exclusivamente sobre HTTPS em todos os ambientes (desenvolvimento, homologação e produção).
- **RF-014**: O sistema DEVE registrar eventos de autenticação (login, logout, falha de login, expiração de sessão) para fins de auditoria, sem incluir dados pessoais identificáveis (PII) em texto claro nos logs.
- **RF-015**: O sistema DEVE bloquear temporariamente novas tentativas de login após 5 falhas consecutivas de autenticação para a mesma conta, com duração mínima de 15 minutos.
- **RF-016**: O sistema DEVE redirecionar o usuário para a URL acessada originalmente após login bem-sucedido (quando acessou uma rota protegida sem autenticação).

### Entidades Principais

- **Usuário**: Representa qualquer pessoa com acesso ao sistema. Atributos: identificador único, e-mail institucional, papel (professor ou coordenador), status (ativo/inativo), data de cadastro, data do último acesso.
- **Papel (Role)**: Define as permissões de acesso do usuário. Valores: `professor` (acesso restrito às próprias turmas e alunos), `coordenador` (acesso a todos os registros da unidade escolar).
- **Sessão**: Representa o estado de autenticação ativa de um usuário. Atributos: identificador de sessão, referência ao usuário, data/hora de criação, data/hora da última atividade, status (ativa/expirada/encerrada).
- **Evento de Auditoria**: Registro de ações sensíveis de autenticação. Atributos: tipo do evento, identificador anonimizado do usuário (nunca e-mail em texto claro), data/hora, indicador de sucesso/falha, origem da requisição (hash ou prefixo de IP).

---

## Critérios de Sucesso *(obrigatório)*

### Resultados Mensuráveis

- **CS-001**: Professores e coordenadores conseguem realizar login completo (do campo em branco até o painel principal) em menos de 30 segundos em conexões escolares padrão.
- **CS-002**: A tela de login carrega em até 2 segundos em conexões escolares padrão (conforme Princípio I da Constituição).
- **CS-003**: 100% das rotas protegidas são inacessíveis sem autenticação válida — nenhuma rota deve retornar dados sem verificação de sessão ativa.
- **CS-004**: Sessões inativas por 30 minutos são encerradas automaticamente em 100% dos casos, sem depender de ação do usuário.
- **CS-005**: Nenhum dado pessoal identificável (nome, e-mail, identificador de aluno) aparece em arquivos de log ou mensagens de erro registradas.
- **CS-006**: A diferenciação de acesso por papel é aplicada em 100% das tentativas de acesso cruzado (professor tentando acessar dados de outro professor ou painel de coordenação).
- **CS-007**: Após logout, nenhuma informação protegida é acessível por meio do histórico do navegador ou reenvio de requisições autenticadas anteriormentey.
- **CS-008**: O sistema opera exclusivamente sobre HTTPS; qualquer requisição HTTP é redirecionada automaticamente para HTTPS ou rejeitada.
- **CS-009**: Após 5 tentativas de login malsucedidas consecutivas para a mesma conta, novas tentativas são bloqueadas temporariamente, reduzindo ataques de força bruta.
- **CS-010**: 95% dos professores conseguem realizar o login sem necessidade de suporte técnico, treinamento além da alfabetização digital básica ou consultar manual de ajuda.

---

## Premissas

- Professores e coordenadores já possuem cadastro prévio no sistema (o cadastro de usuários é gerenciado por uma funcionalidade separada).
- Não há autenticação via redes sociais, SSO corporativo ou autenticação multifator nesta iteração — apenas e-mail e senha.
- O tempo padrão de expiração por inatividade é de 30 minutos, configurável pelo administrador do sistema.
- As senhas são armazenadas com algoritmo seguro de hash (nunca em texto claro); a política de senhas e redefinição de senha são escopo de funcionalidade separada.
- O sistema opera em ambiente escolar com conexões que podem ser lentas; a tela de login deve ser leve e funcionar mesmo em conexões de baixa qualidade.
- Existe apenas uma unidade escolar por instância do sistema (não há multitenant nesta versão); coordenadores têm acesso a todos os dados dessa unidade.
- Os papéis são mutuamente exclusivos: um usuário é professor OU coordenador, nunca ambos simultaneamente nesta versão.
- A anonimização/pseudonimização de identificadores nos logs será aplicada via identificador interno opaco, sem armazenar e-mail ou nome do usuário em texto claro.
