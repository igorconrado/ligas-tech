// ── Aulas e Entregas ──
// CRUD de aulas, submissão de entregas e validação de repositório GitHub.
//
// Tabela: aulas
//   id, liga_id, numero (int), titulo, descricao, slides_url, material_url,
//   prazo_entrega (date), status ('concluida'|'proxima'|'planejada'),
//   created_at, updated_at
//
// Tabela: entregas
//   id, membro_id, aula_id, repo_url, repo_valido (bool),
//   status ('entregue'|'atrasada'|'pendente'), entregue_em (timestamp),
//   validado_em (timestamp), created_at
//
// RLS:
//   - Membro lê suas próprias entregas e lê aulas da sua liga
//   - Membro pode inserir/atualizar suas próprias entregas
//   - Diretoria lê e escreve tudo
//
// Validação GitHub:
//   - Antes de salvar, fazer GET na API pública do GitHub
//   - Verificar se repo existe e é público
//   - Opcionalmente verificar nome do repo (padrão: ibtech-aulaXX-nome)

import { supabase } from './client.js'

/**
 * Lista aulas de uma liga.
 *
 * @param {string} ligaId — ID da liga
 * @returns {Promise<Array>} — [{ id, numero, titulo, descricao, slides_url,
 *   material_url, prazo_entrega, status, entregas_count, entregas_total }]
 *
 * Query:
 *   SELECT a.*,
 *     (SELECT count(*) FROM entregas WHERE aula_id = a.id AND status = 'entregue') as entregas_count,
 *     (SELECT count(*) FROM perfis WHERE liga_id = a.liga_id AND status = 'ativo') as entregas_total
 *   FROM aulas a
 *   WHERE a.liga_id = ?
 *   ORDER BY a.numero
 */
export async function getAulas(ligaId) {
  // TODO: implementar
}

/**
 * Cria nova aula.
 * Somente diretoria.
 *
 * @param {Object} dados — { liga_id, numero, titulo, descricao, slides_url,
 *   material_url, prazo_entrega }
 * @returns {Promise<{data, error}>}
 *
 * Ao criar aula, gerar automaticamente registros de entrega pendentes
 * pra todos os membros ativos da liga:
 *   INSERT INTO entregas (membro_id, aula_id, status)
 *   SELECT id, novaAula.id, 'pendente' FROM perfis
 *   WHERE liga_id = ? AND status = 'ativo'
 */
export async function criarAula(dados) {
  // TODO: implementar
}

/**
 * Atualiza aula existente.
 * Somente diretoria.
 *
 * @param {string} id — ID da aula
 * @param {Object} dados — campos a atualizar
 * @returns {Promise<{data, error}>}
 */
export async function atualizarAula(id, dados) {
  // TODO: implementar
}

/**
 * Registra entrega de um membro.
 * Valida se o repo GitHub existe e é público antes de salvar.
 *
 * @param {string} membroId — ID do membro
 * @param {string} aulaId — ID da aula
 * @param {string} repoUrl — URL do repositório GitHub
 * @returns {Promise<{data, error}>}
 *
 * Fluxo:
 *   1. Extrair owner/repo da URL
 *   2. Chamar validarRepoGitHub(repoUrl)
 *   3. Se válido: UPDATE entregas SET repo_url, status = 'entregue',
 *      entregue_em = now(), repo_valido = true
 *      WHERE membro_id = ? AND aula_id = ?
 *   4. Se inválido: retornar erro sem salvar
 *
 * Nota: o prazo é informativo. Mesmo atrasada, a entrega é aceita.
 * O status 'atrasada' é calculado comparando entregue_em com prazo_entrega.
 */
export async function submeterEntrega(membroId, aulaId, repoUrl) {
  // TODO: implementar
}

/**
 * Valida repositório GitHub via API pública.
 *
 * @param {string} url — URL completa do repositório (https://github.com/owner/repo)
 * @returns {Promise<{valido, nome, owner, error}>}
 *
 * Implementação:
 *   1. Extrair owner e repo da URL com regex
 *   2. GET https://api.github.com/repos/{owner}/{repo}
 *   3. Verificar:
 *      - response.ok (repo existe)
 *      - !data.private (repo é público)
 *      - Opcionalmente: nome segue padrão ibtech-aulaXX-nome ou ibbot-aulaXX-nome
 *   4. Rate limit: API pública permite 60 req/hora sem token
 *      Considerar usar um token de serviço no futuro
 */
export async function validarRepoGitHub(url) {
  // TODO: implementar
}

/**
 * Busca entregas de uma aula (visão diretoria).
 *
 * @param {string} aulaId — ID da aula
 * @returns {Promise<Array>} — [{ membro_nome, membro_liga, repo_url, status, entregue_em }]
 *
 * Query:
 *   SELECT p.nome, l.nome as liga, e.repo_url, e.status, e.entregue_em
 *   FROM entregas e
 *   JOIN perfis p ON e.membro_id = p.id
 *   JOIN ligas l ON p.liga_id = l.id
 *   WHERE e.aula_id = ?
 *   ORDER BY e.status DESC, p.nome
 */
export async function getEntregasByAula(aulaId) {
  // TODO: implementar
}

/**
 * Busca entregas de um membro (visão membro).
 *
 * @param {string} membroId — ID do membro
 * @returns {Promise<Array>} — [{ aula_numero, aula_titulo, repo_url, status,
 *   prazo_entrega, entregue_em }]
 *
 * Query:
 *   SELECT a.numero, a.titulo, e.repo_url, e.status, a.prazo_entrega, e.entregue_em
 *   FROM entregas e
 *   JOIN aulas a ON e.aula_id = a.id
 *   WHERE e.membro_id = ?
 *   ORDER BY a.numero
 */
export async function getEntregasByMembro(membroId) {
  // TODO: implementar
}

/**
 * Atualiza status de entregas pendentes pra 'atrasada' quando passa do prazo.
 * Chamar ao carregar a página ou via cron job (Supabase pg_cron).
 *
 * @returns {Promise<{atualizadas, error}>}
 *
 * Query:
 *   UPDATE entregas SET status = 'atrasada'
 *   WHERE status = 'pendente'
 *   AND aula_id IN (SELECT id FROM aulas WHERE prazo_entrega < now())
 *
 * Alternativa: criar um trigger no Postgres que roda diariamente
 * via pg_cron:
 *   SELECT cron.schedule('atualizar-atrasados', '0 0 * * *',
 *     $$UPDATE entregas SET status = 'atrasada' WHERE ...$$);
 */
export async function atualizarStatusAtrasados() {
  // TODO: implementar
}
