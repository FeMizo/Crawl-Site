const PSI_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

const BLOCKED_REASONS = {
  ERRORED_DOCUMENT: "La página devolvió un error HTTP",
  FAILED_DOCUMENT: "El documento no pudo cargarse",
  FETCH_ERROR: "No se pudo acceder a la URL (puede requerir autenticación o estar bloqueada)",
  DNS_FAILURE: "Fallo de DNS — la URL no es resoluble",
  INSECURE_DOCUMENT: "La página tiene contenido inseguro o mixto",
  UNKNOWN: "Error desconocido en el análisis de velocidad",
};

function psiErrorReason(code, message) {
  return BLOCKED_REASONS[code] || message || "Página no analizable por PageSpeed";
}

async function fetchPageSpeed(url, apiKey, strategy = "mobile") {
  const params = new URLSearchParams({ url, strategy, key: apiKey, category: "performance" });
  try {
    const res = await fetch(`${PSI_URL}?${params}`, {
      signal: AbortSignal.timeout(35000),
      headers: process.env.PAGESPEED_REFERER ? { Referer: process.env.PAGESPEED_REFERER } : {},
    });
    const json = await res.json();

    if (!res.ok) {
      const msg = json?.error?.message || `HTTP ${res.status}`;
      return { status: "error", reason: msg };
    }

    const lhr = json.lighthouseResult;
    if (lhr?.runtimeError?.code) {
      return {
        status: "blocked",
        reason: psiErrorReason(lhr.runtimeError.code, lhr.runtimeError.message),
      };
    }

    const score = Math.round((lhr?.categories?.performance?.score ?? 0) * 100);
    const audits = lhr?.audits || {};

    return {
      status: "done",
      score,
      lcp: Math.round(audits["largest-contentful-paint"]?.numericValue ?? 0),
      fcp: Math.round(audits["first-contentful-paint"]?.numericValue ?? 0),
      tbt: Math.round(audits["total-blocking-time"]?.numericValue ?? 0),
      cls: parseFloat((audits["cumulative-layout-shift"]?.numericValue ?? 0).toFixed(3)),
      ttfb: Math.round(audits["server-response-time"]?.numericValue ?? 0),
      si: Math.round(audits["speed-index"]?.numericValue ?? 0),
    };
  } catch (err) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return { status: "error", reason: "Tiempo de espera agotado (35s)" };
    }
    return { status: "error", reason: err.message || "Error desconocido" };
  }
}

const PSI_PAGE_LIMITS = { STARTER: 200, PRO: 500, AGENCY: 1000 };

module.exports = { fetchPageSpeed, PSI_PAGE_LIMITS };
