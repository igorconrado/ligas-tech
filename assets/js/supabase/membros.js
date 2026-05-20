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

  const { error } = await supabase
    .from('membros')
    .update(updates)
    .eq('usuario_id', user.id);

  if (error) {
    console.error('[atualizarPerfil] erro Supabase:', error);
    throw error;
  }
}

export async function completarOnboarding(dados) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const payload = {
    nome: dados.nome,
    linkedin: dados.linkedin || null,
    github: dados.github || null,
    bio: dados.bio || null,
    onboarding_completo: true
  };

  // Verifica se linha em membros já existe
  const { data: existing } = await supabase
    .from('membros')
    .select('id')
    .eq('usuario_id', user.id)
    .maybeSingle();

  let error;

  if (existing) {
    ({ error } = await supabase
      .from('membros')
      .update(payload)
      .eq('usuario_id', user.id));
  } else {
    // Busca liga_id pré-atribuída pela diretoria em emails_autorizados
    const { data: emailData } = await supabase
      .from('emails_autorizados')
      .select('liga_id')
      .eq('email', user.email)
      .maybeSingle();
    const liga_id = emailData?.liga_id || null;

    ({ error } = await supabase
      .from('membros')
      .insert({ ...payload, usuario_id: user.id, ativo: true, liga_id }));

    // Sincroniza liga_id em usuarios também
    if (liga_id) {
      await supabase.from('usuarios').update({ liga_id }).eq('id', user.id);
    }
  }

  if (error) {
    console.error('[completarOnboarding] erro Supabase:', error);
    throw error;
  }
}
