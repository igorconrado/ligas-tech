// ── Perfil Tech — pixel art dos mascotes ──
// Sprites escritos à mão como grade de caracteres. Cada letra é uma cor da
// paleta; ponto é transparente. Desenhados em canvas com image-rendering
// pixelated, então escalam sem borrar.
//
// Baseados nas marcas oficiais (assets/design_files):
//   • Gato IbTech — rosto de frente, dividido na diagonal entre azure e
//     navy, anel branco em volta da face e olhos de pupila vertical.
//   • Rato IbBot  — rosto de frente em line-art branco, orelhas redondas
//     grandes e olhos vermelhos angulares.
//
// Os dois são marcas de ROSTO, não bichos de corpo inteiro: por isso a
// animação é piscada e balanço, e não corrida.

export const PALETA = {
  // gato — IbTech
  A: '#00A6FF',   // azure (metade clara)
  Z: '#070C5E',   // navy (metade escura)
  W: '#FFFFFF',   // anel e brilho do olho
  S: '#1D6FBF',   // focinho
  // rato — IbBot
  L: '#EDEDEF',   // traço branco
  R: '#E10600',   // olho vermelho
  // bug
  B: '#FFB020',
  V: '#8A5A00',
};

// ── Gato IbTech (24×22) ────────────────────────────────────────────────────
// Metade esquerda azure, direita navy — e a face interna invertida, como
// na marca.

const GATO = [
  '..A..................Z..',
  '..AA................ZZ..',
  '..AAA..............ZZZ..',
  '..AAAA............ZZZZ..',
  '..AAAAA..........ZZZZZ..',
  '..AAAAAAA......ZZZZZZZ..',
  '..AAAAAAAAAAZZZZZZZZZZ..',
  '.AAAAAAAAAAAZZZZZZZZZZZ.',
  '.AAAWWWWWWWWWWWWWWWWZZZ.',
  '.AAWZZZZZZZZAAAAAAAAWZZ.',
  '.AAWZZZZZZZZAAAAAAAAWZZ.',
  '.AAWZZAAAZZZAAAZZZAAWZZ.',
  '.AAWZZWZWZZZAAAWAWAAWZZ.',
  '.AAWZZAAAZZZAAAZZZAAWZZ.',
  '.AAWZZZZZZZZAAAAAAAAWZZ.',
  '.AAWZZZZZZZSSAAAAAAAWZZ.',
  '.AAWZZZZZZZSSAAAAAAAWZZ.',
  '.AAWZZZZZZZZAAAAAAAAWZZ.',
  '..AAWZZZZZZZAAAAAAAWZZ..',
  '...AAAWWWWWWWWWWWWZZZ...',
  '.....AAAAAAAZZZZZZZ.....',
  '.........AAAZZZ.........',
];

// Olhos fechados — só a linha da pálpebra
const GATO_PISCA = GATO.map((linha, i) => {
  if (i === 11 || i === 13) return '.AAWZZZZZZZZAAAAAAAAWZZ.';
  if (i === 12) return '.AAWZZAAAZZZAAAZZZAAWZZ.';
  return linha;
});

// ── Rato IbBot (24×18) ─────────────────────────────────────────────────────
// Line-art: só contorno branco e os olhos vermelhos.

const RATO = [
  '...LLL............LLL...',
  '..L...L..........L...L..',
  '.L.....L........L.....L.',
  '.L.....L........L.....L.',
  '.L.....L........L.....L.',
  '..L...L...LLLL...L...L..',
  '..L..L..LL....LL..L..L..',
  '...LL...L......L...LL...',
  '.......L........L.......',
  '......L..........L......',
  '.....L.RRR....RRR.L.....',
  '.....L..RR....RR..L.....',
  '.....L.....LL.....L.....',
  '......L..L....L..L......',
  '..LL...L..L..L..L...LL..',
  '.L......L..LL..L......L.',
  '..........LLLL..........',
  '...........LL...........',
];

const RATO_PISCA = RATO.map((linha, i) => {
  if (i === 10) return '.....L............L.....';
  if (i === 11) return '.....L..LL....LL..L.....';
  return linha;
});

// ── Bug (8×8, alvo do minigame) ────────────────────────────────────────────

const BUG = [
  '..B..B..',
  '...BB...',
  '..BBBB..',
  '.BVBBVB.',
  'BBBBBBBB',
  '.BBBBBB.',
  '..B..B..',
  '.V....V.',
];

