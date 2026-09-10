import { getTodasAulas, getEntregasAula } from '/assets/js/supabase/aulas.js';
import { getEncontros, getPresencasEncontro } from '/assets/js/supabase/presenca.js';
import { getTodasAdvertencias } from '/assets/js/supabase/advertencias.js';

/**
 * Acrescenta indicadores reais aos membros para uso nas telas da diretoria.
 * Ausência de histórico é representada por null/—, nunca por um zero simulado.
 */
export async function hydrateMemberMetrics(ligaId, members) {
  const [encontros, aulas, advertencias] = await Promise.all([
    getEncontros(ligaId),
    getTodasAulas(ligaId),
    getTodasAdvertencias(ligaId),
  ]);

  const hoje = new Date();
  hoje.setHours(23, 59, 59, 999);
  const encontrosRealizados = encontros.filter(e => new Date(`${e.data}T12:00:00`) <= hoje);
  const tarefas = aulas.filter(a => a.tipo === 'tarefa' && a.publicada && a.prazo_entrega);
  const [presencasPorEncontro, entregasPorAula] = await Promise.all([
    Promise.all(encontrosRealizados.map(e => getPresencasEncontro(e.id))),
    Promise.all(tarefas.map(a => getEntregasAula(a.id))),
  ]);

  const presencas = new Map();
  presencasPorEncontro.flat().forEach(p => {
    const atual = presencas.get(p.membro_id) || 0;
    if (p.status === 'presente') presencas.set(p.membro_id, atual + 1);
    else if (!presencas.has(p.membro_id)) presencas.set(p.membro_id, atual);
  });

  const entregues = new Map();
  const tarefasEntregues = new Map();
  entregasPorAula.flat().forEach(e => {
    if (e.status === 'entregue') {
      entregues.set(e.membro_id, (entregues.get(e.membro_id) || 0) + 1);
      if (!tarefasEntregues.has(e.membro_id)) tarefasEntregues.set(e.membro_id, new Set());
      tarefasEntregues.get(e.membro_id).add(e.aula_id);
    }
  });

  const advPorMembro = new Map();
  advertencias.forEach(a => advPorMembro.set(a.membro_id, (advPorMembro.get(a.membro_id) || 0) + 1));

  return members.map(member => {
    const presentes = presencas.get(member.id) || 0;
    const presenca = encontrosRealizados.length ? Math.round((presentes / encontrosRealizados.length) * 100) : null;
    const totalEntregues = entregues.get(member.id) || 0;
    const adv = advPorMembro.get(member.id) || 0;
    const idsEntregues = tarefasEntregues.get(member.id) || new Set();
    const temEntregaAtrasada = tarefas.some(tarefa =>
      new Date(`${tarefa.prazo_entrega}T23:59:59`) < hoje && !idsEntregues.has(tarefa.id)
    );
    const precisaAtencao = (presenca !== null && presenca < 75) || temEntregaAtrasada;

    return {
      ...member,
      presenca,
      entregas: tarefas.length ? `${totalEntregues}/${tarefas.length}` : '—',
      status: adv > 0 ? 'adv' : precisaAtencao ? 'warn' : 'ok',
      adv,
    };
  });
}
