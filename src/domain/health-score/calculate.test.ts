import { describe, expect, it } from "vitest";

import {
  calculateHealthScore,
  classify,
  type HealthScoreDependency,
  type HealthScoreMilestone,
  type HealthScoreRisk,
} from "@/domain/health-score/calculate";

const REF = new Date(Date.UTC(2026, 0, 1)); // 2026-01-01
const days = (n: number) => new Date(REF.getTime() + n * 24 * 60 * 60 * 1000);

const emptyProject = {
  startDate: days(-30),
  endDate: null,
  progressPercent: 0,
  status: "IN_PROGRESS" as const,
};

describe("classify", () => {
  it("applies the documented thresholds", () => {
    expect(classify(100)).toBe("HEALTHY");
    expect(classify(90)).toBe("HEALTHY");
    expect(classify(89)).toBe("ATTENTION");
    expect(classify(75)).toBe("ATTENTION");
    expect(classify(74)).toBe("RISK");
    expect(classify(60)).toBe("RISK");
    expect(classify(59)).toBe("CRITICAL");
    expect(classify(0)).toBe("CRITICAL");
  });
});

describe("calculateHealthScore — empty project", () => {
  it("scores 100 (HEALTHY) with no data to penalize", () => {
    const result = calculateHealthScore({
      project: emptyProject,
      milestones: [],
      dependencies: [],
      risks: [],
      referenceDate: REF,
    });

    expect(result.score).toBe(100);
    expect(result.band).toBe("HEALTHY");
    for (const dim of Object.values(result.dimensions)) {
      expect(dim.penalty).toBe(0);
      expect(dim.score).toBe(100);
    }
  });
});

describe("calculateHealthScore — schedule dimension", () => {
  it("penalizes a milestone delayed exactly 7 days by 1.5 points", () => {
    const milestones: HealthScoreMilestone[] = [
      { plannedDate: days(-7), actualDate: null, status: "PLANNED" },
    ];
    const result = calculateHealthScore({
      project: emptyProject,
      milestones,
      dependencies: [],
      risks: [],
      referenceDate: REF,
    });

    expect(result.dimensions.schedule.penalty).toBe(1.5);
    expect(result.dimensions.schedule.score).toBe(94); // 100 - round(1.5/25*100)
  });

  it("never flags a CANCELLED milestone as late, even if overdue", () => {
    const milestones: HealthScoreMilestone[] = [
      { plannedDate: days(-100), actualDate: null, status: "CANCELLED" },
    ];
    const result = calculateHealthScore({
      project: emptyProject,
      milestones,
      dependencies: [],
      risks: [],
      referenceDate: REF,
    });

    expect(result.dimensions.schedule.penalty).toBe(0);
  });

  it("does not penalize a milestone completed on time", () => {
    const milestones: HealthScoreMilestone[] = [
      { plannedDate: days(-10), actualDate: days(-10), status: "COMPLETED" },
    ];
    const result = calculateHealthScore({
      project: emptyProject,
      milestones,
      dependencies: [],
      risks: [],
      referenceDate: REF,
    });

    expect(result.dimensions.schedule.penalty).toBe(0);
  });

  it("still penalizes a non-completed milestone with a stale actualDate (legacy inconsistent data)", () => {
    // Regression: a row that has an actualDate but was never actually
    // moved to COMPLETED must still be judged against its plannedDate,
    // not treated as on-time just because actualDate is present.
    const milestones: HealthScoreMilestone[] = [
      { plannedDate: days(-7), actualDate: days(-7), status: "PLANNED" },
    ];
    const result = calculateHealthScore({
      project: emptyProject,
      milestones,
      dependencies: [],
      risks: [],
      referenceDate: REF,
    });

    expect(result.dimensions.schedule.penalty).toBe(1.5);
  });

  it("penalizes progress behind schedule using elapsed vs. total time", () => {
    // 100-day project, 50 elapsed (50% expected), only 30% done -> gap 20 -> penalty 4
    const project = {
      startDate: days(-50),
      endDate: days(50),
      progressPercent: 30,
      status: "IN_PROGRESS" as const,
    };
    const result = calculateHealthScore({
      project,
      milestones: [],
      dependencies: [],
      risks: [],
      referenceDate: REF,
    });

    expect(result.dimensions.schedule.penalty).toBe(4);
    expect(result.dimensions.schedule.score).toBe(84); // 100 - round(4/25*100)
  });

  it("does not reward progress ahead of schedule", () => {
    const project = {
      startDate: days(-50),
      endDate: days(50),
      progressPercent: 90,
      status: "IN_PROGRESS" as const,
    };
    const result = calculateHealthScore({
      project,
      milestones: [],
      dependencies: [],
      risks: [],
      referenceDate: REF,
    });

    expect(result.dimensions.schedule.penalty).toBe(0);
  });

  it("skips the progress factor when there is no end date", () => {
    const project = {
      startDate: days(-50),
      endDate: null,
      progressPercent: 0,
      status: "IN_PROGRESS" as const,
    };
    const result = calculateHealthScore({
      project,
      milestones: [],
      dependencies: [],
      risks: [],
      referenceDate: REF,
    });

    expect(result.dimensions.schedule.penalty).toBe(0);
    expect(result.dimensions.schedule.notes[0]).toMatch(/não definido/);
  });

  it("caps the schedule penalty at 25", () => {
    const milestones: HealthScoreMilestone[] = Array.from({ length: 10 }, () => ({
      plannedDate: days(-100),
      actualDate: null,
      status: "PLANNED",
    }));
    const project = {
      startDate: days(-100),
      endDate: days(-1),
      progressPercent: 0,
      status: "IN_PROGRESS" as const,
    };
    const result = calculateHealthScore({
      project,
      milestones,
      dependencies: [],
      risks: [],
      referenceDate: REF,
    });

    expect(result.dimensions.schedule.penalty).toBe(25);
    expect(result.dimensions.schedule.score).toBe(0);
  });
});

