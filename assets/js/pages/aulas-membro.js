// ── Página: Aulas (membro) ──
import { shell } from '/assets/js/ui/shell.js';
import { getMeuPerfil } from '/assets/js/supabase/membros.js';
import { getAulasPublicadas } from '/assets/js/supabase/aulas.js';
import { renderEmptyState, icons } from '/assets/js/ui/empty-state.js';
import { skeletonCards } from '/assets/js/ui/skeleton.js';

await shell.mount({ activeRoute: '/membros/aulas', pageTitle: 'Aulas' });

const $ = (id) => document.getElementById(id);

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
}

const aulasGrid = $('aulas-grid');
const tarefasGrid = $('tarefas-grid');
aulasGrid.innerHTML = skeletonCards(3);
tarefasGrid.innerHTML = skeletonCards(3);

try {
  const [perfil, { aulas, tarefas }] = await Promise.all([
    getMeuPerfil(),
    getAulasPublicadas(),
  ]);

  const now = new Date();
  const ligaNome = perfil?.ligas?.nome || '';
  $('aulas-header-title').textContent = `Aulas — ${ligaNome}`;
  $('aulas-header-sub').textContent = `Semestre ${now.getFullYear()}.${now.getMonth() < 6 ? 1 : 2} · ${aulas.length} aulas · ${tarefas.length} tarefas`;

  // ── Renderizar seção de Aulas ──
  const aulasCount = $('aulas-count');
  if (aulasCount) aulasCount.textContent = aulas.length;

  if (!aulas.length) {
    renderEmptyState(aulasGrid, {
      icon: icons.book,
      title: 'Nenhuma aula publicada ainda',
      description: 'Quando a diretoria publicar, as aulas aparecem aqui.',
    });
  } else {
    aulasGrid.innerHTML = aulas.map(a => {
      const numero = String(a.numero).padStart(2, '0');
      const links = (a.slides_url || a.material_url || a.arquivo_url) ? `<div class="aula-links">
        ${a.slides_url ? `<a class="aula-link" href="${a.slides_url}" target="_blank">Slides</a>` : ''}
        ${a.material_url ? `<a class="aula-link" href="${a.material_url}" target="_blank">Material</a>` : ''}
        ${a.arquivo_url ? `<a class="aula-link" href="${a.arquivo_url}" target="_blank" download>Arquivo ↓</a>` : ''}
      </div>` : '';
      return `<div class="aula-card">
        <div class="aula-num">Aula ${numero}</div>
        <div class="aula-title">${a.titulo}</div>
        <div class="aula-meta">
          <span class="pill" style="background:var(--blue-soft,rgba(59,130,246,.15));color:var(--blue)">Aula</span>
          ${links}
        </div>
      </div>`;
    }).join('');
  }

  // ── Renderizar seção de Tarefas ──
  const tarefasCount = $('tarefas-count');
  if (tarefasCount) tarefasCount.textContent = tarefas.length;

  if (!tarefas.length) {
    renderEmptyState(tarefasGrid, {
      icon: icons.inbox,
      title: 'Nenhuma tarefa publicada ainda',
      description: 'Quando a diretoria publicar, as tarefas aparecem aqui.',
    });
  } else {
    const futuras = tarefas.filter(a => a.prazo_entrega && new Date(a.prazo_entrega) >= now);
    tarefasGrid.innerHTML = tarefas.map(a => {
      const numero = String(a.numero).padStart(2, '0');
      const data = a.prazo_entrega ? new Date(a.prazo_entrega) : null;
      const passada = data ? data < now : false;
      const isProxima = futuras[0]?.id === a.id;
      let pillClass, pillLabel;
      if (a.statusEntrega === 'entregue') { pillClass = 'ok'; pillLabel = 'Entregue'; }
      else if (a.statusEntrega === 'atrasada') { pillClass = 'late'; pillLabel = `Atrasada · ${fmtDate(a.prazo_entrega)}`; }
      else if (passada) { pillClass = 'late'; pillLabel = `Atrasada · ${fmtDate(a.prazo_entrega)}`; }
      else if (isProxima) { pillClass = 'next'; pillLabel = `Próxima · ${fmtDate(a.prazo_entrega)}`; }
      else { pillClass = 'planned'; pillLabel = data ? `Prazo: ${fmtDate(a.prazo_entrega)}` : 'Planejada'; }
      const tarefaLinks = (a.material_url || a.arquivo_url) ? `<div class="aula-links">
        ${a.material_url ? `<a class="aula-link" href="${a.material_url}" target="_blank">Material</a>` : ''}
        ${a.arquivo_url ? `<a class="aula-link" href="${a.arquivo_url}" target="_blank" download>Arquivo ↓</a>` : ''}
      </div>` : '';
      return `<div class="aula-card${isProxima && a.statusEntrega !== 'entregue' ? ' next-class' : ''}">
        <div class="aula-num">Tarefa ${numero}</div>
        <div class="aula-title">${a.titulo}</div>
        <div class="aula-meta">
          <span class="pill ${pillClass}">${pillLabel}</span>
          ${tarefaLinks}
        </div>
      </div>`;
    }).join('');
  }
} catch (e) {
  console.error('Erro ao carregar aulas:', e);
  renderEmptyState(aulasGrid, {
    icon: icons.book,
    title: 'Erro ao carregar',
    description: 'Tente recarregar a página.',
  });
  renderEmptyState(tarefasGrid, {
    icon: icons.inbox,
    title: 'Erro ao carregar',
    description: 'Tente recarregar a página.',
  });
}
