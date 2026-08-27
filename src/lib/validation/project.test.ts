import { describe, expect, it } from "vitest";

import { projectSchema } from "@/lib/validation/project";

const validInput = {
  name: "Migração ERP",
  owner: "Marina Silva",
  startDate: "2026-01-10",
  status: "IN_PROGRESS",
  progressPercent: 30,
  criticality: "HIGH",
};

describe("projectSchema", () => {
  it("accepts a valid project", () => {
    const result = projectSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("requires a name", () => {
    const result = projectSchema.safeParse({ ...validInput, name: "" });
    expect(result.success).toBe(false);
  });

  it("requires an owner", () => {
    const result = projectSchema.safeParse({ ...validInput, owner: "  " });
    expect(result.success).toBe(false);
  });

  it("rejects progress outside 0-100", () => {
    expect(projectSchema.safeParse({ ...validInput, progressPercent: -1 }).success).toBe(
      false,
    );
    expect(projectSchema.safeParse({ ...validInput, progressPercent: 101 }).success).toBe(
      false,
    );
  });

  it("rejects an end date before the start date", () => {
    const result = projectSchema.safeParse({
      ...validInput,
      startDate: "2026-06-01",
      endDate: "2026-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an end date on or after the start date", () => {
    const result = projectSchema.safeParse({
      ...validInput,
      startDate: "2026-01-01",
      endDate: "2026-01-01",
    });
    expect(result.success).toBe(true);
  });

  it("treats an empty optional team size as undefined instead of failing", () => {
    const result = projectSchema.safeParse({ ...validInput, teamSize: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.teamSize).toBeUndefined();
  });

  it("defaults status and criticality when omitted", () => {
    const rest: Partial<typeof validInput> = { ...validInput };
    delete rest.status;
    delete rest.criticality;
    const result = projectSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("PLANNED");
      expect(result.data.criticality).toBe("MEDIUM");
    }
  });
});
