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
    .from('emails_autorizados')
    .select('tem_conta')
    .eq('email', email.trim().toLowerCase())
    .single();

  if (error || !data) return false;
  return data.tem_conta === true;
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

  // 4. Marca que essa pessoa já criou a conta
  await supabase
    .from('emails_autorizados')
    .update({ tem_conta: true })
    .eq('email', email.trim().toLowerCase());

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

export async function getDashboardUrl() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return '/membros/login';

  const { data } = await supabase
    .from('usuarios')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return data?.role === 'diretoria'
    ? '/membros/dashboard-diretoria'
    : '/membros/dashboard';
}
