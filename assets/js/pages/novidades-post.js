import { getPost, CATEGORIAS } from '/assets/js/supabase/posts.js';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked@12/+esm';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const id = new URLSearchParams(location.search).get('id');

if (!id) {
  location.href = '/novidades';
} else {
  try {
    const post = await getPost(id);

    if (!post || !post.publicado) {
      location.href = '/novidades';
    } else {
      const cat = CATEGORIAS[post.categoria] || { label: post.categoria, cor: 'text' };
      const liga = post.ligas?.nome || '';

      document.title = `${post.titulo} — Novidades · IbBot & IbTech`;

      document.getElementById('post-categoria').textContent = cat.label;
      document.getElementById('post-categoria').className = `post-tag tag-${cat.cor}`;
      document.getElementById('post-titulo').textContent = post.titulo;
      document.getElementById('post-date').textContent = formatDate(post.criado_em);

      const ligaEl = document.getElementById('post-liga');
      if (liga) {
        ligaEl.textContent = liga;
        ligaEl.hidden = false;
      }

      document.getElementById('post-conteudo').innerHTML = marked.parse(post.conteudo);
    }
  } catch (e) {
    console.error(e);
    location.href = '/novidades';
  }
}
