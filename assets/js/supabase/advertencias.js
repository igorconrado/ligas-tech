import { supabase } from '/assets/js/supabase/client.js';

// Diretoria: registrar advertência
export async function registrarAdvertencia(membroId, tipo, descricao) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { data, error } = await supabase
    .from('advertencias')
    .insert({
      membro_id: membroId,
      tipo, // 'leve' ou 'grave'
      descricao,
      registrado_por: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Diretoria: listar advertências de um membro
export async function getAdvertenciasMembro(membroId) {
  const { data, error } = await supabase
    .from('advertencias')
    .select('*')
    .eq('membro_id', membroId)
    .order('criado_em', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Diretoria: listar todas as advertências da liga
export async function getTodasAdvertencias(ligaId) {
  const { data, error } = await supabase
    .from('advertencias')
    .select('*, membros(nome, liga_id)')
    .eq('membros.liga_id', ligaId)
    .order('criado_em', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Membro: ver próprias advertências
export async function getMinhasAdvertencias() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: membro } = await supabase
    .from('membros')
    .select('id')
    .eq('usuario_id', user.id)
    .single();

  if (!membro) return [];

  return getAdvertenciasMembro(membro.id);
}
