// ── Autenticação ──
// Funções de login, logout, sessão e verificação de acesso.
//
// Tabelas envolvidas:
//   - auth.users (Supabase Auth nativo)
//   - emails_autorizados: email, nome, matricula
//   - usuarios: id, email, role, liga_id
//
// Fluxo simplificado:
//   1. Verifica se email é @alunos.ibmec.edu.br
//   2. Verifica se email está em emails_autorizados
//   3. Tenta signIn → se falhar, faz signUp + signIn

import { supabase } from '/assets/js/supabase/client.js'

/**
 * Valida formato do email institucional.
 * @param {string} email
 * @returns {boolean}
 */
export function emailValido(email) {
  return email.trim().toLowerCase().endsWith('@alunos.ibmec.edu.br')
}

/**
 * Verifica se o email está na tabela emails_autorizados.
 * @param {string} email
 * @returns {Promise<{autorizado: boolean, nome: string|null}>}
 */
export async function emailAutorizado(email) {
  const { data, error } = await supabase
    .from('emails_autorizados')
    .select('nome')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()

  if (error) throw error
  return { autorizado: !!data, nome: data?.nome ?? null }
}

/**
 * Tenta login primeiro; se falhar por conta inexistente, cria e loga.
 * @param {string} email
 * @param {string} senha
 * @returns {Promise<{action: 'login'|'signup', data: object}>}
 */
export async function entrarOuCriar(email, senha) {
  const e = email.trim().toLowerCase()

  // Tenta login primeiro
  const { data: loginData, error: loginError } =
    await supabase.auth.signInWithPassword({ email: e, password: senha })

  if (!loginError) return { action: 'login', data: loginData }

  // Se o erro for de credenciais inválidas, pode ser conta nova
  if (loginError.message.includes('Invalid login credentials')) {
    const { data: signupData, error: signupError } =
      await supabase.auth.signUp({ email: e, password: senha })

    if (signupError) throw signupError

    // Após criar, loga automaticamente
    const { data: finalLogin, error: finalError } =
      await supabase.auth.signInWithPassword({ email: e, password: senha })

    if (finalError) throw finalError
    return { action: 'signup', data: finalLogin }
  }

  throw loginError
}

/**
 * Faz logout e redireciona pro login.
 */
export async function fazerLogout() {
  await supabase.auth.signOut()
  window.location.href = '/membros/login'
}

/**
 * Retorna a sessão atual ou null.
 * @returns {Promise<object|null>}
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

/**
 * Redireciona pro login se não houver sessão ativa.
 * Usar no topo de páginas protegidas.
 * @returns {Promise<object>} session
 */
export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    window.location.href = '/membros/login'
    throw new Error('Não autenticado')
  }
  return session
}
