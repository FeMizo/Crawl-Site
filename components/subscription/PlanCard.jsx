import React from "react";
import Button from "../ui/Button";
import Icon from "../ui/Icon";
import { FEATURE_LABELS, FEATURE_TOOLTIPS, LIMIT_TOOLTIPS } from "../../lib/plan-data";

const PLAN_COLORS = {
  FREE:    { accent: "#64b5f6", badge: "var(--text2)",  badgeBg: "var(--bg3)",              badgeBorder: "var(--border2)" },
  BASIC:   { accent: "#f59e0b", badge: "#fbbf24",       badgeBg: "rgba(245,158,11,0.10)",   badgeBorder: "rgba(245,158,11,0.35)" },
  STARTER: { accent: "#4d8dff", badge: "#77abff",       badgeBg: "rgba(77,141,255,0.10)",   badgeBorder: "rgba(77,141,255,0.35)" },
  PRO:     { accent: "#00ff88", badge: "var(--accent)", badgeBg: "var(--adim)",             badgeBorder: "rgba(0,255,136,0.3)" },
  AGENCY:  { accent: "#c084fc", badge: "#c084fc",       badgeBg: "rgba(192,132,252,0.10)",  badgeBorder: "rgba(192,132,252,0.35)" },
};

const PLAN_LABEL = { FREE: "Gratis", BASIC: "Basic", STARTER: "Starter", PRO: "Pro", AGENCY: "Agency" };
const PLAN_ORDER = { FREE: 0, BASIC: 1, STARTER: 2, PRO: 3, AGENCY: 4 };

function fmt(n) {
  if (n === null || n === undefined || n >= 999) return "Ilimitado";
  return n.toLocaleString("es-MX");
}

