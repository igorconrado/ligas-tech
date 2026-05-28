-- Migration: credenciais públicas "IbTech Star" (e prêmios futuros)
--
-- Cria a tabela `certificados` e o bucket `certificados`, ambos
-- com leitura pública (a credencial é divulgada via LinkedIn) e
-- escrita restrita ao service_role (emitida pela diretoria).
--
-- A tabela já carrega colunas para o carimbo on-chain (Polygon)
-- previsto para a Fase 2 — todas nullable, preenchidas depois.
--
-- Aplicar em: Supabase Dashboard → SQL Editor

-- ── 1. Tabela `certificados` ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.certificados (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text NOT NULL UNIQUE,

  -- aluno premiado
  aluno_nome      text NOT NULL,
  aluno_email     text,
  aluno_github    text,
  aluno_linkedin  text,

  -- projeto que motivou a credencial (opcional — algumas honrarias
  -- premiam desempenho geral do semestre, sem projeto único)
  projeto_titulo       text,
  projeto_repo         text,
  projeto_site_url     text,
  projeto_revisao_url  text,

  -- ciclo / honraria
  ciclo           text NOT NULL,                     -- ex: '2026.1'
  trilha          text NOT NULL DEFAULT 'Frontend',
  edicao          int  NOT NULL DEFAULT 1,
  titulo          text NOT NULL DEFAULT 'IbTech Star',
  descricao       text,                              -- motivação livre

  -- prova on-chain (Fase 2 — preenchidos quando o attestation
  -- Polygon for emitido)
  conteudo_hash    text,
  ipfs_cid         text,
  polygon_tx_hash  text,
  polygon_block    bigint,

  -- arquivos no bucket `certificados`
  pdf_path        text,
  metadata_path   text,

  emitido_em      timestamptz NOT NULL DEFAULT now(),
  revogado_em     timestamptz
);

-- ── 2. RLS — leitura pública, escrita só service_role ──────────────────────
ALTER TABLE public.certificados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "certificados leitura publica"
  ON public.certificados FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "certificados escrita service_role"
  ON public.certificados FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── 3. Índices ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS certificados_emitido_em_idx
  ON public.certificados (emitido_em DESC);

CREATE INDEX IF NOT EXISTS certificados_ciclo_edicao_idx
  ON public.certificados (ciclo, edicao);

-- ── 4. Bucket público de arquivos (PDF + metadata JSON) ─────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificados', 'certificados', true)
ON CONFLICT (id) DO NOTHING;

-- ── 5. Policies de Storage ──────────────────────────────────────────────────
-- Leitura pública
CREATE POLICY "Certificados são públicos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'certificados');

-- Upload, update e delete: só service_role (emissão server-side)
CREATE POLICY "Service role gerencia certificados"
  ON storage.objects FOR INSERT TO service_role
  WITH CHECK (bucket_id = 'certificados');

CREATE POLICY "Service role atualiza certificados"
  ON storage.objects FOR UPDATE TO service_role
  USING (bucket_id = 'certificados');

CREATE POLICY "Service role deleta certificados"
  ON storage.objects FOR DELETE TO service_role
  USING (bucket_id = 'certificados');

-- Aplicada em prod em 28/05/2026 por Josh
