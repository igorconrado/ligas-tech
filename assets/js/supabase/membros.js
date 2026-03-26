import { supabase } from '/assets/js/supabase/client.js';

export async function getMeuPerfil() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('membros')
    .select('*, ligas(nome, cor)')
    .eq('usuario_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getMembrosLiga(ligaId = null) {
  let query = supabase
    .from('membros')
    .select('*, ligas(nome, cor), usuarios(role)')
    .eq('ativo', true)
    .order('nome');

  if (ligaId) query = query.eq('liga_id', ligaId);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function atualizarPerfil(updates) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { data, error } = await supabase
    .from('membros')
    .update(updates)
    .eq('usuario_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function completarOnboarding(dados) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { data, error } = await supabase
    .from('membros')
    .upsert({
      usuario_id: user.id,
      nome: dados.nome,
      linkedin: dados.linkedin || null,
      github: dados.github || null,
      bio: dados.bio || null,
      onboarding_completo: true
    }, { onConflict: 'usuario_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}
