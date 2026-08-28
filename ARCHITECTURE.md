# ARCHITECTURE — Project Risk AI

## 1. Visão geral

Aplicação **fullstack unificada em Next.js (App Router) + TypeScript**, com PostgreSQL como armazenamento e a API do Claude acessada exclusivamente por código de servidor (API Routes / Route Handlers). Um único repositório, um único processo de deploy.

### Por que não React SPA + Node/Express separado?

A proposta original sugeria frontend e backend como projetos distintos. Optamos por unificar em Next.js porque, para o escopo deste projeto:

- elimina CORS, dois servidores locais e dois pipelines de deploy;
- TypeScript compartilhado ponta a ponta (tipos de domínio, schemas Zod) sem pacote separado;
- Route Handlers do Next.js já satisfazem o requisito "chamadas à API do Claude só no backend" sem precisar de um servidor Express adicional;
- reduz superfície de configuração (menos arquivos de infraestrutura) sem abrir mão de organização em camadas dentro do próprio projeto.

A separação física front/back só se justificaria se houvéssemos previsto múltiplos consumidores de API (mobile nativo, integrações de terceiros) — não é o caso do MVP.

## 2. Stack

| Camada                        | Escolha                                | Motivo                                                                                                |
| ----------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Framework fullstack           | Next.js 14+ (App Router)               | Server Components + Route Handlers cobrem front e back num só projeto                                 |
| Linguagem                     | TypeScript (strict)                    | Tipagem ponta a ponta, menos bugs em runtime                                                          |
| UI                            | React + Tailwind CSS + shadcn/ui       | Componentes acessíveis, produtividade alta, boa aparência sem design system próprio                   |
| Gráficos                      | Recharts (ou similar leve)             | Suficiente para série temporal do Health Score e indicadores do dashboard                             |
| Estado de servidor no cliente | React Query (TanStack Query)           | Cache, refetch, loading/error states padronizados                                                     |
| Validação                     | Zod                                    | Schemas compartilhados entre formulários (cliente) e Route Handlers (servidor)                        |
| ORM                           | Prisma                                 | Migrations versionadas, tipos gerados a partir do schema, boa DX com Postgres                         |
| Banco de dados                | PostgreSQL                             | Relacional, adequado ao modelo de entidades com relações claras; free tier disponível (Neon/Supabase) |
| IA                            | Anthropic SDK (`@anthropic-ai/sdk`)    | Chamado só em Route Handlers do servidor                                                              |
| Autenticação                  | `jose` (JWT assinado, HS256)           | Sessão stateless em cookie httpOnly; sem tabela `User`, sem biblioteca de IAM completa — ver §9       |
| Testes unitários              | Vitest                                 | Rápido, boa integração com TS/Vite                                                                    |
| Testes de componente          | React Testing Library                  | Padrão de mercado para React                                                                          |
| Lint/format                   | ESLint + Prettier                      | Consistência de código                                                                                |
| Deploy app                    | Vercel                                 | Nativo para Next.js, free tier, deploy por push                                                       |
| Deploy banco                  | Neon ou Supabase (Postgres gerenciado) | Free tier, sem servidor próprio para manter                                                           |
| Local dev (DB)                | Docker Compose (Postgres)              | Ambiente local idêntico ao de produção sem depender de serviço externo                                |

Sem Redux, sem microsserviços, sem fila de mensagens, sem GraphQL — nenhum desses resolve um problema real neste escopo.

## 3. Estrutura de diretórios (proposta)

