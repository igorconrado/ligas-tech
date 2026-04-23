// ── Confirm dialog ──
// API: confirmDialog({ title, message, confirmLabel, cancelLabel, danger }) → Promise<boolean>
//
// ESC cancela. Click no backdrop cancela. Focus trap dentro do modal.
// Reutilizável: só um diálogo visível por vez.

const DIALOG_ID = 'ligas-confirm-dialog';

function escape(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function confirmDialog({
  title = 'Confirmar ação',
  message = '',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
} = {}) {
  return new Promise((resolve) => {
    // Se já existe um diálogo, remove
    document.getElementById(DIALOG_ID)?.remove();

    const overlay = document.createElement('div');
    overlay.id = DIALOG_ID;
    overlay.className = 'confirm-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'confirm-title');
    overlay.innerHTML = `
      <div class="confirm-box" role="document">
        <h3 class="confirm-title" id="confirm-title">${escape(title)}</h3>
        <p class="confirm-message">${escape(message)}</p>
        <div class="confirm-actions">
          <button type="button" class="confirm-btn confirm-btn--cancel">${escape(cancelLabel)}</button>
          <button type="button" class="confirm-btn confirm-btn--confirm${danger ? ' is-danger' : ''}">${escape(confirmLabel)}</button>
        </div>
      </div>
    `;

    const prevFocus = document.activeElement;
    let resolved = false;
    const cleanup = (result) => {
      if (resolved) return;
      resolved = true;
      overlay.classList.remove('is-open');
      overlay.classList.add('is-leaving');
      document.removeEventListener('keydown', onKey);
      setTimeout(() => {
        overlay.remove();
        if (prevFocus?.focus) prevFocus.focus();
      }, 160);
      resolve(result);
    };

    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); cleanup(false); return; }
      if (e.key === 'Tab') {
        const focusable = overlay.querySelectorAll('button');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup(false);
    });
    overlay.querySelector('.confirm-btn--cancel').addEventListener('click', () => cleanup(false));
    overlay.querySelector('.confirm-btn--confirm').addEventListener('click', () => cleanup(true));
    document.addEventListener('keydown', onKey);

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('is-open'));
    overlay.querySelector('.confirm-btn--confirm').focus();
  });
}
