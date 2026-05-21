// ── Página: Cronograma (membro) ──
import { shell } from '/assets/js/ui/shell.js';
import { getMeuPerfil } from '/assets/js/supabase/membros.js';
import { getEncontros } from '/assets/js/supabase/presenca.js';
import { renderEmptyState, icons } from '/assets/js/ui/empty-state.js';
import { skeletonRows } from '/assets/js/ui/skeleton.js';

await shell.mount({ activeRoute: '/membros/cronograma', pageTitle: 'Cronograma' });

const container = document.getElementById('timeline-container');
container.innerHTML = skeletonRows(4);

try {
  const perfil = await getMeuPerfil();
  if (!perfil?.liga_id) {
    renderEmptyState(container, {
      icon: icons.calendar,
      title: 'Liga não encontrada',
      description: 'Seu perfil ainda não foi vinculado a uma liga. Fale com a diretoria.',
    });
    throw new Error('sem liga_id');
  }
  const encontros = await getEncontros(perfil.liga_id);
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
  if (e.message === 'sem liga_id') return;
  console.error('Erro ao carregar cronograma:', e);
  renderEmptyState(container, {
    icon: icons.calendar,
    title: 'Erro ao carregar cronograma',
    description: 'Tente recarregar a página.',
  });
}
