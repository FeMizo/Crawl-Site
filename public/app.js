//
// I18N
//
const L = {
  es: {
    heroTitle: "Nuevo rastreo",
    inputLabel: "URL del sitio a analizar",
    startBtn: "Iniciar Crawl",
    advOpts: "Opciones avanzadas",
    source: "Fuente",
    rateLimit: "Rate limit",
    noDelay: "Sin delay",
    checkExt: "Verificar links externos",
    analyzed: "Analizadas",
    withIssues: "Con problemas",
    redirects: "Redirecciones",
    titleIssues: "Titulos",
    descIssues: "Descripcion",
    images: "Imagenes",
    duplicates: "Duplicados",
    chartTitle: "Distribucion de errores",
    reportReady: "Reporte listo",
    download: "Descargar .xlsx",
    tabAll: "Todas",
    tabIssues: "Problemas",
    tabTitles: "Titulos",
    tabDesc: "Descripciones",
    tabImages: "Imagenes",
    tabErrors: "Errores",
    tabDup: "Duplicados",
    robotsTab: "Robots.txt",
    scopeDomain: "Dominio",
    tabFunctionality: "Funcionalidad",
    inlinksDetails: "Inlinks y detalles",
    buttonNoLink: "Boton sin link",
    brokenButton: "Boton roto",
    brokenImages: "Imagen rota",
    noImgSize: "Sin width/height",
    loadTimeTab: "Tiempo de carga",
    loadTimeLabel: "Tiempo de carga",
    slowLoad: "Carga lenta",
    canonicalIssue: "Canonical apunta a otra URL",
    noindexActive: "Noindex activo",
    timeoutLabel: "Timeout",
    tabIndexation: "Indexacion",
    inputHelp:
      "Analiza SEO tecnico, metadatos, encabezados, imagenes y funcionalidad.",
    url: "URL",
    title: "Titulo",
    description: "Descripcion",
    imgsNoAlt: "Imgs s/alt",
    noAlt: "Sin alt",
    issues: "Problemas",
    group: "Grupo",
    issue: "Problema",
    totalImgs: "Total",
    redirectTo: "Redirige a",
    blocked: "Bloqueada",
    detail: "Detalle",
    filter: "Filtro",
    all: "Todos",
    httpErrors: "HTTP",
    noTitle: "Sin titulo",
    titleShort: "Corto <30",
    titleLong: "Largo >60",
    noDesc: "Sin desc",
    descShort: "Corta <70",
    descLong: "Larga >160",
    noH1: "Sin H1",
    multiH1: "Multiples H1",
    headingSkip: "Saltos de heading",
    headingIssues: "Problemas de heading",
    headings: "Headings",
    titleScore: "Score Titulo",
    descScore: "Score Desc",
    lowTitleScore: "Score titulo bajo",
    lowDescScore: "Score desc bajo",
    noDups: "Sin titulos duplicados",
    waitingCrawl: "Esperando crawl...",
    crawling: "Crawleando...",
    analyzing: "Analizando",
    hasSitemap: "✅ Sitemap detectado en robots.txt",
    noSitemap: "⚠️ No hay referencia a sitemap en robots.txt",
    disallowedTitle: "Rutas bloqueadas (Disallow):",
    noPaths: "✅ Sin rutas bloqueadas",
    rawTitle: "Ver robots.txt completo",
    logoSub: "Detector de errores SEO",
    navDashboard: "Panel",
    navHistory: "Historial",
    navSettings: "Ajustes",
    hosting: "Hosting y DNS",
    techStack: "Tipo de sitio",
    loadingHosting: "Cargando informacion...",
    loadingTech: "Detectando...",
    clickPageSeo: "Haz clic en una fila para ver el analisis SEO",
    functionalityIntro:
      "Detalla botones sin link, botones rotos, formularios incompletos, navegacion debil y tiempos de carga.",
    ip: "IP",
    ipv6: "IPv6",
    dns: "Proveedor DNS",
    server: "Servidor",
    nameservers: "Servidores DNS",
    mx: "Correo (MX)",
    cms: "CMS",
    framework: "Framework",
    suggestions: "Sugerencias",
    titleQuality: "Calidad del titulo",
    descQuality: "Calidad de la descripcion",
    chars: "caract.",
    queueLabel: "en cola",
    headingMore: "mostrar mas",
    headingLess: "mostrar menos",
    headingWord: "heading",
    headingWords: "headings",
    httpSecurity: "Seguridad HTTP",
    loadingSecurity: "Analizando headers y SSL...",
    securityScore: "Score de seguridad",
    securityLevel: "Nivel de seguridad",
    securityLevelLow: "Bajo",
    securityLevelMedium: "Medio",
    securityLevelGood: "Bueno",
    securityLevelHigh: "Alto",
    securityLevelStat: "Seguridad HTTP",
    securityHeaders: "Headers de seguridad",
    securityHeadersDetected: "headers detectados",
    securityCriticalMissing: "Faltan headers criticos",
    securityCriticalOk: "Headers criticos presentes",
    ssl: "Certificado SSL",
    sslIssuer: "Emisor",
    sslSubject: "Dominio",
    sslValidUntil: "Valido hasta",
    sslDaysLeft: "Dias restantes",
    hostingLocation: "Ubicacion",
    ipOrg: "Organizacion",
    customUnknown: "Custom / Desconocido",
    dnsError: "No se pudo obtener informacion DNS",
    seoOptionsTitle: "2 opciones de titulo",
    seoOptionsDesc: "2 opciones de descripcion",
    option1: "Opcion 1",
    option2: "Opcion 2",
    sitemapCount: "Sitemap",
    funcTextLabel: "Texto",
    funcLocationLabel: "Ubicacion",
    funcHrefLabel: "Href",
    funcNoText: "(sin texto)",
    funcNoLink: "(sin link)",
    funcNoData: "(sin datos)",
    formNoAction: "Formulario sin action",
    formNoSubmit: "Formulario sin submit",
    placeholderLink: "Enlace placeholder",
    weakNavigation: "Navegacion principal debil",
    navLinks: "Links de navegacion",
    securityRecommendations: "Recomendaciones de seguridad",
    securityUrgencyHigh: "Urgencia alta",
    securityUrgencyMedium: "Urgencia media",
    securityUrgencyLow: "Urgencia baja",
    secFixCsp: "Define una politica CSP estricta con default-src y sin unsafe-inline/unsafe-eval.",
    secFixHsts: "Activa HSTS con max-age >= 31536000 e includeSubDomains.",
    secFixXfo: "Configura X-Frame-Options en DENY o SAMEORIGIN.",
    secFixXcto: "Agrega X-Content-Type-Options: nosniff.",
    secFixReferrer: "Define Referrer-Policy (recomendado strict-origin-when-cross-origin).",
    secFixPermissions: "Define Permissions-Policy para limitar APIs del navegador no usadas.",
    secFixCoop: "Configura COOP para aislar el contexto de navegacion (same-origin).",
    secFixCorp: "Configura CORP para controlar el uso cross-origin de recursos.",
    secFixCoep: "Configura COEP cuando el sitio requiera aislamiento cross-origin avanzado.",
    hostingType: "Tipo de hosting",
    cname: "CNAME",
    txtRecords: "TXT",
    dmarc: "DMARC",
    observations: "Observaciones",
    siteTypePrimary: "Tipo principal",
    siteTypeConfidence: "Confianza",
    siteTypePurpose: "Objetivo",
    detectedSignals: "Senales detectadas",
    themeDarkTitle: "Oscuro",
    themeLightTitle: "Claro",
    themeHcDarkTitle: "Alto contraste oscuro",
    themeHcLightTitle: "Alto contraste claro",
    recrawlBtn: "Re-crawl",
    rowsPerPage: "Filas por pagina",
    pagePrev: "Anterior",
    pageNext: "Siguiente",
    pageInfo: "Pagina",
    runLoaded: "Historial cargado",
    projectRequired: "No hay proyecto seleccionado.",
    searchByUrl: "Buscar por URL...",
    seoScoreStat: "Puntaje SEO",
    avgLoadTimeStat: "Tiempo promedio",
    sgTipTotalPages: "Total de paginas analizadas en este crawl",
    sgTipWithIssues: "Paginas que tienen al menos un problema SEO o tecnico",
    sgTipSeoScore: "Promedio de score SEO entre todas las paginas",
    sgTipAvgLoad: "Tiempo de carga promedio de todas las paginas analizadas",
    sgTipTitleIssues: "Cantidad de paginas con problemas en el titulo",
    sgTipDescIssues: "Cantidad de paginas con problemas en la descripcion",
    sgTipSecurityLevel:
      "Nivel de seguridad HTTP basado en headers de seguridad detectados",
    sgTipH1Issues: "Cantidad de paginas con problemas de H1 o jerarquia",
    sgTipImageIssues:
      "Cantidad de paginas con imagenes sin alt, sin width/height o rotas",
    sgTipDuplicates: "Cantidad de titulos duplicados detectados",
    sgGrpOverview: "Resumen",
    sgGrpContent: "Contenido SEO",
    sgGrpPerf: "Rendimiento",
    sgGrpSecurity: "Seguridad",
    thTipUrl: "URL completa de la página analizada",
    thTipHttp: "Código de respuesta HTTP · 200: OK · 301: Redireccionado · 404: No encontrado · 5xx: Error de servidor",
    thTipTitleChars: "Longitud del título en caracteres — ideal entre 50 y 60",
    thTipDescChars: "Longitud de la descripción en caracteres — ideal entre 140 y 160",
    thTipH1Text: "Texto del primer H1 de la página",
    thTipImgsNoAlt: "Imágenes sin atributo alt — afectan accesibilidad y SEO",
    thTipIssues: "Problemas SEO detectados en esta página",
    thTipTitleScore: "Puntuación de calidad del título (0–100): evalúa longitud, separador de marca y estructura",
    thTipDescScore: "Puntuación de calidad de la descripción (0–100): evalúa longitud, llamada a la acción y coherencia",
    thTipIndexation: "Estado de indexación según la etiqueta robots meta (index o noindex)",
    thTipHeadings: "Cantidad total de etiquetas de encabezado (H1–H6) en la página",
    thTipHeadingIssues: "Saltos en la jerarquía de headings — ej: H1 seguido de H3 sin H2 intermedio",
    thTipGroup: "Categoría del problema: títulos, descripciones, H1, imágenes o errores HTTP",
    thTipTitleText: "Texto del título de la página (referencia rápida)",
    thTipH1Count: "Número de etiquetas H1 en la página — lo correcto es exactamente 1",
    thTipImgNoAlt: "Imágenes sin atributo alt",
    thTipImgNoSize: "Imágenes sin atributos width/height — causa Layout Shift (CLS)",
    thTipImgBroken: "Imágenes con enlace roto (src inaccesible o que devuelve error)",
    thTipImgPct: "Porcentaje de imágenes sin alt sobre el total de imágenes en la página",
    thTipRedirectTo: "URL destino si la página redirige a otro recurso",
    thTipBlocked: "Indica si la URL está bloqueada por robots.txt (disallow)",
    thTipDetail: "Información adicional sobre el problema detectado",
    thTipCharsTitle: "Chars del título",
    thTipCharsDesc: "Chars de la descripción",
  },
  en: {
    heroTitle: "New crawl",
    inputLabel: "Site URL to analyze",
    startBtn: "Start Crawl",
    advOpts: "Advanced options",
    source: "Source",
    rateLimit: "Rate limit",
    noDelay: "No delay",
    checkExt: "Check external links",
    analyzed: "Analyzed",
    withIssues: "With issues",
    redirects: "Redirects",
    titleIssues: "Titles",
    descIssues: "Description",
    images: "Images",
    duplicates: "Duplicates",
    chartTitle: "Error distribution",
    reportReady: "Report ready",
    download: "Download .xlsx",
    tabAll: "All",
    tabIssues: "Issues",
    tabTitles: "Titles",
    tabDesc: "Descriptions",
    tabImages: "Images",
    tabErrors: "Errors",
    tabDup: "Duplicates",
    robotsTab: "Robots.txt",
    scopeDomain: "Domain",
    tabFunctionality: "Functionality",
    inlinksDetails: "Inlinks & details",
    buttonNoLink: "Button without link",
    brokenButton: "Broken button",
    brokenImages: "Broken image",
    noImgSize: "No width/height",
    loadTimeTab: "Load time",
    loadTimeLabel: "Load time",
    slowLoad: "Slow load",
    canonicalIssue: "Canonical points to different URL",
    noindexActive: "Noindex active",
    timeoutLabel: "Timeout",
    tabIndexation: "Indexation",
    inputHelp:
      "Crawls technical SEO, metadata, headings, images, and functionality.",
    url: "URL",
    title: "Title",
    description: "Description",
    imgsNoAlt: "Imgs no alt",
    noAlt: "No alt",
    issues: "Issues",
    group: "Group",
    issue: "Issue",
    totalImgs: "Total",
    redirectTo: "Redirects to",
    blocked: "Blocked",
    detail: "Detail",
    filter: "Filtro",
    all: "All",
    httpErrors: "HTTP",
    noTitle: "No title",
    titleShort: "Short <30",
    titleLong: "Long >60",
    noDesc: "No description",
    descShort: "Short <70",
    descLong: "Long >160",
    noH1: "No H1",
    multiH1: "Multiple H1",
    headingSkip: "Heading skips",
    headingIssues: "Heading issues",
    headings: "Headings",
    titleScore: "Title score",
    descScore: "Desc score",
    lowTitleScore: "Low title score",
    lowDescScore: "Low desc score",
    noDups: "No duplicate titles",
    waitingCrawl: "Waiting for crawl...",
    crawling: "Crawling...",
    analyzing: "Analyzing",
    hasSitemap: "✅ Sitemap detected in robots.txt",
    noSitemap: "⚠️ No sitemap reference found in robots.txt",
    disallowedTitle: "Blocked paths (Disallow):",
    noPaths: "✅ No blocked paths",
    rawTitle: "View full robots.txt",
    logoSub: "SEO Error Detector",
    navDashboard: "Dashboard",
    navHistory: "History",
    navSettings: "Settings",
    hosting: "Hosting & DNS",
    techStack: "Site type",
    loadingHosting: "Loading info...",
    loadingTech: "Detecting...",
    clickPageSeo: "Click a row to see SEO analysis",
    functionalityIntro:
      "Shows buttons without links, broken buttons, incomplete forms, weak navigation, and load time per page.",
    ip: "IP",
    ipv6: "IPv6",
    dns: "DNS provider",
    server: "Server",
    nameservers: "Nameservers",
    mx: "Email (MX)",
    cms: "CMS",
    framework: "Framework",
    suggestions: "Suggestions",
    titleQuality: "Title quality",
    descQuality: "Description quality",
    chars: "chars",
    queueLabel: "queued",
    headingMore: "show more",
    headingLess: "show less",
    headingWord: "heading",
    headingWords: "headings",
    httpSecurity: "HTTP Security",
    loadingSecurity: "Analyzing headers and SSL...",
    securityScore: "Security score",
    securityLevel: "Security level",
    securityLevelLow: "Low",
    securityLevelMedium: "Medium",
    securityLevelGood: "Good",
    securityLevelHigh: "High",
    securityLevelStat: "HTTP Security",
    securityHeaders: "Security headers",
    securityHeadersDetected: "headers detected",
    securityCriticalMissing: "Critical headers missing",
    securityCriticalOk: "Critical headers present",
    ssl: "SSL certificate",
    sslIssuer: "Issuer",
    sslSubject: "Subject",
    sslValidUntil: "Valid until",
    sslDaysLeft: "Days remaining",
    hostingLocation: "Location",
    ipOrg: "Organization",
    customUnknown: "Custom / Unknown",
    dnsError: "Could not retrieve DNS information",
    seoOptionsTitle: "2 title options",
    seoOptionsDesc: "2 description options",
    option1: "Option 1",
    option2: "Option 2",
    sitemapCount: "Sitemap",
    funcTextLabel: "Text",
    funcLocationLabel: "Location",
    funcHrefLabel: "Href",
    funcNoText: "(no text)",
    funcNoLink: "(no link)",
    funcNoData: "(no data)",
    formNoAction: "Form without action",
    formNoSubmit: "Form without submit",
    placeholderLink: "Placeholder link",
    weakNavigation: "Weak primary navigation",
    navLinks: "Navigation links",
    securityRecommendations: "Security recommendations",
    securityUrgencyHigh: "High urgency",
    securityUrgencyMedium: "Medium urgency",
    securityUrgencyLow: "Low urgency",
    secFixCsp: "Define a strict CSP policy with default-src and no unsafe-inline/unsafe-eval.",
    secFixHsts: "Enable HSTS with max-age >= 31536000 and includeSubDomains.",
    secFixXfo: "Set X-Frame-Options to DENY or SAMEORIGIN.",
    secFixXcto: "Add X-Content-Type-Options: nosniff.",
    secFixReferrer: "Set Referrer-Policy (recommended strict-origin-when-cross-origin).",
    secFixPermissions: "Set Permissions-Policy to restrict unused browser APIs.",
    secFixCoop: "Set COOP to isolate browsing context (same-origin).",
    secFixCorp: "Set CORP to control cross-origin resource usage.",
    secFixCoep: "Set COEP when advanced cross-origin isolation is required.",
    hostingType: "Hosting type",
    cname: "CNAME",
    txtRecords: "TXT",
    dmarc: "DMARC",
    observations: "Observations",
    siteTypePrimary: "Primary type",
    siteTypeConfidence: "Confidence",
    siteTypePurpose: "Purpose",
    detectedSignals: "Detected signals",
    themeDarkTitle: "Dark",
    themeLightTitle: "Light",
    themeHcDarkTitle: "High contrast dark",
    themeHcLightTitle: "High contrast light",
    recrawlBtn: "Re-crawl",
    rowsPerPage: "Rows per page",
    pagePrev: "Previous",
    pageNext: "Next",
    pageInfo: "Page",
    runLoaded: "Loaded run",
    projectRequired: "No project selected.",
    searchByUrl: "Buscar por URL...",
    seoScoreStat: "SEO Score",
    avgLoadTimeStat: "Avg Load Time",
    sgTipTotalPages: "Total pages analyzed in this crawl",
    sgTipWithIssues: "Pages that have at least one SEO or technical issue",
    sgTipSeoScore: "Average SEO score across all crawled pages",
    sgTipAvgLoad: "Average load time across all crawled pages",
    sgTipTitleIssues: "Number of pages with title issues",
    sgTipDescIssues: "Number of pages with description issues",
    sgTipSecurityLevel:
      "HTTP security level based on detected security headers",
    sgTipH1Issues: "Number of pages with H1 or heading hierarchy issues",
    sgTipImageIssues:
      "Number of pages with missing-alt, missing width/height, or broken images",
    sgTipDuplicates: "Number of duplicate titles found",
    sgGrpOverview: "Overview",
    sgGrpContent: "SEO Content",
    sgGrpPerf: "Performance",
    sgGrpSecurity: "Security",
    thTipUrl: "Full URL of the analyzed page",
    thTipHttp: "HTTP response code · 200: OK · 301: Redirected · 404: Not found · 5xx: Server error",
    thTipTitleChars: "Title length in characters — ideal between 50 and 60",
    thTipDescChars: "Description length in characters — ideal between 140 and 160",
    thTipH1Text: "Text of the page's first H1 tag",
    thTipImgsNoAlt: "Images missing the alt attribute — impacts accessibility and SEO",
    thTipIssues: "SEO issues detected on this page",
    thTipTitleScore: "Title quality score (0–100): evaluates length, brand separator and structure",
    thTipDescScore: "Description quality score (0–100): evaluates length, call-to-action and coherence",
    thTipIndexation: "Indexation status from the robots meta tag (index or noindex)",
    thTipHeadings: "Total count of heading tags (H1–H6) on the page",
    thTipHeadingIssues: "Gaps in heading hierarchy — e.g. H1 followed by H3 with no H2 in between",
    thTipGroup: "Issue category: titles, descriptions, H1, images or HTTP errors",
    thTipTitleText: "Page title text (quick reference)",
    thTipH1Count: "Number of H1 tags on the page — should be exactly 1",
    thTipImgNoAlt: "Images missing the alt attribute",
    thTipImgNoSize: "Images missing width/height attributes — causes Layout Shift (CLS)",
    thTipImgBroken: "Images with a broken src (inaccessible or returning an error)",
    thTipImgPct: "Percentage of images missing alt out of total images on the page",
    thTipRedirectTo: "Destination URL if the page redirects to another resource",
    thTipBlocked: "Indicates whether the URL is blocked by robots.txt (disallow)",
    thTipDetail: "Additional information about the detected issue",
    thTipCharsTitle: "Title chars",
    thTipCharsDesc: "Description chars",
  },
};
let lang =
  (typeof window !== "undefined" && window.localStorage.getItem("seoCrawlerLang")) ||
  "es";
