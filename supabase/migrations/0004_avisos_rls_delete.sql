-- Migration: política de DELETE para avisos (diretoria)
--
-- Problema: diretoria não consegue excluir avisos
-- Causa: tabela avisos tem RLS ativo mas sem política de DELETE,
--   então todo DELETE por usuário autenticado é bloqueado silenciosamente.
--
-- Aplicar em: Supabase Dashboard → SQL Editor

-- Garante que RLS está ativo na tabela
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;

-- DELETE: somente membros da diretoria podem excluir
DROP POLICY IF EXISTS "diretoria_pode_deletar_avisos" ON public.avisos;

CREATE POLICY "diretoria_pode_deletar_avisos"
  ON public.avisos
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND role IN ('presidente', 'vp', 'ops', 'rh', 'diretor', 'coordenador')
    )
  );
