// ── Active nav helper ──

/**
 * Marca o link do nav que corresponde à URL atual.
 * Busca todos os <a> dentro de `navSelector` e compara href.
 * @param {string} navSelector — seletor do container do nav (default 'nav')
 */
export function setActiveNav(navSelector = 'nav') {
  const currentPath = window.location.pathname;
  const nav = document.querySelector(navSelector);
  if (!nav) return;

  nav.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    link.classList.remove('active');
    if (currentPath.endsWith(href) || currentPath.endsWith(href.replace('./', ''))) {
      link.classList.add('active');
    }
  });
}
