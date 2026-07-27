import Card from "../ui/Card";
import Button from "../ui/Button";
import Icon from "../ui/Icon";

function formatAlertDate(value, formatDate) {
  if (!value) return "Sin fecha";
  if (typeof formatDate === "function") return formatDate(value);
  return new Date(value).toLocaleString();
}

export default function CrawlAlertsPanel({
  alerts,
  loading,
  unreadCount,
  error,
  onRefresh,
  onMarkRead,
  formatDate,
}) {
  return (
    <Card className="alerts-panel">
      <div className="alerts-head">
        <div>
          <div className="alerts-kicker">Alertas</div>
          <h3>Regresiones detectadas</h3>
        </div>
        <div className="alerts-actions">
          <span className="alerts-count">{unreadCount || 0} sin leer</span>
          <Button type="button" variant="outline" tone="secondary" size="sm" onClick={onRefresh}>
            Actualizar
          </Button>
        </div>
      </div>

      {error ? <div className="alerts-feedback error">{error}</div> : null}

      {!loading && !alerts?.length ? (
        <div className="alerts-empty">No hay alertas todavia.</div>
      ) : null}

      <div className="alerts-list">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="alerts-skeleton">
                <div />
                <div />
                <div />
              </div>
            ))
          : alerts?.map((alert) => (
              <article key={alert.id} className={`alert-item ${alert.readAt ? "read" : "unread"} ${alert.severity}`}>
                <div className="alert-item-top">
                  <div className={`alert-pill ${alert.severity}`}>{alert.severity === "critical" ? "Critica" : "Aviso"}</div>
                  <span className="alert-date">{formatAlertDate(alert.createdAt, formatDate)}</span>
                </div>
                <strong>{alert.title}</strong>
                <p>{alert.message}</p>
                <div className="alert-item-actions">
                  <span className="alert-source">{alert.type}</span>
                  {!alert.readAt ? (
                    <button type="button" className="alert-read-btn" onClick={() => onMarkRead?.(alert.id)}>
                      Marcar como leida
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
      </div>

      <style jsx>{`
        .alerts-panel {
          display: grid;
          gap: 16px;
        }
        .alerts-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .alerts-kicker {
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 11px;
          color: var(--text3);
          margin-bottom: 6px;
        }
        .alerts-head h3 {
          margin: 0;
          font-size: 18px;
        }
        .alerts-actions {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .alerts-count {
          font-size: 12px;
          color: var(--text2);
        }
        .alerts-feedback {
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13px;
        }
        .alerts-feedback.error {
          background: rgba(239, 68, 68, 0.12);
          color: var(--error);
        }
        .alerts-empty {
          color: var(--text2);
          font-size: 13px;
        }
        .alerts-list {
          display: grid;
          gap: 12px;
        }
        .alerts-skeleton {
          display: grid;
          gap: 8px;
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 14px;
          background: var(--bg2);
        }
        .alerts-skeleton div {
          height: 12px;
          border-radius: 999px;
          background: linear-gradient(90deg, var(--bg3), var(--bg2), var(--bg3));
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite linear;
        }
        .alerts-skeleton div:first-child {
          width: 40%;
        }
        .alerts-skeleton div:nth-child(2) {
          width: 92%;
        }
        .alerts-skeleton div:nth-child(3) {
          width: 68%;
        }
        .alert-item {
          display: grid;
          gap: 8px;
          border: 1px solid var(--border2);
          border-radius: 14px;
          background: var(--bg2);
          padding: 14px;
        }
        .alert-item.unread {
          box-shadow: 0 0 0 1px rgba(77, 141, 255, 0.18) inset;
        }
        .alert-item.critical {
          border-color: rgba(239, 68, 68, 0.26);
        }
        .alert-item.warning {
          border-color: rgba(245, 158, 11, 0.26);
        }
        .alert-item-top,
        .alert-item-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .alert-pill {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 700;
        }
        .alert-pill.critical {
          background: rgba(239, 68, 68, 0.12);
          color: var(--error);
        }
        .alert-pill.warning {
          background: rgba(245, 158, 11, 0.12);
          color: #d97706;
        }
        .alert-date,
        .alert-source {
          font-size: 12px;
          color: var(--text2);
        }
        .alert-item strong {
          font-size: 14px;
        }
        .alert-item p {
          margin: 0;
          color: var(--text2);
          font-size: 13px;
          line-height: 1.45;
        }
        .alert-read-btn {
          background: transparent;
          border: 1px solid var(--border2);
          border-radius: 999px;
          color: var(--text);
          padding: 6px 10px;
          font: inherit;
          font-size: 12px;
          cursor: pointer;
        }
        .alert-read-btn:hover {
          background: var(--bg3);
        }
        @keyframes shimmer {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
      `}</style>
    </Card>
  );
}
