## Verificar tabela advertencias
```sql
CREATE TABLE IF NOT EXISTS advertencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membro_id uuid NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('leve','grave')),
  descricao text NOT NULL,
  registrado_por uuid REFERENCES usuarios(id),
  criado_em timestamptz DEFAULT now()
);

ALTER TABLE advertencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diretoria gerencia advertencias" ON advertencias
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND role IN ('presidente','vp','ops','rh','diretor','coordenador')
    )
  );

CREATE POLICY "membro le proprias advertencias" ON advertencias
  FOR SELECT USING (
    membro_id = (
      SELECT id FROM membros WHERE usuario_id = auth.uid()
    )
  );
```