```
project-risk-ai/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   └── page.tsx                 # Dashboard executivo
│   │   ├── projects/
│   │   │   ├── page.tsx                 # Lista de projetos
│   │   │   ├── new/page.tsx
│   │   │   └── [projectId]/
│   │   │       ├── page.tsx             # Detalhe do projeto
│   │   │       ├── milestones/
│   │   │       ├── dependencies/
│   │   │       ├── risks/
│   │   │       └── ai-advisor/
│   │   └── api/
│   │       ├── projects/route.ts
│   │       ├── projects/[projectId]/route.ts
│   │       ├── projects/[projectId]/milestones/route.ts
│   │       ├── projects/[projectId]/dependencies/route.ts
│   │       ├── projects/[projectId]/risks/route.ts
│   │       ├── projects/[projectId]/health-score/route.ts
│   │       ├── projects/[projectId]/ai-advisor/route.ts
│   │       └── cron/health-snapshot/route.ts
│   ├── domain/
│   │   ├── health-score/
│   │   │   ├── calculate.ts             # função pura, testável isoladamente
│   │   │   └── calculate.test.ts
│   │   ├── risks/
│   │   └── ai-advisor/
│   │       ├── buildPrompt.ts
│   │       ├── parseResponse.ts
│   │       └── claudeClient.ts
│   ├── lib/
│   │   ├── prisma.ts
│   │   └── validation/                  # schemas Zod compartilhados
│   ├── components/
│   │   ├── ui/                          # shadcn primitives
│   │   └── domain/                      # ProjectCard, RiskTable, HealthGauge...
│   └── types/
├── .env.example
├── docker-compose.yml
└── package.json
```

Princípio: `domain/` contém lógica de negócio pura (Health Score, construção de prompt, parsing de resposta da IA), testável sem subir servidor ou banco. `app/api/*` é fina — só orquestra validação, chamada ao domínio e resposta HTTP.

## 4. Modelo de dados

### Entidades

- **Project** — 1:N Milestone, Dependency, Risk, HealthScoreSnapshot, AiSuggestion
- **Milestone** — N:1 Project
- **Dependency** — N:1 Project
- **Risk** — N:1 Project
- **HealthScoreSnapshot** — N:1 Project (histórico)
- **AiSuggestion** — N:1 Project (sugestões da IA, nunca dados oficiais)

### Diagrama de entidade-relacionamento (Mermaid)

```mermaid
erDiagram
    PROJECT ||--o{ MILESTONE : possui
    PROJECT ||--o{ DEPENDENCY : possui
    PROJECT ||--o{ RISK : possui
    PROJECT ||--o{ HEALTH_SCORE_SNAPSHOT : possui
    PROJECT ||--o{ AI_SUGGESTION : recebe

    PROJECT {
        string id PK
        string name
        string description
        string owner
        date startDate
        date endDate
        string status
        int progressPercent
        int teamSize
        string criticality
        string notes
        datetime createdAt
        datetime updatedAt
    }

    MILESTONE {
        string id PK
        string projectId FK
        string description
        date plannedDate
        date actualDate
        string status
        string owner
    }

    DEPENDENCY {
        string id PK
        string projectId FK
        string description
        string type
        string owner
        string criticality
        string status
    }

    RISK {
        string id PK
        string projectId FK
        string title
        string description
        string category
        int probability
        int impact
        int severity
        string owner
        string mitigationStrategy
        string status
    }

    HEALTH_SCORE_SNAPSHOT {
        string id PK
        string projectId FK
        date snapshotDate
        int overallScore
        json breakdown
    }

    AI_SUGGESTION {
        string id PK
        string projectId FK
        string type
        json content
        string status
        datetime createdAt
    }
```

### Notas sobre o modelo

- **`AiSuggestion.content`** guarda o JSON estruturado retornado pela IA (título, descrição, categoria, probabilidade/impacto sugeridos, mitigação sugerida) — nunca é lido diretamente como um `Risk`. Uma tela de revisão transforma isso em um formulário pré-preenchido de criação de risco.
- **`AiSuggestion.status`**: `pending` | `accepted` | `dismissed`. Ao aceitar, o backend cria o `Risk` real a partir dos dados confirmados pelo usuário (que pode editar antes de salvar) e marca a sugestão como `accepted`.
- **`HealthScoreSnapshot.breakdown`** guarda o detalhamento por dimensão (Prazo, Escopo, Dependências, Recursos, Riscos) e as penalizações que geraram o `overallScore` — é o que torna o score auditável (ver `HEALTH_SCORE.md`).
- Sem tabela `User` no MVP (decisão aprovada, mantida mesmo após a adição de autenticação — ver §9): `owner` em `Project`, `Milestone` e `Dependency`, e `owner` em `Risk`, são campos de texto livre. O único usuário autorizado a fazer login é provisionado via variáveis de ambiente, não por uma linha de banco de dados. Uma futura evolução multiusuário adicionaria uma tabela `User` e substituiria os campos de texto por FKs sem quebrar o histórico (o texto livre vira um valor de fallback/display).

