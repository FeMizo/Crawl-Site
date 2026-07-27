const {
  GOOGLE_OAUTH_SCOPES,
  compareMetricSnapshots,
  normalizeGa4PropertyId,
  normalizeGoogleBindingInput,
  normalizeSearchConsoleProperty,
} = require("../lib/google-workspace");

describe("google workspace helpers", () => {
  test("includes read-only Search Console and GA4 scopes", () => {
    expect(GOOGLE_OAUTH_SCOPES).toEqual(
      expect.arrayContaining([
        "https://www.googleapis.com/auth/webmasters.readonly",
        "https://www.googleapis.com/auth/analytics.readonly",
      ]),
    );
  });

  test("normalizes project binding input", () => {
    expect(
      normalizeGoogleBindingInput({
        searchConsoleProperty: " https://example.com/ ",
        ga4PropertyId: "properties/123456789",
      }),
    ).toEqual({
      searchConsoleProperty: "https://example.com/",
      ga4PropertyId: "123456789",
    });
  });

  test("normalizes property values directly", () => {
    expect(normalizeSearchConsoleProperty(" sc-domain:example.com ")).toBe("sc-domain:example.com");
    expect(normalizeGa4PropertyId("properties/987654321")).toBe("987654321");
  });

  test("computes metric diffs with percentages", () => {
    const diffs = compareMetricSnapshots(
      { clicks: 120, impressions: 900, sessions: 80 },
      { clicks: 150, impressions: 1200, sessions: 100 },
      ["clicks", "impressions", "sessions"],
    );

    expect(diffs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "clicks", delta: -30, direction: "down" }),
        expect.objectContaining({ key: "impressions", delta: -300, direction: "down" }),
        expect.objectContaining({ key: "sessions", delta: -20, direction: "down" }),
      ]),
    );
    expect(diffs.find((item) => item.key === "clicks").changePct).toBeCloseTo(-20);
  });
});
