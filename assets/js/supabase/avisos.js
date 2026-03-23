// ── Avisos ──
// Publicação de avisos e escuta em tempo real.
//
// Tabela: avisos
//   id, titulo, mensagem, autor_id, destinatarios ('todos'|'ibtech'|'ibbot'),
//   liga_id (nullable), created_at
//
// RLS:
//   - Qualquer membro autenticado lê avisos destinados à sua liga ou 'todos'
//   - Somente diretoria (role in ['diretor','presidente']) pode inserir
//
// Realtime:
//   - Usar Supabase Realtime pra notificar novos avisos instantaneamente
//   - Canal: 'avisos' com filtro por liga

import { supabase } from './client.js'

/**
 * Lista avisos com filtro opcional por liga.
 *
 * @param {string|null} ligaId — ID da liga ou null pra todos
 * @returns {Promise<Array>} — [{ id, titulo, mensagem, autor_nome, destinatarios, created_at }]
 *
 * Query:
 *   SELECT a.*, p.nome as autor_nome
 *   FROM avisos a
 *   JOIN perfis p ON a.autor_id = p.id
 *   WHERE (ligaId IS NULL OR a.destinatarios = 'todos' OR a.liga_id = ligaId)
 *   ORDER BY a.created_at DESC
 */
export async function getAvisos(ligaId = null) {
  // TODO: implementar
}

/**
 * Publica novo aviso.
 * Somente diretoria.
 *
 * @param {string} titulo — título do aviso
 * @param {string} mensagem — corpo do aviso
 * @param {string} destinatarios — 'todos' | 'ibtech' | 'ibbot'
 * @returns {Promise<{data, error}>}
 *
 * Fluxo:
 *   1. getSession() pra pegar autor_id
 *   2. Resolver liga_id a partir de destinatarios (se não for 'todos')
 *   3. INSERT INTO avisos (titulo, mensagem, autor_id, destinatarios, liga_id)
 *   4. Realtime propaga automaticamente pra quem está escutando
 *
 * Futuro: enviar push notification ou email pros membros
 */
export async function publicarAviso(titulo, mensagem, destinatarios) {
  // TODO: implementar
}

/**
 * Escuta avisos em tempo real.
 * Chama callback sempre que um novo aviso for publicado.
 *
 * @param {string|null} ligaId — ID da liga pra filtrar ou null pra todos
 * @param {Function} callback — função chamada com o novo aviso
 * @returns {Object} — subscription (chamar .unsubscribe() pra parar)
 *
 * Implementação:
 *   const channel = supabase
 *     .channel('avisos-realtime')
 *     .on('postgres_changes', {
 *       event: 'INSERT',
 *       schema: 'public',
 *       table: 'avisos',
 *       filter: ligaId ? `liga_id=eq.${ligaId}` : undefined
 *     }, payload => {
 *       callback(payload.new)
 *     })
 *     .subscribe()
 *
 *   return channel
 *
 * Nota: o filtro por liga no Realtime pode não filtrar 'todos'.
 * Considerar filtrar no callback se destinatarios === 'todos'.
 *
 * Cleanup: chamar channel.unsubscribe() ao sair da página
 * ou ao trocar de aba no dashboard.
 */
export async function escutarAvisos(ligaId, callback) {
  // TODO: implementar
}
