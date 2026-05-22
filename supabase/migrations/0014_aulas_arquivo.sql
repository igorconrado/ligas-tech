-- Adiciona coluna arquivo_url na tabela aulas para materiais enviados via upload
ALTER TABLE aulas
  ADD COLUMN IF NOT EXISTS arquivo_url TEXT;

-- Bucket público para materiais de aulas
INSERT INTO storage.buckets (id, name, public)
VALUES ('aulas-materiais', 'aulas-materiais', true)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública
CREATE POLICY "Materiais de aulas são públicos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'aulas-materiais');

-- Upload: qualquer membro autenticado pode enviar (diretoria controla pela UI)
CREATE POLICY "Membros autenticados fazem upload de materiais"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'aulas-materiais');

-- Update e Delete: qualquer autenticado (diretoria)
CREATE POLICY "Membros autenticados atualizam materiais"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'aulas-materiais');

CREATE POLICY "Membros autenticados deletam materiais"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'aulas-materiais');
