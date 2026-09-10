// ── Modal component ──
// Mantém semântica, foco e navegação por teclado consistentes.

const previousFocus = new Map();
let keyboardInitialized = false;

function prepareModal(modal) {
  const box = modal?.querySelector('.modal-box');
  if (!modal || !box) return;

  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('tabindex', '-1');

  const title = box.querySelector('.modal-title');
  if (title) {
    if (!title.id) title.id = `${modal.id}-title`;
    box.setAttribute('aria-labelledby', title.id);
  }
}

function focusableElements(modal) {
  return [...modal.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )].filter(el => !el.hidden && el.offsetParent !== null);
}

export function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  prepareModal(modal);
  previousFocus.set(id, document.activeElement);
  modal.classList.add('open');
  document.body.classList.add('modal-open');
  const target = focusableElements(modal)[0] || modal.querySelector('.modal-box');
  requestAnimationFrame(() => target?.focus());
}

export function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('open');
  if (!document.querySelector('.modal-overlay.open')) document.body.classList.remove('modal-open');
  const returnTarget = previousFocus.get(id);
  previousFocus.delete(id);
  requestAnimationFrame(() => returnTarget?.focus?.());
}

/** Fecha com Escape e mantém o foco dentro do modal aberto. */
export function initModalEscape() {
  if (keyboardInitialized) return;
  keyboardInitialized = true;
  document.querySelectorAll('.modal-overlay').forEach(prepareModal);

  document.addEventListener('keydown', e => {
    const modal = document.querySelector('.modal-overlay.open');
    if (!modal) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal(modal.id);
      return;
    }

    if (e.key !== 'Tab') return;
    const items = focusableElements(modal);
    if (!items.length) {
      e.preventDefault();
      modal.querySelector('.modal-box')?.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}
