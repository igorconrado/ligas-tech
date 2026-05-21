-- Migration: políticas de SELECT em usuarios e membros
--
-- Problema: páginas de membros ficam em branco (shell não monta)
-- Causa provável: tabelas usuarios/membros têm RLS ativo sem política de
--   SELECT para o próprio usuário, fazendo a query de initPage retornar
--   null ou lançar erro silencioso.
--
-- Aplicar em: Supabase Dashboard → SQL Editor

-- ── usuarios ─────────────────────────────────────────────────────────────────

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Cada usuário lê apenas o próprio registro
DROP POLICY IF EXISTS "usuario_le_proprio_registro" ON public.usuarios;
CREATE POLICY "usuario_le_proprio_registro"
  ON public.usuarios
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Cada usuário atualiza apenas o próprio registro
DROP POLICY IF EXISTS "usuario_atualiza_proprio_registro" ON public.usuarios;
CREATE POLICY "usuario_atualiza_proprio_registro"
  ON public.usuarios
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- ── membros ───────────────────────────────────────────────────────────────────

ALTER TABLE public.membros ENABLE ROW LEVEL SECURITY;

-- Cada membro lê apenas o próprio perfil
DROP POLICY IF EXISTS "membro_le_proprio_perfil" ON public.membros;
CREATE POLICY "membro_le_proprio_perfil"
  ON public.membros
  FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid());

-- Cada membro atualiza apenas o próprio perfil
DROP POLICY IF EXISTS "membro_atualiza_proprio_perfil" ON public.membros;
CREATE POLICY "membro_atualiza_proprio_perfil"
  ON public.membros
  FOR UPDATE
  TO authenticated
  USING (usuario_id = auth.uid());

-- Membros autenticados podem inserir o próprio perfil (onboarding)
DROP POLICY IF EXISTS "membro_insere_proprio_perfil" ON public.membros;
CREATE POLICY "membro_insere_proprio_perfil"
  ON public.membros
  FOR INSERT
  TO authenticated
  WITH CHECK (usuario_id = auth.uid());

-- Aplicada em prod em __/__/2026 por ___
