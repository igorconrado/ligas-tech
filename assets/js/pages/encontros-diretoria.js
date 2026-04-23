// ── Página: Encontros/Chamada (diretoria) ──
import { initPage } from '/assets/js/features/page-init.js';
import { openModal, closeModal, initModalEscape } from '/assets/js/components/modal.js';
import { getMembrosLiga } from '/assets/js/supabase/membros.js';
import { abrirChamada, fecharChamada, assinarPresencasEncontro, getEncontros, criarEncontro } from '/assets/js/supabase/presenca.js';
import { exportarTodosRegistros, exportarResumoPorMembro, exportarPorEncontro, exportarRelatorioFrequencia } from '/assets/js/supabase/exportacao.js';
import { renderEmptyState, icons } from '/assets/js/ui/empty-state.js';
import { toast } from '/assets/js/ui/toast.js';
import { confirmDialog } from '/assets/js/ui/confirm.js';

const { usuario } = await initPage({ requireRole: 'diretoria' });
const ligaId = usuario?.liga_id || null;

const $ = (id) => document.getElementById(id);

initModalEscape();

let members = [];
let presenceMembers = [];
let presentSet = new Set();
let chamadaAberta = false;

async function carregarMembros() {
  try {
    const data = await getMembrosLiga();
    members = data.map(m => ({ id: m.id, name: m.nome, liga: m.ligas?.nome || '—' }));
    renderPresenca();
  } catch (e) {
    console.error('Erro ao carregar membros:', e);
  }
}

async function carregarEncontros() {
  try {
    const encontros = await getEncontros(ligaId);
    const select = $('select-encontro');
    if (!encontros.length) {
      select.innerHTML = '<option value="">Nenhum encontro cadastrado</option>';
      return;
    }
    select.innerHTML = encontros.map(e => `
      <option value="${e.id}">${e.titulo} — ${new Date(e.data).toLocaleDateString('pt-BR')}</option>
    `).join('');
  } catch (e) {
    console.error('Erro ao carregar encontros:', e);
  }
}

function renderPresenca() {
  const grid = $('presenca-grid');
  if (!chamadaAberta) {
    renderEmptyState(grid, {
      icon: icons.clock,
      title: 'Nenhuma chamada aberta agora',
      description: 'Selecione um encontro e gere um QR Code pra abrir a chamada.',
    });
    $('presenca-count').textContent = 0;
    $('presenca-total').textContent = 0;
    return;
  }
  presenceMembers = members.filter(m => m.liga === (usuario?.liga_id ? 'IbTech' : m.liga)).map(m => m.name);
  // simplifica: usa todos os membros da liga do diretor
  presenceMembers = members.map(m => m.name);
  grid.innerHTML = presenceMembers.map((name, i) => {
    const on = presentSet.has(i);
    return `<div class="member-chip ${on ? 'present' : ''}" onclick="togglePresenca(${i})">
      <div class="check ${on ? 'on' : 'off'}">${on ? '✓' : ''}</div>
      <span class="chip-name">${name}</span>
    </div>`;
  }).join('');
  $('presenca-count').textContent = presentSet.size;
  $('presenca-total').textContent = presenceMembers.length;
}

function togglePresenca(i) {
  if (presentSet.has(i)) presentSet.delete(i); else presentSet.add(i);
  renderPresenca();
}

function markAll() {
  presenceMembers.forEach((_, i) => presentSet.add(i));
  renderPresenca();
}

function savePresenca() {
  $('chamada-badge').textContent = 'Salva';
  $('chamada-badge').className = 'chamada-badge closed';
}

async function handleCriarEncontro() {
  const titulo = $('encontro-titulo')?.value?.trim();
  const data = $('encontro-data')?.value;
  if (!titulo || !data) return;
  try {
    await criarEncontro(ligaId, titulo, data);
    closeModal('modal-encontro');
    await carregarEncontros();
    toast.success('Encontro criado.');
  } catch (e) {
    console.error('Erro ao criar encontro:', e);
    toast.error(e.message || 'Erro ao criar encontro');
  }
}

async function handleAbrirChamada() {
  const encontroId = $('select-encontro')?.value;
  if (!encontroId) { toast.error('Selecione um encontro primeiro.'); return; }
  try {
    const { codigo, expira } = await abrirChamada(encontroId);
    if ($('qr-display')) $('qr-display').textContent = codigo;
    if ($('qr-expira')) {
      const mins = Math.floor((new Date(expira) - new Date()) / 60000);
      $('qr-expira').textContent = `Expira em ${mins} minutos`;
    }
    openModal('qr-modal');
    chamadaAberta = true;
    renderPresenca();
    $('chamada-badge').textContent = 'Aberta';
    $('chamada-badge').className = 'chamada-badge open';
    window._chamadaChannel = assinarPresencasEncontro(encontroId, () => renderPresenca());
    const btn = $('btn-abrir-chamada');
    if (btn) { btn.textContent = 'Fechar Chamada'; btn.onclick = () => handleFecharChamada(encontroId); }
  } catch (e) {
    console.error('Erro:', e);
    toast.error('Erro ao abrir chamada. Tente novamente.');
  }
}

async function handleFecharChamada(encontroId) {
  const ok = await confirmDialog({
    title: 'Encerrar chamada?',
    message: 'Presenças não registradas vão ficar em branco. Você pode corrigi-las depois.',
    confirmLabel: 'Encerrar',
  });
  if (!ok) return;
  const btn = $('btn-abrir-chamada');
  if (btn) { btn.disabled = true; btn.textContent = 'Encerrando...'; }
  closeModal('qr-modal');
  try {
    await fecharChamada(encontroId);
    if (window._chamadaChannel) { window._chamadaChannel.unsubscribe(); window._chamadaChannel = null; }
    chamadaAberta = false;
    renderPresenca();
    $('chamada-badge').textContent = 'Fechada';
    $('chamada-badge').className = 'chamada-badge closed';
    if (btn) { btn.disabled = false; btn.textContent = 'Abrir Chamada'; btn.onclick = handleAbrirChamada; }
    toast.success('Chamada encerrada');
  } catch (e) {
    console.error('Erro:', e);
    toast.error(e.message || 'Erro ao encerrar chamada');
    if (btn) { btn.disabled = false; btn.textContent = 'Fechar Chamada'; }
  }
}

window.openModal = openModal;
window.closeModal = closeModal;
window.togglePresenca = togglePresenca;
window.markAll = markAll;
window.savePresenca = savePresenca;
window.handleCriarEncontro = handleCriarEncontro;
window.handleAbrirChamada = handleAbrirChamada;
window.handleFecharChamada = handleFecharChamada;

$('btn-export-todos')?.addEventListener('click', () => exportarTodosRegistros(ligaId));
$('btn-export-membros')?.addEventListener('click', () => exportarResumoPorMembro(ligaId));
$('btn-export-encontros')?.addEventListener('click', () => exportarPorEncontro(ligaId));
$('btn-export-frequencia')?.addEventListener('click', () => exportarRelatorioFrequencia(ligaId));

await carregarMembros();
await carregarEncontros();
