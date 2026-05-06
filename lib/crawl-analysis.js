const STOP_WORDS = new Set([
  "el","la","los","las","un","una","unos","unas","y","o","a","de","del","en","con","por","para",
  "que","se","es","su","sus","lo","le","les","al","me","te","nos","si","no","mas","pero","como",
  "todo","esto","esta","estos","estas","ese","esa","esos","esas","ser","han","hay","fue","sobre",
  "bajo","ante","sin","entre","hasta","desde","cuando","donde","quien","cual","ya","bien","muy",
  "tan","tambien","aunque","asi","aun","puede","tiene","tienen","hacer","cada","otro","otra",
  "nuestro","nuestra","tu","mi","aqui","alli","ahora","antes","despues","siempre","nunca",
  "solo","ademas","hacia","durante","mediante","todos","todas","son","ha",
  "the","a","an","and","or","in","on","at","to","for","of","is","it","with","by","from",
  "that","this","was","are","be","has","have","had","not","but","as","we","you","he","she",
  "they","do","did","will","would","can","could","should","may","might","must","then","than",
  "more","also","if","so","just","about","get","all","been","when","where","who","which",
  "what","how","some","any","its","our","your","their","his","her","them","into","up","out",
  "him","there","here","now","only","new","other","use","used","each","i","am",
]);

function normalizeStringList(values) {
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

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripTags(value) {
  return decodeHtml(String(value || "").replace(/<[^>]+>/g, " "));
}

function getAttr(tag, attr) {
  const match = String(tag || "").match(new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, "i"));
  return match ? match[1] : "";
}

function getMetaTags(body) {
  return [...String(body || "").matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
}

function getLinkTags(body) {
  return [...String(body || "").matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
}

function getTitleText(body) {
  const match = String(body || "").match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? stripTags(match[1]) : "";
}

function getBodyWithoutNoise(body) {
  let output = String(body || "");
  const noisyTags = [
    "script",
    "style",
    "noscript",
    "svg",
    "canvas",
    "iframe",
    "form",
    "nav",
    "header",
    "footer",
    "aside",
    "button",
    "select",
    "textarea",
  ];
  for (const tag of noisyTags) {
    output = output.replace(new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, "gi"), " ");
  }
  return output;
}

function extractMetaKeywords(body) {
  const metaTags = getMetaTags(body);
  const keywords = [];
  for (const tag of metaTags) {
    const name = getAttr(tag, "name").toLowerCase();
    const property = getAttr(tag, "property").toLowerCase();
    const content = cleanText(getAttr(tag, "content"));
    if (!content) continue;
    if (name === "keywords" || name === "news_keywords" || name === "parsely-tags") {
      keywords.push(...content.split(/[,;|]/g));
      continue;
    }
    if (property === "article:tag") {
      keywords.push(content);
    }
  }
  return normalizeStringList(keywords);
}

function extractLinkedCanonical(body, pageUrl) {
  const linkTags = getLinkTags(body);
  for (const tag of linkTags) {
    const rel = getAttr(tag, "rel").toLowerCase();
    const href = getAttr(tag, "href");
    if (!href) continue;
    if (!/\bcanonical\b/i.test(rel)) continue;
    try {
      const normalized = new URL(href, pageUrl).href;
      return normalized.replace(/\/+$/, "").toLowerCase();
    } catch {}
  }
  return "";
}

function parseHeadings(body) {
  const headingMatches = [...String(body || "").matchAll(/<(h[1-6])[^>]*>([\s\S]*?)<\/h[1-6]>/gi)];
  const headings = headingMatches
    .map((m) => ({
      level: parseInt(m[1][1], 10),
      text: stripTags(m[2]).slice(0, 120).trim(),
    }))
    .filter((h) => h.text);

  const h1s = headings.filter((h) => h.level === 1).map((h) => h.text);
  const headingSkips = [];
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1].level;
    const curr = headings[i].level;
    if (curr > prev + 1) {
      headingSkips.push({
        from: `H${prev}`,
        to: `H${curr}`,
        text: headings[i].text,
      });
    }
  }

  return { headings, h1s, headingSkips };
}

