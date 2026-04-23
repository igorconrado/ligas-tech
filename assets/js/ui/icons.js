// ── Icon set da sidebar + chrome ──
// 20×20 viewBox, stroke-width 1.5, linecap/linejoin round, currentColor.
// Estilo Feather/Lucide-like — linha fina, silhuetas geométricas.
// Usado por assets/js/ui/shell.js (sidebar + topbar).

const A = 'viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';

export const icons = {
  // Navegação (seções da sidebar)
  overview:     `<svg ${A}><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="11" y="3" width="6" height="6" rx="1"/><rect x="3" y="11" width="6" height="6" rx="1"/><rect x="11" y="11" width="6" height="6" rx="1"/></svg>`,
  calendar:     `<svg ${A}><rect x="3" y="4" width="14" height="13" rx="1.5"/><path d="M3 8h14"/><path d="M7 2v4M13 2v4"/></svg>`,
  attendance:   `<svg ${A}><path d="M4 5h10"/><path d="M4 10h10"/><path d="M4 15h6"/><path d="M14 14l2 2 3-4"/></svg>`,
  classes:      `<svg ${A}><path d="M3 4h6a2 2 0 0 1 2 2v11"/><path d="M17 4h-6a2 2 0 0 0-2 2v11"/><path d="M3 4v12h6"/><path d="M17 4v12h-6"/></svg>`,
  deliveries:   `<svg ${A}><path d="M3 9l2-5h10l2 5"/><path d="M3 9v8h14V9"/><path d="M3 9h5l1 2h2l1-2h5"/></svg>`,
  notices:      `<svg ${A}><path d="M16 5L6 8v4l10 3z"/><path d="M6 8H4v4h2"/><path d="M8 12v3a1.5 1.5 0 0 0 3 0v-2"/></svg>`,
  warnings:     `<svg ${A}><path d="M10 3L2 17h16z"/><path d="M10 8v4"/><circle cx="10" cy="14.5" r=".5" fill="currentColor"/></svg>`,
  profile:      `<svg ${A}><circle cx="10" cy="7" r="3"/><path d="M4 17c0-3 3-5 6-5s6 2 6 5"/></svg>`,
  members:      `<svg ${A}><circle cx="7" cy="7" r="3"/><path d="M2 16c0-3 2-5 5-5s5 2 5 5"/><circle cx="14" cy="8" r="2.5"/><path d="M13 16c0-2 1-3 3-3s3 1 3 3"/></svg>`,

  // Chrome (toggle, drawer, logout)
  chevronLeft:  `<svg ${A}><path d="M12 5l-5 5 5 5"/></svg>`,
  chevronRight: `<svg ${A}><path d="M8 5l5 5-5 5"/></svg>`,
  menu:         `<svg ${A}><path d="M3 6h14M3 10h14M3 14h14"/></svg>`,
  close:        `<svg ${A}><path d="M5 5l10 10M15 5L5 15"/></svg>`,
  logout:       `<svg ${A}><path d="M11 3H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h6"/><path d="M15 7l3 3-3 3"/><path d="M9 10h9"/></svg>`,
};
