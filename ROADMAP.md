# ROADMAP — Project Risk AI

Este documento registra a evolução incremental do **Project Risk AI**, desde a fundação técnica até a publicação do MVP em produção.

O desenvolvimento foi estruturado em **7 fases**, com validação técnica e funcional antes do avanço para a etapa seguinte.

## Status do projeto

**MVP concluído e publicado em produção.**

🌐 **Live Demo:** https://project-risk-ai.vercel.app/

### Progresso

- [x] Fase 1 — Foundation
- [x] Fase 2 — Project Management Core
- [x] Fase 3 — Risk Management
- [x] Fase 4 — Project Health Engine
- [x] Fase 5 — Dashboard Executivo
- [x] Fase 6 — AI Risk Advisor
- [x] Fase 7 — Hardening, testes e deploy

---

## Fase 1 — Foundation ✅

### Objetivo

Estabelecer a base técnica do produto e preparar o ambiente para evolução incremental.

### Entregas

- Setup do projeto com Next.js, TypeScript, Tailwind CSS e shadcn/ui.
- Configuração de ESLint, Prettier e Vitest.
- `docker-compose.yml` com PostgreSQL para desenvolvimento local.
- Schema Prisma inicial com as entidades do modelo de dados.
- Primeira migration do banco.
- `.env.example` documentado.
- README inicial com instruções de setup local.
- CI inicial com lint e typecheck no GitHub Actions.

### Critério de saída

Aplicação executando localmente contra PostgreSQL, com infraestrutura base preparada para implementação das funcionalidades de negócio.

**Status:** Concluída.

---

## Fase 2 — Project Management Core ✅

### Objetivo

Implementar o núcleo de gerenciamento dos projetos monitorados pela plataforma.

### Entregas

- CRUD completo de Projetos.
- Criação, listagem, edição e soft delete.
- CRUD de Milestones vinculados ao projeto.
- CRUD de Dependências vinculadas ao projeto.
- Validação de formulários com Zod no cliente e servidor.
- Estados de loading, empty e error.
- Testes de componentes para formulários e listagens principais.

### Critério de saída

Possibilidade de cadastrar e administrar um projeto completo, incluindo seus milestones e dependências.

**Status:** Concluída.

---

## Fase 3 — Risk Management ✅

### Objetivo

Adicionar gerenciamento estruturado de riscos aos projetos.

### Entregas

- CRUD de Riscos vinculados ao projeto.
- Registro de probabilidade e impacto.
- Cálculo automático de severidade:

```text
Severidade = Probabilidade × Impacto
```

- Matriz de severidade 5×5.
- Listagem de riscos.
- Filtros por:
  - status;
  - categoria;
  - severidade.

### Critério de saída

Registro e gerenciamento de riscos com cálculo consistente de severidade e cobertura dos cenários previstos na matriz 5×5.

**Status:** Concluída.

---

## Fase 4 — Project Health Engine ✅

### Objetivo

Transformar os diferentes sinais de execução do projeto em um indicador consolidado e explicável de saúde.

### Entregas

- Implementação de `domain/health-score/calculate.ts` como função pura.
- Implementação dos casos definidos em `HEALTH_SCORE.md`.
- Cobertura de casos extremos.
- Endpoint:

```text
GET /api/projects/:id/health-score
```

- Breakdown do Health Score por dimensão.
- Componente visual do score no detalhe do projeto.
- Rotina de snapshot periódico do Health Score.
- Persistência em `HealthScoreSnapshot`.
- Endpoint protegido para execução do cron.
- Histórico temporal da evolução do score.

### Princípio

O Health Score é **100% determinístico**.

A Inteligência Artificial não participa do cálculo.

### Critério de saída

Alterações relevantes no estado do projeto produzem mudanças previsíveis e explicáveis no Health Score e em seu breakdown.

**Status:** Concluída.

---

## Fase 5 — Dashboard Executivo ✅

### Objetivo

Fornecer uma visão consolidada da saúde do portfólio.

### Entregas

- Endpoint:

```text
GET /api/dashboard
```

- Agregação dos indicadores do portfólio.
- Quantidade de projetos por faixa de saúde.
- Quantidade de riscos críticos em aberto.
- Quantidade de milestones atrasados.
- Listagem de projetos por Health Score.
- Indicadores visuais consistentes com as classificações:
  - Saudável;
  - Atenção;
  - Risco;
  - Crítico.
- Dashboard Executivo responsivo.

### Critério de saída

Permitir que o usuário identifique rapidamente, em uma única tela, quais projetos demandam maior atenção.

