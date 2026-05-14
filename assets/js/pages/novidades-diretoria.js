import { shell } from '/assets/js/ui/shell.js';
import { getPosts, criarPost, atualizarPost, deletarPost, CATEGORIAS } from '/assets/js/supabase/posts.js';
import { skeletonRows } from '/assets/js/ui/skeleton.js';
import { toast } from '/assets/js/ui/toast.js';
import { renderEmptyState, icons } from '/assets/js/ui/empty-state.js';

await shell.mount({ activeRoute: '/membros/diretoria/novidades', pageTitle: 'Novidades' });

const $ = (id) => document.getElementById(id);

let editandoId = null;
let todosPosts = [];

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderLista(posts) {
  const lista = $('posts-lista');
  if (!posts.length) {
    renderEmptyState(lista, {
      icon: icons.megaphone,
      title: 'Nenhum post criado',
      description: 'Use o formulário ao lado para criar o primeiro post.',
    });
    return;
  }

  lista.innerHTML = posts.map(p => {
    const cat = CATEGORIAS[p.categoria] || { label: p.categoria, cor: 'text' };
    const statusLabel = p.publicado ? 'Publicado' : 'Rascunho';
    const statusClass = p.publicado ? 'badge-green' : 'badge-muted';
    return `
      <div class="post-item">
        <div class="post-item-head">
          <span class="post-tag tag-${cat.cor}" style="font-size:10px">${cat.label}</span>
          <span class="badge ${statusClass}">${statusLabel}</span>
          <span class="post-item-date">${formatDate(p.criado_em)}</span>
        </div>
        <div class="post-item-title">${p.titulo}</div>
        <div class="post-item-actions">
          <button class="btn-sm" onclick="editarPost('${p.id}')">Editar</button>
          <button class="btn-sm ${p.publicado ? '' : 'b'}" onclick="togglePublicar('${p.id}', ${p.publicado})">
            ${p.publicado ? 'Despublicar' : 'Publicar →'}
          </button>
          <button class="btn-sm danger" onclick="confirmarDeletar('${p.id}')">Deletar</button>
        </div>
      </div>
    `;
  }).join('');
}

async function carregarPosts() {
  const lista = $('posts-lista');
  lista.innerHTML = skeletonRows(3);
  try {
    todosPosts = await getPosts({ publicadoOnly: false });
    renderLista(todosPosts);
  } catch (e) {
    console.error(e);
    lista.innerHTML = `<p style="color:var(--muted)">Erro ao carregar posts.</p>`;
  }
}

async function handleSalvar() {
  const titulo = $('post-titulo')?.value?.trim();
  const conteudo = $('post-conteudo')?.value?.trim();
  const categoria = $('post-categoria')?.value;

  if (!titulo || !conteudo || !categoria) {
    toast.error('Preencha título, conteúdo e categoria');
    return;
  }

  try {
    if (editandoId) {
      await atualizarPost(editandoId, { titulo, conteudo, categoria });
      toast.success('Post atualizado');
    } else {
      await criarPost({ titulo, conteudo, categoria });
      toast.success('Post criado como rascunho');
    }
    resetForm();
    await carregarPosts();
  } catch (e) {
    console.error(e);
    toast.error(e.message || 'Erro ao salvar post');
  }
}

function resetForm() {
  editandoId = null;
  $('post-titulo').value = '';
  $('post-conteudo').value = '';
  $('post-categoria').value = '';
  $('form-titulo').textContent = 'Novo post';
  $('btn-cancelar').hidden = true;
  $('btn-salvar').textContent = 'Criar rascunho →';
}

window.editarPost = (id) => {
  const post = todosPosts.find(p => p.id === id);
  if (!post) return;
  editandoId = id;
  $('post-titulo').value = post.titulo;
  $('post-conteudo').value = post.conteudo;
  $('post-categoria').value = post.categoria;
  $('form-titulo').textContent = 'Editar post';
  $('btn-cancelar').hidden = false;
  $('btn-salvar').textContent = 'Salvar alterações →';
  document.getElementById('post-form-panel').scrollIntoView({ behavior: 'smooth' });
};

window.togglePublicar = async (id, publicadoAtual) => {
  try {
    await atualizarPost(id, { publicado: !publicadoAtual });
    toast.success(publicadoAtual ? 'Post despublicado' : 'Post publicado no site');
    await carregarPosts();
  } catch (e) {
    console.error(e);
    toast.error('Erro ao atualizar status');
  }
};

window.confirmarDeletar = async (id) => {
  if (!confirm('Tem certeza que deseja deletar este post? Essa ação não pode ser desfeita.')) return;
  try {
    await deletarPost(id);
    toast.success('Post deletado');
    if (editandoId === id) resetForm();
    await carregarPosts();
  } catch (e) {
    console.error(e);
    toast.error('Erro ao deletar post');
  }
};

window.salvarPost = handleSalvar;
window.cancelarEdicao = resetForm;

await carregarPosts();
