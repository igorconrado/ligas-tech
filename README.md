# Ligas Tech Ibmec BH — README Técnico

Documentação técnica do repositório para onboarding de novos mantenedores.

---

## Índice

1. [Visão geral](#visão-geral)
2. [Stack](#stack)
3. [Estrutura de pastas](#estrutura-de-pastas)
4. [Setup local](#setup-local)
5. [Variáveis de ambiente e credenciais](#variáveis-de-ambiente-e-credenciais)
6. [Banco de dados (Supabase)](#banco-de-dados-supabase)
7. [Fluxos críticos](#fluxos-críticos)
8. [Deploy de produção](#deploy-de-produção)
9. [Testes](#testes)
10. [Convenções de contribuição](#convenções-de-contribuição)

---

## Visão geral

Site estático das ligas de tecnologia do Ibmec BH (**IbBot** e **IbTech**). Possui:

- Páginas públicas de divulgação (home, ligas, processo seletivo, contato)
- Área restrita para membros (`/membros/`) com dashboards separados por role
- Backend 100% gerenciado pelo Supabase (auth, banco, RLS)

Não há servidor próprio, build step, nem Node.js. O site é HTML/CSS/JS puro e hospedado na Vercel.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | HTML5 + CSS3 + JavaScript (ES Modules, sem bundler) |
| Backend / DB | [Supabase](https://supabase.com) (PostgreSQL + Auth) |
| Hospedagem | [Vercel](https://vercel.com) (static hosting) |
| Supabase SDK | `@supabase/supabase-js@2` via CDN (sem npm) |

---

## Estrutura de pastas

```
ligas-tech/
├── assets/
│   ├── css/              # Estilos globais, componentes e páginas
│   └── js/
│       ├── supabase/     # client.js (inicialização do cliente Supabase)
│       ├── pages/        # Lógica específica de cada página
│       └── components/   # Componentes UI reutilizáveis (sidebar, modais, etc.)
├── membros/              # Área restrita (requer login)
│   ├── login.html
│   ├── dashboard.html              # Dashboard do membro
│   ├── dashboard-diretoria.html    # Dashboard da diretoria
│   ├── aulas.html / aulas-diretoria.html
│   ├── entregas.html / entregas-diretoria.html
│   ├── avisos.html / avisos-diretoria.html
│   ├── advertencias.html / advertencias-diretoria.html
│   ├── encontros.html / encontros-diretoria.html
│   ├── cronograma.html
│   ├── perfil.html
│   └── diretoria/        # Páginas exclusivas de gestão da diretoria
├── supabase/
│   ├── migrations/       # Arquivos .sql de mudanças de schema
│   └── README.md         # Convenções de migration
├── index.html            # Página inicial pública
├── ibbot.html
├── ibtech.html
├── contato.html
├── processo-seletivo.html
├── 404.html
├── vercel.json           # Configuração de deploy
├── SETUP.md              # Guia de primeiro uso do Supabase
└── MIGRATIONS.md         # Schema da tabela de advertências
```

---

## Setup local

O projeto não tem dependências npm. Para rodar localmente basta servir os arquivos estáticos.

### Pré-requisitos

- Qualquer servidor HTTP local (exemplos abaixo)
- Acesso ao painel do Supabase do projeto (solicitar ao presidente ou VP)

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/igorconrado/ligas-tech.git
cd ligas-tech

# 2. Inicie um servidor local (escolha um):

# Opção A — Python (já vem no sistema)
python -m http.server 3000

# Opção B — Node.js (se tiver instalado)
npx serve .

# Opção C — VS Code: instale a extensão "Live Server" e clique em "Go Live"

# 3. Acesse http://localhost:3000
```

> O login (`/membros/login`) exige que seu e-mail esteja cadastrado na tabela `emails_autorizados` do Supabase.
> Para testes, peça ao responsável para inserir seu e-mail via painel do Supabase.

---

## Variáveis de ambiente e credenciais

Este projeto **não usa arquivo `.env`**. As credenciais do Supabase ficam em `assets/js/supabase/client.js`:

```js
const SUPABASE_URL = 'https://<project-ref>.supabase.co'
const SUPABASE_ANON_KEY = '<chave-anon-publica>'
```

### Por que isso é seguro?

- A **anon key** é pública por design — ela identifica o projeto, não autentica como admin.
- O acesso aos dados é controlado pelas políticas de **Row Level Security (RLS)** no banco.
- A **service_role key** (admin) **nunca deve aparecer no frontend**. Ela fica somente no painel do Supabase e em pipelines de CI controlados.

### Onde encontrar as credenciais

No painel do Supabase: **Project Settings → API → Project URL / anon key**

Acesso ao painel: solicitar ao presidente ou VP da liga.

---

## Banco de dados (Supabase)

### Tabelas principais

| Tabela | Descrição |
|---|---|
| `ligas` | Registros de IbBot e IbTech |
| `usuarios` | Usuários autenticados com `role` e `liga_id` |
| `membros` | Perfil do membro (nome, LinkedIn, GitHub, bio) |
| `emails_autorizados` | Whitelist de e-mails com permissão de cadastro |
| `aulas` | Aulas com título, número, prazo e flag de publicação |
| `entregas` | Submissões de aulas (URL do repositório + status) |
| `encontros` | Encontros com código de presença e data |
| `presencas` | Registro de presença por membro e encontro |
| `avisos` | Comunicados da diretoria para membros |
| `advertencias` | Advertências formais (leve / grave) por membro |

### Roles de usuário

| Role | Nível de acesso |
|---|---|
| `membro` | Acessa apenas área de membros |
| `coordenador` | Acesso à área da diretoria |
| `diretor` | Acesso à área da diretoria |
| `ops` | Acesso à área da diretoria |
| `rh` | Acesso à área da diretoria |
| `vp` | Acesso à área da diretoria |
| `presidente` | Acesso total à área da diretoria |

Roles de diretoria (`coordenador` a `presidente`) têm acesso às páginas `-diretoria.html` e às políticas RLS mais permissivas.

### Migrations

Migrations ficam em `supabase/migrations/` com nomenclatura `NNNN_descricao.sql`.  
São aplicadas **manualmente** no SQL Editor do painel do Supabase.  
Consulte `supabase/README.md` para as convenções completas.

---

## Fluxos críticos

### Adicionar um novo membro

1. **Autorizar o e-mail** — No painel do Supabase, inserir na tabela `emails_autorizados`:
   ```sql
   INSERT INTO emails_autorizados (email, liga_id)
   VALUES ('novo@alunos.ibmec.edu.br', (SELECT id FROM ligas WHERE nome = 'IbTech'));
   ```
2. O novo membro acessa `/membros/login`, informa o e-mail e cria sua senha.
3. Após a criação da conta, copiar o UUID gerado em **Authentication → Users**.
4. Inserir nas tabelas `usuarios` e `membros` (ver `SETUP.md` para os comandos SQL exatos).
5. O membro completa o onboarding (nome, LinkedIn, GitHub, bio) no primeiro acesso.

### Criar uma aula

1. Diretoria acessa `/membros/aulas-diretoria`.
2. Preenche título, número da aula e prazo de entrega.
3. Salva como rascunho ou publica imediatamente.
4. Membros veem a aula em `/membros/aulas` assim que ela é publicada.

### Registrar um encontro e presença

1. Diretoria cria o encontro em `/membros/encontros-diretoria` (define data e gera código de presença).
2. Durante o encontro, membros acessam `/membros/encontros` e inserem o código para registrar presença.

### Enviar aviso

1. Diretoria acessa `/membros/avisos-diretoria` e cria o aviso com título e mensagem.
2. O aviso aparece para todos os membros da liga em `/membros/avisos`.

### Registrar advertência

1. Diretoria acessa `/membros/advertencias-diretoria`.
2. Seleciona o membro, o tipo (`leve` ou `grave`) e descreve o motivo.
3. O membro pode consultar suas advertências em `/membros/advertencias`.

---

## Deploy de produção

O deploy é feito automaticamente pela **Vercel** a cada push na branch `main`.

### Como funciona

- A Vercel monitora o repositório no GitHub.
- Qualquer merge em `main` dispara um novo deploy automaticamente.
- O deploy leva ~1 minuto para propagar.

### Configuração (`vercel.json`)

- `cleanUrls: true` — remove o `.html` das URLs (ex: `/membros/dashboard` em vez de `/membros/dashboard.html`)
- Reescrita de rotas para `/membros/:path*`
- Headers de segurança em todas as respostas: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`

### Primeiro deploy (novo projeto Vercel)

1. Acesse [vercel.com](https://vercel.com) e importe o repositório GitHub.
2. **Framework Preset:** Other (sem build step).
3. **Build Command:** deixar em branco.
4. **Output Directory:** deixar em branco (raiz do projeto).
5. **Variáveis de ambiente:** nenhuma necessária (credenciais ficam no código).
6. Clique em Deploy.

### Acesso ao painel Vercel

Solicitar ao presidente ou VP o convite para o time da Vercel.

---

## Testes

O projeto não possui suíte de testes automatizados no momento.

### Validação manual recomendada antes de um merge

- [ ] Login com e-mail autorizado funciona
- [ ] Login com e-mail não autorizado exibe mensagem de erro
- [ ] Membro sem role de diretoria não consegue acessar páginas `-diretoria`
- [ ] Dashboard redireciona corretamente: membro → `/membros/dashboard`, diretoria → `/membros/dashboard-diretoria`
- [ ] Submissão de entrega valida que a URL do GitHub é um repositório público válido
- [ ] Código de presença incorreto não registra presença

---

## Convenções de contribuição

### Branches

| Prefixo | Uso |
|---|---|
| `feat/` | Nova funcionalidade |
| `fix/` | Correção de bug |
| `style/` | Alterações visuais/CSS |
| `docs/` | Documentação |
| `refactor/` | Refatoração sem mudança de comportamento |

### Fluxo de trabalho

1. Crie uma branch a partir de `main`.
2. Abra um Pull Request descrevendo o que foi feito e por quê.
3. Solicite revisão de pelo menos um membro da diretoria técnica.
4. Após aprovação, faça merge em `main` — o deploy ocorre automaticamente.

### Migrations de banco

- Nunca altere uma migration já mergeada em `main`.
- Crie um novo arquivo `.sql` sequencial para qualquer mudança de schema.
- Aplique manualmente no SQL Editor do Supabase e registre a data no comentário final do arquivo.
- Consulte `supabase/README.md` para as regras completas.