export default function PlanCard({
  plan,
  isStatic = false, // true for /precios page
  sessionUser = null,
  currentPlan = null,
  onChange = null,
  changing = "",
  stripeManaged = false,
  onPortal = null,
  portalLoading = false,
}) {
  const planKey = plan.key || plan.plan;
  const isFree = planKey === "FREE";
  
  // Use colors from plan directly if provided (precios.jsx), otherwise use default PLAN_COLORS
  const colors = plan.accent ? {
    accent: plan.accent,
    badge: plan.badge,
    badgeBg: plan.badgeBg,
    badgeBorder: plan.badgeBorder
  } : (PLAN_COLORS[planKey] || PLAN_COLORS.FREE);

  const isCurrent = !isStatic && currentPlan && planKey === currentPlan;
  const currentRank = PLAN_ORDER[currentPlan] ?? 0;
  const thisRank = PLAN_ORDER[planKey] ?? 0;
  
  const isUpgrade = !isStatic && !isCurrent && thisRank > currentRank;
  const isDowngrade = !isStatic && !isCurrent && thisRank < currentRank;
  const hasPrice = isStatic ? true : plan.hasStripePrice;
  const isHighlighted = isStatic ? plan.highlighted : isCurrent;

  let ActionButton;

  if (isStatic) {
    const ctaHref = sessionUser ? "/subscription" : "/register";
    const ctaLabel = isFree
      ? (sessionUser ? "Tu plan actual" : "Comenzar gratis")
      : (sessionUser ? "Ver planes" : "Registrarse");

    ActionButton = (
      <Button
        href={ctaHref}
        variant={plan.highlighted ? "solid" : "outline"}
        tone={plan.highlighted ? "primary" : "secondary"}
      >
        {ctaLabel}
      </Button>
    );
  } else {
    ActionButton = (
      <>
        {isCurrent && isFree && (
          <Button variant="outline" tone="secondary" disabled>Plan actual</Button>
        )}
        {isCurrent && !isFree && stripeManaged && (
          <Button
            type="button"
            variant="outline"
            tone="secondary"
            onClick={onPortal}
            loading={portalLoading}
            iconLeft={<Icon name="settings" size={14} />}
          >
            Gestionar facturación
          </Button>
        )}
        {isCurrent && !isFree && !stripeManaged && (
          <Button variant="outline" tone="secondary" disabled>Plan activo</Button>
        )}
        {isUpgrade && hasPrice && (
          <Button
            type="button"
            variant="solid"
            tone="primary"
            onClick={() => onChange && onChange(planKey)}
            loading={changing === planKey}
            iconLeft={<Icon name="plus" size={14} />}
          >
            {stripeManaged ? "Subir de plan" : "Suscribirse"}
          </Button>
        )}
        {isUpgrade && !hasPrice && (
          <Button variant="outline" tone="secondary" disabled>No disponible</Button>
        )}
        {isDowngrade && isFree && (
          <Button
            type="button"
            variant="outline"
            tone="danger"
            onClick={() => onChange && onChange("FREE")}
            loading={changing === "FREE"}
          >
            Volver a gratis
          </Button>
        )}
        {isDowngrade && !isFree && hasPrice && (
          <Button
            type="button"
            variant="outline"
            tone="secondary"
            onClick={() => onChange && onChange(planKey)}
            loading={changing === planKey}
          >
            Cambiar a {PLAN_LABEL[planKey] || plan.label}
          </Button>
        )}
        {isDowngrade && !isFree && !hasPrice && (
          <Button variant="outline" tone="secondary" disabled>No disponible</Button>
        )}
      </>
    );
  }

  return (
    <div className={`plan-card${isHighlighted ? " highlighted" : ""}`} style={{ "--plan-accent": colors.accent }}>
      <div className="plan-card-header">
        <span className="plan-badge" style={{ color: colors.badge, background: colors.badgeBg, borderColor: colors.badgeBorder }}>
          {plan.label || PLAN_LABEL[planKey] || planKey}
        </span>
        {isCurrent && <span className="current-tag">Tu plan actual</span>}
        {isStatic && plan.highlighted && <span className="popular-tag">Más popular</span>}
        {isDowngrade && !isCurrent && <span className="downgrade-tag">Bajar de plan</span>}
      </div>

      <div className="plan-price">
        {isFree ? (
          <span className="price-amount">Gratis</span>
        ) : (
          <>
            <span className="price-amount">${plan.price.toLocaleString("es-MX")}</span>
            <span className="price-currency"> {plan.currency || "MXN"}/mes</span>
          </>
        )}
      </div>

      <ul className="plan-limits">
        <li>
          <Icon name="projects" size={12} />
          {fmt(plan.maxProjects)} proyecto{plan.maxProjects !== 1 ? "s" : ""}
          <span className="tip" data-tip={LIMIT_TOOLTIPS.maxProjects}>?</span>
        </li>
        <li>
          <Icon name="run" size={12} />
          {fmt(plan.maxPagesPerCrawl)} páginas por rastreo
          <span className="tip" data-tip={LIMIT_TOOLTIPS.maxPagesPerCrawl}>?</span>
        </li>
        <li>
          <Icon name="history" size={12} />
          {fmt(plan.maxCrawlsPerMonth)} rastreos/mes
          <span className="tip" data-tip={LIMIT_TOOLTIPS.maxCrawlsPerMonth}>?</span>
        </li>
        <li>
          <Icon name="history" size={12} />
          {fmt(plan.maxHistoryRuns)} historial guardado
          <span className="tip" data-tip={LIMIT_TOOLTIPS.maxHistoryRuns}>?</span>
        </li>
        <li>
          <Icon name="tasks" size={12} />
          Blogs SEO
          <span className="tip" data-tip={LIMIT_TOOLTIPS.maxBlogs}>?</span>
        </li>
      </ul>

      {plan.features?.length > 0 && (
        <ul className="plan-features">
          {plan.features.map((f) => (
            <li key={f}>
              <Icon name="check" size={11} />
              {f === "extra_user"
                ? `${plan.maxExtraUsers} Usuario${plan.maxExtraUsers !== 1 ? "s" : ""} extra`
                : f === "keywords"
                ? `Hasta ${plan.keywordsRange} Keywords sugeridas por página`
                : (FEATURE_LABELS[f] || f)}
              {FEATURE_TOOLTIPS[f] && (
                <span className="tip" data-tip={FEATURE_TOOLTIPS[f]}>?</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="plan-action">
        {ActionButton}
      </div>

      <style jsx>{`
        .plan-card {
          display: grid;
          gap: 14px;
          padding: 15px;
          border: 1px solid var(--border);
          border-radius: 18px;
          background: var(--bg2);
          transition: border-color 0.2s, box-shadow 0.2s;
          align-content: start;
        }
        .plan-card.highlighted {
          border-color: var(--plan-accent);
          box-shadow: 0 0 0 1px var(--plan-accent) inset, 0 12px 32px rgba(0,0,0,0.18);
        }
        @media (max-width: 640px) {
          .plan-card {
            min-width: 80%;
            scroll-snap-align: start;
            flex-shrink: 0;
          }
        }
        .plan-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .plan-badge {
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
        .current-tag, .popular-tag {
          font-size: 10px;
          font-weight: 600;
          color: var(--plan-accent);
          letter-spacing: 0.06em;
        }
        .downgrade-tag {
          font-size: 10px;
          font-weight: 600;
          color: var(--muted);
          letter-spacing: 0.06em;
        }
        .plan-price {
          display: flex;
          align-items: baseline;
          gap: 2px;
          line-height: 1;
        }
        .price-amount {
          font-size: 1.45rem;
          font-weight: 800;
          font-family: "Syne", sans-serif;
          color: var(--text);
        }
        .price-currency {
          font-size: 0.60rem;
          color: var(--muted);
          font-weight: 500;
        }
        .plan-limits, .plan-features {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 8px;
        }
        .plan-limits li, .plan-features li {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          color: var(--text2);
        }
        .plan-features {
          border-top: 1px solid var(--border);
          padding-top: 12px;
          margin-top: 4px;
        }
        .plan-features li {
          color: var(--plan-accent);
          font-weight: 600;
        }
        .plan-action {
          margin-top: 4px;
        }
        .plan-action :global(.btn) {
          width: 100%;
          justify-content: center;
        }
        .tip {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-left: auto;
          flex-shrink: 0;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--bg3);
          border: 1px solid var(--border2);
          color: var(--muted);
          font-size:12px;
          font-weight: 700;
          cursor: default;
          line-height: 1;
        }
        .tip::after {
          content: attr(data-tip);
          position: absolute;
          bottom: calc(100% + 6px);
          right: 0;
          min-width: 180px;
          max-width: 240px;
          background: var(--bg3);
          border: 1px solid var(--border2);
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 13px;
          font-weight: 400;
          color: var(--text2);
          line-height: 1.5;
          white-space: normal;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.15s;
          z-index: 10;
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        }
        .tip:hover::after {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
