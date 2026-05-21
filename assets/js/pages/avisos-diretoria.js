// ── Página: Avisos (diretoria) ──
import { shell } from '/assets/js/ui/shell.js';
import { supabase } from '/assets/js/supabase/client.js';
import { publicarAviso, getAvisos, deletarAviso } from '/assets/js/supabase/avisos.js';
import { confirmDialog } from '/assets/js/ui/confirm.js';
import { renderEmptyState, icons } from '/assets/js/ui/empty-state.js';
import { skeletonRows } from '/assets/js/ui/skeleton.js';
import { toast } from '/assets/js/ui/toast.js';

await shell.mount({ activeRoute: '/membros/diretoria/avisos', pageTitle: 'Avisos' });

const $ = (id) => document.getElementById(id);

function renderizar(avisos) {
  const lista = $('avisos-lista');
  if (!avisos || !avisos.length) {
    renderEmptyState(lista, {
      icon: icons.megaphone,
      title: 'Nenhum aviso publicado',
      description: 'Use o formulário ao lado pra publicar o primeiro aviso.',
    });
    return;
  }
  lista.innerHTML = avisos.map(a => `
    <div class="aviso-item">
      <div class="aviso-head">
        <div class="aviso-title-text">${a.titulo}</div>
        <div style="display:flex;align-items:center;gap:.75rem">
          <div class="aviso-date">${new Date(a.criado_em).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</div>
          <button class="btn-sm ghost" style="font-size:10px;padding:3px 8px;color:var(--red)" onclick="handleDeletarAviso('${a.id}', '${a.titulo.replace(/'/g, "\\'")}')">Excluir</button>
        </div>
      </div>
      <div class="aviso-body">${a.mensagem}</div>
    </div>
  `).join('');
}

async function handlePublicarAviso() {
  const titulo = $('aviso-titulo')?.value?.trim();
  const mensagem = $('aviso-mensagem')?.value?.trim();
  const destinatario = $('aviso-destinatario')?.value;
  if (!titulo || !mensagem) return;

  let ligaIdAviso = null;
  if (destinatario && destinatario !== 'todos') {
    const { data } = await supabase.from('ligas').select('id').eq('nome', destinatario).single();
    ligaIdAviso = data?.id || null;
  }

  try {
    await publicarAviso(titulo, mensagem, ligaIdAviso);
    $('aviso-titulo').value = '';
    $('aviso-mensagem').value = '';
    toast.success('Aviso publicado');
    renderizar(await getAvisos());
  } catch (e) {
    console.error('Erro ao publicar aviso:', e);
    toast.error(e.message || 'Erro ao publicar aviso');
  }
}
async function handleDeletarAviso(avisoId, titulo) {
  const ok = await confirmDialog({
    title: 'Excluir aviso?',
    message: `"${titulo}" será removido permanentemente.`,
    confirmLabel: 'Excluir',
    danger: true,
  });
  if (!ok) return;
  try {
    await deletarAviso(avisoId);
    renderizar(await getAvisos());
    toast.success('Aviso excluído.');
  } catch (e) {
    console.error('Erro ao excluir aviso:', e);
    toast.error(e.message || 'Erro ao excluir aviso');
  }
}

window.publishAviso = handlePublicarAviso;
window.handleDeletarAviso = handleDeletarAviso;

const lista = $('avisos-lista');
lista.innerHTML = skeletonRows(3);
try {
  renderizar(await getAvisos());
} catch (e) {
  console.error('Erro ao carregar avisos:', e);
}
