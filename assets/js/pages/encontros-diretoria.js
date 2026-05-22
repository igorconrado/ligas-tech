// ── Página: Encontros/Chamada (diretoria) ──
import { shell } from '/assets/js/ui/shell.js';
import { openModal, closeModal, initModalEscape } from '/assets/js/components/modal.js';
import { getMembrosLiga } from '/assets/js/supabase/membros.js';
import { abrirChamada, fecharChamada, assinarPresencasEncontro, getEncontros, criarEncontro, corrigirPresenca, excluirEncontro, getHistoricoEncontros } from '/assets/js/supabase/presenca.js';
import { exportarTodosRegistros, exportarResumoPorMembro, exportarPorEncontro, exportarRelatorioFrequencia } from '/assets/js/supabase/exportacao.js';
import { renderEmptyState, icons } from '/assets/js/ui/empty-state.js';
import { toast } from '/assets/js/ui/toast.js';
import { confirmDialog } from '/assets/js/ui/confirm.js';

const { usuario } = await shell.mount({ activeRoute: '/membros/diretoria/encontros', pageTitle: 'Encontros' });
const ligaId = usuario?.liga_id || null;

const $ = (id) => document.getElementById(id);

initModalEscape();

let members = [];
let presenceMembers = [];
let presentSet = new Set();
let chamadaAberta = false;
let encontroAtivoId = null;

async function carregarMembros() {
  try {
    const data = await getMembrosLiga(ligaId);
    members = data.map(m => ({ id: m.id, name: m.nome, liga: m.ligas?.nome || '—' }));
    renderPresenca();
  } catch (e) {
    console.error('Erro ao carregar membros:', e);
  }
}

async function carregarEncontros() {
  try {
    const encontros = await getEncontros(ligaId);
    const select = $('select-encontro');
    if (!encontros.length) {
      select.innerHTML = '<option value="">Nenhum encontro cadastrado</option>';
      return;
    }
    select.innerHTML = encontros.map(e => `
      <option value="${e.id}">${e.titulo} — ${new Date(e.data).toLocaleDateString('pt-BR')}</option>
    `).join('');
  } catch (e) {
    console.error('Erro ao carregar encontros:', e);
  }
}

function renderPresenca() {
  const grid = $('presenca-grid');
  if (!chamadaAberta) {
    renderEmptyState(grid, {
      icon: icons.clock,
      title: 'Nenhuma chamada aberta agora',
      description: 'Selecione um encontro e gere um QR Code pra abrir a chamada.',
    });
    $('presenca-count').textContent = 0;
    $('presenca-total').textContent = 0;
    return;
  }
  presenceMembers = members.map(m => m.name);
  grid.innerHTML = presenceMembers.map((name, i) => {
    const on = presentSet.has(i);
    return `<div class="member-chip ${on ? 'present' : ''}" onclick="togglePresenca(${i})">
      <div class="check ${on ? 'on' : 'off'}">${on ? '✓' : ''}</div>
      <span class="chip-name">${name}</span>
    </div>`;
  }).join('');
  $('presenca-count').textContent = presentSet.size;
  $('presenca-total').textContent = presenceMembers.length;
}

function togglePresenca(i) {
  if (presentSet.has(i)) presentSet.delete(i); else presentSet.add(i);
  renderPresenca();
}

function markAll() {
  presenceMembers.forEach((_, i) => presentSet.add(i));
  renderPresenca();
}

async function savePresenca() {
  if (!encontroAtivoId) { toast.error('Nenhuma chamada aberta.'); return; }
  const btn = $('btn-salvar-presenca');
  if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }
  try {
    await Promise.all(members.map((m, i) =>
      corrigirPresenca(m.id, encontroAtivoId, presentSet.has(i) ? 'presente' : 'ausente')
    ));
    $('chamada-badge').textContent = 'Salva';
    $('chamada-badge').className = 'chamada-badge closed';
    toast.success('Presença salva.');
  } catch (e) {
    console.error('Erro ao salvar presença:', e);
    toast.error('Erro ao salvar presença.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Salvar'; }
  }
}

