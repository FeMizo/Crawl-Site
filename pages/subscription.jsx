import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Eyebrow from "../components/ui/Eyebrow";
import Icon from "../components/ui/Icon";
import useSessionUser from "../hooks/useSessionUser";

const PLAN_COLORS = {
  FREE:    { accent: "#64b5f6", badge: "var(--text2)",  badgeBg: "var(--bg3)",              badgeBorder: "var(--border2)" },
  BASIC:   { accent: "#f59e0b", badge: "#fbbf24",       badgeBg: "rgba(245,158,11,0.10)",   badgeBorder: "rgba(245,158,11,0.35)" },
  STARTER: { accent: "#4d8dff", badge: "#77abff",       badgeBg: "rgba(77,141,255,0.10)",   badgeBorder: "rgba(77,141,255,0.35)" },
  PRO:     { accent: "#00ff88", badge: "var(--accent)",  badgeBg: "var(--adim)",             badgeBorder: "rgba(0,255,136,0.3)" },
  AGENCY:  { accent: "#c084fc", badge: "#c084fc",       badgeBg: "rgba(192,132,252,0.10)",  badgeBorder: "rgba(192,132,252,0.35)" },
};

const PLAN_LABEL = { FREE: "Gratis", BASIC: "Basic", STARTER: "Starter", PRO: "Pro", AGENCY: "Agency" };

const FEATURE_LABELS = {
  excel_report:    "Reporte Excel",
  architecture:    "Analisis de arquitectura",
  performance:     "Analisis de performance",
  scheduled_crawl: "Rastreos programados",
  api_access:      "Acceso API",
  white_label:     "Marca blanca",
  multi_user:      "Multi-usuario",
};

function fmt(n) {
  if (n >= 999) return "Ilimitado";
  return String(n);
}

