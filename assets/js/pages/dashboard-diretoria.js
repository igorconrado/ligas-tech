// ── Dashboard Diretoria — Visão Geral ──
// Outras seções (membros, encontros, aulas, entregas, avisos,
// advertências, perfil) vivem em páginas próprias em /membros/diretoria/*.
// Esta página cuida só do overview: 4 KPIs + 2 panels + overview-tbl.

import { shell } from '/assets/js/ui/shell.js';
import { getMembrosLiga, getMeuPerfil } from '/assets/js/supabase/membros.js';
import { getTodasAulas, getEntregasAula } from '/assets/js/supabase/aulas.js';
import { getEncontros, getPresencasEncontro } from '/assets/js/supabase/presenca.js';
import { getTodasAdvertencias } from '/assets/js/supabase/advertencias.js';
import { renderOverviewTable } from '/assets/js/features/members-table.js';
import { renderEmptyState, icons } from '/assets/js/ui/empty-state.js';
import { skeletonText, skeletonTableRows } from '/assets/js/ui/skeleton.js';

const { usuario } = await shell.mount({
  activeRoute: '/membros/dashboard-diretoria',
  pageTitle: 'Visão Geral',
});
const ligaId = usuario?.liga_id || null;
const perfil = await getMeuPerfil();

const $ = (id) => document.getElementById(id);

async function atualizarMetricas() {
  ['metric-membros','metric-presenca-media','pending-count','metric-advertencias'].forEach(id => {
    const el = $(id); if (el) el.innerHTML = skeletonText('skeleton--title');
  });
  try {
    const [membros, encontros, aulas, advertencias] = await Promise.all([
      getMembrosLiga(ligaId),
      getEncontros(ligaId),
      getTodasAulas(ligaId),
      getTodasAdvertencias(ligaId),
    ]);

    // 1. Membros ativos
    const totalMembros = membros.length;
    $('metric-membros').textContent = totalMembros;
    const porLiga = membros.reduce((acc, m) => {
      const nome = m.ligas?.nome || 'Sem liga';
      acc[nome] = (acc[nome] || 0) + 1;
      return acc;
    }, {});
    $('metric-membros-sub').textContent = Object.entries(porLiga).map(([n, c]) => `${c} ${n}`).join(' · ') || '—';

    // 2. Presença média
    const presencasPorEnc = encontros.length
      ? await Promise.all(encontros.map(e => getPresencasEncontro(e.id)))
      : [];
    const porMembro = {};
    presencasPorEnc.flat().forEach(p => {
      porMembro[p.membro_id] = porMembro[p.membro_id] || { presentes: 0, total: 0 };
      porMembro[p.membro_id].total++;
      if (p.status === 'presente') porMembro[p.membro_id].presentes++;
    });
    const taxas = Object.values(porMembro).filter(v => v.total > 0).map(v => v.presentes / v.total);
    const presencaMedia = taxas.length ? Math.round((taxas.reduce((a,b) => a+b, 0) / taxas.length) * 100) : 0;
    $('metric-presenca-media').textContent = `${presencaMedia}%`;

    // 3. Entregas pendentes
    const aulasElegiveis = aulas.filter(a => a.publicada && a.prazo_entrega);
    const entregasPorAula = aulasElegiveis.length
      ? await Promise.all(aulasElegiveis.map(a => getEntregasAula(a.id)))
      : [];
    const totalEntregues = entregasPorAula.flat().filter(e => e.status === 'entregue').length;
    const pendentes = Math.max(0, aulasElegiveis.length * totalMembros - totalEntregues);
    $('pending-count').textContent = pendentes;
    $('metric-entregas-pendentes-sub').textContent = aulasElegiveis.length
      ? `em ${aulasElegiveis.length} aula${aulasElegiveis.length > 1 ? 's' : ''} com prazo`
      : 'Nenhuma aula com prazo';

    // 4. Advertências
    $('metric-advertencias').textContent = advertencias.length;
  } catch (e) {
    console.error('Erro ao atualizar métricas:', e);
  }
}

