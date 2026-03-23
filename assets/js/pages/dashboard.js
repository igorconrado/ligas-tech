// ── Dashboard Membro page ──
import { formatDate } from '/assets/js/global.js';

// Data atual
document.getElementById('topbar-date').textContent = formatDate();

// Tabs
function showTab(name, el) {
  document.querySelectorAll('.tab-page').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(i => {
    i.classList.remove('active', 'r', 'b');
  });
  if (el) {
    el.classList.add('active', 'b');
  }
  const titles = { dashboard: 'Dashboard', aulas: 'Aulas', entregas: 'Entregas', presenca: 'Presença', cronograma: 'Cronograma', perfil: 'Perfil' };
  document.getElementById('topbar-title').textContent = titles[name] || name;
}

// Entrega
function submitEntrega() {
  const input = document.getElementById('repo-input');
  const fb = document.getElementById('entrega-feedback');
  const url = input.value.trim();
  if (!url || !url.includes('github.com')) {
    fb.style.display = 'block';
    fb.style.color = 'rgba(255,120,120,.8)';
    fb.textContent = 'Link inválido. Use um repositório público do GitHub.';
    return;
  }
  fb.style.display = 'block';
  fb.style.color = '#4ade80';
  fb.textContent = '✓ Entrega registrada. A diretoria foi notificada.';
  input.disabled = true;
  document.querySelector('.entrega-submit').disabled = true;
  document.querySelector('.entrega-submit').style.opacity = '.4';
}

// Salvar perfil
function savePerfil() {
  const nome = document.getElementById('p-nome').value;
  document.getElementById('perfil-name-display').textContent = nome;
  document.getElementById('sidebar-name').textContent = nome;
  document.getElementById('perfil-av-text').textContent = nome[0];
  document.getElementById('sidebar-av').textContent = nome[0];
}

// Foto
function handleFoto(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const src = e.target.result;
    document.querySelector('.perfil-av').innerHTML = `<img src="${src}" alt="foto">`;
    document.getElementById('sidebar-av').innerHTML = `<img src="${src}" alt="foto" style="width:100%;height:100%;object-fit:cover;border-radius:3px">`;
  };
  reader.readAsDataURL(file);
}

// ── ONBOARDING ──
const steps = [
  {
    kicker: 'Passo 1 de 3',
    title: 'BEM-VINDO.',
    sub: 'Esse é o portal das ligas. Aqui você acompanha suas aulas, entregas e presença. Vamos configurar seu perfil em 3 passos rápidos.',
    content: '',
    next: 'Começar →'
  },
  {
    kicker: 'Passo 2 de 3',
    title: 'SEU NOME.',
    sub: 'Como você quer que apareça no portal?',
    content: 'nome',
    next: 'Continuar →'
  },
  {
    kicker: 'Passo 3 de 3',
    title: 'SEUS LINKS.',
    sub: 'LinkedIn e GitHub são opcionais, mas aparecem pro time.',
    content: 'links',
    next: 'Entrar no portal →'
  }
];

let currentStep = 0;

function renderStep(i) {
  const s = steps[i];
  const stepEls = document.querySelectorAll('.ob-step');
  stepEls.forEach((el, idx) => {
    el.classList.remove('done', 'active');
    if (idx < i) el.classList.add('done');
    if (idx === i) el.classList.add('active');
  });

  let contentHtml = '';
  if (s.content === 'nome') {
    contentHtml = `<input class="ob-input" id="ob-nome" placeholder="Seu nome completo">`;
  } else if (s.content === 'links') {
    contentHtml = `
      <input class="ob-input" id="ob-linkedin" placeholder="linkedin.com/in/usuario (opcional)" type="url">
      <input class="ob-input" id="ob-github" placeholder="github.com/usuario (opcional)" type="url">`;
  }

  document.getElementById('ob-content').innerHTML = `
    <div class="ob-slide">
      <div class="ob-kicker">${s.kicker}</div>
      <div class="ob-title">${s.title}</div>
      <div class="ob-sub">${s.sub}</div>
      ${contentHtml ? `<div class="ob-content">${contentHtml}</div>` : ''}
      <div class="ob-actions">
        <button class="ob-skip" onclick="finishOnboarding()">Pular</button>
        <button class="ob-next" onclick="nextStep()">${s.next}</button>
      </div>
    </div>`;
}

function nextStep() {
  if (currentStep === steps.length - 1) { finishOnboarding(); return; }
  currentStep++;
  renderStep(currentStep);
}

function finishOnboarding() {
  const nome = document.getElementById('ob-nome')?.value || 'Membro';
  document.getElementById('sidebar-name').textContent = nome;
  document.getElementById('perfil-name-display').textContent = nome;
  document.getElementById('sidebar-av').textContent = nome[0];
  document.getElementById('perfil-av-text').textContent = nome[0];
  document.getElementById('p-nome').value = nome;
  document.getElementById('onboarding').style.display = 'none';
}

// Checa se é primeiro acesso — substituir por lógica Supabase
const isFirstAccess = true;
if (isFirstAccess) renderStep(0);
else document.getElementById('onboarding').style.display = 'none';

// Expõe pro onclick inline
window.showTab = showTab;
window.submitEntrega = submitEntrega;
window.savePerfil = savePerfil;
window.handleFoto = handleFoto;
window.nextStep = nextStep;
window.finishOnboarding = finishOnboarding;
