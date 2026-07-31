const { buildClaudeSeoReference } = require("../lib/claude-seo-reference");

describe("claude seo reference", () => {
  test("classifies existing coverage and new gaps without changing crawl rules", () => {
    const reference = buildClaudeSeoReference({
      pages: [
        {
          url: "https://example.com/seo",
          title: "Consultoria SEO",
          issues: [
            { type: "title_short" },
            { type: "no_structured_data" },
            { type: "no_favicon" },
          ],
          seoQuality: {
            titleScore: 45,
            descSuggestions: [{ es: "Anade una llamada a la accion clara.", en: "" }],
          },
          keywords: ["seo local"],
          keywordSuggestions: ["Integra seo local en title y H1."],
          googleTools: { hasGTM: true, hasGA4: false },
          meta: { structuredData: { hasStructuredData: false } },
        },
        {
          url: "https://example.com/seo-2",
          title: "Consultoria SEO",
          issues: [{ type: "noindex" }],
          meta: { structuredData: { hasStructuredData: false } },
        },
      ],
      duplicates: [{ title: "consultoria seo", urls: ["https://example.com/seo", "https://example.com/seo-2"] }],
      architecture: { orphanCount: 1, maxDepth: 4 },
    });

    expect(reference.summary.totalPagesReviewed).toBe(2);
    expect(reference.summary.coverage.reuse).toBeGreaterThan(0);
    expect(reference.summary.coverage.add).toBeGreaterThan(0);
    expect(reference.proposals.find((proposal) => proposal.id === "title_length").classification).toBe("reuse");
    expect(reference.gaps.map((gap) => gap.id)).toContain("structured_data_type");
    expect(reference.pages[0].review.find((item) => item.id === "google_tools").classification).toBe("discard");
    expect(reference.pages[0].review.find((item) => item.id === "structured_data_type").matched).toBe(true);
  });
});
