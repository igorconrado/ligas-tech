// ── Perfil Tech — perguntas ──
// Cada opção carrega um vetor de pontos pros arquétipos (ver arquetipos.js).
// Pra editar o jogo, mexa só neste arquivo: a ordem das etapas fica em
// /assets/js/pages/perfil-tech.js.
//
// Peso de referência: 3 = opção assinatura do arquétipo, 1 = afinidade vizinha.
// As perguntas decidem o resultado; os minigames servem de desempate.
//
// A matriz é balanceada de propósito: cada arquétipo é a opção principal em
// exatamente 6 perguntas e afinidade secundária em outras 6, e toda pergunta
// oferece 2 caminhos IbBot e 2 IbTech. Sem isso o resultado entorna pra um
// lado só e uma das ligas some da bancada — foi o que aconteceu na primeira
// versão (IbTech levava 67% dos resultados).
//
// O número de perguntas precisa ser múltiplo de 3 pra fechar a conta dos
// pares. Ao editar, rode de novo a simulação de balanceamento antes de subir.

export const PERGUNTAS = [
  {
    id: 'q1',
    enunciado: 'Chega uma caixa com um equipamento novo. Sua primeira reação:',
    opcoes: [
      { id: 'a', texto: 'Abrir e ver como é por dentro', pontos: { forjador: 3, domador: 1 } },
      { id: 'b', texto: 'Ligar na tomada e testar os limites', pontos: { domador: 3, forjador: 1 } },
      { id: 'c', texto: 'Ler o manual inteiro antes de encostar', pontos: { arquiteto: 3, artesao: 1 } },
      { id: 'd', texto: 'Reparar no design e pensar como podia ser melhor', pontos: { artesao: 3, arquiteto: 1 } },
    ],
  },
  {
    id: 'q2',
    enunciado: 'Num trabalho em grupo, o papel que sobra pra você é:',
    opcoes: [
      { id: 'a', texto: 'Quem monta e faz a coisa funcionar', pontos: { forjador: 3, navegador: 1 } },
      { id: 'b', texto: 'Quem testa e ajusta até ficar redondo', pontos: { navegador: 3, forjador: 1 } },
      { id: 'c', texto: 'Quem organiza a estrutura e divide as tarefas', pontos: { arquiteto: 3, oraculo: 1 } },
      { id: 'd', texto: 'Quem analisa os números e aponta o caminho', pontos: { oraculo: 3, arquiteto: 1 } },
    ],
  },
  {
    id: 'q3',
    enunciado: 'O que te daria mais satisfação?',
    opcoes: [
      { id: 'a', texto: 'Um motor obedecendo exatamente ao seu comando', pontos: { domador: 3, navegador: 1 } },
      { id: 'b', texto: 'Ver algo que você construiu se mover sozinho', pontos: { navegador: 3, domador: 1 } },
      { id: 'c', texto: 'Uma tela que a pessoa entende na hora', pontos: { artesao: 3, oraculo: 1 } },
      { id: 'd', texto: 'Um padrão nos dados que ninguém tinha visto', pontos: { oraculo: 3, artesao: 1 } },
    ],
  },
  {
    id: 'q4',
    enunciado: 'Escolhe um problema pra resolver hoje:',
    opcoes: [
      { id: 'a', texto: 'Uma peça que não encaixa e trava a montagem inteira', pontos: { forjador: 3, domador: 1 } },
      { id: 'b', texto: 'Um motor que trava sem motivo aparente', pontos: { domador: 3, forjador: 1 } },
      { id: 'c', texto: 'Um app que cai quando muita gente entra junto', pontos: { arquiteto: 3, oraculo: 1 } },
      { id: 'd', texto: 'Uma base de dados tão bagunçada que ninguém lê', pontos: { oraculo: 3, arquiteto: 1 } },
    ],
  },
  {
    id: 'q5',
    enunciado: 'Você aprende melhor:',
    opcoes: [
      { id: 'a', texto: 'Colocando a mão na massa e refazendo até acertar', pontos: { forjador: 3, artesao: 1 } },
      { id: 'b', texto: 'Entendendo como as partes se conectam antes de agir', pontos: { navegador: 3, oraculo: 1 } },
      { id: 'c', texto: 'Pegando algo pronto e modificando', pontos: { artesao: 3, forjador: 1 } },
      { id: 'd', texto: 'Estudando a teoria antes de tentar', pontos: { oraculo: 3, navegador: 1 } },
    ],
  },
  {
    id: 'q6',
    enunciado: 'Daqui a cinco anos, você quer estar:',
    opcoes: [
      { id: 'a', texto: 'Num laboratório montando eletrônica que ninguém fez', pontos: { domador: 3, navegador: 1 } },
      { id: 'b', texto: 'Programando máquinas que se dirigem sozinhas', pontos: { navegador: 3, domador: 1 } },
      { id: 'c', texto: 'Liderando a arquitetura de um produto grande', pontos: { arquiteto: 3, artesao: 1 } },
      { id: 'd', texto: 'Criando produtos que milhões de pessoas usam', pontos: { artesao: 3, arquiteto: 1 } },
    ],
  },
  {
    id: 'q7',
    enunciado: 'Numa feira de tecnologia, o que te prende primeiro?',
    opcoes: [
      { id: 'a', texto: 'A bancada com peças e ferramenta pra mexer', pontos: { forjador: 3, domador: 1 } },
      { id: 'b', texto: 'O braço robótico se movendo ao vivo', pontos: { domador: 3, forjador: 1 } },
      { id: 'c', texto: 'A demo rodando bonita numa tela gigante', pontos: { artesao: 3, oraculo: 1 } },
      { id: 'd', texto: 'O painel com dados chegando em tempo real', pontos: { oraculo: 3, artesao: 1 } },
    ],
  },
  {
    id: 'q8',
    enunciado: 'Sua mesa de estudo é:',
    opcoes: [
      { id: 'a', texto: 'Cheia de coisa pra montar e ferramenta espalhada', pontos: { forjador: 3, navegador: 1 } },
      { id: 'b', texto: 'Bagunçada, mas você sabe exatamente onde está tudo', pontos: { navegador: 3, forjador: 1 } },
      { id: 'c', texto: 'Etiquetada, dividida e sempre no mesmo lugar', pontos: { arquiteto: 3, artesao: 1 } },
      { id: 'd', texto: 'Bonita e pensada — cada coisa combinando', pontos: { artesao: 3, arquiteto: 1 } },
    ],
  },
  {
    id: 'q9',
    enunciado: 'Uma tarefa impossível cai no seu colo. Você:',
    opcoes: [
      { id: 'a', texto: 'Vai testando até alguma coisa funcionar', pontos: { domador: 3, navegador: 1 } },
      { id: 'b', texto: 'Quebra em partes menores e resolve uma por vez', pontos: { navegador: 3, domador: 1 } },
      { id: 'c', texto: 'Desenha o plano inteiro antes de começar', pontos: { arquiteto: 3, oraculo: 1 } },
      { id: 'd', texto: 'Procura quem já resolveu algo parecido e estuda', pontos: { oraculo: 3, arquiteto: 1 } },
    ],
  },
];

// Cursos da graduação do Ibmec BH, em ordem alfabética.
export const CURSOS = [
  'Administração',
  'Arquitetura e Urbanismo',
  'Ciência de Dados e Inteligência Artificial',
  'Direito',
  'Economia',
  'Engenharia Civil',
  'Engenharia da Computação',
  'Engenharia de Produção',
  'Engenharia de Software',
  'Relações Internacionais',
];
