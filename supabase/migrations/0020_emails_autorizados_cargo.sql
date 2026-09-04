-- Migration: adiciona cargo em emails_autorizados
--
-- Problema: a linha em membros só nasce no onboarding, com cargo no default
--   ('membro'). Não há como a diretoria marcar alguém como trainee antes de
--   ele criar a conta — só depois, editando membro a membro.
--
-- Solução: mesma ideia do liga_id (migration 0002) — o cargo fica pré-atribuído
--   em emails_autorizados e completarOnboarding carrega ele pro insert em membros.
--
-- Aplicar em: Supabase Dashboard → SQL Editor

ALTER TABLE public.emails_autorizados
  ADD COLUMN IF NOT EXISTS cargo text NOT NULL DEFAULT 'membro'
  CHECK (cargo IN ('trainee', 'membro', 'diretor'));

-- Aplicada em prod em 04/09/2026 por Isaac
