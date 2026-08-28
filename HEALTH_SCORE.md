# HEALTH_SCORE — Metodologia do Project Health Score

## 1. Princípios

1. **Determinístico** — mesma entrada produz sempre a mesma saída. Nenhuma chamada a LLM participa do cálculo.
2. **Explicável** — todo score se decompõe em dimensões e cada dimensão se decompõe em penalizações individuais rastreáveis a um dado concreto (um marco atrasado, um risco crítico sem mitigação, etc.).
3. **Auditável** — o breakdown completo é persistido junto com o score (`HealthScoreSnapshot.breakdown`), não apenas o número final.
4. **Reproduzível** — dado o estado do banco em um instante, qualquer pessoa (ou teste automatizado) recalcula o mesmo valor.
5. **Independente de IA** — a Claude API pode sugerir riscos e mitigações, mas nunca é entrada do cálculo do score.

## 2. Visão geral da fórmula

```
Health Score = 100 − Σ (penalidade de cada dimensão)
```

O score começa em 100 (projeto perfeito) e perde pontos por dimensão. Cada dimensão tem um **teto de penalização** (não pode, sozinha, derrubar o score além do seu peso máximo), o que evita que um único fator extremo distorça o todo, mas ainda assim permite que a soma de vários problemas leve o score a zero.

| Dimensão     | Penalização máxima | O que mede                                                   |
| ------------ | -----------------: | ------------------------------------------------------------ |
| Riscos       |                 30 | Riscos abertos, sua severidade e ausência de mitigação       |
| Prazo        |                 25 | Atraso de marcos e progresso vs. esperado                    |
| Dependências |                 20 | Dependências críticas travadas ou em risco                   |
| Escopo       |                 15 | Riscos categorizados como "Escopo" abertos (proxy, ver §7)   |
| Recursos     |                 10 | Riscos categorizados como "Recursos" abertos (proxy, ver §7) |
| **Total**    |            **100** |                                                              |

`Score = max(0, 100 − PenalidadeRiscos − PenalidadePrazo − PenalidadeDependências − PenalidadeEscopo − PenalidadeRecursos)`

Cada dimensão também é classificada individualmente (para o dashboard "Prazo → Atenção", "Riscos → Crítico" etc.) convertendo sua própria penalização em uma pontuação de 0–100: `ScoreDimensão = 100 − (PenalidadeDimensão / PesoMáximoDimensão) × 100`.

### Faixas de classificação (aplicadas ao score geral e a cada dimensão)

|  Faixa | Classificação |
| -----: | ------------- |
| 90–100 | Saudável      |
|  75–89 | Atenção       |
|  60–74 | Risco         |
|   0–59 | Crítico       |

## 3. Dimensão: Riscos (peso máximo 30)

A dimensão mais pesada, porque riscos abertos são o sinal mais direto de ameaça ao projeto.

Para cada risco **aberto** (status ≠ "Mitigado"/"Encerrado"):

1. **Severidade** = probabilidade (1–5) × impacto (1–5) → 1–25, classificada em:
   - 1–4: Baixa
   - 5–9: Média
   - 10–15: Alta
   - 16–25: Crítica

2. **Penalidade base do risco**:

   | Severidade | Penalidade base |
   | ---------- | --------------: |
   | Baixa      |             0,5 |
   | Média      |             1,5 |
   | Alta       |             3,5 |
   | Crítica    |             6,0 |

3. **Agravante — sem mitigação**: se `mitigationStrategy` estiver vazio, a penalidade base do risco é multiplicada por **1,5**.

4. **Penalidade total da dimensão** = soma das penalidades de todos os riscos abertos, **limitada a 30**.

> Isso implementa diretamente os fatores "riscos abertos", "severidade dos riscos" e "riscos sem mitigação" pedidos na proposta original, e penaliza mais que proporcionalmente um risco crítico sem plano de ação (6,0 × 1,5 = 9,0 pontos sozinho).

## 4. Dimensão: Prazo (peso máximo 25)

Combina dois fatores: atraso de marcos já ocorrido e descolamento entre progresso esperado e realizado.

### 4.1 Atraso de marcos (até 15 pontos)

A classificação de atraso segue a regra de negócio do PRD (§9.3), implementada em `domain/milestones/schedule.ts` — fonte única usada também pela UI e pelo Dashboard Executivo, para que os três nunca divirjam entre si:

