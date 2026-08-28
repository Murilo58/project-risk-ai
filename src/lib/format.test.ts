import { describe, expect, it } from "vitest";

import { isMilestoneDelayed } from "@/lib/format";

describe("isMilestoneDelayed", () => {
  it("is delayed when completed after the planned date", () => {
    expect(
      isMilestoneDelayed({
        plannedDate: "2026-01-01T00:00:00.000Z",
        actualDate: "2026-01-10T00:00:00.000Z",
        status: "COMPLETED",
      }),
    ).toBe(true);
  });

  it("is not delayed when completed on or before the planned date", () => {
    expect(
      isMilestoneDelayed({
        plannedDate: "2026-01-10T00:00:00.000Z",
        actualDate: "2026-01-05T00:00:00.000Z",
        status: "COMPLETED",
      }),
    ).toBe(false);
  });

  it("is delayed when the planned date has passed with no completion", () => {
    expect(
      isMilestoneDelayed({
        plannedDate: "2020-01-01T00:00:00.000Z",
        actualDate: null,
        status: "PLANNED",
      }),
    ).toBe(true);
  });

  it("is not delayed when the planned date is in the future", () => {
    expect(
      isMilestoneDelayed({
        plannedDate: "2099-01-01T00:00:00.000Z",
        actualDate: null,
        status: "PLANNED",
      }),
    ).toBe(false);
  });

  it("is never delayed when cancelled", () => {
    expect(
      isMilestoneDelayed({
        plannedDate: "2020-01-01T00:00:00.000Z",
        actualDate: null,
        status: "CANCELLED",
      }),
    ).toBe(false);
  });

  it("ignores a stale actualDate on a non-completed milestone (legacy inconsistent data)", () => {
    // Regression: existing rows may carry an actualDate from before this
    // rule existed even though status was never set back to COMPLETED.
    // Schedule classification must fall back to the plannedDate check.
    expect(
      isMilestoneDelayed({
        plannedDate: "2020-01-01T00:00:00.000Z",
        actualDate: "2020-01-01T00:00:00.000Z",
        status: "PLANNED",
      }),
    ).toBe(true);
  });
});
