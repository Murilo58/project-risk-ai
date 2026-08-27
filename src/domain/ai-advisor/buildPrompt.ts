import type { HealthScoreResult } from "@/domain/health-score/calculate";
import {
  CRITICALITY_LABELS,
  DEPENDENCY_STATUS_LABELS,
  MILESTONE_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  RISK_CATEGORY_LABELS,
  RISK_STATUS_LABELS,
  type Criticality,
  type DependencyStatus,
  type MilestoneStatus,
  type ProjectStatus,
  type RiskCategory,
  type RiskStatus,
} from "@/lib/enums";

export type PromptProject = {
  name: string;
  description: string | null;
  owner: string;
  startDate: Date;
  endDate: Date | null;
  status: ProjectStatus;
  progressPercent: number;
  teamSize: number | null;
  criticality: Criticality;
  notes: string | null;
};

export type PromptMilestone = {
  description: string;
  plannedDate: Date;
  actualDate: Date | null;
  status: MilestoneStatus;
};

export type PromptDependency = {
  description: string;
  criticality: Criticality;
  status: DependencyStatus;
};

export type PromptRisk = {
  title: string;
  category: RiskCategory;
  probability: number;
  impact: number;
  severity: number;
  status: RiskStatus;
  mitigationStrategy: string | null;
};

function fmtDate(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "não definida";
}

export function buildPrompt(input: {
  project: PromptProject;
  milestones: PromptMilestone[];
  dependencies: PromptDependency[];
  risks: PromptRisk[];
  healthScore: HealthScoreResult;
}): string {
  const { project, milestones, dependencies, risks, healthScore } = input;

  const lines: string[] = [];

  lines.push(`## Projeto: ${project.name}`);
  lines.push(`Descrição: ${project.description ?? "(sem descrição)"}`);
  lines.push(`Responsável: ${project.owner}`);
  lines.push(`Status: ${PROJECT_STATUS_LABELS[project.status]}`);
  lines.push(`Criticidade: ${CRITICALITY_LABELS[project.criticality]}`);
  lines.push(`Progresso informado: ${project.progressPercent}%`);
  lines.push(`Tamanho da equipe: ${project.teamSize ?? "não informado"}`);
  lines.push(`Data de início: ${fmtDate(project.startDate)}`);
  lines.push(`Data prevista de término: ${fmtDate(project.endDate)}`);
  if (project.notes) lines.push(`Observações: ${project.notes}`);

  lines.push("");
  lines.push(
    `## Project Health Score atual: ${healthScore.score}/100 (${healthScore.band})`,
  );
  for (const [key, dim] of Object.entries(healthScore.dimensions)) {
    lines.push(`- ${key}: ${dim.score}/100 (${dim.band})`);
    for (const note of dim.notes) lines.push(`  - ${note}`);
  }

  lines.push("");
  lines.push(`## Marcos (${milestones.length})`);
  if (milestones.length === 0) lines.push("Nenhum marco cadastrado.");
  for (const m of milestones) {
    lines.push(
      `- ${m.description}: planejado para ${fmtDate(m.plannedDate)}, realizado em ${fmtDate(m.actualDate)}, status ${MILESTONE_STATUS_LABELS[m.status]}`,
    );
  }

  lines.push("");
  lines.push(`## Dependências (${dependencies.length})`);
  if (dependencies.length === 0) lines.push("Nenhuma dependência cadastrada.");
  for (const d of dependencies) {
    lines.push(
      `- ${d.description}: criticidade ${CRITICALITY_LABELS[d.criticality]}, status ${DEPENDENCY_STATUS_LABELS[d.status]}`,
    );
  }

  lines.push("");
  lines.push(`## Riscos já cadastrados (${risks.length})`);
  if (risks.length === 0) lines.push("Nenhum risco cadastrado.");
  for (const r of risks) {
    lines.push(
      `- ${r.title} [${RISK_CATEGORY_LABELS[r.category]}]: severidade ${r.severity} (prob. ${r.probability}, impacto ${r.impact}), status ${RISK_STATUS_LABELS[r.status]}, mitigação: ${r.mitigationStrategy ?? "não definida"}`,
    );
  }

  return lines.join("\n");
}

export const AI_ADVISOR_SYSTEM_PROMPT = `Você é um analista sênior de riscos de projetos de TI atuando como apoio à decisão (Decision Support System) dentro do Project Risk AI.

Sua tarefa é analisar os dados estruturados de um projeto (fornecidos pelo usuário) e produzir, em português do Brasil:
1. Um resumo executivo curto (2-4 frases) sobre a situação do projeto.
2. Uma lista de pontos de atenção objetivos (combinações de sinais que merecem atenção do gestor).
3. Uma lista de riscos potenciais AINDA NÃO CADASTRADOS que você identifica a partir dos dados — nunca repita um risco já listado em "Riscos já cadastrados".

Regras importantes:
- Você não tem autoridade para alterar dados do projeto. Suas sugestões de risco serão sempre revisadas e confirmadas manualmente pelo usuário antes de se tornarem oficiais.
- Baseie-se apenas nos dados fornecidos. Não invente marcos, dependências ou riscos que não estejam implícitos nos dados.
- Se os dados não sugerirem nenhum risco novo relevante, retorne uma lista vazia de riscos sugeridos — não force sugestões artificiais.
- Probabilidade e impacto devem ser inteiros de 1 a 5.
- Seja específico e acionável na estratégia de mitigação sugerida para cada risco.`;
