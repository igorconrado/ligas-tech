// ── Página: Minhas Advertências (membro) ──
import { initPage } from '/assets/js/features/page-init.js';
import { getMinhasAdvertencias } from '/assets/js/supabase/advertencias.js';
import { renderEmptyState, icons } from '/assets/js/ui/empty-state.js';
import { skeletonTableRows } from '/assets/js/ui/skeleton.js';

await initPage({ requireRole: 'membro' });

const tbody = document.getElementById('minhas-adv-tbl');
tbody.innerHTML = skeletonTableRows(3, 3);

try {
  const advertencias = await getMinhasAdvertencias();
  if (!advertencias || !advertencias.length) {
    renderEmptyState(tbody, {
      icon: icons.check,
      title: 'Nenhuma advertência',
      description: 'Você está em dia — nenhum registro no seu histórico.',
    });
  } else {
    tbody.innerHTML = advertencias.map(adv => `
      <tr>
        <td><span class="pill ${adv.tipo === 'grave' ? 'adv' : 'warn'}">${adv.tipo}</span></td>
        <td>${adv.descricao}</td>
        <td>${new Date(adv.criado_em).toLocaleDateString('pt-BR')}</td>
      </tr>
    `).join('');
  }
} catch (e) {
  console.error('Erro ao carregar advertências:', e);
}
