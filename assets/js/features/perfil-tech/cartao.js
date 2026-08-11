// ── Perfil Tech — card do resultado ──
// Desenha o resultado num canvas 1080×1350 (4:5, o formato que o Instagram
// aceita tanto no feed quanto no story) e entrega pro celular via Web Share
// API. Onde não houver share de arquivo, cai pro download direto.

import { MASCOTE_DA_LIGA, desenhar, larguraSprite, alturaSprite } from './sprites.js';

const LARGURA = 1080;
const ALTURA = 1350;
const MARGEM = 76;

const FUNDO = '#060606';
const TEXTO = '#EDEDEF';
const MEIO = '#C9C9CF';
const FRACO = '#8A8A92';
const LINHA = 'rgba(237,237,239,.12)';

const mono = (tamanho, peso = 400) => `${peso} ${tamanho}px "Space Mono", monospace`;
const display = (tamanho, peso = 700) => `${peso} ${tamanho}px "Space Grotesk", sans-serif`;

// Os SVGs das ligas declaram width/height em porcentagem, então naturalWidth
// não é confiável: a proporção vem do viewBox de cada arquivo e o drawImage
// recebe sempre dimensões explícitas.
const LOGOS = {
  ibbot: { src: '/assets/icons/IbBot.svg', proporcao: 507 / 396 },
  ibtech: { src: '/assets/icons/IbTech.svg', proporcao: 625 / 676 },
};

/** Carrega o logo da liga. Devolve null se falhar — o card segue sem ele. */
function carregarLogo(liga) {
  return new Promise(resolve => {
    const info = LOGOS[liga];
    if (!info) return resolve(null);

    const imagem = new Image();
    imagem.onload = () => resolve({ imagem, proporcao: info.proporcao });
    imagem.onerror = () => resolve(null);
    imagem.src = info.src;
  });
}

/** Quebra o texto na largura disponível e devolve as linhas. */
function quebrar(ctx, texto, larguraMax) {
  const linhas = [];
  let atual = '';
  for (const palavra of texto.split(' ')) {
    const teste = atual ? `${atual} ${palavra}` : palavra;
    if (ctx.measureText(teste).width > larguraMax && atual) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = teste;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

function retanguloArredondado(ctx, x, y, largura, altura, raio) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, largura, altura, raio);
    return;
  }
  ctx.moveTo(x + raio, y);
  ctx.arcTo(x + largura, y, x + largura, y + altura, raio);
  ctx.arcTo(x + largura, y + altura, x, y + altura, raio);
  ctx.arcTo(x, y + altura, x, y, raio);
  ctx.arcTo(x, y, x + largura, y, raio);
  ctx.closePath();
}

/**
 * Monta o card. `arquetipo` é o objeto vencedor do ranking e `ligaInfo` o
 * registro de LIGAS correspondente.
 */
