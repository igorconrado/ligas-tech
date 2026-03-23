// ── Global utilities ──

/** Formata data no padrão pt-BR curto: "seg., 20 de mar." */
export function formatDate(date = new Date()) {
  return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Debounce — atrasa execução até parar de chamar */
export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/** Mostra elemento (remove display:none) */
export function show(el) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (el) el.style.display = '';
}

/** Esconde elemento */
export function hide(el) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (el) el.style.display = 'none';
}
