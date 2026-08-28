# PRD — Project Risk AI

## 1. Problema

Em projetos de TI, riscos relevantes costumam ser identificados tarde demais. As informações que permitiriam antecipá-los — atrasos em marcos, dependências travadas, riscos sem dono ou sem plano de mitigação — ficam dispersas em planilhas, atas de reunião, e-mails e na percepção individual de cada gestor. Não existe um lugar único que consolide esses sinais e traduza a "saúde" do projeto em um indicador simples e auditável.

## 2. Objetivo

Criar uma aplicação web que centralize dados estruturados de projetos (cronograma, marcos, dependências, riscos) e produza:

1. um **Health Score** determinístico e explicável (0–100) por projeto;
2. um **dashboard executivo** para leitura rápida de portfólio;
3. um **AI Risk Advisor**, que usa a API do Claude como apoio à decisão — nunca como autoridade automática sobre os dados do projeto.

Objetivo secundário (não funcional, mas declarado): servir como estudo de caso público de desenvolvimento assistido por Claude Code, com histórico de decisões documentado.

## 3. Público-alvo

Gerentes de Projetos, PMOs, Tech Leads, Product Owners e demais profissionais responsáveis por acompanhar a execução de iniciativas de tecnologia — tipicamente responsáveis por um portfólio pequeno/médio de projetos (não uma carteira massiva com centenas de projetos simultâneos).

## 4. Proposta de valor

- Reduz o tempo entre "o risco existe" e "o gestor percebeu o risco".
- Substitui a sensação subjetiva de "esse projeto está mal" por um número reprodutível e decomponível em fatores.
- Usa IA para sugerir o que um analista experiente perguntaria primeiro, sem tirar do gestor a decisão final.

## 5. Personas

**Marina — Gerente de Projetos de TI**
Acompanha 4–8 projetos simultâneos. Precisa, em poucos minutos por semana, saber quais projetos merecem atenção imediata e por quê. Não tem tempo para atualizar múltiplas planilhas.

**Rafael — Coordenador de PMO**
Responde a diretoria sobre a saúde do portfólio. Precisa de um número defensável (não uma "caixa preta de IA") que possa explicar em uma reunião executiva.

**Beatriz — Tech Lead**
Não gerencia o projeto formalmente, mas identifica riscos técnicos (dependências de integração, dívida técnica) que o PM nem sempre registra. Usa o sistema para registrar riscos técnicos e ver se batem com o que a IA identificou.

## 6. Casos de uso principais

1. Como gestor, cadastro um projeto com datas, responsável e criticidade.
2. Como gestor, cadastro marcos com data planejada e, ao concluir, registro a data realizada.
3. Como gestor, registro dependências internas/externas com criticidade e status.
4. Como gestor, registro riscos com probabilidade, impacto, severidade calculada, responsável e mitigação.
5. Como gestor, visualizo o Health Score do projeto e entendo **por que** ele é o que é (breakdown por fator).
6. Como gestor de portfólio, acesso um dashboard com todos os projetos, seus Health Scores e alertas críticos.
7. Como gestor, acesso o histórico do Health Score do projeto ao longo do tempo.
8. Como gestor, solicito uma análise do AI Risk Advisor para um projeto e recebo riscos sugeridos, sinais de deterioração e um resumo executivo.
9. Como gestor, reviso uma sugestão de risco da IA e decido aceitá-la (o que pré-preenche um novo risco para eu confirmar) ou descartá-la — a IA nunca cria o risco sozinha.

## 7. Requisitos funcionais

### RF01 — Gestão de Projetos

Cadastro, edição, exclusão (soft delete) e listagem de projetos com: nome, descrição, responsável, data de início, data prevista de término, status, percentual de progresso, tamanho da equipe, criticidade, observações.

### RF02 — Milestones

CRUD de marcos vinculados a um projeto: descrição, data planejada, data realizada, status, responsável.

A data realizada só pode ser preenchida quando o status do marco for "Concluído" — nesse caso, ela é obrigatória. Para qualquer outro status, o campo permanece vazio e desabilitado na interface; se um marco concluído tiver seu status alterado para outro valor, a data realizada é automaticamente limpa pelo servidor.

### RF03 — Dependências

CRUD de dependências vinculadas a um projeto: descrição, tipo (interna/externa), responsável, criticidade, status.

### RF04 — Riscos

CRUD de riscos vinculados a um projeto: título, descrição, categoria, probabilidade (1–5), impacto (1–5), severidade (calculada automaticamente = probabilidade × impacto), responsável, estratégia de mitigação, status.

### RF05 — Project Health Score

Cálculo determinístico do Health Score (0–100) por projeto, com breakdown por dimensão (Prazo, Escopo, Dependências, Recursos, Riscos), recalculado sob demanda e versionado no histórico. Metodologia completa em `HEALTH_SCORE.md`.

