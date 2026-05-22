-- Adiciona timestamp de criação na tabela aulas para rastreamento de notificações
ALTER TABLE aulas
  ADD COLUMN IF NOT EXISTS criado_em TIMESTAMPTZ NOT NULL DEFAULT now();
