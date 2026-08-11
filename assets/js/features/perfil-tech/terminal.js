// ── Perfil Tech — camada de terminal ──
// Tudo que a tela escreve passa por aqui: linhas monoespaçadas, efeito de
// digitação e as barrinhas de "carregando" do boot. Quem pediu movimento
// reduzido no sistema recebe o texto inteiro de uma vez.

import { el, esperar } from './dom.js';

const SEM_MOVIMENTO = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function criarTerminal(container) {
  const rolar = () => { container.scrollTop = container.scrollHeight; };

  const linha = (texto = '', classe = '') => {
    const node = el('div', `t-linha ${classe}`.trim(), texto);
    container.appendChild(node);
    rolar();
    return node;
  };

  /** Escreve caractere por caractere. */
  const digitar = async (texto, { classe = '', velocidade = 16 } = {}) => {
    const node = linha('', classe);
    if (SEM_MOVIMENTO) {
      node.textContent = texto;
      rolar();
      return node;
    }
    node.classList.add('digitando');
    for (const caractere of texto) {
      node.textContent += caractere;
      rolar();
      await esperar(velocidade);
    }
    node.classList.remove('digitando');
    return node;
  };

  /** "▸ carregando arquétipos ......... ok" */
  const carregando = async (rotulo, duracao = 320) => {
    const node = linha(`▸ ${rotulo} `, 't-carga');
    const pontos = Math.max(4, 30 - rotulo.length);
    if (SEM_MOVIMENTO) {
      node.textContent = `▸ ${rotulo} ${'.'.repeat(pontos)} ok`;
      return node;
    }
    for (let i = 0; i < pontos; i++) {
      node.textContent += '.';
      await esperar(duracao / pontos);
    }
    node.appendChild(el('span', 't-ok', ' ok'));
    rolar();
    return node;
  };

  const comando = async texto => {
    const node = linha('', 't-comando');
    node.appendChild(el('span', 't-cifrao', '$ '));
    const corpo = el('span');
    node.appendChild(corpo);
    if (SEM_MOVIMENTO) {
      corpo.textContent = texto;
    } else {
      for (const caractere of texto) {
        corpo.textContent += caractere;
        await esperar(26);
      }
    }
    rolar();
    return node;
  };

  const bloco = node => {
    container.appendChild(node);
    rolar();
    return node;
  };

  const limpar = () => container.replaceChildren();

  return { linha, digitar, carregando, comando, bloco, limpar, rolar, container };
}
