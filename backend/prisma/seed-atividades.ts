import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../../.env') })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ─────────────────────────────────────────────────────────────
// BANCO DE ATIVIDADES PEDAGÓGICAS BASEADAS NA BNCC
// Organizadas por área do conhecimento e nível educacional
// Especialmente voltadas para Educação Especial e Inclusiva
// ─────────────────────────────────────────────────────────────

const atividades = [

  // ════════════════════════════════════════════════════════════
  // LINGUAGENS — Linguagem oral, escrita, corpo e arte
  // ════════════════════════════════════════════════════════════

  {
    titulo: 'Roda de Histórias com Fantoches',
    descricao: 'A professora conta uma história utilizando fantoches artesanais. Os alunos participam expressando emoções, respondendo perguntas e recriando partes da história com seus próprios fantoches.',
    como_fazer: '1. Prepare fantoches de papel ou meia com personagens simples. 2. Conte uma história curta com começo, meio e fim. 3. Faça pausas para que os alunos completem frases ou expressem sentimentos dos personagens. 4. Peça que cada aluno apresente um trecho usando o fantoche. 5. Registre em foto ou vídeo.',
    materiais: 'Fantoches (meias, papel, EVA), história impressa ou oral, câmera/celular',
    area_conhecimento: 'Linguagens',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03EO04', 'EI03TS02', 'CG04'],
    dificuldade: 'basica',
  },
  {
    titulo: 'Cantinho da Escrita com Letras Móveis',
    descricao: 'Alunos exploram letras móveis (magnéticas, recortadas ou em EVA) para formar seu nome, palavras simples e pequenas frases. Estimula o reconhecimento do sistema alfabético de forma lúdica.',
    como_fazer: '1. Disponibilize letras móveis em uma bandeja. 2. Peça que o aluno forme o próprio nome. 3. Apresente uma figura e peça que tente escrever o nome do objeto. 4. Progresso: forme palavras de 2 sílabas, depois 3. 5. Cole a palavra formada em um caderno como registro.',
    materiais: 'Letras móveis (EVA, magnéticas ou impressas), bandeja, figuras de objetos, caderno, cola',
    area_conhecimento: 'Linguagens',
    nivel_educacional: 'Ensino Fundamental — Anos Iniciais',
    bncc_refs: ['EF01LP01', 'EF01LP03', 'CG04'],
    dificuldade: 'basica',
  },
  {
    titulo: 'Teatro de Sombras — Expressão Corporal e Narrativa',
    descricao: 'Alunos criam silhuetas com as mãos e o corpo em um lençol iluminado, construindo narrativas visuais. Desenvolve criatividade, controle corporal e linguagem não-verbal.',
    como_fazer: '1. Monte um lençol branco com uma lanterna atrás. 2. Mostre como fazer sombras com as mãos (pássaro, cachorro, etc.). 3. Proponha uma temática (ex: "Uma aventura na floresta"). 4. Cada aluno apresenta cena. 5. Turma cria história coletiva encadeando as cenas.',
    materiais: 'Lençol branco, lanterna ou projetor, fita adesiva, bonecos de papel (opcional)',
    area_conhecimento: 'Linguagens',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03CG01', 'EI03CG03', 'CG04'],
    dificuldade: 'intermediaria',
  },
  {
    titulo: 'Diário Ilustrado — Registro de Vivências',
    descricao: 'Cada aluno mantém um diário com desenhos e, quando possível, palavras ou frases sobre o que viveu na semana. Estimula memória, sequência temporal e expressão escrita.',
    como_fazer: '1. Entregue um caderno ou caderneta como "meu diário". 2. Reserve 10 min por semana para o aluno desenhar/escrever o que fez. 3. Pergunte sobre o desenho e escreva ao lado a fala do aluno (escrita do escriba). 4. Ao final do mês, folheiem juntos as memórias. 5. Compartilhe com a família.',
    materiais: 'Caderno, canetinhas coloridas, lápis, cola para figuras recortadas',
    area_conhecimento: 'Linguagens',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03EScP', 'EI03EO04', 'CG04'],
    dificuldade: 'basica',
  },
  {
    titulo: 'Música e Movimento — Coordenação e Ritmo',
    descricao: 'Atividade rítmica com instrumentos simples, palmas e movimento corporal. Alunos seguem padrões de ritmo, exploram sons e criam sequências musicais próprias.',
    como_fazer: '1. Apresente 3 ritmos diferentes (lento, moderado, rápido) com palmas. 2. Peça que repitam e criem variações. 3. Distribua instrumentos simples (chocalho, tambor). 4. Form grupos para criar uma "música da turma". 5. Apresentem para os colegas.',
    materiais: 'Instrumentos de percussão simples, garrafinhas com areia (chocalho caseiro), reprodutor de música',
    area_conhecimento: 'Linguagens',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03TS01', 'EI03CG01', 'CG03'],
    dificuldade: 'basica',
  },
  {
    titulo: 'Contação de História com Sequência de Imagens',
    descricao: 'O aluno recebe imagens embaralhadas de uma história conhecida e deve ordená-las corretamente, depois narrar a história em suas próprias palavras.',
    como_fazer: '1. Imprima 4 a 6 cenas de uma história simples. 2. Apresente as imagens embaralhadas. 3. Peça que o aluno coloque em ordem. 4. Pergunte: "O que aconteceu primeiro? E depois?" 5. O aluno narra enquanto aponta as imagens. 6. Cole em papel como livro.',
    materiais: 'Imagens impressas ou recortadas de revistas, papel A3, cola, envelopes',
    area_conhecimento: 'Linguagens',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03EO04', 'EI03EScP', 'CG04'],
    dificuldade: 'basica',
  },

  // ════════════════════════════════════════════════════════════
  // MATEMÁTICA — Número, espaço, formas e medidas
  // ════════════════════════════════════════════════════════════

  {
    titulo: 'Caixa de Classificação — Atributos e Categorias',
    descricao: 'Alunos separam objetos concretos (botões, tampas, blocos) por cor, forma, tamanho ou textura. Desenvolve pensamento lógico, categorização e linguagem matemática.',
    como_fazer: '1. Reúna 20-30 objetos variados (cores, formas, tamanhos). 2. Peça ao aluno que separe "os iguais" sem dar instrução de critério. 3. Pergunte: "Por que você colocou esses juntos?" 4. Proponha um novo critério: "Agora separe por cor". 5. Avance para dois critérios simultâneos.',
    materiais: 'Botões, tampinhas, blocos lógicos, caixinhas de sapato, bandejas',
    area_conhecimento: 'Matemática',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03ET03', 'CG02'],
    dificuldade: 'basica',
  },
  {
    titulo: 'Trilha Numérica com Dados',
    descricao: 'Jogo de tabuleiro adaptado onde o aluno lança dados e conta as casas para avançar, reconhecendo numerais e praticando contagem até 20.',
    como_fazer: '1. Crie uma trilha de 20 casas numeradas no chão (camisetas de papel, fita). 2. Aluno lança dado e conta as casas em voz alta. 3. Na casa pousada, realiza uma mini-tarefa (ex: bater palmas o número de vezes). 4. Vence quem chegar primeiro ao 20. 5. Adapte: use dado com pontos ou com numerais.',
    materiais: 'Dado (pontos ou numerais), trilha impressa ou desenhada no chão, peças/pinos',
    area_conhecimento: 'Matemática',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03EN01', 'EI03EN02', 'CG01'],
    dificuldade: 'basica',
  },
  {
    titulo: 'Medindo com o Corpo — Palmos, Pés e Passos',
    descricao: 'Alunos usam partes do corpo como unidade de medida para comparar comprimentos de objetos na sala. Introduz conceito de medida não-convencional e comparação.',
    como_fazer: '1. Pergunte: "Quantos palmos tem a mesa?". 2. Demonstre como usar o palmo como medida. 3. Peça que meçam 3 objetos diferentes. 4. Registre em tabela (objeto, medida em palmos). 5. Compare: "Qual é maior? Menor?". 6. Avance para régua como medida convencional.',
    materiais: 'Mesa, cadeira, caixas e objetos variados, papel para registro, lápis',
    area_conhecimento: 'Matemática',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03ET04', 'CG02'],
    dificuldade: 'intermediaria',
  },
  {
    titulo: 'Gráfico Vivo — Preferências da Turma',
    descricao: 'Alunos constroem um gráfico concreto no chão respondendo a uma pergunta coletiva (ex: "Qual sua fruta favorita?"), desenvolvendo leitura e interpretação de dados.',
    como_fazer: '1. Defina a pergunta da pesquisa com a turma. 2. Cada aluno recebe uma ficha com seu nome ou desenho. 3. Posicione as fichas em colunas no chão formando um gráfico. 4. Conte cada coluna. 5. Pergunte: "Qual tem mais? Menos? Igual?". 6. Transfira o gráfico para o papel.',
    materiais: 'Fichas de papel, fita adesiva no chão, canetões, papel grande para gráfico final',
    area_conhecimento: 'Matemática',
    nivel_educacional: 'Ensino Fundamental — Anos Iniciais',
    bncc_refs: ['EF01MA26', 'CG07'],
    dificuldade: 'intermediaria',
  },
  {
    titulo: 'Quebra-Cabeça de Formas Geométricas',
    descricao: 'Alunos montam figuras complexas (casinha, robô, animal) usando apenas formas geométricas básicas. Desenvolve reconhecimento espacial, nomenclatura e criatividade matemática.',
    como_fazer: '1. Recorte formas geométricas em EVA (quadrados, triângulos, círculos, retângulos) em diferentes tamanhos e cores. 2. Mostre uma figura montada como modelo. 3. Peça que reproduzam. 4. Desafio: criem uma figura nova. 5. Pergunte: "Que formas você usou? Quantas?".',
    materiais: 'Formas em EVA ou papel cartão, bandeja, modelo impresso ou desenhado',
    area_conhecimento: 'Matemática',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03ET01', 'EI03ET02', 'CG02'],
    dificuldade: 'basica',
  },
  {
    titulo: 'Mercado Pedagógico — Numeracia e Troco',
    descricao: 'Simulação de uma "compra" com produtos e cédulas de brinquedo ou impressas. Alunos praticam adição, subtração simples e reconhecimento de valores monetários.',
    como_fazer: '1. Monte um "mercadinho" com produtos e preços simples (R$1, R$2, R$3). 2. Cada aluno recebe R$10 em notas impressas. 3. Escolhe produtos para comprar. 4. Calcula o total e entrega o dinheiro. 5. Professor dá o "troco". 6. Avance: aluno calcula o próprio troco.',
    materiais: 'Produtos vazios (caixinhas, embalagens), notas e moedas impressas, etiquetas de preço',
    area_conhecimento: 'Matemática',
    nivel_educacional: 'Ensino Fundamental — Anos Iniciais',
    bncc_refs: ['EF02MA06', 'EF01MA06', 'CG01'],
    dificuldade: 'intermediaria',
  },

  // ════════════════════════════════════════════════════════════
  // CIÊNCIAS DA NATUREZA — Exploração do mundo natural
  // ════════════════════════════════════════════════════════════

  {
    titulo: 'Horta Sensorial — Plantio e Observação',
    descricao: 'Alunos plantam sementes em copos, regam e observam o crescimento ao longo das semanas. Registram em tabela de acompanhamento. Desenvolve responsabilidade, cuidado e pensamento científico.',
    como_fazer: '1. Forneça copos com terra e sementes (feijão, alface). 2. Cada aluno planta a própria semente. 3. Defina ritual de rega diária. 4. A cada 3 dias, medem o crescimento com régua e anotam. 5. Ao final do mês, discutem o que aprenderam sobre cuidar de plantas.',
    materiais: 'Copos plásticos, terra, sementes, régua, tabela de acompanhamento, lápis colorido',
    area_conhecimento: 'Ciências da Natureza',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03ET05', 'CG08', 'CG01'],
    dificuldade: 'basica',
  },
  {
    titulo: 'Experimento da Densidade — O que Flutua?',
    descricao: 'Alunos testam hipóteses sobre quais objetos flutuam ou afundam em água, registram resultados e discutem por quê. Introduz método científico de forma lúdica.',
    como_fazer: '1. Reúna objetos variados (rolha, pedra, folha, moeda, plástico). 2. Peça que cada aluno preveja: "Vai flutuar ou afundar?". 3. Testem um a um em bacia com água. 4. Registre os resultados em tabela (previsto x real). 5. Discuta: "Por que esse afundou?". 6. Introduza o conceito de densidade com linguagem simples.',
    materiais: 'Bacia com água, objetos variados, tabela de registro, lápis',
    area_conhecimento: 'Ciências da Natureza',
    nivel_educacional: 'Ensino Fundamental — Anos Iniciais',
    bncc_refs: ['EF02CI01', 'CG02'],
    dificuldade: 'intermediaria',
  },
  {
    titulo: 'Corpo Humano — Mapa do Meu Corpo',
    descricao: 'O aluno deita sobre papel kraft e a professora contorna seu corpo. Em seguida, identifica e nomeia partes do corpo, seus órgãos e funções básicas. Favorece consciência corporal e autoconhecimento.',
    como_fazer: '1. Role o papel kraft no chão. 2. O aluno deita e a professora contorna seu corpo com canetão. 3. Ele desenha o rosto, cabelo, roupas. 4. Colam pinturas ou adesivos indicando órgãos (coração, pulmão, estômago). 5. Identificam funções: "Para que serve o coração?". 6. Expõem na sala.',
    materiais: 'Papel kraft em rolo, canetões coloridos, figuras de órgãos impressas, cola, tesoura',
    area_conhecimento: 'Ciências da Natureza',
    nivel_educacional: 'Ensino Fundamental — Anos Iniciais',
    bncc_refs: ['EF02CI05', 'CG08'],
    dificuldade: 'basica',
  },
  {
    titulo: 'Ciclos da Natureza — Observação do Tempo',
    descricao: 'Alunos registram diariamente as condições do tempo (sol, chuva, nublado) em um calendário de clima por um mês, e ao final analisam padrões e variações.',
    como_fazer: '1. Crie um calendário de parede com 30 campos. 2. Defina símbolos: sol = ensolarado, nuvem = nublado, gota = chuva. 3. Cada manhã, um aluno responsável registra o clima. 4. Ao fim do mês, conte: quantos dias de sol? Chuva? 5. Discuta: "Qual mês tem mais chuva? Por quê?".',
    materiais: 'Calendário impresso ou cartolina, adesivos ou carimbos de clima, canetinhas',
    area_conhecimento: 'Ciências da Natureza',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03ET05', 'CG07'],
    dificuldade: 'basica',
  },
  {
    titulo: 'Reciclagem na Prática — Separando o Lixo',
    descricao: 'Atividade prática de separação de resíduos usando lixeiras coloridas. Alunos aprendem sobre reciclagem, materiais e preservação do meio ambiente.',
    como_fazer: '1. Monte 4 lixeiras coloridas (azul-papel, amarelo-metal, verde-vidro, vermelho-plástico). 2. Reúna embalagens limpas. 3. Alunos identificam e classificam. 4. Discuta: "Por que separar?". 5. Crie um mural com materiais recicláveis. 6. Visite a lixeira da escola para aplicar.',
    materiais: 'Caixas ou baldes coloridos, embalagens limpas variadas, etiquetas com símbolos de reciclagem',
    area_conhecimento: 'Ciências da Natureza',
    nivel_educacional: 'Ensino Fundamental — Anos Iniciais',
    bncc_refs: ['EF02CI08', 'CG07', 'CG10'],
    dificuldade: 'basica',
  },
  {
    titulo: 'Os Cinco Sentidos — Caixas Sensoriais',
    descricao: 'Alunos exploram caixas temáticas com estímulos para cada sentido: cheiros, texturas, sons, sabores e imagens. Desenvolve percepção sensorial, vocabulário e capacidade descritiva.',
    como_fazer: '1. Prepare 5 caixas (uma para cada sentido). 2. Tato: tecidos, lixa, esponja, pedra. 3. Olfato: ervas, café, sabão. 4. Audição: instrumentos simples, gravações de sons. 5. Visão: fotos, espelhos, lupas. 6. Paladar: frutas simples. 7. Registre com palavras ou desenhos.',
    materiais: 'Caixas de sapato, materiais sensoriais variados, fichas de registro',
    area_conhecimento: 'Ciências da Natureza',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03ET05', 'EI03CG02', 'CG01'],
    dificuldade: 'basica',
  },

  // ════════════════════════════════════════════════════════════
  // CIÊNCIAS HUMANAS — Identidade, lugar e convivência
  // ════════════════════════════════════════════════════════════

  {
    titulo: 'Minha História em Fotos — Linha do Tempo Pessoal',
    descricao: 'O aluno traz fotos de suas diferentes fases da vida e monta uma linha do tempo no papel, desenvolvendo identidade, noção de tempo e autoconhecimento.',
    como_fazer: '1. Peça às famílias que enviem 3 a 5 fotos do aluno em diferentes idades. 2. Ajude o aluno a ordenar cronologicamente. 3. Cole em papel kraft formando uma "linha do tempo". 4. Escreva ao lado: "Quando tinha X meses/anos, eu...". 5. Apresente para os colegas. 6. Compare com a linha do tempo dos outros.',
    materiais: 'Fotos impressas ou digitais, papel kraft, cola, canetinhas, etiquetas',
    area_conhecimento: 'Ciências Humanas',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03EO01', 'EI03EO05', 'CG08'],
    dificuldade: 'basica',
  },
  {
    titulo: 'Mapa da Escola — Orientação Espacial',
    descricao: 'Alunos constroem coletivamente um mapa simples da escola, representando salas, pátio, banheiro e outros espaços. Desenvolve noção espacial, representação cartográfica e cooperação.',
    como_fazer: '1. Faça um passeio pela escola observando os espaços. 2. De volta à sala, pergunte: "Quais espaços existem?". 3. Forneça papel grande e deixe que representem livremente. 4. Discuta: "O que fica perto da sala? E o banheiro?". 5. Monte o mapa coletivo com legendas. 6. Exponha na entrada da sala.',
    materiais: 'Papel grande (kraft ou cartolina), canetões, régua, figuras para representar espaços',
    area_conhecimento: 'Ciências Humanas',
    nivel_educacional: 'Ensino Fundamental — Anos Iniciais',
    bncc_refs: ['EF01GE01', 'EF01GE03', 'CG01'],
    dificuldade: 'intermediaria',
  },
  {
    titulo: 'Famílias Diferentes, Famílias Iguais',
    descricao: 'Rodas de conversa e atividade plástica sobre os diferentes modelos de família. Desenvolve respeito à diversidade, identidade e pertencimento.',
    como_fazer: '1. Leia ou conte uma história com diferentes tipos de família. 2. Roda de conversa: "Com quem você mora? Quem faz parte da sua família?". 3. Peça que desenhem sua família. 4. Apresentem os desenhos. 5. Discuta: "Todas as famílias são diferentes e todas têm amor". 6. Monte painel coletivo.',
    materiais: 'Livro infantil sobre diversidade familiar, papel A4, giz de cera, canetinhas',
    area_conhecimento: 'Ciências Humanas',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03EO05', 'EI03EO06', 'CG09'],
    dificuldade: 'basica',
  },
  {
    titulo: 'Profissões na Comunidade — Quem Cuida de Mim?',
    descricao: 'Alunos conhecem diferentes profissões da comunidade, seus instrumentos e funções. Desenvolve cidadania, valorização do trabalho alheio e vocabulário social.',
    como_fazer: '1. Apresente imagens de profissionais (médico, professor, bombeiro, cozinheiro). 2. Discuta: "O que essa pessoa faz? Onde trabalha?". 3. Atividade de encaixe: ligar profissional ao instrumento. 4. Jogo de roleplay: cada aluno "se veste" de uma profissão. 5. Registre em painel.',
    materiais: 'Imagens de profissionais e ferramentas, fantasia simples (chapéu, avental), fichas de encaixe',
    area_conhecimento: 'Ciências Humanas',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03EO06', 'CG06', 'CG10'],
    dificuldade: 'basica',
  },

  // ════════════════════════════════════════════════════════════
  // AUTONOMIA E VIDA DIÁRIA — Especialmente inclusivo / AEE
  // ════════════════════════════════════════════════════════════

  {
    titulo: 'Rotina em Imagens — Antecipação e Autonomia',
    descricao: 'Usar cartões de rotina ilustrados para que o aluno antecipe e compreenda a sequência de atividades do dia. Fundamental para alunos com TEA, Down e outras necessidades educacionais.',
    como_fazer: '1. Fotografe ou imprima figuras de cada etapa da rotina (entrada, roda, lanche, atividade, saída). 2. Cole com velcro em painel de sequência. 3. Antes de cada atividade, aponte o cartão correspondente. 4. Ao terminar, o aluno vira o cartão. 5. Reforce verbalmente: "Terminamos o lanche! O que vem agora?". 6. Avance para o aluno montar a rotina sozinho.',
    materiais: 'Cartões plastificados com figuras, painel de velcro, velcro autocolante',
    area_conhecimento: 'Autonomia e Vida Diária',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03EO02', 'CG08', 'CG10'],
    dificuldade: 'basica',
  },
  {
    titulo: 'Autoatendimento — Higiene e Cuidado Pessoal',
    descricao: 'Atividade sequenciada ensinando lavar as mãos, escovar dentes e outros cuidados através de passos ilustrados e prática real. Essencial para alunos que necessitam de suporte em AVDs.',
    como_fazer: '1. Afixe sequência ilustrada na parede do banheiro (molhar, passar sabão, esfregar, enxaguar, secar). 2. Demonstre cada passo verbalizando. 3. Execute junto com o aluno. 4. Reduza o apoio gradativamente (modelagem física → gestual → verbal → independente). 5. Registre evolução semanalmente.',
    materiais: 'Cartazes plastificados com sequência, sabonete, escova de dentes, observação semanal',
    area_conhecimento: 'Autonomia e Vida Diária',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03EO02', 'EI03CG02', 'CG08'],
    dificuldade: 'basica',
  },
  {
    titulo: 'Comunicação com Prancha de PECS/CAA',
    descricao: 'Uso de prancha de comunicação alternativa para que alunos não-verbais ou com dificuldade de comunicação oral expressem necessidades, desejos e sentimentos.',
    como_fazer: '1. Monte prancha com figuras de necessidades básicas (água, banheiro, dor, quero, não quero). 2. Apresente cada figura e seu significado. 3. Modele usando a prancha para se comunicar. 4. Aguarde que o aluno aponte/use a prancha. 5. Reforce imediatamente. 6. Expanda progressivamente a prancha.',
    materiais: 'Prancha plastificada, figuras de comunicação (ARASAAC), velcro, pasta de comunicação',
    area_conhecimento: 'Autonomia e Vida Diária',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03EO04', 'CG04', 'CG08'],
    dificuldade: 'basica',
  },
  {
    titulo: 'Receita Culinária Adaptada — Seguindo Instruções',
    descricao: 'Alunos preparam uma receita simples (vitamina, salada de frutas, biscoito) usando fichas ilustradas de instrução. Trabalha sequência, autonomia, leitura funcional e matemática prática.',
    como_fazer: '1. Escolha receita simples de 4–6 passos. 2. Monte ficha ilustrada com cada passo. 3. Prepare ingredientes e utensílios. 4. O aluno executa cada passo com suporte. 5. Prove juntos ao final. 6. Registre com foto. 7. Leve a receita para casa.',
    materiais: 'Fichas de receita ilustradas, ingredientes, utensílios simples, câmera para registro',
    area_conhecimento: 'Autonomia e Vida Diária',
    nivel_educacional: 'Ensino Fundamental — Anos Iniciais',
    bncc_refs: ['EI03EO02', 'CG01', 'CG08', 'CG10'],
    dificuldade: 'intermediaria',
  },
  {
    titulo: 'Vestuário e Independência — Botões, Zíperes e Cadarços',
    descricao: 'Atividade com painéis de treino (dressing frames) para desenvolver habilidades motoras finas de vestir-se. Fundamental para alunos com dificuldades motoras ou cognitivas.',
    como_fazer: '1. Apresente painel com botão. Demonstre abrir e fechar lentamente. 2. O aluno tenta com suporte físico total. 3. Reduza o apoio progressivamente. 4. Avance para zíper e velcro. 5. Generalize na prática real (jaqueta, mochila). 6. Registre evolução.',
    materiais: 'Painéis de treino (dressing frames ou feitos em casa), velcro, botões, zíper',
    area_conhecimento: 'Autonomia e Vida Diária',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03CG02', 'EI03EO02', 'CG08'],
    dificuldade: 'basica',
  },

  // ════════════════════════════════════════════════════════════
  // HABILIDADES SOCIOEMOCIONAIS — Autoconhecimento e convivência
  // ════════════════════════════════════════════════════════════

  {
    titulo: 'Termômetro das Emoções — Identificando Sentimentos',
    descricao: 'Alunos aprendem a identificar e nomear suas emoções usando um termômetro ilustrado com expressões faciais. Desenvolve vocabulário emocional, autorregulação e empatia.',
    como_fazer: '1. Apresente o "termômetro das emoções" com faces: alegre, triste, bravo, assustado, ansioso. 2. Mostre situações (imagens ou histórias curtas) e pergunte: "Como você acha que esse personagem está se sentindo?". 3. No início de cada aula, cada aluno aponta como está. 4. Discuta estratégias para cada emoção.',
    materiais: 'Termômetro de emoções plastificado, espelho para expressões, histórias ilustradas',
    area_conhecimento: 'Habilidades Socioemocionais',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03EO01', 'CG08', 'CG09'],
    dificuldade: 'basica',
  },
  {
    titulo: 'Jogo da Empatia — Como o Outro Se Sente?',
    descricao: 'Usando cartões de situação, alunos discutem como diferentes pessoas se sentem em situações variadas. Desenvolve perspectiva social, alternância de papéis e resolução de conflitos.',
    como_fazer: '1. Prepare 10 cartões de situação (ex: "Maria caiu e bateu o joelho", "Pedro não foi convidado para a festa"). 2. Em duplas, um lê o cartão, o outro responde: "Como essa pessoa está se sentindo? O que eu faria?". 3. Discutam coletivamente. 4. Role-play de situações de conflito com resolução.',
    materiais: 'Cartões de situação ilustrados, dado de emoções, fantoches simples',
    area_conhecimento: 'Habilidades Socioemocionais',
    nivel_educacional: 'Ensino Fundamental — Anos Iniciais',
    bncc_refs: ['EI03EO03', 'CG09', 'EI03EO07'],
    dificuldade: 'intermediaria',
  },
  {
    titulo: 'Caixa de Ferramentas Emocionais — Estratégias de Autorregulação',
    descricao: 'Alunos constroem uma "caixa de ferramentas" com estratégias pessoais para lidar com emoções difíceis (respiração, contar até 10, pedir ajuda, se afastar). Desenvolve autorregulação e autonomia emocional.',
    como_fazer: '1. Discuta: "O que fazemos quando estamos muito nervosos ou tristes?". 2. Liste estratégias coletivamente. 3. Cada aluno escolhe 3 que funcionam para ele. 4. Desenha em cartões e guarda em caixinha personalizada. 5. Pratique cada estratégia (ex: respiração abdominal). 6. Use a caixa nos momentos reais.',
    materiais: 'Caixinha pequena (sapato, leite), cartões em branco, canetinhas, decoração',
    area_conhecimento: 'Habilidades Socioemocionais',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['CG08', 'CG09', 'CG10'],
    dificuldade: 'intermediaria',
  },
  {
    titulo: 'Roda de Paz — Resolução de Conflitos',
    descricao: 'Espaço estruturado para que alunos aprendam a resolver conflitos com respeito, usando um "bastão da fala" e etapas definidas. Desenvolve comunicação, escuta ativa e convivência.',
    como_fazer: '1. Apresente o "bastão da fala" (somente quem tem o bastão fala). 2. Ensine as 4 etapas: Dizer o que aconteceu → como me senti → ouvir o outro → propor algo. 3. Pratique com situação fictícia. 4. Use sempre que conflito real surgir. 5. Registre as soluções encontradas no "livro da paz".',
    materiais: 'Bastão da fala (cabo de madeira decorado), caderno "Livro da Paz", almofada para sentar',
    area_conhecimento: 'Habilidades Socioemocionais',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03EO07', 'CG09', 'CG07'],
    dificuldade: 'intermediaria',
  },

  // ════════════════════════════════════════════════════════════
  // MOTRICIDADE — Coordenação motora fina e grossa
  // ════════════════════════════════════════════════════════════

  {
    titulo: 'Circuito Motor — Equilíbrio e Coordenação',
    descricao: 'Percurso com diferentes obstáculos e superfícies para desenvolver equilíbrio, coordenação motora grossa, lateralidade e planejamento motor.',
    como_fazer: '1. Monte circuito: pular em quadradinhos, andar na linha, passar por baixo de elástico, subir degrau, rolar bola no cesto. 2. Demonstre cada estação. 3. Alunos percorrem individualmente. 4. Cronometre para motivar. 5. Adapte a dificuldade para cada aluno. 6. Registre habilidades desenvolvidas.',
    materiais: 'Bambolê, cones, fita no chão, step, bola, elástico, cesto',
    area_conhecimento: 'Motricidade',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03CG02', 'EI03CG03', 'CG08'],
    dificuldade: 'intermediaria',
  },
  {
    titulo: 'Modelagem com Argila — Força e Coordenação Fina',
    descricao: 'Alunos trabalham com argila ou massa de modelar para desenvolver força nas mãos, pinça, coordenação motora fina e criatividade. Ótimo para preparação para escrita.',
    como_fazer: '1. Distribua porções de argila ou massa caseira. 2. Esquente com as mãos (amassar, espremer, rolar). 3. Mostre técnicas: rolar em cilindro, achatar, modelar bola. 4. Proponha tema livre ou dirigido (animal, fruta, objeto do cotidiano). 5. Deixe secar e pinte se possível. 6. Exponha as criações.',
    materiais: 'Argila ou massa de modelar (farinha+sal+água+corante), base, espátulas simples, tinta',
    area_conhecimento: 'Motricidade',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03TS03', 'EI03CG02', 'CG03'],
    dificuldade: 'basica',
  },
  {
    titulo: 'Atividade de Recorte e Colagem — Tesoura e Pinça',
    descricao: 'Sequência progressiva de atividades com tesoura: cortar franja, linhas retas, curvas e formas. Desenvolve coordenação motora fina e preparação para a escrita.',
    como_fazer: '1. Comece com tesoura sem ponta. Mostre posição correta dos dedos. 2. Nível 1: cortar franja em tiras de papel. 3. Nível 2: cortar na linha reta impressa. 4. Nível 3: cortar em zigue-zague. 5. Nível 4: recortar figuras simples. 6. Cole as figuras formando uma colagem temática.',
    materiais: 'Tesoura adaptada ou sem ponta, papel colorido, linhas impressas, cola, papel A3 para colagem',
    area_conhecimento: 'Motricidade',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03CG02', 'EI03TS03'],
    dificuldade: 'basica',
  },
  {
    titulo: 'Grafismo e Pré-Escrita — Labirintos e Traçados',
    descricao: 'Atividades progressivas de traçado: linhas, curvas, labirintos e grafismos para desenvolver controle do lápis e preparação para escrita cursiva e bastão.',
    como_fazer: '1. Comece com traçado de linha reta (da esquerda para direita). 2. Avance para linhas curvas, ondas e espirais. 3. Labirinto simples com caminhos largos. 4. Grafismos progressivos. 5. Avance para letras em pontilhado. 6. Use guia de postura e apoio de mão quando necessário.',
    materiais: 'Fichas de grafismo impressas, lápis HB, borracha, prancheta, cabo engrossador de lápis (se necessário)',
    area_conhecimento: 'Motricidade',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03CG02', 'EI03EScP'],
    dificuldade: 'basica',
  },

  // ════════════════════════════════════════════════════════════
  // LETRAMENTO E ALFABETIZAÇÃO — Específicas EF Anos Iniciais
  // ════════════════════════════════════════════════════════════

  {
    titulo: 'Bingo de Sílabas — Consciência Fonológica',
    descricao: 'Jogo de bingo adaptado onde os alunos identificam sílabas nas cartelas ao ouvir palavras. Desenvolve consciência fonológica, identificação de sílabas e atenção.',
    como_fazer: '1. Crie cartelas 3x3 com sílabas (MA, ME, MI, MO, MU, etc.). 2. Sorteie palavras: "MALA" — alunos marcam "MA". 3. Quem completar linha grita "Bingo!". 4. Avance: cartelas com palavras completas para identificação visual. 5. Varie: bingo de rimas, de letras iniciais.',
    materiais: 'Cartelas plastificadas, marcadores (feijão, tampinha), saquinho de sorteio com palavras',
    area_conhecimento: 'Letramento e Alfabetização',
    nivel_educacional: 'Ensino Fundamental — Anos Iniciais',
    bncc_refs: ['EF01LP02', 'EF01LP04', 'CG04'],
    dificuldade: 'basica',
  },
  {
    titulo: 'Palavras Cruzadas Ilustradas — Leitura e Escrita',
    descricao: 'Palavras cruzadas simples onde cada resposta corresponde a uma figura. Alunos escrevem as palavras a partir das imagens. Desenvolve vocabulário, escrita e leitura.',
    como_fazer: '1. Crie cruzadinha com 5–8 palavras simples (trissilábicas ou dissilábicas) e figuras correspondentes. 2. Aluno olha figura, diz a palavra em voz alta, soletra e escreve nas casinhas. 3. Corrija junto. 4. Avance: sem figuras, apenas definição simples.',
    materiais: 'Ficha de palavras cruzadas impressa, lápis, borracha',
    area_conhecimento: 'Letramento e Alfabetização',
    nivel_educacional: 'Ensino Fundamental — Anos Iniciais',
    bncc_refs: ['EF01LP05', 'EF02LP01', 'CG04'],
    dificuldade: 'intermediaria',
  },
  {
    titulo: 'Canto da Leitura — Hora do Livro',
    descricao: 'Momento diário estruturado de leitura de livros de literatura infantil adaptada, com exploração dos elementos da narrativa e discussão em roda.',
    como_fazer: '1. Escolha livro com ilustrações ricas e texto simples. 2. Antes: explore a capa ("Do que você acha que é?"). 3. Leia em voz alta com entonação e dramatização. 4. Durante: faça perguntas ("O que aconteceu? Como o personagem se sentiu?"). 5. Depois: atividade de resposta (desenho, dramatização, reescrita).',
    materiais: 'Livros de literatura infantil adaptada, tapete ou almofadas para roda de leitura',
    area_conhecimento: 'Letramento e Alfabetização',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03EScP', 'EI03EO04', 'CG04'],
    dificuldade: 'basica',
  },

  // ════════════════════════════════════════════════════════════
  // ARTE E EXPRESSÃO — Criatividade e estética
  // ════════════════════════════════════════════════════════════

  {
    titulo: 'Arte com Materiais Naturais — Land Art',
    descricao: 'Alunos criam composições artísticas usando folhas, galhos, pedras, flores e sementes coletadas no ambiente escolar. Desenvolve criatividade, apreciação estética e conexão com a natureza.',
    como_fazer: '1. Passeio pelo pátio coletando materiais naturais. 2. De volta à sala ou ainda no pátio, cada aluno organiza seus materiais em composição. 3. Fotografe antes de desfazer (material volta à natureza). 4. Discuta: "O que você quis expressar?". 5. Monte galeria virtual com as fotos.',
    materiais: 'Câmera/celular, materiais naturais do ambiente, banco ou chão limpo',
    area_conhecimento: 'Arte e Expressão',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03TS03', 'CG03', 'CG02'],
    dificuldade: 'basica',
  },
  {
    titulo: 'Pintura com Diferentes Suportes e Técnicas',
    descricao: 'Exploração de diferentes técnicas de pintura (dedo, pincel, esponja, rolo, estêncil) em variados suportes (papel, tela, papelão). Desenvolve expressão artística e motricidade.',
    como_fazer: '1. Apresente a técnica do dia (ex: pintura com esponja). 2. Demo coletiva. 3. Cada aluno experimenta livremente. 4. Ao longo das semanas, passe por todas as técnicas. 5. Ao final, montagem de um livro de arte pessoal com uma obra de cada técnica.',
    materiais: 'Tinta guache lavável, esponjas, pincéis, rolos, stêncil, suportes variados, aventais',
    area_conhecimento: 'Arte e Expressão',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03TS03', 'EI03CG01', 'CG03'],
    dificuldade: 'basica',
  },
  {
    titulo: 'Dança Livre e Criação Coreográfica',
    descricao: 'Alunos exploram o movimento corporal com música, criam sequências de movimento e pequenas coreografias. Desenvolve expressão corporal, ritmo e criatividade.',
    como_fazer: '1. Aquecimento: movimento livre ao ritmo de músicas variadas. 2. Ensine 3 movimentos básicos e peça que os combinem. 3. Em duplas, criam uma sequência de 4 movimentos. 4. Grupos apresentam as criações. 5. Discuta: "O que o movimento expressa?". 6. Grave para portfólio.',
    materiais: 'Reprodutor de música, espaço amplo, lenços coloridos ou fitas (opcional)',
    area_conhecimento: 'Arte e Expressão',
    nivel_educacional: 'Educação Infantil',
    bncc_refs: ['EI03CG01', 'EI03TS01', 'CG03'],
    dificuldade: 'basica',
  },

  // ════════════════════════════════════════════════════════════
  // PENSAMENTO COMPUTACIONAL — BNCC EF Anos Finais / Iniciais
  // ════════════════════════════════════════════════════════════

  {
    titulo: 'Programando o Robô Humano — Sequência e Algoritmo',
    descricao: 'Um aluno age como "robô" e outro como "programador", enviando comandos simples para que o robô execute tarefas. Introduz conceito de algoritmo e sequência de forma lúdica.',
    como_fazer: '1. Defina comandos simples: avançar 1 passo, virar direita, virar esquerda, pegar objeto. 2. O programador planeja a sequência em papel. 3. O robô executa apenas os comandos recebidos. 4. Missão: chegar ao "tesouro" desviando de obstáculos. 5. Troque os papéis. 6. Debata: o que acontece com uma instrução errada?',
    materiais: 'Fita no chão para labirinto, "tesouro" (objeto), fichas de comando, obstáculos',
    area_conhecimento: 'Pensamento Computacional',
    nivel_educacional: 'Ensino Fundamental — Anos Iniciais',
    bncc_refs: ['CG05', 'CG02', 'CG07'],
    dificuldade: 'intermediaria',
  },
  {
    titulo: 'Classificando e Ordenando — Fundamentos de Dados',
    descricao: 'Alunos organizam conjuntos de objetos ou informações segundo critérios definidos, criando sequências, hierarquias e categorias. Base para pensamento lógico e computacional.',
    como_fazer: '1. Apresente conjunto de 15 fichas com figuras (animais, cores, tamanhos). 2. Peça que organizem como quiserem. 3. Discuta os critérios usados. 4. Desafio: ordenar do menor ao maior, do mais lento ao mais rápido. 5. Criar "banco de dados" da turma: quem tem cachorro? quem gosta de futebol?. 6. Monte tabela coletiva.',
    materiais: 'Fichas com figuras, tabela em papel grande, canetão',
    area_conhecimento: 'Pensamento Computacional',
    nivel_educacional: 'Ensino Fundamental — Anos Iniciais',
    bncc_refs: ['CG02', 'CG07', 'EF01MA26'],
    dificuldade: 'basica',
  },

  // ════════════════════════════════════════════════════════════
  // ATIVIDADES AVANÇADAS — Para alunos com maior desenvolvimento
  // ════════════════════════════════════════════════════════════

  {
    titulo: 'Jornal da Turma — Escrita com Propósito Real',
    descricao: 'A turma produz coletivamente um jornal com notícias da escola, entrevistas, curiosidades e textos de opinião. Desenvolve escrita, leitura e senso de cidadania.',
    como_fazer: '1. Defina as editorias (notícias, esportes, cultura, curiosidades). 2. Grupos ficam responsáveis por cada seção. 3. Pesquisam, redigem e revisam os textos. 4. Montagem do jornal no computador ou à mão. 5. Imprimem e distribuem para a escola. 6. Arquivam como portfólio.',
    materiais: 'Computador (opcional), papel A3, canetinhas, tesoura, cola, câmera',
    area_conhecimento: 'Letramento e Alfabetização',
    nivel_educacional: 'Ensino Fundamental — Anos Iniciais',
    bncc_refs: ['EF02LP08', 'EF03LP01', 'CG04', 'CG07'],
    dificuldade: 'avancada',
  },
  {
    titulo: 'Projeto de Feira de Ciências — Investigação e Apresentação',
    descricao: 'Alunos planejam, executam e apresentam um experimento científico simples. Desenvolve método científico, comunicação oral, trabalho em equipe e pensamento crítico.',
    como_fazer: '1. Escolha fenômenos simples (vulcão de bicarbonato, filtro de água caseiro). 2. Guie pela estrutura: pergunta → hipótese → teste → resultado → conclusão. 3. Cada grupo monta sua bancada. 4. Apresentam para outras turmas. 5. Registram em relatório ilustrado.',
    materiais: 'Materiais do experimento escolhido, cartaz de apresentação, relatório impresso',
    area_conhecimento: 'Ciências da Natureza',
    nivel_educacional: 'Ensino Fundamental — Anos Iniciais',
    bncc_refs: ['EF03CI07', 'CG02', 'CG04', 'CG07'],
    dificuldade: 'avancada',
  },
  {
    titulo: 'Maquete da Comunidade — Espaço Geográfico e Pertencimento',
    descricao: 'Alunos constroem uma maquete representando sua comunidade (bairro, rua, escola, casa). Desenvolve noção espacial, pertencimento e cidadania.',
    como_fazer: '1. Discuta: "Que lugares existem perto da escola?". 2. Mapeiem coletivamente. 3. Grupos constroem elementos (casas, ruas, praça, escola). 4. Montam a maquete coletiva. 5. Cada grupo apresenta sua parte e sua função. 6. Discutem melhorias que gostariam de ver na comunidade.',
    materiais: 'Caixas de papelão, isopor, tinta, palitos, massa de modelar, papel verde, régua',
    area_conhecimento: 'Ciências Humanas',
    nivel_educacional: 'Ensino Fundamental — Anos Iniciais',
    bncc_refs: ['EF01GE01', 'EF02GE01', 'CG01', 'CG09'],
    dificuldade: 'avancada',
  },
]

async function main() {
  console.log(`\n📚 Inserindo ${atividades.length} atividades BNCC no banco de dados...\n`)

  let inseridas = 0
  let ignoradas = 0
  let teste = 0;

  for (const atividade of atividades) {
    const existente = await prisma.atividadeBNCC.findFirst({
      where: { titulo: atividade.titulo },
    })

    if (existente) {
      console.log(`  ⏭  Já existe: ${atividade.titulo}`)
      ignoradas++
      continue
    }

    await prisma.atividadeBNCC.create({ data: atividade })
    console.log(`  ✅ Inserida: ${atividade.titulo}`)
    inseridas++
  }

  console.log(`\n🎉 Concluído! ${inseridas} inseridas, ${ignoradas} já existiam.\n`)

  const totals = await prisma.atividadeBNCC.groupBy({
    by: ['area_conhecimento'],
    _count: { id: true },
    orderBy: { area_conhecimento: 'asc' },
  })

  console.log('📊 Atividades por área:')
  for (const t of totals) {
    console.log(`   ${t.area_conhecimento}: ${t._count.id} atividades`)
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