### RF06 — Histórico do Health Score

Persistência de snapshots do score ao longo do tempo, com visualização em série temporal (tendência de melhora/piora).

### RF07 — Dashboard Executivo

Visão consolidada de todos os projetos: contagem por faixa de saúde (Saudável/Atenção/Risco/Crítico), riscos críticos abertos, milestones atrasados, e lista de projetos ordenável por Health Score.

### RF08 — AI Risk Advisor

Endpoint que, a partir dos dados atuais de um projeto, chama a API do Claude (no backend) e retorna: riscos potenciais não cadastrados, sinais de deterioração, sugestões de mitigação, resumo executivo. Toda sugestão fica registrada com status `pending` e exige ação explícita do usuário (aceitar/descartar) para virar dado oficial.

### RF09 — Estados de carregamento e vazio

Toda tela que depende de dados assíncronos deve tratar explicitamente: carregando, vazio (sem dados ainda) e erro.

### RF10 — Autenticação e contas de usuário

A aplicação exige login para acesso a qualquer página ou endpoint funcional, exceto as telas de login e cadastro. Cadastro público por nome/e-mail/senha (`User` no banco, e-mail único, senha em hash `scrypt` — nunca texto puro); login por e-mail/senha; sessão mantida por cookie assinado (`httpOnly`, `Secure` em produção); logout invalida a sessão e impede novo acesso sem login novamente. Cada `Project` pertence a exatamente um usuário (RF11); não há cadastro assistido por convite, confirmação de e-mail ou recuperação de senha nesta fase (ver §12).

### RF11 — Isolamento de dados por usuário

Todo `Project` tem um proprietário (`userId`) obrigatório. Um usuário só pode listar, visualizar, criar, editar ou excluir projetos — e, por extensão, marcos, dependências, riscos, Health Score e sugestões de IA — que pertençam à sua própria conta. Uma tentativa de acessar um recurso de outro usuário (inclusive manipulando o ID na URL) deve resultar em "não encontrado", nunca em exposição do dado ou do fato de que ele existe. Essa mesma regra vale para um projeto excluído (soft-delete, RF01): ele e todos os seus recursos ficam congelados contra edição/exclusão mesmo para o próprio dono, não só entre contas diferentes.

## 8. Requisitos não funcionais

- **RNF01 — Determinismo do Health Score**: o cálculo não pode depender de IA nem de qualquer fonte não determinística; mesma entrada → mesma saída, sempre.
- **RNF02 — Segurança de credenciais**: nenhuma chave de API (Claude ou banco) exposta ao frontend ou versionada no repositório.
- **RNF03 — Resiliência**: indisponibilidade da API do Claude não pode derrubar nem degradar as funcionalidades essenciais (cadastro de projetos, riscos, Health Score).
- **RNF04 — Desempenho percebido**: telas principais (dashboard, detalhe de projeto) devem responder em menos de ~1s com carga de dados típica de portfólio pequeno/médio (dezenas de projetos, centenas de riscos).
- **RNF05 — Auditabilidade**: todo cálculo de Health Score deve ser rastreável ao seu breakdown de fatores; toda sugestão de IA deve ficar registrada com o prompt/contexto usado (para fins de portfólio/demonstração, não é necessário compliance formal).
- **RNF06 — Portabilidade local**: o projeto deve rodar localmente com um número mínimo de dependências externas (banco de dados via Docker Compose, sem serviços pagos obrigatórios para desenvolvimento).
- **RNF07 — Custo**: hospedagem e banco de dados devem operar em camada gratuita/baixo custo adequada a um projeto de portfólio.
- **RNF08 — Tipagem e validação**: toda fronteira de API deve validar entrada (schema) antes de tocar o banco.

## 9. Regras de negócio

1. **Severidade do risco** = probabilidade (1–5) × impacto (1–5), resultando em 1–25, classificada em faixas (Baixa/Média/Alta/Crítica) — ver `HEALTH_SCORE.md`.
2. Um risco com status "Encerrado" ou "Mitigado" não entra no cálculo de penalização do Health Score.
3. Classificação de prazo de um milestone (mesma regra usada pela UI, pelo Dashboard Executivo e pelo Health Score):
   - status "Cancelado": nunca é considerado atrasado, independentemente das datas.
   - status "Concluído": atrasado ("conclusão com atraso") se `dataRealizada` for posterior a `dataPlanejada`; caso contrário, no prazo.
   - qualquer outro status (marco ainda aberto): atrasado ("atraso aberto") se `dataPlanejada` já tiver passado a data de referência (comparação por dia, em UTC, para evitar falsos positivos por fuso horário); uma `dataRealizada` eventualmente presente é ignorada nesse caso — inclusive para dados legados/inconsistentes anteriores a esta regra — pois só é considerada válida quando o status é "Concluído" (ver RF02).
   - `dataRealizada` só pode existir quando o status é "Concluído"; o backend normaliza (limpa) o campo sempre que o status efetivo não for esse, tanto na criação quanto na edição parcial de um marco.
