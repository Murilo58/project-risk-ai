import { describe, expect, it } from "vitest";

import { computeSeverity, isRiskOpen, severityBand } from "@/domain/risks/severity";

describe("computeSeverity", () => {
  it("multiplies probability by impact", () => {
    expect(computeSeverity(3, 4)).toBe(12);
    expect(computeSeverity(1, 1)).toBe(1);
    expect(computeSeverity(5, 5)).toBe(25);
  });
});

describe("severityBand", () => {
  it("classifies bands per HEALTH_SCORE.md thresholds", () => {
    expect(severityBand(1)).toBe("LOW");
    expect(severityBand(4)).toBe("LOW");
    expect(severityBand(5)).toBe("MEDIUM");
    expect(severityBand(9)).toBe("MEDIUM");
    expect(severityBand(10)).toBe("HIGH");
    expect(severityBand(15)).toBe("HIGH");
    expect(severityBand(16)).toBe("CRITICAL");
    expect(severityBand(25)).toBe("CRITICAL");
  });
});

describe("isRiskOpen", () => {
  it("treats OPEN as open", () => {
    expect(isRiskOpen("OPEN")).toBe(true);
  });

  it("treats MITIGATED and CLOSED as not open", () => {
    expect(isRiskOpen("MITIGATED")).toBe(false);
    expect(isRiskOpen("CLOSED")).toBe(false);
  });
});
