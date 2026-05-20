-- Migration: wiring liga_id pelo fluxo de cadastro → onboarding
--
-- Problema: completarOnboarding falha com NOT NULL constraint em membros.liga_id
-- Causa: emails_autorizados não armazena liga_id, então o INSERT no onboarding
--   não tem como saber qual liga atribuir ao membro.
--
-- Solução:
--   1. Adiciona liga_id em emails_autorizados (preenchido pela diretoria no cadastro)
--   2. Torna membros.liga_id nullable como válvula de segurança (membro sem liga
--      ainda consegue criar conta; diretoria atribui liga depois se necessário)
--
-- Aplicar em: Supabase Dashboard → SQL Editor

-- ── 1. Adiciona liga_id em emails_autorizados ────────────────────────────────
ALTER TABLE public.emails_autorizados
  ADD COLUMN IF NOT EXISTS liga_id UUID REFERENCES public.ligas(id);

-- ── 2. Torna membros.liga_id nullable ────────────────────────────────────────
ALTER TABLE public.membros
  ALTER COLUMN liga_id DROP NOT NULL;
