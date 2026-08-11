// ── Perfil Tech — helpers compartilhados pelos minigames ──

export function el(tag, className = '', texto = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (texto) node.textContent = texto;
  return node;
}

export const esperar = ms => new Promise(resolve => setTimeout(resolve, ms));

/** Fisher-Yates — devolve uma cópia embaralhada. */
export function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Acumula pontos num vetor solto: somar(p, 'domador', 2). */
export function somar(pontos, id, valor) {
  pontos[id] = (pontos[id] || 0) + valor;
}

/** Contagem regressiva sobreposta à arena, antes do minigame começar. */
export async function contagemRegressiva(alvo, passos = ['3', '2', '1', 'JÁ!']) {
  const aviso = el('div', 'mg-contagem');
  alvo.appendChild(aviso);
  for (const passo of passos) {
    aviso.textContent = passo;
    aviso.classList.remove('bate');
    void aviso.offsetWidth;   // reinicia a animação
    aviso.classList.add('bate');
    await esperar(560);
  }
  aviso.remove();
}

/** Flash de fechamento do minigame ("7 bugs · 0 erros"). */
export async function encerramento(alvo, titulo, detalhe) {
  const caixa = el('div', 'mg-fim');
  caixa.appendChild(el('div', 'mg-fim-titulo', titulo));
  caixa.appendChild(el('div', 'mg-fim-detalhe', detalhe));
  alvo.appendChild(caixa);
  await esperar(1400);
  caixa.remove();
}

/** Esqueleto comum: cabeçalho + arena + barra de progresso. */
export function montarPalco(palco, { nome, instrucao }) {
  const raiz = el('div', 'mg');

  const cabecalho = el('div', 'mg-head');
  cabecalho.appendChild(el('div', 'mg-nome', nome));
  cabecalho.appendChild(el('div', 'mg-instrucao', instrucao));

  const arena = el('div', 'mg-arena');

  const trilho = el('div', 'mg-trilho');
  const barra = el('i');
  trilho.appendChild(barra);

  raiz.append(cabecalho, arena, trilho);
  palco.replaceChildren(raiz);

  return {
    arena,
    progresso: fracao => { barra.style.width = `${Math.min(1, Math.max(0, fracao)) * 100}%`; },
  };
}
