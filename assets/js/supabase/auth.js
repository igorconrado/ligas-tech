import { supabase } from '/assets/js/supabase/client.js';

export function emailValido(email) {
  return email.trim().toLowerCase().endsWith('@alunos.ibmec.edu.br');
}

export async function emailAutorizado(email) {
  const { data, error } = await supabase
    .from('emails_autorizados')
    .select('id, nome')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();
  if (error || !data) return { autorizado: false, nome: null };
  return { autorizado: true, nome: data.nome };
}

export async function emailTemConta(email) {
  const { data, error } = await supabase
    .from('emails_autorizados')
    .select('tem_conta')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();
  if (error || !data) return false;
  return data.tem_conta === true;
}

async function garantirLinhasDB(userId, email) {
  // O trigger on_auth_user_created já cria a linha em usuarios;
  // aqui só marca tem_conta para o fluxo de login identificar retornantes
  await supabase
    .from('emails_autorizados')
    .update({ tem_conta: true })
    .eq('email', email);
}

export async function criarConta(email, senha) {
  const emailNorm = email.trim().toLowerCase();

  // 1. Cria no Supabase Auth
  const { error } = await supabase.auth.signUp({
    email: emailNorm,
    password: senha
  });
  const alreadyExists = error && (error.status === 422 || error.message?.includes('already registered'));
  if (error && !alreadyExists) throw error;

  // Se a conta já existe no Auth, o usuário precisa usar a senha antiga
  if (alreadyExists) {
    const err = new Error('Esta conta já foi criada. Use sua senha para entrar.');
    err.code = 'ACCOUNT_EXISTS';
    throw err;
  }

  // 2. Loga
  const { data: login, error: loginError } = await supabase.auth.signInWithPassword({
    email: emailNorm,
    password: senha
  });

  if (loginError) {
    console.error('[criarConta] signInWithPassword falhou:', loginError);
    if (loginError.message?.toLowerCase().includes('email not confirmed')) {
      const err = new Error('Confirme seu email antes de entrar. Verifique sua caixa de entrada.');
      err.code = 'EMAIL_NOT_CONFIRMED';
      throw err;
    }
    throw loginError;
  }

  // 3. Garante linhas nas tabelas usuarios e membros
  await garantirLinhasDB(login.user.id, emailNorm);

  return login;
}

export async function fazerLogin(email, senha) {
  const emailNorm = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailNorm,
    password: senha
  });
  if (error) throw error;

  await garantirLinhasDB(data.user.id, emailNorm);

  return data;
}

export async function fazerLogout() {
  await supabase.auth.signOut();
  window.location.href = '/membros/login.html';
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.href = '/membros/login.html';
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

  const ROLES_DIRETORIA = ['presidente', 'vp', 'ops', 'rh', 'diretor', 'coordenador'];
  return ROLES_DIRETORIA.includes(data?.role)
    ? '/membros/dashboard-diretoria'
    : '/membros/dashboard';
}
