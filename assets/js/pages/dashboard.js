// ── Dashboard Membro page ──
import { formatDate } from '/assets/js/global.js';
import { supabase } from '/assets/js/supabase/client.js';
import { requireAuth, fazerLogout } from '/assets/js/supabase/auth.js';
import { getMeuPerfil, completarOnboarding, atualizarPerfil } from '/assets/js/supabase/membros.js';
import { getAulasComEntregas, submeterEntrega } from '/assets/js/supabase/aulas.js';
import { getMinhasPresencas, registrarPresenca, calcularAlertaFrequencia } from '/assets/js/supabase/presenca.js';
import { getAvisos } from '/assets/js/supabase/avisos.js';

// ── Auth guard ──
const session = await requireAuth();
if (!session) throw new Error('Não autenticado');

// ── Role guard — diretoria vai para dashboard-diretoria ──
const { data: usuario, error: userError } = await supabase
  .from('usuarios')
  .select('role')
  .eq('id', session.user.id)
  .single();

const ROLES_DIRETORIA = ['presidente', 'vp', 'ops', 'rh', 'diretor', 'coordenador'];
if (!userError && usuario && ROLES_DIRETORIA.includes(usuario.role)) {
  window.location.href = '/membros/dashboard-diretoria';
  throw new Error('Redirecionando');
}

// ── State ──
let perfilAtual = null;
let aulasAtuais = [];
let currentStep = 0;
let onboardingNome = '';

// ── Data atual ──
document.getElementById('topbar-date').textContent = formatDate();

// ── Tabs ──
function showTab(name, el) {
  document.querySelectorAll('.tab-page').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name)?.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active', 'r', 'b'));
  if (el) el.classList.add('active', 'b');
  const titles = { dashboard: 'Dashboard', aulas: 'Aulas', entregas: 'Entregas', presenca: 'Presença', cronograma: 'Cronograma', perfil: 'Perfil' };
  document.getElementById('topbar-title').textContent = titles[name] || name;
}

// ── Helpers ──
function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
}

function ligaCor(perfil) {
  const nome = perfil?.ligas?.nome?.toLowerCase() || '';
  if (nome.includes('ibbot')) return 'r';
  if (nome.includes('ibtech')) return 'b';
  return 'w';
}

function el(id) { return document.getElementById(id); }

// ── Atualizar header/sidebar com perfil ──
function atualizarHeaderMembro(perfil) {
  const nome = perfil.nome || 'Membro';
  const inicial = nome[0]?.toUpperCase() || 'M';
  const ligaNome = perfil.ligas?.nome || '';
  const cor = ligaCor(perfil);

  el('sidebar-name').textContent = nome;
  el('sidebar-role').textContent = `Membro · ${ligaNome}`;
  el('sidebar-av').textContent = inicial;

  el('topbar-liga').textContent = ligaNome;
  el('topbar-liga').className = `topbar-liga ${cor}`;

  el('perfil-name-display').textContent = nome;
  el('perfil-av-text').textContent = inicial;
  el('p-nome').value = nome;
  el('p-linkedin').value = perfil.linkedin || '';
  el('p-github').value = perfil.github || '';
  el('p-bio').value = perfil.bio || '';

  const emailField = el('perfil-email');
  if (emailField) emailField.value = session.user.email;

  const badge = el('perfil-liga-badge');
  if (badge) { badge.textContent = ligaNome; badge.className = `perfil-liga-badge ${cor}`; }
}

