// ── Perfil Tech — os 6 arquétipos ──
// Três puxam pra IbBot, três pra IbTech: o resultado sempre termina
// num convite concreto pra uma das ligas.
//
// A ordem do array é o critério de desempate (primeiro vence).

export const ARQUETIPOS = [
  {
    id: 'forjador',
    nome: 'O FORJADOR',
    liga: 'ibbot',
    tagline: 'Se não dá pra pegar na mão, não terminou.',
    descricao:
      'Você entende as coisas desmontando elas. Chassi, encaixe, peça que não cabe — ' +
      'seu lugar é onde o projeto sai da tela e vira objeto. Na IbBot você começaria ' +
      'pela estrutura: modelagem, corte, montagem e o robô de pé pela primeira vez.',
    tracos: ['Mão na massa', 'Visão espacial', 'Aprende errando'],
  },
  {
    id: 'domador',
    nome: 'O DOMADOR',
    liga: 'ibbot',
    tagline: 'Hardware que obedece.',
    descricao:
      'Você gosta da fronteira onde o código encosta no mundo físico. Motor, sensor, ' +
      'placa e um LED que finalmente acende na hora certa. Na IbBot você iria pra ' +
      'eletrônica e firmware — a parte que faz a máquina responder de verdade.',
    tracos: ['Reflexo rápido', 'Curiosidade elétrica', 'Testa até quebrar'],
  },
  {
    id: 'navegador',
    nome: 'O NAVEGADOR',
    liga: 'ibbot',
    tagline: 'Ele anda sozinho — e você ensinou.',
    descricao:
      'Não te interessa só mover o robô: te interessa que ele decida pra onde ir. ' +
      'Sensores, rota, desvio de obstáculo, visão computacional. Na IbBot você ficaria ' +
      'com a autonomia, a parte em que a máquina começa a parecer inteligente.',
    tracos: ['Pensa em sistemas', 'Memória de padrão', 'Paciência de ajuste fino'],
  },
  {
    id: 'arquiteto',
    nome: 'O ARQUITETO',
    liga: 'ibtech',
    tagline: 'Você sustenta o que ninguém vê.',
    descricao:
      'Você pensa antes de escrever e prefere resolver o problema na raiz. Banco, API, ' +
      'estrutura, o que acontece quando entram dez mil pessoas ao mesmo tempo. Na IbTech ' +
      'você iria pro backend — a fundação em que o resto do time se apoia.',
    tracos: ['Organiza o caos', 'Precisão acima de pressa', 'Pensa em escala'],
  },
  {
    id: 'artesao',
    nome: 'O ARTESÃO',
    liga: 'ibtech',
    tagline: 'O que a pessoa toca é obra sua.',
    descricao:
      'Você repara em detalhe que os outros não veem: espaçamento torto, botão no lugar ' +
      'errado, fluxo que confunde. Na IbTech você iria pro frontend e produto — transformar ' +
      'sistema em algo que qualquer pessoa entende em três segundos.',
    tracos: ['Olho de detalhe', 'Empatia com o usuário', 'Rápido no protótipo'],
  },
  {
    id: 'oraculo',
    nome: 'O ORÁCULO',
    liga: 'ibtech',
    tagline: 'O padrão já estava lá. Você viu.',
    descricao:
      'Onde os outros veem planilha, você vê tendência. Dado, modelo, previsão, aquele ' +
      'gráfico que muda a decisão do time inteiro. Na IbTech você iria pra dados e IA — ' +
      'a área que transforma informação bruta em vantagem real.',
    tracos: ['Lê padrões', 'Gosta de teoria', 'Decide por evidência'],
  },
];

export const LIGAS = {
  ibbot: {
    nome: 'IbBot',
    chamada: 'Robótica Autônoma',
    cor: 'var(--red)',
    pagina: '/ibbot',
    instagram: 'https://instagram.com/ibbotbh',
    handle: '@ibbotbh',
    encontro: 'Terças-feiras',
  },
  ibtech: {
    nome: 'IbTech',
    chamada: 'Desenvolvimento de Software',
    cor: 'var(--blue)',
    pagina: '/ibtech',
    instagram: 'https://instagram.com/ibtechbh',
    handle: '@ibtechbh',
    encontro: 'Quintas-feiras',
  },
};

/** Placar zerado — base pra somar os pontos de perguntas e minigames. */
export function placarVazio() {
  return Object.fromEntries(ARQUETIPOS.map(a => [a.id, 0]));
}

/** Soma um vetor de pontos ({ forjador: 2, domador: 1 }) no placar. */
export function somarPontos(placar, pontos) {
  for (const [id, valor] of Object.entries(pontos || {})) {
    if (id in placar) placar[id] += valor;
  }
  return placar;
}

/**
 * Ranking do placar, do maior pro menor.
 * Empate é resolvido pela ordem de ARQUETIPOS.
 */
export function ranquear(placar) {
  return ARQUETIPOS
    .map((a, ordem) => ({ ...a, pontos: placar[a.id] ?? 0, ordem }))
    .sort((x, y) => y.pontos - x.pontos || x.ordem - y.ordem);
}
