-- Migration: sincroniza usuarios.role com membros.cargo para o cargo "diretor"
--
-- Problema: membros.cargo (trainee/membro/diretor) é o campo que a diretoria
--   edita em membros/diretoria/membros.html, mas quem controla o acesso real
--   à área de diretoria (gate no front em page-init.js/auth.js e todas as
--   policies de RLS via is_diretoria()/get_my_role()) é usuarios.role. Nada
--   no sistema nunca escrevia em usuarios.role além do handle_new_user()
--   (migration 0001), que sempre insere 'membro'. Resultado: marcar alguém
--   como "Diretor(a)" no modal de edição não dava acesso nenhum — a pessoa
--   ficava com membros.cargo='diretor' e usuarios.role='membro' para sempre.
--
-- Solução: 1) backfill dos usuários já afetados; 2) trigger que mantém
--   usuarios.role sincronizado com membros.cargo daqui pra frente, só para
--   o par diretor <-> membro. Os cargos mais altos (presidente/vp/ops/rh/
--   coordenador) não têm equivalente em membros.cargo e continuam sendo
--   atribuídos manualmente via SQL, como já era — o trigger nunca mexe
--   neles (só promove/rebaixa quem está exatamente em 'membro'/'diretor').
--
-- Aplicar em: Supabase Dashboard → SQL Editor

-- ── 1. Corrige quem já foi marcado como diretor e ficou sem acesso ──────────

UPDATE public.usuarios u
SET role = 'diretor'
FROM public.membros m
WHERE m.usuario_id = u.id
  AND m.cargo = 'diretor'
  AND u.role = 'membro';

-- ── 2. Trigger: mantém a sincronia daqui pra frente ─────────────────────────

CREATE OR REPLACE FUNCTION public.sincronizar_role_diretor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.cargo = 'diretor' AND (TG_OP = 'INSERT' OR OLD.cargo IS DISTINCT FROM 'diretor') THEN
    UPDATE public.usuarios
    SET role = 'diretor'
    WHERE id = NEW.usuario_id
      AND role = 'membro';
  ELSIF TG_OP = 'UPDATE' AND OLD.cargo = 'diretor' AND NEW.cargo IS DISTINCT FROM 'diretor' THEN
    UPDATE public.usuarios
    SET role = 'membro'
    WHERE id = NEW.usuario_id
      AND role = 'diretor';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS membros_sincroniza_role ON public.membros;

CREATE TRIGGER membros_sincroniza_role
  AFTER INSERT OR UPDATE OF cargo ON public.membros
  FOR EACH ROW
  EXECUTE FUNCTION public.sincronizar_role_diretor();
