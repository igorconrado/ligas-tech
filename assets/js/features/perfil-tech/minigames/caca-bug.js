// ── Minigame 1 · Caça-bug ──
// Alvos piscam na arena: bug pra tocar, PASS verde pra deixar quieto.
// Mede duas coisas diferentes de propósito — velocidade de reação (DOMADOR,
// NAVEGADOR) e precisão sob pressa (ARQUITETO, FORJADOR).

import { el, esperar, somar, contagemRegressiva, encerramento, montarPalco } from '../dom.js';
import { SPRITES, canvasDe } from '../sprites.js';

const RODADAS = 10;
const CHANCE_BUG = 0.72;
const TAMANHO_ALVO = 78;

function rodada(arena, stats, vidaMs, ehBug) {
  return new Promise(resolve => {
    const area = arena.getBoundingClientRect();
    const alvo = el('button', `mg-alvo ${ehBug ? 'bug' : 'ok'}`);
    alvo.type = 'button';
    alvo.setAttribute('aria-label', ehBug ? 'bug' : 'pass');
    if (ehBug) alvo.appendChild(canvasDe(SPRITES.bug.normal, 7));
    else alvo.textContent = 'PASS';
    alvo.style.left = `${Math.random() * Math.max(0, area.width - TAMANHO_ALVO)}px`;
    alvo.style.top = `${Math.random() * Math.max(0, area.height - TAMANHO_ALVO)}px`;

    const nasceu = performance.now();
    let encerrado = false;

    const encerrar = classe => {
      if (encerrado) return;
      encerrado = true;
      clearTimeout(relogio);
      alvo.classList.add(classe);
      setTimeout(() => alvo.remove(), 180);
      resolve();
    };

    alvo.addEventListener('pointerdown', evento => {
      evento.preventDefault();
      if (ehBug) {
        stats.acertos++;
        stats.tempos.push(performance.now() - nasceu);
        encerrar('acertou');
      } else {
        stats.erros++;
        encerrar('errou');
      }
    });

    const relogio = setTimeout(() => {
      if (ehBug) stats.perdidos++;
      encerrar('sumiu');
    }, vidaMs);

    arena.appendChild(alvo);
  });
}

export default {
  id: 'caca-bug',
  nome: 'missão 01 · caça-bug',
  instrucao: 'toque nos bugs. deixe o PASS verde em paz.',

  async run(palco) {
    const { arena, progresso } = montarPalco(palco, this);
    await contagemRegressiva(arena);

    const stats = { acertos: 0, erros: 0, perdidos: 0, tempos: [] };
    for (let i = 0; i < RODADAS; i++) {
      progresso(i / RODADAS);
      await rodada(arena, stats, 1060 - i * 32, Math.random() < CHANCE_BUG);
      await esperar(130);
    }
    progresso(1);

    const mediaMs = stats.tempos.length
      ? Math.round(stats.tempos.reduce((a, b) => a + b, 0) / stats.tempos.length)
      : null;

    const pontos = {};
    if (mediaMs !== null && mediaMs < 620) {
      somar(pontos, 'domador', 2);
      somar(pontos, 'navegador', 1);
    } else if (mediaMs !== null && mediaMs < 860) {
      somar(pontos, 'domador', 1);
      somar(pontos, 'forjador', 1);
    } else {
      somar(pontos, 'forjador', 1);
    }

    if (stats.erros === 0) somar(pontos, 'arquiteto', 2);
    else if (stats.erros === 1) somar(pontos, 'arquiteto', 1);

    if (stats.perdidos === 0 && stats.acertos > 0) somar(pontos, 'navegador', 1);

    await encerramento(
      arena,
      `${stats.acertos} bugs eliminados`,
      mediaMs !== null
        ? `${stats.erros} erro(s) · reação média ${mediaMs}ms`
        : `${stats.erros} erro(s)`
    );

    return { pontos, meta: { ...stats, mediaMs, tempos: undefined } };
  },
};
