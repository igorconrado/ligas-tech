-- Migration: corrige o trigger de criação de usuário e RLS do login
--
-- Problema: signUp retorna "Database error saving new user"
-- Causa provável: trigger on_auth_user_created falhando ao inserir em
--   public.usuarios (campo NOT NULL sem valor, ou RLS bloqueando)
--
-- Aplicar em: Supabase Dashboard → SQL Editor

-- ── 1. Corrige a função handle_new_user ──────────────────────────────────────
-- SECURITY DEFINER = roda como superuser, bypassa RLS
-- Campos nullable para não falhar se liga_id / nome não estiverem disponíveis

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insere em usuarios só se ainda não existe
  INSERT INTO public.usuarios (id, email, role, liga_id)
  VALUES (NEW.id, NEW.email, 'membro', NULL)
  ON CONFLICT (id) DO NOTHING;

  -- Insere em membros só se ainda não existe
  INSERT INTO public.membros (usuario_id, ativo, onboarding_completo)
  VALUES (NEW.id, true, false)
  ON CONFLICT (usuario_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ── 2. Recria o trigger (drop + create para garantir configuração correta) ────

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ── 3. RLS: permite leitura anônima em emails_autorizados ────────────────────
-- Necessário para a verificação de whitelist funcionar antes do login

ALTER TABLE public.emails_autorizados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leitura_publica_emails_autorizados" ON public.emails_autorizados;

CREATE POLICY "leitura_publica_emails_autorizados"
  ON public.emails_autorizados
  FOR SELECT
  TO anon
  USING (true);

-- ── 4. RLS: usuário autenticado pode atualizar seu próprio registro ───────────

DROP POLICY IF EXISTS "update_proprio_email_autorizado" ON public.emails_autorizados;

CREATE POLICY "update_proprio_email_autorizado"
  ON public.emails_autorizados
  FOR UPDATE
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- Aplicada em prod em __/__/2026 por ___
