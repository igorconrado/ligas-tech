// ── Página /perfil-tech ──
// Jogo da bancada de calouros: QR code → celular do visitante → 9 perguntas
// intercaladas com 3 minigames → arquétipo + convite pra liga.
//
// A interface imita um terminal: tudo é impresso linha a linha, com efeito de
// digitação, spinner e os mascotes (gato e rato) correndo nas transições.
//
// Fluxo de telas: boot/início → identificação → jogo → resultado.
// Pra editar perguntas ou arquétipos, mexa em /assets/js/features/perfil-tech/.

import { PERGUNTAS, CURSOS } from '/assets/js/features/perfil-tech/perguntas.js';
import { LIGAS, placarVazio, somarPontos, ranquear } from '/assets/js/features/perfil-tech/arquetipos.js';
import { el, esperar, embaralhar } from '/assets/js/features/perfil-tech/dom.js';
import { criarTerminal } from '/assets/js/features/perfil-tech/terminal.js';
import { MASCOTE_DA_LIGA, dupla, piscar, ajustarLargura } from '/assets/js/features/perfil-tech/sprites.js';
import cacaBug from '/assets/js/features/perfil-tech/minigames/caca-bug.js';
import sequencia from '/assets/js/features/perfil-tech/minigames/sequencia.js';
import montagem from '/assets/js/features/perfil-tech/minigames/montagem.js';
import { gerarCartao, salvarCartao } from '/assets/js/features/perfil-tech/cartao.js';
import {
  novaSessaoId,
  salvarResposta,
  salvarContato,
  anexarContatoPendente,
  reenviarPendentes,
} from '/assets/js/supabase/perfil-tech.js';

// Três perguntas, uma missão, e repete. A última missão fica logo antes da
// revelação, funcionando como prova final.
const ROTEIRO = [
  { tipo: 'pergunta', dados: PERGUNTAS[0] },
  { tipo: 'pergunta', dados: PERGUNTAS[1] },
  { tipo: 'pergunta', dados: PERGUNTAS[2] },
  { tipo: 'minigame', dados: cacaBug },
  { tipo: 'pergunta', dados: PERGUNTAS[3] },
  { tipo: 'pergunta', dados: PERGUNTAS[4] },
  { tipo: 'pergunta', dados: PERGUNTAS[5] },
  { tipo: 'minigame', dados: sequencia },
  { tipo: 'pergunta', dados: PERGUNTAS[6] },
  { tipo: 'pergunta', dados: PERGUNTAS[7] },
  { tipo: 'pergunta', dados: PERGUNTAS[8] },
  { tipo: 'minigame', dados: montagem },
];

const TOTAL_PERGUNTAS = PERGUNTAS.length;
const VERBOS = ['compilando', 'calibrando', 'cruzando dados', 'aquecendo servos', 'consultando o gato'];
const GIRO = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

const sessao = {
  id: novaSessaoId(),
  nome: '',
  curso: '',
  inicio: 0,
  placar: placarVazio(),
  perguntas: {},
  minigames: {},
  resultado: null,   // { arquetipo, liga } — preenchido na revelação
  gravado: false,
};

const $ = id => document.getElementById(id);
const palco = $('palco');

// A bancada fica ligada o dia inteiro: toda animação em loop precisa de
// alguém que a desligue quando a tela sai de cena.
let pararMascotes = null;

// ── Telas e status ─────────────────────────────────────────────────────────

function mostrarTela(id) {
  document.querySelectorAll('.tela').forEach(tela => { tela.hidden = tela.id !== id; });
  $('term-corpo').scrollTop = 0;
}

function status(esquerda, indice = null) {
  $('st-esq').textContent = esquerda;
  if (indice === null) return;
  const cheio = Math.round((indice / ROTEIRO.length) * 10);
  $('st-dir').textContent = `[${'▓'.repeat(cheio)}${'░'.repeat(10 - cheio)}] ${indice}/${ROTEIRO.length}`;
}

// ── Boot ───────────────────────────────────────────────────────────────────

