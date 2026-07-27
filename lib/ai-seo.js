const OpenAI = require("openai");

const MAX_PAGES = 12;
const MAX_TEXT = 900;

const BLOG_LANGUAGES = new Set(["es", "en"]);
const BLOG_TONES = new Set(["profesional", "cercano", "tecnico", "ejecutivo", "comercial"]);
const BLOG_STYLES = new Set(["guia practica", "articulo educativo", "comparativa", "lista/checklist", "landing seo"]);
const BLOG_INTENTS = new Set(["informacional", "comercial", "transaccional", "local"]);
const BLOG_LENGTHS = new Set(["corto", "medio", "largo"]);

const LENGTH_TARGETS = {
  corto: "700-900 palabras",
  medio: "1200-1600 palabras",
  largo: "1800-2400 palabras",
};

function cleanText(value, max = 500) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function normalizeList(values, max = 8) {
  if (!Array.isArray(values)) return [];
  const seen = new Set();
  const out = [];
  for (const value of values) {
    const text = cleanText(value, 120);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length >= max) break;
  }
  return out;
}

function firstAllowed(value, allowed, fallback) {
  const normalized = cleanText(value, 80).toLowerCase();
  return allowed.has(normalized) ? normalized : fallback;
}

function splitKeywords(value) {
  if (Array.isArray(value)) return normalizeList(value, 12);
  return normalizeList(String(value || "").split(","), 12);
}

function normalizeBlogBrief(input = {}) {
  const recommendation = input.recommendation || null;
  const secondaryKeywords = splitKeywords(input.secondaryKeywords || recommendation?.secondaryKeywords || []);
  const primaryKeywords = splitKeywords(input.primaryKeywords || input.keywords || input.keyword || recommendation?.primaryKeyword || []);
  const primaryKeyword = cleanText(input.keyword || primaryKeywords[0] || recommendation?.primaryKeyword || input.title || "tema principal", 120);
  const title = cleanText(input.title || recommendation?.suggestedTitle || "", 160);
  const outline = normalizeList(input.outline || recommendation?.suggestedH2s || [], 10);
  return {
    source: cleanText(input.source || (recommendation ? "recommendation" : "custom"), 40),
    recommendationId: cleanText(input.recommendationId || recommendation?.id || "", 80),
    primaryKeyword,
    primaryKeywords: normalizeList([primaryKeyword, ...primaryKeywords], 10),
    secondaryKeywords,
    title,
    slug: cleanText(input.slug || "", 120),
    language: firstAllowed(input.language, BLOG_LANGUAGES, "es"),
    tone: firstAllowed(input.tone, BLOG_TONES, "profesional"),
    writingStyle: firstAllowed(input.writingStyle, BLOG_STYLES, "articulo educativo"),
    audience: cleanText(input.audience || "clientes potenciales", 120),
    intent: firstAllowed(input.intent || recommendation?.intent, BLOG_INTENTS, "informacional"),
    length: firstAllowed(input.length, BLOG_LENGTHS, "medio"),
    cta: cleanText(input.cta || "", 180),
    outline,
    includeFaq: input.includeFaq !== false,
    useCrawlContext: input.useCrawlContext !== false,
    useRecommendation: input.useRecommendation !== false && Boolean(recommendation || input.recommendationId),
  };
}

function estimateBlogTokens(input = {}) {
  const brief = input.brief ? normalizeBlogBrief(input.brief) : normalizeBlogBrief(input);
  const payload = JSON.stringify({
    project: input.project || {},
    brief,
    recommendations: input.recommendations || [],
  });
  const inputTokens = Math.ceil(payload.length / 4) + 450;
  const outputTokens = brief.length === "largo" ? 3200 : brief.length === "corto" ? 1400 : 2300;
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
  };
}

function buildSiteContext({ project, run, pages }) {
  const pageItems = (Array.isArray(pages) ? pages : [])
    .filter((page) => Number(page.statusCode || 0) < 400)
    .slice(0, MAX_PAGES)
    .map((page) => ({
      url: cleanText(page.finalUrl || page.url, 220),
      title: cleanText(page.title, 90),
      description: cleanText(page.description, 180),
      h1s: normalizeList(page.h1s, 3),
      headings: normalizeList((page.headings || []).map((h) => h.text), 8),
      keywords: normalizeList(page.keywords, 8),
      wordCount: Number(page.meta?.wordCount || page.wordCount || 0),
    }));

  return {
    project: {
      name: cleanText(project?.name, 120),
      targetUrl: cleanText(project?.targetUrl || run?.sourceUrl, 220),
    },
    run: {
      id: run?.id || "",
      sourceUrl: cleanText(run?.sourceUrl, 220),
      total: Number(run?.total || pageItems.length),
    },
    pages: pageItems,
  };
}