async function handleCriarEncontro() {
  const titulo = $('encontro-titulo')?.value?.trim();
  const data = $('encontro-data')?.value;
  if (!titulo || !data) {
    toast.error('Preencha o título e a data.');
    return;
  }
  if (!ligaId) {
    toast.error('Seu perfil não está vinculado a uma liga.');
    return;
  }
  try {
    await criarEncontro(ligaId, titulo, data);
    closeModal('modal-encontro');
    await carregarEncontros();
    await carregarHistorico();
    toast.success('Encontro criado.');
  } catch (e) {
    console.error('Erro ao criar encontro:', e);
    toast.error(e.message || 'Erro ao criar encontro');
  }
}

async function handleExcluirEncontro(id, titulo) {
  const ok = await confirmDialog({
    title: 'Excluir encontro?',
    message: `"${titulo}" e todas as presenças registradas serão removidos permanentemente.`,
    confirmLabel: 'Excluir',
    danger: true,
  });
  if (!ok) return;
  try {
    await excluirEncontro(id);
    if (encontroAtivoId === id) {
      chamadaAberta = false;
      encontroAtivoId = null;
      renderPresenca();
      $('chamada-badge').textContent = 'Fechada';
      $('chamada-badge').className = 'chamada-badge closed';
      const btn = $('btn-abrir-chamada');
      if (btn) { btn.textContent = 'Gerar QR Code'; btn.onclick = handleAbrirChamada; btn.disabled = false; }
    }
    await carregarEncontros();
    await carregarHistorico();
    toast.success('Encontro excluído.');
  } catch (e) {
    console.error('Erro ao excluir encontro:', e);
    toast.error(e.message || 'Erro ao excluir encontro');
  }
}

function toggleDetalhe(id) {
  const row = document.getElementById(`detalhe-${id}`);
  const btn = document.getElementById(`btn-expand-${id}`);
  if (!row || !btn) return;
  const aberto = row.style.display !== 'none';
  row.style.display = aberto ? 'none' : 'table-row';
  btn.textContent = aberto ? '▶ Ver detalhes' : '▼ Ocultar';
}

async function carregarHistorico() {
  const tbl = $('historico-tbl');
  if (!tbl) return;
  try {
    const encontros = await getHistoricoEncontros(ligaId);
    if (!encontros.length) {
      tbl.innerHTML = `<tbody><tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--muted);font-size:12px">Nenhum encontro registrado ainda.</td></tr></tbody>`;
      return;
    }
    tbl.innerHTML = `
      <thead><tr>
        <th>Título</th><th>Data</th><th>Presença</th><th></th><th></th>
      </tr></thead>
      <tbody>
        ${encontros.map(e => {
          const dataFmt = new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR');
          const pct = e.total ? Math.round((e.presentes / e.total) * 100) : 0;
          const statusCor = pct >= 75 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)';
          const badge = e.aberto
            ? `<span style="background:var(--green);color:#000;font-size:10px;padding:2px 6px;border-radius:3px;font-weight:600;margin-left:.5rem">ABERTA</span>`
            : '';
          const chips = e.membros.length
            ? e.membros.map(m => {
                const presente = m.status === 'presente';
                const cor = presente ? 'var(--green)' : 'var(--red)';
                const icon = presente ? '✓' : '✗';
                return `<span style="display:inline-flex;align-items:center;gap:.3rem;background:var(--bg3);border:1px solid ${cor}33;border-radius:4px;padding:3px 8px;font-size:11px;font-family:var(--font-body)">
                  <span style="color:${cor};font-weight:700">${icon}</span>${m.nome}
                </span>`;
              }).join('')
            : `<span style="color:var(--muted);font-size:12px">Nenhuma presença registrada.</span>`;

          return `
            <tr>
              <td style="font-weight:500">${e.titulo}${badge}</td>
              <td style="font-family:var(--font-mono);font-size:12px;color:var(--muted)">${dataFmt}</td>
              <td style="font-family:var(--font-mono);font-size:12px">
                <span style="color:${statusCor};font-weight:600">${e.presentes}</span>
                <span style="color:var(--muted)">/ ${e.total}</span>
                ${e.total ? `<span style="color:var(--muted);margin-left:.25rem">(${pct}%)</span>` : ''}
              </td>
              <td>
                <button id="btn-expand-${e.id}" class="btn-sm ghost" onclick="toggleDetalhe('${e.id}')">▶ Ver detalhes</button>
              </td>
              <td style="text-align:right">
                <button class="btn-sm ghost" style="color:var(--red);border-color:var(--red)"
                  onclick="handleExcluirEncontro('${e.id}', '${e.titulo.replace(/'/g, "\\'")}')">Excluir</button>
              </td>
            </tr>
            <tr id="detalhe-${e.id}" style="display:none">
              <td colspan="5" style="background:var(--bg2);padding:1rem 1.25rem;border-top:none">
                <div style="display:flex;flex-wrap:wrap;gap:.4rem">${chips}</div>
              </td>
            </tr>`;
        }).join('')}
      </tbody>`;
  } catch (e) {
    console.error('Erro ao carregar histórico:', e);
  }
}