**Status:** Concluída.

---

## Fase 6 — AI Risk Advisor / Claude API ✅

### Objetivo

Adicionar uma camada de Inteligência Artificial capaz de apoiar a identificação preventiva de riscos sem retirar do usuário a autoridade sobre os dados do projeto.

### Entregas

- Integração com `@anthropic-ai/sdk` exclusivamente no backend.
- Implementação do módulo:

```text
domain/ai-advisor/
```

- Construção de prompts a partir dos dados reais do projeto.
- Inclusão do breakdown do Health Score no contexto enviado à IA.
- Structured Outputs com:

```text
client.messages.parse()
```

- Validação da saída utilizando Zod.
- Endpoint:

```text
POST /api/projects/:id/ai-advisor
```

- Cooldown de 5 minutos por projeto.
- Persistência das análises em `AiSuggestion`.
- Interface de revisão das sugestões.
- Fluxo de:
  - Aceitar;
  - Descartar.
- Sugestão aceita convertida em rascunho de risco para revisão.
- Tratamento de timeout.
- Tratamento de indisponibilidade da API.
- Fallback claro na interface.
- Testes utilizando mocks da Claude API.
- Nenhuma chamada real à Anthropic durante a execução da CI.

### Human-in-the-loop

O AI Risk Advisor foi deliberadamente projetado como um **Decision Support System**.

```text
Dados do Projeto
       │
       ▼
AI Risk Advisor
       │
       ▼
Sugestão da IA
       │
       ▼
Revisão do usuário
      /       \
 Aceitar    Descartar
    │
    ▼
Rascunho de risco
```

Nenhuma sugestão da IA altera automaticamente os dados oficiais do projeto.

### Critério de saída

Uma análise executada sobre dados reais do projeto produz sugestões estruturadas e plausíveis, mantendo a decisão final sob responsabilidade do usuário.

A indisponibilidade da Claude API não compromete as demais funcionalidades da aplicação.

**Status:** Concluída e validada em produção.

---

## Fase 7 — Hardening, testes e deploy ✅

### Objetivo

Preparar o MVP para execução confiável em ambiente de produção.

### Qualidade e testes

- Ampliação da cobertura de testes.
- Testes unitários das fases anteriores.
- Testes de integração dos Route Handlers utilizando PostgreSQL real.
- **82 testes** na suíte registrada ao final da fase.
- Validação de lint.
- Validação de tipos.
- Validação de formatação.
- Build de produção.

### CI

Pipeline no GitHub Actions executando:

```text
PostgreSQL
    ↓
prisma migrate deploy
    ↓
lint
    ↓
typecheck
    ↓
format
    ↓
testes
    ↓
build
```

O pipeline é executado em pushes e Pull Requests direcionados à branch `main`.

### Revisão de segurança

Checklist técnico baseado nas decisões documentadas em `ARCHITECTURE.md`.

Validações realizadas:

- ausência de segredos no código e repositório;
- validação Zod nas operações de escrita;
- ausência de `dangerouslySetInnerHTML`;
- acesso ao banco através do Prisma;
- proteção do endpoint de cron por secret;
- comportamento fail-closed no cron;
- ausência de informações sensíveis em mensagens de erro 500;
- Claude API Key utilizada exclusivamente no servidor.

### Infraestrutura de produção

A arquitetura final do MVP utiliza:

| Componente | Serviço |
|---|---|
| Código-fonte | GitHub |
| Aplicação | Vercel |
| Banco de dados | Neon PostgreSQL |
| ORM | Prisma |
| Inteligência Artificial | Anthropic Claude API |
| CI | GitHub Actions |
| Branch de produção | `main` |

### Banco de produção

PostgreSQL provisionado no Neon.

Migrations aplicadas através de:

```bash
npx prisma migrate deploy
```

A aplicação utiliza conexão PostgreSQL apropriada ao ambiente serverless da Vercel.

### Configuração de produção

Variáveis sensíveis mantidas exclusivamente no ambiente da Vercel:

```env
DATABASE_URL=
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=
CRON_SECRET=
```

Nenhuma credencial real é armazenada no repositório.

### Deploy

Aplicação publicada na Vercel e conectada à branch `main`.

🌐 **Produção:**

https://project-risk-ai.vercel.app/

O fluxo de produção passa a ser:

```text
Desenvolvimento
      │
      ▼
   GitHub
      │
      │ push → main
      ▼
GitHub Actions
      │
      ▼
    Vercel
      │
      ├────────► Neon PostgreSQL
      │
      └────────► Anthropic Claude API
```

