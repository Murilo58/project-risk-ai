// Shapes as they come back over the wire (JSON — Date becomes an ISO string).
import type {
  Criticality,
  DependencyStatus,
  DependencyType,
  MilestoneStatus,
  ProjectStatus,
  RiskCategory,
  RiskStatus,
} from "@/lib/enums";

export type Milestone = {
  id: string;
  projectId: string;
  description: string;
  plannedDate: string;
  actualDate: string | null;
  status: MilestoneStatus;
  owner: string;
  createdAt: string;
  updatedAt: string;
};

export type Dependency = {
  id: string;
  projectId: string;
  description: string;
  type: DependencyType;
  owner: string;
  criticality: Criticality;
  status: DependencyStatus;
  createdAt: string;
  updatedAt: string;
};

export type Risk = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  category: RiskCategory;
  probability: number;
  impact: number;
  severity: number;
  owner: string;
  mitigationStrategy: string | null;
  status: RiskStatus;
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  owner: string;
  startDate: string;
  endDate: string | null;
  status: ProjectStatus;
  progressPercent: number;
  teamSize: number | null;
  criticality: Criticality;
  notes: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectListItem = Project & {
  _count: { milestones: number; dependencies: number; risks: number };
};

export type ProjectDetail = Project & {
  milestones: Milestone[];
  dependencies: Dependency[];
  risks: Risk[];
};

export type AiSuggestionType = "RISK" | "EXECUTIVE_SUMMARY";
export type AiSuggestionStatus = "PENDING" | "ACCEPTED" | "DISMISSED";

export type AiRiskSuggestionContent = {
  title: string;
  description: string;
  category: RiskCategory;
  probability: number;
  impact: number;
  mitigationStrategy: string;
};

export type AiExecutiveSummaryContent = {
  summary: string;
  attentionPoints: string[];
};

export type AiSuggestion = {
  id: string;
  projectId: string;
  type: AiSuggestionType;
  content: AiRiskSuggestionContent | AiExecutiveSummaryContent;
  status: AiSuggestionStatus;
  createdAt: string;
  updatedAt: string;
};
