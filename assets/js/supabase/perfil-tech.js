import { supabase } from '/assets/js/supabase/client.js';

// ── Perfil Tech — persistência ──
// A tabela `perfil_tech_respostas` aceita INSERT anônimo e não tem policy de
// SELECT: o site grava, mas não consegue ler nada de volta. Ver a migration
// 0019_perfil_tech.sql para o desenho completo.
//
// O wi-fi do campus é o principal inimigo aqui: se o INSERT falhar, o
// registro vai pra uma fila no localStorage e é reenviado na próxima carga
// da página — o visitante nunca vê erro nenhum.

const CHAVE_FILA = 'perfil-tech:pendentes';
const LIMITE_FILA = 50;

/** crypto.randomUUID só existe em secure context (https ou localhost).
 *  Testar pelo IP da rede local cai no fallback. */
export function novaSessaoId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, caractere => {
    const aleatorio = (Math.random() * 16) | 0;
    const valor = caractere === 'x' ? aleatorio : (aleatorio & 0x3) | 0x8;
    return valor.toString(16);
  });
}

function lerFila() {
  try {
    const bruto = localStorage.getItem(CHAVE_FILA);
    const fila = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(fila) ? fila : [];
  } catch {
    return [];
  }
}

function escreverFila(fila) {
  try {
    localStorage.setItem(CHAVE_FILA, JSON.stringify(fila.slice(-LIMITE_FILA)));
  } catch {
    /* localStorage cheio ou bloqueado — seguir sem fila */
  }
}

function enfileirar(registro) {
  const fila = lerFila();
  fila.push(registro);
  escreverFila(fila);
}

/** Grava o resultado. Nunca lança: devolve true se foi pro banco agora. */
export async function salvarResposta(registro) {
  try {
    const { error } = await supabase.from('perfil_tech_respostas').insert(registro);
    if (error) throw error;
    return true;
  } catch (erro) {
    console.warn('[perfil-tech] insert falhou, enfileirando', erro);
    enfileirar(registro);
    return false;
  }
}

/** Preenche o contato opcional via RPC (única escrita permitida depois do insert). */
export async function salvarContato(sessaoId, contato) {
  const { data, error } = await supabase.rpc('perfil_tech_contato', {
    p_sessao_id: sessaoId,
    p_contato: contato,
  });
  if (error) throw error;
  return data === true;
}

/**
 * Se o registro desta sessão ainda está na fila (insert falhou por rede), o
 * contato é colado nele e viaja junto no reenvio — a RPC não serviria, porque
 * a linha nem existe no banco ainda.
 * Devolve true se encontrou o registro pendente.
 */
export function anexarContatoPendente(sessaoId, contato) {
  const fila = lerFila();
  const registro = fila.find(item => item.sessao_id === sessaoId);
  if (!registro) return false;

  registro.contato = contato.slice(0, 80);
  escreverFila(fila);
  return true;
}

/** Tenta esvaziar a fila acumulada por falha de rede. Roda no load da página. */
export async function reenviarPendentes() {
  const fila = lerFila();
  if (!fila.length) return 0;

  const sobraram = [];
  let enviados = 0;

  for (const registro of fila) {
    const { error } = await supabase.from('perfil_tech_respostas').insert(registro);
    if (error) {
      // duplicata (sessao_id UNIQUE) já está no banco — descarta
      if (error.code === '23505') continue;
      sobraram.push(registro);
    } else {
      enviados++;
    }
  }

  escreverFila(sobraram);
  return enviados;
}
