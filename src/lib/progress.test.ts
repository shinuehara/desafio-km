import { describe, expect, it } from "vitest";
import { cumulativeByDay } from "./progress";

describe("cumulativeByDay", () => {
  it("soma por dia, ordena e ignora invalidadas", () => {
    const pts = cumulativeByDay([
      { activityDate: "2026-11-05", distanceM: 3000, invalidatedAt: null },
      { activityDate: "2026-11-02", distanceM: 5000, invalidatedAt: null },
      { activityDate: "2026-11-05", distanceM: 2000, invalidatedAt: null },
      { activityDate: "2026-11-03", distanceM: 9000, invalidatedAt: new Date() },
    ]);
    expect(pts).toEqual([
      { date: "2026-11-02", dayM: 5000, totalM: 5000 },
      { date: "2026-11-05", dayM: 5000, totalM: 10000 },
    ]);
  });
});
