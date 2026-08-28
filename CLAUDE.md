@AGENTS.md

# Governança de documentação

Sempre que uma implementação alterar qualquer um dos itens abaixo, a atualização da documentação correspondente faz parte da mesma tarefa — não é um passo separado, opcional ou que aguarda pedido explícito do usuário:

- comportamento funcional;
- regra de negócio;
- arquitetura;
- modelo de dados (schema Prisma/migrations);
- API (rotas, contratos de request/response);
- variável de ambiente;
- processo de execução/deploy;
- Health Score (fórmula, pesos, dimensões);
- integração com IA (Claude API);
- ou qualquer outro comportamento já descrito em `README.md`, `PRD.md`, `ARCHITECTURE.md`, `HEALTH_SCORE.md` ou `ROADMAP.md`.

Procedimento obrigatório, dentro da mesma tarefa que implementa a mudança:

1. Identificar quais desses documentos são impactados pela alteração.
2. Atualizar apenas os documentos realmente desatualizados, para refletir com exatidão o comportamento atual do sistema — sem inflar o escopo da tarefa além do necessário.
3. Ao final, relatar quais documentos foram revisados e quais foram efetivamente alterados (a resposta pode ser "nenhum, pois não há impacto documental relevante").

Não é necessário alterar documentação quando a mudança não tiver impacto documental relevante (ex.: refatoração interna sem mudança de comportamento observável, ajuste de teste, correção de formatação).

A documentação nunca deve descrever funcionalidades, regras ou comportamentos ainda não implementados como se já estivessem disponíveis. Em caso de dúvida sobre o que está de fato implementado, verificar o código-fonte antes de documentar.

Esta regra não altera as exigências já praticadas neste projeto de aprovação explícita e separada do usuário para commit, push e deploy — atualizar documentação não dispensa essas aprovações.
