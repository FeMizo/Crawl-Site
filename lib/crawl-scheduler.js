const SCHEDULE_FREQUENCIES = ["daily", "weekly", "monthly"];

const TRACKED_METRICS = [
  { key: "404", label: "errores 404", severity: "critical" },
  { key: "noindex", label: "paginas noindex", severity: "critical" },
  { key: "titleIssues", label: "errores de titulo", severity: "critical" },
  { key: "descIssues", label: "errores de meta description", severity: "critical" },
  { key: "h1Issues", label: "errores de H1", severity: "critical" },
  { key: "duplicates", label: "duplicados", severity: "warning" },
  { key: "slowLoad", label: "paginas lentas", severity: "warning" },
  { key: "brokenButtons", label: "botones rotos", severity: "warning" },
  { key: "formsNoAction", label: "forms sin action", severity: "warning" },
  { key: "formsNoSubmit", label: "forms sin submit", severity: "warning" },
  { key: "renderBlockingJs", label: "JS bloqueante", severity: "warning" },
  { key: "renderBlockingCss", label: "CSS bloqueante", severity: "warning" },
  { key: "noOg", label: "Open Graph faltante", severity: "warning" },
  { key: "noTwitterCard", label: "Twitter Card faltante", severity: "warning" },
  { key: "noStructuredData", label: "datos estructurados faltantes", severity: "warning" },
  { key: "orphanPages", label: "paginas huerfanas", severity: "warning" },
];

function normalizeScheduleFrequency(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return SCHEDULE_FREQUENCIES.includes(normalized) ? normalized : "weekly";
}

function computeNextScheduleRunAt(frequency, fromDate = new Date()) {
  const baseDate = fromDate instanceof Date ? new Date(fromDate.getTime()) : new Date(fromDate);
  const normalizedFrequency = normalizeScheduleFrequency(frequency);

  if (normalizedFrequency === "daily") {
    baseDate.setDate(baseDate.getDate() + 1);
  } else if (normalizedFrequency === "monthly") {
    baseDate.setMonth(baseDate.getMonth() + 1);
  } else {
    baseDate.setDate(baseDate.getDate() + 7);
  }

  baseDate.setHours(3, 0, 0, 0);
  return baseDate;
}

function normalizeStats(stats) {
  return stats && typeof stats === "object" ? stats : {};
}

function formatDeltaValue(current, previous) {
  const delta = current - previous;
  const sign = delta > 0 ? "+" : "";
  return `${previous} -> ${current} (${sign}${delta})`;
}

function buildCrawlAlertDigests({
  projectName,
  currentRunId,
  previousRunId,
  currentStats,
  previousStats,
  currentWithIssues = 0,
  previousWithIssues = 0,
}) {
  if (!previousRunId) {
    return [];
  }

  const current = normalizeStats(currentStats);
  const previous = normalizeStats(previousStats);
  const deltas = TRACKED_METRICS
    .map((metric) => {
      const currentValue = Number(current[metric.key] ?? 0);
      const previousValue = Number(previous[metric.key] ?? 0);
      return {
        key: metric.key,
        label: metric.label,
        severity: metric.severity,
        current: currentValue,
        previous: previousValue,
        delta: currentValue - previousValue,
      };
    })
    .filter((item) => item.delta > 0);

  const alerts = [];
  const critical = deltas.filter((item) => item.severity === "critical");
  const warning = deltas.filter((item) => item.severity === "warning");
  const overallRegression = currentWithIssues > previousWithIssues;

  const buildMessage = (items) => {
    const details = items.slice(0, 4).map((item) => `${item.label}: ${formatDeltaValue(item.current, item.previous)}`);
    if (overallRegression) {
      details.unshift(`problemas totales: ${formatDeltaValue(currentWithIssues, previousWithIssues)}`);
    }
    return details.join("; ");
  };

  if (!critical.length && !warning.length && overallRegression) {
    alerts.push({
      type: "crawl_regression_warning",
      severity: "warning",
      title: `Cambios SEO relevantes en ${projectName}`,
      message: `problemas totales: ${formatDeltaValue(currentWithIssues, previousWithIssues)}`,
      payload: {
        runId: currentRunId,
        previousRunId,
        deltas: [],
      },
    });
    return alerts;
  }

  if (critical.length) {
    alerts.push({
      type: "crawl_regression_critical",
      severity: "critical",
      title: `Regresiones criticas en ${projectName}`,
      message: buildMessage(critical),
      payload: {
        runId: currentRunId,
        previousRunId,
        deltas: critical,
      },
    });
  }

  if (warning.length) {
    alerts.push({
      type: "crawl_regression_warning",
      severity: "warning",
      title: `Cambios SEO relevantes en ${projectName}`,
      message: buildMessage(warning),
      payload: {
        runId: currentRunId,
        previousRunId,
        deltas: warning,
      },
    });
  }

  return alerts;
}

function summarizeAlertDigest(alerts) {
  return alerts
    .map((alert) => `${alert.title}: ${alert.message}`)
    .join("\n\n");
}

module.exports = {
  SCHEDULE_FREQUENCIES,
  TRACKED_METRICS,
  buildCrawlAlertDigests,
  computeNextScheduleRunAt,
  normalizeScheduleFrequency,
  summarizeAlertDigest,
};
