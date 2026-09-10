// ── Página: Entregas (diretoria) ──
import { shell } from '/assets/js/ui/shell.js';
import { getTodasAulas, getEntregasAula } from '/assets/js/supabase/aulas.js';
import { getMembrosLiga } from '/assets/js/supabase/membros.js';
import { renderEmptyState, icons } from '/assets/js/ui/empty-state.js';
import { skeletonTableRows } from '/assets/js/ui/skeleton.js';

const { usuario } = await shell.mount({ activeRoute: '/membros/diretoria/entregas', pageTitle: 'Entregas' });
const ligaId = usuario?.liga_id || null;

const tbl = document.getElementById('entregas-tbl');
const filterSelect = document.getElementById('filter-entregas-aula');
const statusSelect = document.getElementById('filter-entregas-status');
const summary = document.getElementById('entregas-summary');

let cache = [];

function renderizar(data) {
  if (!data.length) {
    tbl.innerHTML = `<caption class="sr-only">Situação das entregas de cada membro por tarefa</caption><thead><tr><th>Membro</th><th>Tarefa</th><th>Prazo</th><th>Repositório</th><th>Entrega</th><th>Status</th></tr></thead><tbody></tbody>`;
    renderEmptyState(tbl.querySelector('tbody'), {
      icon: icons.inbox,
      title: cache.length ? 'Nenhum resultado para estes filtros' : 'Nenhuma tarefa com prazo',
      description: cache.length ? 'Altere os filtros para ver outras entregas.' : 'Publique uma tarefa com prazo para acompanhar as entregas.',
    });
    if (summary) summary.textContent = '0 resultados';
    return;
  }
  const entregues = data.filter(e => e.status === 'entregue').length;
  const atrasadas = data.filter(e => e.status === 'atrasada').length;
  const pendentes = data.filter(e => e.status === 'pendente').length;
  if (summary) summary.textContent = `${entregues} entregues · ${pendentes} pendentes · ${atrasadas} atrasadas`;

  tbl.innerHTML = `<caption class="sr-only">Situação das entregas de cada membro por tarefa</caption><thead><tr><th>Membro</th><th>Tarefa</th><th>Prazo</th><th>Repositório</th><th>Entrega</th><th>Status</th></tr></thead>
  <tbody>${data.map(e => {
    const nome = e.membro_nome || '—';
    const aula = e.aula_titulo || '—';
    const repo = e.repo_url;
    const repoHtml = repo
      ? `<a href="${repo}" target="_blank" style="color:var(--blue);font-family:var(--font-mono);font-size:10px;text-decoration:none">${repo.replace(/^https?:\/\//, '')} ↗</a>`
      : '<span style="color:var(--muted)">—</span>';
    const entregueEm = e.entregue_em
      ? new Date(e.entregue_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
      : '—';
    const prazo = new Date(`${e.prazo_entrega}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
    const pill = e.status === 'entregue' ? 'ok' : e.status === 'atrasada' ? 'late' : 'planned';
    const label = e.status === 'entregue' ? 'Entregue' : e.status === 'atrasada' ? 'Atrasada' : 'Pendente';
    return `<tr>
      <td style="font-weight:500">${nome}</td>
      <td style="color:var(--mid)">${aula}</td>
      <td style="color:var(--muted);font-family:var(--font-mono);font-size:11px">${prazo}</td>
      <td>${repoHtml}</td>
      <td style="color:var(--muted);font-family:var(--font-mono);font-size:10px">${entregueEm}</td>
      <td><span class="pill ${pill}">${label}</span></td>
    </tr>`;
  }).join('')}</tbody>`;
}

function aplicarFiltros() {
  const aulaId = filterSelect.value;
  const status = statusSelect.value;
  const filtered = cache.filter(e =>
    (!aulaId || e.aula_id === aulaId) && (!status || e.status === status)
  );
  renderizar(filtered);
}

filterSelect.addEventListener('change', aplicarFiltros);
statusSelect.addEventListener('change', aplicarFiltros);

tbl.innerHTML = `<tbody>${skeletonTableRows(4, 6)}</tbody>`;
try {
  const [todasAulas, membros] = await Promise.all([getTodasAulas(ligaId), getMembrosLiga(ligaId)]);
  const aulas = todasAulas.filter(a => a.tipo === 'tarefa' && a.publicada && a.prazo_entrega);
  filterSelect.innerHTML = '<option value="">Todas as tarefas</option>' +
    aulas.map(a => `<option value="${a.id}">Tarefa ${String(a.numero).padStart(2,'0')} — ${a.titulo}</option>`).join('');
  const all = [];
  for (const aula of aulas) {
    const entregas = await getEntregasAula(aula.id);
    const porMembro = new Map(entregas.map(e => [e.membro_id, e]));
    membros.forEach(membro => {
      const entrega = porMembro.get(membro.id);
      const prazoPassou = new Date(`${aula.prazo_entrega}T23:59:59`) < new Date();
      all.push({
        aula_id: aula.id,
        aula_titulo: `Tarefa ${String(aula.numero).padStart(2, '0')} — ${aula.titulo}`,
        prazo_entrega: aula.prazo_entrega,
        membro_id: membro.id,
        membro_nome: membro.nome,
        repo_url: entrega?.repo_url || null,
        entregue_em: entrega?.entregue_em || null,
        status: entrega?.status === 'entregue' ? 'entregue' : prazoPassou ? 'atrasada' : 'pendente',
      });
    });
  }
  cache = all;
  renderizar(all);
} catch (e) {
  console.error('Erro ao carregar entregas:', e);
}
