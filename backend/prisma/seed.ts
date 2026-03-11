import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../../.env') })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Competências BNCC — Competências Gerais da Educação Básica (10 competências)
// Fonte: Base Nacional Comum Curricular, MEC, 2017
const competenciasGerais = [
  {
    codigo: 'CG01',
    descricao: 'Valorizar e utilizar os conhecimentos historicamente construídos sobre o mundo físico, social, cultural e digital para entender e explicar a realidade, continuar aprendendo e colaborar para a construção de uma sociedade justa, democrática e inclusiva.',
    area_conhecimento: 'Competências Gerais da BNCC',
    nivel_educacional: 'Educação Básica',
  },
  {
    codigo: 'CG02',
    descricao: 'Exercitar a curiosidade intelectual e recorrer à abordagem própria das ciências, incluindo a investigação, a reflexão, a análise crítica, a imaginação e a criatividade, para investigar causas, elaborar e testar hipóteses, formular e resolver problemas.',
    area_conhecimento: 'Competências Gerais da BNCC',
    nivel_educacional: 'Educação Básica',
  },
  {
    codigo: 'CG03',
    descricao: 'Valorizar e fruir as diversas manifestações artísticas e culturais, das locais às mundiais, e também participar de práticas diversificadas da produção artístico-cultural.',
    area_conhecimento: 'Competências Gerais da BNCC',
    nivel_educacional: 'Educação Básica',
  },
  {
    codigo: 'CG04',
    descricao: 'Utilizar diferentes linguagens — verbal (oral ou visual-motora, como Libras, e escrita), corporal, visual, sonora e digital —, bem como conhecimentos das linguagens artística, matemática e científica, para se expressar e partilhar informações.',
    area_conhecimento: 'Competências Gerais da BNCC',
    nivel_educacional: 'Educação Básica',
  },
  {
    codigo: 'CG05',
    descricao: 'Compreender, utilizar e criar tecnologias digitais de informação e comunicação de forma crítica, significativa, reflexiva e ética nas diversas práticas sociais.',
    area_conhecimento: 'Competências Gerais da BNCC',
    nivel_educacional: 'Educação Básica',
  },
  {
    codigo: 'CG06',
    descricao: 'Valorizar a diversidade de saberes e vivências culturais e apropriar-se de conhecimentos e experiências que lhe possibilitem entender as relações próprias do mundo do trabalho e fazer escolhas alinhadas ao exercício da cidadania.',
    area_conhecimento: 'Competências Gerais da BNCC',
    nivel_educacional: 'Educação Básica',
  },
  {
    codigo: 'CG07',
    descricao: 'Argumentar com base em fatos, dados e informações confiáveis, para formular, negociar e defender ideias, pontos de vista e decisões comuns que respeitem e promovam os direitos humanos, a consciência socioambiental e o consumo responsável.',
    area_conhecimento: 'Competências Gerais da BNCC',
    nivel_educacional: 'Educação Básica',
  },
  {
    codigo: 'CG08',
    descricao: 'Conhecer-se, apreciar-se e cuidar de sua saúde física e emocional, compreendendo-se na diversidade humana e reconhecendo suas emoções e as dos outros, com autocrítica e capacidade para lidar com a pressão.',
    area_conhecimento: 'Competências Gerais da BNCC',
    nivel_educacional: 'Educação Básica',
  },
  {
    codigo: 'CG09',
    descricao: 'Exercitar a empatia, o diálogo, a resolução de conflitos e a cooperação, fazendo-se respeitar e promovendo o respeito ao outro e aos direitos humanos, com acolhimento e valorização da diversidade.',
    area_conhecimento: 'Competências Gerais da BNCC',
    nivel_educacional: 'Educação Básica',
  },
  {
    codigo: 'CG10',
    descricao: 'Agir pessoal e coletivamente com autonomia, responsabilidade, flexibilidade, resiliência e determinação, tomando decisões com base em princípios éticos, democráticos, inclusivos, sustentáveis e solidários.',
    area_conhecimento: 'Competências Gerais da BNCC',
    nivel_educacional: 'Educação Básica',
  },
]

