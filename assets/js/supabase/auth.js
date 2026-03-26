import { supabase } from '/assets/js/supabase/client.js';

export function emailValido(email) {
  return email.trim().toLowerCase().endsWith('@alunos.ibmec.edu.br');
}

export async function emailAutorizado(email) {
  const { data, error } = await supabase
    .from('emails_autorizados')
    .select('id, nome')
    .eq('email', email.trim().toLowerCase())
    .single();
  if (error || !data) return { autorizado: false, nome: null };
  return { autorizado: true, nome: data.nome };
}

export async function emailTemConta(email) {
  // Tenta login com senha impossível para detectar se conta existe
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: '___probe_impossivel_xyz___'
  });
  // "Invalid login credentials" = conta EXISTE mas senha errada
  // Qualquer outro erro = conta NÃO existe
  if (!error) return true;
  return error.message.includes('Invalid login credentials');
}

export async function criarConta(email, senha) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password: senha
  });
  if (error) throw error;
  // Loga automaticamente após criar
  const { data: login, error: loginError } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: senha
  });
  if (loginError) throw loginError;
  return login;
}

export async function fazerLogin(email, senha) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: senha
  });
  if (error) throw error;
  return data;
}

export async function fazerLogout() {
  await supabase.auth.signOut();
  window.location.href = '/membros/login';
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.href = '/membros/login';
    return null;
  }
  return session;
}
