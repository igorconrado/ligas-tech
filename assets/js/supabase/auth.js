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
  const { data } = await supabase
    .from('usuarios')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();

  return !!data;
}

export async function criarConta(email, senha) {
  const emailNorm = email.trim().toLowerCase();

  // 1. Cria no Supabase Auth (se já existir, ignora e faz login)
  const { error } = await supabase.auth.signUp({
    email: emailNorm,
    password: senha
  });
  const alreadyExists = error && (error.status === 422 || error.message?.includes('already registered'));
  if (error && !alreadyExists) throw error;

  // 2. Loga
  const { data: login, error: loginError } = await supabase.auth.signInWithPassword({
    email: emailNorm,
    password: senha
  });
  if (loginError) throw loginError;

  // 3. Garante linha na tabela usuarios
  const { data: existingUser } = await supabase
    .from('usuarios')
    .select('id')
    .eq('id', login.user.id)
    .maybeSingle();

  if (!existingUser) {
    await supabase
      .from('usuarios')
      .insert({
        id: login.user.id,
        email: emailNorm,
        role: 'membro',
        liga_id: null
      });
  }

  // 4. Garante linha na tabela membros para o onboarding
  const { data: existingMembro } = await supabase
    .from('membros')
    .select('id')
    .eq('usuario_id', login.user.id)
    .maybeSingle();

  if (!existingMembro) {
    await supabase
      .from('membros')
      .insert({
        usuario_id: login.user.id,
        onboarding_completo: false,
        ativo: true
      });
  }

  // 5. Marca que essa pessoa já criou a conta
  await supabase
    .from('emails_autorizados')
    .update({ tem_conta: true })
    .eq('email', emailNorm);

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
