# Especificação de Funcionalidade: Stack Técnica — Portal do Professor (ACAE)

**Feature Branch**: `002-stack-tecnica`
**Criado em**: 10 de março de 2026
**Status**: Rascunho
**Descrição de entrada**: "Especificar a stack técnica do projeto: Vue 3 + Vite + PrimeVue com tema personalizado nas cores roxo e amarelo da ACAE, modo light."

---

## Contexto e Motivação

Este documento descreve as decisões tecnológicas da camada de apresentação do Portal do Professor (ACAE). Trata-se de uma especificação de **arquitetura de frontend**, cujo objetivo é registrar de forma rastreável as escolhas de stack, sistema de design, estrutura de projeto e critérios de qualidade visual — servindo como referência normativa para implementação, revisão de código e onboarding de novos colaboradores.

As escolhas feitas aqui devem atender simultaneamente três categorias de requisito:

1. **Princípio I da Constituição — Simplicidade para o Professor**: a interface deve carregar em até 2 segundos, ser operável com poucos cliques e não exigir treinamento além de alfabetização digital básica.
2. **Princípio IV da Constituição — Privacidade e LGPD**: toda navegação ocorre em rotas protegidas por autenticação.
3. **Acessibilidade visual**: professores de diferentes idades e condições visuais devem conseguir utilizar o sistema com conforto.

---

## Histórias de Usuário & Testes *(obrigatório)*

### História de Usuário 1 — Desenvolvedor configura o projeto do zero (Prioridade: P1)

Um desenvolvedor recém-integrado ao projeto deve conseguir clonar o repositório, instalar as dependências e iniciar o servidor de desenvolvimento local em uma única sequência de comandos, sem configuração manual adicional. O ambiente resultante deve apresentar a interface do portal com tema visual ACAE (roxo e amarelo, modo light).

**Por que essa prioridade**: A configuração de ambiente é o pré-requisito de toda contribuição técnica. Uma stack mal documentada ou de difícil inicialização impede a continuidade do desenvolvimento.

**Teste independente**: Clonar o repositório em uma máquina limpa (sem cache), rodar a sequência padrão de instalação e iniciar o servidor local — o resultado deve exibir a tela inicial do portal com as cores da ACAE sem erros no console.

**Cenários de Aceitação**:

1. **Dado** que o desenvolvedor clonou o repositório e instalou as dependências, **Quando** inicia o servidor de desenvolvimento local, **Então** a interface é exibida em menos de 5 segundos, com as cores corretas (roxo e amarelo) e sem erros no console do navegador.

2. **Dado** que o desenvolvedor executa o comando de build de produção, **Quando** o build conclui, **Então** os artefatos são gerados na pasta de saída configurada, sem avisos de erro crítico, e o tamanho do bundle principal da aplicação é inferior a 500 KB (gzip).

3. **Dado** que os tokens de design do tema ACAE estão aplicados, **Quando** qualquer componente PrimeVue é renderizado, **Então** ele utiliza automaticamente a paleta de cores da ACAE — sem necessidade de classes CSS adicionais ou overrides pontuais.

---

### História de Usuário 2 — Professor navega entre seções do portal (Prioridade: P1)

Um professor autenticado usa o menu de navegação para transitar entre as seções do portal (turmas, alunos, documentos gerados, perfil). A transição entre páginas deve ser imediata (roteamento no cliente), sem recarregamento completo da página.

**Por que essa prioridade**: Roteamento no cliente é fundamental para a experiência de uso fluída exigida pelo Princípio I da Constituição. Um sistema que recarrega a página a cada navegação seria lento e cognitivamente custoso para o professor.

**Teste independente**: Navegar entre três seções distintas do portal usando os itens do menu e verificar que cada transição ocorre sem recarregamento completo da página — entrega a experiência de SPA (Single Page Application) de forma autônoma.

**Cenários de Aceitação**:

1. **Dado** que o professor está autenticado na sessão, **Quando** clica em um item do menu de navegação, **Então** o conteúdo da página muda sem recarregamento completo do navegador, e a URL reflete a seção atual.

2. **Dado** que o professor não está autenticado, **Quando** tenta acessar qualquer rota protegida diretamente pela URL, **Então** o sistema redireciona automaticamente para a tela de login antes de exibir qualquer conteúdo protegido.

3. **Dado** que o professor está em uma rota aninhada (ex.: detalhes de um aluno dentro de uma turma), **Quando** usa o botão "voltar" do navegador, **Então** retorna à listagem da turma sem perder o contexto de filtros ou seleções anteriores.

4. **Dado** que o professor acessa uma URL inexistente no portal, **Quando** o sistema detecta que a rota não existe, **Então** exibe uma página de erro amigável (404) com link para retornar à página principal.

---