function PlanCard({ plan, currentPlan, onBuy, buying, stripeManaged, onPortal, portalLoading, onCancel, cancelling, cancelledAt }) {
  const isCurrent = plan.plan === currentPlan;
  const isFree = plan.plan === "FREE";
  const colors = PLAN_COLORS[plan.plan] || PLAN_COLORS.FREE;
  const hasBuyable = plan.hasStripePrice && !isCurrent && !isFree;
  const isCurrentPaid = isCurrent && stripeManaged;
  const canDowngradeToFree = isFree && stripeManaged && !isCurrent;
  const isPendingCancel = isCurrent && stripeManaged && !!cancelledAt;

  return (
    <div className={`plan-card${isCurrent ? " is-current" : ""}`} style={{ "--plan-accent": colors.accent }}>
      <div className="plan-card-header">
        <span className="plan-badge" style={{ color: colors.badge, background: colors.badgeBg, borderColor: colors.badgeBorder }}>
          {PLAN_LABEL[plan.plan] || plan.plan}
        </span>
        {isCurrent && <span className="current-tag">Tu plan actual</span>}
      </div>

      <div className="plan-price">
        {isFree
          ? <span className="price-amount">Gratis</span>
          : (
            <>
              <span className="price-amount">${plan.price.toLocaleString("es-MX")}</span>
              <span className="price-currency"> {plan.currency}/mes</span>
            </>
          )
        }
      </div>

      <ul className="plan-limits">
        <li><Icon name="projects" size={12} />{fmt(plan.maxProjects)} proyecto{plan.maxProjects !== 1 ? "s" : ""}</li>
        <li><Icon name="run" size={12} />{fmt(plan.maxPagesPerCrawl)} paginas por rastreo</li>
        <li><Icon name="history" size={12} />{fmt(plan.maxCrawlsPerMonth)} rastreos/mes</li>
        <li><Icon name="history" size={12} />{fmt(plan.maxHistoryRuns)} historial guardado</li>
      </ul>

      {plan.features?.length > 0 && (
        <ul className="plan-features">
          {plan.features.map((f) => (
            <li key={f}><Icon name="check" size={11} />{FEATURE_LABELS[f] || f}</li>
          ))}
        </ul>
      )}

      <div className="plan-action">
        {isPendingCancel && (
          <div className="cancel-notice">
            <Icon name="shield" size={12} />
            Cancelacion pendiente — activo hasta fin de periodo
          </div>
        )}
        {isCurrent && isCurrentPaid && !isPendingCancel && (
          <Button
            type="button"
            variant="outline"
            tone="secondary"
            onClick={onPortal}
            loading={portalLoading}
            iconLeft={<Icon name="settings" size={14} />}
          >
            Gestionar facturacion
          </Button>
        )}
        {isCurrent && !isCurrentPaid && !isFree && (
          <Button variant="outline" tone="secondary" disabled>Plan activo</Button>
        )}
        {isCurrent && isFree && (
          <Button variant="outline" tone="secondary" disabled>Plan actual</Button>
        )}
        {hasBuyable && (
          <Button
            type="button"
            variant="solid"
            tone="primary"
            onClick={() => onBuy(plan.plan)}
            loading={buying === plan.plan}
            iconLeft={<Icon name="plus" size={14} />}
          >
            {stripeManaged ? "Cambiar plan" : "Suscribirse"}
          </Button>
        )}
        {canDowngradeToFree && !cancelledAt && (
          <Button
            type="button"
            variant="outline"
            tone="danger"
            onClick={onCancel}
            loading={cancelling}
            iconLeft={<Icon name="shield" size={14} />}
          >
            Cancelar suscripcion
          </Button>
        )}
        {canDowngradeToFree && cancelledAt && (
          <Button variant="outline" tone="secondary" disabled>Cancelacion programada</Button>
        )}
        {!isCurrent && !hasBuyable && !isFree && !canDowngradeToFree && (
          <Button variant="outline" tone="secondary" disabled>No disponible</Button>
        )}
      </div>

      <style jsx>{`
        .plan-card {
          display: grid;
          gap: 16px;
          padding: 20px;
          border: 1px solid var(--border);
          border-radius: 18px;
          background: var(--bg2);
          transition: border-color 0.2s, box-shadow 0.2s;
          align-content: start;
        }
        .plan-card.is-current {
          border-color: var(--plan-accent);
          box-shadow: 0 0 0 1px var(--plan-accent) inset, 0 12px 32px rgba(0,0,0,0.18);
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
        .current-tag {
          font-size: 10px;
          font-weight: 600;
          color: var(--plan-accent);
          letter-spacing: 0.06em;
        }
        .plan-price {
          display: flex;
          align-items: baseline;
          gap: 2px;
          line-height: 1;
        }
        .price-amount {
          font-size: 1.8rem;
          font-weight: 800;
          font-family: "Syne", sans-serif;
          color: var(--text);
        }
        .price-currency {
          font-size: 0.75rem;
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
          font-size: 12px;
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
        .plan-action :global(.ui-btn) {
          width: 100%;
          justify-content: center;
        }
        .cancel-notice {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: var(--error, #f87171);
          padding: 8px 10px;
          border-radius: 8px;
          background: rgba(248,113,113,0.08);
          border: 1px solid rgba(248,113,113,0.2);
        }
      `}</style>
    </div>
  );
}