const T = (k) => L[lang][k] || k;
let currentTheme =
  (typeof window !== "undefined" &&
    window.localStorage.getItem("seoCrawlerTheme")) ||
  document.documentElement.getAttribute("data-theme") ||
  "dark";
const crawlState = { pages: [], duplicates: [], robots: null, hosting: null };
let crawlSearchTerm = "";
let allTablePageSize = 20;
let allTablePage = 1;
let currentProject = null;
let currentWorkspace = "seo";
let currentTab = "all";
let activeRunLoadRequest = 0;
const RUN_COLLECTION_BATCH_SIZE = 100;
const TABLE_BODIES = [
  "tbAll",
  "tbSEO",
  "tbIssues",
  "tbTitles",
  "tbDesc",
  "tbH1",
  "tbImages",
  "tbErrors",
  "tbFunc",
];
const SELECT_SIZE_CLASSES = [
  "select-size-sm",
  "select-size-normal",
  "select-size-md",
  "select-size-lg",
];

function buildRunReportUrl(runId) {
  const projectId = currentProject?.id;
  if (!projectId || !runId) return "";
  return `/api/projects/${encodeURIComponent(projectId)}/runs/${encodeURIComponent(runId)}/report?lang=${encodeURIComponent(lang)}`;
}

function updateDownloadUi(downloadUrl, fileName, total, withIssues) {
  const dl = document.getElementById("dlb");
  const link = document.getElementById("dllink");
  if (!dl || !link || !downloadUrl) {
    if (dl) dl.style.display = "none";
    if (link) link.removeAttribute("href");
    return;
  }

  link.href = downloadUrl;
  sv(
    "dldesc",
    `${total || 0}  ${withIssues || 0} ${T("withIssues")}  ${fileName || "seo-report.xlsx"}`,
  );
  dl.style.display = "flex";
}

function normalizeInputUrl(u) {
  try {
    const x = new URL(u.trim());
    x.hash = "";
    return x.toString();
  } catch {
    return "";
  }
}

function hasCrawledUrl(inputUrl) {
  const normalized = normalizeInputUrl(inputUrl);
  if (!normalized) return false;
  return crawlState.pages.some(
    (p) => sameU(p.url, normalized) || sameU(p.finalUrl, normalized),
  );
}

