-- Adiciona coluna tipo na tabela aulas para diferenciar aulas de tarefas
ALTER TABLE aulas
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'tarefa'
    CHECK (tipo IN ('aula', 'tarefa'));