async function boot() {
  const terminal = criarTerminal($('boot'));
  await terminal.comando('./perfil-tech --bancada');
  await terminal.carregando('carregando arquétipos');
  await terminal.carregando('aquecendo minigames');
  await terminal.carregando('soltando os mascotes');
  await esperar(240);

  $('ini').hidden = false;
  const tela = $('mascotes-inicio');
  ajustarLargura(tela);
  pararMascotes = dupla(tela);
  status('aguardando início');
}

// ── Identificação ──────────────────────────────────────────────────────────

function preencherCursos() {
  const select = $('i-curso');
  for (const curso of CURSOS) select.appendChild(el('option', '', curso));
}

function lerIdentificacao() {
  const nome = $('i-nome').value.trim().replace(/\s+/g, ' ');
  const curso = $('i-curso').value;

  if (nome.length < 2) return { erro: 'erro: nome vazio. escreve como te chamam.' };
  if (!curso || curso.length < 2) return { erro: 'erro: curso não selecionado.' };

  return { nome: nome.slice(0, 80), curso: curso.slice(0, 60) };
}

// ── Perguntas ──────────────────────────────────────────────────────────────

function renderPergunta(pergunta, numero) {
  return new Promise(resolve => {
    palco.replaceChildren();
    const terminal = criarTerminal(palco);

    const bloco = el('div', 'bloco');
    bloco.appendChild(el('div', 'bloco-topo', `pergunta ${String(numero).padStart(2, '0')}/${TOTAL_PERGUNTAS}`));
    terminal.bloco(bloco);

    const corpo = criarTerminal(bloco);
    const lista = el('div', 'opcoes');
    let ativo = false;

    const escolher = (opcao, botao) => {
      if (!ativo) return;
      ativo = false;
      document.removeEventListener('keydown', porTecla);
      botao.classList.add('escolhida');
      lista.classList.add('travada');
      setTimeout(() => resolve(opcao), 240);
    };

    function porTecla(evento) {
      const indice = Number(evento.key) - 1;
      const botoes = lista.querySelectorAll('.opcao');
      if (indice >= 0 && indice < botoes.length) botoes[indice].click();
    }

    corpo.digitar(pergunta.enunciado, { classe: 't-enunciado', velocidade: 14 }).then(() => {
      // Embaralha pra ninguém responder no automático pela posição
      embaralhar(pergunta.opcoes).forEach((opcao, indice) => {
        const botao = el('button', 'opcao');
        botao.type = 'button';
        botao.style.animationDelay = `${indice * 70}ms`;
        botao.appendChild(el('span', 'op-num', `[${indice + 1}]`));
        botao.appendChild(el('span', 'op-txt', opcao.texto));
        botao.addEventListener('click', () => escolher(opcao, botao));
        lista.appendChild(botao);
      });

      palco.appendChild(lista);
      ativo = true;
      document.addEventListener('keydown', porTecla);
    });
  });
}

// ── Transições com os mascotes ─────────────────────────────────────────────

async function transicao(rotulo, duracao = 1500) {
  palco.replaceChildren();
  const terminal = criarTerminal(palco);
  const verbo = VERBOS[Math.floor(Math.random() * VERBOS.length)];
  const linha = terminal.linha(`⠋ ${verbo}...`, 't-spinner');

  const tela = el('canvas', 'mascotes');
  tela.height = 60;
  terminal.bloco(tela);
  ajustarLargura(tela);
  const parar = dupla(tela);

  terminal.linha(rotulo, 't-fraco');

  const giro = setInterval(() => {
    const quadro = GIRO[Math.floor(Date.now() / 90) % GIRO.length];
    linha.textContent = `${quadro} ${verbo}...`;
  }, 90);

  await esperar(duracao);
  clearInterval(giro);
  parar();
}

// ── Loop principal ─────────────────────────────────────────────────────────

async function rodarJogo() {
  mostrarTela('tela-jogo');
  sessao.inicio = performance.now();

  let numeroPergunta = 0;

  for (const [indice, etapa] of ROTEIRO.entries()) {
    status(etapa.tipo === 'pergunta' ? 'aguardando resposta' : 'missão em curso', indice);

    if (etapa.tipo === 'pergunta') {
      numeroPergunta++;
      const opcao = await renderPergunta(etapa.dados, numeroPergunta);
      somarPontos(sessao.placar, opcao.pontos);
      sessao.perguntas[etapa.dados.id] = opcao.id;
    } else {
      await transicao(`carregando ${etapa.dados.nome.toLowerCase()}`);
      const { pontos, meta } = await etapa.dados.run(palco);
      somarPontos(sessao.placar, pontos);
      sessao.minigames[etapa.dados.id] = { pontos, ...meta };
    }
  }

  status('compilando resultado', ROTEIRO.length);
  await revelar();
}

