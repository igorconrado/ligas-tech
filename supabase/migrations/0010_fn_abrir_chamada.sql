-- Migration: função server-side para abrir chamada de presença
--
-- Problema: abrirChamada usa Date.now() do browser para calcular o
--   tempo de expiração. Se o relógio do dispositivo estiver errado
--   (mesmo por alguns segundos), o código nasce "expirado" para o membro.
--
-- Solução: função SQL que usa NOW() do banco para gerar código e expiry,
--   eliminando dependência do relógio do client.
--
-- Aplicar em: Supabase Dashboard → SQL Editor

CREATE OR REPLACE FUNCTION public.abrir_chamada(encontro_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_codigo text;
  v_expira timestamptz;
BEGIN
  -- Gera código de 6 dígitos
  v_codigo := lpad((floor(random() * 900000) + 100000)::int::text, 6, '0');
  -- Expira em 10 minutos pelo relógio do banco
  v_expira := NOW() + INTERVAL '10 minutes';

  UPDATE public.encontros
  SET codigo_presenca   = v_codigo,
      codigo_expira_em  = v_expira,
      aberto            = true
  WHERE id = encontro_id;

  RETURN json_build_object('codigo', v_codigo, 'expira', v_expira);
END;
$$;

-- Aplicada em prod em __/__/2026 por ___
