// ── Autenticação ──
// Todas as funções de login, logout, sessão e onboarding.
//
// Tabelas envolvidas:
//   - auth.users (Supabase Auth nativo)
//   - perfis (tabela custom): id, user_id, nome, email, liga_id, role, linkedin,
//     github, bio, foto_url, onboarding_completo, semestre_entrada, created_at
//
// Roles possíveis: 'membro' | 'coordenador' | 'diretor' | 'presidente'
// O role fica na tabela perfis (não no user_metadata) pra facilitar queries.
//
// RLS (Row Level Security):
//   - Qualquer usuário autenticado lê seu próprio perfil
//   - Diretoria (role in ['diretor','presidente']) lê todos os perfis
//   - Apenas o próprio usuário ou diretoria pode atualizar um perfil

import { supabase } from '/assets/js/supabase/client.js'

/**
 * Faz login com email e senha.
 * Valida domínio @ibmec.edu.br ANTES de chamar o Supabase.
 *
 * @param {string} email — email institucional
 * @param {string} password — senha
 * @returns {Promise<{user, session, error}>}
 *
 * Fluxo:
 *   1. Validar email.endsWith('@ibmec.edu.br')
 *   2. supabase.auth.signInWithPassword({ email, password })
 *   3. Se sucesso, verificar isFirstAccess() pra decidir redirect
 *   4. Redirecionar: primeiro acesso → dashboard com onboarding
 *                    acesso normal → dashboard direto
 *
 * Erros esperados:
 *   - 'Invalid login credentials' → email ou senha incorretos
 *   - 'Email not confirmed' → usuário ainda não confirmou email
 */
export async function login(email, password) {
  // TODO: implementar
}

/**
 * Faz logout e redireciona pro login.
 *
 * Fluxo:
 *   1. supabase.auth.signOut()
 *   2. window.location.href = '/membros/login'
 */
export async function logout() {
  // TODO: implementar
}

/**
 * Retorna sessão atual do usuário.
 *
 * @returns {Promise<{session, error}>}
 *
 * Uso: chamar no início de páginas protegidas.
 * Se session === null, redirecionar pro login.
 */
export async function getSession() {
  // TODO: implementar
  // supabase.auth.getSession()
}

/**
 * Retorna o role do usuário logado.
 *
 * @returns {Promise<string>} — 'membro' | 'coordenador' | 'diretor' | 'presidente'
 *
 * Fluxo:
 *   1. getSession() pra pegar user.id
 *   2. SELECT role FROM perfis WHERE user_id = ?
 *
 * Usado pra:
 *   - Decidir se mostra dashboard membro ou diretoria
 *   - Controlar acesso a funcionalidades restritas
 */
export async function getUserRole() {
  // TODO: implementar
}

/**
 * Verifica se é primeiro acesso (onboarding não concluído).
 *
 * @returns {Promise<boolean>}
 *
 * Fluxo:
 *   1. getSession() pra pegar user.id
 *   2. SELECT onboarding_completo FROM perfis WHERE user_id = ?
 *   3. Retorna !onboarding_completo
 */
export async function isFirstAccess() {
  // TODO: implementar
}

/**
 * Completa o onboarding — salva nome e links opcionais.
 *
 * @param {string} nome — nome completo do membro
 * @param {string} linkedin — URL do LinkedIn (opcional)
 * @param {string} github — URL do GitHub (opcional)
 * @returns {Promise<{data, error}>}
 *
 * Fluxo:
 *   1. getSession() pra pegar user.id
 *   2. UPDATE perfis SET nome, linkedin, github, onboarding_completo = true
 *      WHERE user_id = ?
 */
export async function completeOnboarding(nome, linkedin, github) {
  // TODO: implementar
}
