// ── Página: Meus Encontros / presença (membro) ──
import { initPage } from '/assets/js/features/page-init.js';
import { getMinhasPresencas, registrarPresenca, calcularAlertaFrequencia } from '/assets/js/supabase/presenca.js';
import { renderEmptyState, icons } from '/assets/js/ui/empty-state.js';
import { skeletonRows } from '/assets/js/ui/skeleton.js';
import { toast } from '/assets/js/ui/toast.js';

await initPage({ requireRole: 'membro' });

const $ = (id) => document.getElementById(id);

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
}

function renderPresencas(presencas) {
  const timeline = $('presenca-timeline');
  const presentes = presencas.filter(p => p.status === 'presente').length;
  const total = presencas.length;
  const pct = total > 0 ? Math.round((presentes / total) * 100) : 0;
  const alerta = calcularAlertaFrequencia(presencas, total);

  $('presenca-header-sub').textContent = `${pct}% de presença · ${presentes} de ${total} encontros`;
  $('presenca-percent').textContent = `${pct}%`;

  const labelEl = $('presenca-percent-label');
  if (alerta.status === 'risco') labelEl.textContent = 'Em risco';
  else if (alerta.status === 'atencao') labelEl.textContent = 'Atenção';
  else labelEl.textContent = 'Regular';

  const colors = {
    risco:   { bg: 'rgba(255,120,120,.08)', border: 'rgba(255,120,120,.2)', text: 'rgba(255,120,120,.8)' },
    atencao: { bg: 'rgba(251,191,36,.08)',  border: 'rgba(251,191,36,.2)',  text: 'var(--amber)' },
    ok:      { bg: 'rgba(34,197,94,.08)',   border: 'rgba(34,197,94,.2)',   text: 'var(--green)' },
  };
  const c = colors[alerta.status] || colors.ok;
  $('presenca-percent-box').style.background = c.bg;
  $('presenca-percent-box').style.borderColor = c.border;
  $('presenca-percent').style.color = c.text;

  if (!presencas.length) {
    renderEmptyState(timeline, {
      icon: icons.calendar,
      title: 'Nenhum registro de presença',
      description: 'Seus registros aparecem aqui depois da primeira chamada.',
    });
    return;
  }

  const sorted = [...presencas].sort((a, b) =>
    new Date(a.encontros?.data || 0) - new Date(b.encontros?.data || 0)
  );
  timeline.innerHTML = sorted.map(p => {
    const ok = p.status === 'presente';
    return `<div class="presenca-item">
      <div class="presenca-check ${ok ? 'ok' : 'no'}">${ok ? '✓' : '✕'}</div>
      <div class="presenca-date">${fmtDate(p.encontros?.data)}</div>
      <div class="presenca-desc">${p.encontros?.titulo || '—'}</div>
      <span class="pill ${ok ? 'ok' : 'late'}" style="margin-left:auto">${ok ? 'Presente' : 'Ausente'}</span>
    </div>`;
  }).join('');
}

async function handleRegistrarPresenca(codigoParam) {
  const fb = $('presenca-feedback');
  const otpIds = ['otp-1','otp-2','otp-3','otp-4','otp-5','otp-6'];
  const codigo = codigoParam || otpIds.map(id => $(id)?.value || '').join('').trim();

  if (!codigo || codigo.length < 6) {
    toast.error('Digite o código de presença.');
    return;
  }

  try {
    otpIds.forEach(id => { const inp = $(id); if (inp) inp.disabled = true; });
    await registrarPresenca(codigo);
    toast.success('Presença registrada!');
    const presencas = await getMinhasPresencas();
    renderPresencas(presencas);
  } catch (e) {
    fb.style.display = 'block';
    fb.style.color = 'rgba(255,120,120,.8)';
    fb.textContent = e.message || 'Erro ao registrar presença.';
    otpIds.forEach(id => { const inp = $(id); if (inp) { inp.disabled = false; inp.value = ''; inp.classList.remove('filled'); } });
    $('otp-1')?.focus();
  }
}

window.registrarPresencaCodigo = handleRegistrarPresenca;

// Initial load
const timeline = $('presenca-timeline');
timeline.innerHTML = skeletonRows(4);
try {
  const presencas = await getMinhasPresencas();
  renderPresencas(presencas);
} catch (e) {
  console.error('Erro ao carregar presenças:', e);
}
