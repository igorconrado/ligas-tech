import { getPosts, CATEGORIAS } from '/assets/js/supabase/posts.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

let categoriaAtiva = null;

function excerpt(texto, max = 140) {
  const plain = texto.replace(/[#*`_~\[\]]/g, '').replace(/\n+/g, ' ').trim();
  return plain.length > max ? plain.slice(0, max) + '…' : plain;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderCards(posts) {
  const grid = $('#posts-grid');
  const empty = $('#posts-empty');

  if (!posts.length) {
    grid.innerHTML = '';
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  grid.innerHTML = posts.map(p => {
    const cat = CATEGORIAS[p.categoria] || { label: p.categoria, cor: 'text' };
    const liga = p.ligas?.nome ? `<span class="post-liga">${p.ligas.nome}</span>` : '';
    return `
      <a class="post-card" href="/novidades/post?id=${p.id}">
        <div class="post-card-head">
          <span class="post-tag tag-${cat.cor}">${cat.label}</span>
          ${liga}
        </div>
        <h2 class="post-card-title">${p.titulo}</h2>
        <p class="post-card-excerpt">${excerpt(p.conteudo)}</p>
        <div class="post-card-foot">
          <span class="post-date">${formatDate(p.criado_em)}</span>
          <span class="post-arrow">→</span>
        </div>
      </a>
    `;
  }).join('');
}

async function load(categoria = null) {
  const grid = $('#posts-grid');
  const skeleton = $('#posts-skeleton');

  skeleton.hidden = false;
  grid.innerHTML = '';

  try {
    const posts = await getPosts({ categoria, publicadoOnly: true });
    skeleton.hidden = true;
    renderCards(posts);
  } catch (e) {
    skeleton.hidden = true;
    grid.innerHTML = `<p style="color:var(--muted);grid-column:1/-1">Erro ao carregar novidades.</p>`;
    console.error(e);
  }
}

$$('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    categoriaAtiva = btn.dataset.cat || null;
    load(categoriaAtiva);
  });
});

load();
