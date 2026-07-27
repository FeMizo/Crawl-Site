import { useEffect, useMemo, useState } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Icon from "../ui/Icon";
import StatCard from "../ui/StatCard";

function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "0";
  return new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(Number(value));
}

function formatPct(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "0%";
  return `${formatNumber(value * 100, 1)}%`;
}

function seriesValues(series = [], key) {
  return series.map((row) => Number(row?.[key] || 0));
}

function Sparkline({ values, color = "#4d8dff" }) {
  const safeValues = Array.isArray(values) ? values.map((value) => Number(value || 0)) : [];
  if (!safeValues.length) {
    return <div className="sparkline-empty">Sin datos</div>;
  }
  const max = Math.max(...safeValues, 1);
  const min = Math.min(...safeValues, 0);
  const width = 240;
  const height = 72;
  const step = safeValues.length > 1 ? width / (safeValues.length - 1) : width;
  const points = safeValues.map((value, index) => {
    const normalized = max === min ? 0.5 : (value - min) / (max - min);
    const x = index * step;
    const y = height - normalized * (height - 12) - 6;
    return `${x},${y}`;
  });
  const area = `M 0 ${height} L ${points.join(" L ")} L ${width} ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="sparkline" role="img" aria-label="Serie de tendencia">
      <path d={area} fill={color} opacity="0.12" />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DataTable({ title, rows, columns, empty = "Sin datos" }) {
  return (
    <div className="google-table-card">
      <div className="google-table-title">{title}</div>
      {rows?.length ? (
        <div className="google-table-wrap">
          <table className="google-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`${title}-${rowIndex}`}>
                  {columns.map((column) => (
                    <td key={column.key}>{column.render ? column.render(row[column.key], row) : row[column.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="google-table-empty">{empty}</div>
      )}
    </div>
  );
}

function TrendCard({ title, series, metricKey, color, subtitle, valueLabel }) {
  const values = seriesValues(series, metricKey);
  const latest = values[values.length - 1] || 0;
  const previous = values[values.length - 2] || 0;
  const delta = previous ? ((latest - previous) / previous) * 100 : 0;
  return (
    <div className="trend-card">
      <div className="trend-head">
        <div>
          <div className="trend-title">{title}</div>
          <div className="trend-subtitle">{subtitle}</div>
        </div>
        <strong>{valueLabel ? valueLabel(latest) : formatNumber(latest)}</strong>
      </div>
      <Sparkline values={values} color={color} />
      <div className={`trend-delta ${delta >= 0 ? "up" : "down"}`}>
        {delta >= 0 ? "+" : ""}
        {formatNumber(delta, 1)}%
      </div>
    </div>
  );
}

export default function GoogleInsightsPanel({ project, notify, formatDate }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ searchConsoleProperty: "", ga4PropertyId: "" });

  const connection = data?.connection || null;
  const binding = data?.binding || null;
  const insights = data?.insights || {};
  const searchConsole = insights.searchConsole || {};
  const ga4 = insights.ga4 || {};

  const connectionState = useMemo(() => {
    if (!connection) return "No conectado";
    if ((binding?.searchConsoleProperty || binding?.ga4PropertyId) && connection.status === "connected") return "Activo";
    return "Pendiente";
  }, [binding, connection]);

  const loadData = async () => {
    if (!project?.id) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/projects/${project.id}/google-integration`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "No se pudo cargar Google");
      setData(payload);
      setForm({
        searchConsoleProperty: payload.binding?.searchConsoleProperty || "",
        ga4PropertyId: payload.binding?.ga4PropertyId || "",
      });
    } catch (err) {
      setError(err.message || "No se pudo cargar Google");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const onMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "seo-crawler:google-drive-connected") {
        setConnecting(false);
        loadData().catch(() => {});
        notify?.({ tone: "success", title: "Google conectado" });
      }
      if (event.data?.type === "seo-crawler:google-drive-failed") {
        setConnecting(false);
        notify?.({ tone: "error", title: "No se pudo conectar Google", message: event.data?.message || "OAuth falló." });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [notify]);

  const connectGoogle = async () => {
    const popup = window.open("", "googleIntegrationLogin", "width=520,height=720,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes");
    if (!popup) {
      notify?.({ tone: "error", title: "Ventana bloqueada", message: "Permite ventanas emergentes para completar OAuth." });
      return;
    }
    popup.document.write("<p style=\"font-family:sans-serif;padding:20px\">Abriendo Google...</p>");
    setConnecting(true);
    const response = await fetch("/api/google/connect");
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      popup.close();
      setConnecting(false);
      notify?.({ tone: "error", title: "Google no configurado", message: payload.error || "Faltan credenciales OAuth." });
      return;
    }
    popup.location.href = payload.authUrl;
    const timer = window.setInterval(() => {
      if (!popup.closed) return;
      window.clearInterval(timer);
      setConnecting(false);
      loadData().catch(() => {});
    }, 800);
  };

  const saveBinding = async () => {
    if (!project?.id) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/google-integration`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "No se pudo guardar Google");
      setData((current) => ({ ...current, binding: payload.binding || current?.binding || null }));
      notify?.({ tone: "success", title: "Binding guardado" });
    } catch (err) {
      notify?.({ tone: "error", title: "No se pudo guardar", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const syncNow = async () => {
    if (!project?.id) return;
    setSyncing(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/google-integration/sync`, { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "No se pudo sincronizar Google");
      await loadData();
      notify?.({ tone: "success", title: "Google sincronizado" });
    } catch (err) {
      notify?.({ tone: "error", title: "No se pudo sincronizar", message: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const searchConsoleCurrent = searchConsole.latest?.summary || {};
  const ga4Current = ga4.latest?.summary || {};

  return (
    <Card className="google-insights-panel">
      <div className="google-head">
        <div>
          <div className="google-kicker">Google</div>
          <h3>Search Console + GA4</h3>
        </div>
        <div className={`google-status ${connection ? "on" : "off"}`}>
          <Icon name={connection ? "check" : "close"} size={12} />
          <span>{connectionState}</span>
        </div>
      </div>

      {error ? <div className="google-feedback error">{error}</div> : null}
      {loading ? <div className="google-feedback">Cargando datos de Google...</div> : null}

      <div className="google-actions">
        <Button type="button" variant="outline" tone="secondary" size="sm" onClick={connectGoogle} loading={connecting}>
          {connection ? "Reconectar Google" : "Conectar Google"}
        </Button>
        <Button type="button" variant="outline" tone="secondary" size="sm" onClick={loadData}>
          Actualizar
        </Button>
        <Button type="button" variant="solid" tone="primary" size="sm" onClick={syncNow} loading={syncing} disabled={!binding}>
          Sincronizar ahora
        </Button>
      </div>

      <div className="google-form">
        <label className="google-field">
          <span>Search Console property</span>
          <select
            value={form.searchConsoleProperty}
            onChange={(event) => setForm((current) => ({ ...current, searchConsoleProperty: event.target.value }))}
          >
            <option value="">Selecciona una propiedad</option>
            {(data?.availableProperties?.searchConsole || []).map((property) => (
              <option key={property.property} value={property.property}>
                {property.property}
              </option>
            ))}
          </select>
        </label>

        <label className="google-field">
          <span>GA4 property ID</span>
          <select
            value={form.ga4PropertyId}
            onChange={(event) => setForm((current) => ({ ...current, ga4PropertyId: event.target.value }))}
          >
            <option value="">Selecciona una propiedad</option>
            {(data?.availableProperties?.ga4 || []).map((property) => (
              <option key={property.propertyId} value={property.propertyId}>
                {property.displayName} ({property.propertyId})
              </option>
            ))}
          </select>
        </label>

        <Button type="button" variant="solid" tone="secondary" size="sm" onClick={saveBinding} loading={saving} disabled={!connection}>
          Guardar binding
        </Button>
      </div>

      <div className="google-meta">
        <div>
          <span>Cuenta</span>
          <strong>{connection?.email || "Sin conectar"}</strong>
        </div>
        <div>
          <span>Estado</span>
          <strong>{binding?.status || connection?.status || "Pendiente"}</strong>
        </div>
        <div>
          <span>Ultima sync</span>
          <strong>{binding?.lastSyncAt || connection?.lastSyncAt ? formatDate?.(binding?.lastSyncAt || connection?.lastSyncAt) : "Sin sincronizar"}</strong>
        </div>
      </div>

      <div className="google-kpis">
        <StatCard label="Clicks" value={formatNumber(searchConsoleCurrent.clicks || 0)} hint="Search Console" tone="primary" icon={<Icon name="run" size={14} />} />
        <StatCard label="Impresiones" value={formatNumber(searchConsoleCurrent.impressions || 0)} hint={`CTR ${formatPct(searchConsoleCurrent.ctr || 0)}`} tone="secondary" icon={<Icon name="history" size={14} />} />
        <StatCard label="Sesiones" value={formatNumber(ga4Current.sessions || 0)} hint="GA4" tone="primary" icon={<Icon name="tasks" size={14} />} />
        <StatCard label="Usuarios" value={formatNumber(ga4Current.users || 0)} hint={`Conv. ${formatNumber(ga4Current.conversions || 0)}`} tone="secondary" icon={<Icon name="projects" size={14} />} />
      </div>

      <div className="google-trends">
        <TrendCard
          title="Search Console"
          subtitle="Clicks de los ultimos 30 dias"
          series={searchConsole.series30 || []}
          metricKey="clicks"
          color="#4d8dff"
          valueLabel={(value) => formatNumber(value)}
        />
        <TrendCard
          title="GA4"
          subtitle="Sesiones de los ultimos 30 dias"
          series={ga4.series30 || []}
          metricKey="sessions"
          color="#12b886"
          valueLabel={(value) => formatNumber(value)}
        />
      </div>

      <div className="google-grid">
        <DataTable
          title="Top queries"
          rows={searchConsole.topQueries || []}
          columns={[
            { key: "query", label: "Query" },
            { key: "clicks", label: "Clicks", render: (value) => formatNumber(value) },
            { key: "impressions", label: "Impresiones", render: (value) => formatNumber(value) },
          ]}
        />
        <DataTable
          title="Top landing pages"
          rows={ga4.landingPages || []}
          columns={[
            { key: "landingPage", label: "Landing page" },
            { key: "sessions", label: "Sesiones", render: (value) => formatNumber(value) },
            { key: "users", label: "Usuarios", render: (value) => formatNumber(value) },
          ]}
        />
        <DataTable
          title="Top pages"
          rows={searchConsole.topPages || []}
          columns={[
            { key: "page", label: "Pagina" },
            { key: "clicks", label: "Clicks", render: (value) => formatNumber(value) },
            { key: "position", label: "Posicion", render: (value) => formatNumber(value, 1) },
          ]}
        />
        <DataTable
          title="Source / medium"
          rows={ga4.sourceMedium || []}
          columns={[
            { key: "sourceMedium", label: "Source / medium" },
            { key: "sessions", label: "Sesiones", render: (value) => formatNumber(value) },
            { key: "conversions", label: "Conv.", render: (value) => formatNumber(value) },
          ]}
        />
      </div>

      <div className="google-alerts">
        <div className="google-alerts-head">
          <div>
            <div className="google-kicker">Alertas</div>
            <h4>Caidas relevantes</h4>
          </div>
          <span>{(data?.alerts || []).length} recientes</span>
        </div>
        <div className="google-alerts-list">
          {(data?.alerts || []).length ? (data.alerts || []).map((alert) => (
            <article key={alert.id} className={`google-alert ${alert.severity}`}>
              <strong>{alert.title}</strong>
              <p>{alert.message}</p>
            </article>
          )) : (
            <div className="google-alert-empty">Sin alertas Google todavia.</div>
          )}
        </div>
      </div>

      <style jsx>{`
        .google-insights-panel {
          display: grid;
          gap: 16px;
        }
        .google-head,
        .google-alerts-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .google-kicker {
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 11px;
          color: var(--text3);
          margin-bottom: 6px;
        }
        .google-head h3,
        .google-alerts-head h4 {
          margin: 0;
          font-size: 18px;
        }
        .google-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 700;
        }
        .google-status.on {
          background: rgba(18, 184, 134, 0.14);
          color: #12b886;
        }
        .google-status.off {
          background: rgba(255, 193, 7, 0.14);
          color: #d97706;
        }
        .google-feedback {
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13px;
          color: var(--text2);
          background: var(--bg2);
        }
        .google-feedback.error {
          background: rgba(239, 68, 68, 0.12);
          color: var(--error);
        }
        .google-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .google-form {
          display: grid;
          gap: 12px;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
          align-items: end;
        }
        .google-field {
          display: grid;
          gap: 6px;
        }
        .google-field span,
        .google-meta span,
        .google-alerts-head span {
          font-size: 12px;
          color: var(--text2);
        }
        .google-field select {
          appearance: none;
          border: 1px solid var(--border2);
          border-radius: 10px;
          background: var(--bg2);
          color: var(--text);
          padding: 10px 12px;
          font: inherit;
        }
        .google-meta {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 12px 0;
        }
        .google-meta div {
          display: grid;
          gap: 4px;
        }
        .google-meta strong {
          font-size: 13px;
        }
        .google-kpis {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
        .google-trends {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .trend-card {
          display: grid;
          gap: 10px;
          background: var(--bg2);
          border: 1px solid var(--border2);
          border-radius: 16px;
          padding: 14px;
        }
        .trend-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }
        .trend-title {
          font-size: 14px;
          font-weight: 700;
        }
        .trend-subtitle {
          font-size: 12px;
          color: var(--text2);
        }
        .trend-card strong {
          font-size: 18px;
        }
        .trend-delta {
          font-size: 12px;
          font-weight: 700;
        }
        .trend-delta.up {
          color: #12b886;
        }
        .trend-delta.down {
          color: var(--error);
        }
        .sparkline {
          width: 100%;
          height: 72px;
          display: block;
        }
        .sparkline-empty {
          height: 72px;
          display: grid;
          place-items: center;
          color: var(--text2);
          font-size: 12px;
          border-radius: 12px;
          background: var(--bg3);
        }
        .google-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .google-table-card {
          display: grid;
          gap: 10px;
          background: var(--bg2);
          border: 1px solid var(--border2);
          border-radius: 16px;
          padding: 14px;
          min-width: 0;
        }
        .google-table-title {
          font-size: 13px;
          font-weight: 700;
        }
        .google-table-wrap {
          overflow: auto;
        }
        .google-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .google-table th,
        .google-table td {
          padding: 8px 6px;
          border-top: 1px solid var(--border);
          text-align: left;
          white-space: nowrap;
        }
        .google-table th {
          color: var(--text2);
          font-weight: 700;
          border-top: 0;
        }
        .google-table-empty,
        .google-alert-empty {
          color: var(--text2);
          font-size: 12px;
        }
        .google-alerts {
          display: grid;
          gap: 12px;
        }
        .google-alerts-list {
          display: grid;
          gap: 10px;
        }
        .google-alert {
          display: grid;
          gap: 6px;
          border-radius: 14px;
          padding: 12px 14px;
          background: var(--bg2);
          border: 1px solid var(--border2);
        }
        .google-alert.critical {
          border-color: rgba(239, 68, 68, 0.28);
        }
        .google-alert.warning {
          border-color: rgba(245, 158, 11, 0.28);
        }
        .google-alert strong {
          font-size: 13px;
        }
        .google-alert p {
          margin: 0;
          font-size: 12px;
          color: var(--text2);
        }
        @media (max-width: 900px) {
          .google-form,
          .google-meta,
          .google-kpis,
          .google-trends,
          .google-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Card>
  );
}