### História de Usuário 3 — Professor visualiza e interage com componentes em dispositivo de escola (Prioridade: P2)

Um professor usa o portal em um notebook escolar comum (tela de 13–15 polegadas, resolução mínima de 1366×768) ou em um tablet. A interface deve ser legível, utilizável e bem organizada em ambas as situações.

**Por que essa prioridade**: O Princípio I da Constituição exige operabilidade com mínimo de esforço. Uma interface que quebra ou tem texto ilegível em hardware escolar comum viola diretamente este princípio.

**Teste independente**: Abrir o portal em uma resolução de 1366×768 e em um tablet de 768px de largura e verificar que todos os elementos essenciais são visíveis, clicáveis e legíveis sem rolagem horizontal — entrega responsividade básica de forma autônoma.

**Cenários de Aceitação**:

1. **Dado** que o professor usa o portal em um notebook com tela de 1366×768, **Quando** navega por qualquer seção principal, **Então** todos os textos, botões e campos de formulário são completamente visíveis e operáveis sem rolagem horizontal.

2. **Dado** que o professor usa o portal em um tablet com largura de tela de 768px, **Quando** acessa o painel principal, **Então** o layout se reorganiza de forma adequada (ex.: menu lateral colapsado, conteúdo em coluna única) preservando todas as funcionalidades.

3. **Dado** que um usuário com dificuldade visual utiliza o portal, **Quando** observa qualquer texto sobre fundo colorido, **Então** a relação de contraste entre texto e fundo é de no mínimo 4,5:1 para texto normal e 3:1 para texto grande e componentes de interface (conformidade WCAG 2.1 Nível AA).

---

### História de Usuário 4 — Desenvolvedor consome a API do backend a partir do frontend (Prioridade: P2)

Um desenvolvedor implementa uma nova tela que busca dados do backend. A camada de serviços do frontend deve fornecer uma estrutura padronizada para chamadas HTTP, incluindo injeção automática de cabeçalhos de autenticação e tratamento centralizado de erros comuns (401 não autenticado, 403 sem permissão, 500 erro de servidor).

**Por que essa prioridade**: Padronizar o acesso à API desde o início evita inconsistências de segurança e facilita manutenção — diretamente relacionado ao Princípio IV da Constituição (proteção de dados e controle de acesso).

**Teste independente**: Implementar uma chamada de API de teste dentro da camada de serviços e verificar que os cabeçalhos de autenticação são injetados automaticamente e que uma resposta 401 redireciona o usuário para o login — entrega comunicação segura com o backend de forma autônoma.

**Cenários de Aceitação**:

1. **Dado** que o usuário está autenticado no sistema, **Quando** qualquer chamada HTTP ao backend é realizada pelo frontend, **Então** o cabeçalho de autenticação é incluído automaticamente sem necessidade de configuração manual por chamada.

2. **Dado** que o backend retorna uma resposta de erro 401 (sessão expirada ou inválida), **Quando** o frontend recebe essa resposta, **Então** redireciona automaticamente o usuário para a tela de login e exibe mensagem de sessão expirada.

3. **Dado** que o backend retorna uma resposta de erro 403 (sem permissão), **Quando** o frontend recebe essa resposta, **Então** exibe uma notificação de acesso negado sem vazar detalhes internos do sistema.

4. **Dado** que o backend retorna um erro 500 ou está indisponível, **Quando** o frontend recebe essa resposta, **Então** exibe uma mensagem amigável de erro ("Algo deu errado, tente novamente") e registra o erro de forma adequada para diagnóstico, sem expor stack traces ao usuário.

---

### Casos de Borda

- O que acontece se os arquivos de tema não forem carregados (falha de rede ou bundle corrompido)? → A interface deve degradar graciosamente utilizando as cores padrão do navegador, sem quebrar a estrutura da página.
- O que acontece se o token de autenticação expira durante uma chamada de API em andamento? → A chamada deve ser interrompida e o usuário redirecionado para login sem perder dados preenchidos no formulário atual, quando tecnicamente possível.
- O que acontece se o desenvolvedor adiciona um componente fora do sistema de design (sem PrimeVue)? → A especificação deve orientar explicitamente que componentes customizados devem consumir os mesmos tokens de design para manter consistência visual.
- O que acontece em navegadores mais antigos utilizados em computadores escolares? → O sistema deve funcionar em navegadores com suporte a ES2020+ (Chrome 80+, Firefox 78+). Navegadores anteriores exibem aviso de atualização necessária.
- O que acontece se o bundle exceder o limite de tamanho definido? → O processo de build deve falhar com erro claro indicando qual módulo causou o excesso, orientando o desenvolvedor a aplicar code splitting ou lazy loading.

---

## Requisitos *(obrigatório)*

### Requisitos Funcionais — Stack e Configuração de Projeto

