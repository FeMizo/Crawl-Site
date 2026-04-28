const FEATURE_LABELS = {
  excel_report:    "Reporte Excel",
  architecture:    "Análisis de arquitectura",
  performance:     "Análisis de performance",
  scheduled_crawl: "Rastreos programados",
  js_crawl:        "Rastreo de sitios CSR (Next.js, Nuxt, React)",
  multi_user:      "Multi-usuario",
};

const PLANS = [
  {
    key: "FREE",
    label: "Gratis",
    price: 0,
    accent: "#64b5f6",
    badge: "var(--text2)",
    badgeBg: "var(--bg3)",
    badgeBorder: "var(--border2)",
    maxProjects: 1,
    maxPagesPerCrawl: 50,
    maxCrawlsPerMonth: 1,
    maxHistoryRuns: 1,
    features: [],
  },
  {
    key: "BASIC",
    label: "Basic",
    price: 229,
    accent: "#f59e0b",
    badge: "#fbbf24",
    badgeBg: "rgba(245,158,11,0.10)",
    badgeBorder: "rgba(245,158,11,0.35)",
    maxProjects: 1,
    maxPagesPerCrawl: 100,
    maxCrawlsPerMonth: 5,
    maxHistoryRuns: 1,
    features: [],
  },
  {
    key: "STARTER",
    label: "Starter",
    price: 499,
    accent: "#4d8dff",
    badge: "#77abff",
    badgeBg: "rgba(77,141,255,0.10)",
    badgeBorder: "rgba(77,141,255,0.35)",
    maxProjects: 5,
    maxPagesPerCrawl: 500,
    maxCrawlsPerMonth: 10,
    maxHistoryRuns: 10,
    features: ["excel_report"],
  },
  {
    key: "PRO",
    label: "Pro",
    price: 1299,
    accent: "#00ff88",
    badge: "#00ff88",
    badgeBg: "rgba(0,255,136,0.08)",
    badgeBorder: "rgba(0,255,136,0.3)",
    maxProjects: 20,
    maxPagesPerCrawl: 2000,
    maxCrawlsPerMonth: 999,
    maxHistoryRuns: 50,
    features: ["excel_report", "architecture", "performance", "scheduled_crawl", "js_crawl"],
    highlighted: true,
  },
  {
    key: "AGENCY",
    label: "Agency",
    price: 2999,
    accent: "#c084fc",
    badge: "#c084fc",
    badgeBg: "rgba(192,132,252,0.10)",
    badgeBorder: "rgba(192,132,252,0.35)",
    maxProjects: 999,
    maxPagesPerCrawl: 10000,
    maxCrawlsPerMonth: 999,
    maxHistoryRuns: 999,
    features: ["excel_report", "architecture", "performance", "scheduled_crawl", "js_crawl", "multi_user"],
  },
];

const PLAN_CURRENCY = "MXN";

const PLAN_DEFAULTS = Object.fromEntries(
  PLANS.map(({ key, maxProjects, maxPagesPerCrawl, maxCrawlsPerMonth, maxHistoryRuns, features }) => [
    key,
    { maxProjects, maxPagesPerCrawl, maxCrawlsPerMonth, maxHistoryRuns, features },
  ])
);

const PLAN_DISPLAY_PRICES = Object.fromEntries(PLANS.map((p) => [p.key, p.price]));

module.exports = { PLANS, PLAN_DEFAULTS, PLAN_DISPLAY_PRICES, PLAN_CURRENCY, FEATURE_LABELS };