// ── Renderizar dashboard (métricas + resumos) ──
function renderizarDashboard(perfil, presencas, aulas) {
  const presentes = presencas.filter(p => p.status === 'presente').length;
  const totalEncontros = presencas.length;
  const pctPresenca = totalEncontros > 0 ? Math.round((presentes / totalEncontros) * 100) : 0;

  const aulasComPrazo = aulas.filter(a => a.prazo_entrega);
  const entregues = aulas.filter(a => a.entrega).length;
  const totalEntregas = aulasComPrazo.length;
  const pctEntregas = totalEntregas > 0 ? Math.round((entregues / totalEntregas) * 100) : 0;
  const pendentes = totalEntregas - entregues;

  const now = new Date();
  const aulasPassadas = aulas.filter(a => new Date(a.data) < now);
  const pctAulas = aulas.length > 0 ? Math.round((aulasPassadas.length / aulas.length) * 100) : 0;
  const proxima = aulas.find(a => new Date(a.data) >= now);

  // Métricas
  el('metric-presenca-val').textContent = `${pctPresenca}%`;
  el('metric-presenca-val').className = `metric-val ${pctPresenca >= 75 ? 'g' : 'a'}`;
  el('metric-presenca-sub').textContent = `${presentes} de ${totalEncontros} encontros`;

  el('metric-entregas-val').textContent = `${entregues} / ${totalEntregas}`;
  el('metric-entregas-val').className = `metric-val ${pendentes === 0 ? 'g' : 'b'}`;
  el('metric-entregas-sub').textContent = pendentes > 0 ? `${pendentes} pendente${pendentes > 1 ? 's' : ''}` : 'Tudo em dia';

  if (proxima) {
    const dia = new Date(proxima.data).toLocaleDateString('pt-BR', { weekday: 'long' });
    el('metric-proximo-val').textContent = dia.charAt(0).toUpperCase() + dia.slice(1);
    el('metric-proximo-sub').textContent = `${fmtDate(proxima.data)} · Aula ${String(proxima.numero).padStart(2, '0')}`;
  } else {
    el('metric-proximo-val').textContent = '—';
    el('metric-proximo-sub').textContent = 'Nenhuma agendada';
  }

  // Semestre
  const month = now.getMonth() + 1;
  el('metric-semestre-val').textContent = `${now.getFullYear()}.${month <= 6 ? 1 : 2}`;

  // Próximas aulas
  const proximas = aulas.filter(a => new Date(a.data) >= now).slice(0, 3);
  el('tbody-proximas-aulas').innerHTML = proximas.length
    ? proximas.map((a, i) => `<tr>
        <td>Aula ${String(a.numero).padStart(2, '0')} — ${a.titulo}</td>
        <td style="color:var(--mid)">${fmtDate(a.data)}</td>
        <td><span class="pill ${i === 0 ? 'next' : 'planned'}">${i === 0 ? 'Próxima' : 'Planejada'}</span></td>
      </tr>`).join('')
    : '<tr><td colspan="3" style="color:var(--muted);text-align:center">Nenhuma aula próxima</td></tr>';

  // Entregas resumo
  const entregasRecentes = aulasComPrazo.slice(-3);
  el('tbody-dash-entregas').innerHTML = entregasRecentes.length
    ? entregasRecentes.map(a => {
        let pill, label;
        if (a.statusEntrega === 'entregue') { pill = 'ok'; label = 'Entregue'; }
        else if (a.statusEntrega === 'atrasada') { pill = 'late'; label = 'Atrasada'; }
        else { pill = 'planned'; label = 'Pendente'; }
        return `<tr>
          <td>Aula ${String(a.numero).padStart(2, '0')} — ${a.titulo}</td>
          <td style="color:${a.statusEntrega === 'atrasada' ? 'rgba(255,120,120,.7)' : 'var(--mid)'}">${fmtDate(a.prazo_entrega)}</td>
          <td><span class="pill ${pill}">${label}</span></td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="3" style="color:var(--muted);text-align:center">Nenhuma entrega</td></tr>';

  // Barras de progresso
  el('pct-presenca').textContent = `${pctPresenca}%`;
  el('bar-presenca').style.width = `${pctPresenca}%`;
  el('pct-entregas').textContent = `${pctEntregas}%`;
  el('bar-entregas').style.width = `${pctEntregas}%`;
  el('pct-aulas').textContent = `${pctAulas}%`;
  el('bar-aulas').style.width = `${pctAulas}%`;

  // Perfil stats
  const sp = el('perfil-stat-presenca');
  const se = el('perfil-stat-entregas');
  if (sp) sp.textContent = `${pctPresenca}%`;
  if (se) se.textContent = `${entregues}/${totalEntregas}`;

  // Sidebar stats
  const sbPresenca = el('sb-presenca');
  if (sbPresenca) sbPresenca.textContent = `${pctPresenca}%`;
  const sbProxima = el('sb-proxima');
  if (sbProxima) {
    const proxEntrega = aulasComPrazo.find(a => a.statusEntrega !== 'entregue');
    sbProxima.textContent = proxEntrega ? fmtDate(proxEntrega.prazo_entrega) : 'Em dia';
  }
}

// ── Renderizar aulas (tab) ──
function renderizarAulas(aulas) {
  const grid = el('aulas-grid');
  if (!grid) return;

  const now = new Date();
  const ligaNome = perfilAtual?.ligas?.nome || '';
  const ht = el('aulas-header-title');
  const hs = el('aulas-header-sub');
  if (ht) ht.textContent = `Aulas — ${ligaNome}`;
  if (hs) hs.textContent = `Semestre ${now.getFullYear()}.${now.getMonth() < 6 ? 1 : 2} · ${aulas.length} aulas planejadas`;

  const futuras = aulas.filter(a => new Date(a.data) >= now);

  grid.innerHTML = aulas.map(a => {
    const data = new Date(a.data);
    const passada = data < now;
    const isProxima = futuras[0]?.id === a.id;

    let pillClass, pillLabel;
    if (passada) { pillClass = 'ok'; pillLabel = 'Concluída'; }
    else if (isProxima) { pillClass = 'next'; pillLabel = `Próxima · ${fmtDate(a.data)}`; }
    else { pillClass = 'planned'; pillLabel = 'Planejada'; }

    const links = (a.link_slides || a.link_material) ? `<div class="aula-links">
      ${a.link_slides ? `<a class="aula-link" href="${a.link_slides}" target="_blank">Slides</a>` : ''}
      ${a.link_material ? `<a class="aula-link" href="${a.link_material}" target="_blank">Material</a>` : ''}
    </div>` : '';

    return `<div class="aula-card${isProxima ? ' next-class' : ''}">
      <div class="aula-num">Aula ${String(a.numero).padStart(2, '0')}</div>
      <div class="aula-title">${a.titulo}</div>
      <div class="aula-meta">
        <span class="pill ${pillClass}">${pillLabel}</span>
        ${links}
      </div>
    </div>`;
  }).join('');
}

// ── Helper de prazo ──
function getPrazoClass(prazo, status) {
  if (status === 'entregue') return 'prazo-ok';
  if (status === 'atrasada') return 'prazo-atrasado';
  if (!prazo) return '';
  const diff = new Date(prazo) - new Date();
  const dias = diff / (1000 * 60 * 60 * 24);
  if (dias < 0) return 'prazo-atrasado';
  if (dias < 2) return 'prazo-alerta';
  return 'prazo-ok';
}

// ── Renderizar entregas (tab) ──
function renderizarEntregas(aulas) {
  const tbody = el('tbody-entregas');
  const box = el('entrega-box');
  if (!tbody) return;

  const aulasComPrazo = aulas.filter(a => a.prazo_entrega);

  tbody.innerHTML = aulasComPrazo.length
    ? aulasComPrazo.map(a => {
        let pillClass, pillLabel;
        if (a.statusEntrega === 'entregue') { pillClass = 'ok'; pillLabel = 'Entregue'; }
        else if (a.statusEntrega === 'atrasada') { pillClass = 'late'; pillLabel = 'Atrasada'; }
        else { pillClass = 'planned'; pillLabel = 'Pendente'; }

        const repo = a.entrega?.repo_url
          ? `<a href="${a.entrega.repo_url}" target="_blank" style="color:var(--blue);font-family:var(--font-mono);font-size:11px;text-decoration:none">${a.entrega.repo_url.replace('https://github.com/', '')} ↗</a>`
          : '<span style="color:var(--muted);font-size:11px">—</span>';

        const prazoClass = getPrazoClass(a.prazo_entrega, a.statusEntrega);

        return `<tr>
          <td style="font-weight:500">Aula ${String(a.numero).padStart(2, '0')} — ${a.titulo}</td>
          <td class="${prazoClass}">${fmtDate(a.prazo_entrega)}</td>
          <td>${repo}</td>
          <td><span class="pill ${pillClass}">${pillLabel}</span></td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="4" style="color:var(--muted);text-align:center">Nenhuma entrega disponível</td></tr>';

  // Form de entrega — mostra pra primeira aula pendente
  const pendente = aulasComPrazo.find(a => a.statusEntrega !== 'entregue');
  if (box && pendente) {
    box.style.display = '';
    el('entrega-title').textContent = `Enviar entrega — Aula ${String(pendente.numero).padStart(2, '0')}`;
    box.dataset.aulaId = pendente.id;
    el('repo-input').disabled = false;
    el('repo-input').value = '';
    const btn = box.querySelector('.entrega-submit');
    if (btn) { btn.disabled = false; btn.style.opacity = ''; btn.textContent = 'Enviar →'; }
    el('entrega-feedback').style.display = 'none';
  } else if (box) {
    box.style.display = 'none';
  }
}

// ── Renderizar presença (tab) ──
function renderizarPresencas(presencas, alerta) {
  const timeline = el('presenca-timeline');
  if (!timeline) return;

  const presentes = presencas.filter(p => p.status === 'presente').length;
  const total = presencas.length;
  const pct = total > 0 ? Math.round((presentes / total) * 100) : 0;

  const hs = el('presenca-header-sub');
  if (hs) hs.textContent = `${pct}% de presença · ${presentes} de ${total} encontros`;

  const pctEl = el('presenca-percent');
  if (pctEl) pctEl.textContent = `${pct}%`;

  const labelEl = el('presenca-percent-label');
  if (labelEl) {
    if (alerta.status === 'risco') labelEl.textContent = 'Em risco';
    else if (alerta.status === 'atencao') labelEl.textContent = 'Atenção';
    else labelEl.textContent = 'Regular';
  }

  const box = el('presenca-percent-box');
  if (box && pctEl) {
    const colors = {
      risco:   { bg: 'rgba(255,120,120,.08)', border: 'rgba(255,120,120,.2)', text: 'rgba(255,120,120,.8)' },
      atencao: { bg: 'rgba(251,191,36,.08)',  border: 'rgba(251,191,36,.2)',  text: 'var(--amber)' },
      ok:      { bg: 'rgba(34,197,94,.08)',   border: 'rgba(34,197,94,.2)',   text: 'var(--green)' },
    };
    const c = colors[alerta.status] || colors.ok;
    box.style.background = c.bg;
    box.style.borderColor = c.border;
    pctEl.style.color = c.text;
  }

  const sorted = [...presencas].sort((a, b) =>
    new Date(a.encontros?.data || 0) - new Date(b.encontros?.data || 0)
  );

  timeline.innerHTML = sorted.length
    ? sorted.map(p => {
        const ok = p.status === 'presente';
        return `<div class="presenca-item">
          <div class="presenca-check ${ok ? 'ok' : 'no'}">${ok ? '✓' : '✕'}</div>
          <div class="presenca-date">${fmtDate(p.encontros?.data)}</div>
          <div class="presenca-desc">${p.encontros?.titulo || '—'}</div>
          <span class="pill ${ok ? 'ok' : 'late'}" style="margin-left:auto">${ok ? 'Presente' : 'Ausente'}</span>
        </div>`;
      }).join('')
    : '<div style="color:var(--muted);text-align:center;padding:2rem 0">Nenhum registro de presença</div>';
}

// ── Renderizar avisos ──
function renderizarAvisos(avisos) {
  // Placeholder — avisos podem ser exibidos futuramente no dashboard
}

// ── Timeline cronograma ──
const cronogramaItens = [
  { data: '2026-03-06', titulo: 'Aula 01 — Lógica em C', subtitulo: 'Condicionais, loops e estruturas básicas' },
  { data: '2026-03-11', titulo: 'IbBot — Reunião de fase', subtitulo: 'Revisão mecânica e eletrônica' },
  { data: '2026-03-13', titulo: 'Aula 02 — Frontend', subtitulo: 'HTML, CSS e JavaScript' },
  { data: '2026-03-20', titulo: 'Aula 03 — Arrays em C', subtitulo: 'Arrays, matrizes e funções' },
  { data: '2026-03-27', titulo: 'Aula 04 — Git & GitHub', subtitulo: 'Versionamento e boas práticas' },
];

function renderizarTimeline(itens) {
  const container = document.getElementById('timeline-container');
  if (!container) return;

  const hoje = new Date().toDateString();

  container.innerHTML = itens.map(item => {
    const dataItem = new Date(item.data);
    const isHoje = dataItem.toDateString() === hoje;
    const isConcluida = dataItem < new Date() && !isHoje;
    const status = isHoje ? 'hoje' : isConcluida ? 'concluida' : 'planejada';

    return `
      <div class="timeline-item">
        <div class="timeline-dot ${status}"></div>
        <div class="timeline-date">${dataItem.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <div class="timeline-title">${item.titulo}</div>
        ${item.subtitulo ? `<div class="timeline-sub">${item.subtitulo}</div>` : ''}
        <span class="timeline-badge ${status}">${status === 'hoje' ? 'Hoje' : status === 'concluida' ? 'Concluída' : 'Planejada'}</span>
      </div>
    `;
  }).join('');
}

// ── Onboarding ──
const onboardingSteps = [
  { kicker: 'Passo 1 de 3', title: 'BEM-VINDO.', sub: 'Esse é o portal das ligas. Aqui você acompanha suas aulas, entregas e presença. Vamos configurar seu perfil em 3 passos rápidos.', content: '', next: 'Começar →' },
  { kicker: 'Passo 2 de 3', title: 'SEU NOME.', sub: 'Como você quer que apareça no portal?', content: 'nome', next: 'Continuar →' },
  { kicker: 'Passo 3 de 3', title: 'SEUS LINKS.', sub: 'LinkedIn e GitHub são opcionais, mas aparecem pro time.', content: 'links', next: 'Entrar no portal →' },
];

function renderStep(i) {
  const s = onboardingSteps[i];
  document.querySelectorAll('.ob-step').forEach((step, idx) => {
    step.classList.remove('done', 'active');
    if (idx < i) step.classList.add('done');
    if (idx === i) step.classList.add('active');
  });

  let contentHtml = '';
  if (s.content === 'nome') {
    contentHtml = '<input class="ob-input" id="ob-nome" placeholder="Seu nome completo">';
  } else if (s.content === 'links') {
    contentHtml = `
      <input class="ob-input" id="ob-linkedin" placeholder="linkedin.com/in/usuario (opcional)" type="url">
      <input class="ob-input" id="ob-github" placeholder="github.com/usuario (opcional)" type="url">`;
  }

  el('ob-content').innerHTML = `
    <div class="ob-slide">
      <div class="ob-kicker">${s.kicker}</div>
      <div class="ob-title">${s.title}</div>
      <div class="ob-sub">${s.sub}</div>
      ${contentHtml ? `<div class="ob-content">${contentHtml}</div>` : ''}
      <div id="ob-error" style="display:none;color:rgba(255,120,120,.8);font-size:12px;margin-bottom:.75rem"></div>
      <div class="ob-actions">
        <button class="ob-skip" onclick="skipOnboarding()">Pular</button>
        <button class="ob-next" onclick="nextStep()">${s.next}</button>
      </div>
    </div>`;
}

function nextStep() {
  if (currentStep === 1) {
    const nome = el('ob-nome')?.value?.trim();
    if (!nome) return mostrarErroOnboarding('Digite seu nome completo.');
    onboardingNome = nome;
  }
  if (currentStep === onboardingSteps.length - 1) { salvarOnboarding(); return; }
  currentStep++;
  renderStep(currentStep);
}

function mostrarOnboarding() {
  el('onboarding').style.display = '';
  currentStep = 0;
  renderStep(0);
}

function fecharOnboarding() {
  el('onboarding').style.display = 'none';
}

function mostrarErroOnboarding(msg) {
  const err = el('ob-error');
  if (err) { err.textContent = msg; err.style.display = 'block'; }
}

async function salvarOnboarding() {
  if (!onboardingNome) return mostrarErroOnboarding('Digite seu nome completo.');

  try {
    await completarOnboarding({
      nome: onboardingNome,
      linkedin: el('ob-linkedin')?.value?.trim() || null,
      github: el('ob-github')?.value?.trim() || null,
    });
    fecharOnboarding();
    inicializar();
  } catch (e) {
    mostrarErroOnboarding('Erro ao salvar. Tente novamente.');
  }
}

async function skipOnboarding() {
  try {
    await completarOnboarding({ nome: session.user.email.split('@')[0] });
    fecharOnboarding();
    inicializar();
  } catch (e) {
    fecharOnboarding();
  }
}

// ── Handlers ──

async function handleSubmeterEntrega() {
  const input = el('repo-input');
  const fb = el('entrega-feedback');
  const box = el('entrega-box');
  const url = input?.value?.trim();
  const aulaId = box?.dataset.aulaId;

  if (!url || !url.includes('github.com')) {
    fb.style.display = 'block';
    fb.style.color = 'rgba(255,120,120,.8)';
    fb.textContent = 'Link inválido. Use um repositório público do GitHub.';
    return;
  }

  const btn = box.querySelector('.entrega-submit');
  try {
    btn.disabled = true;
    btn.textContent = 'Enviando...';

    await submeterEntrega(aulaId, url);

    fb.style.display = 'block';
    fb.style.color = '#4ade80';
    fb.textContent = '✓ Entrega registrada. A diretoria foi notificada.';
    input.disabled = true;
    btn.style.opacity = '.4';

    aulasAtuais = await getAulasComEntregas();
    renderizarEntregas(aulasAtuais);
    const presencas = await getMinhasPresencas();
    renderizarDashboard(perfilAtual, presencas, aulasAtuais);
  } catch (e) {
    fb.style.display = 'block';
    fb.style.color = 'rgba(255,120,120,.8)';
    fb.textContent = e.message || 'Erro ao enviar entrega.';
    btn.disabled = false;
    btn.textContent = 'Enviar →';
  }
}

async function handleRegistrarPresenca(codigoParam) {
  const fb = el('presenca-feedback');
  const otpIds = ['otp-1','otp-2','otp-3','otp-4','otp-5','otp-6'];
  const codigo = codigoParam || otpIds.map(id => el(id)?.value || '').join('').trim();

  if (!codigo || codigo.length < 6) {
    fb.style.display = 'block';
    fb.style.color = 'rgba(255,120,120,.8)';
    fb.textContent = 'Digite o código de presença.';
    return;
  }

  try {
    otpIds.forEach(id => { const inp = el(id); if (inp) inp.disabled = true; });

    await registrarPresenca(codigo);

    fb.style.display = 'block';
    fb.style.color = '#4ade80';
    fb.textContent = '✓ Presença registrada!';

    const presencas = await getMinhasPresencas();
    renderizarPresencas(presencas, calcularAlertaFrequencia(presencas, presencas.length));
  } catch (e) {
    fb.style.display = 'block';
    fb.style.color = 'rgba(255,120,120,.8)';
    fb.textContent = e.message || 'Erro ao registrar presença.';
    otpIds.forEach(id => { const inp = el(id); if (inp) { inp.disabled = false; inp.value = ''; inp.classList.remove('filled'); } });
    el('otp-1')?.focus();
  }
}

async function savePerfil() {
  const btn = el('btn-salvar-perfil');
  const texto = el('btn-salvar-texto');
  if (!btn || !texto) return;

  btn.disabled = true;
  texto.textContent = 'SALVANDO...';

  try {
    const updates = {
      nome: el('p-nome').value.trim(),
      linkedin: el('p-linkedin').value.trim() || null,
      github: el('p-github').value.trim() || null,
      bio: el('p-bio').value.trim() || null,
    };

    const perfil = await atualizarPerfil(updates);
    perfilAtual = { ...perfilAtual, ...perfil };
    atualizarHeaderMembro(perfilAtual);

    texto.textContent = '✓ SALVO';
    btn.style.background = 'var(--green)';

    setTimeout(() => {
      texto.textContent = 'SALVAR →';
      btn.style.background = '';
      btn.disabled = false;
    }, 2000);
  } catch (e) {
    texto.textContent = 'ERRO — TENTAR NOVAMENTE';
    btn.style.background = 'var(--red)';
    setTimeout(() => {
      texto.textContent = 'SALVAR →';
      btn.style.background = '';
      btn.disabled = false;
    }, 2000);
  }
}

function handleFoto(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const src = e.target.result;
    document.querySelector('.perfil-av').innerHTML = `<img src="${src}" alt="foto">`;
    el('sidebar-av').innerHTML = `<img src="${src}" alt="foto" style="width:100%;height:100%;object-fit:cover;border-radius:3px">`;
  };
  reader.readAsDataURL(file);
}

// ── Inicialização ──
async function inicializar() {
  try {
    const perfil = await getMeuPerfil();

    if (!perfil || !perfil.onboarding_completo) {
      mostrarOnboarding();
      return;
    }

    perfilAtual = perfil;
    fecharOnboarding();
    atualizarHeaderMembro(perfil);

    const [presencas, aulas, avisos] = await Promise.all([
      getMinhasPresencas(),
      getAulasComEntregas(),
      getAvisos(),
    ]);

    aulasAtuais = aulas;
    const alerta = calcularAlertaFrequencia(presencas, presencas.length);

    renderizarDashboard(perfil, presencas, aulas);
    renderizarPresencas(presencas, alerta);
    renderizarAulas(aulas);
    renderizarEntregas(aulas);
    renderizarAvisos(avisos);
    renderizarTimeline(cronogramaItens);
  } catch (e) {
    console.error('Erro ao carregar dashboard:', e);
  }
}

inicializar();

// ── Logout ──
el('btn-logout')?.addEventListener('click', fazerLogout);

// ── Expose to inline onclick ──
window.showTab = showTab;
window.submitEntrega = handleSubmeterEntrega;
window.savePerfil = savePerfil;
window.handleFoto = handleFoto;
window.nextStep = nextStep;
window.finishOnboarding = salvarOnboarding;
window.skipOnboarding = skipOnboarding;
window.registrarPresencaCodigo = handleRegistrarPresenca;
