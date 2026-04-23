// ── Toast inline ──
// API: toast.success(msg), toast.error(msg), toast.warning(msg), toast.info(msg)
//
// Container fixo top-right, stack vertical (mais recente no topo),
// auto-dismiss em 3s (pausa no hover), slide-in da direita + fade-in.
// Respeita prefers-reduced-motion.

const STYLE_ID = 'ligas-toast-style';
const CONTAINER_ID = 'ligas-toast-container';
const AUTO_DISMISS_MS = 3000;

const COLORS = {
  success: '#2EBE7A',
  error:   '#E84545',
  warning: '#F5B544',
  info:    '#2A54F5',
};

function injectStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${CONTAINER_ID} {
      position: fixed;
      top: 16px;
      right: 16px;
      display: flex;
      flex-direction: column-reverse;
      gap: 8px;
      z-index: var(--z-overlay, 50);
      pointer-events: none;
    }
    .ligas-toast {
      pointer-events: auto;
      min-width: 240px;
      max-width: 360px;
      padding: 12px 14px;
      background: #0F0E0D;
      color: #fff;
      font-family: var(--font-body, system-ui, sans-serif);
      font-size: 13px;
      line-height: 1.4;
      border-left: 3px solid #888;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      transform: translateX(110%);
      opacity: 0;
      transition: transform 240ms ease-out, opacity 240ms ease-out;
      will-change: transform, opacity;
    }
    .ligas-toast.show {
      transform: translateX(0);
      opacity: 1;
    }
    .ligas-toast.hide {
      transform: translateX(110%);
      opacity: 0;
      transition: transform 200ms ease-in, opacity 200ms ease-in;
    }
    @media (prefers-reduced-motion: reduce) {
      .ligas-toast {
        transform: none;
        transition: opacity 0ms;
      }
      .ligas-toast.hide { transform: none; }
    }
  `;
  document.head.appendChild(style);
}

function ensureContainer() {
  let el = document.getElementById(CONTAINER_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = CONTAINER_ID;
    document.body.appendChild(el);
  }
  return el;
}

function show(type, msg) {
  injectStyle();
  const container = ensureContainer();

  const el = document.createElement('div');
  el.className = 'ligas-toast';
  el.style.borderLeftColor = COLORS[type] || '#888';
  el.textContent = msg;
  container.appendChild(el);

  requestAnimationFrame(() => el.classList.add('show'));

  let timerId;
  const dismiss = () => {
    if (el.classList.contains('hide')) return;
    el.classList.remove('show');
    el.classList.add('hide');
    const cleanup = () => el.remove();
    el.addEventListener('transitionend', cleanup, { once: true });
    setTimeout(cleanup, 300);
  };
  const startTimer = () => { timerId = setTimeout(dismiss, AUTO_DISMISS_MS); };

  el.addEventListener('mouseenter', () => clearTimeout(timerId));
  el.addEventListener('mouseleave', startTimer);

  startTimer();
}

export const toast = {
  success: (msg) => show('success', msg),
  error:   (msg) => show('error',   msg),
  warning: (msg) => show('warning', msg),
  info:    (msg) => show('info',    msg),
};