## 5. Fluxo de arquitetura

```mermaid
flowchart LR
    subgraph Client["Navegador"]
        UI["React (Server + Client Components)"]
    end

    subgraph Server["Next.js — Route Handlers (servidor)"]
        API["/api/projects/*<br/>/api/projects/:id/health-score<br/>/api/projects/:id/ai-advisor"]
        Domain["domain/ — Health Score engine,<br/>prompt builder, response parser"]
        Cron["/api/cron/health-snapshot<br/>(Vercel Cron, diário)"]
    end

    subgraph External["Serviços externos"]
        DB[(PostgreSQL<br/>Neon / Supabase)]
        Claude["Claude API<br/>(Anthropic)"]
    end

    UI -->|fetch / server actions| API
    API --> Domain
    Domain -->|Prisma| DB
    Domain -->|somente quando<br/>usuário solicita análise| Claude
    Claude -->|resposta estruturada JSON| Domain
    Cron --> Domain
```

Pontos-chave:

- O navegador **nunca** fala diretamente com o Postgres ou com a Claude API — sempre via Route Handlers do próprio Next.js.
- O Health Score é calculado por uma função pura em `domain/health-score/calculate.ts`, sem chamar a Claude API — é 100% determinístico (RNF01).
- O AI Risk Advisor é acionado **apenas sob demanda explícita do usuário** (botão "Analisar com IA"), nunca automaticamente a cada carregamento de página — controla custo e respeita o princípio de a IA não atuar por conta própria.

## 6. Estratégia de API

REST simples sobre Route Handlers do Next.js, um recurso por entidade, aninhado sob `projects/:id` onde faz sentido (milestones, dependências, riscos pertencem sempre a um projeto).

| Método           | Rota                                       | Descrição                                                  |
| ---------------- | ------------------------------------------ | ---------------------------------------------------------- |
| GET/POST         | `/api/projects`                            | Lista / cria projetos                                      |
| GET/PATCH/DELETE | `/api/projects/:id`                        | Detalhe / atualiza / soft-delete                           |
| GET/POST         | `/api/projects/:id/milestones`             | Lista / cria marcos                                        |
| PATCH/DELETE     | `/api/milestones/:id`                      | Atualiza / remove marco                                    |
| GET/POST         | `/api/projects/:id/dependencies`           | Lista / cria dependências                                  |
| PATCH/DELETE     | `/api/dependencies/:id`                    | Atualiza / remove dependência                              |
| GET/POST         | `/api/projects/:id/risks`                  | Lista / cria riscos                                        |
| PATCH/DELETE     | `/api/risks/:id`                           | Atualiza / remove risco                                    |
| GET              | `/api/projects/:id/health-score`           | Score atual + breakdown, recalculado on-demand             |
| GET              | `/api/projects/:id/health-score/history`   | Série histórica de snapshots                               |
| POST             | `/api/projects/:id/ai-advisor`             | Dispara análise da IA (com cooldown)                       |
| GET              | `/api/projects/:id/ai-advisor/suggestions` | Lista sugestões pendentes/decididas                        |
| POST             | `/api/ai-advisor/suggestions/:id/accept`   | Aceita sugestão → gera rascunho de risco                   |
| POST             | `/api/ai-advisor/suggestions/:id/dismiss`  | Descarta sugestão                                          |
| GET              | `/api/dashboard`                           | Agregados de portfólio para o dashboard executivo          |
| POST             | `/api/cron/health-snapshot`                | Endpoint chamado pelo Vercel Cron (autenticado por secret) |

Todas as rotas de escrita validam o corpo da requisição com Zod antes de tocar o Prisma. Erros de validação retornam 400 com detalhe de campo; erros inesperados retornam 500 com mensagem genérica (sem vazar stack trace em produção).