function extractImageData(body, pageUrl) {
  const imgMatches = [...String(body || "").matchAll(/<img[^>]+>/gi)];
  const imgsNoAlt = imgMatches.filter((m) => !/alt\s*=\s*["'][^"']+["']/i.test(m[0])).length;
  const imgsNoSize = imgMatches.filter((m) => {
    const tag = m[0];
    const hasWidth = /\bwidth\s*=\s*(?:"[^"]+"|'[^']+'|[^\s"'=<>`]+)/i.test(tag);
    const hasHeight = /\bheight\s*=\s*(?:"[^"]+"|'[^']+'|[^\s"'=<>`]+)/i.test(tag);
    return !hasWidth || !hasHeight;
  }).length;
  const totalImgs = imgMatches.length;
  const imageUrls = imgMatches
    .map((m) => {
      const srcMatch = m[0].match(/\bsrc=["']([^"']+)["']/i);
      const src = cleanText(srcMatch?.[1] || "");
      if (!src || src.startsWith("data:") || src.startsWith("blob:")) return null;
      try {
        return new URL(src, pageUrl).href;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  return { imgsNoAlt, imgsNoSize, totalImgs, imageUrls: normalizeStringList(imageUrls) };
}

function extractLinkData(body, pageUrl) {
  const linkMatches = [...String(body || "").matchAll(/href=["']([^"'#][^"']*?)["']/gi)];
  const allLinks = linkMatches
    .map((m) => {
      try {
        return new URL(m[1], pageUrl).href;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  return normalizeStringList(allLinks);
}

function extractButtonsAndForms(body, pageUrl) {
  const buttonLikeItems = [];
  let buttonsNoLink = 0;
  const buttonsNoLinkDetails = [];

  const anchorTags = [...String(body || "").matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)];
  for (const m of anchorTags) {
    const attrs = m[1] || "";
    const inner = m[2] || "";
    const anchorText = stripTags(inner).replace(/\s+/g, " ").trim();
    const isButtonLike =
      /role=["']button["']/i.test(attrs) ||
      /\b(class|id)=["'][^"']*(btn|button|cta)[^"']*["']/i.test(attrs);
    if (!isButtonLike) continue;

    const hrefMatch = attrs.match(/\bhref=["']([^"']*)["']/i);
    const href = cleanText(hrefMatch?.[1] || "");
    if (
      !href ||
      href === "#" ||
      href.toLowerCase().startsWith("javascript:") ||
      href.toLowerCase().startsWith("mailto:") ||
      href.toLowerCase().startsWith("tel:")
    ) {
      buttonsNoLink++;
      buttonsNoLinkDetails.push({
        text: anchorText || "(sin texto)",
        source: "a.btn-like",
        href: href || "(vacio)",
      });
      continue;
    }
    try {
      const abs = new URL(href, pageUrl).href;
      buttonLikeItems.push({
        url: abs,
        text: anchorText || "(sin texto)",
        source: "a.btn-like",
      });
    } catch {}
  }

  const buttonTags = [...String(body || "").matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)];
  for (const m of buttonTags) {
    const attrs = m[1] || "";
    const inner = m[2] || "";
    const hasOnClick = /\bonclick\s*=/i.test(attrs);
    const typeMatch = attrs.match(/\btype=["']([^"']+)["']/i);
    const btnType = (typeMatch?.[1] || "submit").toLowerCase();
    if (!hasOnClick && btnType === "button") {
      const buttonText = stripTags(inner).replace(/\s+/g, " ").trim();
      buttonsNoLink++;
      buttonsNoLinkDetails.push({
        text: buttonText || "(sin texto)",
        source: `button[type=${btnType}]`,
        href: "(sin link)",
      });
    }
  }

  let placeholderLinks = 0;
  const placeholderLinkDetails = [];
  for (const m of anchorTags) {
    const attrs = m[1] || "";
    const inner = m[2] || "";
    const hrefMatch = attrs.match(/\bhref=["']([^"']*)["']/i);
    const href = cleanText(hrefMatch?.[1] || "").toLowerCase();
    const hasOnClick = /\bonclick\s*=/i.test(attrs);
    const isPlaceholder = href === "#" || href === "" || href.startsWith("javascript:") || href.startsWith("void(");
    if (!isPlaceholder) continue;
    placeholderLinks++;
    placeholderLinkDetails.push({
      text: stripTags(inner).replace(/\s+/g, " ").trim() || "(sin texto)",
      source: hasOnClick ? "a[onclick]" : "a[href=#]",
      href: href || "#",
    });
  }

  const forms = [...String(body || "").matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)];
  let formsNoAction = 0;
  const formsNoActionDetails = [];
  let formsNoSubmit = 0;
  const formsNoSubmitDetails = [];

  for (const [idx, formMatch] of forms.entries()) {
    const attrs = formMatch[1] || "";
    const inner = formMatch[2] || "";
    const actionMatch = attrs.match(/\baction=["']([^"']*)["']/i);
    const action = cleanText(actionMatch?.[1] || "");
    const hasAction = action && action !== "#" && !action.toLowerCase().startsWith("javascript:");
    if (!hasAction) {
      formsNoAction++;
      formsNoActionDetails.push({
        source: `form#${idx + 1}`,
        action: action || "(sin action)",
      });
    }

    const hasSubmitControl =
      /<button\b[^>]*type=["']submit["'][^>]*>/i.test(inner) ||
      /<button\b(?![^>]*type=)[^>]*>/i.test(inner) ||
      /<input\b[^>]*type=["']submit["'][^>]*>/i.test(inner);
    if (!hasSubmitControl) {
      formsNoSubmit++;
      formsNoSubmitDetails.push({
        source: `form#${idx + 1}`,
      });
    }
  }

  const navBlocks = [...String(body || "").matchAll(/<nav\b[^>]*>([\s\S]*?)<\/nav>/gi)];
  const navLinkCounts = navBlocks.map((m) => {
    const links = [...m[1].matchAll(/<a\b[^>]*href=["'][^"']+["'][^>]*>/gi)];
    return links.length;
  });
  const mainNavLinks = navLinkCounts.length ? Math.max(...navLinkCounts) : 0;
  const weakNavigation = mainNavLinks > 0 && mainNavLinks < 3;

  return {
    buttonLikeItems,
    buttonsNoLink,
    buttonsNoLinkDetails,
    placeholderLinks,
    placeholderLinkDetails,
    formsNoAction,
    formsNoActionDetails,
    formsNoSubmit,
    formsNoSubmitDetails,
    mainNavLinks,
    weakNavigation,
  };
}

function detectGoogleTools(body) {
  const text = String(body || "");
  const lower = text.toLowerCase();

  const gtmIds = normalizeStringList([
    ...text.matchAll(/\bGTM-[A-Z0-9]{4,}\b/gi),
    ...text.matchAll(/[?&]id=(GTM-[A-Z0-9]{4,})/gi),
  ].flatMap((m) => (Array.isArray(m) ? [m[1] || m[0]] : [m])));

  const ga4Ids = normalizeStringList([
    ...text.matchAll(/\bG-[A-Z0-9]{4,}\b/gi),
    ...text.matchAll(/gtag\(\s*['"]config['"]\s*,\s*['"](G-[A-Z0-9]{4,})['"]/gi),
    ...text.matchAll(/[?&]id=(G-[A-Z0-9]{4,})/gi),
    ...text.matchAll(/measurement[_-]?id["']?\s*[:=]\s*["'](G-[A-Z0-9]{4,})["']/gi),
  ].flatMap((m) => (Array.isArray(m) ? [m[1] || m[0]] : [m])));

  const hasGtmScript = /googletagmanager\.com\/gtm\.js/i.test(text);
  const hasGtagScript = /googletagmanager\.com\/gtag\/js/i.test(text);
  const hasDataLayer = /\bdataLayer\b/i.test(text);
  const hasGtagCall = /\bgtag\s*\(\s*['"]config['"]/i.test(text) || /\bgtag\s*\(/i.test(text);

  const hasGTM = hasGtmScript || hasDataLayer || gtmIds.length > 0;
  const hasGA4 = hasGtagScript || hasGtagCall || ga4Ids.length > 0;

  return {
    hasGTM,
    hasGA4,
    gtmIds,
    ga4Ids,
    signals: {
      gtmScript: hasGtmScript,
      gtagScript: hasGtagScript,
      dataLayer: hasDataLayer,
      gtagCall: hasGtagCall,
    },
  };
}

function extractMeta(body, pageUrl) {
  const title = getTitleText(body);
  const metaTags = getMetaTags(body);

  const descMatch = metaTags.find((tag) => {
    const name = getAttr(tag, "name").toLowerCase();
    return name === "description";
  });
  const robotsMatch = metaTags.find((tag) => {
    const name = getAttr(tag, "name").toLowerCase();
    return name === "robots";
  });
  const descContent = cleanText(getAttr(descMatch || "", "content"));
  const robotsContent = cleanText(getAttr(robotsMatch || "", "content"));
  const canonMatch = extractLinkedCanonical(body, pageUrl);
  const langMatch = String(body || "").match(/<html[^>]+lang=["']([^"']+)["']/i);

  const { headings, h1s, headingSkips } = parseHeadings(body);
  const { imgsNoAlt, imgsNoSize, totalImgs, imageUrls } = extractImageData(body, pageUrl);
  const allLinks = extractLinkData(body, pageUrl);
  const {
    buttonLikeItems,
    buttonsNoLink,
    buttonsNoLinkDetails,
    placeholderLinks,
    placeholderLinkDetails,
    formsNoAction,
    formsNoActionDetails,
    formsNoSubmit,
    formsNoSubmitDetails,
    mainNavLinks,
    weakNavigation,
  } = extractButtonsAndForms(body, pageUrl);

  const headMatch = String(body || "").match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const headContent = headMatch ? headMatch[1] : "";
  const externalCss = [...headContent.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi)].length;
  const externalJs = [...headContent.matchAll(/<script[^>]+src=["'][^"']+["'][^>]*>/gi)].length;
  const inlineScripts = [...String(body || "").matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/gi)].length;
  const inlineStyles = [...String(body || "").matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/gi)].length;
  const renderBlockingCss = [...headContent.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi)]
    .filter((m) => !/\bmedia=["']print["']/i.test(m[0])).length;
  const renderBlockingJs = [...headContent.matchAll(/<script[^>]+src=["'][^"']+["'][^>]*>/gi)]
    .filter((m) => !/\b(async|defer)\b/i.test(m[0])).length;

  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(body);
  const hasCharset = /<meta[^>]+charset=/i.test(body) || /<meta[^>]+http-equiv=["']content-type["']/i.test(body);

  const ogTitle = (metaTags.find((tag) => getAttr(tag, "property").toLowerCase() === "og:title" && getAttr(tag, "content")) ? getAttr(metaTags.find((tag) => getAttr(tag, "property").toLowerCase() === "og:title"), "content") : "");
  const ogDesc = (metaTags.find((tag) => getAttr(tag, "property").toLowerCase() === "og:description" && getAttr(tag, "content")) ? getAttr(metaTags.find((tag) => getAttr(tag, "property").toLowerCase() === "og:description"), "content") : "");
  const ogImage = (metaTags.find((tag) => getAttr(tag, "property").toLowerCase() === "og:image" && getAttr(tag, "content")) ? getAttr(metaTags.find((tag) => getAttr(tag, "property").toLowerCase() === "og:image"), "content") : "");
  const ogType = (metaTags.find((tag) => getAttr(tag, "property").toLowerCase() === "og:type" && getAttr(tag, "content")) ? getAttr(metaTags.find((tag) => getAttr(tag, "property").toLowerCase() === "og:type"), "content") : "");
  const hasOg = !!(ogTitle || ogDesc || ogImage);

  const twitterCard = (metaTags.find((tag) => getAttr(tag, "name").toLowerCase() === "twitter:card" && getAttr(tag, "content")) ? getAttr(metaTags.find((tag) => getAttr(tag, "name").toLowerCase() === "twitter:card"), "content") : "");
  const hasTwitterCard = !!twitterCard;

  const jsonLdBlocks = [...String(body || "").matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const structuredDataTypes = [];
  for (const m of jsonLdBlocks) {
    try {
      const parsed = JSON.parse(m[1]);
      const t = parsed["@type"];
      if (t) structuredDataTypes.push(Array.isArray(t) ? t[0] : t);
    } catch {}
  }
  const hasStructuredData = jsonLdBlocks.length > 0;

  const hreflangMatches = [...String(body || "").matchAll(/<link[^>]+hreflang=["']([^"']+)["'][^>]*href=["']([^"']*)["']/gi)];
  const hreflangs = hreflangMatches.map((m) => ({ lang: m[1], url: m[2] }));
  const preloadCount = [...String(body || "").matchAll(/<link[^>]+rel=["']preload["']/gi)].length;
  const prefetchCount = [...String(body || "").matchAll(/<link[^>]+rel=["']prefetch["']/gi)].length;
  const preconnectCount = [...String(body || "").matchAll(/<link[^>]+rel=["']preconnect["']/gi)].length;
  const dnsPrefetchCount = [...String(body || "").matchAll(/<link[^>]+rel=["']dns-prefetch["']/gi)].length;

  const visibleText = stripTags(getBodyWithoutNoise(body)).replace(/\s+/g, " ").trim();
  const wordCount = visibleText ? visibleText.split(/\s+/).length : 0;
  const googleTools = detectGoogleTools(body);

  const hasJsSpaMarker =
    String(body || "").includes('id="__next"') ||
    String(body || "").includes("id='__next'") ||
    String(body || "").includes('id="__nuxt"') ||
    String(body || "").includes("id='__nuxt'") ||
    /\bng-version\s*=/i.test(body) ||
    /<app-root[\s>]/i.test(body) ||
    (String(body || "").includes("data-reactroot") && h1s.length === 0) ||
    ((String(body || "").includes('id="root"') || String(body || "").includes("id='root'")) &&
      String(body || "").includes("__webpack") &&
      h1s.length === 0);
  const isJsRendered = hasJsSpaMarker && h1s.length === 0 && wordCount < 100;

  const internalLinks = allLinks.filter((l) => {
    try {
      return new URL(l).origin === new URL(pageUrl).origin;
    } catch {
      return false;
    }
  });

  return {
    title,
    description: descContent,
    descExists: descMatch !== undefined,
    noindex: robotsContent.toLowerCase().includes("noindex"),
    canonical: canonMatch,
    h1s,
    headings,
    headingSkips,
    metaKeywords: extractMetaKeywords(body),
    imgsNoAlt,
    imgsNoSize,
    totalImgs,
    imageUrls,
    allLinks,
    buttonLikeItems,
    buttonsNoLink,
    buttonsNoLinkDetails,
    placeholderLinks,
    placeholderLinkDetails,
    formsNoAction,
    formsNoActionDetails,
    formsNoSubmit,
    formsNoSubmitDetails,
    mainNavLinks,
    weakNavigation,
    pageLang: langMatch ? langMatch[1] : "",
    titleLen: title.length,
    descLen: descContent.length,
    resources: {
      externalCss,
      externalJs,
      inlineScripts,
      inlineStyles,
      renderBlockingCss,
      renderBlockingJs,
    },
    htmlSizeBytes: Buffer.byteLength(String(body || ""), "utf8"),
    hasViewport,
    hasCharset,
    og: { title: ogTitle, description: ogDesc, image: ogImage, type: ogType, hasOg },
    twitter: { card: twitterCard, hasTwitterCard },
    structuredData: { types: structuredDataTypes, hasStructuredData, count: jsonLdBlocks.length },
    hreflangs,
    resourceHints: {
      preload: preloadCount,
      prefetch: prefetchCount,
      preconnect: preconnectCount,
      dnsPrefetch: dnsPrefetchCount,
    },
    wordCount,
    isJsRendered,
    internalLinks,
    googleTools,
    hasFavicon: /<link[^>]+rel=["'](?:shortcut icon|icon|apple-touch-icon)["'][^>]*>/i.test(body),
  };
}

function extractKeywords(body, meta, maxCount) {
  if (!body || !maxCount || maxCount <= 0) return [];

  const metaKeywords = normalizeStringList(
    meta?.metaKeywords || meta?.keywords || [],
  );
  if (metaKeywords.length) return metaKeywords.slice(0, maxCount);

  const visibleText = getBodyWithoutNoise(body)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();

  const counts = new Map();
  const scoreWord = (word, weight) => {
    const clean = String(word || "").trim().toLowerCase();
    if (!clean || clean.length <= 2 || STOP_WORDS.has(clean) || /^\d+$/.test(clean)) return;
    counts.set(clean, (counts.get(clean) || 0) + weight);
  };

  const addWords = (text, weight) => {
    String(text || "")
      .toLowerCase()
      .split(/[^a-zà-ü0-9]+/i)
      .forEach((word) => scoreWord(word, weight));
  };

  const title = cleanText(meta?.title || "");
  const description = cleanText(meta?.description || "");
  const h1s = Array.isArray(meta?.h1s) ? meta.h1s : [];
  const headingTexts = Array.isArray(meta?.headings) ? meta.headings.map((h) => h.text || "").join(" ") : "";
  const urlTokens = (() => {
    try {
      const segments = new URL(meta?.pageUrl || meta?.url || "").pathname
        .split("/")
        .filter(Boolean)
        .join(" ");
      return segments.replace(/[-_]+/g, " ").replace(/\.\w+$/, "");
    } catch {
      return "";
    }
  })();

  addWords(visibleText, 1);
  addWords(title, 8);
  addWords(h1s.join(" "), 7);
  addWords(description, 5);
  addWords(headingTexts, 3);
  addWords(urlTokens, 2);

  const titleWords = new Set(title.toLowerCase().split(/[^a-zà-ü0-9]+/i).filter(Boolean));
  const h1Words = new Set(h1s.join(" ").toLowerCase().split(/[^a-zà-ü0-9]+/i).filter(Boolean));
  const descWords = new Set(description.toLowerCase().split(/[^a-zà-ü0-9]+/i).filter(Boolean));

  const candidates = [...counts.entries()]
    .filter(([word, score]) => {
      const visibleCount = (visibleText.match(new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g")) || []).length;
      const structuralHit = titleWords.has(word) || h1Words.has(word) || descWords.has(word);
      return score >= 8 || (structuralHit && score >= 4) || (visibleCount >= 3 && score >= 5);
    })
    .sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)
    .slice(0, maxCount)
    .map(([word]) => word);

  return normalizeStringList(candidates);
}

function buildPageIssues(page, crawlLang = "es") {
  const issues = [];
  const m = page?.meta || {};
  const T = (es, en) => (crawlLang === "en" ? en : es);

  if (page.timeout)
    issues.push({ type: "timeout", label: T("Timeout", "Timeout"), group: "errors" });
  if (page.error)
    issues.push({ type: "error", label: T(`Error: ${page.error}`, `Error: ${page.error}`), group: "errors" });
  if (page.blocked)
    issues.push({ type: "blocked", label: T("Bloqueada por robots.txt", "Blocked by robots.txt"), group: "errors" });
  if (page.statusCode === 404) issues.push({ type: "404", label: "404 Not Found", group: "errors" });
  if (page.statusCode >= 400 && page.statusCode !== 404 && page.statusCode !== 0)
    issues.push({ type: "http_error", label: `HTTP ${page.statusCode}`, group: "errors" });
  if (page.redirectTo && !sameUrlLoose(page.redirectTo, page.url))
    issues.push({ type: "redirect", label: `Redirect  ${page.redirectTo}`, group: "errors" });

  if (page.statusCode >= 200 && page.statusCode < 300 && !m)
    issues.push(
      { type: "no_title", label: T("Sin titulo", "No title"), group: "titles" },
      { type: "no_desc", label: T("Sin meta description", "No meta description"), group: "desc" },
      { type: "no_h1", label: T("Sin H1", "No H1"), group: "h1" },
    );

  if (page.statusCode >= 200 && page.statusCode < 300 && m) {
    if (m.isJsRendered)
      issues.push({
        type: "js_rendered",
        label: T(
          "Pagina renderizada en cliente (CSR) - el rastreador HTTP puede no ver el contenido inicial.",
          "Client-side rendered page (CSR) - the HTTP crawler may not see the initial content.",
        ),
        group: "warnings",
      });

    if (!m.title)
      issues.push({ type: "no_title", label: T("Sin titulo", "No title"), group: "titles" });
    else if (m.titleLen < 30)
      issues.push({ type: "title_short", label: T(`Titulo corto (${m.titleLen} chars)`, `Short title (${m.titleLen} chars)`), group: "titles" });
    else if (m.titleLen > 60)
      issues.push({ type: "title_long", label: T(`Titulo largo (${m.titleLen} chars)`, `Long title (${m.titleLen} chars)`), group: "titles" });

    if (!m.descExists)
      issues.push({ type: "no_desc", label: T("Sin meta description", "No meta description"), group: "desc" });
    else if (!m.description)
      issues.push({ type: "no_desc", label: T("Meta description vacia", "Empty meta description"), group: "desc" });
    else if (m.descLen < 70)
      issues.push({ type: "desc_short", label: T(`Description corta (${m.descLen} chars)`, `Short description (${m.descLen} chars)`), group: "desc" });
    else if (m.descLen > 160)
      issues.push({ type: "desc_long", label: T(`Description larga (${m.descLen} chars)`, `Long description (${m.descLen} chars)`), group: "desc" });

    if (!Array.isArray(m.h1s) || m.h1s.length === 0) {
      issues.push({ type: "no_h1", label: T("Sin H1", "No H1"), group: "h1" });
    } else if (m.h1s.length > 1) {
      issues.push({
        type: "multi_h1",
        label: T(`Multiples H1 (${m.h1s.length})`, `Multiple H1 (${m.h1s.length})`),
        group: "h1",
      });
    }

    if (m.headingSkips && m.headingSkips.length > 0) {
      for (const skip of m.headingSkips) {
        issues.push({
          type: "heading_skip",
          label: T(`Salto de heading ${skip.from}${skip.to}`, `Heading skip ${skip.from}${skip.to}`),
          group: "h1",
        });
      }
    }

    if (m.imgsNoAlt > 0)
      issues.push({ type: "imgs_no_alt", label: T(`${m.imgsNoAlt} imagen(es) sin alt`, `${m.imgsNoAlt} image(s) without alt`), group: "images" });
    if (m.imgsNoSize > 0)
      issues.push({ type: "imgs_no_size", label: T(`${m.imgsNoSize} imagen(es) sin width/height`, `${m.imgsNoSize} image(s) without width/height`), group: "images" });
    if ((page.brokenImageLinks || []).length > 0)
      issues.push({ type: "broken_image", label: T(`${page.brokenImageLinks.length} imagen(es) rotas`, `${page.brokenImageLinks.length} broken image(s)`), group: "images" });

    if ((m.buttonsNoLink || 0) > 0)
      issues.push({ type: "button_no_link", label: T(`${m.buttonsNoLink} boton(es) sin link`, `${m.buttonsNoLink} button(s) without link`), group: "functionality" });
    if ((page.brokenButtonLinks || []).length > 0)
      issues.push({ type: "broken_button", label: T(`${page.brokenButtonLinks.length} boton(es) rotos`, `${page.brokenButtonLinks.length} broken button(s)`), group: "functionality" });
    if ((m.placeholderLinks || 0) > 0)
      issues.push({ type: "placeholder_link", label: T(`${m.placeholderLinks} enlace(s) placeholder`, `${m.placeholderLinks} placeholder link(s)`), group: "functionality" });
    if ((m.formsNoAction || 0) > 0)
      issues.push({ type: "form_no_action", label: T(`${m.formsNoAction} formulario(s) sin action`, `${m.formsNoAction} form(s) missing action`), group: "functionality" });
    if ((m.formsNoSubmit || 0) > 0)
      issues.push({ type: "form_no_submit", label: T(`${m.formsNoSubmit} formulario(s) sin submit`, `${m.formsNoSubmit} form(s) missing submit`), group: "functionality" });
    if (m.weakNavigation)
      issues.push({ type: "weak_navigation", label: T(`Navegacion principal limitada (${m.mainNavLinks || 0} links)`, `Weak primary navigation (${m.mainNavLinks || 0} links)`), group: "functionality" });
    if ((page.loadTimeMs || 0) >= 3000)
      issues.push({ type: "slow_load", label: T(`Carga lenta (${page.loadTimeMs} ms)`, `Slow load (${page.loadTimeMs} ms)`), group: "functionality" });

    if (m.noindex)
      issues.push({ type: "noindex", label: T("Noindex activo", "Noindex active"), group: "errors" });
    if (m.canonical && !sameUrlLoose(m.canonical, page.finalUrl || page.url))
      issues.push({ type: "canonical", label: T("Canonical apunta a otra URL", "Canonical points to different URL"), group: "errors" });
    if (!m.hasViewport)
      issues.push({ type: "no_viewport", label: T("Sin meta viewport", "No viewport meta tag"), group: "technical" });
    if (!m.hasCharset)
      issues.push({ type: "no_charset", label: T("Sin charset definido", "No charset defined"), group: "technical" });
    if (!m.og?.hasOg)
      issues.push({ type: "no_og", label: T("Sin Open Graph tags", "No Open Graph tags"), group: "social" });
    if (!m.twitter?.hasTwitterCard)
      issues.push({ type: "no_twitter_card", label: T("Sin Twitter Card", "No Twitter Card"), group: "social" });
    if (!m.structuredData?.hasStructuredData)
      issues.push({ type: "no_structured_data", label: T("Sin datos estructurados (JSON-LD)", "No structured data (JSON-LD)"), group: "technical" });
    if ((m.resources?.renderBlockingJs || 0) > 0)
      issues.push({ type: "render_blocking_js", label: T(`${m.resources.renderBlockingJs} script(s) bloquean renderizado`, `${m.resources.renderBlockingJs} render-blocking script(s)`), group: "performance" });
    if ((m.resources?.renderBlockingCss || 0) > 2)
      issues.push({ type: "render_blocking_css", label: T(`${m.resources.renderBlockingCss} CSS bloquean renderizado`, `${m.resources.renderBlockingCss} render-blocking CSS`), group: "performance" });
    if (!m.isJsRendered && (m.wordCount || 0) > 0 && m.wordCount < 300)
      issues.push({ type: "thin_content", label: T(`Contenido escaso (${m.wordCount} palabras)`, `Thin content (${m.wordCount} words)`), group: "content" });
    if ((m.htmlSizeBytes || 0) > 200000)
      issues.push({ type: "large_html", label: T(`HTML pesado (${Math.round(m.htmlSizeBytes / 1024)} KB)`, `Large HTML (${Math.round(m.htmlSizeBytes / 1024)} KB)`), group: "performance" });
    if (!m.googleTools?.hasGTM)
      issues.push({ type: "no_gtm", label: T("Sin Google Tag Manager", "No Google Tag Manager"), group: "google_tools" });
    if (!m.googleTools?.hasGA4)
      issues.push({ type: "no_ga4", label: T("Sin GA4", "No GA4"), group: "google_tools" });
    if (!m.pageLang)
      issues.push({ type: "html_no_lang", label: T("HTML sin atributo lang", "HTML missing lang attribute"), group: "technical" });
    if (!m.hasFavicon)
      issues.push({ type: "no_favicon", label: T("Sin favicon", "No favicon"), group: "technical" });
    if (m.title && m.description && m.title.toLowerCase().trim() === m.description.toLowerCase().trim())
      issues.push({ type: "title_equals_desc", label: T("Title igual a meta description", "Title equals meta description"), group: "content" });
    if ((page.url || "").length > 115)
      issues.push({ type: "url_too_long", label: T(`URL muy larga (${page.url.length} chars)`, `URL too long (${page.url.length} chars)`), group: "technical" });
    (() => {
      try {
        const segments = new URL(page.url).pathname.split("/").filter(Boolean);
        if (segments.length > 5)
          issues.push({ type: "url_deep", label: T(`URL muy profunda (${segments.length} niveles)`, `URL too deep (${segments.length} levels)`), group: "technical" });
      } catch {}
    })();
    if ((page.brokenExternalLinks || []).length > 0)
      issues.push({ type: "broken_external_link", label: T(`${page.brokenExternalLinks.length} enlace(s) externo(s) roto(s)`, `${page.brokenExternalLinks.length} broken external link(s)`), group: "functionality" });
  }

  return issues;
}

function buildKeywordGuidance(page, keywordLimit, crawlLang = "es") {
  const T = (es, en) => (crawlLang === "en" ? en : es);
  const keywords = normalizeStringList(page?.keywords);
  const hasKeywordFeature = Number(keywordLimit || 0) > 0;
  const keywordSuggestions = [];

  if (!hasKeywordFeature) {
    keywordSuggestions.push(
      T(
        "Tu plan no incluye sugerencias por keyword. Actualiza el plan para desbloquear este bloque y ver recomendaciones por pagina.",
        "Your plan does not include keyword suggestions. Upgrade to unlock this block and see per-page recommendations.",
      ),
      T(
        "Mientras tanto, prioriza title, H1, description y enlaces internos para reforzar la intencion de busqueda.",
        "Meanwhile, focus on title, H1, description, and internal links to strengthen search intent.",
      ),
    );
    return { keywords, keywordSuggestions, keywordLocked: true };
  }

  if (keywords.length > 0) {
    keywords.slice(0, 3).forEach((keyword, index) => {
      keywordSuggestions.push(
        T(
          `Integra "${keyword}" en el title, el H1 y el primer parrafo.`,
          `Include "${keyword}" in the title, H1, and first paragraph.`,
        ),
      );
      if (index === 0) {
        keywordSuggestions.push(
          T(
            `Refuerza "${keyword}" con enlaces internos y un subtitulo H2 relacionado.`,
            `Reinforce "${keyword}" with internal links and a related H2 subtitle.`,
          ),
        );
      }
    });
  } else {
    keywordSuggestions.push(
      T(
        "No se detectaron keywords claras. Ajusta el contenido para una intencion principal por URL.",
        "No clear keywords were detected. Adjust the content around one main intent per URL.",
      ),
      T(
        "Alinea title, H1 y meta description con el tema principal de la pagina.",
        "Align the title, H1, and meta description with the page's main topic.",
      ),
    );
  }

  return {
    keywords,
    keywordSuggestions: normalizeStringList(keywordSuggestions),
    keywordLocked: false,
  };
}

function sameUrlLoose(a, b) {
  try {
    const ua = new URL(a);
    const ub = new URL(b);
    ua.hash = "";
    ub.hash = "";
    if (ua.pathname.length > 1 && ua.pathname.endsWith("/")) ua.pathname = ua.pathname.slice(0, -1);
    if (ub.pathname.length > 1 && ub.pathname.endsWith("/")) ub.pathname = ub.pathname.slice(0, -1);
    return ua.toString().toLowerCase() === ub.toString().toLowerCase();
  } catch {
    return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
  }
}

function normalizeUrlKey(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    if (url.pathname.length > 1 && url.pathname.endsWith("/")) url.pathname = url.pathname.slice(0, -1);
    return url.toString().toLowerCase();
  } catch {
    return String(value || "").trim().toLowerCase().replace(/\/$/, "");
  }
}

function analyzeRobotsSnapshot({ disallowed = [], sitemapUrls = [], rawContent = "" } = {}) {
  const suggestions = [];
  const normalizedDisallowed = normalizeStringList(disallowed);
  const normalizedSitemaps = normalizeStringList(sitemapUrls);

  if (!normalizedSitemaps.length) {
    suggestions.push(
      "robots.txt no expone un sitemap. Agrega una linea Sitemap: para facilitar el rastreo.",
    );
  }

  if (normalizedDisallowed.some((item) => item === "/")) {
    suggestions.push("Disallow: / bloquea todo el sitio para los bots. Revisa la regla antes de publicarla.");
  }

  if (!String(rawContent || "").trim()) {
    suggestions.push("No se pudo leer robots.txt o el archivo esta vacio.");
  }

  return {
    hasGlobalBlock: normalizedDisallowed.some((item) => item === "/"),
    suggestions: normalizeStringList(suggestions),
  };
}

function analyzeSitemapSnapshot({ sitemapUrls = [], disallowed = [], pages = [], siteUrl = "" } = {}) {
  const normalizedSitemaps = normalizeStringList(sitemapUrls);
  const normalizedDisallowed = normalizeStringList(disallowed);
  const pageMap = new Map();
  for (const page of Array.isArray(pages) ? pages : []) {
    const key = normalizeUrlKey(page?.finalUrl || page?.url || "");
    if (!key) continue;
    pageMap.set(key, page);
  }

  const blockedUrls = [];
  const externalUrls = [];
  const noindexUrls = [];
  const baseOrigin = (() => {
    try {
      return new URL(siteUrl).origin;
    } catch {
      return "";
    }
  })();

  for (const url of normalizedSitemaps) {
    let isExternal = false;
    try {
      isExternal = !!baseOrigin && new URL(url).origin !== baseOrigin;
    } catch {}
    if (isExternal) externalUrls.push(url);

    const pathname = (() => {
      try {
        return new URL(url).pathname;
      } catch {
        return "";
      }
    })();
    if (normalizedDisallowed.some((rule) => pathname.startsWith(rule))) {
      blockedUrls.push(url);
    }

    const page = pageMap.get(normalizeUrlKey(url));
    if (page?.meta?.noindex) {
      noindexUrls.push(url);
    }
  }

  const suggestions = [];
  if (blockedUrls.length) {
    suggestions.push(
      `El sitemap incluye ${blockedUrls.length} URL(s) bloqueada(s) por robots.txt. Elimina esas rutas o libera su acceso.`,
    );
  }
  if (noindexUrls.length) {
    suggestions.push(
      `El sitemap incluye ${noindexUrls.length} URL(s) con noindex. El sitemap deberia listar solo URLs indexables.`,
    );
  }
  if (externalUrls.length) {
    suggestions.push(
      `El sitemap referencia ${externalUrls.length} URL(s) fuera del dominio principal.`,
    );
  }
  if (!normalizedSitemaps.length) {
    suggestions.push("No se detectaron URLs de sitemap para analizar.");
  }

  return {
    totalUrls: normalizedSitemaps.length,
    blockedUrls: normalizeStringList(blockedUrls),
    blockedCount: blockedUrls.length,
    externalUrls: normalizeStringList(externalUrls),
    externalCount: externalUrls.length,
    noindexUrls: normalizeStringList(noindexUrls),
    noindexCount: noindexUrls.length,
    suggestions: normalizeStringList(suggestions),
  };
}

module.exports = {
  analyzeRobotsSnapshot,
  analyzeSitemapSnapshot,
  buildKeywordGuidance,
  buildPageIssues,
  detectGoogleTools,
  extractKeywords,
  extractMeta,
  normalizeStringList,
  sameUrlLoose,
  normalizeUrlKey,
};