export default function SubscriptionPage() {
  const router = useRouter();
  const { sessionUser, setSessionUser, clearSessionUser } = useSessionUser();
  const [subData, setSubData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [buying, setBuying] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [banner, setBanner] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);

    const params = new URLSearchParams(window.location.search || "");
    const sessionId = params.get("session_id");
    const isSuccess = params.get("success") === "1";
    const isCancelled = params.get("cancelled") === "1";

    if (isSuccess) setBanner("success");
    else if (isCancelled) setBanner("cancelled");

    // Clean up query params from URL without reloading
    if (sessionId || isSuccess || isCancelled) {
      router.replace("/subscription", undefined, { shallow: true });
    }

    // If returning from a successful checkout, verify the session first so the
    // plan is written to the DB before we load /api/subscription below.
    const maybeVerify = (isSuccess && sessionId)
      ? fetch("/api/subscription/verify-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        }).catch(() => {})
      : Promise.resolve();

    maybeVerify.then(() => {
      if (!active) return;
      return Promise.all([
        fetch("/api/subscription").then((r) => {
          if (r.status === 401) return null;
          return r.ok ? r.json() : null;
        }),
        fetch("/api/subscription/plans").then((r) => (r.ok ? r.json() : null)),
      ]);
    })
      .then((result) => {
        if (!active || !result) return;
        const [subJson, plansJson] = result;
        if (subJson === null) {
          clearSessionUser();
          router.replace("/login?next=/subscription");
          return;
        }
        if (subJson?.viewer) setSessionUser(subJson.viewer);
        if (subJson) setSubData(subJson);
        if (plansJson?.plans) setPlans(plansJson.plans);
      })
      .catch((err) => {
        if (active) setError(err.message || "No se pudo cargar la informacion del plan");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBuy = async (plan) => {
    setBuying(plan);
    setError("");
    try {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo iniciar el pago");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err.message || "No se pudo iniciar el pago");
    } finally {
      setBuying("");
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("¿Cancelar suscripcion? Tu plan seguira activo hasta el final del periodo de facturacion.")) return;
    setCancelling(true);
    setError("");
    try {
      const response = await fetch("/api/subscription/cancel", { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo cancelar la suscripcion");
      setSubData((prev) => ({
        ...prev,
        subscription: { ...prev.subscription, cancelledAt: new Date().toISOString() },
      }));
      setBanner("cancel-pending");
    } catch (err) {
      setError(err.message || "No se pudo cancelar la suscripcion");
    } finally {
      setCancelling(false);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    setError("");
    try {
      const response = await fetch("/api/subscription/portal", { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo abrir el portal");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err.message || "No se pudo abrir el portal de facturacion");
    } finally {
      setPortalLoading(false);
    }
  };

  const currentPlan = subData?.subscription?.plan || "FREE";
  const stripeManaged = subData?.subscription?.stripeManaged || false;
  const usage = subData?.usage;
  const sub = subData?.subscription;

  return (
    <>
      <Head>
        <title>Plan y suscripcion | SEO Crawler</title>
        <link rel="stylesheet" href="/styles.css" />
      </Head>
      <AppShell
        activeKey="subscription"
        user={sessionUser}
        kicker="Cuenta / Suscripcion"
        title="Plan y suscripcion"
        description="Elige el plan que mejor se adapte a tu flujo de trabajo."
      >
        <div className="sub-page">
          {banner === "success" && (
            <div className="sub-banner success">
              <Icon name="check" size={16} />
              <span>Plan activado correctamente. Tu suscripcion ya esta vigente.</span>
              <button type="button" className="banner-close" onClick={() => setBanner("")}>x</button>
            </div>
          )}
          {banner === "cancelled" && (
            <div className="sub-banner cancelled">
              <Icon name="shield" size={16} />
              <span>Proceso de pago cancelado. No se realizo ningun cargo.</span>
              <button type="button" className="banner-close" onClick={() => setBanner("")}>x</button>
            </div>
          )}
          {banner === "cancel-pending" && (
            <div className="sub-banner cancelled">
              <Icon name="shield" size={16} />
              <span>Suscripcion cancelada. Tu plan seguira activo hasta el final del periodo de facturacion.</span>
              <button type="button" className="banner-close" onClick={() => setBanner("")}>x</button>
            </div>
          )}

          {error && <div className="sub-error">{error}</div>}

          {loading ? (
            <div className="sub-loading">Cargando informacion del plan...</div>
          ) : (
            <>
              {sub && (
                <Card className="sub-current">
                  <Eyebrow icon={<Icon name="run" size={12} />}>Estado actual</Eyebrow>
                  <div className="sub-current-grid">
                    <div className="sub-stat">
                      <span className="sub-stat-label">Plan activo</span>
                      <strong className="sub-stat-val">{PLAN_LABEL[currentPlan] || currentPlan}</strong>
                    </div>
                    <div className="sub-stat">
                      <span className="sub-stat-label">Proyectos</span>
                      <strong className="sub-stat-val">
                        {usage?.projects ?? 0} / {sub.maxProjects >= 999 ? "∞" : sub.maxProjects}
                      </strong>
                    </div>
                    <div className="sub-stat">
                      <span className="sub-stat-label">Rastreos este mes</span>
                      <strong className="sub-stat-val">
                        {usage?.crawlsThisMonth ?? 0} / {sub.maxCrawlsPerMonth >= 999 ? "∞" : sub.maxCrawlsPerMonth}
                      </strong>
                    </div>
                    <div className="sub-stat">
                      <span className="sub-stat-label">Paginas por rastreo</span>
                      <strong className="sub-stat-val">
                        {sub.maxPagesPerCrawl >= 9999 ? "∞" : sub.maxPagesPerCrawl}
                      </strong>
                    </div>
                  </div>
                  {stripeManaged && (
                    <div className="portal-row">
                      <Button
                        type="button"
                        variant="outline"
                        tone="secondary"
                        onClick={handlePortal}
                        loading={portalLoading}
                        iconLeft={<Icon name="settings" size={14} />}
                      >
                        Gestionar facturacion
                      </Button>
                    </div>
                  )}
                </Card>
              )}

              <div className="plans-grid">
                {plans.map((plan) => (
                  <PlanCard
                    key={plan.plan}
                    plan={plan}
                    currentPlan={currentPlan}
                    onBuy={handleBuy}
                    buying={buying}
                    stripeManaged={stripeManaged}
                    onPortal={handlePortal}
                    portalLoading={portalLoading}
                    onCancel={handleCancel}
                    cancelling={cancelling}
                    cancelledAt={sub?.cancelledAt}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <style jsx>{`
          .sub-page {
            display: grid;
            gap: 20px;
          }
          .sub-banner {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 600;
          }
          .sub-banner.success {
            background: rgba(0,255,136,0.10);
            border: 1px solid rgba(0,255,136,0.3);
            color: var(--accent);
          }
          .sub-banner.cancelled {
            background: rgba(248,113,113,0.08);
            border: 1px solid rgba(248,113,113,0.3);
            color: var(--error, #f87171);
          }
          .banner-close {
            margin-left: auto;
            background: none;
            border: none;
            cursor: pointer;
            color: inherit;
            font-size: 14px;
            padding: 0 4px;
          }
          .sub-error {
            padding: 12px 16px;
            border-radius: 12px;
            background: rgba(248,113,113,0.08);
            border: 1px solid rgba(248,113,113,0.3);
            color: var(--error, #f87171);
            font-size: 13px;
          }
          .sub-loading {
            color: var(--muted);
            font-size: 13px;
            padding: 24px 0;
          }
          .sub-current {
            display: grid;
            gap: 16px;
          }
          .sub-current-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
            gap: 12px;
          }
          .sub-stat {
            display: grid;
            gap: 4px;
            padding: 12px;
            border: 1px solid var(--border);
            border-radius: 12px;
            background: var(--bg3);
          }
          .sub-stat-label {
            font-size: 10px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--muted);
            font-weight: 600;
          }
          .sub-stat-val {
            font-size: 1.1rem;
            color: var(--text);
            font-variant-numeric: tabular-nums;
          }
          .portal-row {
            display: flex;
          }
          .plans-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            align-items: start;
          }
        `}</style>
      </AppShell>
    </>
  );
}
