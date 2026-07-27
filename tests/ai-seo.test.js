const { estimateBlogTokens, generateBlogDraft, generateSeoRecommendations, normalizeBlogBrief } = require("../lib/ai-seo");

function withoutAiKeys() {
  const oldOpenAi = process.env.OPENAI_API_KEY;
  const oldAnthropic = process.env.ANTHROPIC_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  return () => {
    if (oldOpenAi === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldOpenAi;
    if (oldAnthropic === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = oldAnthropic;
  };
}

describe("ai seo fallbacks", () => {
  test("generateSeoRecommendations returns local validated recommendations without API keys", async () => {
    const restore = withoutAiKeys();

    const result = await generateSeoRecommendations({
      project: { name: "Demo", targetUrl: "https://example.com" },
      run: { id: "run1", sourceUrl: "https://example.com", total: 1 },
      pages: [{
        url: "https://example.com/seo",
        title: "Consultoria SEO",
        h1s: ["Consultoria SEO"],
        keywords: ["consultoria seo"],
        statusCode: 200,
      }],
    });

    restore();
    expect(result.provider).toBe("local");
    expect(result.recommendations[0].primaryKeyword).toBe("consultoria seo");
  });

  test("generateBlogDraft returns editable markdown fallback", async () => {
    const restore = withoutAiKeys();
    const draft = await generateBlogDraft({
      project: { name: "Demo" },
      keyword: "consultoria seo",
    });
    restore();
    expect(draft.title).toMatch(/consultoria seo/i);
    expect(draft.content).toMatch(/^# /);
  });

  test("normalizeBlogBrief accepts custom keywords and writing controls", () => {
    const brief = normalizeBlogBrief({
      primaryKeywords: "seo local, agencia seo",
      secondaryKeywords: "google maps, posicionamiento",
      language: "en",
      tone: "tecnico",
      writingStyle: "guia practica",
      intent: "local",
      length: "largo",
    });
    expect(brief.primaryKeyword).toBe("seo local");
    expect(brief.primaryKeywords).toContain("agencia seo");
    expect(brief.language).toBe("en");
    expect(brief.tone).toBe("tecnico");
    expect(brief.writingStyle).toBe("guia practica");
  });

  test("estimateBlogTokens is local and scales with length", () => {
    const shortEstimate = estimateBlogTokens({ brief: { keyword: "seo", length: "corto" } });
    const longEstimate = estimateBlogTokens({ brief: { keyword: "seo", length: "largo" } });
    expect(shortEstimate.totalTokens).toBeGreaterThan(0);
    expect(longEstimate.totalTokens).toBeGreaterThan(shortEstimate.totalTokens);
  });
});
