import { supabase } from '/assets/js/supabase/client.js';

export async function getAvisos() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: membro } = await supabase
    .from('membros').select('liga_id').eq('usuario_id', user.id).maybeSingle();

  let query = supabase.from('avisos').select('*').order('criado_em', { ascending: false }).limit(10);
  if (membro?.liga_id) {
    query = query.or(`liga_id.eq.${membro.liga_id},liga_id.is.null`);
  } else {
    query = query.is('liga_id', null);
  }
  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function deletarAviso(avisoId) {
  const { error } = await supabase.from('avisos').delete().eq('id', avisoId);
  if (error) throw error;
}

export async function publicarAviso(titulo, mensagem, ligaId = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { error } = await supabase
    .from('avisos')
    .insert({ titulo, mensagem, liga_id: ligaId, publicado_por: user.id });

  if (error) throw error;
}
