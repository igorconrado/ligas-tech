# Task 12 — Audit de dados hardcoded na área de membros

> Temporário. Deletar antes do merge final.

## Dashboard Diretoria

### Aba Dashboard — KPIs (topo, 4 cards)

| Bloco | HTML | Origem atual | Ação Task 12 |
|---|---|---|---|
| Membros ativos — val (`26`) | [dashboard-diretoria.html:152](membros/dashboard-diretoria.html#L152) | JS (`atualizarMetricas`) já sobrescreve via `getMembrosLiga()` | ✅ já conectado |
| Membros ativos — sub (`7 IbBot · 17 IbTech`) | [L152](membros/dashboard-diretoria.html#L152) | HARDCODED | 🔧 calcular grupos por `m.ligas?.nome` |
| Presença média — val (`79%`) | [L153](membros/dashboard-diretoria.html#L153) | HARDCODED | 🔧 iterar `getEncontros` + `getPresencasEncontro` |
| Presença média — sub (`Último encontro`) | [L153](membros/dashboard-diretoria.html#L153) | texto fixo | ⚪ manter |
| Entregas pendentes — val (`5`) | [L154](membros/dashboard-diretoria.html#L154) | HARDCODED (id `pending-count`) | 🔧 iterar `getTodasAulas` + `getEntregasAula` |
| Entregas pendentes — sub (`Aulas 01 e 02`) | [L154](membros/dashboard-diretoria.html#L154) | HARDCODED | 🔧 listar aulas com pendências |
| Advertências ativas — val (`3`) | [L155](membros/dashboard-diretoria.html#L155) | HARDCODED | 🔧 `getTodasAdvertencias(ligaId).length` |
| Advertências ativas — sub (`Esse semestre`) | [L155](membros/dashboard-diretoria.html#L155) | texto fixo | ⚪ manter |

### Aba Dashboard — Panels

| Panel | HTML | Origem | Ação |
|---|---|---|---|
| "Últimas presenças" (3 rows fake) | [L168-170](membros/dashboard-diretoria.html#L168-L170) | HARDCODED | 🔧 `getEncontros` desc + `getPresencasEncontro` por encontro |
| "Entregas atrasadas" (3 rows: Ana Lima, Pedro Ramos, Diego Santos) | [L184-186](membros/dashboard-diretoria.html#L184-L186) | HARDCODED (nomes fake) | 🔧 aulas com `prazo_entrega<now` × membros sem entrega |
| "Visão geral dos membros" (overview-tbl) | JS `renderOverview` | Conectado a `getMembrosLiga` (estrutura OK) mas **colunas "presença %", "entregas", "adv."** são placeholders (`0`, `—`, `0`) no mapping. | ⚠️ follow-up: popular stats reais por membro |

### Outras abas da Diretoria (todas plugadas)

| Aba | Função | Status |
|---|---|---|
| Membros | `renderMembros` ← `getMembrosLiga` | ✅ mesmas colunas placeholder que overview |
| Advertências | `carregarAdvertencias` ← `getTodasAdvertencias` | ✅ |
| Presença | `carregarEncontros` + real-time | ✅ |
| Aulas | `carregarAulas` ← `getTodasAulas` | ✅ |
| Entregas | `carregarEntregas` ← `getEntregasAula` iterada | ✅ |
| Avisos | `carregarAvisos` ← `getAvisos` | ✅ |

## Dashboard Membro

### KPIs (4 cards)

| Bloco | Origem | Status |
|---|---|---|
| Presença % | `getMinhasPresencas` → `renderizarDashboard` | ✅ |
| Entregas | `getAulasComEntregas` → `renderizarDashboard` | ✅ |
| Próximo encontro | derivado de `aulas.find(a => prazo_entrega >= now)` em `renderizarDashboard` | ⚠️ confunde aula com encontro — deveria vir de `getEncontros()` (follow-up abaixo) |
| Semestre | calculado client-side | ✅ não precisa banco |

### Outras áreas (membro)

| Bloco | Função | Status |
|---|---|---|
| Aulas (tab) | `renderizarAulas` ← `getAulasComEntregas` | ✅ |
| Entregas (tab) | `renderizarEntregas` ← `getAulasComEntregas` | ✅ |
| Presença (tab) | `renderizarPresencas` ← `getMinhasPresencas` | ✅ |
| Perfil (tab) | `atualizarHeaderMembro` + form ← `getMeuPerfil` / `atualizarPerfil` | ✅ |
| Avisos | `renderizarAvisos` ← `getAvisos` | ✅ |
| Cronograma (tab) | `carregarCronograma` ← `getEncontros` | ✅ (task 7) |

## Follow-ups (não implementar agora — registrado)

1. **Avisos "não lidos"**: não existe campo `lido` em `avisos`. Requer nova coluna / tabela `avisos_lidos (usuario_id, aviso_id)`. MVP mostra apenas total.

2. **Presença média da diretoria**: hoje cálculo via `getPresencasEncontro` por encontro é **N+1 queries** (paralelizável com `Promise.all`). Aceitável até ~30 encontros por liga; além disso considerar view agregada no banco (`liga_presenca_media_view`).

3. **"Últimas presenças" panel**: mesma N+1 (uma query por encontro listado). 3 encontros = 3 queries.

4. **"Entregas atrasadas" panel**: `getTodasAulas(ligaId)` + `getEntregasAula(a.id)` por aula + cruzar com `getMembrosLiga`. Custoso mas aceitável pra 6-10 aulas.

5. **`renderOverview` / `renderMembros` colunas de stats (presença %, entregas, adv, status)**: hoje são placeholders (0, —, 0). Calcular stats por membro requer loop N queries em cima das funções acima. Em termos de dataset pequeno dá, mas é prolixo. Vale fazer query agregada no banco depois.

6. **Dashboard membro "Próximo encontro"**: `renderizarDashboard` usa `aulas.find(a => prazo_entrega >= now)` — confunde aula com encontro. Deveria usar `getEncontros(liga_id)` e pegar primeiro encontro com `data >= now`. Fica pra próxima iteração ou merge com task 7 de cronograma.

7. **Dashboard diretoria "Entregas pendentes — sub"**: hoje mostra "Aulas 01 e 02". Pode virar lista dinâmica de aulas com maior número de pendências. MVP mostrará contagem numérica.

8. **Gap de função no módulo Supabase**: nenhum. Todas as queries listadas nesta task existem. Sem autorização pedida pra criar função nova.

## Regras seguidas

- Nenhuma função nova criada em `assets/js/supabase/*`
- Nenhuma migração rodada
- Cálculos agregados feitos em JS via Promise.all paralelizando chamadas a funções existentes
