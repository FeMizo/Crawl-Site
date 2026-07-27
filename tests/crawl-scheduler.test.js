const {
  buildCrawlAlertDigests,
  computeNextScheduleRunAt,
} = require("../lib/crawl-scheduler");

describe("crawl scheduler helpers", () => {
  test("computeNextScheduleRunAt advances daily schedules to the next day at 03:00", () => {
    const from = new Date(2026, 6, 27, 10, 15, 0);
    const next = computeNextScheduleRunAt("daily", from);

    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(6);
    expect(next.getDate()).toBe(28);
    expect(next.getHours()).toBe(3);
    expect(next.getMinutes()).toBe(0);
  });

  test("computeNextScheduleRunAt advances weekly schedules by seven days", () => {
    const from = new Date(2026, 6, 27, 10, 15, 0);
    const next = computeNextScheduleRunAt("weekly", from);

    expect(next.getMonth()).toBe(7);
    expect(next.getDate()).toBe(3);
    expect(next.getHours()).toBe(3);
  });

  test("buildCrawlAlertDigests creates a critical alert when key metrics increase", () => {
    const alerts = buildCrawlAlertDigests({
      projectName: "Acme",
      currentRunId: "run-current",
      previousRunId: "run-previous",
      currentStats: { 404: 4, titleIssues: 2 },
      previousStats: { 404: 1, titleIssues: 0 },
      currentWithIssues: 11,
      previousWithIssues: 5,
    });

    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("critical");
    expect(alerts[0].message).toMatch(/problemas totales/i);
    expect(alerts[0].message).toMatch(/404/);
    expect(alerts[0].payload.deltas).toHaveLength(2);
  });

  test("buildCrawlAlertDigests creates a warning when only the overall issue count increases", () => {
    const alerts = buildCrawlAlertDigests({
      projectName: "Acme",
      currentRunId: "run-current",
      previousRunId: "run-previous",
      currentStats: {},
      previousStats: {},
      currentWithIssues: 6,
      previousWithIssues: 3,
    });

    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("warning");
    expect(alerts[0].message).toMatch(/problemas totales/i);
  });
});