4. Sugestões da IA nunca alteram diretamente Projeto, Milestone, Dependência ou Risco. Uma sugestão aceita gera um **rascunho** pré-preenchido que o usuário deve revisar e salvar explicitamente.
5. O Health Score é sempre recalculado a partir do estado atual dos dados — não é editável manualmente.
6. Todo projeto tem exatamente um snapshot de Health Score por dia (o mais recente do dia sobrescreve o anterior do mesmo dia na leitura do histórico diário), garantindo uma série temporal utilizável sem explosão de registros.
7. Disparo do AI Risk Advisor é limitado por dois controles independentes: um cooldown de 5 minutos por projeto, e um limite de 20 análises por usuário a cada 24 horas (contando todos os projetos daquele usuário) — o segundo existe especificamente para conter o consumo da Anthropic API por uma única conta, já que o cooldown por projeto sozinho não limita alguém que dispara análises em vários projetos em sequência.
8. **Viabilidade do prazo restante** (dimensão Prazo do Health Score, `HEALTH_SCORE.md` §4.3): projetos com status "Em andamento" ou "Em espera" e `dataTérmino` definida são avaliados pelo ritmo diário necessário para concluir a tempo (`progressoFaltante / diasRestantes`, com piso de 1 dia restante). Detecta incoerências que o fator de progresso vs. tempo decorrido (§4.2) não captura — em especial um projeto recém-criado, sem atraso acumulado, mas com prazo já fisicamente incompatível com o trabalho pendente (ex.: "Em andamento", 0% de progresso, término previsto para amanhã). Projetos "Planejados", "Concluídos" e "Cancelados" ficam fora dessa avaliação.

## 10. Critérios de aceite (MVP)

- É possível cadastrar um projeto completo, com pelo menos um milestone, uma dependência e um risco, sem erros, com validação de campos obrigatórios.
- O Health Score do projeto é exibido com breakdown por dimensão e é recalculado corretamente ao alterar qualquer dado que o influencie (ex.: mudar status de um risco crítico de "Aberto" para "Mitigado" deve mudar o score).
- O dashboard lista todos os projetos com seu Health Score e classificação, sem exigir refresh manual desnecessário.
- O histórico do Health Score mostra pelo menos os snapshots gerados desde a criação do projeto.
- Ao solicitar análise do AI Risk Advisor, o sistema exibe sugestões claramente marcadas como "Sugestão de IA" e nenhuma delas é persistida como dado oficial sem confirmação do usuário.
- Se a API do Claude estiver indisponível ou expirar por timeout, o restante da aplicação continua funcional e o módulo de IA exibe uma mensagem de indisponibilidade temporária.
- Nenhuma chave de API aparece no frontend (verificável via dev tools/network) nem no repositório Git.

## 11. Escopo do MVP

Inclui: RF01–RF11 conforme descrito acima. Cada usuário tem sua própria conta e seus próprios dados (RF10/RF11); campos de responsável dentro de um projeto continuam texto livre (não são contas de usuário).

## 12. Fora do escopo (nesta fase)

- Recuperação de senha, confirmação de e-mail, login social, RBAC (papéis/permissões dentro de uma conta), organizações/equipes e multi-tenancy empresarial (múltiplos usuários compartilhando o mesmo portfólio) — RF10/RF11 cobrem apenas contas individuais isoladas entre si.
- Notificações (e-mail, Slack, push).
- Exportação de relatórios (PDF/Excel).
- Anexos de arquivos em riscos/marcos.
- Log de auditoria completo (quem alterou o quê e quando) além do necessário para sugestões de IA.
- Integrações externas (Jira, Azure DevOps, etc.).
- Mobile app nativo.
- Internacionalização (i18n) — MVP em português (Brasil).
- Entidades dedicadas de "mudança de escopo" e "alocação de recursos" (as dimensões Escopo e Recursos do Health Score usam, no MVP, riscos categorizados como proxy — ver limitação documentada em `HEALTH_SCORE.md`).

## 13. Roadmap inicial

Ver `ROADMAP.md` para o detalhamento fase a fase. Resumo:

1. Foundation (setup, infra, modelo de dados)
2. Project Management Core (CRUD de projetos/milestones/dependências)
3. Risk Management (CRUD de riscos)
4. Project Health Engine (cálculo, breakdown, histórico)
5. Dashboard Executivo
6. AI Risk Advisor (Claude API)
7. Hardening, testes e deploy
