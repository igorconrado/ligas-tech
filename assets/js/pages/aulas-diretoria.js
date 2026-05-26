// ── Página: Aulas (diretoria) ──
import { shell } from '/assets/js/ui/shell.js';
import { getTodasAulas, criarAula, uploadMaterialAula, togglePublicarAula, deletarAula } from '/assets/js/supabase/aulas.js';
import { renderEmptyState, icons } from '/assets/js/ui/empty-state.js';
import { skeletonCards } from '/assets/js/ui/skeleton.js';
import { toast } from '/assets/js/ui/toast.js';
import { confirmDialog } from '/assets/js/ui/confirm.js';
import { openModal, closeModal, initModalEscape } from '/assets/js/components/modal.js';

// Expõe funções antes do auth para que o botão funcione imediatamente após o DOM carregar
window.openModal = openModal;
window.closeModal = closeModal;
window.selecionarTipo = selecionarTipo;
window.handleCriarAula = handleCriarAula;
window.handleTogglePublicarAula = handleTogglePublicarAula;
window.handleDeletarAula = handleDeletarAula;
initModalEscape();

let ligaId = null;

const { usuario } = await shell.mount({ activeRoute: '/membros/diretoria/aulas', pageTitle: 'Aulas' });
ligaId = usuario?.liga_id || null;

const grid = document.getElementById('aulas-dir-grid');