- **RF-001**: O projeto DEVE ser construído com Vue 3 (Composition API) e Vite como bundler, garantindo tempo de build e hot-reload rápidos no desenvolvimento.
- **RF-002**: O sistema de navegação DEVE usar Vue Router com modo de histórico HTML5 (`history mode`), permitindo URLs limpas sem fragmento `#`.
- **RF-003**: Todas as rotas do portal, exceto a tela de login, DEVEM ser protegidas por um guard de navegação que verifica autenticação ativa antes de renderizar qualquer conteúdo.
- **RF-004**: O gerenciamento de estado global da aplicação DEVE usar Pinia, com stores separadas e coesas por domínio (ex.: autenticação, professor, turma, aluno, documentos).
- **RF-005**: Toda comunicação com o backend DEVE ser feita através de uma camada de serviços centralizada (baseada em Axios), com instância configurada para injeção automática de cabeçalhos de autenticação e interceptors de resposta para tratamento de erros comuns.
- **RF-006**: O Axios NÃO DEVE incluir dados pessoais de alunos em logs de request/response — alinhamento com o Princípio IV da Constituição.
- **RF-007**: O projeto DEVE adotar uma estrutura de pastas padronizada que organize componentes, composables, layouts, páginas, router, stores e serviços em diretórios dedicados (ver seção Entidades e Estrutura).
- **RF-008**: O Vite DEVE ser configurado com aliases de caminho (ex.: `@/` para `src/`) para evitar imports relativos profundos e facilitar refatorações.
- **RF-009**: O build de produção DEVE aplicar code splitting automático por rota (lazy loading de páginas), limitando o bundle inicial da aplicação.
- **RF-010**: Variáveis de ambiente (URLs de API, configurações de sessão) DEVEM ser gerenciadas via arquivos `.env` do Vite, separados por ambiente (desenvolvimento, produção), e NUNCA devem ser commitadas ao repositório com valores de produção.

### Requisitos Funcionais — Sistema de Tema e Identidade Visual ACAE

- **RF-011**: A interface DEVE usar PrimeVue v4 como biblioteca de componentes, configurada com o preset **Aura** como tema base.
- **RF-012**: O tema DEVE ser customizado exclusivamente via o sistema de design tokens do PrimeVue (`definePreset`), sem overrides CSS globais pontuais — garantindo consistência e manutenibilidade.
- **RF-013**: A paleta de cores **primária** DEVE ser baseada em roxo acessível, inspirado na identidade visual da ACAE/APAE. O tom utilizado DEVE ter relação de contraste mínima de 4,5:1 contra fundo branco para texto normal (WCAG 2.1 AA).
- **RF-014**: A paleta de cores **secundária/destaque** DEVE ser baseada em amarelo vibrante, complementar ao roxo. O tom DEVE ter relação de contraste mínima de 3:1 para componentes de interface e elementos grandes (WCAG 2.1 AA para UI components).
- **RF-015**: O portal DEVE operar exclusivamente em **modo light** (claro). Suporte a modo escuro NÃO é requisito desta versão.
- **RF-016**: Todos os textos exibidos sobre superfícies coloridas (botões, badges, alertas) DEVEM atender ou superar o contraste WCAG 2.1 Nível AA — mínimo de 4,5:1 para texto normal e 3:1 para texto grande (acima de 18pt ou 14pt negrito).
- **RF-017**: A tipografia padrão DEVE ser uma fonte sans-serif legível, configurada via token de design do PrimeVue, com tamanho base suficiente para leitura confortável em monitores escolares (mínimo 14px para texto de corpo).
- **RF-018**: O sistema de design DEVE definir um conjunto limitado e consistente de espaçamentos, bordas e sombras via tokens, aplicado uniformemente por todos os componentes da interface.

### Entidades e Estrutura

**Estrutura de Pastas do Projeto** (convenção normativa):

```
src/
├── assets/          # Fontes, imagens estáticas, ícones SVG
├── components/      # Componentes reutilizáveis (sem lógica de domínio)
│   └── ui/          # Wrappers leves de componentes PrimeVue (quando necessário)
├── composables/     # Funções composable Vue (lógica reutilizável sem UI)
├── layouts/         # Componentes de layout (ex.: LayoutAutenticado, LayoutPublico)
├── pages/           # Componentes de página (um por rota principal)
├── router/          # Configuração do Vue Router (index.js + guards.js)
├── services/        # Camada de acesso à API (instância Axios + módulos por domínio)
├── stores/          # Stores Pinia (uma por domínio: auth.js, turma.js, aluno.js, etc.)
├── utils/           # Funções utilitárias puras (formatação de data, validação, etc.)
├── theme/           # Configuração do tema PrimeVue (definePreset + tokens ACAE)
├── App.vue          # Componente raiz
└── main.js          # Ponto de entrada: instancia Vue, Router, Pinia, PrimeVue
```

