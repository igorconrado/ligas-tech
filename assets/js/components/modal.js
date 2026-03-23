// ── Modal component ──
// Usa o padrão .modal-overlay.open do components.css

export function openModal(id) {
  document.getElementById(id).classList.add('open');
}

export function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

/** Fecha todos os modais .modal-overlay.open ao pressionar Escape */
export function initModalEscape() {
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    }
  });
}
