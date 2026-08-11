// ── Minigame 2 · Sequência de sinais ──
// Quatro pinos acendem numa ordem; o jogador repete. A cada nível a
// sequência cresce. Mede memória de padrão — território do ORÁCULO e do
// NAVEGADOR. Quem não passa do primeiro nível tende ao perfil que prefere
// mexer a memorizar (FORJADOR, DOMADOR).

import { el, esperar, somar, contagemRegressiva, encerramento, montarPalco } from '../dom.js';

const NIVEIS = [3, 4, 5, 6];
const PINOS = ['r', 'b', 'g', 'a'];
const ESPERA_MAXIMA = 6000;

function tocarSequencia(pinos, sequencia) {
  return (async () => {
    await esperar(400);
    for (const indice of sequencia) {
      pinos[indice].classList.add('aceso');
      await esperar(440);
      pinos[indice].classList.remove('aceso');
      await esperar(180);
    }
  })();
}

/** Lê a repetição do jogador. Resolve com true (acertou tudo) ou false. */
function lerRepeticao(pinos, sequencia) {
  return new Promise(resolve => {
    let posicao = 0;
    let encerrado = false;

    const limpar = () => {
      clearTimeout(relogio);
      pinos.forEach(pino => pino.removeEventListener('pointerdown', aoTocar));
    };

    const terminar = acertou => {
      if (encerrado) return;
      encerrado = true;
      limpar();
      resolve(acertou);
    };

    function aoTocar(evento) {
      evento.preventDefault();
      const pino = evento.currentTarget;
      const indice = Number(pino.dataset.indice);

      pino.classList.add('aceso');
      setTimeout(() => pino.classList.remove('aceso'), 180);

      if (indice !== sequencia[posicao]) {
        pino.classList.add('errou');
        setTimeout(() => pino.classList.remove('errou'), 400);
        terminar(false);
        return;
      }

      posicao++;
      if (posicao === sequencia.length) terminar(true);
    }

    pinos.forEach(pino => pino.addEventListener('pointerdown', aoTocar));
    const relogio = setTimeout(() => terminar(false), ESPERA_MAXIMA);
  });
}

export default {
  id: 'sequencia',
  nome: 'missão 02 · sequência de sinais',
  instrucao: 'decore a ordem que os pinos acendem e repita.',

  async run(palco) {
    const { arena, progresso } = montarPalco(palco, this);
    arena.classList.add('arena-sequencia');

    const grade = el('div', 'mg-pinos');
    const pinos = PINOS.map((cor, indice) => {
      const pino = el('button', `mg-pino ${cor}`);
      pino.type = 'button';
      pino.dataset.indice = String(indice);
      pino.setAttribute('aria-label', `Pino ${indice + 1}`);
      grade.appendChild(pino);
      return pino;
    });
    arena.appendChild(grade);

    const aviso = el('div', 'mg-aviso');
    arena.appendChild(aviso);

    await contagemRegressiva(arena);

    let niveis = 0;
    for (const [ordem, tamanho] of NIVEIS.entries()) {
      progresso(ordem / NIVEIS.length);

      const sequencia = Array.from(
        { length: tamanho },
        () => Math.floor(Math.random() * PINOS.length)
      );

      aviso.textContent = 'Olhe...';
      grade.classList.add('travado');
      await tocarSequencia(pinos, sequencia);

      aviso.textContent = 'Agora repita!';
      grade.classList.remove('travado');
      const acertou = await lerRepeticao(pinos, sequencia);

      if (!acertou) break;
      niveis++;
      aviso.textContent = 'Boa!';
      await esperar(500);
    }
    progresso(1);
    aviso.textContent = '';

    const pontos = {};
    if (niveis >= 1) somar(pontos, 'oraculo', 1);
    if (niveis >= 2) { somar(pontos, 'oraculo', 1); somar(pontos, 'navegador', 1); }
    if (niveis >= 3) { somar(pontos, 'navegador', 1); somar(pontos, 'arquiteto', 1); }
    if (niveis >= 4) somar(pontos, 'oraculo', 1);
    if (niveis === 0) { somar(pontos, 'forjador', 1); somar(pontos, 'domador', 1); }

    await encerramento(
      arena,
      niveis === 0 ? 'Sequência perdida' : `${niveis} nível(is) limpo(s)`,
      niveis === NIVEIS.length ? 'Memória impecável.' : `Você chegou até ${NIVEIS[niveis] ?? NIVEIS.at(-1)} sinais.`
    );

    return { pontos, meta: { niveis } };
  },
};
