-- Migration: RLS SELECT em ligas
--
-- Problema: join ligas(nome, cor) falha silenciosamente quando
--   a tabela ligas tem RLS ativo mas sem policy de SELECT.
--   Isso faz getMembrosLiga retornar membros com ligas: null.
--
-- Aplicar em: Supabase Dashboard → SQL Editor

ALTER TABLE public.ligas ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode ler ligas (dados públicos da liga)
DROP POLICY IF EXISTS "autenticado_le_ligas" ON public.ligas;
CREATE POLICY "autenticado_le_ligas"
  ON public.ligas
  FOR SELECT
  TO authenticated
  USING (true);

-- Aplicada em prod em __/__/2026 por ___
