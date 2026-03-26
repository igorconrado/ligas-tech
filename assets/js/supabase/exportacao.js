import { supabase } from '/assets/js/supabase/client.js';

function downloadCSV(conteudo, nomeArquivo) {
  const blob = new Blob(['\uFEFF' + conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportarTodosRegistros(ligaId) {
  const { data } = await supabase
    .from('presencas')
    .select('status, criado_em, membros(nome), encontros(titulo, data)')
    .eq('encontros.liga_id', ligaId)
    .order('criado_em', { ascending: false });

  const header = 'Membro,Encontro,Data,Status\n';
  const rows = (data || []).map(p =>
    `"${p.membros?.nome}","${p.encontros?.titulo}","${p.encontros?.data}","${p.status}"`
  ).join('\n');

  downloadCSV(header + rows, 'presencas-completo.csv');
}

export async function exportarResumoPorMembro(ligaId) {
  const { data: membros } = await supabase
    .from('membros').select('id, nome').eq('liga_id', ligaId).eq('ativo', true);

  const { data: encontros } = await supabase
    .from('encontros').select('id').eq('liga_id', ligaId);

  const totalEncontros = (encontros || []).length;

  const { data: presencas } = await supabase
    .from('presencas').select('membro_id, status');

  const header = 'Membro,Total Encontros,Presentes,Ausentes,Justificados,% Ausência,Status\n';
  const rows = (membros || []).map(m => {
    const mp = (presencas || []).filter(p => p.membro_id === m.id);
    const presentes = mp.filter(p => p.status === 'presente').length;
    const ausentes = mp.filter(p => p.status === 'ausente').length;
    const justificados = mp.filter(p => p.status === 'justificado').length;
    const pct = totalEncontros > 0 ? ((ausentes / totalEncontros) * 100).toFixed(1) : '0.0';
    const status = pct >= 25 ? 'RISCO' : pct >= 15 ? 'ATENÇÃO' : 'OK';
    return `"${m.nome}",${totalEncontros},${presentes},${ausentes},${justificados},${pct}%,${status}`;
  }).sort((a, b) => parseFloat(b.split(',')[5]) - parseFloat(a.split(',')[5]));

  downloadCSV(header + rows.join('\n'), 'resumo-membros.csv');
}

export async function exportarPorEncontro(ligaId) {
  const { data: encontros } = await supabase
    .from('encontros').select('id, titulo, data').eq('liga_id', ligaId).order('data');

  const { data: presencas } = await supabase
    .from('presencas').select('encontro_id, status');

  const { data: membros } = await supabase
    .from('membros').select('id').eq('liga_id', ligaId).eq('ativo', true);

  const totalMembros = (membros || []).length;

  const header = 'Encontro,Data,Total Membros,Presentes,Ausentes,Justificados,% Presença\n';
  const rows = (encontros || []).map(e => {
    const ep = (presencas || []).filter(p => p.encontro_id === e.id);
    const presentes = ep.filter(p => p.status === 'presente').length;
    const ausentes = ep.filter(p => p.status === 'ausente').length;
    const justificados = ep.filter(p => p.status === 'justificado').length;
    const pct = totalMembros > 0 ? ((presentes / totalMembros) * 100).toFixed(1) : '0.0';
    return `"${e.titulo}","${e.data}",${totalMembros},${presentes},${ausentes},${justificados},${pct}%`;
  });

  downloadCSV(header + rows.join('\n'), 'por-encontro.csv');
}

export async function exportarRelatorioFrequencia(ligaId) {
  const { data: membros } = await supabase
    .from('membros').select('id, nome').eq('liga_id', ligaId).eq('ativo', true);

  const { data: encontros } = await supabase
    .from('encontros').select('id').eq('liga_id', ligaId);

  const totalEncontros = (encontros || []).length;

  const { data: presencas } = await supabase
    .from('presencas').select('membro_id, status');

  const categorias = { risco: [], atencao: [], ok: [] };

  (membros || []).forEach(m => {
    const mp = (presencas || []).filter(p => p.membro_id === m.id);
    const ausentes = mp.filter(p => p.status === 'ausente').length;
    const pct = totalEncontros > 0 ? (ausentes / totalEncontros) * 100 : 0;
    const linha = `"${m.nome}",${pct.toFixed(1)}%`;
    if (pct >= 25) categorias.risco.push(linha);
    else if (pct >= 15) categorias.atencao.push(linha);
    else categorias.ok.push(linha);
  });

  const conteudo = [
    'EM RISCO (>= 25% ausências injustificadas)',
    'Membro,% Ausência',
    ...categorias.risco,
    '',
    'ATENÇÃO (>= 15% ausências injustificadas)',
    'Membro,% Ausência',
    ...categorias.atencao,
    '',
    'OK (< 15% ausências injustificadas)',
    'Membro,% Ausência',
    ...categorias.ok
  ].join('\n');

  downloadCSV(conteudo, 'relatorio-frequencia.csv');
}
