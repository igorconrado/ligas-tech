import { supabase } from '/assets/js/supabase/client.js';

export async function registrarPresenca(codigoDigitado) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { data: membro } = await supabase
    .from('membros')
    .select('id, liga_id')
    .eq('usuario_id', user.id)
    .maybeSingle();

  if (!membro) throw new Error('Perfil de membro não encontrado');

  let encontroQuery = supabase
    .from('encontros')
    .select('id, codigo_expira_em, aberto')
    .eq('codigo_presenca', codigoDigitado.trim())
    .eq('aberto', true);
  if (membro.liga_id) encontroQuery = encontroQuery.eq('liga_id', membro.liga_id);

  const { data: encontro } = await encontroQuery.maybeSingle();

  if (!encontro) throw new Error('Código inválido. Verifique o código e tente novamente.');

  const { data: jaExiste } = await supabase
    .from('presencas')
    .select('id')
    .eq('membro_id', membro.id)
    .eq('encontro_id', encontro.id)
    .maybeSingle();

  if (jaExiste) throw new Error('Presença já registrada neste encontro');

  const { error } = await supabase
    .from('presencas')
    .insert({ membro_id: membro.id, encontro_id: encontro.id, status: 'presente' });

  if (error) throw error;
  return { ok: true };
}

export async function getMinhasPresencas() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: membro } = await supabase
    .from('membros').select('id').eq('usuario_id', user.id).maybeSingle();
  if (!membro) return [];

  const { data, error } = await supabase
    .from('presencas')
    .select('*, encontros(titulo, data)')
    .eq('membro_id', membro.id)
    .order('criado_em', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getPresencasMembro(membroId) {
  const { data, error } = await supabase
    .from('presencas')
    .select('*, encontros(titulo, data)')
    .eq('membro_id', membroId)
    .order('criado_em', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getProximoEncontro() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membro } = await supabase
    .from('membros').select('liga_id').eq('usuario_id', user.id).maybeSingle();
  if (!membro?.liga_id) return null;

  // Usa data local (YYYY-MM-DD) para evitar shift de timezone
  const hoje = new Date();
  const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('encontros')
    .select('id, titulo, data')
    .eq('liga_id', membro.liga_id)
    .gte('data', hojeStr)
    .order('data', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export function calcularAlertaFrequencia(presencas, totalEncontros) {
  if (totalEncontros === 0) return { status: 'ok', percentual: 0 };
  const ausencias = presencas.filter(p => p.status === 'ausente').length;
  const percentual = (ausencias / totalEncontros) * 100;
  if (percentual >= 25) return { status: 'risco', percentual };
  if (percentual >= 15) return { status: 'atencao', percentual };
  return { status: 'ok', percentual };
}

export async function abrirChamada(encontroId) {
  const { data, error } = await supabase.rpc('abrir_chamada', { encontro_id: encontroId });
  if (error) throw error;
  return { codigo: data.codigo, expira: data.expira };
}

export async function fecharChamada(encontroId) {
  const { error } = await supabase
    .from('encontros')
    .update({ aberto: false, codigo_presenca: null, codigo_expira_em: null })
    .eq('id', encontroId);

  if (error) throw error;
}

export async function corrigirPresenca(membroId, encontroId, novoStatus) {
  const { error } = await supabase
    .from('presencas')
    .upsert(
      { membro_id: membroId, encontro_id: encontroId, status: novoStatus },
      { onConflict: 'membro_id,encontro_id' }
    );
  if (error) throw error;
}

export function assinarPresencasEncontro(encontroId, onUpdate) {
  return supabase
    .channel(`presencas-encontro-${encontroId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'presencas',
      filter: `encontro_id=eq.${encontroId}`
    }, onUpdate)
    .subscribe();
}

// Diretoria: criar encontro
export async function criarEncontro(ligaId, titulo, data) {
  const { data: encontro, error } = await supabase
    .from('encontros')
    .insert({
      liga_id: ligaId,
      titulo,
      data,
      aberto: false
    })
    .select()
    .single();

  if (error) throw error;
  return encontro;
}

// Diretoria: listar encontros da liga
export async function getEncontros(ligaId) {
  const { data, error } = await supabase
    .from('encontros')
    .select('*')
    .eq('liga_id', ligaId)
    .order('data', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Diretoria: histórico com contagem e detalhes de presenças
export async function getHistoricoEncontros(ligaId) {
  const { data, error } = await supabase
    .from('encontros')
    .select('id, titulo, data, aberto, presencas(status, membros(nome))')
    .eq('liga_id', ligaId)
    .order('data', { ascending: false });

  if (error) throw error;
  return (data || []).map(e => {
    const presencas = e.presencas || [];
    const membros = presencas
      .map(p => ({ nome: p.membros?.nome || '?', status: p.status }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
    return {
      id: e.id,
      titulo: e.titulo,
      data: e.data,
      aberto: e.aberto,
      presentes: presencas.filter(p => p.status === 'presente').length,
      total: presencas.length,
      membros,
    };
  });
}

// Diretoria: excluir encontro
export async function excluirEncontro(encontroId) {
  const { error } = await supabase
    .from('encontros')
    .delete()
    .eq('id', encontroId);
  if (error) throw error;
}

// Diretoria: ver presenças de um encontro
export async function getPresencasEncontro(encontroId) {
  const { data, error } = await supabase
    .from('presencas')
    .select('*, membros(nome)')
    .eq('encontro_id', encontroId);

  if (error) throw error;
  return data || [];
}
