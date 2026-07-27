import { useEffect, useState } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Icon from "../ui/Icon";

const DEFAULT_FORM = {
  enabled: true,
  frequency: "weekly",
  maxPages: 50,
  renderMode: "auto",
};

export default function CrawlSchedulePanel({ schedule, loading, saving, error, onSave, formatDate }) {
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    setForm({
      enabled: schedule?.enabled ?? true,
      frequency: schedule?.frequency || "weekly",
      maxPages: schedule?.maxPages || 50,
      renderMode: schedule?.renderMode || "auto",
    });
  }, [schedule]);

  const submit = (event) => {
    event.preventDefault();
    onSave?.({
      enabled: form.enabled,
      frequency: form.frequency,
      maxPages: Number(form.maxPages) || 50,
      renderMode: form.renderMode,
    });
  };

  return (
    <Card className="schedule-panel">
      <div className="schedule-head">
        <div>
          <div className="schedule-kicker">Programacion</div>
          <h3>Rastreos programados</h3>
        </div>
        <div className={`schedule-status ${schedule?.enabled ? "on" : "off"}`}>
          <Icon name={schedule?.enabled ? "check" : "close"} size={12} />
          <span>{schedule?.enabled ? "Activa" : "Pausada"}</span>
        </div>
      </div>

      {error ? <div className="schedule-feedback error">{error}</div> : null}

      <form className="schedule-form" onSubmit={submit}>
        <label className="schedule-field">
          <span>Estado</span>
          <select
            value={String(form.enabled)}
            onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.value === "true" }))}
          >
            <option value="true">Activa</option>
            <option value="false">Pausada</option>
          </select>
        </label>

        <label className="schedule-field">
          <span>Frecuencia</span>
          <select
            value={form.frequency}
            onChange={(event) => setForm((current) => ({ ...current, frequency: event.target.value }))}
          >
            <option value="daily">Diaria</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
          </select>
        </label>

        <label className="schedule-field">
          <span>Maximo de paginas</span>
          <input
            type="number"
            min="1"
            max="500"
            value={form.maxPages}
            onChange={(event) => setForm((current) => ({ ...current, maxPages: event.target.value }))}
          />
        </label>

        <label className="schedule-field">
          <span>Modo de render</span>
          <select
            value={form.renderMode}
            onChange={(event) => setForm((current) => ({ ...current, renderMode: event.target.value }))}
          >
            <option value="auto">Auto</option>
            <option value="http">HTTP</option>
            <option value="rendered">Renderizado</option>
          </select>
        </label>

        <div className="schedule-summary">
          <div>
            <span>Ultima ejecucion</span>
            <strong>{schedule?.lastRunAt ? formatDate?.(schedule.lastRunAt) : "Sin ejecutar"}</strong>
          </div>
          <div>
            <span>Siguiente ejecucion</span>
            <strong>{schedule?.nextRunAt ? formatDate?.(schedule.nextRunAt) : "Sin programar"}</strong>
          </div>
        </div>

        <div className="schedule-actions">
          <Button type="submit" variant="solid" tone="primary" size="sm" loading={saving}>
            Guardar programacion
          </Button>
          {loading ? <span className="schedule-loading">Cargando...</span> : null}
        </div>
      </form>

      <style jsx>{`
        .schedule-panel {
          display: grid;
          gap: 16px;
        }
        .schedule-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .schedule-kicker {
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 11px;
          color: var(--text3);
          margin-bottom: 6px;
        }
        .schedule-head h3 {
          margin: 0;
          font-size: 18px;
        }
        .schedule-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 700;
        }
        .schedule-status.on {
          background: rgba(26, 188, 156, 0.14);
          color: var(--success, #1abc9c);
        }
        .schedule-status.off {
          background: rgba(255, 193, 7, 0.14);
          color: var(--warning, #e0a800);
        }
        .schedule-feedback {
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13px;
        }
        .schedule-feedback.error {
          background: rgba(239, 68, 68, 0.12);
          color: var(--error);
        }
        .schedule-form {
          display: grid;
          gap: 12px;
        }
        .schedule-field {
          display: grid;
          gap: 6px;
        }
        .schedule-field span,
        .schedule-summary span,
        .schedule-loading {
          font-size: 12px;
          color: var(--text2);
        }
        .schedule-field input,
        .schedule-field select {
          appearance: none;
          border: 1px solid var(--border2);
          border-radius: 10px;
          background: var(--bg2);
          color: var(--text);
          padding: 10px 12px;
          font: inherit;
        }
        .schedule-summary {
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          border-top: 1px solid var(--border);
          padding-top: 12px;
        }
        .schedule-summary div {
          display: grid;
          gap: 4px;
        }
        .schedule-summary strong {
          font-size: 13px;
          color: var(--text);
        }
        .schedule-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        @media (max-width: 720px) {
          .schedule-summary {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Card>
  );
}
