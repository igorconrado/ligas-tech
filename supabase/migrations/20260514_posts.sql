-- Migration: tabela posts para o módulo /novidades
-- Execute no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS posts (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo       text        NOT NULL,
  conteudo     text        NOT NULL,
  categoria    text        NOT NULL CHECK (categoria IN ('hackathon', 'projeto', 'conhecimento')),
  liga_id      uuid        REFERENCES ligas(id) ON DELETE SET NULL,
  publicado    boolean     NOT NULL DEFAULT false,
  publicado_por uuid       REFERENCES usuarios(id) ON DELETE SET NULL,
  criado_em    timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Qualquer visitante pode ler posts publicados
CREATE POLICY "posts_public_read" ON posts
  FOR SELECT
  USING (publicado = true);

-- Membros da diretoria leem todos (rascunhos + publicados)
CREATE POLICY "posts_diretoria_read_all" ON posts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND role IN ('presidente', 'vp', 'ops', 'rh', 'diretor', 'coordenador')
    )
  );

-- Diretoria pode criar
CREATE POLICY "posts_diretoria_insert" ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND role IN ('presidente', 'vp', 'ops', 'rh', 'diretor', 'coordenador')
    )
  );

-- Diretoria pode editar
CREATE POLICY "posts_diretoria_update" ON posts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND role IN ('presidente', 'vp', 'ops', 'rh', 'diretor', 'coordenador')
    )
  );

-- Diretoria pode deletar
CREATE POLICY "posts_diretoria_delete" ON posts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND role IN ('presidente', 'vp', 'ops', 'rh', 'diretor', 'coordenador')
    )
  );
