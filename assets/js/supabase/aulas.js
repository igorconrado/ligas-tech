import { supabase } from '/assets/js/supabase/client.js';

export async function getAulasComEntregas() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: membro } = await supabase
    .from('membros').select('id, liga_id').eq('usuario_id', user.id).single();
  if (!membro) return [];

  const { data: aulas } = await supabase
    .from('aulas')
    .select('*')
    .eq('liga_id', membro.liga_id)
    .eq('publicada', true)
    .order('numero');

  if (!aulas) return [];

  const { data: entregas } = await supabase
    .from('entregas')
    .select('*')
    .eq('membro_id', membro.id);

  const entregasMap = {};
  (entregas || []).forEach(e => { entregasMap[e.aula_id] = e; });

  const now = new Date();
  return aulas.map(aula => {
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

export async function submeterEntrega(aulaId, repoUrl) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { data: membro } = await supabase
    .from('membros').select('id').eq('usuario_id', user.id).single();
  if (!membro) throw new Error('Perfil não encontrado');

  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/\s]+)/);
  if (!match) throw new Error('URL do GitHub inválida');

  const [, owner, repo] = match;
  const repoClean = repo.replace(/\.git$/, '');

  const res = await fetch(`https://api.github.com/repos/${owner}/${repoClean}`);
  if (!res.ok) throw new Error('Repositório não encontrado ou privado');
  const repoData = await res.json();
  if (repoData.private) throw new Error('O repositório precisa ser público');

  const { data, error } = await supabase
    .from('entregas')
    .upsert(
      { membro_id: membro.id, aula_id: aulaId, repo_url: repoUrl, status: 'entregue', entregue_em: new Date().toISOString() },
      { onConflict: 'membro_id,aula_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