export const SPRITES = {
  gato: { normal: GATO, piscando: GATO_PISCA },
  rato: { normal: RATO, piscando: RATO_PISCA },
  bug: { normal: BUG, piscando: BUG },
};

/** Mascote de cada liga. */
export const MASCOTE_DA_LIGA = {
  ibbot: SPRITES.rato,
  ibtech: SPRITES.gato,
};

// ── Renderização ───────────────────────────────────────────────────────────

export function larguraSprite(sprite) { return sprite[0].length; }
export function alturaSprite(sprite) { return sprite.length; }

/** Desenha o sprite no contexto, com o canto superior esquerdo em (x, y). */
export function desenhar(ctx, sprite, x, y, escala = 4) {
  for (let linha = 0; linha < sprite.length; linha++) {
    for (let coluna = 0; coluna < sprite[linha].length; coluna++) {
      const cor = PALETA[sprite[linha][coluna]];
      if (!cor) continue;
      ctx.fillStyle = cor;
      ctx.fillRect(x + coluna * escala, y + linha * escala, escala, escala);
    }
  }
}

/**
 * Casa a resolução do canvas com a largura que o CSS deu a ele.
 * Sem isso o desenho estica, porque o canvas tem largura de layout e
 * resolução interna independentes.
 */
export function ajustarLargura(canvas) {
  const largura = Math.round(canvas.getBoundingClientRect().width);
  if (largura > 0) canvas.width = largura;
  return canvas;
}

/** Canvas isolado com um sprite — pra colar no DOM. */
export function canvasDe(sprite, escala = 4) {
  const canvas = document.createElement('canvas');
  canvas.width = larguraSprite(sprite) * escala;
  canvas.height = alturaSprite(sprite) * escala;
  canvas.className = 'pixel';
  desenhar(canvas.getContext('2d'), sprite, 0, 0, escala);
  return canvas;
}

/** Escolhe o quadro (normal ou piscando) conforme o relógio da animação. */
function quadroDe(mascote, decorrido, atraso) {
  const ciclo = (decorrido + atraso) % 3200;
  return ciclo > 3000 ? mascote.piscando : mascote.normal;
}

/**
 * Os dois mascotes lado a lado, piscando fora de sincronia e balançando.
 * Usado na tela inicial e nas transições entre etapas.
 * Devolve uma função pra parar a animação.
 */
export function dupla(canvas, { escala = 2 } = {}) {
  const ctx = canvas.getContext('2d');
  let inicio = null;
  let parado = false;

  const quadro = agora => {
    if (parado) return;
    if (inicio === null) inicio = agora;
    const decorrido = agora - inicio;

    const gato = quadroDe(SPRITES.gato, decorrido, 0);
    const rato = quadroDe(SPRITES.rato, decorrido, 1500);

    const larguraGato = larguraSprite(gato) * escala;
    const larguraRato = larguraSprite(rato) * escala;
    const vao = 12 * escala;
    const esquerda = (canvas.width - (larguraGato + vao + larguraRato)) / 2;

    // Balanço de um "pixel", alternado entre os dois
    const sobeGato = Math.sin(decorrido / 500) > 0 ? escala : 0;
    const sobeRato = Math.sin(decorrido / 500) > 0 ? 0 : escala;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    desenhar(ctx, gato, esquerda, canvas.height - alturaSprite(gato) * escala - sobeGato, escala);
    desenhar(ctx, rato, esquerda + larguraGato + vao, canvas.height - alturaSprite(rato) * escala - sobeRato, escala);

    requestAnimationFrame(quadro);
  };

  requestAnimationFrame(quadro);
  return () => { parado = true; };
}

/** Um mascote parado, piscando de vez em quando (tela de resultado). */
export function piscar(canvas, mascote, { escala = 4 } = {}) {
  const ctx = canvas.getContext('2d');
  let inicio = null;
  let parado = false;

  const quadro = agora => {
    if (parado) return;
    if (inicio === null) inicio = agora;
    const decorrido = agora - inicio;
    const sprite = quadroDe(mascote, decorrido, 0);
    const sobe = Math.sin(decorrido / 620) > 0 ? 0 : escala;
    const base = canvas.height - alturaSprite(sprite) * escala;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    desenhar(ctx, sprite, 0, Math.max(0, base - sobe), escala);
    requestAnimationFrame(quadro);
  };

  requestAnimationFrame(quadro);
  return () => { parado = true; };
}