export async function gerarCartao({ nome, arquetipo, ligaInfo }) {
  // Sem isso o canvas desenha com a fonte de fallback: as webfonts podem
  // ainda não ter carregado quando o resultado aparece.
  try { await document.fonts.ready; } catch { /* navegador antigo */ }

  const logo = await carregarLogo(arquetipo.liga);

  const canvas = document.createElement('canvas');
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext('2d');

  const acento = arquetipo.liga === 'ibbot' ? '#E10600' : '#00A6FF';
  const larguraUtil = LARGURA - MARGEM * 2;

  // Fundo
  ctx.fillStyle = FUNDO;
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  // Faixa de acento no topo
  const faixa = ctx.createLinearGradient(0, 0, LARGURA, 0);
  faixa.addColorStop(0, '#E10600');
  faixa.addColorStop(1, '#00A6FF');
  ctx.fillStyle = faixa;
  ctx.fillRect(0, 0, LARGURA, 10);

  // Cabeçalho
  ctx.textBaseline = 'top';
  ctx.font = mono(26);
  ctx.fillStyle = FRACO;
  ctx.fillText('$ ./perfil-tech', MARGEM, MARGEM);

  // Logo oficial da liga no topo à direita
  if (logo) {
    const alturaLogo = 76;
    const larguraLogo = alturaLogo * logo.proporcao;
    ctx.drawImage(logo.imagem, LARGURA - MARGEM - larguraLogo, MARGEM - 14, larguraLogo, alturaLogo);
  } else {
    ctx.textAlign = 'right';
    ctx.fillText('IBMEC BH', LARGURA - MARGEM, MARGEM);
    ctx.textAlign = 'left';
  }

  let y = MARGEM + 110;

  // Kicker
  ctx.font = mono(26);
  ctx.fillStyle = FRACO;
  ctx.fillText(`${nome.toLowerCase()} · perfil identificado`, MARGEM, y);
  y += 66;

  // Nome do arquétipo
  ctx.font = display(104);
  ctx.fillStyle = acento;
  ctx.fillText(arquetipo.nome, MARGEM, y);
  y += 128;

  // Tagline
  ctx.font = `italic 34px "Space Grotesk", sans-serif`;
  ctx.fillStyle = MEIO;
  for (const linha of quebrar(ctx, arquetipo.tagline, larguraUtil)) {
    ctx.fillText(linha, MARGEM, y);
    y += 48;
  }
  y += 26;

  // Divisor
  ctx.fillStyle = LINHA;
  ctx.fillRect(MARGEM, y, larguraUtil, 1);
  y += 44;

  // Traços
  ctx.font = mono(24);
  let x = MARGEM;
  for (const traco of arquetipo.tracos) {
    const rotulo = traco.toLowerCase();
    const largura = ctx.measureText(rotulo).width + 40;
    if (x + largura > LARGURA - MARGEM) { x = MARGEM; y += 62; }
    ctx.fillStyle = 'rgba(237,237,239,.06)';
    retanguloArredondado(ctx, x, y, largura, 48, 8);
    ctx.fill();
    ctx.fillStyle = MEIO;
    ctx.fillText(rotulo, x + 20, y + 13);
    x += largura + 12;
  }
  y += 92;

  // Descrição
  ctx.font = `400 30px "Space Grotesk", sans-serif`;
  ctx.fillStyle = MEIO;
  for (const linha of quebrar(ctx, arquetipo.descricao, larguraUtil)) {
    ctx.fillText(linha, MARGEM, y);
    y += 46;
  }

  // Bloco da liga, ancorado na base
  const alturaBloco = 150;
  const topoBloco = ALTURA - MARGEM - 70 - alturaBloco;

  ctx.fillStyle = 'rgba(237,237,239,.03)';
  retanguloArredondado(ctx, MARGEM, topoBloco, larguraUtil, alturaBloco, 10);
  ctx.fill();
  ctx.fillStyle = acento;
  ctx.fillRect(MARGEM, topoBloco, 4, alturaBloco);

  ctx.font = mono(20);
  ctx.fillStyle = FRACO;
  ctx.fillText('LIGA SUGERIDA', MARGEM + 34, topoBloco + 28);

  ctx.font = display(46);
  ctx.fillStyle = TEXTO;
  ctx.fillText(ligaInfo.nome, MARGEM + 34, topoBloco + 60);

  ctx.font = `400 26px "Space Grotesk", sans-serif`;
  ctx.fillStyle = MEIO;
  ctx.fillText(ligaInfo.chamada, MARGEM + 34, topoBloco + 112);

  // Mascote em pixel art, encostado à direita do bloco
  const mascote = MASCOTE_DA_LIGA[arquetipo.liga].normal;
  const escala = 5;
  desenhar(
    ctx,
    mascote,
    LARGURA - MARGEM - larguraSprite(mascote) * escala - 34,
    topoBloco + (alturaBloco - alturaSprite(mascote) * escala) / 2,
    escala
  );

  // Rodapé
  ctx.font = mono(24);
  ctx.fillStyle = FRACO;
  ctx.fillText(ligaInfo.handle, MARGEM, ALTURA - MARGEM - 24);

  ctx.textAlign = 'right';
  ctx.fillText(`${location.host}/perfil-tech`, LARGURA - MARGEM, ALTURA - MARGEM - 24);
  ctx.textAlign = 'left';

  return canvas;
}

/**
 * Entrega o card. No celular abre a folha de compartilhamento (salvar em
 * fotos, mandar pro story); no desktop baixa o PNG.
 * Devolve 'compartilhado' | 'baixado' | 'cancelado'.
 */
export async function salvarCartao(canvas, nomeArquivo) {
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('não foi possível gerar a imagem');

  const arquivo = new File([blob], nomeArquivo, { type: 'image/png' });

  if (navigator.canShare?.({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo], title: 'Meu Perfil Tech' });
      return 'compartilhado';
    } catch (erro) {
      if (erro?.name === 'AbortError') return 'cancelado';
      // Share indisponível na prática — segue pro download
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return 'baixado';
}
