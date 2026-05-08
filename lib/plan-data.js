const FEATURE_LABELS = {
  excel_report:    "Reporte Excel",
  architecture:    "Análisis de arquitectura",
  performance:     "Análisis de performance",
  page_speed:      "Speed Test por página (PageSpeed Insights)",
  scheduled_crawl: "Rastreos programados",
  js_crawl:        "Rastreo de sitios CSR (Next.js, Nuxt, React)",
  extra_user:      "Usuarios extra",
  multi_user:      "Usuarios ilimitados",
  keywords:        "Keywords sugeridas por página",
};

const FEATURE_TOOLTIPS = {
  excel_report:    "Descarga un archivo .xlsx con todas las URLs, códigos de estado, errores detectados y metadatos. Ideal para presentar reportes a clientes.",
  architecture:    "Visualiza la estructura de tu sitio como árbol de carpetas: profundidad de URLs, páginas huérfanas y distribución por sección.",
  performance:     "Detecta scripts que bloquean el renderizado, hojas de estilo lentas, HTML pesado y recursos que retrasan la carga.",
  page_speed:      "Analiza cada página rastreada con Google PageSpeed Insights: score de rendimiento, LCP, FCP, TTFB y CLS. Solo para páginas públicas.",
  scheduled_crawl: "Programa rastreos automáticos diarios o semanales. Recibe alertas si aparecen nuevos errores desde el último rastreo.",
  js_crawl:        "Rastreo de sitios construidos con frameworks JavaScript (Next.js, Nuxt, React, Angular) que renderizan contenido en el navegador.",
  extra_user:      "Invita colaboradores adicionales al workspace para revisar auditorías juntos.",
  multi_user:      "Sin límite de usuarios en el workspace. Ideal para agencias con equipos grandes.",
  keywords:        "Keywords relevantes sugeridas por página durante el rastreo, basadas en el contenido y metadatos del sitio.",
};

const LIMIT_TOOLTIPS = {
  maxProjects:       "Número de sitios web que puedes agregar y rastrear de forma simultánea.",
  maxPagesPerCrawl:  "Máximo de URLs que el crawler analiza en cada ejecución. Si tu sitio tiene más páginas, puedes dividirlo por secciones.",
  maxCrawlsPerMonth: "Veces que puedes iniciar un rastreo completo en un mes calendario.",
  maxHistoryRuns:    "Rastreos anteriores que se guardan para comparar resultados en el tiempo.",
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
    maxExtraUsers: 0,
    maxKeywords: 0,
    keywordsRange: null,
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
    maxExtraUsers: 0,
    maxKeywords: 2,
    keywordsRange: "2",
    features: ["excel_report", "architecture", "keywords"],
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
    maxExtraUsers: 1,
    maxKeywords: 4,
    keywordsRange: "4",
    features: ["excel_report", "architecture", "performance", "page_speed", "keywords", "extra_user"],
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
    maxExtraUsers: 4,
    maxKeywords: 10,
    keywordsRange: "10",
    features: ["excel_report", "architecture", "performance", "page_speed", "scheduled_crawl", "js_crawl", "keywords", "extra_user"],
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
    maxExtraUsers: 999,
    maxKeywords: 20,
    keywordsRange: "20",
    features: ["excel_report", "architecture", "performance", "page_speed", "scheduled_crawl", "js_crawl", "keywords", "multi_user"],
  },
];

const PLAN_CURRENCY = "MXN";

const PLAN_DEFAULTS = Object.fromEntries(
  PLANS.map(({ key, maxProjects, maxPagesPerCrawl, maxCrawlsPerMonth, maxHistoryRuns, maxExtraUsers, maxKeywords, keywordsRange, features }) => [
    key,
    { maxProjects, maxPagesPerCrawl, maxCrawlsPerMonth, maxHistoryRuns, maxExtraUsers, maxKeywords, keywordsRange, features },
  ])
);

// Map: plan key → max keywords per page
const PLAN_KEYWORD_MAX = Object.fromEntries(PLANS.map((p) => [p.key, p.maxKeywords]));

const PLAN_DISPLAY_PRICES = Object.fromEntries(PLANS.map((p) => [p.key, p.price]));

// Map: plan key → max extra team members allowed
const PLAN_TEAM_MAX = Object.fromEntries(PLANS.map((p) => [p.key, p.maxExtraUsers]));

// Map: team feature name → max extra team members
// extra_user limit is derived from the plan's maxExtraUsers, not a fixed value
const TEAM_FEATURE_MAX = { multi_user: 999 };

module.exports = {
  PLANS,
  PLAN_DEFAULTS,
  PLAN_DISPLAY_PRICES,
  PLAN_CURRENCY,
  PLAN_TEAM_MAX,
  PLAN_KEYWORD_MAX,
  TEAM_FEATURE_MAX,
  FEATURE_LABELS,
  FEATURE_TOOLTIPS,
  LIMIT_TOOLTIPS,
};
