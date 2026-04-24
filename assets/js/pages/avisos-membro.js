// ── Página: Avisos (membro) ──
import { shell } from '/assets/js/ui/shell.js';
import { getAvisos } from '/assets/js/supabase/avisos.js';
import { renderEmptyState, icons } from '/assets/js/ui/empty-state.js';
import { skeletonRows } from '/assets/js/ui/skeleton.js';

await shell.mount({ activeRoute: '/membros/avisos', pageTitle: 'Avisos' });

const container = document.getElementById('avisos-lista');
container.innerHTML = skeletonRows(3);

try {
  const avisos = await getAvisos();
  if (!avisos || !avisos.length) {
    renderEmptyState(container, {
      icon: icons.check,
      title: 'Tudo em dia',
      description: 'Nenhum aviso novo da diretoria.',
    });
  } else {
    container.innerHTML = avisos.map(a => `
      <div class="aviso-item">
        <div class="aviso-header">
          <span class="aviso-titulo">${a.titulo}</span>
          <span class="aviso-data">${new Date(a.criado_em).toLocaleDateString('pt-BR')}</span>
        </div>
        <p class="aviso-msg">${a.mensagem}</p>
      </div>
    `).join('');
  }
} catch (e) {
  console.error('Erro ao carregar avisos:', e);
}
