// ── Processo Seletivo page ──

function toggleFaq(el) {
  const item = el.parentElement;
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

function submitForm() {
  const inputs = document.querySelectorAll('#interest-form .form-input, #interest-form .form-select');
  let valid = true;
  inputs.forEach(input => {
    if (!input.value.trim()) { input.style.borderColor = 'rgba(255,31,31,.4)'; valid = false; }
    else input.style.borderColor = '';
  });
  if (!valid) return;
  document.getElementById('form-success').style.display = 'block';
  document.querySelector('.form-submit').style.opacity = '.4';
  document.querySelector('.form-submit').disabled = true;
}

// Expõe pro onclick inline
window.toggleFaq = toggleFaq;
window.submitForm = submitForm;