function parseJsonObject(text) {
  try {
    return JSON.parse(text);
  } catch {}
  const match = String(text || "").match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function validateRecommendation(raw, fallbackPage) {
  const pageUrl = cleanText(raw?.pageUrl || fallbackPage?.finalUrl || fallbackPage?.url, 400);
  const primaryKeyword = cleanText(raw?.primaryKeyword || fallbackPage?.keywords?.[0] || fallbackPage?.title || "seo", 120);
  return {
    pageUrl,
    primaryKeyword,
    secondaryKeywords: normalizeList(raw?.secondaryKeywords || fallbackPage?.keywords || [], 8),
    intent: cleanText(raw?.intent || "informacional", 80),
    suggestedTitle: cleanText(raw?.suggestedTitle || fallbackPage?.title || primaryKeyword, 70),
    suggestedMeta: cleanText(raw?.suggestedMeta || fallbackPage?.description || "", 170),
    suggestedH1: cleanText(raw?.suggestedH1 || fallbackPage?.h1s?.[0] || primaryKeyword, 90),
    suggestedH2s: normalizeList(raw?.suggestedH2s || [], 6),
    recommendations: normalizeList(raw?.recommendations || [], 8),
  };
}

function buildLocalRecommendations({ pages }) {
  return (Array.isArray(pages) ? pages : []).slice(0, MAX_PAGES).map((page) => {
    const keywords = normalizeList(page.keywords, 8);
    const primary = keywords[0] || cleanText(page.h1s?.[0] || page.title || "tema principal", 80);
    const brand = (() => {
      try {
        return new URL(page.finalUrl || page.url).hostname.replace(/^www\./, "");
      } catch {
        return "sitio";
      }
    })();
    return validateRecommendation({
      pageUrl: page.finalUrl || page.url,
      primaryKeyword: primary,
      secondaryKeywords: keywords.slice(1),
      intent: "informacional",
      suggestedTitle: `${primary} | ${brand}`.slice(0, 60),
      suggestedMeta: `Conoce ${primary}, sus puntos clave y recomendaciones para tomar mejores decisiones en ${brand}.`.slice(0, 160),
      suggestedH1: primary,
      suggestedH2s: [`Beneficios de ${primary}`, `Como elegir ${primary}`, `Preguntas frecuentes`],
      recommendations: [
        `Alinear title, H1 y primer parrafo con "${primary}".`,
        "Agregar enlaces internos desde paginas relacionadas.",
        "Reforzar la meta description con una promesa concreta.",
      ],
    }, page);
  });
}

async function callOpenAi(context) {
  if (!process.env.OPENAI_API_KEY) return null;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_SEO_MODEL || "gpt-4o-mini";
  const prompt = [
    "Eres un consultor SEO. Devuelve solo JSON valido.",
    "Genera recomendaciones acordes al sitio completo, no genericas.",
    "Formato: {\"recommendations\":[{\"pageUrl\":\"\",\"primaryKeyword\":\"\",\"secondaryKeywords\":[],\"intent\":\"\",\"suggestedTitle\":\"\",\"suggestedMeta\":\"\",\"suggestedH1\":\"\",\"suggestedH2s\":[],\"recommendations\":[]}]}",
    "Limites: title 60 chars, meta 160 chars, H1 natural, max 6 H2, max 8 recomendaciones.",
    JSON.stringify(context).slice(0, 12000),
  ].join("\n");
  const response = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.35,
    response_format: { type: "json_object" },
  });
  const parsed = parseJsonObject(response.choices?.[0]?.message?.content || "");
  if (!Array.isArray(parsed?.recommendations)) return null;
  return { provider: "openai", model, recommendations: parsed.recommendations };
}

async function callAnthropic(context) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const model = process.env.ANTHROPIC_SEO_MODEL || "claude-3-5-haiku-latest";
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2500,
      temperature: 0.35,
      messages: [{
        role: "user",
        content: `Devuelve solo JSON valido con recommendations para SEO:\n${JSON.stringify(context).slice(0, 12000)}`,
      }],
    }),
  });
  if (!response.ok) return null;
  const data = await response.json();
  const text = (data.content || []).map((item) => item.text || "").join("\n");
  const parsed = parseJsonObject(text);
  if (!Array.isArray(parsed?.recommendations)) return null;
  return { provider: "anthropic", model, recommendations: parsed.recommendations };
}

async function generateSeoRecommendations(input) {
  const context = buildSiteContext(input);
  let result = null;
  for (let attempt = 0; attempt < 2 && !result; attempt++) {
    try {
      result = await callOpenAi(context);
    } catch {}
  }
  if (!result) {
    try {
      result = await callAnthropic(context);
    } catch {}
  }
  const pages = input.pages || [];
  const rawItems = result?.recommendations || buildLocalRecommendations({ pages });
  const items = rawItems.slice(0, MAX_PAGES).map((item, index) => validateRecommendation(item, pages[index] || pages[0]));
  return {
    provider: result?.provider || "local",
    model: result?.model || null,
    recommendations: items,
  };
}