function updateCrawlButtonLabel() {
  const btn = document.getElementById("btnCrawl");
  const input = document.getElementById("urlInput");
  if (!btn || !input) return;
  const label = btn.querySelector("[data-i18n]");
  if (!label) return;
  label.textContent = hasCrawledUrl(input.value) ? T("recrawlBtn") : T("startBtn");
}

function setSelectSize(target, size = "md") {
  const el =
    typeof target === "string"
      ? document.getElementById(target)
      : target;
  if (!el) return;
  const normalized = ["sm", "normal", "md", "lg"].includes(size) ? size : "normal";
  el.classList.add("select-size-module");
  SELECT_SIZE_CLASSES.forEach((c) => el.classList.remove(c));
  el.classList.add(`select-size-${normalized}`);
}

function setAllTablePageSize(size) {
  const nextSize = Number(size || 20);
  if (![20, 30, 50, 100].includes(nextSize)) return;
  allTablePageSize = nextSize;
  allTablePage = 1;
  updateAllTablePagination();
}

function setAllTablePage(direction) {
  if (direction === "prev") {
    allTablePage = Math.max(1, allTablePage - 1);
  } else if (direction === "next") {
    allTablePage += 1;
  }
  updateAllTablePagination();
}

function updateAllTablePagination(resetPage = false) {
  const tbody = document.getElementById("tbAll");
  if (!tbody) return;

  if (resetPage) {
    allTablePage = 1;
  }

  const pageSizeControl = document.getElementById("allPageSize");
  if (pageSizeControl && Number(pageSizeControl.value) !== allTablePageSize) {
    pageSizeControl.value = String(allTablePageSize);
  }

  const rows = Array.from(tbody.querySelectorAll("tr"));
  const visibleRows = rows.filter((tr) => !tr.classList.contains("search-hide"));
  const totalRows = visibleRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / allTablePageSize));

  if (allTablePage > totalPages) {
    allTablePage = totalPages;
  }

  const start = (allTablePage - 1) * allTablePageSize;
  const end = start + allTablePageSize;

  rows.forEach((tr) => tr.classList.add("page-hide"));
  visibleRows.slice(start, end).forEach((tr) => tr.classList.remove("page-hide"));

  const info = document.getElementById("allPageInfo");
  if (info) {
    info.textContent = `${T("pageInfo")} ${allTablePage}/${totalPages}`;
  }

  const prev = document.getElementById("allPagePrev");
  const next = document.getElementById("allPageNext");
  if (prev) prev.disabled = allTablePage <= 1 || totalRows === 0;
  if (next) next.disabled = allTablePage >= totalPages || totalRows === 0;
}

function applyUrlSearchFilter() {
  const term = (crawlSearchTerm || "").trim().toLowerCase();
  TABLE_BODIES.forEach((id) => {
    const tbody = document.getElementById(id);
    if (!tbody) return;
    tbody.querySelectorAll("tr").forEach((tr) => {
      if (!term) {
        tr.classList.remove("search-hide");
        return;
      }
      const urlText = (tr.querySelector("td")?.textContent || "").toLowerCase();
      tr.classList.toggle("search-hide", !urlText.includes(term));
    });
  });
  updateAllTablePagination();
}

function pageSeoScore(page) {
  const q = page?.seoQuality || {};
  if (typeof q.score === "number") return q.score;
  const t = Number(q.titleScore || 0);
  const d = Number(q.descScore || 0);
  if (t || d) return Math.round((t + d) / 2);
  return 0;
}

function updateAggregateSgStats() {
  const total = crawlState.pages.length;
  if (!total) {
    sv("v4", "0/100");
    sv("vR", "0ms");
    return;
  }
  const scoreSum = crawlState.pages.reduce((acc, p) => acc + pageSeoScore(p), 0);
  const loadSum = crawlState.pages.reduce(
    (acc, p) => acc + Number(p.loadTimeMs || 0),
    0,
  );
  const avgScore = Math.round(scoreSum / total);
  const avgLoad = Math.round(loadSum / total);
  sv("v4", `${avgScore}/100`);
  sv("vR", `${avgLoad}ms`);
}

function setLang(l) {
  lang = l;
  try {
    window.localStorage.setItem("seoCrawlerLang", l);
    document.documentElement.lang = l;
  } catch {}
  document.getElementById("btnEs").classList.toggle("on", l === "es");
  document.getElementById("btnEn").classList.toggle("on", l === "en");
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const k = el.getAttribute("data-i18n");
    if (L[l][k] !== undefined) el.textContent = L[l][k];
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const k = el.getAttribute("data-i18n-title");
    if (L[l][k] !== undefined) el.setAttribute("title", L[l][k]);
  });
  document.querySelectorAll("[data-i18n-tooltip]").forEach((el) => {
    const k = el.getAttribute("data-i18n-tooltip");
    if (L[l][k] !== undefined) el.setAttribute("data-tooltip", L[l][k]);
  });
  document.getElementById("logoSub").textContent = T("logoSub");
  document.getElementById("urlInput").placeholder =
    l === "en" ? "https://www.your-site.com" : "https://www.tu-sitio.com";
  const searchInput = document.getElementById("crawlSearch");
  if (searchInput) searchInput.placeholder = T("searchByUrl");
  const fBody = document.getElementById("functionalityBody");
  if (fBody && !window.__selectedSeoPage && !crawlState.pages.length) {
    fBody.innerHTML = `<p style="font-size:12px;color:var(--muted);">${T("functionalityIntro")}</p>`;
  }
  if (crawlState.hosting) renderHosting(crawlState.hosting);
  if (crawlState.robots) renderRobots(crawlState.robots);
  if (crawlState.pages.length) {
    rerenderTablesFromState();
    if (crawlState.duplicates.length) renderDups(crawlState.duplicates);
  }
  if (window.__selectedSeoPage) {
    showPageSEO(window.__selectedSeoPage);
    showFunctionalityInfo(window.__selectedSeoPage);
  }
  updateAllTablePagination();
  updateCrawlButtonLabel();
}

//
// THEME
//
function setTheme(t) {
  currentTheme = t;
  document.documentElement.setAttribute("data-theme", t);
  try {
    window.localStorage.setItem("seoCrawlerTheme", t);
  } catch {}
  const m = {
    dark: "btnThemeDark",
    light: "btnThemeLight",
    "hc-dark": "btnThemeHcDark",
    "hc-light": "btnThemeHcLight",
  };
  Object.values(m).forEach((id) =>
    document.getElementById(id)?.classList.remove("on"),
  );
  const active = m[t];
  if (active) document.getElementById(active)?.classList.add("on");
}

//
// ADV PANEL
//
let crawlSrc = "crawl";
function toggleAdv() {
  document.getElementById("advPanel").classList.toggle("open");
}
function setSrc(s) {
  crawlSrc = s;
  document.getElementById("srcCrawl").classList.toggle("on", s === "crawl");
  document.getElementById("srcSitemap").classList.toggle("on", s === "sitemap");
}

//
// TABS
//
function goTab(name, btn) {
  document.querySelectorAll(".tbtn").forEach((b) => b.classList.remove("on"));
  document.querySelectorAll(".tpane").forEach((p) => p.classList.remove("on"));
  currentTab = name;
  if (btn) btn.classList.add("on");
  document.getElementById("tab-" + name).classList.add("on");
}

function setWorkspace(mode, btn) {
  const root = document.getElementById("mainLayout");
  if (!root) return;
  currentWorkspace = mode;
  root.classList.toggle("mode-seo", mode === "seo");
  root.classList.toggle("mode-domain", mode === "domain");
  root.classList.toggle("mode-functionality", mode === "functionality");
  const bSeo = document.getElementById("scopeSeoBtn");
  const bDomain = document.getElementById("scopeDomainBtn");
  const bFunc = document.getElementById("scopeFuncBtn");
  if (bSeo) bSeo.classList.toggle("on", mode === "seo");
  if (bDomain) bDomain.classList.toggle("on", mode === "domain");
  if (bFunc) bFunc.classList.toggle("on", mode === "functionality");
  if (mode === "functionality") goTab("functionality", null);
  if (
    mode === "seo" &&
    document.getElementById("tab-functionality")?.classList.contains("on")
  ) {
    const firstSeoTab = document.querySelector(".tbtn");
    if (firstSeoTab) goTab("all", firstSeoTab);
  }
  if (btn) btn.classList.add("on");
}

function restoreWorkspaceState() {
  const workspace = currentWorkspace || "seo";
  const tab = currentTab || "all";
  setWorkspace(workspace);

  if (workspace === "functionality") {
    goTab("functionality", null);
    return;
  }

  const tabButton = Array.from(document.querySelectorAll(".tbtn")).find(
    (button) => (button.getAttribute("onclick") || "").includes(`'${tab}'`),
  );

  if (document.getElementById(`tab-${tab}`)) {
    goTab(tab, tabButton || null);
  } else {
    const firstSeoTab = document.querySelector(".tbtn");
    if (firstSeoTab) goTab("all", firstSeoTab);
  }
}

// Sub-filters
function sf(tbodyId, filter, btn) {
  btn
    .closest(".sfbar")
    .querySelectorAll(".sfbtn")
    .forEach((b) => b.classList.remove("on"));
  btn.classList.add("on");
  document
    .getElementById(tbodyId)
    .querySelectorAll("tr")
    .forEach((tr) => {
      if (filter === "all") {
        tr.classList.remove("hi");
        return;
      }
      const types = JSON.parse(tr.dataset.types || "[]");
      tr.classList.toggle("hi", !types.includes(filter));
    });
  applyUrlSearchFilter();
}

//
// RESET
//
function resetState() {
  [
    "tbAll",
    "tbSEO",
    "tbIssues",
    "tbTitles",
    "tbDesc",
    "tbH1",
    "tbImages",
    "tbErrors",
    "tbFunc",
  ].forEach((id) => {
    document.getElementById(id).innerHTML = "";
  });
  document.getElementById("dupList").innerHTML =
    `<div class="empty"><div class="ico">✨</div><p>${T("noDups")}</p></div>`;
  document.getElementById("robotsBox").innerHTML =
    `<p style="color:var(--muted);font-size:12px;">${T("waitingCrawl")}</p>`;
  document.getElementById("dlb").style.display = "none";
  document.getElementById("seoCard").querySelector(".sidebar-body").innerHTML =
    `
        <div class="seo-preview">
          <img src="/assets/seo-illustration.svg" alt="SEO illustration">
        </div>
        <p style="font-size:12px;color:var(--muted);">${T("clickPageSeo")}</p>`;
  document.getElementById("hostingBody").innerHTML =
    `<p style="font-size:12px;color:var(--muted);">${T("loadingHosting")}</p>`;
  document.getElementById("techBody").innerHTML =
    `<p style="font-size:12px;color:var(--muted);">${T("loadingTech")}</p>`;
  document.getElementById("securityBody").innerHTML =
    `<p style="font-size:12px;color:var(--muted);">${T("loadingSecurity")}</p>`;
  const fBody = document.getElementById("functionalityBody");
  if (fBody)
    fBody.innerHTML = `<p style="font-size:12px;color:var(--muted);">${T("functionalityIntro")}</p>`;
  crawlState.pages = [];
  crawlState.duplicates = [];
  crawlState.robots = null;
  crawlState.hosting = null;
  window.__selectedSeoPage = null;
  document.querySelectorAll(".sv").forEach((el) => (el.textContent = "0"));
  sv("v4", "0/100");
  sv("vR", "0ms");
  sv("vSec", "—");
  document.querySelectorAll(".tc").forEach((el) => (el.textContent = "0"));
  document.querySelectorAll(".sfbar").forEach((bar) => {
    bar
      .querySelectorAll(".sfbtn")
      .forEach((b, i) => b.classList.toggle("on", i === 0));
  });
  const allPageSize = document.getElementById("allPageSize");
  allTablePageSize = Number(allPageSize?.value || 20);
  allTablePage = 1;
  applyUrlSearchFilter();
  updateCrawlButtonLabel();
}

