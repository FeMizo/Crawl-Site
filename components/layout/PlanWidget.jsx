import { useEffect, useState } from "react";
import Icon from "../ui/Icon";

const PLAN_COLORS = {
  FREE: { bar: "#64b5f6", badge: "var(--text2)", badgeBg: "var(--bg3)", badgeBorder: "var(--border2)" },
  BASIC: { bar: "#f59e0b", badge: "#fbbf24", badgeBg: "rgba(245,158,11,0.14)", badgeBorder: "rgba(245,158,11,0.4)" },
  STARTER: { bar: "#4d8dff", badge: "#77abff", badgeBg: "rgba(77,141,255,0.14)", badgeBorder: "rgba(77,141,255,0.4)" },
  PRO: { bar: "#00ff88", badge: "var(--accent)", badgeBg: "var(--adim)", badgeBorder: "rgba(0,255,136,0.3)" },
  AGENCY: { bar: "#c084fc", badge: "#c084fc", badgeBg: "rgba(192,132,252,0.14)", badgeBorder: "rgba(192,132,252,0.4)" },
};

const PLAN_LABEL = { FREE: "Gratis", BASIC: "Basic", STARTER: "Starter", PRO: "Pro", AGENCY: "Agency" };

function Bar({ used, max, color }) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const warn = pct >= 80;
  return (
    <div className="pw-bar-wrap">
      <div
        className="pw-bar-fill"
        style={{ width: `${pct}%`, background: warn ? "var(--error, #f87171)" : color }}
      />
      <style jsx>{`
        .pw-bar-wrap {
          height: 4px;
          background: var(--border2);
          border-radius: 999px;
          overflow: hidden;
        }
        .pw-bar-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.4s ease;
        }
      `}</style>
    </div>
  );
}

function StatRow({ icon, label, used, max, color }) {
  const unlimited = max >= 999;
  return (
    <div className="pw-stat">
      <div className="pw-stat-head">
        <span className="pw-stat-icon">
          <Icon name={icon} size={11} />
        </span>
        <span className="pw-stat-label">{label}</span>
        <span className="pw-stat-val">
          {unlimited ? `${used} / ∞` : `${used} / ${max}`}
        </span>
      </div>
      {!unlimited && <Bar used={used} max={max} color={color} />}
      <style jsx>{`
        .pw-stat { display: grid; gap: 5px; }
        .pw-stat-head {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text2);
        }
        .pw-stat-icon {
          display: inline-flex;
          align-items: center;
          color: var(--muted);
          flex: 0 0 auto;
        }
        .pw-stat-label { flex: 1; font-weight: 600; }
        .pw-stat-val {
          font-variant-numeric: tabular-nums;
          color: var(--muted);
          font-size: 11px;
        }
      `}</style>
    </div>
  );
}

export default function PlanWidget({ user }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/subscription")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setData(d))
      .catch(() => {});
  }, [user]);

  if (!data) return null;

  const { subscription: sub, usage } = data;
  const plan = sub?.plan || "FREE";
  const colors = PLAN_COLORS[plan] || PLAN_COLORS.FREE;
  const isFree = plan === "FREE";

  return (
    <div className="plan-widget">
      <div className="pw-header">
        <span className="pw-plan-badge" style={{ color: colors.badge, background: colors.badgeBg, borderColor: colors.badgeBorder }}>
          {PLAN_LABEL[plan] || plan}
        </span>
        {isFree && (
          <a className="pw-upgrade-link" href="/settings">
            Mejorar
          </a>
        )}
      </div>

      <div className="pw-stats">
        <StatRow
          icon="projects"
          label="Proyectos"
          used={usage?.projects ?? 0}
          max={sub?.maxProjects ?? 1}
          color={colors.bar}
        />
        <StatRow
          icon="run"
          label="Rastreos / mes"
          used={usage?.crawlsThisMonth ?? 0}
          max={sub?.maxCrawlsPerMonth ?? 2}
          color={colors.bar}
        />
      </div>

      {isFree && (
        <a className="pw-upgrade-btn" href="/settings">
          <Icon name="plus" size={13} />
          Ver planes
        </a>
      )}

      <style jsx>{`
        .plan-widget {
          display: grid;
          gap: 10px;
        }
        .pw-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .pw-plan-badge {
          display: inline-flex;
          align-items: center;
          min-height: 22px;
          padding: 0 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          border: 1px solid;
        }
        .pw-upgrade-link {
          font-size: 11px;
          font-weight: 700;
          color: var(--accent);
          text-decoration: none;
          letter-spacing: 0.06em;
        }
        .pw-upgrade-link:hover { text-decoration: underline; }
        .pw-stats {
          display: grid;
          gap: 10px;
        }
        .pw-upgrade-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          padding: 8px 12px;
          border-radius: 10px;
          background: var(--adim);
          border: 1px solid rgba(0, 255, 136, 0.25);
          color: var(--accent);
          font-size: 12px;
          font-weight: 700;
          font-family: "Manrope", sans-serif;
          text-decoration: none;
          transition: all 0.2s;
          letter-spacing: 0.04em;
        }
        .pw-upgrade-btn:hover {
          background: rgba(0, 255, 136, 0.15);
          border-color: rgba(0, 255, 136, 0.4);
        }
      `}</style>
    </div>
  );
}
