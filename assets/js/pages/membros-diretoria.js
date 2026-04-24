// ── Página: Membros (diretoria) ──
import { shell } from '/assets/js/ui/shell.js';
import { openModal, closeModal, initModalEscape } from '/assets/js/components/modal.js';
import { supabase } from '/assets/js/supabase/client.js';
import { getMembrosLiga } from '/assets/js/supabase/membros.js';
import { registrarAdvertencia } from '/assets/js/supabase/advertencias.js';
import { renderMembrosTable } from '/assets/js/features/members-table.js';
import { skeletonTableRows } from '/assets/js/ui/skeleton.js';
import { toast } from '/assets/js/ui/toast.js';
import { confirmDialog } from '/assets/js/ui/confirm.js';

const { usuario } = await shell.mount({ activeRoute: '/membros/diretoria/membros', pageTitle: 'Membros' });
const ligaId = usuario?.liga_id || null;

const $ = (id) => document.getElementById(id);

initModalEscape();

const STATUS_LABEL = { ok: 'Regular', warn: 'Atenção', adv: 'Advertência' };
let members = [];
let filterText = '', filterLigaVal = '';

async function carregar() {
  const tbl = $('membros-tbl');
  tbl.innerHTML = `<tbody>${skeletonTableRows(5, 7)}</tbody>`;
  try {
    const data = await getMembrosLiga();
    members = data.map(m => ({
      id: m.id, name: m.nome, liga: m.ligas?.nome || '—',
      presenca: 0, entregas: '—', status: 'ok', adv: 0,
    }));
    render();
  } catch (e) {
    console.error('Erro ao carregar membros:', e);
  }
}

function render() {
  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(filterText) &&
    (filterLigaVal === '' || m.liga === filterLigaVal)
  );
  renderMembrosTable($('membros-tbl'), filtered);
}

$('filter-search').addEventListener('input', (e) => { filterText = e.target.value.toLowerCase(); render(); });
$('filter-liga').addEventListener('change', (e) => { filterLigaVal = e.target.value; render(); });

// ── Cadastro novo membro ──
async function handleCadastrarMembro() {
  const nome = $('novo-nome')?.value?.trim();
  const email = $('novo-email')?.value?.trim();
  const liga = $('nova-liga')?.value;
  if (!nome || !email || !liga) { toast.error('Preencha todos os campos.'); return; }
  if (!email.endsWith('@alunos.ibmec.edu.br')) { toast.error('Use o email @alunos.ibmec.edu.br'); return; }
  const matricula = email.replace('@alunos.ibmec.edu.br', '');
  try {
    const { error } = await supabase.from('emails_autorizados').insert({ email, nome, matricula });
    if (error) throw error;
    closeModal('modal-novo-membro');
    await carregar();
    toast.success('Membro cadastrado. Ele pode criar a conta pelo login.');
  } catch (e) {
    if (e.message?.includes('duplicate') || e.message?.includes('unique')) {
      toast.error('Este email já está cadastrado.');
    } else {
      toast.error('Erro ao cadastrar. Tente novamente.');
    }
  }
}

// ── Modal advertência (pra botão Anotar) ──
async function popularSelectAdv() {
  const select = $('advertencia-membro');
  if (!select) return;
  const mostraLiga = !ligaId;
  select.innerHTML = '<option value="" disabled selected>Selecione o membro</option>' +
    members.map(m => {
      const texto = mostraLiga ? `${m.name} — ${m.liga}` : m.name;
      return `<option value="${m.id}">${texto}</option>`;
    }).join('');
}

async function openAdvModal(membroId, name) {
  const sub = $('adv-modal-sub');
  if (sub) sub.textContent = name ? `Membro: ${name}` : 'Registrar advertência ou anotação';
  const desc = $('adv-descricao'); if (desc) desc.value = '';
  await popularSelectAdv();
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
    toast.success('Advertência registrada');
  } catch (e) {
    console.error('Erro:', e);
    toast.error(e.message || 'Erro ao registrar advertência');
  }
}

function exportCSV() {
  const rows = [['Nome', 'Liga', 'Presença', 'Entregas', 'Status']];
  members.forEach(m => rows.push([m.name, m.liga, m.presenca + '%', m.entregas, STATUS_LABEL[m.status]]));
  const csv = rows.map(r => r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'membros-ligas-2026-1.csv';
  a.click();
}

window.openModal = openModal;
window.closeModal = closeModal;
window.handleCadastrarMembro = handleCadastrarMembro;
window.openAdvModal = openAdvModal;
window.handleSalvarAdvertencia = handleSalvarAdvertencia;
window.exportCSV = exportCSV;

await carregar();
