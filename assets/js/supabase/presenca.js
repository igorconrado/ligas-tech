// ── Presença ──
// Registro de presença, chamada com QR code e cálculo de frequência.
//
// Tabela: encontros
//   id, titulo, data, liga_id, tipo ('aula'|'reuniao'|'evento'),
//   aula_id (nullable, FK pra aulas), codigo_qr, codigo_expira_em,
//   status ('aberto'|'fechado'), created_by, created_at
//
// Tabela: presenca
//   id, membro_id, encontro_id, status ('presente'|'ausente'|'justificado'),
//   registrado_via ('manual'|'qr'), registrado_por, created_at
//
// RLS:
//   - Membro lê sua própria presença
//   - Diretoria lê e escreve toda presença
//   - Registro via QR: membro pode registrar a si mesmo se código válido
//
// Regras de frequência:
//   - OK: < 15% ausências injustificadas
//   - Atenção: >= 15% e < 25% ausências injustificadas
//   - Risco: >= 25% ausências injustificadas
//   - Justificadas não contam como ausência

import { supabase } from './client.js'

/**
 * Cria novo encontro e gera código QR.
 *
 * @param {string} titulo — ex: 'Aula 03 — Arrays em C'
 * @param {string} data — ISO date string
 * @param {string} ligaId — ID da liga
 * @returns {Promise<{encontro, codigo, error}>}
 *
 * Fluxo:
 *   1. Gerar código aleatório (6 chars uppercase alfanumérico)
 *   2. INSERT INTO encontros (titulo, data, liga_id, codigo_qr, codigo_expira_em, status)
 *      VALUES (?, ?, ?, codigo, now() + interval '10 minutes', 'aberto')
 *   3. Retornar encontro criado + código pro QR display
 *
 * O código expira em 10 minutos. Quando expira, status muda pra 'fechado'.
 * Pode usar um database trigger ou verificar no client.
 */
export async function criarEncontro(titulo, data, ligaId) {
  // TODO: implementar
}

/**
 * Registra presença de um membro num encontro.
 * Usado pela diretoria no registro manual (checkbox grid).
 *
 * @param {string} membroId — ID do membro
 * @param {string} encontroId — ID do encontro
 * @param {string} status — 'presente' | 'ausente' | 'justificado'
 * @returns {Promise<{data, error}>}
 *
 * Usa UPSERT pra evitar duplicatas:
 *   INSERT INTO presenca (membro_id, encontro_id, status, registrado_via, registrado_por)
 *   VALUES (?, ?, ?, 'manual', currentUser.id)
 *   ON CONFLICT (membro_id, encontro_id) DO UPDATE SET status = ?, registrado_por = ?
 */
export async function registrarPresenca(membroId, encontroId, status) {
  // TODO: implementar
}

/**
 * Busca presença de um membro em todos os encontros.
 * Usado na aba "Minha presença" do dashboard membro.
 *
 * @param {string} membroId — ID do membro
 * @returns {Promise<Array>} — [{ encontro_titulo, data, status, tipo }]
 *
 * Query:
 *   SELECT e.titulo, e.data, e.tipo, p.status
 *   FROM presenca p
 *   JOIN encontros e ON p.encontro_id = e.id
 *   WHERE p.membro_id = ?
 *   ORDER BY e.data DESC
 */
export async function getPresencaByMembro(membroId) {
  // TODO: implementar
}

/**
 * Busca lista de presença de um encontro específico.
 * Usado na aba "Registro de presença" do dashboard diretoria.
 *
 * @param {string} encontroId — ID do encontro
 * @returns {Promise<Array>} — [{ membro_id, nome, status }]
 *
 * Query:
 *   SELECT p.membro_id, perf.nome, p.status
 *   FROM presenca p
 *   JOIN perfis perf ON p.membro_id = perf.id
 *   WHERE p.encontro_id = ?
 *   ORDER BY perf.nome
 *
 * Se um membro da liga não tem registro, considerar como 'ausente'.
 * Fazer LEFT JOIN com perfis da liga do encontro.
 */
export async function getPresencaByEncontro(encontroId) {
  // TODO: implementar
}

/**
 * Calcula frequência de um membro.
 *
 * @param {string} membroId — ID do membro
 * @returns {Promise<{percentual, presentes, ausencias, justificadas, total, status}>}
 *   status: 'ok' | 'atencao' | 'risco'
 *
 * Cálculo:
 *   total = encontros da liga do membro no semestre atual
 *   presentes = presenca WHERE status = 'presente'
 *   justificadas = presenca WHERE status = 'justificado'
 *   ausencias = total - presentes - justificadas
 *   percentual = ((presentes + justificadas) / total) * 100
 *
 *   ausencia_pct = ausencias / total
 *   status = ausencia_pct >= 0.25 ? 'risco'
 *          : ausencia_pct >= 0.15 ? 'atencao'
 *          : 'ok'
 */
export async function calcularFrequencia(membroId) {
  // TODO: implementar
}

/**
 * Valida código QR digitado pelo membro e registra presença.
 * Usado quando o membro escaneia ou digita o código da chamada.
 *
 * @param {string} codigo — código de 6 chars
 * @param {string} membroId — ID do membro
 * @returns {Promise<{success, error}>}
 *
 * Fluxo:
 *   1. SELECT * FROM encontros WHERE codigo_qr = ? AND status = 'aberto'
 *      AND codigo_expira_em > now()
 *   2. Se não encontrou: erro 'Código inválido ou expirado'
 *   3. Verificar se membro pertence à liga do encontro
 *   4. UPSERT presenca com status = 'presente', registrado_via = 'qr'
 */
export async function validarCodigoPresenca(codigo, membroId) {
  // TODO: implementar
}