async function renderizarUltimasPresencas() {
  const tbody = $('tbody-ultimas-presencas');
  tbody.innerHTML = skeletonTableRows(3, 3);
  try {
    const [encontros, membros] = await Promise.all([getEncontros(ligaId), getMembrosLiga(ligaId)]);
    const ligaNome = perfil?.ligas?.nome || '—';
    const totalMembros = membros.length;
    const ultimos = encontros.slice(0, 3);
    if (!ultimos.length) {
      renderEmptyState(tbody, {
        icon: icons.clock,
        title: 'Nenhum encontro registrado',
        description: 'Crie encontros e abra chamadas pra ver taxas de presença.',
      });
      return;
    }
    const presencasPorEnc = await Promise.all(ultimos.map(e => getPresencasEncontro(e.id)));
    tbody.innerHTML = ultimos.map((e, i) => {
      const data = new Date(e.data).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '');
      const presentes = presencasPorEnc[i].filter(p => p.status === 'presente').length;
      const taxa = totalMembros > 0 ? Math.round((presentes / totalMembros) * 100) : 0;
      const pill = ligaNome === 'IbBot' ? 'r' : 'b';
      return `<tr>
        <td>${data} · ${e.titulo}</td>
        <td><span class="pill ${pill}">${ligaNome}</span></td>
        <td>${presentes}/${totalMembros} (${taxa}%)</td>
      </tr>`;
    }).join('');
  } catch (e) {
    console.error('Erro em últimas presenças:', e);
  }
}

async function renderizarEntregasAtrasadas() {
  const tbody = $('tbody-entregas-atrasadas');
  tbody.innerHTML = skeletonTableRows(3, 3);
  try {
    const [aulas, membros] = await Promise.all([getTodasAulas(ligaId), getMembrosLiga(ligaId)]);
    const now = new Date();
    const atrasadas = aulas
      .filter(a => a.publicada && a.prazo_entrega && new Date(a.prazo_entrega) < now)
      .sort((a, b) => new Date(b.prazo_entrega) - new Date(a.prazo_entrega));
    if (!atrasadas.length) {
      renderEmptyState(tbody, {
        icon: icons.check,
        title: 'Sem entregas atrasadas',
        description: 'Tudo em dia ou nenhum prazo passou ainda.',
      });
      return;
    }
    const entregasPorAula = await Promise.all(atrasadas.map(a => getEntregasAula(a.id)));
    const porMembro = {};
    atrasadas.forEach((a, i) => {
      const entreguesIds = new Set(entregasPorAula[i].filter(e => e.status === 'entregue').map(e => e.membro_id));
      membros.forEach(m => {
        if (!entreguesIds.has(m.id)) {
          porMembro[m.id] = porMembro[m.id] || { nome: m.nome, aulas: [] };
          porMembro[m.id].aulas.push(a.numero);
        }
      });
    });
    const top = Object.values(porMembro).sort((a, b) => b.aulas.length - a.aulas.length).slice(0, 3);
    if (!top.length) {
      renderEmptyState(tbody, {
        icon: icons.check,
        title: 'Sem entregas atrasadas',
        description: 'Todos entregaram no prazo.',
      });
      return;
    }
    tbody.innerHTML = top.map(m => {
      const n = m.aulas.length;
      const aulasLabel = n === 1 ? `Aula ${String(m.aulas[0]).padStart(2, '0')}` : `${n} atrasadas`;
      const statusPill = n === 1
        ? '<span class="pill late">Atrasada</span>'
        : `<span class="pill adv">${n} atrasadas</span>`;
      return `<tr><td>${m.nome}</td><td>${aulasLabel}</td><td>${statusPill}</td></tr>`;
    }).join('');
  } catch (e) {
    console.error('Erro em entregas atrasadas:', e);
  }
}

async function renderizarOverview() {
  const tbl = $('overview-tbl');
  tbl.innerHTML = `<tbody>${skeletonTableRows(5, 7)}</tbody>`;
  try {
    const data = await getMembrosLiga(ligaId);
    const members = data.map(m => ({
      id: m.id, name: m.nome, liga: m.ligas?.nome || '—',
      presenca: 0, entregas: '—', status: 'ok', adv: 0,
    }));
    renderOverviewTable(tbl, members);
  } catch (e) {
    console.error('Erro ao carregar overview:', e);
  }
}

// Panel "Visão geral dos membros" tem botão "Anotar" que chama openAdvModal.
// Na página de overview, esse modal não existe — redireciona pra /diretoria/advertencias.
window.openAdvModal = () => {
  window.location.href = '/membros/diretoria/advertencias';
};

await atualizarMetricas();
await renderizarUltimasPresencas();
await renderizarEntregasAtrasadas();
await renderizarOverview();
