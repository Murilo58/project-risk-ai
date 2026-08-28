import { describe, expect, it } from "vitest";

import {
  milestoneSchema,
  milestoneUpdateSchema,
  withNormalizedActualDate,
} from "@/lib/validation/milestone";

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

  // Scenario F: a milestone can only be marked "Concluído" alongside a
  // recorded completion date.
  it("rejects status COMPLETED without an actual date", () => {
    const result = milestoneSchema.safeParse({ ...validInput, status: "COMPLETED" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["actualDate"]);
    }
  });

  it("accepts status COMPLETED when an actual date is provided", () => {
    const result = milestoneSchema.safeParse({
      ...validInput,
      status: "COMPLETED",
      actualDate: "2026-03-05",
    });
    expect(result.success).toBe(true);
  });
});

describe("milestoneUpdateSchema", () => {
  it("allows a partial update that does not touch status or actualDate", () => {
    const result = milestoneUpdateSchema.safeParse({ owner: "Nova Responsável" });
    expect(result.success).toBe(true);
  });

  it("rejects moving status to COMPLETED without an actual date, even as a partial payload", () => {
    const result = milestoneUpdateSchema.safeParse({ status: "COMPLETED" });
    expect(result.success).toBe(false);
  });
});

describe("withNormalizedActualDate", () => {
  it("clears actualDate when the effective status is not COMPLETED", () => {
    const data = withNormalizedActualDate(
      { actualDate: new Date("2026-03-05") },
      "PLANNED",
    );
    expect(data.actualDate).toBeNull();
  });

  it("leaves the payload untouched when the effective status is COMPLETED", () => {
    const actualDate = new Date("2026-03-05");
    const data = withNormalizedActualDate({ actualDate }, "COMPLETED");
    expect(data.actualDate).toBe(actualDate);
  });
});
