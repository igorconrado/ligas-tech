# Setup — Primeiro uso

## Após rodar o SQL do schema, execute no SQL Editor do Supabase:

```sql
-- 1. Após o primeiro usuário criar conta pelo login.html,
--    busque o ID dele em Authentication → Users
--    e insira manualmente na tabela usuarios e membros:

INSERT INTO usuarios (id, email, role, liga_id)
VALUES (
  'UUID_DO_USUARIO_AQUI',
  'email@alunos.ibmec.edu.br',
  'presidente',  -- ou: membro, coordenador, diretor, vp, ops, rh
  (SELECT id FROM ligas WHERE nome = 'IbTech')  -- ou IbBot
);

INSERT INTO membros (usuario_id, liga_id, nome, ativo, onboarding_completo)
VALUES (
  'UUID_DO_USUARIO_AQUI',
  (SELECT id FROM ligas WHERE nome = 'IbTech'),
  'Nome do Membro',
  true,
  false  -- false = vai passar pelo onboarding no primeiro acesso
);
```

## Notas
- A anon key do Supabase no client.js é segura para o frontend — é pública por design
- O RLS garante que cada usuário só vê seus próprios dados
- Nunca exponha a service_role key no frontend
