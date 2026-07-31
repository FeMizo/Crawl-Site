const MAX_REFERENCE_PAGES = 12;

const REFERENCE_PROPOSALS = [
  {
    id: "title_length",
    label: "Title en rango util",
    classification: "reuse",
    sources: ["scoreSEO", "buildPageIssues"],
    matches(page) {
      const issues = issueTypes(page);
      return issues.has("title_short") || issues.has("title_long") || Boolean(page?.seoQuality?.titleScore !== undefined);
    },
    evidence(page) {
      const issues = issueTypes(page);
      return firstMatch([
        issues.has("title_short") ? "title_short" : "",
        issues.has("title_long") ? "title_long" : "",
        typeof page?.seoQuality?.titleScore === "number" ? `titleScore:${page.seoQuality.titleScore}` : "",
      ]);
    },
  },
  {
    id: "meta_description_cta",
    label: "Meta description con CTA",
    classification: "adapt",
    sources: ["scoreSEO"],
    matches(page) {
      return Boolean(page?.seoQuality?.descSuggestions?.length || issueTypes(page).has("desc_short") || issueTypes(page).has("desc_long"));
    },
    evidence(page) {
      const suggestion = (page?.seoQuality?.descSuggestions || []).find((item) =>
        /cta|llamada a la accion|call to action|ctr/i.test(String(item?.es || item?.en || "")),
      );
      return suggestion ? String(suggestion.es || suggestion.en || "").slice(0, 120) : "descSuggestions";
    },
  },
  {
    id: "title_h1_alignment",
    label: "Alinear title y H1",
    classification: "adapt",
    sources: ["scoreSEO", "buildKeywordGuidance"],
    matches(page) {
      const issues = issueTypes(page);
      return issues.has("no_h1") || issues.has("multi_h1") || issues.has("title_equals_desc") || Boolean((page?.seoQuality?.titleSuggestions || []).length);
    },
    evidence(page) {
      const issues = issueTypes(page);
      return firstMatch([
        issues.has("no_h1") ? "no_h1" : "",
        issues.has("multi_h1") ? "multi_h1" : "",
        issues.has("title_equals_desc") ? "title_equals_desc" : "",
      ]);
    },
  },
  {
    id: "heading_hierarchy",
    label: "Jerarquia de headings",
    classification: "reuse",
    sources: ["buildPageIssues"],
    matches(page) {
      const issues = issueTypes(page);
      return issues.has("heading_skip") || issues.has("no_h1") || issues.has("multi_h1");
    },
    evidence(page) {
      const issues = issueTypes(page);
      return firstMatch([
        issues.has("heading_skip") ? "heading_skip" : "",
        issues.has("no_h1") ? "no_h1" : "",
        issues.has("multi_h1") ? "multi_h1" : "",
      ]);
    },
  },
  {
    id: "image_alt_size",
    label: "Alt y tamano de imagenes",
    classification: "reuse",
    sources: ["buildPageIssues"],
    matches(page) {
      const issues = issueTypes(page);
      return issues.has("imgs_no_alt") || issues.has("imgs_no_size") || issues.has("broken_image");
    },
    evidence(page) {
      const issues = issueTypes(page);
      return firstMatch([
        issues.has("imgs_no_alt") ? "imgs_no_alt" : "",
        issues.has("imgs_no_size") ? "imgs_no_size" : "",
        issues.has("broken_image") ? "broken_image" : "",
      ]);
    },
  },
  {
    id: "canonical_noindex",
    label: "Canonical y noindex coherentes",
    classification: "reuse",
    sources: ["buildPageIssues"],
    matches(page) {
      const issues = issueTypes(page);
      return issues.has("noindex") || issues.has("canonical");
    },
    evidence(page) {
      const issues = issueTypes(page);
      return firstMatch([
        issues.has("noindex") ? "noindex" : "",
        issues.has("canonical") ? "canonical" : "",
      ]);
    },
  },
  {
    id: "structured_data_type",
    label: "Schema por tipo de pagina",
    classification: "add",
    sources: ["buildPageIssues"],
    matches(page) {
      const issues = issueTypes(page);
      return issues.has("no_structured_data");
    },
    evidence(page) {
      return page?.meta?.structuredData?.hasStructuredData ? "hasStructuredData" : "no_structured_data";
    },
  },
  {
    id: "internal_depth_orphans",
    label: "Profundidad y huérfanas",
    classification: "add",
    sources: ["buildSiteArchitecture"],
    matches(page, ctx) {
      return Number(ctx?.architecture?.orphanCount || 0) > 0 || Number(ctx?.architecture?.maxDepth || 0) > 0;
    },
    evidence(page, ctx) {
      const architecture = ctx?.architecture || {};
      return `orphans:${Number(architecture.orphanCount || 0)} depth:${Number(architecture.maxDepth || 0)}`;
    },
  },
  {
    id: "duplicate_titles_descriptions",
    label: "Duplicados de title y description",
    classification: "add",
    sources: ["buildSiteArchitecture"],
    matches(page, ctx) {
      return Number(ctx?.duplicates?.length || 0) > 0;
    },
    evidence(page, ctx) {
      return `duplicates:${Number(ctx?.duplicates?.length || 0)}`;
    },
  },
  {
    id: "performance_blocking",
    label: "Recursos que bloquean render",
    classification: "adapt",
    sources: ["buildPageIssues"],
    matches(page) {
      const issues = issueTypes(page);
      return issues.has("render_blocking_js") || issues.has("render_blocking_css") || issues.has("large_html") || issues.has("slow_load");
    },
    evidence(page) {
      const issues = issueTypes(page);
      return firstMatch([
        issues.has("render_blocking_js") ? "render_blocking_js" : "",
        issues.has("render_blocking_css") ? "render_blocking_css" : "",
        issues.has("large_html") ? "large_html" : "",
        issues.has("slow_load") ? "slow_load" : "",
      ]);
    },
  },
  {
    id: "indexability_basics",
    label: "Base tecnica indexable",
    classification: "reuse",
    sources: ["buildPageIssues"],
    matches(page) {
      const issues = issueTypes(page);
      return issues.has("no_viewport") || issues.has("no_charset") || issues.has("html_no_lang") || issues.has("no_favicon") || issues.has("no_og") || issues.has("no_twitter_card");
    },
    evidence(page) {
      const issues = issueTypes(page);
      return firstMatch([
        issues.has("no_viewport") ? "no_viewport" : "",
        issues.has("no_charset") ? "no_charset" : "",
        issues.has("html_no_lang") ? "html_no_lang" : "",
        issues.has("no_favicon") ? "no_favicon" : "",
        issues.has("no_og") ? "no_og" : "",
        issues.has("no_twitter_card") ? "no_twitter_card" : "",
      ]);
    },
  },
  {
    id: "keyword_intent",
    label: "Intencion y keywords",
    classification: "adapt",
    sources: ["buildKeywordGuidance", "generateSeoRecommendations"],
    matches(page) {
      return Boolean((page?.keywords || []).length || (page?.keywordSuggestions || []).length);
    },
    evidence(page) {
      return firstMatch([
        (page?.keywords || []).length ? `keywords:${page.keywords.length}` : "",
        (page?.keywordSuggestions || []).length ? `keywordSuggestions:${page.keywordSuggestions.length}` : "",
      ]);
    },
  },
  {
    id: "google_tools",
    label: "GTM y GA4 como contexto",
    classification: "discard",
    sources: ["buildPageIssues"],
    matches(page) {
      return Boolean(page?.googleTools?.hasGTM || page?.googleTools?.hasGA4);
    },
    evidence(page) {
      return firstMatch([
        page?.googleTools?.hasGTM ? "hasGTM" : "",
        page?.googleTools?.hasGA4 ? "hasGA4" : "",
      ]);
    },
  },
];