- marcos com status "Cancelado" nunca são penalizados;
- marcos "Concluídos" são avaliados por `dataRealizada` vs. `dataPlanejada` ("conclusão com atraso");
- marcos ainda abertos são avaliados por `dataPlanejada` vs. a data de referência, por dia (UTC) — uma `dataRealizada` porventura presente (dado legado/inconsistente) é ignorada, já que só é válida quando o status é "Concluído".

Para cada marco atrasado, o número de dias de atraso usa uma data de comparação diferente conforme o caso:

```
dataComparação = dataRealizada, se o marco foi concluído com atraso
dataComparação = dataReferência (hoje), se o marco ainda está aberto e atrasado

diasAtraso = max(0, dataComparação − dataPlanejada em dias)
penalidadeMarco = min(5, diasAtraso / 7 × 1,5)
```

(ou seja, cada semana de atraso soma 1,5 ponto por marco, até um teto individual de 5 pontos por marco; um marco ainda em aberto tem sua penalidade recalculada a cada dia — "cresce" enquanto não for concluído — enquanto um marco concluído com atraso fica com penalidade fixa, ancorada na data em que de fato terminou)

`PenalidadeAtrasoMarcos = min(15, Σ penalidadeMarco)`

### 4.2 Progresso esperado vs. realizado (até 10 pontos)

```
progressoEsperado = (diasDecorridos / diasTotaisDoProjeto) × 100
gap = max(0, progressoEsperado − progressoRealizado)
PenalidadeProgresso = min(10, gap / 5)
```

(cada 5 pontos percentuais de atraso de progresso custam 1 ponto de score, até o teto de 10)

`PenalidadePrazo = min(25, PenalidadeAtrasoMarcos + PenalidadeProgresso)`

## 5. Dimensão: Dependências (peso máximo 20)

Para cada `Dependency` com status **não concluído** ("Aberta", "Bloqueada", "Em risco" etc.):

| Criticidade | Penalidade base |
| ----------- | --------------: |
| Baixa       |               1 |
| Média       |               3 |
| Alta        |               6 |
| Crítica     |              10 |

**Agravante — bloqueada**: se `status = "Bloqueada"`, penalidade base × 1,5.

`PenalidadeDependências = min(20, Σ penalidade de cada dependência aberta)`

## 6. Dimensões Escopo e Recursos (peso máximo 15 e 10 — proxy via categoria de risco)

**Decisão registrada (aprovada com o usuário)**: o MVP não possui entidades dedicadas para "mudança de escopo" nem "alocação de resources". Essas duas dimensões são calculadas, no v1, como um proxy a partir de riscos **abertos** cuja `category` seja, respectivamente, `"Escopo"` ou `"Recursos"`.

Fórmula (igual à dimensão Riscos, mas aplicada apenas ao subconjunto de riscos daquela categoria, com teto próprio):

```
PenalidadeEscopo = min(15, Σ penalidadeRisco onde category = "Escopo")
PenalidadeRecursos = min(10, Σ penalidadeRisco onde category = "Recursos")
```

usando a mesma tabela de penalidade base por severidade e o mesmo agravante de "sem mitigação" da §3.

> **Limitação conhecida, documentada de propósito**: se o gestor nunca registrar um risco de categoria "Escopo" ou "Recursos", essas dimensões aparecerão sempre como "Saudável" (100), mesmo que exista um problema real de escopo não capturado como risco formal. Isso é aceitável para o MVP porque mantém a fórmula simples e 100% baseada em dados já coletados, mas é uma limitação a comunicar na UI (ex.: tooltip "baseado nos riscos categorizados") e um candidato natural de evolução (roadmap: entidade de log de mudança de escopo e campo de alocação de recursos, ver `ROADMAP.md`).

## 7. Exemplo completo de cálculo

**Projeto X** — prazo final em 60 dias, início há 30 dias (50% do tempo decorrido), progresso realizado informado: 30%.

Dados:

- 2 marcos atrasados: um há 10 dias, outro há 3 dias.
- 1 dependência crítica bloqueada, 1 dependência média aberta.
- Riscos abertos:
  - Risco A — categoria "Tecnologia", severidade Crítica (25), sem mitigação.
  - Risco B — categoria "Dependência externa", severidade Alta (12), com mitigação.
  - Risco C — categoria "Escopo", severidade Média (6), sem mitigação.
