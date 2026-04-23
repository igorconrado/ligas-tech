// ── Página: Cronograma (membro) ──
import { initPage } from '/assets/js/features/page-init.js';
import { getEncontros } from '/assets/js/supabase/presenca.js';
import { renderEmptyState, icons } from '/assets/js/ui/empty-state.js';
import { skeletonRows } from '/assets/js/ui/skeleton.js';

const { usuario } = await initPage({ requireRole: 'membro' });

const container = document.getElementById('timeline-container');
container.innerHTML = skeletonRows(4);

try {
  const encontros = await getEncontros(usuario.liga_id);
  const itens = [...encontros]
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .map(e => ({
      data: e.data,
      titulo: e.titulo,
      subtitulo: e.aberto ? 'Chamada aberta agora' : '',
    }));

  if (!itens.length) {
    renderEmptyState(container, {
      icon: icons.calendar,
      title: 'Nenhum encontro agendado',
      description: 'A diretoria ainda não cadastrou encontros pra sua liga.',
    });
  } else {
    const hoje = new Date().toDateString();
    container.innerHTML = itens.map(item => {
      const dataItem = new Date(item.data);
      const isHoje = dataItem.toDateString() === hoje;
      const isConcluida = dataItem < new Date() && !isHoje;
      const status = isHoje ? 'hoje' : isConcluida ? 'concluida' : 'planejada';
      const weekday = dataItem.toLocaleDateString('pt-BR', { weekday: 'long' });
      const weekdayCap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      const dataFmt = dataItem.toLocaleDateString('pt-BR');
      const label = status === 'hoje' ? 'Hoje' : status === 'concluida' ? 'Concluída' : 'Planejada';
      return `
        <div class="timeline-item ${status}">
          <div class="timeline-dot ${status}"></div>
          <div class="timeline-date">${weekdayCap} · ${dataFmt}</div>
          <div class="timeline-title">${item.titulo}</div>
          ${item.subtitulo ? `<div class="timeline-sub">${item.subtitulo}</div>` : ''}
          <span class="timeline-badge ${status}">${label}</span>
        </div>
      `;
    }).join('');
  }
} catch (e) {
  console.error('Erro ao carregar cronograma:', e);
}
