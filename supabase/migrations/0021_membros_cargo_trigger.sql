-- Migration: garante o cargo pré-atribuído no insert de membros
--
-- Problema: o cargo de emails_autorizados só era aplicado pelo front
--   (completarOnboarding). Quem entrou com o JS antigo em cache — ou antes do
--   deploy — virou 'membro' mesmo estando marcado como trainee na allowlist.
--
-- Solução: trigger BEFORE INSERT que puxa o cargo de emails_autorizados quando
--   a linha vem com o default. Cargo explícito diferente do default é
--   respeitado, e updates posteriores da diretoria não são tocados.
--
-- Aplicar em: Supabase Dashboard → SQL Editor

CREATE OR REPLACE FUNCTION public.aplicar_cargo_autorizado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cargo_autorizado text;
BEGIN
  IF NEW.cargo IS DISTINCT FROM 'membro' THEN
    RETURN NEW;
  END IF;

  SELECT ea.cargo INTO cargo_autorizado
  FROM public.emails_autorizados ea
  JOIN public.usuarios u ON u.email = ea.email
  WHERE u.id = NEW.usuario_id;

  IF cargo_autorizado IS NOT NULL THEN
    NEW.cargo := cargo_autorizado;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS membros_cargo_autorizado ON public.membros;

CREATE TRIGGER membros_cargo_autorizado
  BEFORE INSERT ON public.membros
  FOR EACH ROW
  EXECUTE FUNCTION public.aplicar_cargo_autorizado();

-- Aplicada em prod em 04/09/2026 por Isaac
