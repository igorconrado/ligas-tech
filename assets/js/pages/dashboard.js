// ── Dashboard Membro — Visão Geral ──
// Outras seções (aulas, entregas, presença, cronograma, perfil, avisos,
// advertências) vivem em páginas próprias agora. Essa página cuida só
// do overview: KPIs + 2 panels + progress bars + onboarding wizard.

import { shell } from '/assets/js/ui/shell.js';
import { getMeuPerfil, completarOnboarding } from '/assets/js/supabase/membros.js';
import { getAulasComEntregas } from '/assets/js/supabase/aulas.js';
import { getMinhasPresencas, calcularAlertaFrequencia } from '/assets/js/supabase/presenca.js';
import { skeletonTableRows, skeletonText } from '/assets/js/ui/skeleton.js';
import { toast } from '/assets/js/ui/toast.js';

const { session } = await shell.mount({ activeRoute: '/membros/dashboard', pageTitle: 'Visão Geral' });

const $ = (id) => document.getElementById(id);

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
}

function ligaCor(perfil) {
  const nome = perfil?.ligas?.nome?.toLowerCase() || '';
  if (nome.includes('ibbot')) return 'r';
  if (nome.includes('ibtech')) return 'b';
  return 'w';
}

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
  const aulasPassadas = aulas.filter(a => new Date(a.prazo_entrega) < now);
  const pctAulas = aulas.length > 0 ? Math.round((aulasPassadas.length / aulas.length) * 100) : 0;
  const proxima = aulas.find(a => new Date(a.prazo_entrega) >= now);

  // Métricas
  $('metric-presenca-val').textContent = `${pctPresenca}%`;
  $('metric-presenca-val').className = `metric-val ${pctPresenca >= 75 ? 'g' : 'a'}`;
  $('metric-presenca-sub').textContent = `${presentes} de ${totalEncontros} encontros`;

  $('metric-entregas-val').textContent = `${entregues} / ${totalEntregas}`;
  $('metric-entregas-val').className = `metric-val ${pendentes === 0 ? 'g' : 'b'}`;
  $('metric-entregas-sub').textContent = pendentes > 0 ? `${pendentes} pendente${pendentes > 1 ? 's' : ''}` : 'Tudo em dia';

  if (proxima) {
    const dia = new Date(proxima.prazo_entrega).toLocaleDateString('pt-BR', { weekday: 'long' });
    $('metric-proximo-val').textContent = dia.charAt(0).toUpperCase() + dia.slice(1);
    $('metric-proximo-sub').textContent = `${fmtDate(proxima.prazo_entrega)} · Aula ${String(proxima.numero).padStart(2, '0')}`;
  } else {
    $('metric-proximo-val').textContent = '—';
    $('metric-proximo-sub').textContent = 'Nenhuma agendada';
  }

  const month = now.getMonth() + 1;
  $('metric-semestre-val').textContent = `${now.getFullYear()}.${month <= 6 ? 1 : 2}`;

  // Próximas aulas
  const proximas = aulas.filter(a => new Date(a.prazo_entrega) >= now).slice(0, 3);
  $('tbody-proximas-aulas').innerHTML = proximas.length
    ? proximas.map((a, i) => `<tr>
        <td>Aula ${String(a.numero).padStart(2, '0')} — ${a.titulo}</td>
        <td style="color:var(--mid)">${fmtDate(a.prazo_entrega)}</td>
        <td><span class="pill ${i === 0 ? 'next' : 'planned'}">${i === 0 ? 'Próxima' : 'Planejada'}</span></td>
      </tr>`).join('')
    : '<tr><td colspan="3" style="color:var(--muted);text-align:center">Nenhuma aula próxima</td></tr>';

  const entregasRecentes = aulasComPrazo.slice(-3);
  $('tbody-dash-entregas').innerHTML = entregasRecentes.length
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

  $('pct-presenca').textContent = `${pctPresenca}%`;
  $('bar-presenca').style.width = `${pctPresenca}%`;
  $('pct-entregas').textContent = `${pctEntregas}%`;
  $('bar-entregas').style.width = `${pctEntregas}%`;
  $('pct-aulas').textContent = `${pctAulas}%`;
  $('bar-aulas').style.width = `${pctAulas}%`;

  // Topbar liga badge
  const ligaNome = perfil?.ligas?.nome || '';
  const cor = ligaCor(perfil);
  const badge = $('topbar-liga');
  if (badge) { badge.textContent = ligaNome; badge.className = `topbar-liga ${cor}`; }
}

function renderSkeletons() {
  ['metric-presenca-val','metric-entregas-val','metric-proximo-val','metric-semestre-val'].forEach(id => {
    const el = $(id);
    if (el) el.innerHTML = skeletonText('skeleton--title');
  });
  $('tbody-proximas-aulas').innerHTML = skeletonTableRows(3, 3);
  $('tbody-dash-entregas').innerHTML = skeletonTableRows(3, 3);
}

// ── Onboarding wizard ──
let currentStep = 0;
let onboardingNome = '';
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
  $('ob-content').innerHTML = `
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
    const nome = $('ob-nome')?.value?.trim();
    if (!nome) { const err = $('ob-error'); if (err) { err.textContent = 'Digite seu nome completo.'; err.style.display = 'block'; } return; }
    onboardingNome = nome;
  }
  if (currentStep === onboardingSteps.length - 1) { salvarOnboarding(); return; }
  currentStep++;
  renderStep(currentStep);
}

async function salvarOnboarding() {
  if (!onboardingNome) return;
  try {
    await completarOnboarding({
      nome: onboardingNome,
      linkedin: $('ob-linkedin')?.value?.trim() || null,
      github: $('ob-github')?.value?.trim() || null,
    });
    $('onboarding').style.display = 'none';
    inicializar();
  } catch (e) {
    toast.error('Erro ao salvar. Tente novamente.');
  }
}

async function skipOnboarding() {
  try {
    await completarOnboarding({ nome: session.user.email.split('@')[0] });
    $('onboarding').style.display = 'none';
    inicializar();
  } catch (e) {
    $('onboarding').style.display = 'none';
  }
}

window.nextStep = nextStep;
window.skipOnboarding = skipOnboarding;
window.finishOnboarding = salvarOnboarding;

// ── Inicialização ──
async function inicializar() {
  try {
    const perfil = await getMeuPerfil();
    if (!perfil || !perfil.onboarding_completo) {
      $('onboarding').style.display = '';
      currentStep = 0;
      renderStep(0);
      return;
    }
    renderSkeletons();
    const [presencas, aulas] = await Promise.all([
      getMinhasPresencas(),
      getAulasComEntregas(),
    ]);
    renderizarDashboard(perfil, presencas, aulas);
  } catch (e) {
    console.error('Erro ao carregar dashboard:', e);
  }
}

inicializar();
