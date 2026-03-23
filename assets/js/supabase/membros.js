// ── Gestão de Membros ──
// CRUD de membros e histórico.
//
// Tabela principal: perfis
//   id, user_id, nome, email, liga_id, role, linkedin, github, bio, foto_url,
//   onboarding_completo, semestre_entrada, status ('ativo'|'inativo'|'desligado'),
//   created_at, updated_at
//
// Tabela: ligas
//   id, nome ('IbTech'|'IbBot'), cor, created_at
//
// Tabela: advertencias
//   id, membro_id, tipo ('advertencia'|'anotacao'|'elogio'), descricao,
//   registrado_por, created_at
//
// RLS:
//   - Membros lêem apenas seu próprio perfil
//   - Diretoria (role in ['diretor','presidente']) lê e escreve todos
//   - Cadastro de membro é restrito à diretoria

import { supabase } from './client.js'

/**
 * Lista todos os membros com filtro opcional por liga.
 *
 * @param {string|null} liga — 'IbTech', 'IbBot' ou null pra todos
 * @returns {Promise<Array>} — lista de perfis com campos:
 *   { id, nome, email, liga, role, presenca_pct, entregas, status, adv_count }
 *
 * Query:
 *   SELECT p.*, l.nome as liga,
 *     (SELECT count(*) FROM advertencias WHERE membro_id = p.id) as adv_count
 *   FROM perfis p
 *   JOIN ligas l ON p.liga_id = l.id
 *   WHERE (liga IS NULL OR l.nome = liga)
 *   ORDER BY p.nome
 */
export async function getMembros(liga = null) {
  // TODO: implementar
}

/**
 * Cadastra novo membro e atribui liga e role.
 * Somente diretoria pode chamar.
 *
 * @param {Object} dados — { nome, email, liga_id, role, semestre_entrada }
 * @returns {Promise<{data, error}>}
 *
 * Fluxo:
 *   1. Validar email @ibmec.edu.br
 *   2. Criar usuário no Supabase Auth: supabase.auth.admin.createUser()
 *      (ou enviar convite por email)
 *   3. Criar registro na tabela perfis
 *   4. Senha temporária ou magic link pro primeiro acesso
 *
 * Nota: Pode ser necessário usar uma Edge Function pra
 * supabase.auth.admin.createUser() já que o client-side
 * não tem permissão de admin.
 */
export async function cadastrarMembro(dados) {
  // TODO: implementar
}

/**
 * Atualiza dados de um membro.
 *
 * @param {string} id — ID do perfil
 * @param {Object} dados — campos a atualizar
 * @returns {Promise<{data, error}>}
 *
 * Campos atualizáveis: nome, linkedin, github, bio, foto_url, role, status
 * O membro pode atualizar seu próprio perfil (exceto role/status).
 * Diretoria pode atualizar qualquer campo de qualquer membro.
 */
export async function atualizarMembro(id, dados) {
  // TODO: implementar
}

/**
 * Remove (desliga) membro.
 * Soft delete: muda status pra 'desligado', não apaga o registro.
 *
 * @param {string} id — ID do perfil
 * @returns {Promise<{data, error}>}
 *
 * Fluxo:
 *   1. UPDATE perfis SET status = 'desligado', updated_at = now() WHERE id = ?
 *   2. Opcionalmente desabilitar o usuário no Auth
 */
export async function removerMembro(id) {
  // TODO: implementar
}

/**
 * Retorna dados completos de um membro com histórico.
 *
 * @param {string} id — ID do perfil
 * @returns {Promise<Object>} — perfil + presenca[] + entregas[] + advertencias[]
 *
 * Queries:
 *   - SELECT * FROM perfis WHERE id = ?
 *   - SELECT * FROM presenca WHERE membro_id = ? ORDER BY data DESC
 *   - SELECT * FROM entregas WHERE membro_id = ? ORDER BY created_at DESC
 *   - SELECT * FROM advertencias WHERE membro_id = ? ORDER BY created_at DESC
 */
export async function getMembroComHistorico(id) {
  // TODO: implementar
}