function rerenderTablesFromState() {
  [
    "tbAll",
    "tbSEO",
    "tbIssues",
    "tbTitles",
    "tbDesc",
    "tbH1",
    "tbImages",
    "tbErrors",
    "tbFunc",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = "";
  });
  crawlState.pages.forEach((p) => addPage(p));
  applyUrlSearchFilter();
}

function normalizeSavedPage(page) {
  if (!page || typeof page !== "object") return page;

  const meta = page.meta && typeof page.meta === "object" ? page.meta : {};
  const title = typeof page.title === "string" ? page.title : String(meta.title || "");
  const description =
    typeof page.description === "string"
      ? page.description
      : String(meta.description || "");
  const h1s = Array.isArray(page.h1s) ? page.h1s : Array.isArray(meta.h1s) ? meta.h1s : [];
  const headings = Array.isArray(page.headings)
    ? page.headings
    : Array.isArray(meta.headings)
      ? meta.headings
      : [];
  const headingSkips = Array.isArray(page.headingSkips)
    ? page.headingSkips
    : Array.isArray(meta.headingSkips)
      ? meta.headingSkips
      : [];

  return {
    ...page,
    title,
    titleLen: Number(page.titleLen ?? meta.titleLen ?? title.length ?? 0),
    description,
    descLen: Number(page.descLen ?? meta.descLen ?? description.length ?? 0),
    h1s,
    headings,
    totalH: Number(page.totalH ?? headings.length ?? 0),
    headingSkips,
    imgsNoAlt: Number(page.imgsNoAlt ?? meta.imgsNoAlt ?? 0),
    imgsNoSize: Number(page.imgsNoSize ?? meta.imgsNoSize ?? 0),
    totalImgs: Number(page.totalImgs ?? meta.totalImgs ?? 0),
    canonical: page.canonical ?? meta.canonical ?? "",
    noindex: Boolean(page.noindex ?? meta.noindex ?? false),
    pageLang: page.pageLang ?? meta.pageLang ?? "",
    buttonsNoLink: Number(page.buttonsNoLink ?? meta.buttonsNoLink ?? 0),
    buttonsNoLinkDetails: Array.isArray(page.buttonsNoLinkDetails)
      ? page.buttonsNoLinkDetails
      : Array.isArray(meta.buttonsNoLinkDetails)
        ? meta.buttonsNoLinkDetails
        : [],
    placeholderLinks: Number(page.placeholderLinks ?? meta.placeholderLinks ?? 0),
    placeholderLinkDetails: Array.isArray(page.placeholderLinkDetails)
      ? page.placeholderLinkDetails
      : Array.isArray(meta.placeholderLinkDetails)
        ? meta.placeholderLinkDetails
        : [],
    formsNoAction: Number(page.formsNoAction ?? meta.formsNoAction ?? 0),
    formsNoActionDetails: Array.isArray(page.formsNoActionDetails)
      ? page.formsNoActionDetails
      : Array.isArray(meta.formsNoActionDetails)
        ? meta.formsNoActionDetails
        : [],
    formsNoSubmit: Number(page.formsNoSubmit ?? meta.formsNoSubmit ?? 0),
    formsNoSubmitDetails: Array.isArray(page.formsNoSubmitDetails)
      ? page.formsNoSubmitDetails
      : Array.isArray(meta.formsNoSubmitDetails)
        ? meta.formsNoSubmitDetails
        : [],
    mainNavLinks: Number(page.mainNavLinks ?? meta.mainNavLinks ?? 0),
    weakNavigation: Boolean(page.weakNavigation ?? meta.weakNavigation ?? false),
    brokenButtonLinks: Array.isArray(page.brokenButtonLinks)
      ? page.brokenButtonLinks
      : [],
    brokenButtonDetails: Array.isArray(page.brokenButtonDetails)
      ? page.brokenButtonDetails
      : [],
    brokenImageLinks: Array.isArray(page.brokenImageLinks)
      ? page.brokenImageLinks
      : [],
    loadTimeMs: Number(page.loadTimeMs ?? 0),
  };
}

async function fetchRunCollection(runId, resource) {
  const projectId = currentProject?.id;
  if (!projectId || !runId) return [];

  const items = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await fetch(
      `/api/projects/${encodeURIComponent(projectId)}/runs/${encodeURIComponent(runId)}/${resource}?page=${page}&limit=${RUN_COLLECTION_BATCH_SIZE}`,
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "No se pudo cargar el historial");
    }
    items.push(...(Array.isArray(data.items) ? data.items : []));
    hasNext = Boolean(data.pagination?.hasNext);
    page += 1;
  }

  return items;
}

async function applySavedRun(run) {
  if (!run) return;
  const requestId = ++activeRunLoadRequest;
  const previousWorkspace = currentWorkspace;
  const previousTab = currentTab;
  resetState();
  currentWorkspace = "seo";
  currentTab = "all";
  const show = (id, d) => {
    const el = document.getElementById(id);
    if (el) el.style.display = d || "block";
  };
  show("cw");
  show("sg", "flex");
  show("mainLayout", "flex");
  currentWorkspace = previousWorkspace || "seo";
  currentTab = previousTab || "all";
  restoreWorkspaceState();

  const input = document.getElementById("urlInput");
  if (input && run.sourceUrl) input.value = run.sourceUrl;
  const stats = run.stats || {};
  if (stats.domainInfo) {
    crawlState.hosting = stats.domainInfo;
    renderHosting(stats.domainInfo);
  } else if (run.sourceUrl) {
    fetch(`/api/site-info?url=${encodeURIComponent(run.sourceUrl)}`)
      .then((r) => r.json())
      .then((info) => {
        crawlState.hosting = info;
        renderHosting(info);
      })
      .catch(() => {});
  }

  if (stats.robots) {
    crawlState.robots = stats.robots;
    renderRobots(stats.robots);
  }

  sv("stxt", `${T("runLoaded")}: ${new Date(run.createdAt).toLocaleString()}`);
  sv("vT", run.total || 0);
  sv("vI", run.withIssues || 0);
  sv("vTi", stats.titleIssues || 0);
  sv("vH", stats.h1Issues || 0);
  sv("vIm", stats.imgIssues || 0);
  sv("vDu", stats.duplicates || 0);
  sv("tc-all", run.total || 0);
  sv("tc-seo", run.total || 0);
  sv("tc-issues", run.withIssues || 0);
  sv("tc-titles", stats.titleIssues || 0);
  sv("tc-desc", stats.descIssues || 0);
  sv("tc-h1", stats.h1Issues || 0);
  sv("tc-images", stats.imgIssues || 0);
  sv("tc-errors", (stats["404"] || 0) + (stats.redirects || 0));
  sv("tc-dup", stats.duplicates || 0);
  renderChart({
    "404": stats["404"] || 0,
    redirects: stats.redirects || 0,
    titleIssues: stats.titleIssues || 0,
    descIssues: stats.descIssues || 0,
    imgIssues: stats.imgIssues || 0,
    duplicates: stats.duplicates || 0,
  });

  updateDownloadUi(
    buildRunReportUrl(run.id),
    run.downloadName,
    run.total || 0,
    run.withIssues || 0,
  );
  restoreWorkspaceState();
  const pw = document.getElementById("pw");
  if (pw) {
    pw.classList.remove("is-active", "is-complete");
    pw.style.display = "none";
  }
  const sl = document.getElementById("sl");
  if (sl) sl.style.display = "none";

  const [loadedPages, loadedDuplicates] = await Promise.all([
    Array.isArray(run.pages)
      ? Promise.resolve(run.pages.map(normalizeSavedPage))
      : fetchRunCollection(run.id, "pages").then((items) =>
          items.map(normalizeSavedPage),
        ),
    Array.isArray(run.duplicates)
      ? Promise.resolve(run.duplicates)
      : fetchRunCollection(run.id, "duplicates"),
  ]);

  if (requestId !== activeRunLoadRequest) {
    return run;
  }

  crawlState.pages = loadedPages;
  crawlState.duplicates = loadedDuplicates;
  rerenderTablesFromState();
  if (crawlState.duplicates.length) renderDups(crawlState.duplicates);
  updateAggregateSgStats();
  updateCrawlButtonLabel();
  return {
    ...run,
    pages: loadedPages,
    duplicates: loadedDuplicates,
  };
}

//
// CRAWL
//
function startCrawl() {
  const url = document.getElementById("urlInput").value.trim();
  const max = document.getElementById("maxPg").value;
  const rate = document.getElementById("rateDelay").value;
  const ext = document.getElementById("checkExt").checked ? "1" : "0";
  const projectId = currentProject?.id || "";
  if (!url) {
    document.getElementById("urlInput").focus();
    return;
  }
  if (!projectId) {
    alert(T("projectRequired"));
    return;
  }

  resetState();
  const show = (id, d) => {
    const el = document.getElementById(id);
    if (el) el.style.display = d || "block";
  };
  show("pw");
  show("sl");
  const progressWrap = document.getElementById("pw");
  const progressBar = document.getElementById("pb");
  const statusWrap = document.getElementById("sl");
  const cancelBtn = document.getElementById("sl-cancel");
  if (progressWrap) {
    progressWrap.classList.add("is-indeterminate");
    progressWrap.classList.remove("is-complete");
  }
  show("cw");
  show("sg", "flex");
  show("mainLayout", "flex");
  restoreWorkspaceState();

  const btn = document.getElementById("btnCrawl");
  btn.disabled = true;
  btn.querySelector("[data-i18n]").textContent = T("crawling");

  // Fetch hosting info in parallel
  fetch(`/api/site-info?url=${encodeURIComponent(url)}`)
    .then((r) => r.json())
    .then((info) => {
      crawlState.hosting = info;
      renderHosting(info);
    })
    .catch(() => {});

  const qs = new URLSearchParams({
    url,
    max,
    source: crawlSrc,
    rate,
    external: ext,
    lang,
    projectId,
  });

  const maxPages = parseInt(max) || 50;

  const setProgress = (done) => {
    if (!progressBar || !progressWrap) return;
    const pct = Math.min(100, Math.round((done / maxPages) * 100));
    if (pct > 0 && progressWrap.classList.contains("is-indeterminate")) {
      progressWrap.classList.remove("is-indeterminate");
    }
    progressBar.style.width = `${pct}%`;
  };

  const hideProgress = (complete = false) => {
    if (progressWrap) {
      progressWrap.classList.remove("is-indeterminate");
      if (complete) {
        progressWrap.classList.add("is-complete");
        setTimeout(() => {
          progressWrap.style.display = "none";
          progressWrap.classList.remove("is-complete");
          if (progressBar) progressBar.style.width = "0%";
        }, 600);
      } else {
        progressWrap.classList.remove("is-complete");
        progressWrap.style.display = "none";
        if (progressBar) progressBar.style.width = "0%";
      }
    }
    if (statusWrap) statusWrap.style.display = "none";
  };

  const es = new EventSource(`/api/crawl?${qs}`);

  if (cancelBtn) {
    cancelBtn.onclick = () => {
      es.close();
      hideProgress(false);
      btn.disabled = false;
      updateCrawlButtonLabel();
    };
  }

  es.addEventListener("robots", (e) => {
    const robots = JSON.parse(e.data);
    crawlState.robots = robots;
    renderRobots(robots);
  });
  es.addEventListener("sitemap", (e) => {
    sv("stxt", `${T("sitemapCount")}: ${JSON.parse(e.data).count} URLs`);
  });
  es.addEventListener("page", (e) => {
    const p = JSON.parse(e.data);
    crawlState.pages.push(p);
    addPage(p);
    sv("stxt", `${T("analyzing")}... ${p.total} / ${maxPages}  |  ${p.queued} ${T("queueLabel")}`);
    sv("sl-url", p.url || "");
    setProgress(p.total);
    sv("vT", p.total);
    updateAggregateSgStats();
  });
  es.addEventListener("done", (e) => {
    const d = JSON.parse(e.data);
    es.close();
    const s = d.stats;
    sv("vT", d.total);
    sv("vI", d.withIssues);
    updateAggregateSgStats();
    sv("vTi", s.titleIssues);
    sv("vH", s.h1Issues);
    sv("vIm", s.imgIssues);
    sv("vDu", s.duplicates);
    sv("tc-all", d.total);
    sv("tc-seo", d.total);
    sv("tc-issues", d.withIssues);
    sv("tc-titles", s.titleIssues);
    sv("tc-desc", s.descIssues);
    sv("tc-h1", s.h1Issues);
    sv("tc-images", s.imgIssues);
    sv("tc-errors", s["404"] + s.redirects);
    sv("tc-dup", s.duplicates);
    renderChart(s);
    crawlState.duplicates = d.duplicates || [];
    if (crawlState.duplicates.length) renderDups(crawlState.duplicates);
    updateDownloadUi(d.downloadUrl, d.fileName, d.total, d.withIssues);
    setProgress(d.total);
    hideProgress(true);
    btn.disabled = false;
    updateCrawlButtonLabel();
  });
  es.addEventListener("error", () => {
    es.close();
    hideProgress(false);
    btn.disabled = false;
    updateCrawlButtonLabel();
  });
}
const sv = (id, v) => {
  const el = document.getElementById(id);
  if (el) el.textContent = v;
};

