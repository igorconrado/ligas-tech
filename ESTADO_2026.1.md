# Estado deixado — 2026.1

## O que está pronto

### Site público
- Página inicial com seções Hero, IbBot, IbTech, Diretoria e Processo Seletivo
- Páginas `/ibbot` e `/ibtech` com apresentação das ligas
- Formulário de processo seletivo (aberto e fechado)
- Página `/contato`
- Página `/changelog` com versão visível no rodapé da sidebar
- Navbar responsiva; footer com links

### Área de membros (`/membros/*`)
- Autenticação via Supabase (login, logout, guard de rota por role)
- Shell com sidebar colapsável, topbar e drawer mobile com acento de cor por liga
- **Dashboard** — visão geral com métricas da liga
- **Aulas** — listagem de aulas e tarefas publicadas; entrega de tarefa via link do GitHub com validação de repo público
- **Encontros** — registro e acompanhamento de presença
- **Avisos** — feed de comunicados da diretoria
- **Advertências** — histórico de advertências do membro
- **Entregas** — acompanhamento de status de tarefas
- **Cronograma** — calendário da liga
- **Perfil** — dados do usuário e avatar
- Notificações em tempo real
- Empty states e skeleton loading em todas as listagens
- Acessibilidade: skip link, aria labels, `a11y.css`

### Área da diretoria (`/membros/diretoria/*`)
- Dashboard com métricas consolidadas
- **Aulas** — criar (aula ou tarefa), publicar, despublicar, excluir; upload de arquivo de material
- **Avisos** — criar e gerenciar comunicados
- **Advertências** — emitir e gerenciar advertências de membros
- **Encontros** — registrar presença dos membros
- **Entregas** — visualizar e aprovar entregas
- **Membros** — gestão do quadro da liga
- **Manual de Marca** — página dedicada com guidelines da liga
- **Perfil de Membro** — visualização do perfil de qualquer membro

---

## O que ficou em curso ou com bug conhecido

| Item | Situação |
|---|---|
| `/diretoria` retornava 404 | Corrigido — PR [fix/diretoria-modal](https://github.com/igorconrado/ligas-tech/pull/new/fix/diretoria-modal) |
| Botão "+ Novo evento" não abria modal em `/membros/diretoria/aulas` | Corrigido — mesmo PR acima |
| Edição de aulas/tarefas sem UI | Em aberto — `editarAula` existe em `supabase/aulas.js` mas não há modal de edição na página de diretoria |
| Visualização de entregas por aula sem UI | Em aberto — `getEntregasAula` existe mas não há tela dedicada para a diretoria ver quem entregou |
| `usuario?.membros?.liga_id` em `shell.js:209` sempre `undefined` | Baixa prioridade — a query de `page-init.js` não seleciona `liga_id` no join de `membros`; o `if` de notificações fica sempre falso na área da diretoria |

---

## Recomendações de prioridade para 2026.2

**Alta**
1. **UI de edição de aulas/tarefas** — infra já existe (`editarAula`), falta apenas o modal. Bloqueia a operação normal da liga no semestre.
2. **Tela de entregas por aula (diretoria)** — `getEntregasAula` já existe; diretores precisam avaliar tarefas entregues.

**Média**
3. **Processo seletivo — painel da diretoria** — hoje só existe o formulário público; não há onde a diretoria ver e gerenciar as inscrições.
4. **Responsividade das páginas internas** — o shell tem drawer mobile, mas os grids de cards (aulas, encontros, entregas) não adaptam bem em telas pequenas.
5. **Exportação de dados** — `supabase/exportacao.js` existe mas não está exposto em nenhuma página; útil para relatórios de fim de semestre.

**Baixa**
6. Corrigir `usuario?.membros?.liga_id` em `shell.js` — trocar por `usuario?.liga_id`.
7. Testes automatizados nas funções Supabase críticas (auth, criarAula, submeterEntrega).