### Validação em produção

Após o deploy foram validados:

- carregamento da aplicação;
- acesso ao Dashboard Executivo;
- persistência de projetos no Neon PostgreSQL;
- cálculo do Health Score;
- visualização dos dados do projeto;
- execução do AI Risk Advisor;
- retorno estruturado da Claude API;
- sugestões de riscos;
- estratégias de mitigação;
- fluxo de revisão das sugestões.

### Interface

Após a estabilização funcional, a interface recebeu uma revisão visual mantendo intactas as regras de negócio.

A identidade visual foi modernizada com foco em:

- dashboard corporativo;
- hierarquia visual;
- diferenciação semântica dos níveis de saúde;
- consistência de componentes;
- legibilidade;
- responsividade;
- experiência de produto SaaS B2B.

### Critério de saída

- Aplicação publicamente acessível.
- PostgreSQL funcionando em produção.
- Claude API integrada e validada.
- CI executando validações automatizadas.
- Documentação disponível no GitHub.
- Build de produção aprovado.
- MVP funcional na Vercel.

**Status:** Concluída.

---

# Resultado do MVP

Ao término das sete fases, o Project Risk AI entrega um fluxo completo:

```text
Cadastro do Projeto
        │
        ▼
Milestones + Dependências + Riscos
        │
        ▼
Project Health Engine
        │
        ▼
Health Score
        │
        ├────────► Dashboard Executivo
        │
        └────────► AI Risk Advisor
                         │
                         ▼
                  Claude API
                         │
                         ▼
                  Sugestões de risco
                         │
                         ▼
                   Revisão humana
```

O MVP combina:

- gestão estruturada de projetos;
- gerenciamento de riscos;
- indicador determinístico de saúde;
- visão executiva de portfólio;
- Inteligência Artificial como apoio à decisão;
- persistência em PostgreSQL;
- testes automatizados;
- CI;
- deploy contínuo;
- ambiente público de produção.

---

# Além do MVP

As seguintes evoluções permanecem como **backlog e não fazem parte do escopo atual comprometido**.

## Produto e colaboração

- Autenticação.
- Gestão real de usuários.
- Multiusuário.
- Controle de acesso.
- Multi-tenancy.

## Gestão de projetos

- Entidade dedicada para mudanças de escopo.
- Gestão avançada de recursos.
- Evolução do modelo de alocação.

## Integrações

- Jira.
- Azure DevOps.
- Outras ferramentas de gestão de projetos.

## Comunicação

- Notificações por e-mail.
- Integração com Slack.
- Alertas de deterioração do Health Score.

## Relatórios

- Exportação de relatórios executivos em PDF.
- Relatórios históricos avançados.

## Health Score

- Calibração dos pesos utilizando dados reais de utilização.
- Evolução das dimensões e penalizações com base em evidências de produção.

## Qualidade

- Testes E2E com Playwright.
- Expansão da cobertura de cenários de integração.

---

# Princípios mantidos durante o desenvolvimento

O desenvolvimento do Project Risk AI seguiu alguns princípios fundamentais:

### Desenvolvimento incremental

Cada fase possuía objetivo, entregas e critério de saída definidos antes do avanço para a próxima etapa.

### Determinismo onde necessário

O Health Score permanece independente de modelos generativos.

### IA como apoio

Claude atua como ferramenta de apoio à decisão, nunca como autoridade automática sobre os dados.

### Human-in-the-loop

Toda sugestão produzida pela IA exige revisão humana.

### Segurança por arquitetura

Credenciais e integrações sensíveis permanecem exclusivamente no backend.

### Documentação como parte do produto

PRD, arquitetura, metodologia do Health Score e roadmap foram mantidos como artefatos do processo de desenvolvimento.

---

# Status final

| Área | Status |
|---|---|
| Foundation | ✅ Concluído |
| Project Management | ✅ Concluído |
| Risk Management | ✅ Concluído |
| Health Score Engine | ✅ Concluído |
| Dashboard Executivo | ✅ Concluído |
| AI Risk Advisor | ✅ Concluído |
| Testes | ✅ Concluído |
| CI | ✅ Concluído |
| Security Review | ✅ Concluído |
| PostgreSQL Produção | ✅ Concluído |
| Deploy Vercel | ✅ Concluído |
| Claude API Produção | ✅ Validado |
| MVP | 🟢 **Em produção** |

---

**Project Risk AI**  
Project Risk Management powered by Data + AI

🌐 https://project-risk-ai.vercel.app/
