// ── Página: Advertências (diretoria) ──
import { shell } from '/assets/js/ui/shell.js';
import { openModal, closeModal, initModalEscape } from '/assets/js/components/modal.js';
import { getMembrosLiga } from '/assets/js/supabase/membros.js';
import { registrarAdvertencia, getTodasAdvertencias } from '/assets/js/supabase/advertencias.js';
import { renderEmptyState, icons } from '/assets/js/ui/empty-state.js';
import { skeletonTableRows } from '/assets/js/ui/skeleton.js';
import { toast } from '/assets/js/ui/toast.js';
import { confirmDialog } from '/assets/js/ui/confirm.js';

const { usuario } = await shell.mount({ activeRoute: '/membros/diretoria/advertencias', pageTitle: 'Advertências' });
const ligaId = usuario?.liga_id || null;

const $ = (id) => document.getElementById(id);

initModalEscape();

function renderizar(advertencias) {
  const tbody = $('adv-tbl');
  if (!advertencias || !advertencias.length) {
    renderEmptyState(tbody, {
      icon: icons.check,
      title: 'Nenhuma advertência registrada',
      description: 'A liga está limpa este semestre.',
    });
    return;
  }
  tbody.innerHTML = advertencias.map(adv => `
    <tr>
      <td>${adv.membros?.nome || '—'}</td>
      <td><span class="pill ${adv.tipo === 'grave' ? 'adv' : 'warn'}">${adv.tipo}</span></td>
      <td>${adv.descricao}</td>
      <td>${new Date(adv.criado_em).toLocaleDateString('pt-BR')}</td>
      <td><button class="btn-sm ghost" onclick="verAdvertencia('${adv.id}')">Ver</button></td>
    </tr>
  `).join('');
}

async function popularSelect() {
  const select = $('advertencia-membro');
  if (!select) return;
  try {
    const membros = await getMembrosLiga(ligaId || null);
    const mostraLiga = !ligaId;
    select.innerHTML = '<option value="" disabled selected>Selecione o membro</option>' +
      (membros || []).map(m => {
        const texto = mostraLiga ? `${m.nome} — ${m.ligas?.nome || '—'}` : m.nome;
        return `<option value="${m.id}">${texto}</option>`;
      }).join('');
  } catch (e) {
    console.error('Erro ao popular select:', e);
  }
}

async function openAdvModal(membroId, name) {
  const sub = $('adv-modal-sub');
  if (sub) sub.textContent = name ? `Membro: ${name}` : 'Registrar advertência ou anotação';
  const desc = $('adv-descricao');
  if (desc) desc.value = '';
  await popularSelect();
  const select = $('advertencia-membro');
  if (select) select.value = membroId || '';
  openModal('modal-advertencia');
}

async function handleSalvarAdvertencia() {
  const membroId = $('advertencia-membro')?.value;
  const tipo = $('adv-tipo')?.value;
  const descricao = $('adv-descricao')?.value?.trim();
  if (!membroId) { toast.error('Selecione um membro'); return; }
  if (!tipo || !descricao) return;

  const ok = await confirmDialog({
    title: 'Registrar advertência?',
    message: 'A advertência fica permanentemente no histórico do membro. Essa ação não pode ser desfeita.',
    confirmLabel: 'Registrar',
    danger: true,
  });
  if (!ok) return;

  try {
    await registrarAdvertencia(membroId, tipo, descricao);
    closeModal('modal-advertencia');
    const s = $('advertencia-membro'); if (s) s.value = '';
    renderizar(await getTodasAdvertencias(ligaId));
    toast.success('Advertência registrada');
  } catch (e) {
    console.error('Erro ao registrar:', e);
    toast.error(e.message || 'Erro ao registrar advertência');
  }
}

window.openAdvModal = openAdvModal;
window.handleSalvarAdvertencia = handleSalvarAdvertencia;
window.closeModal = closeModal;
window.verAdvertencia = (id) => console.log('ver advertência', id);

const tbody = $('adv-tbl');
tbody.innerHTML = skeletonTableRows(4, 5);
try {
  renderizar(await getTodasAdvertencias(ligaId));
} catch (e) {
  console.error('Erro ao carregar advertências:', e);
}
