// ── Shell: sidebar + topbar wrapper ──
// Uso nas páginas de membros:
//   const { session, usuario, isDiretoria } = await shell.mount({
//     activeRoute: '/membros/aulas',
//     pageTitle: 'Aulas',
//   });
//
// Shell faz:
//   1. Auth + role guard via initPage
//   2. Injeta sidebar + topbar antes do <main id="main-content">
//   3. Destaca item ativo baseado em activeRoute
//   4. Toggle collapse com persistência em localStorage
//   5. Logout wired ao botão do footer
//   6. Hamburger + backdrop drawer em mobile

import { initPage } from '/assets/js/features/page-init.js';
import { fazerLogout } from '/assets/js/supabase/auth.js';
import { getMeuPerfil } from '/assets/js/supabase/membros.js';
import { icons } from '/assets/js/ui/icons.js';

const SIDEBAR_STATE_KEY = 'sidebar-state';

const NAV_MEMBRO = [
  { group: 'PRINCIPAL', items: [
    { label: 'Visão Geral', href: '/membros/dashboard',    icon: 'overview' },
    { label: 'Cronograma',  href: '/membros/cronograma',   icon: 'calendar' },
  ]},
  { group: 'OPERAÇÃO', items: [
    { label: 'Encontros',   href: '/membros/encontros',    icon: 'attendance' },
    { label: 'Avisos',      href: '/membros/avisos',       icon: 'notices' },
  ]},
  { group: 'CAPACITAÇÃO', items: [
    { label: 'Aulas',       href: '/membros/aulas',        icon: 'classes' },
    { label: 'Entregas',    href: '/membros/entregas',     icon: 'deliveries' },
  ]},
  { group: 'CONTA', items: [
    { label: 'Advertências', href: '/membros/advertencias', icon: 'warnings' },
  ]},
];

const NAV_DIRETORIA = [
  { group: 'PRINCIPAL', items: [
    { label: 'Visão Geral', href: '/membros/dashboard-diretoria', icon: 'overview' },
  ]},
  { group: 'OPERAÇÃO', items: [
    { label: 'Encontros',   href: '/membros/diretoria/encontros', icon: 'attendance' },
    { label: 'Avisos',      href: '/membros/diretoria/avisos',    icon: 'notices' },
  ]},
  { group: 'CAPACITAÇÃO', items: [
    { label: 'Aulas',       href: '/membros/diretoria/aulas',     icon: 'classes' },
    { label: 'Entregas',    href: '/membros/diretoria/entregas',  icon: 'deliveries' },
  ]},
  { group: 'GESTÃO', items: [
    { label: 'Membros',      href: '/membros/diretoria/membros',      icon: 'members' },
    { label: 'Advertências', href: '/membros/diretoria/advertencias', icon: 'warnings' },
  ]},
];

