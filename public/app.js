//
// I18N
//
const L = {
  es: {
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
    hosting: "Hosting y DNS",
    techStack: "Tipo de sitio",
    loadingHosting: "Cargando informacion...",
    loadingTech: "Detectando...",
    clickPageSeo: "Haz clic en una fila para ver el analisis SEO",
    functionalityIntro:
      "Detalla inlinks, botones sin link, botones rotos y tiempos de carga.",
    ip: "IP",
    ipv6: "IPv6",
    dns: "DNS provider",
    server: "Servidor",
    nameservers: "Nameservers",
    mx: "Correo (MX)",
    cms: "CMS",
    framework: "Framework",
    suggestions: "Sugerencias",
    titleQuality: "Calidad del titulo",
    descQuality: "Calidad de la descripcion",
    chars: "chars",
    queueLabel: "en cola",
    headingMore: "mostrar mas",
    headingLess: "mostrar menos",
    headingWord: "heading",
    headingWords: "headings",
    httpSecurity: "HTTP Security",
    loadingSecurity: "Analizando headers y SSL...",
    securityScore: "Score de seguridad",
    securityHeaders: "Headers de seguridad",
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
    themeDarkTitle: "Oscuro",
    themeLightTitle: "Claro",
    themeHcDarkTitle: "Alto contraste oscuro",
    themeHcLightTitle: "Alto contraste claro",
  },
  en: {
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
    filter: "Filter",
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
    hosting: "Hosting & DNS",
    techStack: "Site type",
    loadingHosting: "Loading info...",
    loadingTech: "Detecting...",
    clickPageSeo: "Click a row to see SEO analysis",
    functionalityIntro:
      "Shows inlinks, buttons without links, broken buttons, and load times per page.",
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
    securityHeaders: "Security headers",
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
    themeDarkTitle: "Dark",
    themeLightTitle: "Light",
    themeHcDarkTitle: "High contrast dark",
    themeHcLightTitle: "High contrast light",
  },
};
let lang = "es";
const T = (k) => L[lang][k] || k;
let currentTheme =
  document.documentElement.getAttribute("data-theme") || "dark";
const crawlState = { pages: [], duplicates: [], robots: null, hosting: null };

function setLang(l) {
  lang = l;
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
  document.getElementById("logoSub").textContent = T("logoSub");
  document.getElementById("urlInput").placeholder =
    l === "en" ? "https://www.your-site.com" : "https://www.tu-sitio.com";
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
}

//
// THEME
//
function setTheme(t) {
  currentTheme = t;
  document.documentElement.setAttribute("data-theme", t);
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
  if (btn) btn.classList.add("on");
  document.getElementById("tab-" + name).classList.add("on");
}

function setWorkspace(mode, btn) {
  const root = document.getElementById("mainLayout");
  if (!root) return;
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
  document.querySelectorAll(".tc").forEach((el) => (el.textContent = "0"));
  document.querySelectorAll(".sfbar").forEach((bar) => {
    bar
      .querySelectorAll(".sfbtn")
      .forEach((b, i) => b.classList.toggle("on", i === 0));
  });
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
}

