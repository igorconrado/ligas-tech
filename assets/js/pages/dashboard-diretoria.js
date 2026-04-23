// ── Dashboard Diretoria page ──
import { formatDate } from '/assets/js/global.js';
import { openModal, closeModal, initModalEscape } from '/assets/js/components/modal.js';
import { supabase } from '/assets/js/supabase/client.js';
import { requireAuth, fazerLogout } from '/assets/js/supabase/auth.js';
import { getMembrosLiga, getMeuPerfil } from '/assets/js/supabase/membros.js';
import { getAulasComEntregas } from '/assets/js/supabase/aulas.js';
import { abrirChamada, fecharChamada, corrigirPresenca, assinarPresencasEncontro } from '/assets/js/supabase/presenca.js';
import { publicarAviso, getAvisos } from '/assets/js/supabase/avisos.js';
import { exportarTodosRegistros, exportarResumoPorMembro, exportarPorEncontro, exportarRelatorioFrequencia } from '/assets/js/supabase/exportacao.js';

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

// ── State ──
let members = [];
let presenceMembers = [];
let presentSet = new Set();

// Aulas (hardcoded — pendente integração)
const aulas = [
  { num: '01', title: 'Lógica, condicionais e loops em C', status: 'ok', entregas: '15/17', prazo: '13 mar' },
  { num: '02', title: 'HTML, CSS e JavaScript — Frontend', status: 'warn', entregas: '12/17', prazo: '17 mar' },
  { num: '03', title: 'Arrays, matrizes e funções em C', status: 'next', entregas: '—', prazo: '27 mar' },
  { num: '04', title: 'Git e GitHub — versionamento', status: 'planned', entregas: '—', prazo: '03 abr' },
  { num: '05', title: 'Backend com Node.js', status: 'planned', entregas: '—', prazo: '10 abr' },
  { num: '06', title: 'Banco de dados — SQL', status: 'planned', entregas: '—', prazo: '17 abr' },
];

// Entregas (hardcoded — pendente integração)
const entregasData = [
  { membro: 'Ana Lima', liga: 'IbTech', aula: 'Aula 01', repo: 'github.com/ana/ibtech-aula01', status: 'ok', data: '13 mar' },
  { membro: 'Ana Lima', liga: 'IbTech', aula: 'Aula 02', repo: '—', status: 'late', data: '—' },
  { membro: 'Bruno Dias', liga: 'IbTech', aula: 'Aula 01', repo: 'github.com/bruno/ibtech-aula01', status: 'ok', data: '12 mar' },
  { membro: 'Bruno Dias', liga: 'IbTech', aula: 'Aula 02', repo: 'github.com/bruno/ibtech-aula02', status: 'ok', data: '16 mar' },
  { membro: 'Pedro Ramos', liga: 'IbTech', aula: 'Aula 01', repo: '—', status: 'late', data: '—' },
  { membro: 'Pedro Ramos', liga: 'IbTech', aula: 'Aula 02', repo: '—', status: 'late', data: '—' },
  { membro: 'Diego Santos', liga: 'IbTech', aula: 'Aula 01', repo: 'github.com/diego/ibtech-aula01', status: 'ok', data: '14 mar' },
  { membro: 'Diego Santos', liga: 'IbTech', aula: 'Aula 02', repo: '—', status: 'late', data: '—' },
];

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