describe("calculateHealthScore — schedule feasibility factor", () => {
  // These fixtures start "today" (days(0)) so the pre-existing progress-vs-
  // elapsed-time factor stays at 0 (no time has elapsed yet to fall behind
  // on) and each case isolates only the new feasibility factor.

  it("penalizes by the maximum (10) when the deadline is tomorrow and progress is 0%", () => {
    const project = {
      startDate: days(0),
      endDate: days(1),
      progressPercent: 0,
      status: "IN_PROGRESS" as const,
    };
    const result = calculateHealthScore({
      project,
      milestones: [],
      dependencies: [],
      risks: [],
      referenceDate: REF,
    });

    expect(result.dimensions.schedule.penalty).toBe(10);
  });

  it("does not penalize when the deadline is tomorrow but progress is 90%", () => {
    const project = {
      startDate: days(0),
      endDate: days(1),
      progressPercent: 90,
      status: "IN_PROGRESS" as const,
    };
    const result = calculateHealthScore({
      project,
      milestones: [],
      dependencies: [],
      risks: [],
      referenceDate: REF,
    });

    expect(result.dimensions.schedule.penalty).toBe(0);
  });

  it("applies the 'Atenção' band (3 points) for a 7-day deadline with 20% progress", () => {
    // remaining progress 80 / 7 days ≈ 11.43%/day -> "Atenção" band (>10 and <=25)
    const project = {
      startDate: days(0),
      endDate: days(7),
      progressPercent: 20,
      status: "IN_PROGRESS" as const,
    };
    const result = calculateHealthScore({
      project,
      milestones: [],
      dependencies: [],
      risks: [],
      referenceDate: REF,
    });

    expect(result.dimensions.schedule.penalty).toBe(3);
  });

  it("does not apply the factor to a PLANNED project regardless of how tight the deadline is", () => {
    const project = {
      startDate: days(0),
      endDate: days(1),
      progressPercent: 0,
      status: "PLANNED" as const,
    };
    const result = calculateHealthScore({
      project,
      milestones: [],
      dependencies: [],
      risks: [],
      referenceDate: REF,
    });

    expect(result.dimensions.schedule.penalty).toBe(0);
  });

  it("applies the 'Risco' band (6 points) to an ON_HOLD project with a near deadline", () => {
    // remaining progress 70 / 2 days = 35%/day -> "Risco" band (>25 and <=50)
    const project = {
      startDate: days(0),
      endDate: days(2),
      progressPercent: 30,
      status: "ON_HOLD" as const,
    };
    const result = calculateHealthScore({
      project,
      milestones: [],
      dependencies: [],
      risks: [],
      referenceDate: REF,
    });

    expect(result.dimensions.schedule.penalty).toBe(6);
  });

  it("does not apply the factor to a COMPLETED project", () => {
    const project = {
      startDate: days(0),
      endDate: days(1),
      progressPercent: 40,
      status: "COMPLETED" as const,
    };
    const result = calculateHealthScore({
      project,
      milestones: [],
      dependencies: [],
      risks: [],
      referenceDate: REF,
    });

    expect(result.dimensions.schedule.penalty).toBe(0);
  });

  it("treats an already-overdue deadline as a 1-day floor, not a negative pace", () => {
    // endDate before startDate keeps the pre-existing progress-vs-elapsed
    // factor inert (its own totalDays > 0 guard skips it), isolating the
    // floor behavior of the new factor.
    const project = {
      startDate: days(0),
      endDate: days(-1),
      progressPercent: 50,
      status: "IN_PROGRESS" as const,
    };
    const result = calculateHealthScore({
      project,
      milestones: [],
      dependencies: [],
      risks: [],
      referenceDate: REF,
    });

    // remaining progress 50 / 1 day (floor) = 50%/day -> upper edge of "Risco" (not yet > 50)
    expect(result.dimensions.schedule.penalty).toBe(6);
  });
});