function escape(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function readInitialSidebarState() {
  try {
    return localStorage.getItem(SIDEBAR_STATE_KEY) === 'collapsed' ? 'collapsed' : 'expanded';
  } catch (e) {
    return 'expanded';
  }
}

function buildSidebar(nav, activeRoute, homeHref, initialState) {
  const groupsHtml = nav.map(g => `
    <section class="sidebar__group">
      <h4 class="sidebar__group-label">${escape(g.group)}</h4>
      <ul>
        ${g.items.map(it => `
          <li>
            <a href="${escape(it.href)}" class="sidebar__item"
               data-active="${activeRoute === it.href ? 'true' : 'false'}"
               title="${escape(it.label)}">
              <span class="sidebar__icon">${icons[it.icon] || ''}</span>
              <span class="sidebar__label">${escape(it.label)}</span>
            </a>
          </li>
        `).join('')}
      </ul>
    </section>
  `).join('');

  const isExpanded = initialState === 'expanded';
  const toggleIcon = isExpanded ? icons.chevronLeft : icons.chevronRight;
  const toggleLabel = isExpanded ? 'Recolher menu' : 'Expandir menu';

  return `
    <aside class="sidebar" data-state="${initialState}" aria-label="Navegação principal">
      <div class="sidebar__brand">
        <a href="${escape(homeHref)}" class="sidebar__logo">IB&amp;</a>
        <button class="sidebar__toggle" type="button" aria-label="${toggleLabel}" aria-expanded="${isExpanded}">${toggleIcon}</button>
      </div>
      <nav class="sidebar__nav">${groupsHtml}</nav>
      <div class="sidebar__footer">
        <button class="sidebar__logout" type="button">
          <span class="sidebar__icon">${icons.logout}</span>
          <span class="sidebar__label">Sair</span>
        </button>
      </div>
    </aside>
  `;
}

function buildTopbar({ pageTitle, initial, userName, userEmail, perfilHref }) {
  return `
    <header class="topbar">
      <button class="topbar__hamburger" type="button" aria-label="Abrir menu" aria-expanded="false">${icons.menu}</button>
      <h1 class="topbar__title">${escape(pageTitle)}</h1>
      <div class="topbar__user">
        <button class="topbar__avatar" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="topbar-dropdown">${escape(initial)}</button>
        <div class="topbar__dropdown" id="topbar-dropdown" role="menu" aria-hidden="true">
          <div class="topbar__dropdown-header">
            <p class="topbar__dropdown-name">${escape(userName)}</p>
            <p class="topbar__dropdown-email">${escape(userEmail)}</p>
          </div>
          <a href="${escape(perfilHref)}" class="topbar__dropdown-item" role="menuitem">
            <span class="sidebar__icon">${icons.profile}</span>
            <span>Meu perfil</span>
          </a>
          <button type="button" class="topbar__dropdown-item topbar__dropdown-logout" role="menuitem">
            <span class="sidebar__icon">${icons.logout}</span>
            <span>Sair</span>
          </button>
        </div>
      </div>
    </header>
  `;
}

async function mount({ activeRoute, pageTitle } = {}) {
  const isDiretoriaRoute = activeRoute?.startsWith('/membros/diretoria') || activeRoute === '/membros/dashboard-diretoria';
  const requireRole = isDiretoriaRoute ? 'diretoria' : 'membro';

  const ctx = await initPage({ requireRole });
  const { session, usuario, isDiretoria } = ctx;

  const nav = isDiretoria ? NAV_DIRETORIA : NAV_MEMBRO;
  const homeHref = isDiretoria ? '/membros/dashboard-diretoria' : '/membros/dashboard';
  const perfilHref = isDiretoria ? '/membros/diretoria/perfil' : '/membros/perfil';
  const userEmail = session?.user?.email || '';

  // Nome: prefere membros.nome (perfil); fallback pra parte local do email
  let userName = '';
  try {
    const perfil = await getMeuPerfil();
    userName = perfil?.nome?.trim() || '';
  } catch (_) { /* silencia: usa fallback abaixo */ }
  if (!userName) userName = userEmail.split('@')[0] || 'Usuário';

  // Inicial: primeira letra (com acentos). Se só tem dígitos, cai em 'U'.
  const firstLetter = userName.match(/[\p{L}]/u)?.[0];
  const initial = (firstLetter || 'U').toUpperCase();

  const existingMain = document.getElementById('main-content');
  if (!existingMain) {
    console.error('[shell] #main-content não encontrado — shell não montado');
    return ctx;
  }

  const skipLink = document.querySelector('.skip-link');
  const parent = existingMain.parentElement;
  existingMain.remove();

  const initialState = readInitialSidebarState();
  const ligaNome = usuario?.ligas?.nome;
  const accentClass = ligaNome === 'IbBot' ? 'shell--bot'
    : ligaNome === 'IbTech' ? 'shell--tech'
    : '';

  const shellWrap = document.createElement('div');
  shellWrap.className = 'shell'
    + (accentClass ? ' ' + accentClass : '')
    + (initialState === 'collapsed' ? ' shell--collapsed' : '');
  shellWrap.innerHTML = `
    ${buildSidebar(nav, activeRoute, homeHref, initialState)}
    <div class="shell__backdrop"></div>
    <div class="shell__main">
      ${buildTopbar({ pageTitle, initial, userName, userEmail, perfilHref })}
    </div>
  `;
  shellWrap.querySelector('.shell__main').appendChild(existingMain);

  if (skipLink) skipLink.after(shellWrap);
  else parent.prepend(shellWrap);

  // Toggle collapse
  const toggle = shellWrap.querySelector('.sidebar__toggle');
  toggle?.addEventListener('click', () => {
    const sidebar = shellWrap.querySelector('.sidebar');
    const next = sidebar.dataset.state === 'collapsed' ? 'expanded' : 'collapsed';
    sidebar.dataset.state = next;
    shellWrap.classList.toggle('shell--collapsed', next === 'collapsed');
    toggle.setAttribute('aria-expanded', next === 'expanded' ? 'true' : 'false');
    toggle.setAttribute('aria-label', next === 'expanded' ? 'Recolher menu' : 'Expandir menu');
    toggle.innerHTML = next === 'expanded' ? icons.chevronLeft : icons.chevronRight;
    try { localStorage.setItem(SIDEBAR_STATE_KEY, next); } catch (e) {}
  });

  // Logout
  shellWrap.querySelector('.sidebar__logout')?.addEventListener('click', fazerLogout);

  // Drawer mobile
  setupDrawer(shellWrap);

  // Avatar dropdown
  setupAvatarDropdown(shellWrap);

  return ctx;
}

function setupAvatarDropdown(shellWrap) {
  const avatar = shellWrap.querySelector('.topbar__avatar');
  const dropdown = shellWrap.querySelector('.topbar__dropdown');
  if (!avatar || !dropdown) return;

  const onDocClick = (e) => {
    if (!dropdown.contains(e.target) && e.target !== avatar) close();
  };
  const onEsc = (e) => { if (e.key === 'Escape') { e.preventDefault(); close(true); } };

  function open() {
    dropdown.classList.add('is-open');
    dropdown.setAttribute('aria-hidden', 'false');
    avatar.setAttribute('aria-expanded', 'true');
    // next tick pra não capturar o próprio click que abriu
    setTimeout(() => {
      document.addEventListener('click', onDocClick);
      document.addEventListener('keydown', onEsc);
    }, 0);
  }
  function close(returnFocus = false) {
    dropdown.classList.remove('is-open');
    dropdown.setAttribute('aria-hidden', 'true');
    avatar.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', onDocClick);
    document.removeEventListener('keydown', onEsc);
    if (returnFocus) avatar.focus();
  }

  avatar.addEventListener('click', () => {
    dropdown.classList.contains('is-open') ? close() : open();
  });

  // Logout item dentro do dropdown
  dropdown.querySelector('.topbar__dropdown-logout')?.addEventListener('click', fazerLogout);
}

function setupDrawer(shellWrap) {
  const sidebar = shellWrap.querySelector('.sidebar');
  const hamburger = shellWrap.querySelector('.topbar__hamburger');
  const backdrop = shellWrap.querySelector('.shell__backdrop');
  const nav = shellWrap.querySelector('.sidebar__nav');
  if (!sidebar || !hamburger || !backdrop || !nav) return;

  const mq = window.matchMedia('(max-width: 1024px)');

  const onEsc = (e) => { if (e.key === 'Escape') close(true); };

  function open() {
    shellWrap.classList.add('shell--drawer-open');
    hamburger.setAttribute('aria-expanded', 'true');
    sidebar.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    nav.querySelector('.sidebar__item')?.focus();
    document.addEventListener('keydown', onEsc);
  }
  function close(returnFocus = false) {
    shellWrap.classList.remove('shell--drawer-open');
    hamburger.setAttribute('aria-expanded', 'false');
    if (mq.matches) sidebar.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onEsc);
    if (returnFocus) hamburger.focus();
  }

  hamburger.addEventListener('click', () => {
    shellWrap.classList.contains('shell--drawer-open') ? close(true) : open();
  });
  backdrop.addEventListener('click', () => close());

  // Fechar ao clicar em qualquer item da nav
  nav.addEventListener('click', (e) => {
    if (e.target.closest('.sidebar__item')) close();
  });

  // aria-hidden inicial segue o breakpoint
  sidebar.setAttribute('aria-hidden', mq.matches ? 'true' : 'false');
  mq.addEventListener('change', (ev) => {
    sidebar.setAttribute('aria-hidden', ev.matches ? 'true' : 'false');
    if (!ev.matches) {
      // Saiu do mobile: garante drawer fechado e scroll liberado
      shellWrap.classList.remove('shell--drawer-open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
}

export const shell = { mount };
