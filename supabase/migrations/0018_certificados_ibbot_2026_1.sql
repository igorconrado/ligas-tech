-- Migration: credenciais da Liga Acadêmica IbBot, Ciclo 2026.1
--
-- GERADO por ~/cert-build/regen/regen_ibbot.py. Não editar à mão: mexer no
-- ROSTER do script e rodar de novo, senão as páginas físicas divergem do banco
-- e a impressão digital SHA-256 de cada credencial deixa de bater.
--
-- Primeira leva de credenciais públicas da IbBot, no mesmo modelo verificável
-- que a IbTech já usa desde a migration 0016. São duas credenciais distintas:
--
--   7 certificados de conclusão do ciclo  (titulo = 'Certificado de Conclusão')
--   2 honrarias "IbBot Star"              (titulo = 'IbBot Star')
--
-- A tabela `public.certificados` não tem coluna de liga. A separação sai por
-- `trilha` ('Robótica' na IbBot, 'Frontend' na IbTech) e pelo prefixo do slug.
-- Prefixo é obrigatório: Artur e Henrique têm as duas credenciais e
-- `certificados.slug` é UNIQUE.
--
--   /certificados/ibbot-conclusao-<slug>
--   /certificados/ibbot-star-<slug>
--
-- Os campos de projeto ficam NULL de propósito: a IbBot não teve trilha com
-- entrega avaliada por diretriz em 2026.1, diferente da IbTech. O que a
-- credencial atesta é a conclusão do ciclo e a carga horária declarada, os
-- mesmos 30h do Certificado de Participação que a liga já emite em papel.
--
-- Fora desta leva, por decisão da Diretoria: Elita Rodrigues de Souza Ferreira
-- (desligada, recebe apenas a declaração de horas), Felipe Pratti e Itallo
-- Ferreira (não constam no censo CEI 2026.01 nem na lista nominal da Diretoria).
--
-- Aplicar em: Supabase Dashboard → SQL Editor

INSERT INTO public.certificados (
  id, slug, aluno_nome, ciclo, trilha, edicao, titulo, descricao, emitido_em
) VALUES
  -- ── Certificados de conclusão do Ciclo 2026.1 (7) ─────────────────────────
  ('e3612fc5-e53d-4cc1-893b-f2700c5e789e', 'ibbot-conclusao-ana-carolina-lanes', 'Ana Carolina Monteiro Lanes', '2026.1', 'Robótica', 1, 'Certificado de Conclusão', 'Concluiu o Ciclo 2026.1 da Liga Acadêmica IbBot, com carga horária de 30 horas em encontros de prototipagem, projetos de hardware e atividades da liga na Sala Maker.', '2026-08-10T15:00:00+00:00'),
  ('fc77c894-b2a4-4b41-9f2f-0bc1108e3a9b', 'ibbot-conclusao-artur-bento', 'Artur Bento dos Santos', '2026.1', 'Robótica', 1, 'Certificado de Conclusão', 'Concluiu o Ciclo 2026.1 da Liga Acadêmica IbBot, com carga horária de 30 horas em encontros de prototipagem, projetos de hardware e atividades da liga na Sala Maker.', '2026-08-10T15:00:00+00:00'),
  ('4934571f-a456-49c7-ac3e-c50e70a3e5ab', 'ibbot-conclusao-augusto-gaipo', 'Augusto Amaral Gaipo Silva', '2026.1', 'Robótica', 1, 'Certificado de Conclusão', 'Concluiu o Ciclo 2026.1 da Liga Acadêmica IbBot, com carga horária de 30 horas em encontros de prototipagem, projetos de hardware e atividades da liga na Sala Maker.', '2026-08-10T15:00:00+00:00'),
  ('beeac8b8-bc81-4c70-aa8c-946b2d82db69', 'ibbot-conclusao-gustavo-salles', 'Gustavo Salles Pires', '2026.1', 'Robótica', 1, 'Certificado de Conclusão', 'Concluiu o Ciclo 2026.1 da Liga Acadêmica IbBot, com carga horária de 30 horas em encontros de prototipagem, projetos de hardware e atividades da liga na Sala Maker.', '2026-08-10T15:00:00+00:00'),
  ('39abab09-2035-44af-8275-a3c672d6d6b1', 'ibbot-conclusao-henrique-araujo', 'Henrique Pinheiro Araujo', '2026.1', 'Robótica', 1, 'Certificado de Conclusão', 'Concluiu o Ciclo 2026.1 da Liga Acadêmica IbBot, com carga horária de 30 horas em encontros de prototipagem, projetos de hardware e atividades da liga na Sala Maker.', '2026-08-10T15:00:00+00:00'),
  ('9a40660e-b824-46bf-ad76-7eba3f9ef531', 'ibbot-conclusao-lucas-bertola', 'Lucas Bertola Xavier', '2026.1', 'Robótica', 1, 'Certificado de Conclusão', 'Concluiu o Ciclo 2026.1 da Liga Acadêmica IbBot, com carga horária de 30 horas em encontros de prototipagem, projetos de hardware e atividades da liga na Sala Maker.', '2026-08-10T15:00:00+00:00'),
  ('3c4ea4c1-281f-42a7-80a7-b76286180eb6', 'ibbot-conclusao-sergio-matheus', 'Sérgio Matheus', '2026.1', 'Robótica', 1, 'Certificado de Conclusão', 'Concluiu o Ciclo 2026.1 da Liga Acadêmica IbBot, com carga horária de 30 horas em encontros de prototipagem, projetos de hardware e atividades da liga na Sala Maker.', '2026-08-10T15:00:00+00:00'),

  -- ── Honraria IbBot Star (2) ───────────────────────────────────────────────
  ('ecf81360-02be-40b3-bda7-c6c09229d34d', 'ibbot-star-artur-bento', 'Artur Bento dos Santos', '2026.1', 'Robótica', 1, 'IbBot Star', 'Pela condução técnica da liga ao longo do Ciclo 2026.1, sustentando a bancada de hardware e a formação dos membros novos na Sala Maker.', '2026-08-10T15:00:00+00:00'),
  ('a359b031-f9f8-4fa7-81e5-c924f97f5f04', 'ibbot-star-henrique-araujo', 'Henrique Pinheiro Araujo', '2026.1', 'Robótica', 1, 'IbBot Star', 'Pelo desempenho e pelo esforço ao longo do Ciclo 2026.1, com contribuição direta nos projetos de hardware da liga.', '2026-08-10T15:00:00+00:00')
ON CONFLICT (slug) DO NOTHING;

-- Conferência rápida (esperado: 9 linhas, 7 de conclusão e 2 de honraria)
-- SELECT slug, aluno_nome, titulo FROM public.certificados
--  WHERE ciclo = '2026.1' AND trilha = 'Robótica' ORDER BY titulo, aluno_nome;
