-- Migration: upload de avatar para membros
--
-- Adiciona coluna avatar_url na tabela membros e configura o bucket
-- de storage público para armazenar as fotos de perfil.
--
-- Aplicar em: Supabase Dashboard → SQL Editor

-- ── 1. Coluna avatar_url em membros ─────────────────────────────────────────
ALTER TABLE public.membros
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- ── 2. Bucket público de avatars ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ── 3. Policies de storage ───────────────────────────────────────────────────
-- Leitura pública
CREATE POLICY "Avatars são públicos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- Upload: cada usuário só grava na própria pasta (uid/...)
CREATE POLICY "Membro faz upload do próprio avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Update: mesmo critério
CREATE POLICY "Membro atualiza o próprio avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Delete: mesmo critério
CREATE POLICY "Membro deleta o próprio avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
