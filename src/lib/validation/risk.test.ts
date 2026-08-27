import { describe, expect, it } from "vitest";

import { riskSchema } from "@/lib/validation/risk";

const validInput = {
  title: "Atraso na integração de pagamentos",
  category: "EXTERNAL_DEPENDENCY",
  probability: 4,
  impact: 5,
  owner: "Ana",
};

describe("riskSchema", () => {
  it("accepts a valid risk", () => {
    expect(riskSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejects probability outside 1-5", () => {
    expect(riskSchema.safeParse({ ...validInput, probability: 0 }).success).toBe(false);
    expect(riskSchema.safeParse({ ...validInput, probability: 6 }).success).toBe(false);
  });

  it("rejects impact outside 1-5", () => {
    expect(riskSchema.safeParse({ ...validInput, impact: 0 }).success).toBe(false);
    expect(riskSchema.safeParse({ ...validInput, impact: 6 }).success).toBe(false);
  });

  it("rejects an invalid category", () => {
    expect(riskSchema.safeParse({ ...validInput, category: "MADE_UP" }).success).toBe(
      false,
    );
  });

  it("defaults status to OPEN", () => {
    const result = riskSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe("OPEN");
  });
});
