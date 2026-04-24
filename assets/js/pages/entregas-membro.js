// ── Página: Minhas Entregas (membro) ──
import { shell } from '/assets/js/ui/shell.js';
import { getAulasComEntregas, submeterEntrega } from '/assets/js/supabase/aulas.js';
import { renderEmptyState, icons } from '/assets/js/ui/empty-state.js';
import { skeletonTableRows } from '/assets/js/ui/skeleton.js';
import { toast } from '/assets/js/ui/toast.js';

await shell.mount({ activeRoute: '/membros/entregas', pageTitle: 'Minhas Entregas' });

const $ = (id) => document.getElementById(id);

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
      title: 'Nenhuma entrega disponível',
      description: 'Quando as aulas forem cadastradas pela diretoria, elas aparecem aqui.',
    });
    if (box) box.style.display = 'none';
    return;
  }

  tbody.innerHTML = aulasComPrazo.map(a => {
    let pillClass, pillLabel;
    if (a.statusEntrega === 'entregue') { pillClass = 'ok'; pillLabel = 'Entregue'; }
    else if (a.statusEntrega === 'atrasada') { pillClass = 'late'; pillLabel = 'Atrasada'; }
    else { pillClass = 'planned'; pillLabel = 'Pendente'; }
    const repo = a.entrega?.repo_url
      ? `<a href="${a.entrega.repo_url}" target="_blank" style="color:var(--blue);font-family:var(--font-mono);font-size:11px;text-decoration:none">${a.entrega.repo_url.replace('https://github.com/', '')} ↗</a>`
      : '<span style="color:var(--muted);font-size:11px">—</span>';
    return `<tr>
      <td style="font-weight:500">Aula ${String(a.numero).padStart(2, '0')} — ${a.titulo}</td>
      <td class="${getPrazoClass(a.prazo_entrega, a.statusEntrega)}">${fmtDate(a.prazo_entrega)}</td>
      <td>${repo}</td>
      <td><span class="pill ${pillClass}">${pillLabel}</span></td>
    </tr>`;
  }).join('');

  const pendente = aulasComPrazo.find(a => a.statusEntrega !== 'entregue');
  if (box && pendente) {
    box.style.display = '';
    $('entrega-title').textContent = `Enviar entrega — Aula ${String(pendente.numero).padStart(2, '0')}`;
    box.dataset.aulaId = pendente.id;
    $('repo-input').disabled = false;
    $('repo-input').value = '';
    const btn = box.querySelector('.entrega-submit');
    if (btn) { btn.disabled = false; btn.style.opacity = ''; btn.textContent = 'Enviar →'; }
    $('entrega-feedback').style.display = 'none';
  } else if (box) {
    box.style.display = 'none';
  }
}

async function submitEntrega() {
  const input = $('repo-input');
  const fb = $('entrega-feedback');
  const box = $('entrega-box');
  const url = input?.value?.trim();
  const aulaId = box?.dataset.aulaId;

  if (!url || !url.includes('github.com')) {
    toast.error('Link inválido. Use um repositório público do GitHub.');
    return;
  }

  const btn = box.querySelector('.entrega-submit');
  try {
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    await submeterEntrega(aulaId, url);
    toast.success('Entrega registrada. A diretoria foi notificada.');
    input.disabled = true;
    btn.style.opacity = '.4';
    const aulas = await getAulasComEntregas();
    renderEntregas(aulas);
  } catch (e) {
    toast.error(e.message || 'Erro ao enviar entrega.');
    btn.disabled = false;
    btn.textContent = 'Enviar →';
  }
}

window.submitEntrega = submitEntrega;

// Initial load
const tbody = $('tbody-entregas');
tbody.innerHTML = skeletonTableRows(4, 4);
try {
  const aulas = await getAulasComEntregas();
  renderEntregas(aulas);
} catch (e) {
  console.error('Erro ao carregar entregas:', e);
}
