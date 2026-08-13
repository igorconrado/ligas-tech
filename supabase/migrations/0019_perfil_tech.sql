-- Migration: jogo "Descubra seu Perfil Tech" (bancada de calouros)
--
-- Página pública /perfil-tech, acessada por QR code no celular do visitante.
-- Ao final o jogo grava uma linha com nome, curso e o arquétipo sorteado.
--
-- Esta é a PRIMEIRA tabela do projeto com INSERT liberado para `anon` —
-- todas as outras têm escrita restrita. O desenho de segurança é:
--
--   • INSERT liberado para anon (é o que o jogo precisa fazer)
--   • NENHUMA policy de SELECT para anon → a chave pública do site não
--     consegue ler a lista de leads. A diretoria lê pelo painel do Supabase
--     (service_role), nunca pelo frontend.
--   • CHECKs de tamanho nas colunas de texto pra limitar abuso de payload
--   • O contato opcional é gravado depois, via RPC `perfil_tech_contato`,
--     que só consegue preencher o campo uma única vez e só na linha cujo
--     `sessao_id` (uuid aleatório gerado no browser) o chamador conhece.
--
-- Aplicar em: Supabase Dashboard → SQL Editor

-- ── 1. Tabela `perfil_tech_respostas` ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.perfil_tech_respostas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- capability token gerado no browser: quem conhece o valor pode
  -- preencher o contato uma vez (ver RPC no item 4)
  sessao_id    uuid NOT NULL UNIQUE,

  -- identificação capturada no início do jogo
  nome         text NOT NULL CHECK (length(nome) BETWEEN 2 AND 80),
  curso        text NOT NULL CHECK (length(curso) BETWEEN 2 AND 60),

  -- contato opcional, pedido só na tela de resultado
  contato      text CHECK (contato IS NULL OR length(contato) BETWEEN 3 AND 80),

  -- resultado
  arquetipo    text NOT NULL CHECK (length(arquetipo) <= 40),
  liga         text NOT NULL CHECK (liga IN ('ibbot', 'ibtech')),
  pontuacao    jsonb,           -- placar dos 6 arquétipos
  respostas    jsonb,           -- opção escolhida em cada pergunta + placar dos minigames

  -- contexto
  origem       text NOT NULL DEFAULT 'direto' CHECK (length(origem) <= 32),
  duracao_ms   int  CHECK (duracao_ms IS NULL OR duracao_ms BETWEEN 0 AND 3600000),

  criado_em    timestamptz NOT NULL DEFAULT now()
);

-- ── 2. RLS — INSERT anônimo, leitura só service_role ────────────────────────
ALTER TABLE public.perfil_tech_respostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "perfil tech insert publico"
  ON public.perfil_tech_respostas FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Sem policy de SELECT/UPDATE/DELETE para anon: a chave pública do site
-- consegue escrever, nunca ler nem alterar.
CREATE POLICY "perfil tech gestao service_role"
  ON public.perfil_tech_respostas FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── 3. Índices ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS perfil_tech_criado_em_idx
  ON public.perfil_tech_respostas (criado_em DESC);

CREATE INDEX IF NOT EXISTS perfil_tech_arquetipo_idx
  ON public.perfil_tech_respostas (arquetipo);

-- ── 4. RPC pra gravar o contato opcional ────────────────────────────────────
-- Roda como SECURITY DEFINER (contorna o RLS), mas só faz uma coisa:
-- preencher `contato` na linha da sessão, e apenas se ainda estiver vazio.
-- Sem SELECT possível pelo anon, o sessao_id funciona como token de posse.
CREATE OR REPLACE FUNCTION public.perfil_tech_contato(
  p_sessao_id uuid,
  p_contato   text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_afetadas int;
BEGIN
  p_contato := btrim(p_contato);

  IF p_contato IS NULL OR length(p_contato) < 3 OR length(p_contato) > 80 THEN
    RETURN false;
  END IF;

  UPDATE public.perfil_tech_respostas
  SET contato = p_contato
  WHERE sessao_id = p_sessao_id
    AND contato IS NULL;

  GET DIAGNOSTICS v_afetadas = ROW_COUNT;
  RETURN v_afetadas > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.perfil_tech_contato(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.perfil_tech_contato(uuid, text) TO anon, authenticated;

-- ── 5. Consulta útil pra diretoria (rodar no SQL Editor) ────────────────────
-- SELECT arquetipo, liga, count(*) FROM perfil_tech_respostas
-- GROUP BY arquetipo, liga ORDER BY count(*) DESC;
--
-- SELECT nome, curso, contato, arquetipo, criado_em
-- FROM perfil_tech_respostas WHERE contato IS NOT NULL
-- ORDER BY criado_em DESC;

-- Aplicada em prod em 13/08/2026 por Isaac
