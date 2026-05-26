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
import { icons } from '/assets/js/ui/icons.js';

const SIDEBAR_STATE_KEY = 'sidebar-state';
const APP_VERSION = 'v1.4.0';

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
  { group: 'IDENTIDADE', items: [
    { label: 'Manual de Marca', href: '/membros/diretoria/manual-de-marca', icon: 'changelog' },
  ]},
  { group: 'MINHA ÁREA', items: [
    { label: 'Área de Membros', href: '/membros/dashboard', icon: 'members' },
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

function buildSidebar(nav, activeRoute, homeHref, initialState, isDiretoriaUser, isDiretoriaRoute, memberCargo) {
  const showDiretoriaLink = (isDiretoriaUser || memberCargo === 'diretor') && !isDiretoriaRoute;
  const extraLink = showDiretoriaLink
    ? `<section class="sidebar__group">
        <h4 class="sidebar__group-label">DIRETORIA</h4>
        <ul><li>
          <a href="/membros/dashboard-diretoria" class="sidebar__item" data-active="false" title="Ir para área da diretoria">
            <span class="sidebar__icon">${icons.overview}</span>
            <span class="sidebar__label">Área da Diretoria</span>
          </a>
        </li></ul>
      </section>`
    : '';

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
        <a href="${escape(homeHref)}" class="sidebar__logo" aria-label="Ligas Tech — página inicial">
          <img src="/assets/icons/Documento-removebg-preview.png" alt="Ligas Tech" class="sidebar__logo-img">
        </a>
        <button class="sidebar__toggle" type="button" aria-label="${toggleLabel}" aria-expanded="${isExpanded}">${toggleIcon}</button>
      </div>
      <nav class="sidebar__nav">${groupsHtml}${extraLink}</nav>
      <div class="sidebar__footer">
        <a href="/membros/changelog" class="sidebar__version" title="Ver changelog">
          <span class="sidebar__icon">${icons.changelog}</span>
          <span class="sidebar__label sidebar__version-text">${APP_VERSION}</span>
        </a>
        <button class="sidebar__logout" type="button">
          <span class="sidebar__icon">${icons.logout}</span>
          <span class="sidebar__label">Sair</span>
        </button>
      </div>
    </aside>
  `;
}

function buildTopbar({ pageTitle, initial, userName, userEmail, perfilHref, avatarUrl, showNotif }) {
  const avatarContent = avatarUrl
    ? `<img src="${escape(avatarUrl)}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`
    : escape(initial);
  const notifHtml = showNotif ? `
    <div class="notif-wrap">
      <button class="notif-btn" type="button" aria-label="Notificações" aria-haspopup="true" aria-expanded="false">
        ${icons.bell}
        <span class="notif-badge" style="display:none" aria-hidden="true"></span>
      </button>
      <div class="notif-dropdown" aria-hidden="true"></div>
    </div>` : '';
  return `
    <header class="topbar">
      <button class="topbar__hamburger" type="button" aria-label="Abrir menu" aria-expanded="false">${icons.menu}</button>
      <h1 class="topbar__title">${escape(pageTitle)}</h1>
      <div class="topbar__user" style="display:flex;align-items:center;gap:var(--sp-2)">
        ${notifHtml}
        <button class="topbar__avatar" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="topbar-dropdown">${avatarContent}</button>
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

  const nav = isDiretoriaRoute ? NAV_DIRETORIA : NAV_MEMBRO;
  const homeHref = isDiretoriaRoute ? '/membros/dashboard-diretoria' : '/membros/dashboard';
  const perfilHref = isDiretoriaRoute ? '/membros/diretoria/perfil' : '/membros/perfil';
  const userEmail = session?.user?.email || '';
  const emailLocal = userEmail.split('@')[0] || 'U';
  const userName = usuario?.membros?.nome || emailLocal;
  const initial = (userName[0] || 'U').toUpperCase();
  const avatarUrl = usuario?.membros?.avatar_url || null;

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
  const showNotif = !isDiretoriaRoute;
  shellWrap.innerHTML = `
    ${buildSidebar(nav, activeRoute, homeHref, initialState, isDiretoria, isDiretoriaRoute, usuario?.membros?.cargo)}
    <div class="shell__backdrop"></div>
    <div class="shell__main">
      ${buildTopbar({ pageTitle, initial, userName, userEmail, perfilHref, avatarUrl, showNotif })}
    </div>
  `;
  shellWrap.querySelector('.shell__main').appendChild(existingMain);

  if (skipLink) skipLink.after(shellWrap);
  else parent.prepend(shellWrap);

  // Notificações (apenas área de membro)
  if (showNotif && usuario?.membros?.liga_id) {
    import('/assets/js/ui/notificacoes.js').then(({ initNotificacoes }) => {
      initNotificacoes(shellWrap, usuario.membros.liga_id);
    }).catch(e => console.error('[shell] Erro ao carregar notificações:', e));
  }

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
