// ── Page init (feature) ──
// Inicialização compartilhada pelas 16 páginas da área de membros:
//   await initPage({ requireRole: 'membro' | 'diretoria' | 'any' })
// Faz o auth guard e o role guard. Retorna { session, usuario, isDiretoria }.
//
// requireRole:
//   'any'       — apenas exige sessão válida
//   'membro'    — redireciona diretoria pro dashboard-diretoria
//   'diretoria' — redireciona membro pro dashboard

import { supabase } from '/assets/js/supabase/client.js';
import { requireAuth } from '/assets/js/supabase/auth.js';

const ROLES_DIRETORIA = ['presidente', 'vp', 'ops', 'rh', 'diretor', 'coordenador'];

export async function initPage({ requireRole = 'any' } = {}) {
  const session = await requireAuth();
  if (!session) throw new Error('Não autenticado');

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('role, liga_id, ligas(nome)')
    .eq('id', session.user.id)
    .single();

  const isDiretoria = ROLES_DIRETORIA.includes(usuario?.role);

  if (requireRole === 'membro' && isDiretoria) {
    window.location.href = '/membros/dashboard-diretoria';
    throw new Error('Redirecionando');
  }
  if (requireRole === 'diretoria' && !isDiretoria) {
    window.location.href = '/membros/dashboard';
    throw new Error('Redirecionando');
  }

  return { session, usuario, isDiretoria };
}
