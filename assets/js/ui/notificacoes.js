// ── Módulo de notificações: sino no topbar (área de membros) ──
// Detecta: chamada aberta (realtime), novos avisos, novas aulas/tarefas.
// "Novo" = criado após o timestamp salvo em localStorage para aquela liga.

import { supabase } from '/assets/js/supabase/client.js';

const WEEK_AGO = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

function seenKey(type, ligaId) { return `notif-${type}-${ligaId}`; }

function getLastSeen(type, ligaId) {
  try { return localStorage.getItem(seenKey(type, ligaId)) || WEEK_AGO(); } catch { return WEEK_AGO(); }
}

function markSeen(type, ligaId) {
  try { localStorage.setItem(seenKey(type, ligaId), new Date().toISOString()); } catch {}
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function fetchDados(ligaId) {
  const [resAvisos, resAulas, resChamada] = await Promise.all([
    supabase.from('avisos')
      .select('id, titulo, criado_em')
      .eq('liga_id', ligaId)
      .gt('criado_em', getLastSeen('avisos', ligaId))
      .order('criado_em', { ascending: false })
      .limit(5),
    supabase.from('aulas')
      .select('id, titulo, tipo, criado_em')
      .eq('liga_id', ligaId)
      .eq('publicada', true)
      .gt('criado_em', getLastSeen('aulas', ligaId))
      .order('criado_em', { ascending: false })
      .limit(5),
    supabase.from('encontros')
      .select('id, titulo')
      .eq('liga_id', ligaId)
      .eq('aberto', true)
      .limit(1),
  ]);

  return {
    avisos: resAvisos.data || [],
    aulas: resAulas.data || [],
    chamada: resChamada.data?.[0] || null,
  };
}

function renderDropdown(dropdown, state) {
  const { avisos, aulas, chamada } = state;
  const total = avisos.length + aulas.length + (chamada ? 1 : 0);

  if (total === 0) {
    dropdown.innerHTML = `
      <div class="notif-header">Notificações</div>
      <div class="notif-empty">Nenhuma notificação nova</div>`;
    return;
  }

  let html = `<div class="notif-header">Notificações</div>`;

  if (chamada) {
    html += `
      <div class="notif-section-label">CHAMADA ABERTA</div>
      <a href="/membros/encontros" class="notif-item notif-item--urgent">
        <span class="notif-dot notif-dot--live"></span>
        <div>
          <div class="notif-item-title">Chamada aberta agora!</div>
          <div class="notif-item-sub">${esc(chamada.titulo)}</div>
        </div>
      </a>`;
  }

  if (aulas.length) {
    html += `<div class="notif-section-label">NOVAS AULAS / TAREFAS</div>`;
    for (const a of aulas) {
      const href = a.tipo === 'tarefa' ? '/membros/entregas' : '/membros/aulas';
      const label = a.tipo === 'tarefa' ? 'Nova tarefa' : 'Nova aula';
      html += `
        <a href="${href}" class="notif-item">
          <span class="notif-dot notif-dot--blue"></span>
          <div>
            <div class="notif-item-title">${label}: ${esc(a.titulo)}</div>
          </div>
        </a>`;
    }
  }

  if (avisos.length) {
    html += `<div class="notif-section-label">AVISOS</div>`;
    for (const av of avisos) {
      html += `
        <a href="/membros/avisos" class="notif-item">
          <span class="notif-dot notif-dot--yellow"></span>
          <div>
            <div class="notif-item-title">${esc(av.titulo)}</div>
          </div>
        </a>`;
    }
  }

  dropdown.innerHTML = html;
}

export async function initNotificacoes(shellWrap, ligaId) {
  if (!ligaId) return;

  const btn = shellWrap.querySelector('.notif-btn');
  const badge = shellWrap.querySelector('.notif-badge');
  const dropdown = shellWrap.querySelector('.notif-dropdown');
  if (!btn || !badge || !dropdown) return;

  let state = { avisos: [], aulas: [], chamada: null };
  let isOpen = false;

  function updateBadge() {
    const n = state.avisos.length + state.aulas.length + (state.chamada ? 1 : 0);
    badge.textContent = n > 9 ? '9+' : String(n);
    badge.style.display = n > 0 ? '' : 'none';
    btn.setAttribute('aria-label', n > 0 ? `Notificações (${n} nova${n > 1 ? 's' : ''})` : 'Notificações');
  }

  async function refresh() {
    state = await fetchDados(ligaId);
    updateBadge();
    if (isOpen) renderDropdown(dropdown, state);
  }

  // Realtime: chamada aberta/fechada
  supabase.channel(`notif-encontros-${ligaId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'encontros',
      filter: `liga_id=eq.${ligaId}`,
    }, async () => {
      const { data } = await supabase.from('encontros')
        .select('id, titulo')
        .eq('liga_id', ligaId)
        .eq('aberto', true)
        .limit(1);
      state.chamada = data?.[0] || null;
      updateBadge();
      if (isOpen) renderDropdown(dropdown, state);
    })
    .subscribe();

  // Toggle dropdown
  const onDocClick = (e) => {
    if (!dropdown.contains(e.target) && e.target !== btn && !btn.contains(e.target)) close();
  };
  const onEsc = (e) => { if (e.key === 'Escape') close(); };

  function open() {
    isOpen = true;
    dropdown.classList.add('is-open');
    dropdown.setAttribute('aria-hidden', 'false');
    btn.setAttribute('aria-expanded', 'true');
    renderDropdown(dropdown, state);
    setTimeout(() => {
      document.addEventListener('click', onDocClick);
      document.addEventListener('keydown', onEsc);
    }, 0);
  }

  function close() {
    isOpen = false;
    dropdown.classList.remove('is-open');
    dropdown.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', onDocClick);
    document.removeEventListener('keydown', onEsc);
    // Marcar avisos e aulas como vistos ao fechar
    markSeen('avisos', ligaId);
    markSeen('aulas', ligaId);
    state.avisos = [];
    state.aulas = [];
    updateBadge();
  }

  btn.addEventListener('click', () => isOpen ? close() : open());

  await refresh();
}
