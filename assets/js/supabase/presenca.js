import { supabase } from '/assets/js/supabase/client.js';

export async function registrarPresenca(codigoDigitado) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { data: membro } = await supabase
    .from('membros')
    .select('id, liga_id')
    .eq('usuario_id', user.id)
    .single();

  if (!membro) throw new Error('Perfil de membro não encontrado');

  const { data: encontro } = await supabase
    .from('encontros')
    .select('id, codigo_expira_em, aberto')
    .eq('codigo_presenca', codigoDigitado.trim())
    .eq('liga_id', membro.liga_id)
    .eq('aberto', true)
    .single();

  if (!encontro) throw new Error('Código inválido ou expirado');
  if (new Date(encontro.codigo_expira_em) < new Date()) throw new Error('Código expirado. Peça um novo à diretoria');

  const { data: jaExiste } = await supabase
    .from('presencas')
    .select('id')
    .eq('membro_id', membro.id)
    .eq('encontro_id', encontro.id)
    .single();

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
    .from('membros').select('id').eq('usuario_id', user.id).single();
  if (!membro) return [];

  const { data, error } = await supabase
    .from('presencas')
    .select('*, encontros(titulo, data)')
    .eq('membro_id', membro.id)
    .order('criado_em', { ascending: false });

  if (error) throw error;
  return data || [];
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
  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
  const expira = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('encontros')
    .update({ codigo_presenca: codigo, codigo_expira_em: expira, aberto: true })
    .eq('id', encontroId)
    .select()
    .single();

  if (error) throw error;
  return { codigo, expira, encontro: data };
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
