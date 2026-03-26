import { supabase } from '/assets/js/supabase/client.js';

export async function getAvisos() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: usuario } = await supabase
    .from('usuarios').select('liga_id').eq('id', user.id).single();

  const { data, error } = await supabase
    .from('avisos')
    .select('*')
    .or(`liga_id.eq.${usuario?.liga_id},liga_id.is.null`)
    .order('criado_em', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data || [];
}

export async function publicarAviso(titulo, mensagem, ligaId = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { data, error } = await supabase
    .from('avisos')
    .insert({ titulo, mensagem, liga_id: ligaId, publicado_por: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}
