// ── Countdown timer ──

/**
 * Inicia countdown até a data-alvo, atualizando elementos por ID.
 * @param {string|Date} deadline — data-alvo (ISO string ou Date)
 * @param {Object} ids — { dias, horas, min, seg } mapeando para IDs dos elementos
 */
export function startCountdown(deadline, ids = { dias: 'cd-dias', horas: 'cd-horas', min: 'cd-min', seg: 'cd-seg' }) {
  const target = new Date(deadline);

  function update() {
    const now = new Date();
    const diff = target - now;

    if (diff <= 0) {
      Object.values(ids).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '00';
      });
      return;
    }

    const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs  = Math.floor((diff % (1000 * 60)) / 1000);

    const el = (id) => document.getElementById(id);
    if (el(ids.dias))  el(ids.dias).textContent  = String(days).padStart(2, '0');
    if (el(ids.horas)) el(ids.horas).textContent = String(hours).padStart(2, '0');
    if (el(ids.min))   el(ids.min).textContent   = String(mins).padStart(2, '0');
    if (el(ids.seg))   el(ids.seg).textContent   = String(secs).padStart(2, '0');
  }

  update();
  setInterval(update, 1000);
}
