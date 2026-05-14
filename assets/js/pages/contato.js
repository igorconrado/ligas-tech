import { supabase } from '/assets/js/supabase/client.js';
import { toast } from '/assets/js/ui/toast.js';

const form = document.getElementById('contato-form');
const btn  = document.getElementById('contato-btn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome     = document.getElementById('c-nome').value.trim();
  const email    = document.getElementById('c-email').value.trim();
  const empresa  = document.getElementById('c-empresa').value.trim();
  const tipo     = document.getElementById('c-tipo').value;
  const mensagem = document.getElementById('c-mensagem').value.trim();

  // Validação
  let valid = true;
  [
    ['c-nome',     nome],
    ['c-email',    email],
    ['c-tipo',     tipo],
    ['c-mensagem', mensagem],
  ].forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (!val) { el.classList.add('error'); valid = false; }
    else       el.classList.remove('error');
  });

  if (!valid) { toast.error('Preencha todos os campos obrigatórios.'); return; }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    document.getElementById('c-email').classList.add('error');
    toast.error('Email inválido.');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Enviando…';

  const { error } = await supabase
    .from('contatos')
    .insert({ nome, email, empresa: empresa || null, tipo, mensagem });

  if (error) {
    toast.error('Erro ao enviar. Tente novamente.');
    btn.disabled = false;
    btn.textContent = 'Enviar mensagem →';
    return;
  }

  toast.success('Mensagem enviada! Retornaremos em breve.');
  form.reset();
  btn.textContent = 'Enviar mensagem →';
  btn.disabled = false;
});

// Remove erro ao digitar
form.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(el => {
  el.addEventListener('input', () => el.classList.remove('error'));
});