- Nenhum risco de categoria "Recursos".

### Prazo

- Marco 1: 10 dias → min(5, 10/7×1,5) = min(5, 2,14) = 2,14
- Marco 2: 3 dias → min(5, 3/7×1,5) = min(5, 0,64) = 0,64
- PenalidadeAtrasoMarcos = min(15, 2,78) = 2,78
- progressoEsperado = 50%, progressoRealizado = 30% → gap = 20 → PenalidadeProgresso = min(10, 20/5) = 4
- **PenalidadePrazo = min(25, 2,78 + 4) = 6,78**

### Dependências

- Crítica bloqueada: 10 × 1,5 = 15
- Média aberta: 3
- **PenalidadeDependências = min(20, 18) = 18**

### Riscos

- Risco A: Crítica (6,0) × 1,5 (sem mitigação) = 9,0
- Risco B: Alta (3,5), com mitigação = 3,5
- **PenalidadeRiscos = min(30, 12,5) = 12,5**
  (Risco C não entra aqui — é contado na dimensão Escopo, não duplicado)

### Escopo

- Risco C: Média (1,5) × 1,5 (sem mitigação) = 2,25
- **PenalidadeEscopo = min(15, 2,25) = 2,25**

### Recursos

- **PenalidadeRecursos = 0**

### Resultado final

```
Score = 100 − 6,78 − 18 − 12,5 − 2,25 − 0 = 60,47 → 60 (arredondado)
```

**Health Score: 60/100 → Risco** (limite entre Risco e Crítico — este projeto está a um risco crítico adicional ou uma dependência a mais de virar Crítico).

Breakdown por dimensão (score 0–100 de cada uma):

- Prazo: 100 − (6,78/25×100) = 72,9 → **Risco**
- Dependências: 100 − (18/20×100) = 10 → **Crítico**
- Riscos: 100 − (12,5/30×100) = 58,3 → **Crítico**
- Escopo: 100 − (2,25/15×100) = 85 → **Atenção**
- Recursos: 100 → **Saudável**

Isso é exatamente o formato do dashboard executivo da proposta original: cada dimensão com seu próprio veredito, mais o score geral.

## 8. Casos extremos

- **Projeto recém-criado, sem marcos/riscos/dependências cadastrados**: todas as penalidades = 0 → Score = 100 (Saudável). Isso é intencional — o score reflete o que está registrado, não avalia a completude do cadastro (a UI deve indicar separadamente "dados insuficientes" se, por exemplo, zero riscos estiverem cadastrados, para não passar falsa sensação de segurança).
- **Todas as dimensões no teto de penalização simultaneamente**: Score = 100 − 30 − 25 − 20 − 15 − 10 = 0 → Crítico. O piso é 0, nunca negativo.
- **Progresso realizado maior que o esperado** (`gap` negativo): `PenalidadeProgresso = 0` (não gera bônus — o score não ultrapassa 100 por adiantamento).
- **Projeto sem `endDate` definida**: `progressoEsperado` não pode ser calculado; a `PenalidadeProgresso` dessa fórmula é tratada como 0 e a UI sinaliza "prazo final não definido" separadamente (não é possível avaliar aderência a um prazo inexistente).

## 9. Frequência de cálculo e histórico

- O score é **sempre recalculado ao vivo** quando o usuário abre o projeto (não fica desatualizado esperando um job).
- Um **snapshot diário** é persistido via rotina agendada (Vercel Cron, uma vez ao dia — ver `ARCHITECTURE.md` §11), garantindo uma série histórica (`HealthScoreSnapshot`) sem depender de o usuário abrir a tela naquele dia.
- A UI de histórico agrega os snapshots diários em visão semanal quando fizer sentido para leitura (ex.: "Semana 1: 91, Semana 2: 86..."), mas o dado granular armazenado é diário.

## 10. Calibração (v1)

Os pesos e constantes acima (30/25/20/15/10, penalidades base por severidade, multiplicador de 1,5 para "sem mitigação"/"bloqueada") são uma **primeira proposta razoável**, não um resultado estatístico. Devem ser tratados como configuráveis (constantes isoladas em `domain/health-score/calculate.ts`, não espalhadas pelo código) e revisitados após uso real com projetos reais — idealmente documentando qualquer mudança de peso como uma decisão versionada (changelog neste arquivo), já que altera retroativamente a interpretação do histórico.
