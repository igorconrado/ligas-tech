import { supabase } from '/assets/js/supabase/client.js';

export async function getAulasComEntregas() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: membro } = await supabase
    .from('membros').select('id, liga_id').eq('usuario_id', user.id).maybeSingle();
  if (!membro?.liga_id) return [];

  const { data: aulas } = await supabase
    .from('aulas')
    .select('*')
    .eq('liga_id', membro.liga_id)
    .eq('publicada', true)
    .order('numero');

  if (!aulas) return [];

  const tarefas = aulas.filter(a => a.tipo === 'tarefa');

  const { data: entregas } = await supabase
    .from('entregas')
    .select('*')
    .eq('membro_id', membro.id);

  const entregasMap = {};
  (entregas || []).forEach(e => { entregasMap[e.aula_id] = e; });

  const now = new Date();
  return tarefas.map(aula => {
    const entrega = entregasMap[aula.id] || null;
    let statusEntrega = 'pendente';
    if (entrega) {
      statusEntrega = entrega.status;
    } else if (aula.prazo_entrega && new Date(aula.prazo_entrega) < now) {
      statusEntrega = 'atrasada';
    }
    return { ...aula, entrega, statusEntrega };
  });
}

export async function getAulasPublicadas() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { aulas: [], tarefas: [] };

  const { data: membro } = await supabase
    .from('membros').select('id, liga_id').eq('usuario_id', user.id).maybeSingle();
  if (!membro?.liga_id) return { aulas: [], tarefas: [] };

  const { data: itens } = await supabase
    .from('aulas')
    .select('*')
    .eq('liga_id', membro.liga_id)
    .eq('publicada', true)
    .order('numero');

  if (!itens) return { aulas: [], tarefas: [] };

  const tarefasRaw = itens.filter(a => a.tipo === 'tarefa');

  const { data: entregas } = await supabase
    .from('entregas')
    .select('*')
    .eq('membro_id', membro.id);

  const entregasMap = {};
  (entregas || []).forEach(e => { entregasMap[e.aula_id] = e; });

  const now = new Date();
  const tarefas = tarefasRaw.map(a => {
    const entrega = entregasMap[a.id] || null;
    let statusEntrega = 'pendente';
    if (entrega) statusEntrega = entrega.status;
    else if (a.prazo_entrega && new Date(a.prazo_entrega) < now) statusEntrega = 'atrasada';
    return { ...a, entrega, statusEntrega };
  });

  return {
    aulas: itens.filter(a => a.tipo === 'aula'),
    tarefas,
  };
}

export async function submeterEntrega(aulaId, repoUrl, mensagem = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { data: membro } = await supabase
    .from('membros').select('id').eq('usuario_id', user.id).maybeSingle();
  if (!membro) throw new Error('Perfil não encontrado');

  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/\s]+)/);
  if (!match) throw new Error('URL do GitHub inválida');

  const [, owner, repo] = match;
  const repoClean = repo.replace(/\.git$/, '');

  const res = await fetch(`https://api.github.com/repos/${owner}/${repoClean}`);
  if (!res.ok) throw new Error('Repositório não encontrado ou privado');
  const repoData = await res.json();
  if (repoData.private) throw new Error('O repositório precisa ser público');

  const { error } = await supabase
    .from('entregas')
    .upsert(
      { membro_id: membro.id, aula_id: aulaId, repo_url: repoUrl, mensagem: mensagem || null, status: 'entregue', entregue_em: new Date().toISOString() },
      { onConflict: 'membro_id,aula_id' }
    );

  if (error) throw error;
}

// Diretoria: upload de arquivo de material
export async function uploadMaterialAula(file, ligaId) {
  const ext = file.name.split('.').pop().toLowerCase();
  const path = `${ligaId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  const { error: uploadError } = await supabase.storage
    .from('aulas-materiais')
    .upload(path, file, { upsert: false, contentType: file.type });

  if (uploadError) {
    if (uploadError.message?.includes('Bucket not found')) {
      throw new Error('Bucket de storage não configurado. Aplique a migration 0014_aulas_arquivo.sql.');
    }
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('aulas-materiais')
    .getPublicUrl(path);

  return publicUrl;
}

// Diretoria: criar aula ou tarefa
export async function criarAula(dados) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { error } = await supabase
    .from('aulas')
    .insert({
      liga_id: dados.liga_id,
      numero: dados.numero,
      titulo: dados.titulo,
      tipo: dados.tipo || 'tarefa',
      prazo_entrega: dados.prazo_entrega || null,
      material_url: dados.material_url || null,
      slides_url: dados.slides_url || null,
      arquivo_url: dados.arquivo_url || null,
      publicada: dados.publicada ?? false
    });

  if (error) throw error;
}

// Diretoria: editar aula
export async function editarAula(aulaId, updates) {
  const { error } = await supabase
    .from('aulas')
    .update(updates)
    .eq('id', aulaId);

  if (error) throw error;
}

// Diretoria: publicar ou despublicar aula
export async function togglePublicarAula(aulaId, publicada) {
  return editarAula(aulaId, { publicada });
}

// Diretoria: listar todas as aulas da liga (incluindo não publicadas)
export async function getTodasAulas(ligaId) {
  const { data, error } = await supabase
    .from('aulas')
    .select('*')
    .eq('liga_id', ligaId)
    .order('numero');

  if (error) throw error;
  return data || [];
}

// Diretoria: excluir aula
export async function deletarAula(aulaId) {
  const { error } = await supabase.from('aulas').delete().eq('id', aulaId);
  if (error) throw error;
}

// Diretoria: ver entregas de uma aula específica
export async function getEntregasAula(aulaId) {
  const { data, error } = await supabase
    .from('entregas')
    .select('*, membros(nome, github)')
    .eq('aula_id', aulaId)
    .order('entregue_em', { ascending: false });

  if (error) throw error;
  return data || [];
}
