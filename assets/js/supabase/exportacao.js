// ── Exportação CSV ──
// 4 formatos de exportação pra diretoria.
// Todas as funções geram CSV e disparam download automático.
//
// Padrão do CSV:
//   - Cabeçalho com título do relatório e data de geração
//   - Colunas com headers descritivos
//   - Linha de totais/resumo no final
//   - Encoding UTF-8 com BOM pra Excel abrir corretamente
//   - Nome do arquivo: tipo-liga-semestre.csv

import { supabase } from './client.js'

/**
 * Exporta todos os registros de presença individualmente.
 * Um registro por linha: membro + encontro + status.
 *
 * @param {string} ligaId — ID da liga
 *
 * Colunas: Nome, Liga, Encontro, Data, Tipo, Status
 *
 * Query:
 *   SELECT perf.nome, l.nome as liga, e.titulo, e.data, e.tipo, p.status
 *   FROM presenca p
 *   JOIN perfis perf ON p.membro_id = perf.id
 *   JOIN encontros e ON p.encontro_id = e.id
 *   JOIN ligas l ON perf.liga_id = l.id
 *   WHERE (ligaId IS NULL OR perf.liga_id = ligaId)
 *   ORDER BY e.data DESC, perf.nome
 *
 * Nome do arquivo: presenca-registros-{liga}-2026-1.csv
 */
export async function exportarTodosRegistros(ligaId) {
  // TODO: implementar
  // const dados = await query...
  // downloadCSV(dados, `presenca-registros-${ligaNome}-2026-1.csv`)
}

/**
 * Exporta resumo por membro com totais e percentuais.
 * Ordenado do mais crítico (risco) ao melhor (ok).
 *
 * @param {string} ligaId — ID da liga
 *
 * Colunas: Nome, Liga, Presenças, Ausências, Justificadas, Total,
 *          Frequência (%), Status, Entregas, Advertências
 *
 * Ordenação:
 *   1. Status: risco > atencao > ok
 *   2. Dentro do mesmo status: menor frequência primeiro
 *
 * Rodapé: linha com médias gerais da liga
 *
 * Nome do arquivo: membros-resumo-{liga}-2026-1.csv
 */
export async function exportarResumoPorMembro(ligaId) {
  // TODO: implementar
}

/**
 * Exporta resumo por encontro com % de presença.
 * Uma linha por encontro.
 *
 * @param {string} ligaId — ID da liga
 *
 * Colunas: Encontro, Data, Tipo, Presentes, Ausentes, Justificados,
 *          Total, Taxa (%)
 *
 * Rodapé: linha com média geral de presença
 *
 * Nome do arquivo: presenca-encontros-{liga}-2026-1.csv
 */
export async function exportarPorEncontro(ligaId) {
  // TODO: implementar
}

/**
 * Exporta relatório de frequência separado por seção.
 * Divide membros em 3 grupos: Em Risco / Atenção / OK.
 *
 * @param {string} ligaId — ID da liga
 *
 * Formato:
 *   --- EM RISCO (>= 25% ausências) ---
 *   Nome, Frequência, Ausências, Motivo principal
 *   ...
 *
 *   --- ATENÇÃO (>= 15% ausências) ---
 *   Nome, Frequência, Ausências
 *   ...
 *
 *   --- OK (< 15% ausências) ---
 *   Nome, Frequência
 *   ...
 *
 *   --- RESUMO ---
 *   Total membros: X
 *   Em risco: X (X%)
 *   Atenção: X (X%)
 *   OK: X (X%)
 *
 * Nome do arquivo: relatorio-frequencia-{liga}-2026-1.csv
 */
export async function exportarRelatorioFrequencia(ligaId) {
  // TODO: implementar
}

/**
 * Utilitário: converte array de objetos pra CSV e faz download.
 *
 * @param {Array<Object>} dados — array de objetos com os dados
 * @param {string} nomeArquivo — nome do arquivo .csv
 * @param {Object} opcoes — { titulo, rodape }
 *
 * Implementação:
 *   1. Extrair headers das keys do primeiro objeto
 *   2. Adicionar linha de título: "Relatório: {titulo} · Gerado em: {data}"
 *   3. Adicionar linha vazia
 *   4. Adicionar headers
 *   5. Adicionar dados (escapar vírgulas e aspas)
 *   6. Se rodape: adicionar linha vazia + rodape
 *   7. Gerar Blob com BOM UTF-8: '\uFEFF' + csvString
 *   8. Criar URL e disparar download:
 *      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
 *      const url = URL.createObjectURL(blob)
 *      const a = document.createElement('a')
 *      a.href = url
 *      a.download = nomeArquivo
 *      a.click()
 *      URL.revokeObjectURL(url)
 */
function downloadCSV(dados, nomeArquivo, opcoes = {}) {
  // TODO: implementar
}