**Token de Tema ACAE** (entidade de configuração):
- **Paleta primária (roxo)**: conjunto de 10 tonalidades do roxo ACAE (50 a 950), derivadas de tom âncora de alto contraste; usado em botões primários, links ativos, destaque de navegação
- **Paleta secundária (amarelo)**: conjunto de 10 tonalidades do amarelo ACAE; usado em badges, alertas informativos, destaques visuais secundários
- **Superfícies**: branco puro (`#FFFFFF`) como fundo padrão, cinzas neutros para cards e divisores
- **Tipografia**: família de fonte definida uma vez no token, aplicada globalmente
- **Bordas e raios**: raio de borda padrão definido via token (ex.: levemente arredondado para aparência moderna sem ser excessivo)
- **Sombras**: sombras sutis definidas via token para cards e modais, sem excesso visual

**Instância Axios** (entidade de serviço):
- URL base configurável via variável de ambiente
- Interceptor de request: injeta token de autenticação
- Interceptor de response: trata 401 (redireciona para login), 403 (exibe aviso), 5xx (exibe mensagem genérica de erro)
- Sem logging de corpo de request/response em produção quando contiver dados pessoais

---

## Critérios de Sucesso *(obrigatório)*

### Resultados Mensuráveis

- **CS-001**: Um desenvolvedor consegue clonar o repositório, instalar dependências e iniciar o servidor de desenvolvimento em menos de 5 minutos seguindo as instruções do README.
- **CS-002**: O portal carrega completamente (incluindo componentes e tema) em até 2 segundos em uma conexão de 10 Mbps — atendendo ao Princípio I da Constituição.
- **CS-003**: O bundle JavaScript principal da aplicação (após build de produção com code splitting) é inferior a 500 KB comprimido (gzip), garantindo carregamento rápido em conexões escolares.
- **CS-004**: 100% dos componentes da interface utilizam exclusivamente a paleta de cores definida nos tokens de design ACAE — verificável por inspeção visual e auditoria de CSS.
- **CS-005**: Todos os pares de cor texto/fundo presentes na interface atendem ao mínimo WCAG 2.1 Nível AA (4,5:1 para texto normal, 3:1 para texto grande e componentes de UI) — verificável por ferramenta automatizada de contraste.
- **CS-006**: Todas as rotas protegidas redirecionam para login antes de exibir qualquer conteúdo quando o usuário não está autenticado — verificável por navegação direta às URLs sem sessão ativa.
- **CS-007**: Um novo desenvolvedor consegue adicionar uma nova página ao portal (com rota, store e chamada de API) seguindo os padrões estabelecidos, sem precisar de orientação adicional além da documentação do projeto.
- **CS-008**: A interface é completamente utilizável em resolução mínima de 1366×768 pixels e em telas de tablet (768px de largura) sem rolagem horizontal — verificável por teste visual em diferentes resoluções.
- **CS-009**: Nenhuma chave secreta, URL de produção ou dado pessoal é commitado no repositório — verificável por auditoria do histórico git e do arquivo `.gitignore`.

---

## Suposições e Decisões Documentadas

- **Modo escuro não implementado**: O modo escuro foi excluído do escopo desta versão para reduzir complexidade de tema e manter foco na entrega. Pode ser adicionado em versão futura sem quebra de arquitetura, pois o sistema de tokens suporta múltiplos temas.
- **PrimeVue v4 (mais recente)**: A versão 4 do PrimeVue introduziu o sistema de temas baseado em design tokens (substituindo as variáveis CSS da v3). Esta spec é exclusiva para v4+ — não é compatível retornar à v3.
- **Preset Aura como base**: O preset Aura do PrimeVue v4 foi escolhido por ser o preset mais neutro e customizável, adequado para sobrescrição completa de paleta de cores. Os outros presets (Lara, Nora) têm estilos mais opinionados.
- **JavaScript, não TypeScript**: Esta spec não especifica TypeScript para não introduzir sobrecarga de configuração na fase inicial. A adoção de TypeScript pode ser avaliada em sprint dedicado.
- **Sem biblioteca de testes de unidade**: Testes de unidade de componentes Vue ficam fora do escopo desta spec. A spec de testes será tratada em funcionalidade dedicada.
- **Axios em vez de fetch nativo**: Axios foi escolhido pela maturidade dos interceptors e pela consistência de API em diferentes navegadores, facilitando o tratamento centralizado de erros requerido pelo Princípio IV.
- **Identidade visual ACAE**: As cores exatas (valores hexadecimais) da paleta serão definidas durante a implementação, com base em amostras da identidade visual fornecida pela ACAE. A spec garante que os critérios de contraste WCAG AA sejam atendidos, independentemente do tom exato escolhido.
