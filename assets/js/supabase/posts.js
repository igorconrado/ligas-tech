import { supabase } from '/assets/js/supabase/client.js';

export const CATEGORIAS = {
  hackathon:    { label: 'Hackathon',    cor: 'red' },
  projeto:      { label: 'Projeto',      cor: 'blue' },
  conhecimento: { label: 'Conhecimento', cor: 'green' },
};

export async function getPosts({ categoria, publicadoOnly = true } = {}) {
  let q = supabase
    .from('posts')
    .select('id, titulo, conteudo, categoria, liga_id, publicado, criado_em, ligas(nome)')
    .order('criado_em', { ascending: false });

  if (publicadoOnly) q = q.eq('publicado', true);
  if (categoria) q = q.eq('categoria', categoria);

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getPost(id) {
  const { data, error } = await supabase
    .from('posts')
    .select('*, ligas(nome), usuarios(email)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function criarPost({ titulo, conteudo, categoria, liga_id }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { data, error } = await supabase
    .from('posts')
    .insert({ titulo, conteudo, categoria, liga_id: liga_id || null, publicado_por: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function atualizarPost(id, campos) {
  const { data, error } = await supabase
    .from('posts')
    .update({ ...campos, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletarPost(id) {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw error;
}
