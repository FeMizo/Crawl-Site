const {
  analyzeRobotsSnapshot,
  analyzeSitemapSnapshot,
  buildPageIssues,
  detectGoogleTools,
  extractKeywords,
  extractMeta,
} = require("../lib/crawl-analysis");

describe("crawl analysis", () => {
  test("extractMeta reads rendered H1s from the final DOM", () => {
    const html = `
      <html lang="es">
        <head>
          <title>Example page</title>
          <meta name="description" content="Example description">
        </head>
        <body>
          <main>
            <h1>Rendered heading</h1>
          </main>
        </body>
      </html>
    `;

    const meta = extractMeta(html, "https://example.com/page");
    expect(meta.h1s).toEqual(["Rendered heading"]);
    expect(meta.headings).toHaveLength(1);
  });

  test("extractKeywords stays empty when there is no strong signal", () => {
    const html = `
      <html>
        <body>
          <nav><a href="/home">Home</a><a href="/about">About</a></nav>
          <main><p>Short generic copy.</p></main>
        </body>
      </html>
    `;
    const meta = extractMeta(html, "https://example.com/");
    const keywords = extractKeywords(html, meta, 5);
    expect(keywords).toEqual([]);
  });

  test("detectGoogleTools reads scripts, dataLayer and ids", () => {
    const html = `
      <script src="https://www.googletagmanager.com/gtm.js?id=GTM-ABC1234"></script>
      <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-XYZ9876');
      </script>
    `;

    const tools = detectGoogleTools(html);
    expect(tools.hasGTM).toBe(true);
    expect(tools.hasGA4).toBe(true);
    expect(tools.gtmIds).toContain("GTM-ABC1234");
    expect(tools.ga4Ids).toContain("G-XYZ9876");
  });

  test("buildPageIssues reports missing H1 even for rendered pages", () => {
    const page = {
      url: "https://example.com/page",
      statusCode: 200,
      meta: {
        title: "Example",
        titleLen: 7,
        descExists: true,
        description: "Example description",
        descLen: 20,
        h1s: [],
        headingSkips: [],
        imgsNoAlt: 0,
        imgsNoSize: 0,
        buttonsNoLink: 0,
        placeholderLinks: 0,
        formsNoAction: 0,
        formsNoSubmit: 0,
        weakNavigation: false,
        noindex: false,
        canonical: "https://example.com/page",
        hasViewport: true,
        hasCharset: true,
        og: { hasOg: true },
        twitter: { hasTwitterCard: true },
        structuredData: { hasStructuredData: true },
        resources: { renderBlockingJs: 0, renderBlockingCss: 0 },
        wordCount: 500,
        htmlSizeBytes: 1000,
        googleTools: { hasGTM: false, hasGA4: false },
        hasFavicon: true,
      },
      brokenImageLinks: [],
      brokenButtonLinks: [],
      loadTimeMs: 0,
      timeout: false,
      error: "",
      blocked: false,
      finalUrl: "https://example.com/page",
    };

    const issues = buildPageIssues(page);
    expect(issues.some((issue) => issue.type === "no_h1")).toBe(true);
  });

  test("robots and sitemap analysis surfaces blocked and noindex urls", () => {
    const robots = analyzeRobotsSnapshot({
      disallowed: ["/private"],
      sitemapUrls: ["https://example.com/sitemap.xml"],
      rawContent: "User-agent: *\nDisallow: /private\nSitemap: https://example.com/sitemap.xml",
    });
    expect(robots.suggestions.length).toBeGreaterThanOrEqual(0);

    const sitemap = analyzeSitemapSnapshot({
      sitemapUrls: ["https://example.com/private/page", "https://cdn.example.com/file"],
      disallowed: ["/private"],
      siteUrl: "https://example.com",
      pages: [
        {
          url: "https://example.com/private/page",
          finalUrl: "https://example.com/private/page",
          meta: { noindex: true },
        },
      ],
    });

    expect(sitemap.blockedCount).toBe(1);
    expect(sitemap.noindexCount).toBe(1);
    expect(sitemap.externalCount).toBe(1);
  });
});
