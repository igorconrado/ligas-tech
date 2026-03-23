// ── Animated counters ──

/**
 * Anima contadores numéricos.
 * @param {Object} targets — { id: valorFinal } ex: { n1: 26, n2: 2 }
 * @param {number} duration — duração em ms (default 1400)
 * @param {number} delay — atraso inicial em ms (default 400)
 */
export function animateCounters(targets, duration = 1400, delay = 400) {
  const start = Date.now();

  function tick() {
    const elapsed = Date.now() - start;
    const p = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3); // cubic ease-out

    for (const [id, target] of Object.entries(targets)) {
      const el = document.getElementById(id);
      if (el) el.textContent = Math.round(ease * target);
    }

    if (p < 1) requestAnimationFrame(tick);
  }

  setTimeout(tick, delay);
}
