// ── Página: Entregas (diretoria) ──
import { shell } from '/assets/js/ui/shell.js';
import { getTodasAulas, getEntregasAula } from '/assets/js/supabase/aulas.js';
import { renderEmptyState, icons } from '/assets/js/ui/empty-state.js';
import { skeletonTableRows } from '/assets/js/ui/skeleton.js';

const { usuario } = await shell.mount({ activeRoute: '/membros/diretoria/entregas', pageTitle: 'Entregas' });
const ligaId = usuario?.liga_id || null;

const tbl = document.getElementById('entregas-tbl');
const filterSelect = document.getElementById('filter-entregas-aula');

let cache = [];

function renderizar(data) {
  if (!data.length) {
    tbl.innerHTML = `<thead><tr><th>Membro</th><th>Aula</th><th>Repositório</th><th>Entrega</th><th>Status</th></tr></thead><tbody></tbody>`;
    renderEmptyState(tbl.querySelector('tbody'), {
      icon: icons.inbox,
      title: 'Ninguém entregou ainda',
      description: 'As entregas aparecem aqui quando os membros enviarem.',
    });
    return;
  }
  tbl.innerHTML = `<thead><tr><th>Membro</th><th>Aula</th><th>Repositório</th><th>Entrega</th><th>Status</th></tr></thead>
  <tbody>${data.map(e => {
    const nome = e.membros?.nome || '—';
    const aula = e.aula_titulo || '—';
    const repo = e.repo_url;
    const repoHtml = repo
      ? `<a href="${repo}" target="_blank" style="color:var(--blue);font-family:var(--font-mono);font-size:10px;text-decoration:none">${repo.replace(/^https?:\/\//, '')} ↗</a>`
      : '<span style="color:var(--muted)">—</span>';
    const entregueEm = e.entregue_em
      ? new Date(e.entregue_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
      : '—';
    const statusOk = e.status === 'entregue';
    return `<tr>
      <td style="font-weight:500">${nome}</td>
      <td style="color:var(--mid)">${aula}</td>
      <td>${repoHtml}</td>
      <td style="color:var(--muted);font-family:var(--font-mono);font-size:10px">${entregueEm}</td>
      <td><span class="pill ${statusOk ? 'ok' : 'late'}">${statusOk ? 'Entregue' : 'Atrasada'}</span></td>
    </tr>`;
  }).join('')}</tbody>`;
}

filterSelect.addEventListener('change', () => {
  const v = filterSelect.value;
  const filtered = cache.filter(e => v === '' || e.aula_titulo === v);
  renderizar(filtered);
});

tbl.innerHTML = `<tbody>${skeletonTableRows(4, 5)}</tbody>`;
try {
  const aulas = await getTodasAulas(ligaId);
  filterSelect.innerHTML = '<option value="">Todas as aulas</option>' +
    aulas.map(a => `<option value="${a.titulo}">Aula ${String(a.numero).padStart(2,'0')} — ${a.titulo}</option>`).join('');
  const all = [];
  for (const aula of aulas) {
    const entregas = await getEntregasAula(aula.id);
    entregas.forEach(e => all.push({ ...e, aula_titulo: aula.titulo }));
  }
  cache = all;
  renderizar(all);
} catch (e) {
  console.error('Erro ao carregar entregas:', e);
}
