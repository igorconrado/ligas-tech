// ── Empty state helper ──
// API: renderEmptyState(container, { icon, title, description, cta })
//
// Se container é <table> ou <tbody>, o helper renderiza uma linha
// <tr><td colspan="N"> com o empty state dentro, pra não quebrar
// a estrutura da tabela.

const SVG_ATTR = 'viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';

export const icons = {
  inbox:     `<svg ${SVG_ATTR}><path d="M10 28l8-14h28l8 14"/><path d="M10 28v18a4 4 0 0 0 4 4h36a4 4 0 0 0 4-4V28"/><path d="M10 28h14l4 6h8l4-6h14"/></svg>`,
  users:     `<svg ${SVG_ATTR}><circle cx="32" cy="22" r="8"/><path d="M16 52c0-8 7-14 16-14s16 6 16 14"/></svg>`,
  check:     `<svg ${SVG_ATTR}><circle cx="32" cy="32" r="22"/><path d="M22 32l8 8 14-16"/></svg>`,
  calendar:  `<svg ${SVG_ATTR}><rect x="10" y="14" width="44" height="40" rx="2"/><path d="M10 26h44"/><path d="M22 10v8M42 10v8"/></svg>`,
  book:      `<svg ${SVG_ATTR}><path d="M10 14c0-2 2-4 4-4h18c4 0 6 2 6 4v36c0-2-2-4-6-4H14c-2 0-4 2-4 4z"/><path d="M54 14c0-2-2-4-4-4H32c-4 0-6 2-6 4v36c0-2 2-4 6-4h18c2 0 4 2 4 4z"/></svg>`,
  clock:     `<svg ${SVG_ATTR}><circle cx="32" cy="32" r="22"/><path d="M32 20v14l8 4"/></svg>`,
  megaphone: `<svg ${SVG_ATTR}><path d="M48 14L20 26v12l28 12z"/><path d="M20 26H12v12h8"/><path d="M26 38v8a4 4 0 0 0 8 0v-4"/></svg>`,
};

function escape(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHTML({ icon, title, description, cta }) {
  const ctaHtml = cta && cta.label
    ? `<button class="empty-state__cta" type="button">${escape(cta.label)}</button>`
    : '';
  return `
    <div class="empty-state">
      <div class="empty-state__icon" aria-hidden="true">${icon || ''}</div>
      <h3 class="empty-state__title">${escape(title)}</h3>
      <p class="empty-state__description">${escape(description)}</p>
      ${ctaHtml}
    </div>
  `;
}

export function renderEmptyState(container, opts = {}) {
  if (!container) return;
  const html = buildHTML(opts);
  const tag = container.tagName?.toLowerCase();

  if (tag === 'table' || tag === 'tbody') {
    const table = tag === 'table' ? container : container.closest('table');
    const headRow = table?.querySelector('thead tr');
    const colspan = headRow ? headRow.children.length : 1;
    const bodyHost = tag === 'table'
      ? (container.querySelector('tbody') || container)
      : container;
    // se o host ainda é a table (sem tbody), substitui innerHTML da table mesmo
    if (bodyHost === container && tag === 'table') {
      container.innerHTML = `<tr><td colspan="${colspan}" style="padding:0">${html}</td></tr>`;
    } else {
      bodyHost.innerHTML = `<tr><td colspan="${colspan}" style="padding:0">${html}</td></tr>`;
    }
  } else {
    container.innerHTML = html;
  }

  if (opts.cta && typeof opts.cta.onClick === 'function') {
    const btn = container.querySelector('.empty-state__cta');
    if (btn) btn.addEventListener('click', opts.cta.onClick);
  }
}
