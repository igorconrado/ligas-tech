-- Migration: política de SELECT em encontros para membros
--
-- Problema: cronograma não carrega para membros comuns
-- Causa: tabela encontros tem RLS ativo mas sem política de SELECT
--   para role 'membro', então a query retorna [] silenciosamente.
--
-- Aplicar em: Supabase Dashboard → SQL Editor

ALTER TABLE public.encontros ENABLE ROW LEVEL SECURITY;

-- SELECT: qualquer autenticado pode ler encontros da própria liga
DROP POLICY IF EXISTS "membro_pode_ler_encontros_da_sua_liga" ON public.encontros;

CREATE POLICY "membro_pode_ler_encontros_da_sua_liga"
  ON public.encontros
  FOR SELECT
  TO authenticated
  USING (
    liga_id = (
      SELECT liga_id FROM public.usuarios
      WHERE id = auth.uid()
    )
  );

-- Aplicada em prod em __/__/2026 por ___
