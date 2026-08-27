# ROADMAP — Project Risk AI

Desenvolvimento incremental, uma fase por vez, com validação antes de avançar para a próxima. Nenhuma fase depende de código de fases futuras.

## Fase 1 — Foundation ✅

- Setup do projeto Next.js + TypeScript + Tailwind + shadcn/ui.
- Configuração de ESLint + Prettier + Vitest.
- `docker-compose.yml` com Postgres local.
- Schema Prisma inicial (todas as entidades do modelo de dados) + primeira migration.
- `.env.example` documentado.
- README inicial com instruções de setup local.
- CI mínima (lint + typecheck) no GitHub Actions.

**Critério de saída**: `npm run dev` sobe a aplicação localmente contra o Postgres do Docker Compose, sem nenhuma tela de negócio ainda — só o esqueleto.

## Fase 2 — Project Management Core ✅

- CRUD completo de Projetos (formulário, listagem, edição, soft delete).
- CRUD de Milestones vinculados a um projeto.
- CRUD de Dependências vinculadas a um projeto.
- Validação de formulários com Zod (client + server).
- Estados de loading/empty/error nas telas.
- Testes de componente para formulários e listagens principais.

**Critério de saída**: é possível cadastrar um projeto completo com marcos e dependências, editar e excluir, sem passar por Riscos ou Health Score ainda.

## Fase 3 — Risk Management ✅

- CRUD de Riscos vinculados a um projeto.
- Cálculo automático de severidade (probabilidade × impacto) na criação/edição.
- Listagem de riscos com filtro por status/categoria/severidade.

**Critério de saída**: é possível registrar riscos completos e ver sua severidade calculada corretamente, cobrindo os casos de teste da matriz 5×5.

## Fase 4 — Project Health Engine ✅

- Implementação de `domain/health-score/calculate.ts` como função pura, com todos os casos de teste de `HEALTH_SCORE.md` (incluindo casos extremos).
- Endpoint `GET /api/projects/:id/health-score` com breakdown por dimensão.
- Componente de UI mostrando score geral + breakdown por dimensão no detalhe do projeto.
- Rotina de snapshot diário (`HealthScoreSnapshot`) + endpoint de cron.
- Tela de histórico do score (série temporal).

**Critério de saída**: alterar um risco crítico de "Aberto" para "Mitigado" muda visivelmente o Health Score do projeto, com breakdown explicável na tela.

## Fase 5 — Dashboard Executivo ✅

- Endpoint `GET /api/dashboard` com agregados de portfólio.
- Tela de dashboard: contagem de projetos por faixa de saúde, riscos críticos abertos, milestones atrasados, lista de projetos ordenável por score.
- Indicadores visuais (cores/badges) consistentes com as faixas de classificação.

**Critério de saída**: um usuário com múltiplos projetos cadastrados consegue, em uma única tela, identificar quais merecem atenção imediata.

## Fase 6 — AI Risk Advisor (Claude API) ✅

- Integração com `@anthropic-ai/sdk` no backend (`domain/ai-advisor/`).
- `buildPrompt.ts` a partir dos dados reais do projeto (incluindo breakdown do Health Score).
- Saída estruturada via `client.messages.parse()` + `zodOutputFormat` (structured outputs — mais direto que tool use manual para este caso, com validação Zod embutida na própria chamada).
- Endpoint `POST /api/projects/:id/ai-advisor` com cooldown de 5 minutos por projeto.
- Persistência em `AiSuggestion`, tela de revisão de sugestões (aceitar → rascunho de risco / descartar).
- Tratamento de timeout, erro e indisponibilidade da API, com fallback claro na UI.
- Testes com mocks da API do Claude (sem chamadas reais em CI).

**Critério de saída**: solicitar análise de IA para um projeto real gera sugestões plausíveis, claramente identificadas como sugestão, e nenhuma delas altera dados sem confirmação explícita. Desligar a chave de API (simular indisponibilidade) não quebra nenhuma outra funcionalidade.

## Fase 7 — Hardening, testes e deploy 🟡 (parcial — deploy depende de ação do usuário)

- ✅ Cobertura de testes ampliada: testes de integração de Route Handlers contra Postgres real (`*.integration.test.ts`), além dos testes unitários das fases anteriores (82 testes no total).
- ✅ CI com serviço Postgres, rodando `prisma migrate deploy` + lint + typecheck + format + testes (incluindo os de integração) + build a cada push/PR para `main`.
- ✅ Revisão de segurança manual contra o checklist de `ARCHITECTURE.md` §8: sem segredos no código/repo, validação Zod em toda escrita, sem `dangerouslySetInnerHTML`, Prisma parametrizado, cron protegido por secret com fail-closed, nenhum dado sensível em mensagens de erro 500.
- ⬜ Deploy em Vercel + banco gerenciado (Neon/Supabase): requer conta do usuário na Vercel e um repositório remoto no GitHub — não pode ser feito pelo Claude Code sem essas credenciais/decisões do usuário.
- ⬜ Screenshots reais no README: dependem da aplicação rodando publicamente ou de acesso a navegador nesta sessão.
- ⬜ (Opcional/stretch) E2E com Playwright — não implementado nesta fase.

**Critério de saída**: aplicação publicamente acessível via URL da Vercel, repositório no GitHub com documentação completa e testes passando em CI. **Bloqueado em**: criação do repositório remoto e deploy — ação do usuário.

## Além do MVP (backlog, não comprometido)

- Autenticação e multiusuário real (tabela `User`, sessões).
- Entidades dedicadas de mudança de escopo e alocação de recursos, substituindo o proxy via categoria de risco (ver `HEALTH_SCORE.md` §7).
- Notificações (e-mail/Slack) para deterioração do Health Score.
- Exportação de relatórios executivos (PDF).
- Integrações com ferramentas externas (Jira, Azure DevOps).
- Calibração dos pesos do Health Score com base em uso real (ver `HEALTH_SCORE.md` §10).
