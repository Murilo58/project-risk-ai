import { describe, expect, it } from "vitest";

import { dependencySchema } from "@/lib/validation/dependency";

const validInput = {
  description: "Integração com fornecedor de pagamentos",
  type: "EXTERNAL",
  owner: "Ana",
};

describe("dependencySchema", () => {
  it("accepts a valid dependency", () => {
    expect(dependencySchema.safeParse(validInput).success).toBe(true);
  });

  it("requires a type from the allowed set", () => {
    expect(dependencySchema.safeParse({ ...validInput, type: "OTHER" }).success).toBe(
      false,
    );
  });

  it("defaults criticality to MEDIUM and status to OPEN", () => {
    const result = dependencySchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.criticality).toBe("MEDIUM");
      expect(result.data.status).toBe("OPEN");
    }
  });
});