//
// CHART
//
function renderChart(s) {
  const items = [
    { l: "404", v: s["404"], c: "var(--error)" },
    { l: T("redirects"), v: s.redirects, c: "var(--orange)" },
    { l: T("tabTitles"), v: s.titleIssues, c: "var(--warn)" },
    { l: T("tabDesc"), v: s.descIssues, c: "var(--warn)" },
    { l: "H1", v: s.h1Issues, c: "var(--purple)" },
    { l: T("tabImages"), v: s.imgIssues, c: "var(--blue)" },
    { l: "Noindex", v: s.noindex || 0, c: "var(--error)" },
    { l: T("tabDup"), v: s.duplicates, c: "var(--purple)" },
  ];
  const mx = Math.max(...items.map((d) => d.v), 1);
  const bars = document.getElementById("bars");
  if (!bars) return;
  bars.innerHTML = items
    .map(
      (d) => `
    <div class="bcol" title="${d.l}: ${d.v}">
      <div class="bval">${d.v}</div>
      <div class="bar" style="background:${d.c};height:${Math.max(d.v > 0 ? (d.v / mx) * 54 : 0, d.v > 0 ? 4 : 0)}px;opacity:${d.v > 0 ? 0.9 : 0.12};"></div>
      <div class="blbl">${d.l}</div>
    </div>`,
    )
    .join("");
}

//
// ROW HELPERS
//
const esc = (s) =>
  String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const trunc = (s, n) => {
  s = String(s || "");
  return s.length > n ? "…" + s.slice(s.length - n + 1) : s;
};
const sameU = (a, b) => {
  if (!a || !b) return false;
  return (
    a.replace(/\/$/, "").toLowerCase() === b.replace(/\/$/, "").toLowerCase()
  );
};
function attachSeoRowBehavior(tr, p) {
  tr.style.cursor = "pointer";
  tr.addEventListener("click", () => {
    showPageSEO(p);
    showFunctionalityInfo(p);
  });
  return tr;
}
function issueLabel(i) {
  const byType = {
    no_title: T("noTitle"),
    title_short: T("titleShort"),
    title_long: T("titleLong"),
    no_desc: T("noDesc"),
    desc_short: T("descShort"),
    desc_long: T("descLong"),
    no_h1: T("noH1"),
    multi_h1: T("multiH1"),
    heading_skip: T("headingSkip"),
    imgs_no_alt: T("noAlt"),
    imgs_no_size: T("noImgSize"),
    button_no_link: T("buttonNoLink"),
    broken_button: T("brokenButton"),
    placeholder_link: T("placeholderLink"),
    form_no_action: T("formNoAction"),
    form_no_submit: T("formNoSubmit"),
    weak_navigation: T("weakNavigation"),
    broken_image: T("brokenImages"),
    slow_load: T("slowLoad"),
    canonical: T("canonicalIssue"),
    noindex: T("noindexActive"),
    timeout: T("timeoutLabel"),
    http_error: T("httpErrors"),
    redirect: T("redirects"),
    blocked: T("blocked"),
  };
  return byType[i?.type] || i?.label || "";
}
function groupLabel(g) {
  const byGroup = {
    errors: T("tabErrors"),
    titles: T("tabTitles"),
    desc: T("tabDesc"),
    h1: "H1",
    images: T("tabImages"),
    functionality: T("tabFunctionality"),
  };
  return byGroup[g] || g;
}
function sbadge(c) {
  if (!c || c === 0) return `<span class="badge be">T/O</span>`;
  if (c >= 200 && c < 300) return `<span class="badge b2">${c}</span>`;
  if (c >= 300 && c < 400) return `<span class="badge b3">${c}</span>`;
  return `<span class="badge b4">${c}</span>`;
}
function lcls(n, min, max) {
  if (!n) return "lerr";
  if (n < min || n > max) return "lwarn";
  return "lok";
}
function urlA(p) {
  const d = p.finalUrl || p.url;
  const hasRR = p.redirectTo && !sameU(p.redirectTo, p.url);
  const openUrlTitle = lang === "en" ? "Open URL" : "Abrir URL";
  const openIcon = `<a class="url-open" href="${esc(d)}" target="_blank" rel="noopener noreferrer" title="${openUrlTitle}" onclick="event.stopPropagation()">
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M7 5h8v8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
      <path d="M15 5l-9 9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
      <rect x="4" y="8" width="8" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".7"></rect>
    </svg>
  </a>`;
  return hasRR
    ? `<div class="url-cell"><span class="url-text">${esc(trunc(d, 48))}</span>${openIcon}</div><br><small style="color:var(--orange);font-size:10px;">↳${esc(trunc(p.url, 44))}</small>`
    : `<div class="url-cell"><span class="url-text">${esc(trunc(d, 56))}</span>${openIcon}</div>`;
}
function mkTr(cells, types) {
  const tr = document.createElement("tr");
  tr.dataset.types = JSON.stringify(types || []);
  tr.innerHTML = cells.map((c) => `<td>${c}</td>`).join("");
  return tr;
}
const gmap = {
  errors: "ge",
  titles: "gt",
  desc: "gd",
  h1: "gh",
  images: "gi",
  functionality: "gb",
};
function gclass(g) {
  return gmap[g] || "ge";
}

function scoreCls(n) {
  if (n >= 80) return "score-hi";
  if (n >= 50) return "score-mid";
  return "score-lo";
}
function scoreColor(n) {
  if (n >= 80) return "var(--ok)";
  if (n >= 50) return "var(--warn)";
  return "var(--error)";
}

function securityLevelFromScore(score) {
  const n = Number(score || 0);
  if (n >= 90) return "high";
  if (n >= 70) return "good";
  if (n >= 40) return "medium";
  return "low";
}

function securityLevelLabel(level) {
  if (level === "high") return T("securityLevelHigh");
  if (level === "good") return T("securityLevelGood");
  if (level === "medium") return T("securityLevelMedium");
  return T("securityLevelLow");
}

function securityLevelClass(level) {
  if (level === "high" || level === "good") return "good";
  if (level === "medium") return "mid";
  return "bad";
}

function updateSecurityLevelStat(security) {
  const score = Number(security?.score || 0);
  const level = security?.level || securityLevelFromScore(score);
  sv("vSec", securityLevelLabel(level));
}

function securityFixKey(header) {
  const map = {
    "Content-Security-Policy": "secFixCsp",
    "Strict-Transport-Security": "secFixHsts",
    "X-Frame-Options": "secFixXfo",
    "X-Content-Type-Options": "secFixXcto",
    "Referrer-Policy": "secFixReferrer",
    "Permissions-Policy": "secFixPermissions",
    "Cross-Origin-Opener-Policy": "secFixCoop",
    "Cross-Origin-Resource-Policy": "secFixCorp",
    "Cross-Origin-Embedder-Policy": "secFixCoep",
  };
  return map[header] || "secFixPermissions";
}

function securityUrgency(header, criticalMissing) {
  if ((criticalMissing || []).includes(header)) return "high";
  if (
    [
      "Referrer-Policy",
      "Permissions-Policy",
      "Cross-Origin-Opener-Policy",
      "Cross-Origin-Resource-Policy",
      "Cross-Origin-Embedder-Policy",
    ].includes(header)
  ) {
    return "medium";
  }
  return "low";
}

function urgencyLabel(level) {
  if (level === "high") return T("securityUrgencyHigh");
  if (level === "medium") return T("securityUrgencyMedium");
  return T("securityUrgencyLow");
}

// Score ring SVG
function scoreRing(score, label) {
  const c = scoreColor(score);
  const offset = 125.6 * (1 - score / 100);
  return `<div class="score-ring">
    <svg class="ring-svg" viewBox="0 0 44 44">
      <circle class="ring-bg" cx="22" cy="22" r="20"/>
      <circle class="ring-fill" cx="22" cy="22" r="20" stroke="${c}" stroke-dashoffset="${offset}" transform="rotate(-90 22 22)"/>
      <text class="ring-num" x="22" y="26" text-anchor="middle" font-size="11" font-weight="800" font-family="Syne,sans-serif" fill="${c}">${score}</text>
    </svg>
    <div class="ring-label" style="color:${c};">${label}</div>
  </div>`;
}

const expandedHeadingUrls = new Set();
function isHeadingExpanded(url) {
  return expandedHeadingUrls.has((url || "").toLowerCase());
}
function toggleHeadings(url) {
  const key = (url || "").toLowerCase();
  if (!key) return;
  if (expandedHeadingUrls.has(key)) expandedHeadingUrls.delete(key);
  else expandedHeadingUrls.add(key);
}

// Heading tree render
function renderHeadingTree(headings, skips, pageUrl) {
  if (!headings || !headings.length)
    return `<span style="color:var(--muted);font-size:10px;"></span>`;
  const skipFroms = new Set((skips || []).map((s) => s.to));
  const expanded = isHeadingExpanded(pageUrl);
  const visible = expanded ? headings : headings.slice(0, 8);
  const remaining = Math.max(0, headings.length - visible.length);
  const moreBtn =
    headings.length > 8
      ? `<button class="htree-more" type="button" onclick="toggleHeadings('${esc(pageUrl || "").replace(/'/g, "&#39;")}');showPageSEO(window.__selectedSeoPage);">${expanded ? T("headingLess") : `+${remaining} ${T("headingMore")}`}</button>`
      : "";
  return `<div class="htree">${visible
    .map((h) => {
      const indent = (h.level - 1) * 10;
      const isSkip = skipFroms.has(`H${h.level}`);
      return `<div class="htree-item" style="margin-left:${indent}px;">
      <span class="htree-level ${isSkip ? "htree-skip" : ""}">H${h.level}</span>
      <span class="htree-text" title="${esc(h.text)}">${esc(trunc(h.text, 26))}</span>
    </div>`;
    })
    .join("")}${moreBtn}</div>`;
}