function buildLocalBlogDraft(input = {}) {
  const brief = normalizeBlogBrief(input.brief ? input.brief : input);
  const primary = cleanText(brief.primaryKeyword || input.keyword || input.title || "tema principal", 100);
  const siteName = cleanText(input.project?.name || "el sitio", 80);
  const blogTitle = cleanText(brief.title || input.title || `${primary}: guia practica`, 100);
  const h2s = normalizeList(brief.outline || input.outline, 5);
  const intro = brief.language === "en"
    ? `${primary} is a key topic for ${siteName}. This draft is written for ${brief.audience} with a ${brief.tone} tone and a ${brief.writingStyle} format.`
    : `${primary} es un tema clave para ${siteName}. Este borrador esta escrito para ${brief.audience} con tono ${brief.tone} y formato de ${brief.writingStyle}.`;
  const sections = (h2s.length ? h2s : [
    `Que es ${primary}`,
    `Beneficios principales`,
    `Como aplicarlo`,
    `Preguntas frecuentes`,
  ]).map((h2) => `## ${h2}\n\n${primary} debe explicarse con ejemplos claros, contexto del negocio y pasos accionables para el lector de ${siteName}.`);
  return {
    title: blogTitle,
    excerpt: `Guia practica sobre ${primary} para entender oportunidades, criterios y siguientes pasos.`,
    content: `# ${blogTitle}\n\n${intro}\n\n${sections.join("\n\n")}\n\n## Conclusion\n\nPrioriza contenido claro, util y alineado con la intencion de busqueda principal.${brief.cta ? `\n\n${brief.cta}` : ""}`,
    keywords: normalizeList([primary, ...brief.primaryKeywords, ...brief.secondaryKeywords], 10),
  };
}

async function generateBlogDraft(input) {
  const brief = normalizeBlogBrief(input?.brief ? input.brief : input);
  const primary = cleanText(brief.primaryKeyword || input?.keyword || input?.title || "tema principal", 100);
  const languageLabel = brief.language === "en" ? "English" : "espanol";
  const prompt = [
    "Devuelve solo JSON valido para un borrador de blog SEO.",
    "Formato: {\"title\":\"\",\"excerpt\":\"\",\"content\":\"markdown\",\"keywords\":[]}",
    "El contenido debe ser util, acorde al sitio y sin inventar datos duros.",
    `Idioma: ${languageLabel}.`,
    `Tono: ${brief.tone}. Estilo: ${brief.writingStyle}. Audiencia: ${brief.audience}.`,
    `Intencion SEO: ${brief.intent}. Longitud objetivo: ${LENGTH_TARGETS[brief.length] || LENGTH_TARGETS.medio}.`,
    brief.cta ? `CTA final obligatorio: ${brief.cta}.` : "CTA final opcional y natural.",
    brief.includeFaq ? "Incluye una seccion FAQ breve si aporta valor." : "No incluyas FAQ.",
    JSON.stringify({
      project: input.project,
      keyword: primary,
      primaryKeywords: brief.primaryKeywords,
      secondaryKeywords: brief.secondaryKeywords,
      title: brief.title || input.title,
      outline: brief.outline || [],
      useCrawlContext: brief.useCrawlContext,
      recommendations: input.recommendations || [],
    }).slice(0, 6000),
  ].join("\n");

  if (process.env.OPENAI_API_KEY) {
    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const model = process.env.OPENAI_BLOG_MODEL || process.env.OPENAI_SEO_MODEL || "gpt-4o-mini";
      const response = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.55,
        response_format: { type: "json_object" },
      });
      const parsed = parseJsonObject(response.choices?.[0]?.message?.content || "");
      if (parsed?.title && parsed?.content) {
        return {
          title: cleanText(parsed.title, 120),
          excerpt: cleanText(parsed.excerpt, 220),
          content: String(parsed.content || "").slice(0, 25000),
          keywords: normalizeList(parsed.keywords || [primary], 10),
        };
      }
    } catch {}
  }

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_BLOG_MODEL || process.env.ANTHROPIC_SEO_MODEL || "claude-3-5-haiku-latest",
          max_tokens: 5000,
          temperature: 0.55,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = response.ok ? await response.json() : null;
      const parsed = parseJsonObject((data?.content || []).map((item) => item.text || "").join("\n"));
      if (parsed?.title && parsed?.content) {
        return {
          title: cleanText(parsed.title, 120),
          excerpt: cleanText(parsed.excerpt, 220),
          content: String(parsed.content || "").slice(0, 25000),
          keywords: normalizeList(parsed.keywords || [primary], 10),
        };
      }
    } catch {}
  }

  return buildLocalBlogDraft({ ...input, brief });
}

module.exports = { estimateBlogTokens, generateBlogDraft, generateSeoRecommendations, normalizeBlogBrief };