// ── Revelação ──────────────────────────────────────────────────────────────

async function revelar() {
  mostrarTela('tela-resultado');
  const ranking = ranquear(sessao.placar);
  const terminal = criarTerminal($('res-fluxo'));

  await terminal.comando('perfil --revelar');
  await terminal.carregando(`analisando ${TOTAL_PERGUNTAS} respostas`);
  await terminal.carregando('cruzando 3 missões');
  await terminal.carregando('identificando arquétipo');
  await esperar(280);

  renderResultado(ranking);
  for (const id of ['res-card', 'res-contato', 'res-ctas', 'btn-salvar']) $(id).hidden = false;
  status('perfil identificado');
  gravar(ranking[0]);
}

function renderResultado(ranking) {
  const vencedor = ranking[0];
  const liga = LIGAS[vencedor.liga];
  const primeiroNome = sessao.nome.split(' ')[0];

  sessao.resultado = { arquetipo: vencedor, liga };

  // O acento fica na tela inteira: card, barras e CTAs herdam --acc
  $('tela-resultado').classList.add(vencedor.liga === 'ibbot' ? 'acento-r' : 'acento-b');
  $('st-dir').textContent = vencedor.nome.toLowerCase();

  $('res-kicker').textContent = `${primeiroNome.toLowerCase()} · perfil identificado`;
  $('res-arquetipo').textContent = vencedor.nome;
  $('res-tagline').textContent = vencedor.tagline;
  $('res-desc').textContent = vencedor.descricao;

  // Rato é o mascote da IbBot, gato o da IbTech
  piscar($('res-mascote'), MASCOTE_DA_LIGA[vencedor.liga], { escala: 4 });

  $('res-tracos').replaceChildren(
    ...vencedor.tracos.map(traco => el('span', 'res-traco', traco.toLowerCase()))
  );

  $('res-liga-nome').textContent = liga.nome;
  $('res-liga-chamada').textContent = liga.chamada;
  $('res-liga-encontro').textContent = `encontros às ${liga.encontro.toLowerCase()}`;

  // Segundo e terceiro lugares, proporcionais ao vencedor
  $('res-mix-lista').replaceChildren(
    ...ranking.slice(1, 3).map(item => {
      const proporcao = vencedor.pontos > 0
        ? Math.round((item.pontos / vencedor.pontos) * 100)
        : 0;
      const cheio = Math.round((proporcao / 100) * 12);

      const linha = el('div', 'res-mix-item');
      linha.appendChild(el('span', 'res-mix-nome', item.nome.toLowerCase()));
      linha.appendChild(el('span', 'res-mix-barra', `${'▓'.repeat(cheio)}${'░'.repeat(12 - cheio)}`));
      linha.appendChild(el('span', 'res-mix-pct', `${proporcao}%`));
      return linha;
    })
  );

  const principal = el('a', 'cmd', `conhecer a ${liga.nome.toLowerCase()}`);
  principal.href = liga.pagina;
  principal.prepend(el('span', 'cmd-seta', '❯'), ' ');

  const insta = el('a', 'cmd cmd-fraco', `seguir ${liga.handle}`);
  insta.href = liga.instagram;
  insta.target = '_blank';
  insta.rel = 'noopener';
  insta.prepend(el('span', 'cmd-seta', '❯'), ' ');

  const seletivo = el('a', 'cmd cmd-fraco', 'processo seletivo');
  seletivo.href = '/processo-seletivo';
  seletivo.prepend(el('span', 'cmd-seta', '❯'), ' ');

  $('res-ctas').replaceChildren(principal, insta, seletivo);
}

// ── Persistência ───────────────────────────────────────────────────────────

function origemDaUrl() {
  const bruto = new URLSearchParams(location.search).get('src') || 'direto';
  const limpo = bruto.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32);
  return limpo || 'direto';
}