function renderizar(aulas) {
  if (!aulas.length) {
    renderEmptyState(grid, {
      icon: icons.book,
      title: 'Nenhum evento cadastrado',
      description: 'Use o botão "+ Novo evento" pra criar a primeira aula ou tarefa da liga.',
    });
    return;
  }
  const now = new Date();
  const statusPill = { ok: 'ok', next: 'next', planned: 'planned' };
  const statusLabel = { ok: 'Concluída', next: 'Próxima', planned: 'Planejada' };
  grid.innerHTML = aulas.map(a => {
    const numero = String(a.numero).padStart(2, '0');
    const prazo = a.prazo_entrega ? new Date(a.prazo_entrega) : null;
    let status = 'planned';
    if (a.publicada) status = prazo && prazo < now ? 'ok' : 'next';
    const prazoFmt = prazo
      ? prazo.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
      : '—';
    const toggleLabel = a.publicada ? 'Despublicar' : 'Publicar';
    const tipoLabel = a.tipo === 'aula' ? 'Aula' : 'Tarefa';
    const tipoPill = a.tipo === 'aula'
      ? `<span class="pill" style="background:var(--blue-soft,rgba(59,130,246,.15));color:var(--blue)">${tipoLabel}</span>`
      : `<span class="pill" style="background:var(--yellow-soft,rgba(234,179,8,.15));color:var(--yellow,#ca8a04)">${tipoLabel}</span>`;
    const numLabel = a.tipo === 'aula' ? `Aula ${numero}` : `Tarefa ${numero}`;
    return `
      <div class="aula-dir-card">
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.25rem">
          <div class="aula-num">${numLabel}</div>
          ${tipoPill}
        </div>
        <div class="aula-title-sm">${a.titulo}</div>
        <div class="aula-meta">
          <span class="pill ${statusPill[status]}">${statusLabel[status]}</span>
          <div style="display:flex;align-items:center;gap:.5rem">
            ${a.tipo === 'tarefa' ? `<span class="aula-stats">Prazo: ${prazoFmt}</span>` : ''}
            <button class="btn-sm ghost" style="font-size:10px;padding:3px 8px" onclick="handleTogglePublicarAula('${a.id}', ${a.publicada})">${toggleLabel}</button>
            <button class="btn-sm ghost" style="font-size:10px;padding:3px 8px;color:var(--red)" onclick="handleDeletarAula('${a.id}', '${a.titulo.replace(/'/g, "\\'")}')">Excluir</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

async function carregar() {
  grid.innerHTML = skeletonCards(3);
  try {
    renderizar(await getTodasAulas(ligaId));
  } catch (e) {
    console.error('Erro ao carregar aulas:', e);
  }
}

async function handleTogglePublicarAula(aulaId, publicadaAtual) {
  const novaFlag = !publicadaAtual;
  const ok = await confirmDialog({
    title: publicadaAtual ? 'Despublicar?' : 'Publicar?',
    message: publicadaAtual
      ? 'Membros não verão mais esse evento enquanto estiver despublicado.'
      : 'Os membros da liga vão ver esse evento imediatamente.',
    confirmLabel: publicadaAtual ? 'Despublicar' : 'Publicar',
    danger: publicadaAtual,
  });
  if (!ok) return;
  try {
    await togglePublicarAula(aulaId, novaFlag);
    await carregar();
    toast.success(novaFlag ? 'Publicado' : 'Despublicado');
  } catch (e) {
    console.error('Erro:', e);
    toast.error(e.message || 'Erro ao atualizar');
  }
}

async function handleCriarAula() {
  const tipo = document.getElementById('aula-tipo')?.value || 'aula';
  const numero = parseInt(document.getElementById('aula-numero')?.value);
  const titulo = document.getElementById('aula-titulo')?.value?.trim();
  const prazo = tipo === 'tarefa' ? (document.getElementById('aula-prazo')?.value || null) : null;
  const slides = tipo === 'aula' ? (document.getElementById('aula-slides')?.value?.trim() || null) : null;
  const material = tipo === 'aula'
    ? (document.getElementById('aula-material')?.value?.trim() || null)
    : (document.getElementById('tarefa-material')?.value?.trim() || null);

  if (!numero || !titulo) {
    toast.error('Número e título são obrigatórios.');
    return;
  }
  if (!ligaId) {
    toast.error('Seu perfil não está vinculado a uma liga.');
    return;
  }

  const confirmBtn = document.getElementById('modal-aula-confirm');
  const arquivoInput = document.getElementById('aula-arquivo');
  const arquivoFile = arquivoInput?.files?.[0] || null;

  try {
    confirmBtn.disabled = true;
    confirmBtn.textContent = arquivoFile ? 'Enviando arquivo…' : 'Criando…';

    let arquivo_url = null;
    if (arquivoFile) {
      arquivo_url = await uploadMaterialAula(arquivoFile, ligaId);
    }

    confirmBtn.textContent = 'Criando…';
    await criarAula({ liga_id: ligaId, numero, titulo, tipo, prazo_entrega: prazo, slides_url: slides, material_url: material, arquivo_url, publicada: false });
    closeModal('modal-aula');
    document.getElementById('aula-numero').value = '';
    document.getElementById('aula-titulo').value = '';
    document.getElementById('aula-prazo').value = '';
    document.getElementById('aula-slides').value = '';
    document.getElementById('aula-material').value = '';
    document.getElementById('tarefa-material').value = '';
    if (arquivoInput) arquivoInput.value = '';
    const hint = document.getElementById('aula-arquivo-hint');
    if (hint) hint.textContent = '';
    selecionarTipo('aula');
    await carregar();
    toast.success(tipo === 'aula' ? 'Aula criada.' : 'Tarefa criada.');
  } catch (e) {
    console.error('Erro ao criar:', e);
    toast.error(e.message || 'Erro ao criar');
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = tipo === 'aula' ? 'Criar aula →' : 'Criar tarefa →';
  }
}

async function handleDeletarAula(aulaId, titulo) {
  const ok = await confirmDialog({
    title: 'Excluir evento?',
    message: `"${titulo}" será removido permanentemente. Entregas associadas também serão excluídas.`,
    confirmLabel: 'Excluir',
    danger: true,
  });
  if (!ok) return;
  try {
    await deletarAula(aulaId);
    await carregar();
    toast.success('Excluído.');
  } catch (e) {
    console.error('Erro ao excluir:', e);
    toast.error(e.message || 'Erro ao excluir');
  }
}

function selecionarTipo(tipo) {
  document.getElementById('aula-tipo').value = tipo;
  const btnAula = document.getElementById('tipo-aula-btn');
  const btnTarefa = document.getElementById('tipo-tarefa-btn');
  const camposAula = document.getElementById('campos-aula');
  const camposTarefa = document.getElementById('campos-tarefa');
  const confirmBtn = document.getElementById('modal-aula-confirm');

  if (tipo === 'aula') {
    btnAula.className = 'btn-sm b';
    btnTarefa.className = 'btn-sm ghost';
    camposAula.style.display = '';
    camposTarefa.style.display = 'none';
    if (confirmBtn) confirmBtn.textContent = 'Criar aula →';
  } else {
    btnAula.className = 'btn-sm ghost';
    btnTarefa.className = 'btn-sm b';
    camposAula.style.display = 'none';
    camposTarefa.style.display = '';
    if (confirmBtn) confirmBtn.textContent = 'Criar tarefa →';
  }
}

document.getElementById('aula-arquivo')?.addEventListener('change', (e) => {
  const hint = document.getElementById('aula-arquivo-hint');
  if (!hint) return;
  const file = e.target.files?.[0];
  if (file) {
    const kb = (file.size / 1024).toFixed(0);
    hint.textContent = `${file.name} · ${kb > 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb + ' KB'}`;
  } else {
    hint.textContent = '';
  }
});

await carregar();
