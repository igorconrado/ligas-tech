// ── Skeleton helpers ──
// Geração de placeholders animados pra áreas em loading.
// CSS em assets/css/ui/skeleton.css.

export function skeletonRows(n = 3) {
  return Array.from({ length: n }, () => `<div class="skeleton skeleton--row"></div>`).join('');
}

export function skeletonCards(n = 3) {
  return Array.from({ length: n }, () => `<div class="skeleton skeleton--card"></div>`).join('');
}

export function skeletonText(cls = 'skeleton--text') {
  return `<div class="skeleton ${cls}"></div>`;
}

export function skeletonTableRows(n = 5, colspan = 1) {
  return Array.from({ length: n }, () =>
    `<tr><td colspan="${colspan}" style="padding:4px 0;border:0"><div class="skeleton skeleton--row"></div></td></tr>`
  ).join('');
}
