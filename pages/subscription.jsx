import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

function fmtDate(val) {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Eyebrow from "../components/ui/Eyebrow";
import Icon from "../components/ui/Icon";
import SubscriptionSkeleton from "../components/subscription/SubscriptionSkeleton";
import useSessionUser from "../hooks/useSessionUser";
import { FEATURE_LABELS, PLANS } from "../lib/plan-data";

import PlanCard from "../components/subscription/PlanCard";

function PlanCarousel({ plans, currentPlan, onChange, changing, stripeManaged, onPortal, portalLoading }) {
  const scrollRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const items = Array.from(el.children);
      const center = el.scrollLeft + el.clientWidth / 2;
      let closest = 0;
      let minDist = Infinity;
      items.forEach((item, i) => {
        const itemCenter = item.offsetLeft + item.offsetWidth / 2;
        const dist = Math.abs(center - itemCenter);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      setActiveIdx(closest);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [plans.length]);

  const scrollTo = (idx) => {
    const el = scrollRef.current;
    if (!el) return;
    const item = el.children[idx];
    if (item) item.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    setActiveIdx(idx);
  };

  return (
    <div className="plans-carousel-wrap">
      <div className="plans-grid">
        {plans.map((plan) => (
          <PlanCard
            key={plan.plan}
            plan={plan}
            currentPlan={currentPlan}
            onChange={onChange}
            changing={changing}
            stripeManaged={stripeManaged}
            onPortal={onPortal}
            portalLoading={portalLoading}
          />
        ))}
      </div>
      <div className="plans-carousel" ref={scrollRef}>
        {plans.map((plan) => (
          <div key={plan.plan} className="plans-carousel-item">
            <PlanCard
              plan={plan}
              currentPlan={currentPlan}
              onChange={onChange}
              changing={changing}
              stripeManaged={stripeManaged}
              onPortal={onPortal}
              portalLoading={portalLoading}
            />
          </div>
        ))}
      </div>
      <div className="plans-carousel-dots">
        {plans.map((_, i) => (
          <button
            key={i}
            type="button"
            className={"plans-dot" + (i === activeIdx ? " active" : "")}
            onClick={() => scrollTo(i)}
            aria-label={"Plan " + (i + 1)}
          />
        ))}
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  const router = useRouter();
  const { sessionUser, sessionHydrated, setSessionUser, clearSessionUser } = useSessionUser();
  const [subData, setSubData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [changing, setChanging] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);
  const [banner, setBanner] = useState("");
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!sessionHydrated) return undefined;
    if (!sessionUser) {
      router.replace("/login?next=/subscription");
      return undefined;
    }

    let active = true;
    if (!initialLoadDone.current) {
      setLoading(true);
    }

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
      }).catch(() => { })
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
        if (active) {
          setLoading(false);
          initialLoadDone.current = true;
        }
      });

    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionHydrated]);

  const handleChange = async (plan) => {
    const isFree = plan === "FREE";
    if (isFree && !window.confirm("¿Volver al plan gratuito? El cambio es inmediato y perdes el acceso a las funciones de pago.")) return;
    setChanging(plan);
    setError("");
    try {
      const response = await fetch("/api/subscription/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo cambiar el plan");
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      // Plan changed server-side — reload subscription data
      const subRes = await fetch("/api/subscription");
      const subJson = subRes.ok ? await subRes.json() : null;
      if (subJson) setSubData(subJson);
      setBanner("success");
    } catch (err) {
      setError(err.message || "No se pudo cambiar el plan");
    } finally {
      setChanging("");
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
  const inTrial = sub?.inTrial;
  const trialDaysLeft = sub?.trialDaysLeft ?? 0;
  const trialExpired = sub?.trialExpired;

  return (
    <>
      <Head>
        <title>Planes y precios | SEO Crawler</title>
        <meta name="description" content="Elige el plan de SEO Crawler que mejor se adapte a tu equipo: desde auditorías básicas hasta rastreos ilimitados con exportación de reportes Excel." />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_APP_URL || ""}/subscription`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_APP_URL || ""}/subscription`} />
        <meta property="og:title" content="Planes y precios | SEO Crawler" />
        <meta property="og:description" content="Elige el plan de SEO Crawler que mejor se adapte a tu equipo: desde auditorías básicas hasta rastreos ilimitados con exportación de reportes Excel." />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_APP_URL || ""}/assets/og-image.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Planes y precios | SEO Crawler" />
        <meta name="twitter:description" content="Elige el plan de SEO Crawler que mejor se adapte a tu equipo: desde auditorías básicas hasta rastreos ilimitados con exportación de reportes Excel." />
        <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_APP_URL || ""}/assets/og-image.png`} />
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
            <SubscriptionSkeleton />
          ) : (
            <>
              {sub && (
                <Card className="sub-current">
                  <Eyebrow icon={<Icon name="run" size={12} />}>Estado actual</Eyebrow>
                  {inTrial && (
                    <div className="trial-banner trial-active">
                      <Icon name="shield" size={14} />
                      <span>
                        <strong>Prueba gratuita activa</strong> — tienes acceso completo al plan Pro durante{" "}
                        {trialDaysLeft <= 1 ? "menos de 1 día" : `${trialDaysLeft} días más`}.
                      </span>
                    </div>
                  )}
                  {trialExpired && (
                    <div className="trial-banner trial-expired">
                      <Icon name="shield" size={14} />
                      <span>
                        <strong>Tu prueba gratuita terminó.</strong> Elige un plan para seguir usando todas las funciones.
                      </span>
                    </div>
                  )}
                  <div className="sub-current-grid">
                    <div className="sub-stat">
                      <span className="sub-stat-label">Plan activo</span>
                      <strong className="sub-stat-val">{PLANS.find(p => p.key === currentPlan)?.label || currentPlan}</strong>
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
                    <div className="sub-stat">
                      <span className="sub-stat-label">Inicio del plan</span>
                      <strong className="sub-stat-val">{fmtDate(sub.startedAt)}</strong>
                    </div>
                    <div className="sub-stat">
                      <span className="sub-stat-label">Ultima actualizacion</span>
                      <strong className="sub-stat-val">{fmtDate(sub.updatedAt)}</strong>
                    </div>
                    <div className="sub-stat">
                      <span className="sub-stat-label">Vencimiento</span>
                      <strong className="sub-stat-val">{fmtDate(sub.expiresAt)}</strong>
                    </div>
                    <div className="sub-stat">
                      <span className="sub-stat-label">Cancelacion</span>
                      <strong className="sub-stat-val" style={sub.cancelledAt ? { color: "var(--error, #f87171)" } : {}}>
                        {fmtDate(sub.cancelledAt)}
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

              <PlanCarousel
                plans={plans}
                currentPlan={currentPlan}
                onChange={handleChange}
                changing={changing}
                stripeManaged={stripeManaged}
                onPortal={handlePortal}
                portalLoading={portalLoading}
              />
            </>
          )}
        </div>

        <style jsx global>{`
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
          .trial-banner {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 13px;
            line-height: 1.5;
          }
          .trial-banner.trial-active {
            background: rgba(0,255,136,0.08);
            border: 1px solid rgba(0,255,136,0.28);
            color: var(--accent);
          }
          .trial-banner.trial-expired {
            background: rgba(245,158,11,0.08);
            border: 1px solid rgba(245,158,11,0.3);
            color: #fbbf24;
          }
          .trial-banner strong {
            color: inherit;
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
          /* PlanCarousel – desktop: grid; tablet/mobile: horizontal scroll-snap */
          .plans-carousel-wrap {
            display: contents;
          }
          .plans-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            align-items: start;
          }
          .plans-carousel {
            display: none; /* hidden on desktop */
          }
          @media (max-width: 900px) {
            .plans-grid {
              display: none;
            }
            .plans-carousel {
              display: flex;
              overflow-x: auto;
              scroll-snap-type: x mandatory;
              -webkit-overflow-scrolling: touch;
              gap: 16px;
              padding-bottom: 12px;
              /* hide scrollbar */
              scrollbar-width: none;
            }
            .plans-carousel::-webkit-scrollbar {
              display: none;
            }
            .plans-carousel-item {
              flex: 0 0 80%;
              max-width: 340px;
              scroll-snap-align: center;
            }
            .plans-carousel-dots {
              display: flex;
              justify-content: center;
              gap: 8px;
              margin-top: 14px;
            }
            .plans-dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: var(--border);
              border: none;
              padding: 0;
              cursor: pointer;
              transition: background 0.2s, transform 0.2s;
            }
            .plans-dot.active {
              background: var(--accent);
              transform: scale(1.3);
            }
          }
          @media (max-width: 480px) {
            .plans-carousel-item {
              flex: 0 0 88%;
            }
          }
        `}</style>
      </AppShell>
    </>
  );
}
