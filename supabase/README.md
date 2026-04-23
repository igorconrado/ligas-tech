# supabase/

Versionamento do schema do Supabase deste projeto.

## Estrutura

- `migrations/` — arquivos `.sql` com mudanças de schema, aplicadas em ordem.

## Convenção de migrations

Nome: `NNNN_snake_case_description.sql`, onde `NNNN` é inteiro de 4 dígitos zero-padded, sequencial.

Exemplos:

- `0001_baseline.sql`
- `0002_add_email_notifications.sql`
- `0003_membros_add_matricula_unique.sql`

## Regras

1. Migrations são idempotentes sempre que possível. Use `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, `CREATE POLICY IF NOT EXISTS`, etc.
2. Nunca edite uma migration já mergeada em `main`. Se precisar corrigir, crie uma nova migration.
3. O conteúdo é aplicado manualmente no SQL Editor do painel do Supabase por enquanto — não há CLI rodando no CI.
4. Ao fim de cada migration, registre a aplicação com um comentário SQL:

   ```sql
   -- Aplicada em prod em DD/MM/AAAA por <nome>
   ```

## Baseline

`0001_baseline.sql` será o snapshot inicial do schema vivo em produção. Será fornecido pelo dono do projeto — não gerar por conta própria.
