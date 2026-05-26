// ── Members table (feature) ──
// Duas tabelas de membros reutilizáveis pela área de diretoria:
// - renderOverviewTable: usada na Visão Geral (dashboard-diretoria)
//   Colunas: Nome · Liga · Presença · Entregas · Status · Adv. · ação
// - renderMembrosTable: usada na Gestão de Membros (/diretoria/membros)
//   Colunas: Nome · Liga · Presença · Entregas · Adv. · Semestre · ações
//
// Consumidores: 2 páginas distintas — por isso extraído aqui (sub-task 1a).
// O onclick "Anotar" chama window.openAdvModal, registrado pela página.

import { renderEmptyState, icons } from '/assets/js/ui/empty-state.js';

const STATUS_LABEL = { ok: 'Regular', warn: 'Atenção', adv: 'Advertência' };
const STATUS_PILL  = { ok: 'ok', warn: 'warn', adv: 'adv' };
const CARGO_LABEL  = { trainee: 'Trainee', membro: 'Membro', diretor: 'Diretor(a)' };
const CARGO_STYLE  = {
  trainee: 'background:var(--amber)22;color:var(--amber);border:1px solid var(--amber)44',
  membro:  'background:var(--blue)22;color:var(--blue);border:1px solid var(--blue)44',
  diretor: 'background:var(--green)22;color:var(--green);border:1px solid var(--green)44',
};

function emptyStateConfig() {
  return {
    icon: icons.users,
    title: 'Nenhum membro cadastrado',
    description: 'Importe via processo seletivo ou adicione manualmente pelo botão "+ Novo membro".',
  };
}

function ligaPill(liga) {
  return `<span class="pill ${liga === 'IbBot' ? 'r' : 'b'}">${liga}</span>`;
}

function progressCell(valor) {
  return `<div class="prog-wrap"><div class="prog-bar"><div class="prog-fill ${valor >= 75 ? 'g' : 'r'}" style="width:${valor}%"></div></div><span class="prog-val">${valor}%</span></div>`;
}

function advCell(n) {
  const color = n > 0 ? 'rgba(255,120,120,.8)' : 'var(--muted)';
  const text  = n > 0 ? `${n}x` : '—';
  return `<td style="color:${color}; font-family:var(--font-mono); font-size:11px">${text}</td>`;
}

export function renderOverviewTable(tbl, data) {
  if (!tbl) return;
  if (!data.length) {
    tbl.innerHTML = `<thead><tr><th>Nome</th><th>Liga</th><th>Presença</th><th>Entregas</th><th>Status</th><th>Adv.</th><th></th></tr></thead><tbody></tbody>`;
    renderEmptyState(tbl.querySelector('tbody'), emptyStateConfig());
    return;
  }
  tbl.innerHTML = `<thead><tr><th>Nome</th><th>Liga</th><th>Presença</th><th>Entregas</th><th>Status</th><th>Adv.</th><th></th></tr></thead>
  <tbody>${data.map(m => `<tr>
    <td style="font-weight:500">${m.name}</td>
    <td>${ligaPill(m.liga)}</td>
    <td>${progressCell(m.presenca)}</td>
    <td style="color:var(--mid)">${m.entregas}</td>
    <td><span class="pill ${STATUS_PILL[m.status] || 'ok'}">${STATUS_LABEL[m.status] || 'Regular'}</span></td>
    ${advCell(m.adv)}
    <td style="display:flex;gap:.375rem">
      <a href="/membros/diretoria/perfil-membro?id=${m.id}" class="btn-sm ghost" style="font-size:10px;padding:3px 8px;text-decoration:none">Ver</a>
      <button class="btn-sm ghost" style="font-size:10px;padding:3px 8px" onclick="openAdvModal('${m.id}', '${m.name}')">Anotar</button>
    </td>
  </tr>`).join('')}</tbody>`;
}

function cargoPill(cargo) {
  const label = CARGO_LABEL[cargo] || 'Membro';
  const style = CARGO_STYLE[cargo] || CARGO_STYLE.membro;
  return `<span style="font-size:10px;padding:2px 7px;border-radius:3px;font-weight:600;font-family:var(--font-body);${style}">${label}</span>`;
}

export function renderMembrosTable(tbl, data) {
  if (!tbl) return;
  if (!data.length) {
    tbl.innerHTML = `<thead><tr><th>Nome</th><th>Liga</th><th>Cargo</th><th>Presença</th><th>Entregas</th><th>Adv.</th><th></th></tr></thead><tbody></tbody>`;
    renderEmptyState(tbl.querySelector('tbody'), emptyStateConfig());
    return;
  }
  tbl.innerHTML = `<thead><tr><th>Nome</th><th>Liga</th><th>Cargo</th><th>Presença</th><th>Entregas</th><th>Adv.</th><th></th></tr></thead>
  <tbody>${data.map(m => `<tr>
    <td style="font-weight:500">${m.name}</td>
    <td>${ligaPill(m.liga)}</td>
    <td>${cargoPill(m.cargo)}</td>
    <td>${progressCell(m.presenca)}</td>
    <td style="color:var(--mid)">${m.entregas}</td>
    ${advCell(m.adv)}
    <td style="display:flex;gap:.375rem">
      <a href="/membros/diretoria/perfil-membro?id=${m.id}" class="btn-sm ghost" style="font-size:10px;padding:3px 8px;text-decoration:none">Ver</a>
      <button class="btn-sm ghost" style="font-size:10px;padding:3px 8px" onclick="openAdvModal('${m.id}', '${m.name}')">Anotar</button>
      <button class="btn-sm ghost" style="font-size:10px;padding:3px 8px" onclick="openEditModal('${m.id}', '${m.name.replace(/'/g, "\\'")}', '${m.liga}', '${m.cargo || 'membro'}')">Editar</button>
    </td>
  </tr>`).join('')}</tbody>`;
}
