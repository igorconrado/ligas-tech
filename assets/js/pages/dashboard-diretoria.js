// ── Dashboard Diretoria page ──
import { formatDate } from '/assets/js/global.js';
import { openModal, closeModal, initModalEscape } from '/assets/js/components/modal.js';
import { supabase } from '/assets/js/supabase/client.js';
import { requireAuth, fazerLogout } from '/assets/js/supabase/auth.js';
import { getMembrosLiga, getMeuPerfil } from '/assets/js/supabase/membros.js';
import { getTodasAulas, criarAula, togglePublicarAula, getEntregasAula } from '/assets/js/supabase/aulas.js';
import { abrirChamada, fecharChamada, corrigirPresenca, assinarPresencasEncontro, getEncontros, criarEncontro } from '/assets/js/supabase/presenca.js';
import { publicarAviso, getAvisos } from '/assets/js/supabase/avisos.js';
import { registrarAdvertencia, getTodasAdvertencias } from '/assets/js/supabase/advertencias.js';
import { exportarTodosRegistros, exportarResumoPorMembro, exportarPorEncontro, exportarRelatorioFrequencia } from '/assets/js/supabase/exportacao.js';
import { toast } from '/assets/js/ui/toast.js';

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
let entregasCache = [];
let filterAulaVal = '';

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

// ── Atualizar métricas do topo ──
async function atualizarMetricas() {
  try {
    const membros = await getMembrosLiga();
    const totalMembros = membros.length;

    const elMembros = document.querySelector('[data-metric="membros"]') ||
                      document.getElementById('metric-membros');
    if (elMembros) elMembros.textContent = totalMembros;

  } catch (e) {
    console.error('Erro ao atualizar métricas:', e);
  }
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
function openAdvModal(membroId, name) {
  const sub = document.getElementById('adv-modal-sub');
  if (sub) sub.textContent = name ? `Membro: ${name}` : 'Registrar advertência ou anotação';
  const idInput = document.getElementById('adv-membro-id');
  if (idInput) idInput.value = membroId || '';
  const desc = document.getElementById('adv-descricao');
  if (desc) desc.value = '';
  openModal('modal-advertencia');
}

async function handleSalvarAdvertencia() {
  const membroId = document.getElementById('adv-membro-id')?.value;
  const tipo     = document.getElementById('adv-tipo')?.value;
  const descricao = document.getElementById('adv-descricao')?.value?.trim();

  if (!membroId || !tipo || !descricao) return;

  try {
    await registrarAdvertencia(membroId, tipo, descricao);
    closeModal('modal-advertencia');
    await carregarAdvertencias();
    toast.success('Advertência registrada.');
  } catch (e) {
    console.error('Erro ao registrar advertência:', e);
  }
}

async function carregarAdvertencias() {
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
    tbody.innerHTML = `
      <tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--muted);font-family:var(--font-mono);font-size:10px;letter-spacing:.08em">
        Nenhuma advertência registrada
      </td></tr>`;
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