describe("calculateHealthScore — dependencies dimension", () => {
  it("applies the 1.5x multiplier for a blocked critical dependency", () => {
    const dependencies: HealthScoreDependency[] = [
      { criticality: "CRITICAL", status: "BLOCKED" },
    ];
    const result = calculateHealthScore({
      project: emptyProject,
      milestones: [],
      dependencies,
      risks: [],
      referenceDate: REF,
    });

    expect(result.dimensions.dependencies.penalty).toBe(15); // 10 * 1.5
    expect(result.dimensions.dependencies.score).toBe(25); // 100 - round(15/20*100)
  });

  it("ignores resolved and cancelled dependencies", () => {
    const dependencies: HealthScoreDependency[] = [
      { criticality: "CRITICAL", status: "RESOLVED" },
      { criticality: "CRITICAL", status: "CANCELLED" },
    ];
    const result = calculateHealthScore({
      project: emptyProject,
      milestones: [],
      dependencies,
      risks: [],
      referenceDate: REF,
    });

    expect(result.dimensions.dependencies.penalty).toBe(0);
  });

  it("caps the dependency penalty at 20", () => {
    const dependencies: HealthScoreDependency[] = Array.from({ length: 5 }, () => ({
      criticality: "CRITICAL" as const,
      status: "BLOCKED",
    }));
    const result = calculateHealthScore({
      project: emptyProject,
      milestones: [],
      dependencies,
      risks: [],
      referenceDate: REF,
    });

    expect(result.dimensions.dependencies.penalty).toBe(20);
  });
});

describe("calculateHealthScore — risk-based dimensions", () => {
  it("applies the 1.5x multiplier when a risk has no mitigation strategy", () => {
    const risks: HealthScoreRisk[] = [
      {
        category: "TECHNOLOGY",
        probability: 5,
        impact: 5,
        status: "OPEN",
        mitigationStrategy: null,
      },
    ];
    const result = calculateHealthScore({
      project: emptyProject,
      milestones: [],
      dependencies: [],
      risks,
      referenceDate: REF,
    });

    expect(result.dimensions.risks.penalty).toBe(9); // CRITICAL base 6.0 * 1.5
  });

  it("does not apply the multiplier when a mitigation strategy is present", () => {
    const risks: HealthScoreRisk[] = [
      {
        category: "TECHNOLOGY",
        probability: 5,
        impact: 5,
        status: "OPEN",
        mitigationStrategy: "Plano de contingência definido.",
      },
    ];
    const result = calculateHealthScore({
      project: emptyProject,
      milestones: [],
      dependencies: [],
      risks,
      referenceDate: REF,
    });

    expect(result.dimensions.risks.penalty).toBe(6);
  });

  it("excludes mitigated and closed risks entirely", () => {
    const risks: HealthScoreRisk[] = [
      {
        category: "TECHNOLOGY",
        probability: 5,
        impact: 5,
        status: "MITIGATED",
        mitigationStrategy: null,
      },
      {
        category: "TECHNOLOGY",
        probability: 5,
        impact: 5,
        status: "CLOSED",
        mitigationStrategy: null,
      },
    ];
    const result = calculateHealthScore({
      project: emptyProject,
      milestones: [],
      dependencies: [],
      risks,
      referenceDate: REF,
    });

    expect(result.dimensions.risks.penalty).toBe(0);
  });

  it("routes SCOPE risks to the scope dimension, not the general risks dimension", () => {
    const risks: HealthScoreRisk[] = [
      {
        category: "SCOPE",
        probability: 2,
        impact: 3,
        status: "OPEN",
        mitigationStrategy: null,
      },
    ];
    const result = calculateHealthScore({
      project: emptyProject,
      milestones: [],
      dependencies: [],
      risks,
      referenceDate: REF,
    });

    expect(result.dimensions.risks.penalty).toBe(0);
    expect(result.dimensions.scope.penalty).toBeGreaterThan(0);
  });

  it("routes RESOURCES risks to the resources dimension, not the general risks dimension", () => {
    const risks: HealthScoreRisk[] = [
      {
        category: "RESOURCES",
        probability: 2,
        impact: 3,
        status: "OPEN",
        mitigationStrategy: null,
      },
    ];
    const result = calculateHealthScore({
      project: emptyProject,
      milestones: [],
      dependencies: [],
      risks,
      referenceDate: REF,
    });

    expect(result.dimensions.risks.penalty).toBe(0);
    expect(result.dimensions.resources.penalty).toBeGreaterThan(0);
  });

  it("caps the risks penalty at 30", () => {
    const risks: HealthScoreRisk[] = Array.from({ length: 10 }, () => ({
      category: "TECHNOLOGY" as const,
      probability: 5,
      impact: 5,
      status: "OPEN",
      mitigationStrategy: null,
    }));
    const result = calculateHealthScore({
      project: emptyProject,
      milestones: [],
      dependencies: [],
      risks,
      referenceDate: REF,
    });

    expect(result.dimensions.risks.penalty).toBe(30);
  });
});

