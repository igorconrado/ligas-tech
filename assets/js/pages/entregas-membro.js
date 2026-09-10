// ── Página: Minhas Entregas (membro) ──
import { shell } from '/assets/js/ui/shell.js';
import { getAulasComEntregas, submeterEntrega } from '/assets/js/supabase/aulas.js';
import { renderEmptyState, icons } from '/assets/js/ui/empty-state.js';
import { skeletonTableRows } from '/assets/js/ui/skeleton.js';
import { toast } from '/assets/js/ui/toast.js';

await shell.mount({ activeRoute: '/membros/entregas', pageTitle: 'Minhas Entregas' });

const $ = (id) => document.getElementById(id);
let tarefasCache = [];
let tarefaSelecionadaId = null;

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
}

function getPrazoClass(prazo, status) {
  if (status === 'entregue') return 'prazo-ok';
  if (status === 'atrasada') return 'prazo-atrasado';
  if (!prazo) return '';
  const dias = (new Date(prazo) - new Date()) / (1000 * 60 * 60 * 24);
  if (dias < 0) return 'prazo-atrasado';
  if (dias < 2) return 'prazo-alerta';
  return 'prazo-ok';
}

function renderEntregas(aulas) {
  const tbody = $('tbody-entregas');
  const box = $('entrega-box');
  const aulasComPrazo = aulas.filter(a => a.prazo_entrega);

  if (!aulasComPrazo.length) {
    renderEmptyState(tbody, {
      icon: icons.inbox,
      title: 'Nenhuma tarefa disponível',
      description: 'Quando as tarefas forem cadastradas pela diretoria, elas aparecem aqui.',
    });
    if (box) box.style.display = 'none';
    return;
  }

  tarefasCache = aulasComPrazo;
  if (!tarefasCache.some(a => a.id === tarefaSelecionadaId && a.statusEntrega !== 'entregue')) {
    tarefaSelecionadaId = tarefasCache.find(a => a.statusEntrega !== 'entregue')?.id || null;
  }

  tbody.innerHTML = aulasComPrazo.map(a => {
    let pillClass, pillLabel;
    if (a.statusEntrega === 'entregue') { pillClass = 'ok'; pillLabel = 'Entregue'; }
    else if (a.statusEntrega === 'atrasada') { pillClass = 'late'; pillLabel = 'Atrasada'; }
    else { pillClass = 'planned'; pillLabel = 'Pendente'; }
    const repo = a.entrega?.repo_url
      ? `<a href="${a.entrega.repo_url}" target="_blank" style="color:var(--blue);font-family:var(--font-mono);font-size:11px;text-decoration:none">${a.entrega.repo_url.replace('https://github.com/', '')} ↗</a>`
      : '<span style="color:var(--muted);font-size:11px">—</span>';
    const acao = a.statusEntrega !== 'entregue'
      ? `<button type="button" class="btn-sm ${a.id === tarefaSelecionadaId ? 'b' : 'ghost'} entrega-select" data-aula-id="${a.id}">${a.id === tarefaSelecionadaId ? 'Selecionada' : 'Enviar'}</button>`
      : '';
    return `<tr>
      <td style="font-weight:500">Tarefa ${String(a.numero).padStart(2, '0')} — ${a.titulo}</td>
      <td class="${getPrazoClass(a.prazo_entrega, a.statusEntrega)}">${fmtDate(a.prazo_entrega)}</td>
      <td>${repo}</td>
      <td><span class="pill ${pillClass}">${pillLabel}</span>${acao ? `<div style="margin-top:.5rem">${acao}</div>` : ''}</td>
    </tr>`;
  }).join('');

  const pendente = aulasComPrazo.find(a => a.id === tarefaSelecionadaId && a.statusEntrega !== 'entregue');
  if (box && pendente) {
    box.style.display = '';
    $('entrega-title').textContent = `Enviar entrega — Tarefa ${String(pendente.numero).padStart(2, '0')}`;
    box.dataset.aulaId = pendente.id;
    $('repo-input').disabled = false;
    $('repo-input').value = '';
    const mensagemEl = $('mensagem-input');
    if (mensagemEl) { mensagemEl.disabled = false; mensagemEl.value = ''; }
    const btn = box.querySelector('.entrega-submit');
    if (btn) { btn.disabled = false; btn.style.opacity = ''; btn.textContent = 'Enviar →'; }
    $('entrega-feedback').style.display = 'none';
  } else if (box) {
    box.style.display = 'none';
  }
}

function selecionarTarefa(aulaId, moveFocus = true) {
  const tarefa = tarefasCache.find(a => a.id === aulaId && a.statusEntrega !== 'entregue');
  if (!tarefa) return;
  tarefaSelecionadaId = aulaId;
  renderEntregas(tarefasCache);
  if (moveFocus) {
    $('entrega-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    requestAnimationFrame(() => $('repo-input')?.focus());
  }
}

async function submitEntrega() {
  const input = $('repo-input');
  const mensagemEl = $('mensagem-input');
  const box = $('entrega-box');
  const url = input?.value?.trim();
  const mensagem = mensagemEl?.value?.trim() || null;
  const aulaId = box?.dataset.aulaId;

  if (!url || !url.includes('github.com')) {
    toast.error('Link inválido. Use um repositório público do GitHub.');
    return;
  }

  const btn = box.querySelector('.entrega-submit');
  try {
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    await submeterEntrega(aulaId, url, mensagem);
    toast.success('Entrega registrada. A diretoria foi notificada.');
    input.disabled = true;
    if (mensagemEl) mensagemEl.disabled = true;
    btn.style.opacity = '.4';
    const aulas = await getAulasComEntregas();
    renderEntregas(aulas);
  } catch (e) {
    toast.error(e.message || 'Erro ao enviar entrega.');
    btn.disabled = false;
    btn.textContent = 'Enviar →';
  }
}

document.getElementById('btn-submit-entrega')?.addEventListener('click', submitEntrega);
document.getElementById('tbody-entregas')?.addEventListener('click', e => {
  const button = e.target.closest('.entrega-select');
  if (button) selecionarTarefa(button.dataset.aulaId);
});

// Initial load
const tbody = $('tbody-entregas');
tbody.innerHTML = skeletonTableRows(4, 4);
try {
  const aulas = await getAulasComEntregas();
  renderEntregas(aulas);
} catch (e) {
  console.error('Erro ao carregar entregas:', e);
  renderEmptyState(tbody, {
    icon: icons.inbox,
    title: 'Erro ao carregar entregas',
    description: 'Tente recarregar a página.',
  });
}
