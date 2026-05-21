-- Migration: RLS completo para presencas e encontros
--
-- Problema: membro digita código da chamada mas não é registrado
-- Causa: tabela presencas não tem policies de INSERT/SELECT para membros;
--   tabela encontros não tem policies de INSERT/UPDATE para diretoria.
--
-- Cobre todos os casos de uso:
--   Membro  : registrar presença própria, ler próprias presenças
--   Diretoria: criar/abrir/fechar encontros, corrigir presenças, listar membros

-- ── encontros ─────────────────────────────────────────────────────────────────

ALTER TABLE public.encontros ENABLE ROW LEVEL SECURITY;

-- Diretoria pode ler encontros da própria liga
DROP POLICY IF EXISTS "diretoria_le_encontros_da_liga" ON public.encontros;
CREATE POLICY "diretoria_le_encontros_da_liga"
  ON public.encontros FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND role IN ('presidente','vp','ops','rh','diretor','coordenador')
        AND liga_id = encontros.liga_id
    )
  );

-- Diretoria pode criar encontros na própria liga
DROP POLICY IF EXISTS "diretoria_insere_encontros" ON public.encontros;
CREATE POLICY "diretoria_insere_encontros"
  ON public.encontros FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND role IN ('presidente','vp','ops','rh','diretor','coordenador')
        AND liga_id = encontros.liga_id
    )
  );

-- Diretoria pode atualizar encontros da própria liga (abrir/fechar chamada)
DROP POLICY IF EXISTS "diretoria_atualiza_encontros" ON public.encontros;
CREATE POLICY "diretoria_atualiza_encontros"
  ON public.encontros FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND role IN ('presidente','vp','ops','rh','diretor','coordenador')
        AND liga_id = encontros.liga_id
    )
  );

-- Diretoria pode excluir encontros da própria liga
DROP POLICY IF EXISTS "diretoria_deleta_encontros" ON public.encontros;
CREATE POLICY "diretoria_deleta_encontros"
  ON public.encontros FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND role IN ('presidente','vp','ops','rh','diretor','coordenador')
        AND liga_id = encontros.liga_id
    )
  );

-- ── presencas ─────────────────────────────────────────────────────────────────

ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;

-- Membro pode ler as próprias presenças
DROP POLICY IF EXISTS "membro_le_proprias_presencas" ON public.presencas;
CREATE POLICY "membro_le_proprias_presencas"
  ON public.presencas FOR SELECT TO authenticated
  USING (
    membro_id = (
      SELECT id FROM public.membros WHERE usuario_id = auth.uid()
    )
  );

-- Membro pode registrar a própria presença
DROP POLICY IF EXISTS "membro_insere_propria_presenca" ON public.presencas;
CREATE POLICY "membro_insere_propria_presenca"
  ON public.presencas FOR INSERT TO authenticated
  WITH CHECK (
    membro_id = (
      SELECT id FROM public.membros WHERE usuario_id = auth.uid()
    )
  );

-- Diretoria pode ler todas as presenças da própria liga
DROP POLICY IF EXISTS "diretoria_le_presencas_da_liga" ON public.presencas;
CREATE POLICY "diretoria_le_presencas_da_liga"
  ON public.presencas FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.membros m
      JOIN public.usuarios u ON u.id = auth.uid()
      WHERE m.id = presencas.membro_id
        AND u.role IN ('presidente','vp','ops','rh','diretor','coordenador')
        AND u.liga_id = m.liga_id
    )
  );

-- Diretoria pode inserir/corrigir presenças (corrigirPresenca usa upsert)
DROP POLICY IF EXISTS "diretoria_insere_presencas" ON public.presencas;
CREATE POLICY "diretoria_insere_presencas"
  ON public.presencas FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.membros m
      JOIN public.usuarios u ON u.id = auth.uid()
      WHERE m.id = presencas.membro_id
        AND u.role IN ('presidente','vp','ops','rh','diretor','coordenador')
        AND u.liga_id = m.liga_id
    )
  );

DROP POLICY IF EXISTS "diretoria_atualiza_presencas" ON public.presencas;
CREATE POLICY "diretoria_atualiza_presencas"
  ON public.presencas FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.membros m
      JOIN public.usuarios u ON u.id = auth.uid()
      WHERE m.id = presencas.membro_id
        AND u.role IN ('presidente','vp','ops','rh','diretor','coordenador')
        AND u.liga_id = m.liga_id
    )
  );

-- ── membros (complemento da 0006) ─────────────────────────────────────────────
-- Diretoria pode ler todos os membros da própria liga (getMembrosLiga)

DROP POLICY IF EXISTS "diretoria_le_membros_da_liga" ON public.membros;
CREATE POLICY "diretoria_le_membros_da_liga"
  ON public.membros FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid()
        AND role IN ('presidente','vp','ops','rh','diretor','coordenador')
        AND liga_id = membros.liga_id
    )
  );

-- Aplicada em prod em __/__/2026 por ___