## 7. Integração com a API do Claude

- SDK oficial `@anthropic-ai/sdk`, instanciado apenas em código de servidor (`domain/ai-advisor/claudeClient.ts`), nunca importado por um Client Component.
- Chave lida de `process.env.ANTHROPIC_API_KEY`, presente só no ambiente de servidor (Vercel env vars / `.env` local, nunca commitado).
- **Prompt determinístico e estruturado**: `buildPrompt.ts` monta o prompt a partir do estado atual do projeto (dados de `Project`, `Milestone`, `Dependency`, `Risk` abertos, e o breakdown do Health Score) — não a partir de texto livre do usuário, reduzindo risco de prompt injection via dados do próprio projeto.
- **Saída estruturada**: usa tool use / JSON schema no pedido ao Claude para obter uma resposta em formato previsível; `parseResponse.ts` valida a resposta com Zod antes de persistir como `AiSuggestion`. Resposta que falha na validação é descartada com erro tratado, não repassada ao usuário como se fosse válida.
- **Timeout**: requisição à Claude API com timeout explícito (ex.: 30s); timeout ou erro de rede retorna erro tratado ao frontend ("IA temporariamente indisponível"), sem afetar o restante da aplicação (RNF03).
- **Rate limiting / controle de custo**: cooldown por projeto (ex.: uma análise a cada N minutos), validado no backend antes de chamar a API — evita disparo repetido acidental ou abusivo.
- **Indisponibilidade da API**: tratada como erro esperado (try/catch dedicado), com mensagem clara na UI; nenhuma outra funcionalidade do sistema depende da Claude API para funcionar.
- Nenhuma chamada à Claude API ocorre em background/cron automaticamente — sempre por ação explícita do usuário, reforçando "Decision Support System, não autoridade automática".

## 8. Segurança

- Variáveis sensíveis (`DATABASE_URL`, `ANTHROPIC_API_KEY`, `CRON_SECRET`, `AUTH_SECRET`, `AUTH_ADMIN_EMAIL`, `AUTH_ADMIN_PASSWORD_HASH`) apenas em `.env` (local, git-ignorado) e nas env vars da Vercel; `.env.example` documenta as chaves sem valores reais.
- Validação de entrada com Zod em toda rota de API antes de qualquer escrita no banco.
- Prisma como camada de acesso a dados elimina SQL injection por construção (queries parametrizadas).
- Sem `dangerouslySetInnerHTML`; toda renderização de texto do usuário (inclusive conteúdo vindo da IA) passa pelo escaping padrão do React.
- Endpoint de cron (`/api/cron/health-snapshot`) protegido por um secret compartilhado (header verificado no handler), independente da autenticação de usuário (ver §12) — não é uma rota acessada por um usuário logado.
- Autenticação de usuário via sessão assinada em cookie (ver §12), com todas as páginas e endpoints funcionais exigindo sessão válida, exceto a própria tela de login e o endpoint de cron.
- Dependências mantidas atualizadas via Dependabot/`npm audit` (recomendado configurar no GitHub).

## 9. Tratamento de erros

- Camada `domain/` lança erros tipados (ex.: `ValidationError`, `AiAdvisorUnavailableError`, `NotFoundError`); Route Handlers traduzem esses tipos em códigos HTTP apropriados (400, 404, 503, 500).
- Frontend usa React Query, que já expõe estados `isLoading`, `isError`, `data` — cada tela trata explicitamente os três (spinner, mensagem de erro com retry, conteúdo).
- Estados vazios (nenhum projeto, nenhum risco cadastrado) têm componentes dedicados com call-to-action, não apenas uma tabela em branco.

## 10. Estratégia de testes

