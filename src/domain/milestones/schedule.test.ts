import { describe, expect, it } from "vitest";

import { classifyMilestoneSchedule, isMilestoneLate } from "@/domain/milestones/schedule";

const REF = new Date(Date.UTC(2026, 0, 1)); // 2026-01-01
const days = (n: number) => new Date(REF.getTime() + n * 24 * 60 * 60 * 1000);

describe("classifyMilestoneSchedule", () => {
  it("A) em andamento + planejado no futuro + realizado vazio -> no prazo", () => {
    const status = classifyMilestoneSchedule(
      { status: "IN_PROGRESS", plannedDate: days(10), actualDate: null },
      REF,
    );
    expect(status).toBe("ON_TRACK");
    expect(isMilestoneLate(status)).toBe(false);
  });

  it("B) em andamento + planejado vencido + realizado vazio -> atrasado", () => {
    const status = classifyMilestoneSchedule(
      { status: "IN_PROGRESS", plannedDate: days(-10), actualDate: null },
      REF,
    );
    expect(status).toBe("LATE");
    expect(isMilestoneLate(status)).toBe(true);
  });

  it("C) concluído + realizado antes da data planejada -> concluído no prazo", () => {
    const status = classifyMilestoneSchedule(
      { status: "COMPLETED", plannedDate: days(0), actualDate: days(-2) },
      REF,
    );
    expect(status).toBe("COMPLETED_ON_TIME");
    expect(isMilestoneLate(status)).toBe(false);
  });

  it("D) concluído + realizado na mesma data planejada -> concluído no prazo", () => {
    const status = classifyMilestoneSchedule(
      { status: "COMPLETED", plannedDate: days(0), actualDate: days(0) },
      REF,
    );
    expect(status).toBe("COMPLETED_ON_TIME");
    expect(isMilestoneLate(status)).toBe(false);
  });

  it("E) concluído + realizado depois da data planejada -> concluído com atraso", () => {
    const status = classifyMilestoneSchedule(
      { status: "COMPLETED", plannedDate: days(0), actualDate: days(3) },
      REF,
    );
    expect(status).toBe("COMPLETED_LATE");
    expect(isMilestoneLate(status)).toBe(true);
  });

  it("never flags a CANCELLED milestone as late, regardless of dates", () => {
    const status = classifyMilestoneSchedule(
      { status: "CANCELLED", plannedDate: days(-100), actualDate: null },
      REF,
    );
    expect(status).toBe("ON_TRACK");
  });

  it("ignores a stray actualDate on a non-completed milestone (legacy inconsistent data)", () => {
    // Planned in the future, so it should read as on track even though an
    // actualDate is present — non-completed milestones must never consider it.
    const status = classifyMilestoneSchedule(
      { status: "IN_PROGRESS", plannedDate: days(10), actualDate: days(-50) },
      REF,
    );
    expect(status).toBe("ON_TRACK");
  });

  it("treats a milestone planned for today as on track until the day passes", () => {
    const laterToday = new Date(REF.getTime() + 18 * 60 * 60 * 1000); // same day, 18:00 UTC
    const status = classifyMilestoneSchedule(
      { status: "PLANNED", plannedDate: days(0), actualDate: null },
      laterToday,
    );
    expect(status).toBe("ON_TRACK");
  });
});
