// ── Login page ──

function handleLogin() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const btn = document.getElementById('login-btn');
  const error = document.getElementById('form-error');

  // Reset
  error.classList.remove('show');
  document.getElementById('email').classList.remove('error');
  document.getElementById('password').classList.remove('error');

  // Validação de email institucional
  if (!email) {
    document.getElementById('email').classList.add('error');
    error.textContent = 'Preencha seu email institucional.';
    error.classList.add('show'); return;
  }
  if (!email.endsWith('@ibmec.edu.br')) {
    document.getElementById('email').classList.add('error');
    error.textContent = 'Use seu email @ibmec.edu.br para acessar.';
    error.classList.add('show'); return;
  }
  if (!password) {
    document.getElementById('password').classList.add('error');
    error.textContent = 'Preencha sua senha.';
    error.classList.add('show'); return;
  }

  // Loading
  btn.disabled = true;
  btn.textContent = 'Entrando...';

  // Simula autenticação — substituir pela chamada Supabase
  setTimeout(() => {
    // Aqui o Supabase vai verificar se é primeiro acesso (onboarding) ou não
    window.location.href = '/membros/dashboard';
  }, 1000);
}

// Enter key
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleLogin();
});

// Expõe pro onclick inline
window.handleLogin = handleLogin;