- **Unitários (Vitest)**: prioridade máxima em `domain/health-score/calculate.ts` — é a lógica mais sensível a erro silencioso, com casos de teste cobrindo os exemplos documentados em `HEALTH_SCORE.md` (score saudável, atenção, risco, crítico, casos extremos).
- **Unitários**: `buildPrompt.ts` e `parseResponse.ts` do AI Advisor testados isoladamente com mocks — sem chamar a API real do Claude em CI.
- **Componentes (React Testing Library)**: componentes de domínio críticos (tabela de riscos, indicador de Health Score, formulários com validação).
- **Integração**: Route Handlers principais testados contra um banco de teste (ex.: Postgres efêmero via Docker em CI ou SQLite em memória apenas para testes, se viável com Prisma).
- **E2E (Playwright)**: adiado para a Fase 7, opcional — cobrindo o fluxo crítico (criar projeto → registrar risco → ver Health Score mudar).

## 11. Estratégia de deploy

- **Aplicação**: Vercel, deploy automático a partir da branch principal do GitHub; variáveis de ambiente configuradas no painel da Vercel.
- **Banco de dados**: Neon ou Supabase (Postgres gerenciado, free tier) para produção/demo pública; Docker Compose local para desenvolvimento.
- **Migrations**: `prisma migrate deploy` executado como parte do pipeline de deploy (build step na Vercel ou GitHub Action prévia).
- **Cron do snapshot diário**: Vercel Cron (free tier permite execução diária), chamando `/api/cron/health-snapshot`.
- **CI (GitHub Actions, Fase 7)**: lint + typecheck + testes em cada PR antes de permitir merge.

## 12. Autenticação (MVP)

Adicionada após a publicação inicial do MVP para proteger a Live Demo pública, sem transformar o projeto em uma implementação de IAM completa (sem cadastro público, sem RBAC, sem multi-tenancy — ver `PRD.md` §9 e `ROADMAP.md`).

- **Sem tabela `User`** (decisão mantida — ver §4): existe um único usuário administrador, provisionado inteiramente por variáveis de ambiente (`AUTH_ADMIN_EMAIL`, `AUTH_ADMIN_PASSWORD_HASH`). A senha nunca é armazenada em texto puro — `AUTH_ADMIN_PASSWORD_HASH` é gerada localmente com `scrypt` (nativo do Node, sem dependência extra) via `scripts/hash-password.mjs`.
- **Sessão stateless assinada**: um cookie `httpOnly`, `Secure` em produção, `SameSite=Lax` guarda um JWT (HS256, `jose`) assinado com `AUTH_SECRET`, válido por 7 dias. Não há tabela de sessões — validar a sessão é apenas verificar a assinatura e a expiração do token, sem consulta ao banco.
- **Proxy** (`src/proxy.ts` — este Next.js renomeou `middleware.ts` para `proxy.ts`, mesma função, ver `node_modules/next/dist/docs/.../proxy.md`): roda em todas as rotas (runtime Node.js, padrão desta versão do Next.js) e faz a checagem "otimista" — sem sessão válida, redireciona páginas para `/login` e responde `401` a chamadas de API, exceto a própria `/login`, `/api/auth/login` e `/api/cron/health-snapshot` (que mantém seu próprio secret, independente de sessão de usuário).
- **Defesa em profundidade nos Route Handlers**: o Proxy sozinho não é a única proteção — cada Route Handler funcional (`projects`, `milestones`, `dependencies`, `risks`, `health-score`, `ai-advisor`, `dashboard`) chama `requireSession(request)` (`src/lib/auth/dal.ts`) no início do handler, lendo o cookie diretamente do header `Cookie` da própria `Request` (não via `next/headers`), o que também mantém os Route Handlers testáveis chamando-os diretamente, como já era feito nos testes de integração existentes.
- **Login/logout**: `POST /api/auth/login` valida e-mail/senha (Zod + `scrypt`, com verificação em tempo constante mesmo para e-mail desconhecido, para não vazar por timing se a conta existe) e emite o cookie de sessão; `POST /api/auth/logout` limpa o cookie. Nenhum dos dois exige sessão prévia.
- **Tela de login** (`/login`, única página pública): formulário e-mail/senha no mesmo padrão visual navy/slate da aplicação, com estado de carregamento e mensagem de erro genérica ("E-mail ou senha inválidos.") para não revelar qual campo está incorreto.
- **Sem alteração no schema Prisma**: zero migration — a autenticação é inteiramente orquestrada fora do banco de dados.
