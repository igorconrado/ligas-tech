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
  const { data, error } = await supabase
    .from('usuarios')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .single();

  if (error || !data) return false;
  return true;
}

export async function criarConta(email, senha) {
  // 1. Cria no Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password: senha
  });
  if (error) throw error;

  // 2. Loga automaticamente
  const { data: login, error: loginError } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: senha
  });
  if (loginError) throw loginError;

  // 3. Registra na tabela usuarios com role membro por padrão
  const { error: dbError } = await supabase
    .from('usuarios')
    .insert({
      id: login.user.id,
      email: email.trim().toLowerCase(),
      role: 'membro',
      liga_id: null
    });

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
