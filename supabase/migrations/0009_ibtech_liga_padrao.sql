-- Migration: IbTech como liga padrão + backfill de usuarios/membros sem liga
--
-- Problema: membros sem liga_id em usuarios não aparecem na lista da diretoria
--   (filtro RLS usa usuarios.liga_id = membros.liga_id)
-- Solução: definir IbTech como liga padrão no trigger e fazer backfill
--
-- Aplicar em: Supabase Dashboard → SQL Editor

-- ── 1. Backfill: seta IbTech em usuarios com liga_id NULL ─────────────────────
UPDATE public.usuarios
SET liga_id = (SELECT id FROM public.ligas WHERE nome = 'IbTech' LIMIT 1)
WHERE liga_id IS NULL;

-- ── 2. Backfill: seta IbTech em membros com liga_id NULL ──────────────────────
UPDATE public.membros
SET liga_id = (SELECT id FROM public.ligas WHERE nome = 'IbTech' LIMIT 1)
WHERE liga_id IS NULL;

-- ── 3. Backfill: garante ativo = true em membros sem valor ────────────────────
UPDATE public.membros
SET ativo = true
WHERE ativo IS NULL;

-- ── 4. Atualiza trigger para usar IbTech como liga padrão ────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, role, liga_id)
  VALUES (
    NEW.id,
    NEW.email,
    'membro',
    (SELECT id FROM public.ligas WHERE nome = 'IbTech' LIMIT 1)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Aplicada em prod em __/__/2026 por ___
