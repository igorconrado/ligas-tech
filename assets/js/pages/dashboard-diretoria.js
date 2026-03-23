// ── Dashboard Diretoria page ──
import { formatDate } from '/assets/js/global.js';
import { openModal, closeModal, initModalEscape } from '/assets/js/components/modal.js';

// Data
document.getElementById('topbar-date').textContent = formatDate();

// Dados mockados
const members = [
  { name: 'Ana Lima', liga: 'IbTech', presenca: 82, entregas: '1/2', status: 'warn', adv: 0 },
  { name: 'Bruno Dias', liga: 'IbTech', presenca: 88, entregas: '2/2', status: 'ok', adv: 0 },
  { name: 'Carla Melo', liga: 'IbBot', presenca: 100, entregas: '2/2', status: 'ok', adv: 0 },
  { name: 'Diego Santos', liga: 'IbTech', presenca: 65, entregas: '1/2', status: 'warn', adv: 1 },
  { name: 'Fernanda Alves', liga: 'IbTech', presenca: 94, entregas: '2/2', status: 'ok', adv: 0 },
  { name: 'Gustavo Lima', liga: 'IbBot', presenca: 100, entregas: '2/2', status: 'ok', adv: 0 },
  { name: 'Helena Costa', liga: 'IbTech', presenca: 82, entregas: '2/2', status: 'ok', adv: 0 },
  { name: 'João Pires', liga: 'IbTech', presenca: 47, entregas: '0/2', status: 'adv', adv: 1 },
  { name: 'Lucas Viana', liga: 'IbTech', presenca: 76, entregas: '1/2', status: 'warn', adv: 0 },
  { name: 'Maria Costa', liga: 'IbBot', presenca: 100, entregas: '2/2', status: 'ok', adv: 0 },
  { name: 'Pedro Ramos', liga: 'IbTech', presenca: 53, entregas: '0/2', status: 'adv', adv: 1 },
  { name: 'Rafael Souza', liga: 'IbTech', presenca: 88, entregas: '2/2', status: 'ok', adv: 0 },
  { name: 'Sara Nunes', liga: 'IbBot', presenca: 100, entregas: '2/2', status: 'ok', adv: 0 },
];

const aulas = [
  { num: '01', title: 'Lógica, condicionais e loops em C', status: 'ok', entregas: '15/17', prazo: '13 mar' },
  { num: '02', title: 'HTML, CSS e JavaScript — Frontend', status: 'warn', entregas: '12/17', prazo: '17 mar' },
  { num: '03', title: 'Arrays, matrizes e funções em C', status: 'next', entregas: '—', prazo: '27 mar' },
  { num: '04', title: 'Git e GitHub — versionamento', status: 'planned', entregas: '—', prazo: '03 abr' },
  { num: '05', title: 'Backend com Node.js', status: 'planned', entregas: '—', prazo: '10 abr' },
  { num: '06', title: 'Banco de dados — SQL', status: 'planned', entregas: '—', prazo: '17 abr' },
];

const statusMap = { ok: 'ok', warn: 'warn', adv: 'adv' };
const statusLabel = { ok: 'Regular', warn: 'Atenção', adv: 'Advertência' };

// Tabs
function showTab(name, el) {
  document.querySelectorAll('.tab-page').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  if (el) el.classList.add('active');
  const titles = { dashboard: 'Dashboard', membros: 'Membros', advertencias: 'Advertências', presenca: 'Presença', aulas: 'Aulas', entregas: 'Entregas', avisos: 'Avisos' };
  document.getElementById('topbar-title').textContent = titles[name] || name;
}

// Render overview table
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

// Render membros
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

// Filtros membros
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

// Render aulas
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

// Render entregas
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

// Presença
const presenceMembers = members.filter(m => m.liga === 'IbTech').map(m => m.name);
let presentSet = new Set([0, 1, 3, 4, 5, 6, 7, 9, 10, 11]);
function renderPresenca() {
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
function exportPresenca() { alert('CSV gerado — substituir por download real via Supabase'); }

// QR Code
let qrTimer, qrSeconds = 600;
function openQR() {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  document.getElementById('qr-code-text').textContent = code;
  qrSeconds = 600;
  openModal('qr-modal');
  document.getElementById('chamada-badge').textContent = 'Aberta';
  document.getElementById('chamada-badge').className = 'chamada-badge open';
  clearInterval(qrTimer);
  qrTimer = setInterval(() => {
    qrSeconds--;
    const m = String(Math.floor(qrSeconds / 60)).padStart(2, '0');
    const s = String(qrSeconds % 60).padStart(2, '0');
    document.getElementById('qr-timer-val').textContent = `${m}:${s}`;
    if (qrSeconds <= 0) { clearInterval(qrTimer); closeModal('qr-modal'); }
  }, 1000);
}

// Advertência
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

// Aviso
function publishAviso() {
  const titulo = document.getElementById('aviso-titulo').value.trim();
  const msg = document.getElementById('aviso-msg').value.trim();
  if (!titulo || !msg) return;
  const lista = document.getElementById('avisos-lista');
  const now = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  lista.insertAdjacentHTML('afterbegin', `<div class="aviso-item">
    <div class="aviso-head"><div class="aviso-title-text">${titulo}</div><div class="aviso-date">${now} · Igor</div></div>
    <div class="aviso-body">${msg}</div>
  </div>`);
  document.getElementById('aviso-titulo').value = '';
  document.getElementById('aviso-msg').value = '';
}

// CSV export
function exportCSV() {
  const rows = [['Nome', 'Liga', 'Presença', 'Entregas', 'Status']];
  members.forEach(m => rows.push([m.name, m.liga, m.presenca + '%', m.entregas, statusLabel[m.status]]));
  const csv = rows.map(r => r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'membros-ligas-2026-1.csv';
  a.click();
}

// closeModal override — limpa timer do QR quando fecha
const _closeModal = closeModal;
function closeModalWithQR(id) {
  _closeModal(id);
  if (id === 'qr-modal') { clearInterval(qrTimer); }
}

// Escape handler
initModalEscape();

// Init
renderOverview(members);
renderMembros(members);
renderAulas();
renderEntregas(entregasData);
renderPresenca();

// Expõe pro onclick inline
window.showTab = showTab;
window.openModal = openModal;
window.closeModal = closeModalWithQR;
window.openQR = openQR;
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
