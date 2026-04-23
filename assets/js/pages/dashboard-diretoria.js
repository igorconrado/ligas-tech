// ── Dashboard Diretoria page ──
import { formatDate } from '/assets/js/global.js';
import { openModal, closeModal, initModalEscape } from '/assets/js/components/modal.js';
import { supabase } from '/assets/js/supabase/client.js';
import { requireAuth, fazerLogout } from '/assets/js/supabase/auth.js';
import { getMembrosLiga, getMeuPerfil } from '/assets/js/supabase/membros.js';
import { getTodasAulas, criarAula, togglePublicarAula, getEntregasAula } from '/assets/js/supabase/aulas.js';
import { abrirChamada, fecharChamada, corrigirPresenca, assinarPresencasEncontro, getEncontros, criarEncontro, getPresencasEncontro } from '/assets/js/supabase/presenca.js';
import { publicarAviso, getAvisos } from '/assets/js/supabase/avisos.js';
import { registrarAdvertencia, getTodasAdvertencias } from '/assets/js/supabase/advertencias.js';
import { exportarTodosRegistros, exportarResumoPorMembro, exportarPorEncontro, exportarRelatorioFrequencia } from '/assets/js/supabase/exportacao.js';
import { toast } from '/assets/js/ui/toast.js';
import { renderEmptyState, icons } from '/assets/js/ui/empty-state.js';
import { skeletonRows, skeletonCards, skeletonTableRows, skeletonText } from '/assets/js/ui/skeleton.js';

// ── Auth ──
const session = await requireAuth();
if (!session) throw new Error('Não autenticado');

// ── Role guard — membro vai para dashboard de membro ──
const { data: usuario, error: userError } = await supabase
  .from('usuarios')
  .select('role')
  .eq('id', session.user.id)
  .single();

if (userError || !usuario || usuario.role === 'membro') {
  window.location.href = '/membros/dashboard';
  throw new Error('Redirecionando');
}

const perfil = await getMeuPerfil();
const ligaId = perfil?.liga_id;

// Data
document.getElementById('topbar-date').textContent = formatDate();

// ── Sidebar com dados reais do perfil ──
(function atualizarHeaderDiretoria() {
  const nome = perfil?.nome || session.user.email?.split('@')[0] || 'Diretoria';
  const inicial = nome.trim()[0]?.toUpperCase() || 'D';
  const role = (usuario?.role || 'Diretoria').replace(/^./, c => c.toUpperCase());

  const elAv = document.getElementById('sidebar-av');
  const elName = document.getElementById('sidebar-name');
  const elRole = document.getElementById('sidebar-role');
  if (elAv) elAv.textContent = inicial;
  if (elName) elName.textContent = nome;
  if (elRole) elRole.textContent = role;
})();

// ── State ──
let members = [];
let presenceMembers = [];
let presentSet = new Set();
let entregasCache = [];
let filterAulaVal = '';
let chamadaAberta = false;

const statusMap = { ok: 'ok', warn: 'warn', adv: 'adv' };
const statusLabel = { ok: 'Regular', warn: 'Atenção', adv: 'Advertência' };

// ── Tabs ──
function showTab(name, el) {
  document.querySelectorAll('.tab-page').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  if (el) el.classList.add('active');
  const titles = { dashboard: 'Dashboard', membros: 'Membros', advertencias: 'Advertências', presenca: 'Presença', aulas: 'Aulas', entregas: 'Entregas', avisos: 'Avisos' };
  document.getElementById('topbar-title').textContent = titles[name] || name;
}

// ── Helper: liga do usuário logado ──
async function getMinhaLigaId() {
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase
    .from('usuarios')
    .select('liga_id')
    .eq('id', user.id)
    .single();
  return data?.liga_id;
}