//
// CRAWL
//
function startCrawl() {
  const url = document.getElementById("urlInput").value.trim();
  const max = document.getElementById("maxPg").value;
  const rate = document.getElementById("rateDelay").value;
  const ext = document.getElementById("checkExt").checked ? "1" : "0";
  if (!url) {
    document.getElementById("urlInput").focus();
    return;
  }

  resetState();
  const show = (id, d) => {
    const el = document.getElementById(id);
    if (el) el.style.display = d || "block";
  };
  show("pw");
  show("sl");
  show("cw");
  show("sg", "grid");
  show("mainLayout", "flex");
  setWorkspace("seo");

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
  });
  const es = new EventSource(`/api/crawl?${qs}`);

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
    sv(
      "stxt",
      `${T("analyzing")}... ${p.total}  ${p.queued} ${T("queueLabel")}`,
    );
    sv("vT", p.total);
  });
  es.addEventListener("done", (e) => {
    const d = JSON.parse(e.data);
    es.close();
    const s = d.stats;
    sv("vT", d.total);
    sv("vI", d.withIssues);
    sv("v4", s["404"]);
    sv("vR", s.redirects);
    sv("vTi", s.titleIssues);
    sv("vD", s.descIssues);
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
    document.getElementById("dllink").href = d.downloadUrl;
    sv(
      "dldesc",
      `${d.total}  ${d.withIssues} ${T("withIssues")}  ${d.fileName}`,
    );
    show("dlb", "flex");
    document.getElementById("pw").style.display = "none";
    document.getElementById("sl").style.display = "none";
    btn.disabled = false;
    btn.querySelector("[data-i18n]").textContent = T("startBtn");
  });
  es.addEventListener("error", () => {
    es.close();
    document.getElementById("pw").style.display = "none";
    document.getElementById("sl").style.display = "none";
    btn.disabled = false;
    btn.querySelector("[data-i18n]").textContent = T("startBtn");
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
    button_no_link: T("buttonNoLink"),
    broken_button: T("brokenButton"),
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
  return hasRR
    ? `<a href="${esc(d)}" target="_blank" rel="noopener noreferrer">${esc(trunc(d, 48))}</a><br><small style="color:var(--orange);font-size:10px;">↳${esc(trunc(p.url, 44))}</small>`
    : `<a href="${esc(d)}" target="_blank" rel="noopener noreferrer">${esc(trunc(d, 56))}</a>`;
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
  const hostname = (() => {
    try {
      return new URL(page.url || "").hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  })();
  const mainTopic =
    (page.h1s && page.h1s[0]) || page.title || hostname || "your page";
  const titleBase = String(mainTopic).trim().slice(0, 45);
  const descBase = String(page.description || mainTopic)
    .trim()
    .slice(0, 90);
  if (lang === "en") {
    return {
      title: [
        `${titleBase} | ${hostname || "Website"}`.slice(0, 60),
        `${titleBase} - Complete Guide ${new Date().getFullYear()}`.slice(
          0,
          60,
        ),
      ],
      desc: [
        `${descBase}. Discover key benefits, details, and how to get started today.`.slice(
          0,
          160,
        ),
        `Learn about ${titleBase.toLowerCase()} with practical tips and clear steps to improve results.`.slice(
          0,
          160,
        ),
      ],
    };
  }
  return {
    title: [
      `${titleBase} | ${hostname || "Website"}`.slice(0, 60),
      `${titleBase} - Guia completa ${new Date().getFullYear()}`.slice(0, 60),
    ],
    desc: [
      `${descBase}. Descubre beneficios, detalles y como empezar hoy.`.slice(
        0,
        160,
      ),
      `Conoce ${titleBase.toLowerCase()} con consejos practicos y pasos claros para mejorar resultados.`.slice(
        0,
        160,
      ),
    ],
  };
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
  const url = p.finalUrl || p.url || "";
  const loadTime = Number(p.loadTimeMs || 0);
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

  body.innerHTML = `
        <div style="font-size:12px;color:var(--muted);margin-bottom:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(url)}">${esc(trunc(url, 36))}</div>
        ${loadHtml}
        ${noLinkHtml}
        ${brokenHtml}
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

  document.getElementById("hostingBody").innerHTML = `
    ${row(T("ip"), info.ip)}
    ${info.ipv6 ? row(T("ipv6"), info.ipv6) : ""}
    ${row(T("dns"), info.dnsProvider)}
    ${row(T("server"), info.serverSoftware || info.hostingHint)}
    ${row(T("hostingLocation"), info.hostingLocation)}
    ${row(T("ipOrg"), info.ipOrganization)}
    ${info.nameservers?.length ? `<div class="host-row"><div class="host-lbl">${T("nameservers")}</div><div class="host-val" style="font-size:10px;">${info.nameservers.map((n) => esc(n)).join("<br>")}</div></div>` : ""}
    ${info.mxRecords?.length ? `<div class="host-row"><div class="host-lbl">${T("mx")}</div><div class="host-val" style="font-size:10px;">${info.mxRecords.map((n) => esc(n)).join("<br>")}</div></div>` : ""}
    ${!info.ip && !info.dnsProvider ? `<p style="font-size:10px;color:var(--muted);">${T("dnsError")}</p>` : ""}
  `;

  const cms = info.cms || null;
  const framework = info.framework || null;
  const hosting = info.hostingHint || info.serverSoftware || null;
  const custom = !cms && !framework;

  document.getElementById("techBody").innerHTML = `
    <div class="host-row"><div class="host-lbl">${T("cms")}</div><div class="host-val">${cms ? `<span class="host-badge">${esc(cms)}</span>` : `<span style="color:var(--muted);font-size:10px;">${custom ? T("customUnknown") : "—"}</span>`}</div></div>
    ${framework ? `<div class="host-row"><div class="host-lbl">${T("framework")}</div><div class="host-val"><span class="host-badge">${esc(framework)}</span></div></div>` : ""}
    ${hosting ? `<div class="host-row"><div class="host-lbl">${T("server")}</div><div class="host-val"><span class="host-badge">${esc(hosting)}</span></div></div>` : ""}
  `;

  const sec = info.security || {};
  const sScore = Number(sec.score || 0);
  const sCls = sScore >= 80 ? "good" : sScore >= 50 ? "mid" : "bad";
  const secRow = (lbl, val) =>
    `<div class="host-row"><div class="host-lbl">${lbl}</div><div class="host-val">${val ? "✅" : "—"}</div></div>`;
  const ssl = info.ssl || null;
  document.getElementById("securityBody").innerHTML = `
    <div class="security-score ${sCls}">${T("securityScore")}: ${sScore}</div>
    <div style="font-size:10px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin:2px 0 8px;">${T("securityHeaders")}</div>
    ${secRow("HSTS", sec.strictTransportSecurity)}
    ${secRow("CSP", sec.contentSecurityPolicy)}
    ${secRow("X-Frame-Options", sec.xFrameOptions)}
    ${secRow("X-Content-Type-Options", sec.xContentTypeOptions)}
    ${secRow("Referrer-Policy", sec.referrerPolicy)}
    ${secRow("Permissions-Policy", sec.permissionsPolicy)}
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
  if (p.imgsNoAlt > 0 || (p.brokenImageLinks || []).length > 0) {
    const tot = p.totalImgs || p.imgsNoAlt;
    const pct = tot ? Math.round((p.imgsNoAlt / tot) * 100) : 0;
    const brokenImgs = (p.brokenImageLinks || []).length;
    const imgTypes = [];
    if (p.imgsNoAlt > 0) imgTypes.push("imgs_no_alt");
    if (brokenImgs > 0) imgTypes.push("broken_image");
    const trImages = mkTr(
      [
        urlA(p),
        sbadge(p.statusCode),
        tot,
        `<span style="color:var(--warn);font-weight:700;">${p.imgsNoAlt}</span>`,
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
        `${brokenPreview}${moreBroken}`,
      ],
      funcTypes,
    );
    document
      .getElementById("tbFunc")
      .appendChild(attachSeoRowBehavior(trFunc, p));
  }
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
window.initSeoCrawlerApp = function initSeoCrawlerApp() {
  if (__seoCrawlerInited) return;
  __seoCrawlerInited = true;
  const input = document.getElementById("urlInput");
  if (input)
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") startCrawl();
    });
  const mainHeader = document.querySelector("header");
  const syncHeaderScroll = () => {
    if (!mainHeader) return;
    mainHeader.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  window.addEventListener("scroll", syncHeaderScroll, { passive: true });
  syncHeaderScroll();
  setLang(lang);
  setTheme(currentTheme);
};
