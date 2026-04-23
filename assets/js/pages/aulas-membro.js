// ── Página: Aulas (membro) ──
import { initPage } from '/assets/js/features/page-init.js';
import { getMeuPerfil } from '/assets/js/supabase/membros.js';
import { getAulasComEntregas } from '/assets/js/supabase/aulas.js';
import { renderEmptyState, icons } from '/assets/js/ui/empty-state.js';
import { skeletonCards } from '/assets/js/ui/skeleton.js';

await initPage({ requireRole: 'membro' });

const $ = (id) => document.getElementById(id);

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
}

const grid = $('aulas-grid');
grid.innerHTML = skeletonCards(3);

try {
  const [perfil, aulas] = await Promise.all([
    getMeuPerfil(),
    getAulasComEntregas(),
  ]);

  const now = new Date();
  const ligaNome = perfil?.ligas?.nome || '';
  $('aulas-header-title').textContent = `Aulas — ${ligaNome}`;
  $('aulas-header-sub').textContent = `Semestre ${now.getFullYear()}.${now.getMonth() < 6 ? 1 : 2} · ${aulas.length} aulas planejadas`;

  if (!aulas.length) {
    renderEmptyState(grid, {
      icon: icons.book,
      title: 'Nenhuma aula publicada ainda',
      description: 'Quando a diretoria publicar, as aulas aparecem aqui.',
    });
  } else {
    const futuras = aulas.filter(a => new Date(a.prazo_entrega) >= now);
    grid.innerHTML = aulas.map(a => {
      const data = new Date(a.prazo_entrega);
      const passada = data < now;
      const isProxima = futuras[0]?.id === a.id;
      let pillClass, pillLabel;
      if (passada) { pillClass = 'ok'; pillLabel = 'Concluída'; }
      else if (isProxima) { pillClass = 'next'; pillLabel = `Próxima · ${fmtDate(a.prazo_entrega)}`; }
      else { pillClass = 'planned'; pillLabel = 'Planejada'; }
      const links = (a.slides_url || a.material_url) ? `<div class="aula-links">
        ${a.slides_url ? `<a class="aula-link" href="${a.slides_url}" target="_blank">Slides</a>` : ''}
        ${a.material_url ? `<a class="aula-link" href="${a.material_url}" target="_blank">Material</a>` : ''}
      </div>` : '';
      return `<div class="aula-card${isProxima ? ' next-class' : ''}">
        <div class="aula-num">Aula ${String(a.numero).padStart(2, '0')}</div>
        <div class="aula-title">${a.titulo}</div>
        <div class="aula-meta">
          <span class="pill ${pillClass}">${pillLabel}</span>
          ${links}
        </div>
      </div>`;
    }).join('');
  }
} catch (e) {
  console.error('Erro ao carregar aulas:', e);
}
