import { supabase } from '/assets/js/supabase/client.js';

export async function getMeuPerfil() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data, error }, { data: usuarioData }] = await Promise.all([
    supabase.from('membros').select('*, ligas(nome, cor)').eq('usuario_id', user.id).maybeSingle(),
    supabase.from('usuarios').select('role').eq('id', user.id).maybeSingle(),
  ]);

  if (error) throw error;
  return data ? { ...data, role: usuarioData?.role || 'membro' } : null;
}

export async function getMembrosLiga(ligaId = null) {
  let query = supabase
    .from('membros')
    .select('*, ligas(nome, cor)')
    .eq('ativo', true)
    .order('nome');

  if (ligaId) query = query.eq('liga_id', ligaId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
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

export async function uploadAvatar(file) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const ext = file.name.split('.').pop().toLowerCase();
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) {
    if (uploadError.message?.includes('Bucket not found')) {
      throw new Error('Bucket de storage não configurado. Crie o bucket "avatars" no Supabase Dashboard → Storage.');
    }
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(path);

  // Adiciona cache-buster para forçar reload da imagem após troca
  const url = `${publicUrl}?t=${Date.now()}`;
  await atualizarPerfil({ avatar_url: url });
  return url;
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
    // Busca liga_id pré-atribuída ou usa IbTech como padrão
    const { data: emailData } = await supabase
      .from('emails_autorizados')
      .select('liga_id')
      .eq('email', user.email)
      .maybeSingle();

    let liga_id = emailData?.liga_id || null;
    if (!liga_id) {
      const { data: ibtech } = await supabase
        .from('ligas').select('id').eq('nome', 'IbTech').maybeSingle();
      liga_id = ibtech?.id || null;
    }

    ({ error } = await supabase
      .from('membros')
      .insert({ ...payload, usuario_id: user.id, ativo: true, liga_id }));

    // Sempre sincroniza liga_id em usuarios
    await supabase.from('usuarios').update({ liga_id }).eq('id', user.id);
  }

  if (error) {
    console.error('[completarOnboarding] erro Supabase:', error);
    throw error;
  }
}