function firstMatch(values) {
  return values.find(Boolean) || "";
}

function normalizeList(values) {
  if (!Array.isArray(values)) return [];
  const seen = new Set();
  const out = [];
  for (const value of values) {
    const text = String(value || "").trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

function issueTypes(page) {
  return new Set(
    normalizeList((Array.isArray(page?.issues) ? page.issues : []).map((issue) => issue?.type || issue?.group || "")),
  );
}

function summarizeReferenceClasses(proposals) {
  return proposals.reduce(
    (acc, proposal) => {
      acc[proposal.classification] = (acc[proposal.classification] || 0) + 1;
      return acc;
    },
    { reuse: 0, adapt: 0, add: 0, discard: 0 },
  );
}

function buildPageProposalReview(page, ctx = {}) {
  return REFERENCE_PROPOSALS.map((proposal) => {
    const matched = Boolean(proposal.matches(page, ctx));
    return {
      id: proposal.id,
      label: proposal.label,
      classification: proposal.classification,
      matched,
      sources: proposal.sources,
      evidence: proposal.evidence(page, ctx),
    };
  });
}

function buildClaudeSeoReference({ pages, duplicates, architecture } = {}) {
  const normalizedPages = Array.isArray(pages) ? pages.slice(0, MAX_REFERENCE_PAGES) : [];
  const proposalCounts = summarizeReferenceClasses(
    REFERENCE_PROPOSALS.map((proposal) => ({
      classification: proposal.classification,
    })),
  );
  const pageReviews = normalizedPages.map((page) => ({
    pageUrl: String(page?.finalUrl || page?.url || ""),
    title: String(page?.title || "").trim(),
    review: buildPageProposalReview(page, { duplicates, architecture }),
  }));
  const coverage = pageReviews.reduce(
    (acc, pageReview) => {
      for (const item of pageReview.review) {
        if (item.matched) {
          acc[item.classification] = (acc[item.classification] || 0) + 1;
        }
      }
      return acc;
    },
    { reuse: 0, adapt: 0, add: 0, discard: 0 },
  );

  const proposals = REFERENCE_PROPOSALS.map((proposal) => ({
    id: proposal.id,
    label: proposal.label,
    classification: proposal.classification,
    sources: proposal.sources,
  }));

  const summary = {
    totalPagesReviewed: normalizedPages.length,
    proposalCounts,
    coverage,
  };
  const gaps = proposals.filter((proposal) => proposal.classification === "add").map((proposal) => ({
    id: proposal.id,
    label: proposal.label,
    reason: "No cambia el score actual; queda como capacidad nueva o futura.",
  }));

  return {
    summary,
    proposals,
    gaps,
    pages: pageReviews,
  };
}

module.exports = {
  buildClaudeSeoReference,
  REFERENCE_PROPOSALS,
};