// ── Novo membro — Supabase ──
async function handleCadastrarMembro() {
  const nome  = document.getElementById('novo-nome')?.value?.trim();
  const email = document.getElementById('novo-email')?.value?.trim();
  const liga  = document.getElementById('nova-liga')?.value;

  if (!nome || !email || !liga) {
    toast.error('Preencha todos os campos.');
    return;
  }

  if (!email.endsWith('@alunos.ibmec.edu.br')) {
    toast.error('Use o email @alunos.ibmec.edu.br');
    return;
  }

  const matricula = email.replace('@alunos.ibmec.edu.br', '');

  try {
    const { error } = await supabase
      .from('emails_autorizados')
      .insert({ email, nome, matricula });

    if (error) throw error;

    closeModal('modal-novo-membro');
    await carregarMembros();
    toast.success('Membro cadastrado. Ele pode criar a conta pelo login.');

  } catch (e) {
    if (e.message?.includes('duplicate') || e.message?.includes('unique')) {
      toast.error('Este email já está cadastrado.');
    } else {
      toast.error('Erro ao cadastrar. Tente novamente.');
    }
  }
}

// ── Carregar membros do Supabase ──
async function carregarMembros() {
  const overviewTbl = document.getElementById('overview-tbl');
  if (overviewTbl) overviewTbl.innerHTML = `<tbody>${skeletonTableRows(5, 7)}</tbody>`;
  const membrosTbl = document.getElementById('membros-tbl');
  if (membrosTbl) membrosTbl.innerHTML = `<tbody>${skeletonTableRows(5, 7)}</tbody>`;

  try {
    const membros = await getMembrosLiga();
    members = membros.map(m => ({
      id: m.id,
      name: m.nome,
      liga: m.ligas?.nome || '—',
      presenca: 0,
      entregas: '—',
      status: 'ok',
      adv: 0,
    }));
    renderOverview(members);
    renderMembros(members);
    renderPresenca();
  } catch (e) {
    console.error('Erro ao carregar membros:', e);
  }
}

// ── Render overview table ──
function renderOverview(data) {
  const tbl = document.getElementById('overview-tbl');
  if (!data.length) {
    tbl.innerHTML = `<thead><tr><th>Nome</th><th>Liga</th><th>Presença</th><th>Entregas</th><th>Status</th><th>Adv.</th><th></th></tr></thead><tbody></tbody>`;
    renderEmptyState(tbl.querySelector('tbody'), {
      icon: icons.users,
      title: 'Nenhum membro cadastrado',
      description: 'Importe via processo seletivo ou adicione manualmente pelo botão "+ Novo membro".',
    });
    return;
  }
  tbl.innerHTML = `<thead><tr><th>Nome</th><th>Liga</th><th>Presença</th><th>Entregas</th><th>Status</th><th>Adv.</th><th></th></tr></thead>
  <tbody>${data.map(m => `<tr>
    <td style="font-weight:500">${m.name}</td>
    <td><span class="pill ${m.liga === 'IbBot' ? 'r' : 'b'}">${m.liga}</span></td>
    <td><div class="prog-wrap"><div class="prog-bar"><div class="prog-fill ${m.presenca >= 75 ? 'g' : 'r'}" style="width:${m.presenca}%"></div></div><span class="prog-val">${m.presenca}%</span></div></td>
    <td style="color:var(--mid)">${m.entregas}</td>
    <td><span class="pill ${statusMap[m.status] || 'ok'}">${statusLabel[m.status] || 'Regular'}</span></td>
    <td style="color:${m.adv > 0 ? 'rgba(255,120,120,.8)' : 'var(--muted)'}; font-family:var(--font-mono); font-size:11px">${m.adv > 0 ? m.adv + 'x' : '—'}</td>
    <td><button class="btn-sm ghost" style="font-size:10px;padding:3px 8px" onclick="openAdvModal('${m.id}', '${m.name}')">Anotar</button></td>
  </tr>`).join('')}</tbody>`;
}