describe("calculateHealthScore — overall aggregation", () => {
  it("matches the worked example from HEALTH_SCORE.md within rounding tolerance", () => {
    const project = {
      startDate: days(-30),
      endDate: days(30),
      progressPercent: 30,
      status: "IN_PROGRESS" as const,
    };
    const milestones: HealthScoreMilestone[] = [
      { plannedDate: days(-10), actualDate: null, status: "PLANNED" },
      { plannedDate: days(-3), actualDate: null, status: "PLANNED" },
    ];
    const dependencies: HealthScoreDependency[] = [
      { criticality: "CRITICAL", status: "BLOCKED" },
      { criticality: "MEDIUM", status: "OPEN" },
    ];
    const risks: HealthScoreRisk[] = [
      {
        category: "TECHNOLOGY",
        probability: 5,
        impact: 5,
        status: "OPEN",
        mitigationStrategy: null,
      },
      {
        category: "EXTERNAL_DEPENDENCY",
        probability: 3,
        impact: 4,
        status: "OPEN",
        mitigationStrategy: "Checkpoint semanal com o fornecedor.",
      },
      {
        category: "SCOPE",
        probability: 2,
        impact: 3,
        status: "OPEN",
        mitigationStrategy: null,
      },
    ];

    const result = calculateHealthScore({
      project,
      milestones,
      dependencies,
      risks,
      referenceDate: REF,
    });

    expect(result.score).toBeGreaterThanOrEqual(59);
    expect(result.score).toBeLessThanOrEqual(61);
    expect(result.band).toBe("RISK");
    expect(result.dimensions.dependencies.band).toBe("CRITICAL");
    expect(result.dimensions.risks.band).toBe("CRITICAL");
    expect(result.dimensions.schedule.band).toBe("RISK");
    expect(result.dimensions.scope.band).toBe("ATTENTION");
    expect(result.dimensions.resources.band).toBe("HEALTHY");
  });

  it("floors the overall score at 0 when every dimension is maxed out", () => {
    const project = {
      startDate: days(-100),
      endDate: days(-1),
      progressPercent: 0,
      status: "IN_PROGRESS" as const,
    };
    const milestones: HealthScoreMilestone[] = Array.from({ length: 10 }, () => ({
      plannedDate: days(-100),
      actualDate: null,
      status: "PLANNED",
    }));
    const dependencies: HealthScoreDependency[] = Array.from({ length: 5 }, () => ({
      criticality: "CRITICAL" as const,
      status: "BLOCKED",
    }));
    const risks: HealthScoreRisk[] = [
      ...Array.from({ length: 10 }, () => ({
        category: "TECHNOLOGY" as const,
        probability: 5,
        impact: 5,
        status: "OPEN",
        mitigationStrategy: null,
      })),
      ...Array.from({ length: 5 }, () => ({
        category: "SCOPE" as const,
        probability: 5,
        impact: 5,
        status: "OPEN",
        mitigationStrategy: null,
      })),
      ...Array.from({ length: 5 }, () => ({
        category: "RESOURCES" as const,
        probability: 5,
        impact: 5,
        status: "OPEN",
        mitigationStrategy: null,
      })),
    ];

    const result = calculateHealthScore({
      project,
      milestones,
      dependencies,
      risks,
      referenceDate: REF,
    });

    expect(result.score).toBe(0);
    expect(result.band).toBe("CRITICAL");
  });

  it("is deterministic for a fixed reference date regardless of wall-clock time", () => {
    const input = {
      project: emptyProject,
      milestones: [
        { plannedDate: days(-7), actualDate: null, status: "PLANNED" as const },
      ],
      dependencies: [],
      risks: [],
      referenceDate: REF,
    };

    const first = calculateHealthScore(input);
    const second = calculateHealthScore(input);
    expect(first).toEqual(second);
  });
});
