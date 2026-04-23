// ── Página: Aulas (diretoria) ──
import { initPage } from '/assets/js/features/page-init.js';
import { getTodasAulas, togglePublicarAula } from '/assets/js/supabase/aulas.js';
import { renderEmptyState, icons } from '/assets/js/ui/empty-state.js';
import { skeletonCards } from '/assets/js/ui/skeleton.js';
import { toast } from '/assets/js/ui/toast.js';
import { confirmDialog } from '/assets/js/ui/confirm.js';

const { usuario } = await initPage({ requireRole: 'diretoria' });
const ligaId = usuario?.liga_id || null;

const grid = document.getElementById('aulas-dir-grid');

function renderizar(aulas) {
  if (!aulas.length) {
    renderEmptyState(grid, {
      icon: icons.book,
      title: 'Nenhuma aula cadastrada',
      description: 'Use o botão "+ Nova aula" pra criar a primeira aula da liga.',
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
    return `
      <div class="aula-dir-card">
        <div class="aula-num">Aula ${numero}</div>
        <div class="aula-title-sm">${a.titulo}</div>
        <div class="aula-meta">
          <span class="pill ${statusPill[status]}">${statusLabel[status]}</span>
          <div style="display:flex;align-items:center;gap:.5rem">
            <span class="aula-stats">Prazo: ${prazoFmt}</span>
            <button class="btn-sm ghost" style="font-size:10px;padding:3px 8px" onclick="handleTogglePublicarAula('${a.id}', ${a.publicada})">${toggleLabel}</button>
            <button class="btn-sm ghost" style="font-size:10px;padding:3px 8px">Editar</button>
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
    title: publicadaAtual ? 'Despublicar aula?' : 'Publicar aula?',
    message: publicadaAtual
      ? 'Membros não verão mais essa aula no dashboard enquanto estiver despublicada.'
      : 'Os membros da liga vão ver essa aula no dashboard imediatamente.',
    confirmLabel: publicadaAtual ? 'Despublicar' : 'Publicar',
    danger: publicadaAtual,
  });
  if (!ok) return;
  try {
    await togglePublicarAula(aulaId, novaFlag);
    await carregar();
    toast.success(novaFlag ? 'Aula publicada' : 'Aula despublicada');
  } catch (e) {
    console.error('Erro:', e);
    toast.error(e.message || 'Erro ao atualizar aula');
  }
}

window.handleTogglePublicarAula = handleTogglePublicarAula;
await carregar();
