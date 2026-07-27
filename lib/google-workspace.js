const { google } = require("googleapis");
const { decryptSecret } = require("./secret-crypto");

const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/analytics.readonly",
  "openid",
  "email",
];

function getGoogleOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return null;
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

function buildGoogleAuthUrl(state, extraScopes = []) {
  const client = getGoogleOAuthClient();
  if (!client) return "";
  const scope = [...new Set([...GOOGLE_OAUTH_SCOPES, ...extraScopes].filter(Boolean))];
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope,
    state,
  });
}

async function exchangeGoogleCode(code) {
  const client = getGoogleOAuthClient();
  if (!client) throw new Error("Google no configurado");
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  let email = "";
  try {
    const oauth2 = google.oauth2({ auth: client, version: "v2" });
    const me = await oauth2.userinfo.get();
    email = me.data.email || "";
  } catch {}
  return {
    tokens,
    email,
    scopes: parseScopeList(tokens.scope),
  };
}

function parseScopeList(scopeValue) {
  return String(scopeValue || "")
    .split(/\s+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
}

function createGoogleClientFromConnection(connection) {
  const client = getGoogleOAuthClient();
  if (!client) throw new Error("Google no configurado");
  if (!connection?.encryptedRefreshToken) {
    throw new Error("Google no conectado");
  }
  client.setCredentials({
    access_token: connection.encryptedAccessToken ? decryptSecret(connection.encryptedAccessToken) : undefined,
    refresh_token: decryptSecret(connection.encryptedRefreshToken),
    expiry_date: connection.expiryDate ? new Date(connection.expiryDate).getTime() : undefined,
  });
  return client;
}

function normalizeSearchConsoleProperty(value) {
  return String(value || "").trim();
}

function normalizeGa4PropertyId(value) {
  const match = String(value || "").match(/(\d{4,})/);
  return match ? match[1] : "";
}

function normalizeGoogleBindingInput(input = {}) {
  return {
    searchConsoleProperty: normalizeSearchConsoleProperty(input.searchConsoleProperty),
    ga4PropertyId: normalizeGa4PropertyId(input.ga4PropertyId),
  };
}

function normalizeDateKey(value) {
  const date = value ? new Date(value) : new Date();
  return date.toISOString().slice(0, 10);
}

function formatChangePct(current, previous) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

function compareMetricSnapshots(current = {}, previous = {}, keys = []) {
  const metricKeys = keys.length ? keys : [...new Set([...Object.keys(current), ...Object.keys(previous)])];
  return metricKeys.map((key) => {
    const currentValue = Number(current[key] ?? 0);
    const previousValue = Number(previous[key] ?? 0);
    const delta = currentValue - previousValue;
    const changePct = previousValue ? formatChangePct(currentValue, previousValue) : null;
    return {
      key,
      current: currentValue,
      previous: previousValue,
      delta,
      changePct,
      direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
    };
  });
}

function pickTopRows(rows = [], limit = 10) {
  return rows.slice(0, limit).map((row) => ({ ...row }));
}

function mapSearchConsoleRows(rows = [], dimensionKey) {
  return rows.map((row) => ({
    [dimensionKey]: String(row.keys?.[0] || ""),
    clicks: Number(row.clicks || 0),
    impressions: Number(row.impressions || 0),
    ctr: Number(row.ctr || 0),
    position: Number(row.position || 0),
  }));
}

function mapGa4Rows(rows = [], dimensionKey) {
  return rows.map((row) => ({
    [dimensionKey]: String(row.dimensionValues?.[0]?.value || ""),
    sessions: Number(row.metricValues?.[0]?.value || 0),
    users: Number(row.metricValues?.[1]?.value || 0),
    conversions: Number(row.metricValues?.[2]?.value || 0),
  }));
}

async function listSearchConsoleProperties(connection) {
  const client = createGoogleClientFromConnection(connection);
  const api = google.searchconsole({ version: "v1", auth: client });
  const response = await api.sites.list();
  return (response.data.siteEntry || [])
    .map((item) => ({
      property: normalizeSearchConsoleProperty(item.siteUrl),
      permissionLevel: item.permissionLevel || "",
    }))
    .filter((item) => item.property);
}

async function listGa4Properties(connection) {
  const client = createGoogleClientFromConnection(connection);
  const api = google.analyticsadmin({ version: "v1beta", auth: client });
  const response = await api.accountSummaries.list({ pageSize: 100 });
  const summaries = response.data.accountSummaries || [];
  const properties = [];
  for (const summary of summaries) {
    for (const propertySummary of summary.propertySummaries || []) {
      const property = String(propertySummary.property || "");
      const propertyId = normalizeGa4PropertyId(property);
      if (!propertyId) continue;
      properties.push({
        propertyId,
        property,
        displayName: propertySummary.displayName || `Property ${propertyId}`,
        accountDisplayName: summary.displayName || "",
      });
    }
  }
  return properties;
}

async function fetchSearchConsoleSnapshot({ connection, property, startDate, endDate, rowLimit = 10 }) {
  const client = createGoogleClientFromConnection(connection);
  const api = google.searchconsole({ version: "v1", auth: client });
  const target = normalizeSearchConsoleProperty(property);
  const summaryResponse = await api.searchanalytics.query({
    siteUrl: target,
    requestBody: {
      startDate,
      endDate,
      dimensions: [],
      rowLimit: 1,
    },
  });
  const queryResponse = await api.searchanalytics.query({
    siteUrl: target,
    requestBody: {
      startDate,
      endDate,
      dimensions: ["query"],
      rowLimit,
    },
  });
  const pageResponse = await api.searchanalytics.query({
    siteUrl: target,
    requestBody: {
      startDate,
      endDate,
      dimensions: ["page"],
      rowLimit,
    },
  });
  const summaryRow = summaryResponse.data.rows?.[0] || {};
  return {
    source: "searchconsole",
    property: target,
    dateKey: normalizeDateKey(endDate),
    summary: {
      clicks: Number(summaryRow.clicks || 0),
      impressions: Number(summaryRow.impressions || 0),
      ctr: Number(summaryRow.ctr || 0),
      position: Number(summaryRow.position || 0),
    },
    topQueries: mapSearchConsoleRows(queryResponse.data.rows || [], "query"),
    topPages: mapSearchConsoleRows(pageResponse.data.rows || [], "page"),
  };
}

async function fetchGa4Snapshot({ connection, propertyId, startDate, endDate, rowLimit = 10 }) {
  const client = createGoogleClientFromConnection(connection);
  const api = google.analyticsdata({ version: "v1beta", auth: client });
  const property = `properties/${normalizeGa4PropertyId(propertyId)}`;
  const summaryResponse = await api.properties.runReport({
    property,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "conversions" }],
      dimensionFilter: undefined,
      metricAggregations: ["TOTAL"],
    },
  });
  const landingResponse = await api.properties.runReport({
    property,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "landingPagePlusQueryString" }],
      metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "conversions" }],
      limit: rowLimit,
    },
  });
  const sourceResponse = await api.properties.runReport({
    property,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "sessionSourceMedium" }],
      metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "conversions" }],
      limit: rowLimit,
    },
  });

  const summaryRow = summaryResponse.data.rows?.[0] || {};
  return {
    source: "ga4",
    property: normalizeGa4PropertyId(propertyId),
    dateKey: normalizeDateKey(endDate),
    summary: {
      sessions: Number(summaryRow.metricValues?.[0]?.value || 0),
      users: Number(summaryRow.metricValues?.[1]?.value || 0),
      conversions: Number(summaryRow.metricValues?.[2]?.value || 0),
    },
    landingPages: mapGa4Rows(landingResponse.data.rows || [], "landingPage"),
    sourceMedium: mapGa4Rows(sourceResponse.data.rows || [], "sourceMedium"),
  };
}

module.exports = {
  GOOGLE_OAUTH_SCOPES,
  buildGoogleAuthUrl,
  compareMetricSnapshots,
  createGoogleClientFromConnection,
  exchangeGoogleCode,
  fetchGa4Snapshot,
  fetchSearchConsoleSnapshot,
  listGa4Properties,
  listSearchConsoleProperties,
  normalizeGa4PropertyId,
  normalizeGoogleBindingInput,
  normalizeDateKey,
  normalizeSearchConsoleProperty,
  parseScopeList,
  pickTopRows,
};
