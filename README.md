# Project Risk AI

> Plataforma inteligente para monitoramento preventivo de riscos e saúde de projetos de TI.

Case profissional de desenvolvimento assistido por Claude Code: da análise de produto e arquitetura até a implementação incremental, com todas as decisões documentadas.

**Status atual: Fases 1–6 completas; Fase 7 (hardening) parcial — testes, CI e revisão de segurança concluídos, deploy público pendente de ação do usuário** (ver [ROADMAP.md](./ROADMAP.md)).

## 1. Problema

Em projetos de TI, riscos importantes muitas vezes são identificados tarde demais ou ficam dispersos em planilhas, atas e percepções individuais dos gestores. Não existe um lugar único que consolide esses sinais e traduza a saúde do projeto em um indicador simples e auditável.

## 2. Solução

Project Risk AI centraliza dados de projetos (cronograma, marcos, dependências, riscos) e produz:

- um **Health Score** (0–100) determinístico, explicável e auditável por projeto;
- um **dashboard executivo** para leitura rápida de todo o portfólio;
- um **AI Risk Advisor**, que usa a API do Claude como apoio à decisão — nunca como autoridade automática sobre os dados do projeto.

Documentação completa de produto: [PRD.md](./PRD.md).

## 3. Arquitetura

Aplicação fullstack unificada em Next.js (App Router) + TypeScript, com PostgreSQL via Prisma e a API do Claude acessada exclusivamente por código de servidor. Decisão e detalhamento completos, incluindo diagrama de arquitetura e modelo de dados: [ARCHITECTURE.md](./ARCHITECTURE.md).

## 4. Funcionalidades

MVP: gestão de projetos, marcos e dependências; registro de riscos com severidade calculada; Health Score com breakdown por dimensão e histórico; dashboard executivo; AI Risk Advisor. Detalhamento em [PRD.md](./PRD.md) (requisitos funcionais RF01–RF09).

## 5. Tecnologias

| Camada         | Tecnologia                                   |
| -------------- | -------------------------------------------- |
| Framework      | Next.js (App Router) + TypeScript            |
| UI             | React + Tailwind CSS + shadcn/ui             |
| ORM            | Prisma (driver adapter `@prisma/adapter-pg`) |
| Banco de dados | PostgreSQL                                   |
| IA             | Anthropic SDK (`@anthropic-ai/sdk`)          |
| Validação      | Zod                                          |
| Gráficos       | Recharts                                     |
| Testes         | Vitest + React Testing Library               |
| Lint/format    | ESLint + Prettier                            |

## 6. Inteligência Artificial

O AI Risk Advisor (Fase 6) é um **Decision Support System**, não uma autoridade automática: a Claude API pode sugerir riscos, mitigações e resumos executivos, mas nunca cria, edita ou aprova dados por conta própria — toda sugestão exige revisão e confirmação explícita do usuário. Nenhuma chamada à API ocorre no frontend; a chave nunca é exposta ao cliente. Detalhes de integração, tratamento de erro/timeout e rate limiting: [ARCHITECTURE.md §7](./ARCHITECTURE.md#7-integração-com-a-api-do-claude).

## 7. Health Score

Metodologia matemática determinística (sem IA), com pesos, penalizações e exemplos completos de cálculo documentados em [HEALTH_SCORE.md](./HEALTH_SCORE.md).

## 8. Como executar localmente

### Pré-requisitos

- Node.js 20+
- Um PostgreSQL local — via **Docker** (recomendado) ou via `npx prisma dev` (Postgres local sem Docker, ver abaixo)

### Passos

```bash
npm install
cp .env.example .env
```

**Banco de dados (opção A — Docker, recomendado):**

```bash
docker compose up -d
```

O `docker-compose.yml` já sobe um Postgres compatível com o `DATABASE_URL` padrão de `.env.example`.

**Banco de dados (opção B — sem Docker):**

```bash
npx prisma dev
```

Copie a `DATABASE_URL` impressa no terminal para o seu `.env` (substitui a linha padrão do Docker).

**Aplicar o schema e gerar o client:**

```bash
npx prisma migrate dev
```

**Rodar a aplicação:**

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Scripts disponíveis

| Script              | Descrição                             |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento           |
| `npm run build`     | Build de produção                     |
| `npm run lint`      | ESLint                                |
| `npm run typecheck` | Verificação de tipos (`tsc --noEmit`) |
| `npm run format`    | Formata o projeto com Prettier        |
| `npm run test`      | Roda a suíte de testes (Vitest)       |
| `npx prisma studio` | GUI para inspecionar o banco de dados |

## 9. Configuração

Variáveis de ambiente documentadas em [`.env.example`](./.env.example): `DATABASE_URL` (Postgres), `ANTHROPIC_API_KEY` (usada apenas no backend, a partir da Fase 6) e `CRON_SECRET` (protege o endpoint de snapshot diário do Health Score, a partir da Fase 4). Nenhuma dessas chaves deve ser commitada — `.env` está no `.gitignore`.

## 10. Deploy

A aplicação está pronta para deploy, mas publicá-la exige decisões e credenciais que pertencem a você:

1. Crie um repositório no GitHub e envie este código (`git push`).
2. Crie um banco Postgres gerenciado (ex.: [Neon](https://neon.tech) ou [Supabase](https://supabase.com)) e copie a connection string.
3. Importe o repositório na [Vercel](https://vercel.com/new) e configure as variáveis de ambiente (`DATABASE_URL`, `ANTHROPIC_API_KEY`, `CRON_SECRET` — ver [`.env.example`](./.env.example)).
4. Rode `npx prisma migrate deploy` apontando para o banco de produção (pode ser feito localmente uma vez, ou como parte do build da Vercel).
5. O `vercel.json` já declara o cron diário de snapshot do Health Score (`/api/cron/health-snapshot`) — a Vercel injeta automaticamente o header `Authorization: Bearer $CRON_SECRET` nessa chamada.

## 11. Roadmap

Desenvolvimento incremental em 7 fases, da fundação ao deploy. Detalhamento fase a fase: [ROADMAP.md](./ROADMAP.md).

## 12. Documentação

- [PRD.md](./PRD.md) — problema, personas, requisitos, escopo do MVP
- [ARCHITECTURE.md](./ARCHITECTURE.md) — arquitetura, stack, modelo de dados, segurança
- [HEALTH_SCORE.md](./HEALTH_SCORE.md) — metodologia do Health Score
- [ROADMAP.md](./ROADMAP.md) — fases de desenvolvimento

## 13. Licença

MIT.