async function handleAbrirChamada() {
  const encontroId = $('select-encontro')?.value;
  if (!encontroId) { toast.error('Selecione um encontro primeiro.'); return; }
  try {
    const { codigo, expira } = await abrirChamada(encontroId);
    encontroAtivoId = encontroId;
    if ($('qr-display')) $('qr-display').textContent = codigo;
    if ($('qr-expira')) {
      const mins = Math.floor((new Date(expira) - new Date()) / 60000);
      $('qr-expira').textContent = `Expira em ${mins} minutos`;
    }
    openModal('qr-modal');
    chamadaAberta = true;
    renderPresenca();
    $('chamada-badge').textContent = 'Aberta';
    $('chamada-badge').className = 'chamada-badge open';
    window._chamadaChannel = assinarPresencasEncontro(encontroId, () => renderPresenca());
    const btn = $('btn-abrir-chamada');
    if (btn) { btn.textContent = 'Fechar Chamada'; btn.onclick = () => handleFecharChamada(encontroId); }
  } catch (e) {
    console.error('Erro:', e);
    toast.error('Erro ao abrir chamada. Tente novamente.');
  }
}

async function handleFecharChamada(encontroId) {
  const ok = await confirmDialog({
    title: 'Encerrar chamada?',
    message: 'Presenças não registradas vão ficar em branco. Você pode corrigi-las depois.',
    confirmLabel: 'Encerrar',
  });
  if (!ok) return;
  const btn = $('btn-abrir-chamada');
  if (btn) { btn.disabled = true; btn.textContent = 'Encerrando...'; }
  closeModal('qr-modal');
  try {
    await fecharChamada(encontroId);
    if (window._chamadaChannel) { window._chamadaChannel.unsubscribe(); window._chamadaChannel = null; }
    chamadaAberta = false;
    encontroAtivoId = null;
    renderPresenca();
    $('chamada-badge').textContent = 'Fechada';
    $('chamada-badge').className = 'chamada-badge closed';
    if (btn) { btn.disabled = false; btn.textContent = 'Abrir Chamada'; btn.onclick = handleAbrirChamada; }
    toast.success('Chamada encerrada');
  } catch (e) {
    console.error('Erro:', e);
    toast.error(e.message || 'Erro ao encerrar chamada');
    if (btn) { btn.disabled = false; btn.textContent = 'Fechar Chamada'; }
  }
}

window.openModal = openModal;
window.closeModal = closeModal;
window.togglePresenca = togglePresenca;
window.markAll = markAll;
window.savePresenca = savePresenca;
window.handleCriarEncontro = handleCriarEncontro;
window.handleAbrirChamada = handleAbrirChamada;
window.handleFecharChamada = handleFecharChamada;
window.handleExcluirEncontro = handleExcluirEncontro;
window.toggleDetalhe = toggleDetalhe;

$('btn-export-todos')?.addEventListener('click', () => exportarTodosRegistros(ligaId));
$('btn-export-membros')?.addEventListener('click', () => exportarResumoPorMembro(ligaId));
$('btn-export-encontros')?.addEventListener('click', () => exportarPorEncontro(ligaId));
$('btn-export-frequencia')?.addEventListener('click', () => exportarRelatorioFrequencia(ligaId));

await carregarMembros();
await carregarEncontros();
await carregarHistorico();