async function gravar(vencedor) {
  if (sessao.gravado) return;
  sessao.gravado = true;

  await salvarResposta({
    sessao_id: sessao.id,
    nome: sessao.nome,
    curso: sessao.curso,
    arquetipo: vencedor.nome,
    liga: vencedor.liga,
    pontuacao: sessao.placar,
    respostas: { perguntas: sessao.perguntas, minigames: sessao.minigames },
    origem: origemDaUrl(),
    duracao_ms: Math.round(performance.now() - sessao.inicio),
  });
}

async function enviarContato(evento) {
  evento.preventDefault();
  const campo = $('i-contato');
  const erro = $('contato-erro');
  const contato = campo.value.trim();

  erro.hidden = true;
  if (contato.length < 3) {
    erro.textContent = 'erro: escreve seu @ do instagram ou seu e-mail.';
    erro.hidden = false;
    return;
  }

  const botao = $('btn-contato');
  botao.disabled = true;

  // Se o insert do resultado ficou preso na fila (sem rede), o contato
  // viaja junto com ele no reenvio; senão vai pela RPC.
  const anexado = anexarContatoPendente(sessao.id, contato);
  let ok = anexado;

  if (!anexado) {
    try {
      ok = await salvarContato(sessao.id, contato);
    } catch (falha) {
      console.warn('[perfil-tech] contato falhou', falha);
      ok = false;
    }
  }

  if (!ok) {
    botao.disabled = false;
    erro.textContent = 'erro: não deu pra salvar agora. tenta de novo?';
    erro.hidden = false;
    return;
  }

  $('res-contato').replaceChildren($('contato-ok'));
  $('contato-ok').hidden = false;
}

// ── Card do resultado ──────────────────────────────────────────────────────

/** "O ORÁCULO" → "o-oraculo", pra virar nome de arquivo. */
function apelido(texto) {
  const semAcento = [...texto.toLowerCase().normalize('NFD')]
    .filter(caractere => {
      const codigo = caractere.charCodeAt(0);
      return codigo < 0x300 || codigo > 0x36f;   // descarta marcas de acento
    })
    .join('');

  return semAcento.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function salvarCard() {
  if (!sessao.resultado) return;

  const botao = $('btn-salvar');
  const nota = $('salvar-nota');
  botao.disabled = true;
  nota.hidden = true;

  try {
    const canvas = await gerarCartao({
      nome: sessao.nome,
      arquetipo: sessao.resultado.arquetipo,
      ligaInfo: sessao.resultado.liga,
    });
    const desfecho = await salvarCartao(canvas, `perfil-tech-${apelido(sessao.resultado.arquetipo.nome)}.png`);

    if (desfecho === 'baixado') nota.textContent = 'card salvo nos seus downloads.';
    if (desfecho === 'compartilhado') nota.textContent = 'card enviado — marca a gente!';
    nota.hidden = desfecho === 'cancelado';
  } catch (erro) {
    console.warn('[perfil-tech] card falhou', erro);
    nota.textContent = 'erro: não deu pra gerar o card. tenta de novo?';
    nota.hidden = false;
  } finally {
    botao.disabled = false;
  }
}

// ── Bootstrap ──────────────────────────────────────────────────────────────

for (const id of ['res-card', 'res-contato', 'res-ctas', 'btn-salvar']) $(id).hidden = true;

preencherCursos();
reenviarPendentes().catch(() => { /* sem rede: tenta na próxima visita */ });
boot();

$('btn-comecar').addEventListener('click', () => {
  pararMascotes?.();
  mostrarTela('tela-identificacao');
  status('aguardando registro');
  $('i-nome').focus();
});

$('id-form').addEventListener('submit', evento => {
  evento.preventDefault();
  const { nome, curso, erro } = lerIdentificacao();
  const alerta = $('id-erro');

  if (erro) {
    alerta.textContent = erro;
    alerta.hidden = false;
    return;
  }

  alerta.hidden = true;
  sessao.nome = nome;
  sessao.curso = curso;
  document.activeElement?.blur();   // fecha o teclado do celular
  rodarJogo();
});

$('res-contato').addEventListener('submit', enviarContato);
$('btn-salvar').addEventListener('click', salvarCard);
