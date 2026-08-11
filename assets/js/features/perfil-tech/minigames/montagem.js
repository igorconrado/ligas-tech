// ── Minigame 3 · Montagem ──
// Arrasta três peças pra função correta. Mistura raciocínio espacial com
// motricidade — FORJADOR (monta rápido) e ARTESÃO (não erra o encaixe).
// Última missão antes da revelação, então serve de "prova final".

import { el, esperar, embaralhar, somar, contagemRegressiva, encerramento, montarPalco } from '../dom.js';

const LIMITE_MS = 30000;

const PECAS = [
  { id: 'motor',  nome: 'MOTOR',  funcao: 'TRAÇÃO' },
  { id: 'chassi', nome: 'CHASSI', funcao: 'ESTRUTURA' },
  { id: 'placa',  nome: 'PLACA',  funcao: 'CÉREBRO' },
];

export default {
  id: 'montagem',
  nome: 'missão 03 · montagem',
  instrucao: 'arraste cada peça para a função que ela cumpre.',

  async run(palco) {
    const { arena, progresso } = montarPalco(palco, this);
    arena.classList.add('arena-montagem');

    // Slots (funções) e bandeja (peças) embaralhados de forma independente
    const linhaSlots = el('div', 'mg-slots');
    const slots = embaralhar(PECAS).map(peca => {
      const slot = el('div', 'mg-slot');
      slot.dataset.peca = peca.id;
      slot.appendChild(el('span', 'mg-slot-label', peca.funcao));
      linhaSlots.appendChild(slot);
      return slot;
    });

    const bandeja = el('div', 'mg-bandeja');
    const pecas = embaralhar(PECAS).map(item => {
      const berco = el('div', 'mg-berco');
      const peca = el('div', 'mg-peca', item.nome);
      peca.dataset.peca = item.id;
      berco.appendChild(peca);
      bandeja.appendChild(berco);
      return peca;
    });

    arena.append(linhaSlots, bandeja);

    await contagemRegressiva(arena);

    const estado = { encaixadas: 0, erros: 0 };
    let acabou = false;
    let encerrar;
    const fim = new Promise(resolve => {
      encerrar = () => { if (!acabou) { acabou = true; resolve(); } };
    });

    const slotSob = (x, y) => slots.find(slot => {
      const r = slot.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    });

    const devolver = peca => {
      peca.classList.remove('arrastando');
      peca.style.cssText = '';
    };

    const encaixar = (peca, slot) => {
      peca.dataset.pronta = '1';
      peca.style.cssText = '';
      peca.classList.remove('arrastando');
      peca.classList.add('encaixada');
      slot.classList.add('cheio');
      slot.appendChild(peca);
      estado.encaixadas++;
      if (estado.encaixadas === PECAS.length) encerrar();
    };

    pecas.forEach(peca => {
      let dx = 0;
      let dy = 0;
      let arrastando = false;

      peca.addEventListener('pointerdown', evento => {
        if (peca.dataset.pronta || acabou) return;
        evento.preventDefault();
        const r = peca.getBoundingClientRect();
        dx = evento.clientX - r.left;
        dy = evento.clientY - r.top;
        peca.setPointerCapture(evento.pointerId);
        peca.classList.add('arrastando');
        peca.style.width = `${r.width}px`;
        peca.style.height = `${r.height}px`;
        peca.style.left = `${r.left}px`;
        peca.style.top = `${r.top}px`;
        arrastando = true;
      });

      peca.addEventListener('pointermove', evento => {
        if (!arrastando) return;
        peca.style.left = `${evento.clientX - dx}px`;
        peca.style.top = `${evento.clientY - dy}px`;
        const alvo = slotSob(evento.clientX, evento.clientY);
        slots.forEach(slot => slot.classList.toggle('mirando', slot === alvo));
      });

      const soltar = evento => {
        if (!arrastando) return;
        arrastando = false;
        slots.forEach(slot => slot.classList.remove('mirando'));

        const alvo = slotSob(evento.clientX, evento.clientY);
        if (alvo && alvo.dataset.peca === peca.dataset.peca) {
          encaixar(peca, alvo);
          return;
        }
        if (alvo) {
          estado.erros++;
          alvo.classList.add('recusa');
          setTimeout(() => alvo.classList.remove('recusa'), 320);
        }
        devolver(peca);
      };

      peca.addEventListener('pointerup', soltar);
      peca.addEventListener('pointercancel', soltar);
    });

    // Barra esvaziando — o tempo é o segundo adversário
    const inicio = performance.now();
    const tique = () => {
      const passou = performance.now() - inicio;
      progresso(1 - passou / LIMITE_MS);
      if (passou >= LIMITE_MS) { encerrar(); return; }
      if (!acabou) requestAnimationFrame(tique);
    };
    requestAnimationFrame(tique);

    await fim;
    const duracao = Math.round(performance.now() - inicio);
    progresso(0);
    await esperar(250);

    const completou = estado.encaixadas === PECAS.length;
    const pontos = {};

    if (completou) {
      somar(pontos, 'forjador', 2);
      if (duracao < 11000) {
        somar(pontos, 'forjador', 1);
        somar(pontos, 'domador', 1);
      }
    }
    if (estado.encaixadas >= 2 && estado.erros === 0) somar(pontos, 'artesao', 2);
    else if (estado.encaixadas >= 1 && estado.erros <= 1) somar(pontos, 'artesao', 1);

    await encerramento(
      arena,
      completou ? 'Robô montado' : `${estado.encaixadas} de ${PECAS.length} peças`,
      completou
        ? `${(duracao / 1000).toFixed(1)}s · ${estado.erros} encaixe(s) errado(s)`
        : 'O tempo acabou primeiro.'
    );

    return { pontos, meta: { ...estado, completou, duracao } };
  },
};