// Competências BNCC — Educação Infantil (EI) e Ensino Fundamental I
// Fonte: Base Nacional Comum Curricular, MEC, 2017
const competencias = [
  ...competenciasGerais,
  // ─── Educação Infantil — Campos de Experiência ───────────────────────────
  // O eu, o outro e o nós
  { codigo: 'EI01EO01', descricao: 'Perceber que suas ações têm efeitos nas outras crianças e nos adultos.', area_conhecimento: 'O eu, o outro e o nós', nivel_educacional: 'Educação Infantil — Bebês (0-1a6m)' },
  { codigo: 'EI01EO02', descricao: 'Perceber as possibilidades e os limites de seu corpo nas brincadeiras e interações das quais participa.', area_conhecimento: 'O eu, o outro e o nós', nivel_educacional: 'Educação Infantil — Bebês (0-1a6m)' },
  { codigo: 'EI02EO01', descricao: 'Demonstrar atitudes de cuidado e solidariedade na interação com crianças e adultos.', area_conhecimento: 'O eu, o outro e o nós', nivel_educacional: 'Educação Infantil — Crianças bem pequenas (1a7m-3a11m)' },
  { codigo: 'EI02EO02', descricao: 'Demonstrar imagem positiva de si e confiança em sua capacidade para enfrentar dificuldades e desafios.', area_conhecimento: 'O eu, o outro e o nós', nivel_educacional: 'Educação Infantil — Crianças bem pequenas (1a7m-3a11m)' },
  { codigo: 'EI03EO01', descricao: 'Demonstrar empatia pelos outros, percebendo que as pessoas têm diferentes sentimentos, necessidades e maneiras de pensar e agir.', area_conhecimento: 'O eu, o outro e o nós', nivel_educacional: 'Educação Infantil — Crianças pequenas (4a-5a11m)' },
  { codigo: 'EI03EO02', descricao: 'Agir de maneira independente, com confiança em suas capacidades, reconhecendo suas conquistas e limitações.', area_conhecimento: 'O eu, o outro e o nós', nivel_educacional: 'Educação Infantil — Crianças pequenas (4a-5a11m)' },
  { codigo: 'EI03EO03', descricao: 'Ampliar as relações interpessoais, desenvolvendo atitudes de participação e cooperação.', area_conhecimento: 'O eu, o outro e o nós', nivel_educacional: 'Educação Infantil — Crianças pequenas (4a-5a11m)' },
  { codigo: 'EI03EO04', descricao: 'Comunicar suas ideias e sentimentos a pessoas e grupos diversos.', area_conhecimento: 'O eu, o outro e o nós', nivel_educacional: 'Educação Infantil — Crianças pequenas (4a-5a11m)' },
  { codigo: 'EI03EO05', descricao: 'Demonstrar valorização das características de seu corpo e respeitar as características dos outros (crianças e adultos) com os quais convive.', area_conhecimento: 'O eu, o outro e o nós', nivel_educacional: 'Educação Infantil — Crianças pequenas (4a-5a11m)' },
  { codigo: 'EI03EO06', descricao: 'Manifestar interesse e respeito por diferentes culturas e modos de vida.', area_conhecimento: 'O eu, o outro e o nós', nivel_educacional: 'Educação Infantil — Crianças pequenas (4a-5a11m)' },
  { codigo: 'EI03EO07', descricao: 'Usar estratégias pautadas no respeito mútuo para lidar com conflitos nas interações com crianças e adultos.', area_conhecimento: 'O eu, o outro e o nós', nivel_educacional: 'Educação Infantil — Crianças pequenas (4a-5a11m)' },
  // Corpo, gestos e movimentos
  { codigo: 'EI01CG01', descricao: 'Movimentar as partes do corpo para exprimir corporalmente emoções, necessidades e desejos.', area_conhecimento: 'Corpo, gestos e movimentos', nivel_educacional: 'Educação Infantil — Bebês (0-1a6m)' },
  { codigo: 'EI02CG01', descricao: 'Apropriar-se de gestos e movimentos de sua cultura no cuidado de si e nos jogos e brincadeiras.', area_conhecimento: 'Corpo, gestos e movimentos', nivel_educacional: 'Educação Infantil — Crianças bem pequenas (1a7m-3a11m)' },
  { codigo: 'EI03CG01', descricao: 'Criar com o corpo formas diversificadas de expressão de sentimentos, sensações e emoções, tanto nas situações do cotidiano quanto em brincadeiras, dança, teatro, música.', area_conhecimento: 'Corpo, gestos e movimentos', nivel_educacional: 'Educação Infantil — Crianças pequenas (4a-5a11m)' },
  { codigo: 'EI03CG02', descricao: 'Demonstrar controle e adequação do uso de seu corpo em brincadeiras e jogos, escuta e reconto de histórias, atividades artísticas, entre outras possibilidades.', area_conhecimento: 'Corpo, gestos e movimentos', nivel_educacional: 'Educação Infantil — Crianças pequenas (4a-5a11m)' },
  { codigo: 'EI03CG03', descricao: 'Criar movimentos, gestos, olhares e mímicas com o corpo para comunicar, em diferentes contextos.', area_conhecimento: 'Corpo, gestos e movimentos', nivel_educacional: 'Educação Infantil — Crianças pequenas (4a-5a11m)' },
  // Traços, sons, cores e formas
  { codigo: 'EI01TS01', descricao: 'Explorar sons produzidos com o próprio corpo e com objetos do ambiente.', area_conhecimento: 'Traços, sons, cores e formas', nivel_educacional: 'Educação Infantil — Bebês (0-1a6m)' },
  { codigo: 'EI02TS01', descricao: 'Criar sons com materiais, objetos e instrumentos musicais, para acompanhar diversos ritmos de música.', area_conhecimento: 'Traços, sons, cores e formas', nivel_educacional: 'Educação Infantil — Crianças bem pequenas (1a7m-3a11m)' },
  { codigo: 'EI03TS01', descricao: 'Utilizar sons produzidos por materiais, objetos e instrumentos musicais durante brincadeiras de faz de conta, encenações, criações musicais, festas.', area_conhecimento: 'Traços, sons, cores e formas', nivel_educacional: 'Educação Infantil — Crianças pequenas (4a-5a11m)' },
  { codigo: 'EI03TS02', descricao: 'Expressar-se livremente por meio de desenho, pintura, colagem, dobradura e escultura, criando produções bidimensionais e tridimensionais.', area_conhecimento: 'Traços, sons, cores e formas', nivel_educacional: 'Educação Infantil — Crianças pequenas (4a-5a11m)' },
  // Escuta, fala, pensamento e imaginação
  { codigo: 'EI01EF01', descricao: 'Reconhecer quando é chamado por seu nome e reconhecer os nomes de pessoas com quem convive.', area_conhecimento: 'Escuta, fala, pensamento e imaginação', nivel_educacional: 'Educação Infantil — Bebês (0-1a6m)' },
  { codigo: 'EI02EF01', descricao: 'Dialogar com crianças e adultos, expressando seus desejos, necessidades, sentimentos e opiniões.', area_conhecimento: 'Escuta, fala, pensamento e imaginação', nivel_educacional: 'Educação Infantil — Crianças bem pequenas (1a7m-3a11m)' },
  { codigo: 'EI03EF01', descricao: 'Expressar ideias, desejos e sentimentos sobre suas vivências, por meio da linguagem oral e escrita (escrita espontânea), de fotos, desenhos e outras formas de expressão.', area_conhecimento: 'Escuta, fala, pensamento e imaginação', nivel_educacional: 'Educação Infantil — Crianças pequenas (4a-5a11m)' },
  { codigo: 'EI03EF02', descricao: 'Inventar brincadeiras cantadas, poemas e canções, criando rimas, aliterações e ritmos.', area_conhecimento: 'Escuta, fala, pensamento e imaginação', nivel_educacional: 'Educação Infantil — Crianças pequenas (4a-5a11m)' },
  { codigo: 'EI03EF03', descricao: 'Escolher e folhear livros, procurando orientar-se por temas e ilustrações para formular hipóteses sobre seus conteúdos.', area_conhecimento: 'Escuta, fala, pensamento e imaginação', nivel_educacional: 'Educação Infantil — Crianças pequenas (4a-5a11m)' },
  { codigo: 'EI03EF09', descricao: 'Levantar hipóteses em relação à linguagem escrita, realizando registros de palavras e textos, por meio de escrita espontânea.', area_conhecimento: 'Escuta, fala, pensamento e imaginação', nivel_educacional: 'Educação Infantil — Crianças pequenas (4a-5a11m)' },
  // Espaços, tempos, quantidades, relações e transformações
  { codigo: 'EI01ET01', descricao: 'Explorar e descobrir as propriedades de objetos e materiais (odor, cor, sabor, temperatura).', area_conhecimento: 'Espaços, tempos, quantidades, relações e transformações', nivel_educacional: 'Educação Infantil — Bebês (0-1a6m)' },
  { codigo: 'EI02ET01', descricao: 'Explorar e descrever semelhanças e diferenças entre as características e propriedades dos objetos (textura, massa, tamanho).', area_conhecimento: 'Espaços, tempos, quantidades, relações e transformações', nivel_educacional: 'Educação Infantil — Crianças bem pequenas (1a7m-3a11m)' },
  { codigo: 'EI03ET01', descricao: 'Estabelecer relações de comparação entre objetos, observando suas propriedades.', area_conhecimento: 'Espaços, tempos, quantidades, relações e transformações', nivel_educacional: 'Educação Infantil — Crianças pequenas (4a-5a11m)' },
  { codigo: 'EI03ET03', descricao: 'Identificar e selecionar fontes de informações, para responder a questões sobre a natureza, seus fenômenos, sua conservação.', area_conhecimento: 'Espaços, tempos, quantidades, relações e transformações', nivel_educacional: 'Educação Infantil — Crianças pequenas (4a-5a11m)' },
  { codigo: 'EI03ET04', descricao: 'Registrar observações, manipulações e medidas, usando múltiplas linguagens (desenho, registro por números ou escrita espontânea), em diferentes suportes.', area_conhecimento: 'Espaços, tempos, quantidades, relações e transformações', nivel_educacional: 'Educação Infantil — Crianças pequenas (4a-5a11m)' },
  { codigo: 'EI03ET05', descricao: 'Classificar objetos e figuras de acordo com suas semelhanças e diferenças.', area_conhecimento: 'Espaços, tempos, quantidades, relações e transformações', nivel_educacional: 'Educação Infantil — Crianças pequenas (4a-5a11m)' },
  { codigo: 'EI03ET06', descricao: 'Relatar fatos importantes sobre seu nascimento e desenvolvimento, a história dos seus familiares e da sua comunidade.', area_conhecimento: 'Espaços, tempos, quantidades, relações e transformações', nivel_educacional: 'Educação Infantil — Crianças pequenas (4a-5a11m)' },
  // ─── Ensino Fundamental I — Língua Portuguesa ────────────────────────────
  { codigo: 'EF01LP01', descricao: 'Reconhecer que textos são lidos e escritos de cima para baixo e da esquerda para a direita na página.', area_conhecimento: 'Língua Portuguesa', nivel_educacional: 'Ensino Fundamental — Anos Iniciais (1º ano)' },
  { codigo: 'EF01LP02', descricao: 'Perceber que palavras diferentes compartilham certas letras.', area_conhecimento: 'Língua Portuguesa', nivel_educacional: 'Ensino Fundamental — Anos Iniciais (1º ano)' },
  { codigo: 'EF01LP03', descricao: 'Ler palavras novas com precisão na decodificação, no caso de palavras simples, e com precisão e fluência no caso de palavras conhecidas.', area_conhecimento: 'Língua Portuguesa', nivel_educacional: 'Ensino Fundamental — Anos Iniciais (1º ano)' },
  { codigo: 'EF01LP04', descricao: 'Identificar o tema e os propósitos comunicativos de textos lidos por professores ou colegas.', area_conhecimento: 'Língua Portuguesa', nivel_educacional: 'Ensino Fundamental — Anos Iniciais (1º ano)' },
  { codigo: 'EF02LP01', descricao: 'Utilizar a linguagem escrita para se orientar na vida cotidiana (calendários, notícias, cartazes, cardápios, avisos), compreendendo o papel da escrita.', area_conhecimento: 'Língua Portuguesa', nivel_educacional: 'Ensino Fundamental — Anos Iniciais (2º ano)' },
  { codigo: 'EF03LP01', descricao: 'Ler e compreender, silenciosamente e, em seguida, em voz alta, com autonomia e fluência, textos curtos com nível de textualidade adequado.', area_conhecimento: 'Língua Portuguesa', nivel_educacional: 'Ensino Fundamental — Anos Iniciais (3º ano)' },
  { codigo: 'EF04LP01', descricao: 'Ler e compreender, silenciosamente e, em seguida, em voz alta, com autonomia e fluência, textos com nível de textualidade adequado ao 4º ano.', area_conhecimento: 'Língua Portuguesa', nivel_educacional: 'Ensino Fundamental — Anos Iniciais (4º ano)' },
  { codigo: 'EF05LP01', descricao: 'Utilizar, ao produzir o texto, conhecimentos linguísticos e gramaticais: ortografia, regras básicas de concordância nominal e verbal, pontuação (ponto final, ponto de exclamação, ponto de interrogação, vírgulas em enumerações).', area_conhecimento: 'Língua Portuguesa', nivel_educacional: 'Ensino Fundamental — Anos Iniciais (5º ano)' },
  // ─── Ensino Fundamental I — Matemática ────────────────────────────────────
  { codigo: 'EF01MA01', descricao: 'Utilizar números naturais como indicação de quantidade ou de ordem em diferentes situações cotidianas e reconhecer situações em que os números não indicam quantidade nem ordem.', area_conhecimento: 'Matemática', nivel_educacional: 'Ensino Fundamental — Anos Iniciais (1º ano)' },
  { codigo: 'EF01MA02', descricao: 'Contar de maneira exata ou aproximada, utilizando diferentes estratégias como o pareamento e outros agrupamentos.', area_conhecimento: 'Matemática', nivel_educacional: 'Ensino Fundamental — Anos Iniciais (1º ano)' },
  { codigo: 'EF02MA01', descricao: 'Comparar e ordenar números naturais (até a ordem de centenas) pela compreensão de características do sistema de numeração decimal.', area_conhecimento: 'Matemática', nivel_educacional: 'Ensino Fundamental — Anos Iniciais (2º ano)' },
  { codigo: 'EF03MA01', descricao: 'Ler, escrever e comparar números naturais de até a ordem de unidade de milhar, estabelecendo correspondência entre a escrita por extenso, a notação simbólica e representações em semirretas e quadros de valores.', area_conhecimento: 'Matemática', nivel_educacional: 'Ensino Fundamental — Anos Iniciais (3º ano)' },
  { codigo: 'EF04MA01', descricao: 'Ler, escrever e ordenar números naturais até a ordem de dezenas de milhar.', area_conhecimento: 'Matemática', nivel_educacional: 'Ensino Fundamental — Anos Iniciais (4º ano)' },
  { codigo: 'EF05MA01', descricao: 'Ler, escrever e ordenar números naturais acima de 1.000.000.', area_conhecimento: 'Matemática', nivel_educacional: 'Ensino Fundamental — Anos Iniciais (5º ano)' },
  // ─── Ensino Fundamental I — Ciências ──────────────────────────────────────
  { codigo: 'EF01CI01', descricao: 'Comparar características de diferentes materiais presentes em objetos de uso cotidiano, discutindo sua origem, os modos como são descartados e como podem ser usados de forma mais consciente.', area_conhecimento: 'Ciências da Natureza', nivel_educacional: 'Ensino Fundamental — Anos Iniciais (1º ano)' },
  { codigo: 'EF02CI01', descricao: 'Identificar de onde vêm os alimentos consumidos pela família e pela comunidade, reconhecendo a importância da agricultura para a alimentação humana.', area_conhecimento: 'Ciências da Natureza', nivel_educacional: 'Ensino Fundamental — Anos Iniciais (2º ano)' },
  { codigo: 'EF03CI01', descricao: 'Produzir diferentes sons a partir da vibração de variados objetos e identificar variáveis que influem nesse fenômeno.', area_conhecimento: 'Ciências da Natureza', nivel_educacional: 'Ensino Fundamental — Anos Iniciais (3º ano)' },
  // ─── Ensino Fundamental I — História ─────────────────────────────────────
  { codigo: 'EF01HI01', descricao: 'Identificar aspectos do seu crescimento por meio do registro das lembranças particulares ou de lembranças dos membros de sua família e/ou de sua comunidade.', area_conhecimento: 'História', nivel_educacional: 'Ensino Fundamental — Anos Iniciais (1º ano)' },
  { codigo: 'EF02HI01', descricao: 'Reconhecer espaços de sociabilidade e identificar os motivos que aproximam e separam as pessoas em diferentes grupos sociais ou de parentesco.', area_conhecimento: 'História', nivel_educacional: 'Ensino Fundamental — Anos Iniciais (2º ano)' },
  // ─── Ensino Fundamental I — Artes ─────────────────────────────────────────
  { codigo: 'EF15AR01', descricao: 'Identificar e apreciar formas distintas das artes visuais tradicionais e contemporâneas, cultivando a percepção, o imaginário, a capacidade de simbolizar e o repertório imagético.', area_conhecimento: 'Arte', nivel_educacional: 'Ensino Fundamental — Anos Iniciais (1º ao 5º ano)' },
  { codigo: 'EF15AR06', descricao: 'Conviver e respeitar normas, combinados e acordos coletivos nas aulas de Artes, fazendo descobertas artísticas individuais e coletivas.', area_conhecimento: 'Arte', nivel_educacional: 'Ensino Fundamental — Anos Iniciais (1º ao 5º ano)' },
  // ─── Ensino Fundamental I — Educação Física ──────────────────────────────
  { codigo: 'EF15EF01', descricao: 'Experimentar e fruir, de forma individual e coletiva, diferentes brincadeiras e jogos infantis inclusive aqueles de matrizes indígena e africano-brasileira, e recriá-los, valorizando a importância desse patrimônio histórico cultural.', area_conhecimento: 'Educação Física', nivel_educacional: 'Ensino Fundamental — Anos Iniciais (1º ao 5º ano)' },
  { codigo: 'EF15EF07', descricao: 'Participar de atividades de ginástica de forma coletiva, sem se preocupar com a comparação de rendimento com os colegas, valorizando a estética e o gosto pessoal.', area_conhecimento: 'Educação Física', nivel_educacional: 'Ensino Fundamental — Anos Iniciais (1º ao 5º ano)' },
]

async function main() {
  console.log('Iniciando seed de competências BNCC...')
  let inserted = 0
  let skipped = 0

  for (const c of competencias) {
    const result = await prisma.competenciaBNCC.upsert({
      where: { codigo: c.codigo },
      create: c,
      update: {},
    })
    if (result) inserted++
    else skipped++
  }

  console.log(`✅ Seed concluído: ${competencias.length} competências BNCC processadas.`)
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
