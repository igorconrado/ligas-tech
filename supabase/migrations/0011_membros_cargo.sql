-- Migration: adiciona coluna cargo em membros
--
-- Cargo representa a posição do membro na liga:
--   trainee  → recém-chegado / processo seletivo
--   membro   → membro efetivo (padrão)
--   diretor  → membro da diretoria
--
-- Aplicar em: Supabase Dashboard → SQL Editor

ALTER TABLE public.membros
  ADD COLUMN IF NOT EXISTS cargo text NOT NULL DEFAULT 'membro'
  CHECK (cargo IN ('trainee', 'membro', 'diretor'));

-- Aplicada em __/__/2026 por ___
