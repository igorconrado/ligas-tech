// ── Processo Seletivo Aberto page ──
import { startCountdown } from '/assets/js/components/countdown.js';

// Countdown — atualizar a data conforme processo seletivo
startCountdown('2026-08-31T23:59:59');

// Formulário
function submitInscricao() {
  const campos = [
    { id: 'f-nome', label: 'nome' },
    { id: 'f-email', label: 'email' },
    { id: 'f-semestre', label: 'semestre' },
    { id: 'f-liga', label: 'liga' },
    { id: 'f-motivo', label: 'motivo' },
  ];
  const error = document.getElementById('f-error');
  error.style.display = 'none';
  document.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(el => el.classList.remove('error'));

  let valid = true;
  for (const c of campos) {
    const el = document.getElementById(c.id);
    if (!el.value.trim()) { el.classList.add('error'); valid = false; }
  }
  const email = document.getElementById('f-email').value.trim();
  if (email && !email.endsWith('@ibmec.edu.br')) {
    document.getElementById('f-email').classList.add('error');
    error.textContent = 'Use seu email institucional @ibmec.edu.br.';
    error.style.display = 'block';
    return;
  }
  if (!valid) {
    error.textContent = 'Preencha todos os campos obrigatórios.';
    error.style.display = 'block';
    return;
  }

  const btn = document.getElementById('f-submit');
  btn.disabled = true;
  btn.textContent = 'Enviando...';

  // Substituir por chamada Supabase
  setTimeout(() => {
    document.getElementById('f-success').style.display = 'block';
    btn.style.display = 'none';
    document.querySelector('.form-note').style.display = 'none';
    document.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(el => { el.disabled = true; el.style.opacity = '.5'; });
  }, 1000);
}

// Expõe pro onclick inline
window.submitInscricao = submitInscricao;
