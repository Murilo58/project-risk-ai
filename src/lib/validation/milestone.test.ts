import { describe, expect, it } from "vitest";

import { milestoneSchema } from "@/lib/validation/milestone";

const validInput = {
  description: "Go-live módulo financeiro",
  plannedDate: "2026-03-01",
  owner: "João",
};

describe("milestoneSchema", () => {
  it("accepts a valid milestone", () => {
    expect(milestoneSchema.safeParse(validInput).success).toBe(true);
  });

  it("requires a description", () => {
    expect(milestoneSchema.safeParse({ ...validInput, description: "" }).success).toBe(
      false,
    );
  });

  it("requires a planned date", () => {
    expect(milestoneSchema.safeParse({ ...validInput, plannedDate: "" }).success).toBe(
      false,
    );
  });

  it("treats an empty actual date as not provided", () => {
    const result = milestoneSchema.safeParse({ ...validInput, actualDate: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.actualDate).toBeUndefined();
  });

  it("defaults status to PLANNED", () => {
    const result = milestoneSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe("PLANNED");
  });
});