// ── Render membros ──
function renderMembros(data) {
  const tbl = document.getElementById('membros-tbl');
  if (!data.length) {
    tbl.innerHTML = `<thead><tr><th>Nome</th><th>Liga</th><th>Presença</th><th>Entregas</th><th>Adv.</th><th>Semestre</th><th></th></tr></thead><tbody></tbody>`;
    renderEmptyState(tbl.querySelector('tbody'), {
      icon: icons.users,
      title: 'Nenhum membro cadastrado',
      description: 'Importe via processo seletivo ou adicione manualmente pelo botão "+ Novo membro".',
    });
    return;
  }
  tbl.innerHTML = `<thead><tr><th>Nome</th><th>Liga</th><th>Presença</th><th>Entregas</th><th>Adv.</th><th>Semestre</th><th></th></tr></thead>
  <tbody>${data.map(m => `<tr>
    <td style="font-weight:500">${m.name}</td>
    <td><span class="pill ${m.liga === 'IbBot' ? 'r' : 'b'}">${m.liga}</span></td>
    <td><div class="prog-wrap"><div class="prog-bar"><div class="prog-fill ${m.presenca >= 75 ? 'g' : 'r'}" style="width:${m.presenca}%"></div></div><span class="prog-val">${m.presenca}%</span></div></td>
    <td style="color:var(--mid)">${m.entregas}</td>
    <td style="color:${m.adv > 0 ? 'rgba(255,120,120,.8)' : 'var(--muted)'}; font-family:var(--font-mono); font-size:11px">${m.adv > 0 ? m.adv + 'x' : '—'}</td>
    <td style="color:var(--muted)">2026.1</td>
    <td style="display:flex;gap:.375rem">
      <button class="btn-sm ghost" style="font-size:10px;padding:3px 8px" onclick="openAdvModal('${m.id}', '${m.name}')">Anotar</button>
      <button class="btn-sm ghost" style="font-size:10px;padding:3px 8px">Editar</button>
    </td>
  </tr>`).join('')}</tbody>`;
}

// ── Filtros membros ──
let filterText = '', filterLigaVal = '';
function filterMembers(v) { filterText = v.toLowerCase(); applyFilters(); }
function filterLiga(v) { filterLigaVal = v; applyFilters(); }
function applyFilters() {
  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(filterText) &&
    (filterLigaVal === '' || m.liga === filterLigaVal)
  );
  renderMembros(filtered);
}

// ── Carregar + render aulas ──
async function carregarAulas() {
  const grid = document.getElementById('aulas-dir-grid');
  if (grid) grid.innerHTML = skeletonCards(3);

  try {
    const ligaIdAtual = await getMinhaLigaId();
    const aulas = await getTodasAulas(ligaIdAtual);
    renderizarAulas(aulas);
  } catch (e) {
    console.error('Erro ao carregar aulas:', e);
  }
}