// ── Carregar membros do Supabase ──
async function carregarMembros() {
  try {
    const membros = await getMembrosLiga();
    members = membros.map(m => ({
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
  tbl.innerHTML = `<thead><tr><th>Nome</th><th>Liga</th><th>Presença</th><th>Entregas</th><th>Status</th><th>Adv.</th><th></th></tr></thead>
  <tbody>${data.map(m => `<tr>
    <td style="font-weight:500">${m.name}</td>
    <td><span class="pill ${m.liga === 'IbBot' ? 'r' : 'b'}">${m.liga}</span></td>
    <td><div class="prog-wrap"><div class="prog-bar"><div class="prog-fill ${m.presenca >= 75 ? 'g' : 'r'}" style="width:${m.presenca}%"></div></div><span class="prog-val">${m.presenca}%</span></div></td>
    <td style="color:var(--mid)">${m.entregas}</td>
    <td><span class="pill ${statusMap[m.status] || 'ok'}">${statusLabel[m.status] || 'Regular'}</span></td>
    <td style="color:${m.adv > 0 ? 'rgba(255,120,120,.8)' : 'var(--muted)'}; font-family:var(--font-mono); font-size:11px">${m.adv > 0 ? m.adv + 'x' : '—'}</td>
    <td><button class="btn-sm ghost" style="font-size:10px;padding:3px 8px" onclick="openAdvModal('${m.name}')">Anotar</button></td>
  </tr>`).join('')}</tbody>`;
}

// ── Render membros ──
function renderMembros(data) {
  const tbl = document.getElementById('membros-tbl');
  tbl.innerHTML = `<thead><tr><th>Nome</th><th>Liga</th><th>Presença</th><th>Entregas</th><th>Adv.</th><th>Semestre</th><th></th></tr></thead>
  <tbody>${data.map(m => `<tr>
    <td style="font-weight:500">${m.name}</td>
    <td><span class="pill ${m.liga === 'IbBot' ? 'r' : 'b'}">${m.liga}</span></td>
    <td><div class="prog-wrap"><div class="prog-bar"><div class="prog-fill ${m.presenca >= 75 ? 'g' : 'r'}" style="width:${m.presenca}%"></div></div><span class="prog-val">${m.presenca}%</span></div></td>
    <td style="color:var(--mid)">${m.entregas}</td>
    <td style="color:${m.adv > 0 ? 'rgba(255,120,120,.8)' : 'var(--muted)'}; font-family:var(--font-mono); font-size:11px">${m.adv > 0 ? m.adv + 'x' : '—'}</td>
    <td style="color:var(--muted)">2026.1</td>
    <td style="display:flex;gap:.375rem">
      <button class="btn-sm ghost" style="font-size:10px;padding:3px 8px" onclick="openAdvModal('${m.name}')">Anotar</button>
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

// ── Render aulas ──
function renderAulas() {
  const grid = document.getElementById('aulas-dir-grid');
  const statusPillMap = { ok: 'ok', warn: 'warn', next: 'next', planned: 'planned' };
  const statusLabelMap = { ok: 'Concluída', warn: 'Entregas pendentes', next: 'Próxima', planned: 'Planejada' };
  grid.innerHTML = aulas.map(a => `
    <div class="aula-dir-card">
      <div class="aula-num">Aula ${a.num}</div>
      <div class="aula-title-sm">${a.title}</div>
      <div class="aula-meta">
        <span class="pill ${statusPillMap[a.status]}">${statusLabelMap[a.status]}</span>
        <div style="display:flex;align-items:center;gap:.5rem">
          <span class="aula-stats">${a.entregas !== '—' ? a.entregas + ' entregas' : 'Prazo: ' + a.prazo}</span>
          <button class="btn-sm ghost" style="font-size:10px;padding:3px 8px">Editar</button>
        </div>
      </div>
    </div>`).join('');
}

// ── Render entregas ──
let filterAulaVal = '';
function filterEntregas(v) {
  filterAulaVal = v;
  const filtered = entregasData.filter(e => filterAulaVal === '' || e.aula === filterAulaVal);
  renderEntregas(filtered);
}
function renderEntregas(data) {
  const tbl = document.getElementById('entregas-tbl');
  tbl.innerHTML = `<thead><tr><th>Membro</th><th>Liga</th><th>Aula</th><th>Repositório</th><th>Entrega</th><th>Status</th></tr></thead>
  <tbody>${data.map(e => `<tr>
    <td style="font-weight:500">${e.membro}</td>
    <td><span class="pill ${e.liga === 'IbBot' ? 'r' : 'b'}">${e.liga}</span></td>
    <td style="color:var(--mid)">${e.aula}</td>
    <td>${e.repo !== '—' ? `<a href="https://${e.repo}" target="_blank" style="color:var(--blue);font-family:var(--font-mono);font-size:10px;text-decoration:none">${e.repo} ↗</a>` : '<span style="color:var(--muted)">—</span>'}</td>
    <td style="color:var(--muted);font-family:var(--font-mono);font-size:10px">${e.data}</td>
    <td><span class="pill ${e.status === 'ok' ? 'ok' : 'late'}">${e.status === 'ok' ? 'Entregue' : 'Atrasada'}</span></td>
  </tr>`).join('')}</tbody>`;
}

// ── Presença ──
function renderPresenca() {
  presenceMembers = members.filter(m => m.liga === 'IbTech').map(m => m.name);
  const grid = document.getElementById('presenca-grid');
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

// ── Chamada — Supabase ──
async function handleAbrirChamada() {
  const encontroId = document.getElementById('select-encontro')?.value;
  if (!encontroId) {
    alert('Selecione um encontro primeiro.');
    return;
  }

  try {
    const { codigo, expira } = await abrirChamada(encontroId);

    const qrCode = document.getElementById('qr-code');
    const qrDisplay = document.getElementById('qr-display');
    if (qrDisplay) qrDisplay.textContent = codigo;
    if (qrCode) qrCode.style.display = 'block';

    const expiraEl = document.getElementById('qr-expira');
    if (expiraEl) {
      const mins = Math.floor((new Date(expira) - new Date()) / 60000);
      expiraEl.textContent = `Expira em ${mins} minutos`;
    }

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
    alert('Erro ao abrir chamada. Tente novamente.');
  }
}

async function handleFecharChamada(encontroId) {
  try {
    await fecharChamada(encontroId);

    if (window._chamadaChannel) {
      window._chamadaChannel.unsubscribe();
      window._chamadaChannel = null;
    }

    const qrCode = document.getElementById('qr-code');
    if (qrCode) qrCode.style.display = 'none';

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

// ── Advertência ──
let advTarget = '';
function openAdvModal(name) {
  advTarget = name;
  document.getElementById('adv-modal-sub').textContent = `Membro: ${name}`;
  document.getElementById('adv-desc').value = '';
  openModal('adv-modal');
}
function saveAdv() {
  closeModal('adv-modal');
}

// ── Avisos — Supabase ──
async function handlePublicarAviso(titulo, mensagem) {
  try {
    await publicarAviso(titulo, mensagem);
    mostrarSucessoAviso();
    const avisos = await getAvisos();
    renderizarAvisos(avisos);
  } catch (e) {
    mostrarErroAviso('Erro ao publicar aviso.');
  }
}

function renderizarAvisos(avisos) {
  const lista = document.getElementById('avisos-lista');
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
  document.getElementById('aviso-titulo').value = '';
  document.getElementById('aviso-msg').value = '';
}

function mostrarErroAviso(msg) {
  alert(msg);
}

async function publishAviso() {
  const titulo = document.getElementById('aviso-titulo').value.trim();
  const msg = document.getElementById('aviso-msg').value.trim();
  if (!titulo || !msg) return;
  await handlePublicarAviso(titulo, msg);
}

async function carregarAvisos() {
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

function exportPresenca() { alert('CSV gerado — substituir por download real via Supabase'); }

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
renderAulas();
renderEntregas(entregasData);
await carregarAvisos();

// ── Expõe pro onclick inline ──
window.showTab = showTab;
window.openModal = openModal;
window.closeModal = closeModal;
window.openAdvModal = openAdvModal;
window.saveAdv = saveAdv;
window.publishAviso = publishAviso;
window.exportCSV = exportCSV;
window.filterMembers = filterMembers;
window.filterLiga = filterLiga;
window.filterEntregas = filterEntregas;
window.togglePresenca = togglePresenca;
window.markAll = markAll;
window.savePresenca = savePresenca;
window.exportPresenca = exportPresenca;
window.handleAbrirChamada = handleAbrirChamada;
window.handleFecharChamada = handleFecharChamada;
