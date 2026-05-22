-- Migration: adiciona coluna mensagem em entregas
--
-- Permite que o membro escreva uma observação junto com o link do repositório
--
-- Aplicar em: Supabase Dashboard → SQL Editor

ALTER TABLE public.entregas
  ADD COLUMN IF NOT EXISTS mensagem text;

-- Aplicada em __/__/2026 por ___