function renderizarAulas(aulas) {
  const grid = document.getElementById('aulas-dir-grid');
  if (!grid) return;
  if (!aulas.length) {
    renderEmptyState(grid, {
      icon: icons.book,
      title: 'Nenhuma aula cadastrada',
      description: 'Use o botão "+ Nova aula" pra criar a primeira aula da liga.',
    });
    return;
  }
  const statusPillMap = { ok: 'ok', next: 'next', planned: 'planned' };
  const statusLabelMap = { ok: 'Concluída', next: 'Próxima', planned: 'Planejada' };
  const now = new Date();
  grid.innerHTML = aulas.map(a => {
    const numero = String(a.numero).padStart(2, '0');
    const prazo = a.prazo_entrega ? new Date(a.prazo_entrega) : null;
    let status = 'planned';
    if (a.publicada) status = prazo && prazo < now ? 'ok' : 'next';
    const prazoFmt = prazo
      ? prazo.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
      : '—';
    return `
      <div class="aula-dir-card">
        <div class="aula-num">Aula ${numero}</div>
        <div class="aula-title-sm">${a.titulo}</div>
        <div class="aula-meta">
          <span class="pill ${statusPillMap[status]}">${statusLabelMap[status]}</span>
          <div style="display:flex;align-items:center;gap:.5rem">
            <span class="aula-stats">Prazo: ${prazoFmt}</span>
            <button class="btn-sm ghost" style="font-size:10px;padding:3px 8px">Editar</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ── Carregar + render entregas ──
async function carregarEntregas() {
  const tbl = document.getElementById('entregas-tbl');
  if (tbl) tbl.innerHTML = `<tbody>${skeletonTableRows(4, 5)}</tbody>`;

  try {
    const ligaIdAtual = await getMinhaLigaId();
    const aulas = await getTodasAulas(ligaIdAtual);

    const todasEntregas = [];
    for (const aula of aulas) {
      const entregas = await getEntregasAula(aula.id);
      entregas.forEach(e => todasEntregas.push({ ...e, aula_titulo: aula.titulo }));
    }

    entregasCache = todasEntregas;
    renderizarEntregas(todasEntregas);
  } catch (e) {
    console.error('Erro ao carregar entregas:', e);
  }
}

function filterEntregas(v) {
  filterAulaVal = v;
  const filtered = entregasCache.filter(e => filterAulaVal === '' || e.aula_titulo === filterAulaVal);
  renderizarEntregas(filtered);
}

function renderizarEntregas(data) {
  const tbl = document.getElementById('entregas-tbl');
  if (!tbl) return;
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

// ── Atualizar métricas do topo (4 KPIs) ──
async function atualizarMetricas() {
  ['metric-membros', 'metric-presenca-media', 'pending-count', 'metric-advertencias'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = skeletonText('skeleton--title');
  });

  try {
    const ligaIdAtual = await getMinhaLigaId();

    const [membros, encontros, aulas, advertencias] = await Promise.all([
      getMembrosLiga(ligaIdAtual),
      getEncontros(ligaIdAtual),
      getTodasAulas(ligaIdAtual),
      getTodasAdvertencias(ligaIdAtual),
    ]);

    // 1. Membros ativos (val + sub por liga)
    const totalMembros = membros.length;
    const elMembros = document.getElementById('metric-membros');
    if (elMembros) elMembros.textContent = totalMembros;

    const porLiga = membros.reduce((acc, m) => {
      const nome = m.ligas?.nome || 'Sem liga';
      acc[nome] = (acc[nome] || 0) + 1;
      return acc;
    }, {});
    const subMembros = document.getElementById('metric-membros-sub');
    if (subMembros) {
      subMembros.textContent = Object.entries(porLiga)
        .map(([nome, n]) => `${n} ${nome}`)
        .join(' · ') || '—';
    }

    // 2. Presença média — N+1 paralelizado
    const presencasPorEnc = encontros.length
      ? await Promise.all(encontros.map(e => getPresencasEncontro(e.id)))
      : [];
    const porMembro = {};
    presencasPorEnc.flat().forEach(p => {
      porMembro[p.membro_id] = porMembro[p.membro_id] || { presentes: 0, total: 0 };
      porMembro[p.membro_id].total++;
      if (p.status === 'presente') porMembro[p.membro_id].presentes++;
    });
    const taxas = Object.values(porMembro)
      .filter(v => v.total > 0)
      .map(v => v.presentes / v.total);
    const presencaMedia = taxas.length
      ? Math.round((taxas.reduce((a, b) => a + b, 0) / taxas.length) * 100)
      : 0;
    const elPresenca = document.getElementById('metric-presenca-media');
    if (elPresenca) elPresenca.textContent = `${presencaMedia}%`;

    // 3. Entregas pendentes — aulas publicadas com prazo × membros ativos - entregues
    const aulasElegiveis = aulas.filter(a => a.publicada && a.prazo_entrega);
    const entregasPorAula = aulasElegiveis.length
      ? await Promise.all(aulasElegiveis.map(a => getEntregasAula(a.id)))
      : [];
    const totalEntregues = entregasPorAula.flat().filter(e => e.status === 'entregue').length;
    const totalEsperado = aulasElegiveis.length * totalMembros;
    const pendentes = Math.max(0, totalEsperado - totalEntregues);
    const elPending = document.getElementById('pending-count');
    if (elPending) elPending.textContent = pendentes;

    const subEntregas = document.getElementById('metric-entregas-pendentes-sub');
    if (subEntregas) {
      subEntregas.textContent = aulasElegiveis.length
        ? `em ${aulasElegiveis.length} aula${aulasElegiveis.length > 1 ? 's' : ''} com prazo`
        : 'Nenhuma aula com prazo';
    }

    // 4. Advertências ativas
    const elAdv = document.getElementById('metric-advertencias');
    if (elAdv) elAdv.textContent = advertencias.length;

  } catch (e) {
    console.error('Erro ao atualizar métricas:', e);
  }
}

// ── Últimas presenças (panel dashboard diretoria) ──
async function renderizarUltimasPresencas() {
  const tbody = document.getElementById('tbody-ultimas-presencas');
  if (!tbody) return;
  tbody.innerHTML = skeletonTableRows(3, 3);

  try {
    const ligaIdAtual = await getMinhaLigaId();
    const [encontros, membros] = await Promise.all([
      getEncontros(ligaIdAtual),
      getMembrosLiga(ligaIdAtual),
    ]);
    const ligaNome = perfil?.ligas?.nome || '—';
    const totalMembros = membros.length;

    const ultimos = encontros.slice(0, 3);
    if (!ultimos.length) {
      renderEmptyState(tbody, {
        icon: icons.clock,
        title: 'Nenhum encontro registrado',
        description: 'Crie encontros e abra chamadas pra ver taxas de presença.',
      });
      return;
    }

    const presencasPorEnc = await Promise.all(
      ultimos.map(e => getPresencasEncontro(e.id))
    );

    tbody.innerHTML = ultimos.map((e, i) => {
      const data = new Date(e.data).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '');
      const presentes = presencasPorEnc[i].filter(p => p.status === 'presente').length;
      const taxa = totalMembros > 0 ? Math.round((presentes / totalMembros) * 100) : 0;
      const pill = ligaNome === 'IbBot' ? 'r' : 'b';
      return `<tr>
        <td>${data} · ${e.titulo}</td>
        <td><span class="pill ${pill}">${ligaNome}</span></td>
        <td>${presentes}/${totalMembros} (${taxa}%)</td>
      </tr>`;
    }).join('');
  } catch (e) {
    console.error('Erro em últimas presenças:', e);
  }
}

// ── Entregas atrasadas (panel dashboard diretoria) ──
async function renderizarEntregasAtrasadas() {
  const tbody = document.getElementById('tbody-entregas-atrasadas');
  if (!tbody) return;
  tbody.innerHTML = skeletonTableRows(3, 3);

  try {
    const ligaIdAtual = await getMinhaLigaId();
    const [aulas, membros] = await Promise.all([
      getTodasAulas(ligaIdAtual),
      getMembrosLiga(ligaIdAtual),
    ]);

    const now = new Date();
    const aulasAtrasadas = aulas
      .filter(a => a.publicada && a.prazo_entrega && new Date(a.prazo_entrega) < now)
      .sort((a, b) => new Date(b.prazo_entrega) - new Date(a.prazo_entrega));

    if (!aulasAtrasadas.length) {
      renderEmptyState(tbody, {
        icon: icons.check,
        title: 'Sem entregas atrasadas',
        description: 'Tudo em dia ou nenhum prazo passou ainda.',
      });
      return;
    }

    const entregasPorAula = await Promise.all(
      aulasAtrasadas.map(a => getEntregasAula(a.id))
    );

    const porMembro = {};
    aulasAtrasadas.forEach((a, i) => {
      const entreguesIds = new Set(
        entregasPorAula[i].filter(e => e.status === 'entregue').map(e => e.membro_id)
      );
      membros.forEach(m => {
        if (!entreguesIds.has(m.id)) {
          porMembro[m.id] = porMembro[m.id] || { nome: m.nome, aulas: [] };
          porMembro[m.id].aulas.push(a.numero);
        }
      });
    });

    const top = Object.values(porMembro)
      .sort((a, b) => b.aulas.length - a.aulas.length)
      .slice(0, 3);

    if (!top.length) {
      renderEmptyState(tbody, {
        icon: icons.check,
        title: 'Sem entregas atrasadas',
        description: 'Todos entregaram no prazo.',
      });
      return;
    }

    tbody.innerHTML = top.map(m => {
      const n = m.aulas.length;
      const aulasLabel = n === 1
        ? `Aula ${String(m.aulas[0]).padStart(2, '0')}`
        : `${n} atrasadas`;
      const statusPill = n === 1
        ? '<span class="pill late">Atrasada</span>'
        : `<span class="pill adv">${n} atrasadas</span>`;
      return `<tr>
        <td>${m.nome}</td>
        <td>${aulasLabel}</td>
        <td>${statusPill}</td>
      </tr>`;
    }).join('');
  } catch (e) {
    console.error('Erro em entregas atrasadas:', e);
  }
}

// ── Presença ──
function renderPresenca() {
  const grid = document.getElementById('presenca-grid');
  if (!grid) return;

  if (!chamadaAberta) {
    renderEmptyState(grid, {
      icon: icons.clock,
      title: 'Nenhuma chamada aberta agora',
      description: 'Selecione um encontro e gere um QR Code pra abrir a chamada.',
    });
    document.getElementById('presenca-count').textContent = 0;
    document.getElementById('presenca-total').textContent = 0;
    return;
  }

  presenceMembers = members.filter(m => m.liga === 'IbTech').map(m => m.name);
  grid.innerHTML = presenceMembers.map((name, i) => {
    const on = presentSet.has(i);
    return `<div class="member-chip ${on ? 'present' : ''}" onclick="togglePresenca(${i})">
      <div class="check ${on ? 'on' : 'off'}">${on ? '✓' : ''}</div>
      <span class="chip-name">${name}</span>
    </div>`;
  }).join('');
  document.getElementById('presenca-count').textContent = presentSet.size;
  document.getElementById('presenca-total').textContent = presenceMembers.length;
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
  document.getElementById('chamada-badge').textContent = 'Salva';
  document.getElementById('chamada-badge').className = 'chamada-badge closed';
}

// ── Encontros — Supabase ──
async function carregarEncontros() {
  try {
    const ligaIdAtual = await getMinhaLigaId();
    const encontros = await getEncontros(ligaIdAtual);

    const select = document.getElementById('select-encontro');
    if (!select) return;

    if (encontros.length === 0) {
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

async function handleCriarEncontro() {
  const titulo = document.getElementById('encontro-titulo')?.value?.trim();
  const data   = document.getElementById('encontro-data')?.value;

  if (!titulo || !data) return;

  try {
    const ligaIdAtual = await getMinhaLigaId();
    await criarEncontro(ligaIdAtual, titulo, data);
    closeModal('modal-encontro');
    await carregarEncontros();
    toast.success('Encontro criado.');
  } catch (e) {
    console.error('Erro ao criar encontro:', e);
  }
}

// ── Chamada — Supabase ──
async function handleAbrirChamada() {
  const encontroId = document.getElementById('select-encontro')?.value;
  if (!encontroId) {
    toast.error('Selecione um encontro primeiro.');
    return;
  }

  try {
    const { codigo, expira } = await abrirChamada(encontroId);

    const qrDisplay = document.getElementById('qr-display');
    if (qrDisplay) qrDisplay.textContent = codigo;

    const expiraEl = document.getElementById('qr-expira');
    if (expiraEl) {
      const mins = Math.floor((new Date(expira) - new Date()) / 60000);
      expiraEl.textContent = `Expira em ${mins} minutos`;
    }

    openModal('qr-modal');

    chamadaAberta = true;
    renderPresenca();

    window._chamadaChannel = assinarPresencasEncontro(encontroId, (payload) => {
      atualizarPresencaTempoReal(payload.new);
    });

    const btnAbrir = document.getElementById('btn-abrir-chamada');
    if (btnAbrir) {
      btnAbrir.textContent = 'Fechar Chamada';
      btnAbrir.onclick = () => handleFecharChamada(encontroId);
    }

  } catch (e) {
    console.error('Erro ao abrir chamada:', e);
    toast.error('Erro ao abrir chamada. Tente novamente.');
  }
}

async function handleFecharChamada(encontroId) {
  closeModal('qr-modal');
  try {
    await fecharChamada(encontroId);

    if (window._chamadaChannel) {
      window._chamadaChannel.unsubscribe();
      window._chamadaChannel = null;
    }

    chamadaAberta = false;
    renderPresenca();

    const btnAbrir = document.getElementById('btn-abrir-chamada');
    if (btnAbrir) {
      btnAbrir.textContent = 'Abrir Chamada';
      btnAbrir.onclick = handleAbrirChamada;
    }

  } catch (e) {
    console.error('Erro ao fechar chamada:', e);
  }
}

function atualizarPresencaTempoReal(novaPresenca) {
  renderPresenca();
}

// ── Advertência — Supabase ──
async function popularSelectAdvertencia() {
  const select = document.getElementById('advertencia-membro');
  if (!select) return;
  try {
    const ligaDoUser = await getMinhaLigaId();
    const membros = await getMembrosLiga(ligaDoUser || null);
    const mostraLiga = !ligaDoUser;
    select.innerHTML = '<option value="" disabled selected>Selecione o membro</option>' +
      (membros || []).map(m => {
        const texto = mostraLiga ? `${m.nome} — ${m.ligas?.nome || '—'}` : m.nome;
        return `<option value="${m.id}">${texto}</option>`;
      }).join('');
  } catch (e) {
    console.error('Erro ao popular select de advertência:', e);
  }
}

async function openAdvModal(membroId, name) {
  const sub = document.getElementById('adv-modal-sub');
  if (sub) sub.textContent = name ? `Membro: ${name}` : 'Registrar advertência ou anotação';
  const desc = document.getElementById('adv-descricao');
  if (desc) desc.value = '';
  await popularSelectAdvertencia();
  const select = document.getElementById('advertencia-membro');
  if (select) select.value = membroId || '';
  openModal('modal-advertencia');
}

async function handleSalvarAdvertencia() {
  const membroId = document.getElementById('advertencia-membro')?.value;
  const tipo     = document.getElementById('adv-tipo')?.value;
  const descricao = document.getElementById('adv-descricao')?.value?.trim();

  if (!membroId) {
    toast.error('Selecione um membro');
    return;
  }
  if (!tipo || !descricao) return;

  try {
    await registrarAdvertencia(membroId, tipo, descricao);
    closeModal('modal-advertencia');
    const selectReset = document.getElementById('advertencia-membro');
    if (selectReset) selectReset.value = '';
    await carregarAdvertencias();
    toast.success('Advertência registrada.');
  } catch (e) {
    console.error('Erro ao registrar advertência:', e);
  }
}

async function carregarAdvertencias() {
  const tbody = document.getElementById('tbody-advertencias') ||
                document.querySelector('#tab-advertencias tbody');
  if (tbody) tbody.innerHTML = skeletonTableRows(4, 7);

  try {
    const ligaIdAtual = await getMinhaLigaId();
    const advertencias = await getTodasAdvertencias(ligaIdAtual);
    renderizarAdvertencias(advertencias);
  } catch (e) {
    console.error('Erro ao carregar advertências:', e);
  }
}

function renderizarAdvertencias(advertencias) {
  const tbody = document.getElementById('tbody-advertencias') ||
                document.querySelector('#tab-advertencias tbody');
  if (!tbody) return;

  if (!advertencias || advertencias.length === 0) {
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

function verAdvertencia(id) {
  console.log('ver advertência', id);
}

// ── Avisos — Supabase ──
async function handlePublicarAviso() {
  const titulo = document.getElementById('aviso-titulo')?.value?.trim();
  const mensagem = document.getElementById('aviso-mensagem')?.value?.trim();
  const destinatario = document.getElementById('aviso-destinatario')?.value;

  if (!titulo || !mensagem) return;

  let ligaIdAviso = null;
  if (destinatario && destinatario !== 'todos') {
    const { data } = await supabase
      .from('ligas')
      .select('id')
      .eq('nome', destinatario)
      .single();
    ligaIdAviso = data?.id || null;
  }

  try {
    await publicarAviso(titulo, mensagem, ligaIdAviso);
    mostrarSucessoAviso();
    document.getElementById('aviso-titulo').value = '';
    document.getElementById('aviso-mensagem').value = '';
    const avisos = await getAvisos();
    renderizarAvisos(avisos);
  } catch (e) {
    console.error('Erro ao publicar aviso:', e);
  }
}

function renderizarAvisos(avisos) {
  const lista = document.getElementById('avisos-lista');
  if (!lista) return;
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
        <div class="aviso-date">${new Date(a.criado_em).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</div>
      </div>
      <div class="aviso-body">${a.mensagem}</div>
    </div>
  `).join('');
}

function mostrarSucessoAviso() {
  const t = document.getElementById('aviso-titulo');
  const m = document.getElementById('aviso-msg');
  if (t) t.value = '';
  if (m) m.value = '';
}

async function carregarAvisos() {
  const lista = document.getElementById('avisos-lista');
  if (lista) lista.innerHTML = skeletonRows(3);

  try {
    const avisos = await getAvisos();
    renderizarAvisos(avisos);
  } catch (e) {
    console.error('Erro ao carregar avisos:', e);
  }
}

// ── CSV export (legado local) ──
function exportCSV() {
  const rows = [['Nome', 'Liga', 'Presença', 'Entregas', 'Status']];
  members.forEach(m => rows.push([m.name, m.liga, m.presenca + '%', m.entregas, statusLabel[m.status]]));
  const csv = rows.map(r => r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'membros-ligas-2026-1.csv';
  a.click();
}

function exportPresenca() { toast.info('CSV gerado — substituir por download real via Supabase'); }

// ── Escape handler ──
initModalEscape();

// ── Logout ──
document.getElementById('btn-logout')?.addEventListener('click', fazerLogout);

// ── Exportação — Supabase ──
document.getElementById('btn-export-todos')?.addEventListener('click', () => exportarTodosRegistros(ligaId));
document.getElementById('btn-export-membros')?.addEventListener('click', () => exportarResumoPorMembro(ligaId));
document.getElementById('btn-export-encontros')?.addEventListener('click', () => exportarPorEncontro(ligaId));
document.getElementById('btn-export-frequencia')?.addEventListener('click', () => exportarRelatorioFrequencia(ligaId));

// ── Init ──
await carregarMembros();
await carregarAulas();
await carregarEntregas();
await atualizarMetricas();
await renderizarUltimasPresencas();
await renderizarEntregasAtrasadas();
await carregarAvisos();
await carregarAdvertencias();
await carregarEncontros();

// ── Expõe pro onclick inline ──
window.showTab = showTab;
window.openModal = openModal;
window.closeModal = closeModal;
window.openAdvModal = openAdvModal;
window.handleSalvarAdvertencia = handleSalvarAdvertencia;
window.handleCadastrarMembro = handleCadastrarMembro;
window.verAdvertencia = verAdvertencia;
window.publishAviso = handlePublicarAviso;
window.exportCSV = exportCSV;
window.filterMembers = filterMembers;
window.filterLiga = filterLiga;
window.filterEntregas = filterEntregas;
window.togglePresenca = togglePresenca;
window.markAll = markAll;
window.savePresenca = savePresenca;
window.exportPresenca = exportPresenca;
window.handleAbrirChamada = handleAbrirChamada;
window.handleCriarEncontro = handleCriarEncontro;
window.handleFecharChamada = handleFecharChamada;