//
// SIDEBAR: SEO detail for clicked row
//
function buildSeoOptions(page) {
  const clampWord = (text, max) => {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (clean.length <= max) return clean;
    const cut = clean.slice(0, max + 1);
    const lastSpace = cut.lastIndexOf(" ");
    if (lastSpace > Math.floor(max * 0.6)) return cut.slice(0, lastSpace).trim();
    return clean.slice(0, max).trim();
  };
  const composeWithin = (parts, max) => {
    const out = [];
    for (const p of parts) {
      const next = [...out, p].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
      if (next.length > max) break;
      out.push(p);
    }
    return clampWord(out.join(" "), max);
  };
  const hostname = (() => {
    try {
      return new URL(page.url || "").hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  })();
  // Extract meaningful keywords from URL path (e.g. /blog/seo-tips -> "seo tips")
  const urlTopic = (() => {
    try {
      const segments = new URL(page.url || "").pathname
        .split("/")
        .filter(Boolean)
        .pop() || "";
      return segments.replace(/[-_]+/g, " ").replace(/\.\w+$/, "").trim();
    } catch {
      return "";
    }
  })();
  const h1 = page.h1s && page.h1s[0] ? page.h1s[0].trim() : "";
  const mainTopic = h1 || page.title || urlTopic || hostname || "your page";
  const titleBase = clampWord(mainTopic, 44);
  const topicLower = titleBase.toLowerCase();
  const brand = hostname || "Website";
  const year = String(new Date().getFullYear());

  // Existing description: use it as seed if it has substance, otherwise fall back to topic
  const existingDesc = page.description ? page.description.trim() : "";
  const descSeed = existingDesc.length > 30
    ? clampWord(existingDesc, 110)
    : "";

  if (lang === "en") {
    // Title option 1: [Topic] · [Brand]  — clean, professional, branded
    const t1 = composeWithin([titleBase, "·", brand], 60);
    // Title option 2: [Topic] — [Year] | [Brand]  — date-stamped, useful for evergreen pages
    const t2 = composeWithin([titleBase, `(${year})`, "|", brand], 60);

    // Description option 1: sentence built from the existing description or topic + closing CTA
    const d1Seed = descSeed
      ? descSeed.replace(/[.!?]+$/, "") + "."
      : `Everything you need to know about ${topicLower}.`;
    const d1 = composeWithin([d1Seed, `Find out more on ${brand}.`], 160);

    // Description option 2: question-hook format — different structure, better CTR pattern
    const d2 = composeWithin(
      [`Looking for ${topicLower}?`, descSeed
        ? descSeed.replace(/[.!?]+$/, "") + "."
        : `Get clear, reliable information straight from ${brand}.`],
      160
    );

    return { title: [t1, t2], desc: [d1, d2] };
  }

  // ES
  // Title option 1: [Tema] · [Marca]  — limpio, profesional
  const t1 = composeWithin([titleBase, "·", brand], 60);
  // Title option 2: [Tema] (año) | [Marca]  — útil para contenido evergreen o actualizado
  const t2 = composeWithin([titleBase, `(${year})`, "|", brand], 60);

  // Description option 1: parte del contenido existente + CTA de cierre
  const d1Seed = descSeed
    ? descSeed.replace(/[.!?]+$/, "") + "."
    : `Todo lo que necesitas saber sobre ${topicLower}.`;
  const d1 = composeWithin([d1Seed, `Más información en ${brand}.`], 160);

  // Description option 2: gancho de pregunta — estructura diferente, mejor patrón de CTR
  const d2 = composeWithin(
    [`¿Buscas información sobre ${topicLower}?`, descSeed
      ? descSeed.replace(/[.!?]+$/, "") + "."
      : `Encuentra respuestas claras y actualizadas en ${brand}.`],
    160
  );

  return { title: [t1, t2], desc: [d1, d2] };
}

function showPageSEO(p) {
  window.__selectedSeoPage = p;
  const q = p.seoQuality || {};
  const tScore = q.titleScore || 0;
  const dScore = q.descScore || 0;
  const tSugs = q.titleSuggestions || [];
  const dSugs = q.descSuggestions || [];
  const tl = p.titleLen || 0;
  const dl = p.descLen || 0;
  const opts = buildSeoOptions(p);

  const sugHtml = (sugs) =>
    sugs.length
      ? sugs
          .map(
            (s) =>
              `<div class="seo-sug-item warn">💡 ${esc(lang === "en" ? s.en : s.es)}</div>`,
          )
          .join("")
      : `<div class="seo-sug-item ok">✅ ${lang === "en" ? "Looks good!" : "Se ve bien"}</div>`;

  const optionsHtml = (label, items) => `
      <div style="margin-top:8px;">
        <div style="font-size:10px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-bottom:5px;">${label}</div>
        <div class="seo-sug-item opt"><strong>${T("option1")}:</strong> ${esc(items[0] || "")}</div>
        <div class="seo-sug-item opt"><strong>${T("option2")}:</strong> ${esc(items[1] || "")}</div>
      </div>`;

  document.getElementById("seoCard").querySelector(".sidebar-body").innerHTML =
    `
    <div style="font-size:10px;color:var(--muted);margin-bottom:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(p.url)}">${esc(trunc(p.url, 36))}</div>
    <div class="score-row">
      ${scoreRing(tScore, T("titleQuality"))}
      ${scoreRing(dScore, T("descQuality"))}
    </div>
    <div style="margin-top:8px;">
      <div style="font-size:10px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-bottom:5px;">${T("title")} <span style="color:var(--text2);">(${tl} ${T("chars")})</span></div>
      <div style="font-size:10px;color:var(--text2);background:var(--bg3);padding:6px 8px;border-radius:4px;margin-bottom:4px;word-break:break-word;">${esc(p.title || "")}</div>
      ${sugHtml(tSugs)}
      ${optionsHtml(T("seoOptionsTitle"), opts.title)}
    </div>
    <div style="margin-top:10px;">
      <div style="font-size:10px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-bottom:5px;">${T("description")} <span style="color:var(--text2);">(${dl} ${T("chars")})</span></div>
      <div style="font-size:10px;color:var(--text2);background:var(--bg3);padding:6px 8px;border-radius:4px;margin-bottom:4px;word-break:break-word;">${esc(p.description || "")}</div>
      ${sugHtml(dSugs)}
      ${optionsHtml(T("seoOptionsDesc"), opts.desc)}
    </div>
    <div style="margin-top:10px;">
      <div style="font-size:10px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-bottom:5px;">${T("headings")}</div>
      ${renderHeadingTree(p.headings, p.headingSkips, p.url)}
    </div>
  `;
}

function showFunctionalityInfo(p) {
  const body = document.getElementById("functionalityBody");
  if (!body || !p) return;
  const noLink = p.buttonsNoLinkDetails || [];
  const broken = p.brokenButtonDetails || [];
  const placeholder = p.placeholderLinkDetails || [];
  const formsNoAction = p.formsNoActionDetails || [];
  const formsNoSubmit = p.formsNoSubmitDetails || [];
  const url = p.finalUrl || p.url || "";
  const loadTime = Number(p.loadTimeMs || 0);
  const navLinks = Number(p.mainNavLinks || 0);
  const weakNavigation = Boolean(p.weakNavigation);
  const loadHtml = `<div class="func-item">
      <div class="func-k">${T("loadTimeLabel")}</div>
      <div class="func-v">${loadTime > 0 ? `${loadTime} ms` : T("funcNoData")}</div>
    </div>`;
  const noLinkHtml = noLink.length
      ? noLink
          .map(
            (b, idx) => `
          <div class="func-item">
            <div class="func-k">#${idx + 1} · ${T("buttonNoLink")}</div>
            <div class="func-v"><strong>${T("funcTextLabel")}:</strong> ${esc(b.text || T("funcNoText"))}</div>
            <div class="func-v"><strong>${T("funcLocationLabel")}:</strong> ${esc(b.source || "button")}</div>
            <div class="func-v"><strong>${T("funcHrefLabel")}:</strong> ${esc(b.href || T("funcNoLink"))}</div>
          </div>`,
          )
          .join("")
    : `<p style="font-size:12px;color:var(--muted);margin-bottom:8px;">${T("buttonNoLink")}: 0</p>`;
  const brokenHtml = broken.length
      ? broken
          .map(
            (b, idx) => `
          <div class="func-item">
            <div class="func-k">#${idx + 1} · ${T("brokenButton")}</div>
            <div class="func-v"><strong>${T("funcTextLabel")}:</strong> ${esc(b.text || T("funcNoText"))}</div>
            <div class="func-v"><strong>${T("funcLocationLabel")}:</strong> ${esc(b.source || "button")}</div>
            <div class="func-v"><a href="${esc(b.url || "#")}" target="_blank" rel="noopener noreferrer">${esc(trunc(b.url || "", 60))}</a></div>
          </div>`,
          )
        .join("")
    : `<p style="font-size:12px;color:var(--muted);">${T("brokenButton")}: 0</p>`;
  const placeholderHtml = placeholder.length
    ? placeholder
        .slice(0, 5)
        .map(
          (item, idx) => `
          <div class="func-item">
            <div class="func-k">#${idx + 1} · ${T("placeholderLink")}</div>
            <div class="func-v"><strong>${T("funcTextLabel")}:</strong> ${esc(item.text || T("funcNoText"))}</div>
            <div class="func-v"><strong>${T("funcHrefLabel")}:</strong> ${esc(item.href || T("funcNoLink"))}</div>
            <div class="func-v"><strong>${T("funcLocationLabel")}:</strong> ${esc(item.source || "a")}</div>
          </div>`,
        )
        .join("")
    : `<p style="font-size:12px;color:var(--muted);margin-bottom:8px;">${T("placeholderLink")}: 0</p>`;
  const formsHtml = `
    <div class="func-item">
      <div class="func-k">${T("formNoAction")}</div>
      <div class="func-v">${formsNoAction.length || Number(p.formsNoAction || 0)}</div>
    </div>
    <div class="func-item">
      <div class="func-k">${T("formNoSubmit")}</div>
      <div class="func-v">${formsNoSubmit.length || Number(p.formsNoSubmit || 0)}</div>
    </div>
    <div class="func-item">
      <div class="func-k">${T("navLinks")}</div>
      <div class="func-v">${navLinks}${weakNavigation ? ` · ${T("weakNavigation")}` : ""}</div>
    </div>
  `;

  body.innerHTML = `
        <div style="font-size:12px;color:var(--muted);margin-bottom:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(url)}">${esc(trunc(url, 36))}</div>
        ${loadHtml}
        ${noLinkHtml}
        ${brokenHtml}
        ${placeholderHtml}
        ${formsHtml}
      `;
}

//
// SIDEBAR: Hosting
//
function renderHosting(info) {
  const row = (lbl, val) =>
    val
      ? `<div class="host-row"><div class="host-lbl">${lbl}</div><div class="host-val">${esc(String(val))}</div></div>`
      : "";
  const rowHtml = (lbl, html) =>
    html
      ? `<div class="host-row"><div class="host-lbl">${lbl}</div><div class="host-val">${html}</div></div>`
      : "";
  const listHtml = (items, max = 6) =>
    (items || [])
      .slice(0, max)
      .map((item) => esc(String(item)))
      .join("<br>");

  document.getElementById("hostingBody").innerHTML = `
    ${row(T("ip"), info.aRecords?.length ? info.aRecords.join(", ") : info.ip)}
    ${info.ipv6 ? row(T("ipv6"), info.ipv6) : ""}
    ${row(T("dns"), info.dnsProvider)}
    ${row(T("hostingType"), info.hostingType)}
    ${row(T("server"), info.serverSoftware || info.hostingHint)}
    ${row(T("hostingLocation"), info.hostingLocation)}
    ${row(T("ipOrg"), info.ipOrganization)}
    ${info.nameservers?.length ? rowHtml(T("nameservers"), `<span style="font-size:10px;">${listHtml(info.nameservers)}</span>`) : ""}
    ${info.mxRecords?.length ? rowHtml(T("mx"), `<span style="font-size:10px;">${listHtml(info.mxRecords)}</span>`) : ""}
    ${info.cnameRecords?.length ? rowHtml(T("cname"), `<span style="font-size:10px;">${listHtml(info.cnameRecords)}</span>`) : ""}
    ${info.txtRecords?.length ? rowHtml(T("txtRecords"), `<span style="font-size:10px;">${listHtml(info.txtRecords, 4)}</span>`) : ""}
    ${info.dmarcRecords?.length ? rowHtml(T("dmarc"), `<span style="font-size:10px;">${listHtml(info.dmarcRecords, 2)}</span>`) : ""}
    ${
      info.observations?.length
        ? `<div class="host-row"><div class="host-lbl">${T("observations")}</div><div class="host-val">${info.observations.map((note) => `<div class="host-note">${esc(note)}</div>`).join("")}</div></div>`
        : ""
    }
    ${!info.ip && !info.dnsProvider ? `<p style="font-size:10px;color:var(--muted);">${T("dnsError")}</p>` : ""}
  `;

  const cms = info.cms || null;
  const framework = info.framework || null;
  const hosting = info.hostingHint || info.serverSoftware || info.hostingType || null;
  const custom = !cms && !framework;
  const siteType = info.siteType || null;

  document.getElementById("techBody").innerHTML = `
    ${rowHtml(T("cms"), cms ? `<span class="host-badge">${esc(cms)}</span>` : `<span style="color:var(--muted);font-size:10px;">${custom ? T("customUnknown") : "—"}</span>`)}
    ${framework ? rowHtml(T("framework"), `<span class="host-badge">${esc(framework)}</span>`) : ""}
    ${hosting ? rowHtml(T("server"), `<span class="host-badge">${esc(hosting)}</span>`) : ""}
    ${siteType?.primary ? rowHtml(T("siteTypePrimary"), `<span class="host-badge">${esc(siteType.primary)}</span>`) : ""}
    ${Number.isFinite(Number(siteType?.confidence)) ? row(T("siteTypeConfidence"), `${Number(siteType.confidence)}%`) : ""}
    ${siteType?.purpose ? row(T("siteTypePurpose"), siteType.purpose) : ""}
    ${
      siteType?.signals?.length
        ? rowHtml(
            T("detectedSignals"),
            `<span style="font-size:10px;">${siteType.signals
              .map((signal) => esc(signal))
              .join("<br>")}</span>`,
          )
        : ""
    }
  `;

  const sec = info.security || {};
  const sScore = Number(sec.score || 0);
  const sLevel = sec.level || securityLevelFromScore(sScore);
  const sCls = securityLevelClass(sLevel);
  const levelLabel = securityLevelLabel(sLevel);
  const securityHeaders = [
    ["CSP", sec.contentSecurityPolicy],
    ["HSTS", sec.strictTransportSecurity],
    ["X-Frame-Options", sec.xFrameOptions],
    ["X-Content-Type-Options", sec.xContentTypeOptions],
    ["Referrer-Policy", sec.referrerPolicy],
    ["Permissions-Policy", sec.permissionsPolicy],
    ["COOP", sec.crossOriginOpenerPolicy],
    ["CORP", sec.crossOriginResourcePolicy],
    ["COEP", sec.crossOriginEmbedderPolicy],
  ];
  const presentHeaders =
    Number(sec.presentHeaders || 0) ||
    securityHeaders.filter(([, value]) => Boolean(value)).length;
  const totalHeaders = Number(sec.totalHeaders || securityHeaders.length);
  const criticalMissing =
    Array.isArray(sec.criticalMissingHeaders) && sec.criticalMissingHeaders.length
      ? sec.criticalMissingHeaders
      : [
          ["Content-Security-Policy", sec.contentSecurityPolicy],
          ["Strict-Transport-Security", sec.strictTransportSecurity],
          ["X-Frame-Options", sec.xFrameOptions],
          ["X-Content-Type-Options", sec.xContentTypeOptions],
        ]
          .filter(([, value]) => !value)
          .map(([name]) => name);
  const missingHeaders =
    Array.isArray(sec.missingHeaders) && sec.missingHeaders.length
      ? sec.missingHeaders
      : securityHeaders
          .filter(([, value]) => !value)
          .map(([name]) => name);
  const securityRecommendations = missingHeaders.slice(0, 6).map((header) => {
    const urgency = securityUrgency(header, criticalMissing);
    return {
      header,
      urgency,
      label: urgencyLabel(urgency),
      fix: T(securityFixKey(header)),
    };
  });
  const secRow = (lbl, val) =>
    `<div class="host-row"><div class="host-lbl">${lbl}</div><div class="host-val">${val ? "✅" : "⚠️"}</div></div>`;
  const ssl = info.ssl || null;
  updateSecurityLevelStat(sec);
  document.getElementById("securityBody").innerHTML = `
    <div class="security-score ${sCls}">${T("securityScore")}: ${sScore}/100</div>
    <div class="security-level-pill ${sCls}">${T("securityLevel")}: ${levelLabel}</div>
    <div class="security-meta">${presentHeaders}/${totalHeaders} ${T("securityHeadersDetected")}</div>
    ${
      criticalMissing.length
        ? `<div class="security-missing">${T("securityCriticalMissing")}: ${criticalMissing.map((header) => esc(header)).join(", ")}</div>`
        : `<div class="security-ok">${T("securityCriticalOk")}</div>`
    }
    ${
      securityRecommendations.length
        ? `<div class="security-rec-title">${T("securityRecommendations")}</div>
           <div class="security-rec-list">${securityRecommendations
             .map(
               (rec) => `<div class="security-rec-item ${rec.urgency}">
                 <div class="security-rec-head">${esc(rec.header)} · ${esc(rec.label)}</div>
                 <div class="security-rec-body">${esc(rec.fix)}</div>
               </div>`,
             )
             .join("")}</div>`
        : ""
    }
    <div style="font-size:10px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin:2px 0 8px;">${T("securityHeaders")}</div>
    ${securityHeaders.map(([label, value]) => secRow(label, value)).join("")}
    <div style="font-size:10px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin:10px 0 8px;">${T("ssl")}</div>
    ${
      ssl
        ? `
      ${row(T("sslSubject"), ssl.subjectCN)}
      ${row(T("sslIssuer"), ssl.issuerCN)}
      ${row(T("sslValidUntil"), ssl.validTo ? new Date(ssl.validTo).toLocaleDateString() : null)}
      ${row(T("sslDaysLeft"), ssl.validDaysRemaining)}
    `
        : `<p style="font-size:10px;color:var(--muted);">—</p>`
    }
  `;
}

//
// ADD PAGE TO TABS
//
function addPage(p) {
  const iss = p.issues || [];
  const seoIss = iss.filter((i) => i.group !== "functionality");
  const types = iss.map((i) => i.type || "errors");
  const hasRR = p.redirectTo && !sameU(p.redirectTo, p.url);
  const tLen = p.titleLen || 0;
  const dLen = p.descLen || 0;
  const q = p.seoQuality || {};
  const tScore = q.titleScore ?? null;
  const dScore = q.descScore ?? null;

  const issH = seoIss.length
    ? `<div class="itags">${seoIss.map((i) => `<span class="itag ${gclass(i.group)}">${issueLabel(i)}</span>`).join("")}</div>`
    : `<span style="color:var(--ok);font-size:10px;">✅ OK</span>`;

  //  ALL tab  clickable rows show SEO sidebar
  const trA = document.createElement("tr");
  trA.innerHTML = `
    <td class="uc">${urlA(p)}</td>
    <td>${sbadge(p.statusCode)}</td>
    <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(p.title)}">${p.title ? esc(trunc(p.title, 30)) : `<span style="color:var(--error);font-size:10px;">—</span>`}</td>
    <td><span class="${lcls(tLen, 30, 60)}">${tLen || "—"}</span></td>
    <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(p.description)}">${p.description ? esc(trunc(p.description, 34)) : `<span style="color:var(--muted);font-size:10px;">—</span>`}</td>
    <td><span class="${lcls(dLen, 70, 160)}">${dLen || "—"}</span></td>
    <td style="max-width:95px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${(p.h1s || []).length ? esc(trunc(p.h1s[0], 20)) : `<span style="color:var(--error);font-size:10px;">—</span>`}</td>
    <td>${p.imgsNoAlt > 0 ? `<span style="color:var(--warn);">${p.imgsNoAlt}</span>` : `<span style="color:var(--muted);">—</span>`}</td>
    <td>${issH}</td>`;
  attachSeoRowBehavior(trA, p);
  const tbAll = document.getElementById("tbAll");
  if (tbAll.children.length > 700) tbAll.removeChild(tbAll.firstChild);
  tbAll.appendChild(trA);

  //  SEO tab
  const seoTypes = [];
  if ((p.headingSkips || []).length) seoTypes.push("heading_skip");
  if (tScore !== null && tScore < 60) seoTypes.push("title_quality");
  if (dScore !== null && dScore < 60) seoTypes.push("desc_quality");
  if (!seoTypes.length) seoTypes.push("all");

  const skipCount = (p.headingSkips || []).length;
  const skipHtml = skipCount
    ? `<div class="itags">${(p.headingSkips || []).map((s) => `<span class="itag gh">${T("headingSkip")} ${s.from}->${s.to}</span>`).join("")}</div>`
    : `<span style="color:var(--ok);font-size:10px;">✅</span>`;

  const tScoreHtml =
    tScore !== null
      ? `<span style="color:${scoreColor(tScore)};font-weight:700;">${tScore}</span>`
      : "—";
  const dScoreHtml =
    dScore !== null
      ? `<span style="color:${scoreColor(dScore)};font-weight:700;">${dScore}</span>`
      : "—";
  const idxHtml = p.noindex
    ? `<span class="badge b4">noindex</span>`
    : `<span class="badge b2">index</span>`;
  const hCount = p.totalH || 0;

  const trSeo = mkTr(
    [
      urlA(p),
      sbadge(p.statusCode),
      tScoreHtml,
      dScoreHtml,
      idxHtml,
      `<span style="font-size:10px;color:var(--muted);">${hCount} ${hCount !== 1 ? T("headingWords") : T("headingWord")}</span>`,
      skipHtml,
    ],
    seoTypes,
  );
  document.getElementById("tbSEO").appendChild(attachSeoRowBehavior(trSeo, p));

  //  ISSUES tab
  if (seoIss.length) {
    const gs = [...new Set(seoIss.map((i) => i.group || "errors"))];
    const trIssues = mkTr(
      [
        urlA(p),
        sbadge(p.statusCode),
        gs.map(groupLabel).join(", "),
        `<div class="itags">${seoIss.map((i) => `<span class="itag ${gclass(i.group)}">${issueLabel(i)}</span>`).join("")}</div>`,
        esc(trunc(p.title || "—", 34)),
      ],
      gs,
    );
    document
      .getElementById("tbIssues")
      .appendChild(attachSeoRowBehavior(trIssues, p));
  }

  //  TITLES tab
  const tIss = iss.filter((i) => i.group === "titles");
  if (tIss.length) {
    const trTitles = mkTr(
      [
        urlA(p),
        sbadge(p.statusCode),
        `<span style="max-width:190px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(p.title)}">${esc(trunc(p.title || "—", 44))}</span>`,
        `<span class="${lcls(tLen, 30, 60)}">${tLen}</span>`,
        `<div class="itags">${tIss.map((i) => `<span class="itag gt">${issueLabel(i)}</span>`).join("")}</div>`,
      ],
      tIss.map((i) => i.type),
    );
    document
      .getElementById("tbTitles")
      .appendChild(attachSeoRowBehavior(trTitles, p));
  }

  //  DESC tab
  const dIss = iss.filter((i) => i.group === "desc");
  if (dIss.length) {
    const trDesc = mkTr(
      [
        urlA(p),
        sbadge(p.statusCode),
        `<span style="max-width:230px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(p.description)}">${esc(trunc(p.description || "—", 48))}</span>`,
        `<span class="${lcls(dLen, 70, 160)}">${dLen || 0}</span>`,
        `<div class="itags">${dIss.map((i) => `<span class="itag gd">${issueLabel(i)}</span>`).join("")}</div>`,
      ],
      dIss.map((i) => i.type),
    );
    document
      .getElementById("tbDesc")
      .appendChild(attachSeoRowBehavior(trDesc, p));
  }

  //  H1 tab
  const hIss = iss.filter((i) => i.group === "h1");
  const allH1Types = [...hIss.map((i) => i.type)];
  if ((p.headingSkips || []).length) allH1Types.push("heading_skip");
  if (hIss.length || (p.headingSkips || []).length) {
    const h1cnt = (p.h1s || []).length;
    const skipTags = (p.headingSkips || [])
      .map(
        (s) =>
          `<span class="itag ge">${T("headingSkip")} ${s.from}->${s.to}</span>`,
      )
      .join("");
    const trH1 = mkTr(
      [
        urlA(p),
        sbadge(p.statusCode),
        esc(trunc((p.h1s || [])[0] || "—", 40)),
        `<span style="font-weight:700;color:${h1cnt === 0 ? "var(--error)" : h1cnt > 1 ? "var(--warn)" : "var(--ok)"};">${h1cnt}</span>`,
        `<div class="itags">${hIss.map((i) => `<span class="itag gh">${issueLabel(i)}</span>`).join("")}${skipTags}</div>`,
      ],
      [...new Set(allH1Types)],
    );
    document.getElementById("tbH1").appendChild(attachSeoRowBehavior(trH1, p));
  }

  //  IMAGES tab
  if (p.imgsNoAlt > 0 || (p.imgsNoSize || 0) > 0 || (p.brokenImageLinks || []).length > 0) {
    const tot = p.totalImgs || p.imgsNoAlt || p.imgsNoSize || 0;
    const pct = tot ? Math.round((p.imgsNoAlt / tot) * 100) : 0;
    const imgsNoSize = p.imgsNoSize || 0;
    const brokenImgs = (p.brokenImageLinks || []).length;
    const imgTypes = [];
    if (p.imgsNoAlt > 0) imgTypes.push("imgs_no_alt");
    if (imgsNoSize > 0) imgTypes.push("imgs_no_size");
    if (brokenImgs > 0) imgTypes.push("broken_image");
    const trImages = mkTr(
      [
        urlA(p),
        sbadge(p.statusCode),
        tot,
        `<span style="color:var(--warn);font-weight:700;">${p.imgsNoAlt}</span>`,
        `<span style="color:${imgsNoSize > 0 ? "var(--warn)" : "var(--muted)"};font-weight:700;">${imgsNoSize}</span>`,
        brokenImgs > 0
          ? `<span style="color:var(--error);font-weight:700;">${brokenImgs}</span>`
          : `<span style="color:var(--muted);">0</span>`,
        `<span style="color:var(--warn);font-weight:700;">${pct}%</span>`,
      ],
      imgTypes,
    );
    document
      .getElementById("tbImages")
      .appendChild(attachSeoRowBehavior(trImages, p));
  }

  //  ERRORS tab
  const eIss = iss.filter((i) => i.group === "errors");
  if (eIss.length || p.statusCode === 404 || hasRR) {
    const eTypes = [
      ...new Set([
        ...(p.statusCode === 404 ? ["404"] : []),
        ...(hasRR ? ["redirect"] : []),
        ...(p.blocked ? ["blocked"] : []),
        ...eIss.map((i) => i.type),
      ]),
    ];
    const trErrors = mkTr(
      [
        urlA(p),
        sbadge(p.statusCode),
        hasRR
          ? `<span style="color:var(--orange);font-size:10px;">${esc(trunc(p.redirectTo, 40))}</span>`
          : "",
        p.blocked ? `<span class="badge bb">${T("blocked")}</span>` : "",
        `<div class="itags">${eIss.map((i) => `<span class="itag ge">${issueLabel(i)}</span>`).join("")}</div>` ||
          "",
      ],
      eTypes,
    );
    document
      .getElementById("tbErrors")
      .appendChild(attachSeoRowBehavior(trErrors, p));
  }

  const funcTypes = [];
  if ((p.buttonsNoLink || 0) > 0) funcTypes.push("button_no_link");
  if ((p.brokenButtonLinks || []).length > 0) funcTypes.push("broken_button");
  if ((p.placeholderLinks || 0) > 0) funcTypes.push("placeholder_link");
  if ((p.formsNoAction || 0) > 0) funcTypes.push("form_no_action");
  if ((p.formsNoSubmit || 0) > 0) funcTypes.push("form_no_submit");
  if (p.weakNavigation) funcTypes.push("weak_navigation");
  if ((p.loadTimeMs || 0) >= 3000) funcTypes.push("slow_load");
  if (funcTypes.length) {
    const brokenPreview = (p.brokenButtonDetails || [])
      .slice(0, 3)
      .map((x) => `${esc(x.text || T("funcNoText"))} → ${esc(trunc(x.url || "", 28))}`)
      .join("<br>");
    const moreBroken =
      (p.brokenButtonDetails || []).length > 3
        ? `<br><small style="color:var(--muted);">+${(p.brokenButtonDetails || []).length - 3}</small>`
        : "";
    const loadTime = Number(p.loadTimeMs || 0);
    const loadBadge =
      loadTime > 0
        ? `<span class="badge ${loadTime >= 3000 ? "b4" : "b2"}">${loadTime}ms</span>`
        : `<span style="color:var(--muted);">—</span>`;
    const extraSignals = [];
    if ((p.placeholderLinks || 0) > 0) {
      extraSignals.push(`${T("placeholderLink")}: ${p.placeholderLinks}`);
    }
    if ((p.formsNoAction || 0) > 0) {
      extraSignals.push(`${T("formNoAction")}: ${p.formsNoAction}`);
    }
    if ((p.formsNoSubmit || 0) > 0) {
      extraSignals.push(`${T("formNoSubmit")}: ${p.formsNoSubmit}`);
    }
    if (p.weakNavigation) {
      extraSignals.push(`${T("weakNavigation")} (${Number(p.mainNavLinks || 0)})`);
    }
    const detailSignals = extraSignals.length
      ? `<div style="margin-top:4px;color:var(--muted);font-size:10px;">${extraSignals
          .map((text) => esc(text))
          .join("<br>")}</div>`
      : "";
    const trFunc = mkTr(
      [
        urlA(p),
        sbadge(p.statusCode),
        (p.buttonsNoLink || 0) > 0
          ? `<span class="badge b3">${p.buttonsNoLink}</span>`
          : `<span style="color:var(--muted);">0</span>`,
        (p.brokenButtonLinks || []).length > 0
          ? `<span class="badge b4">${(p.brokenButtonLinks || []).length}</span>`
          : `<span style="color:var(--muted);">0</span>`,
        loadBadge,
        `${brokenPreview}${moreBroken}${detailSignals}`,
      ],
      funcTypes,
    );
    document
      .getElementById("tbFunc")
      .appendChild(attachSeoRowBehavior(trFunc, p));
  }
  applyUrlSearchFilter();
  updateCrawlButtonLabel();
}

//
// DUPLICATES
//
function renderDups(dups) {
  document.getElementById("dupList").innerHTML = dups
    .map(
      (d) => `
    <div class="dup-card">
      <div class="dup-t"> ${esc(d.title)}</div>
      <div class="dup-urls">${d.urls.map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer"> ${esc(u)}</a>`).join("")}</div>
    </div>`,
    )
    .join("");
}

//
// ROBOTS
//
function renderRobots(d) {
  const smH = d.sitemapUrls?.length
    ? `<p style="font-size:10px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">${T("sitemapCount")}:</p>${d.sitemapUrls.map((u) => `<div class="ri ri-sm">${T("sitemapCount")}: ${esc(u)}</div>`).join("")}`
    : "";
  const disH = d.disallowed?.length
    ? d.disallowed
        .map((r) => `<div class="ri ri-dis">Disallow: ${esc(r)}</div>`)
        .join("")
    : `<p style="color:var(--ok);font-size:10px;margin-bottom:10px;">${T("noPaths")}</p>`;
  document.getElementById("robotsBox").innerHTML = `
    <p style="font-size:11px;color:var(--text2);margin-bottom:13px;font-weight:700;">${d.hasSitemap ? T("hasSitemap") : T("noSitemap")}</p>
    ${smH}
    <p style="font-size:10px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin:${smH ? "14px" : 0} 0 8px;">${T("disallowedTitle")}</p>
    ${disH}
    ${d.rawContent ? `<details style="margin-top:12px;"><summary style="font-size:10px;color:var(--muted);cursor:pointer;letter-spacing:2px;text-transform:uppercase;">${T("rawTitle")}</summary><div class="ri-raw">${esc(d.rawContent)}</div></details>` : ""}`;
}

let __seoCrawlerInited = false;
window.loadSeoCrawlerRun = applySavedRun;
window.initSeoCrawlerApp = function initSeoCrawlerApp() {
  if (__seoCrawlerInited) return;
  __seoCrawlerInited = true;
  currentProject = window.__SEO_CRAWLER_PROJECT__ || null;
  const input = document.getElementById("urlInput");
  if (input)
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") startCrawl();
    });
  if (input) input.addEventListener("input", updateCrawlButtonLabel);
  const searchInput = document.getElementById("crawlSearch");
  const allPageSize = document.getElementById("allPageSize");
  if (allPageSize) {
    allTablePageSize = Number(allPageSize.value || 20);
    setSelectSize(allPageSize, "sm");
  }
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      crawlSearchTerm = e.target.value || "";
      allTablePage = 1;
      applyUrlSearchFilter();
    });
  }
  const mainHeader = document.querySelector("header");
  const syncHeaderScroll = () => {
    if (!mainHeader) return;
    mainHeader.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  window.addEventListener("scroll", syncHeaderScroll, { passive: true });
  syncHeaderScroll();
  setLang(lang);
  setTheme(currentTheme);
  applyUrlSearchFilter();
  updateAllTablePagination(true);
  updateCrawlButtonLabel();

  const params = new URLSearchParams(window.location.search || "");
  const initialUrl = (params.get("url") || "").trim();
  const autostart = params.get("autostart") === "1";
  const projectUrl = currentProject?.targetUrl || "";
  const resolvedInitialUrl = initialUrl || projectUrl;
  if (input && resolvedInitialUrl) {
    input.value = resolvedInitialUrl;
    updateCrawlButtonLabel();
    if (autostart) {
      setTimeout(() => {
        startCrawl();
        const clean = new URL(window.location.href);
        clean.searchParams.delete("autostart");
        window.history.replaceState({}, "", clean.pathname + clean.search);
      }, 0);
    }
  }
};
