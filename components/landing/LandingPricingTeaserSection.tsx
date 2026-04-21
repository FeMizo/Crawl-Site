import Card from "../ui/Card";
import Eyebrow from "../ui/Eyebrow";
import Button from "../ui/Button";
import Icon from "../ui/Icon";

const TEASER_PLANS = [
  {
    label: "Gratis",
    price: null,
    accent: "#64b5f6",
    badge: "var(--text2)",
    badgeBg: "var(--bg3)",
    badgeBorder: "var(--border2)",
    highlights: ["1 proyecto", "50 páginas/rastreo", "1 rastreo/mes"],
  },
  {
    label: "Starter",
    price: 499,
    accent: "#4d8dff",
    badge: "#77abff",
    badgeBg: "rgba(77,141,255,0.10)",
    badgeBorder: "rgba(77,141,255,0.35)",
    highlights: ["5 proyectos", "500 páginas/rastreo", "10 rastreos/mes", "Reporte Excel"],
  },
  {
    label: "Pro",
    price: 1299,
    accent: "#00ff88",
    badge: "#00ff88",
    badgeBg: "rgba(0,255,136,0.08)",
    badgeBorder: "rgba(0,255,136,0.3)",
    highlights: ["20 proyectos", "2,000 páginas/rastreo", "Rastreos ilimitados", "Análisis de arquitectura"],
    popular: true,
  },
];

export default function LandingPricingTeaserSection() {
  return (
    <Card className="pricing-teaser-card">
      <Eyebrow icon={<Icon name="plan" size={12} />}>Planes</Eyebrow>
      <div className="teaser-grid">
        {TEASER_PLANS.map((plan) => (
          <div
            key={plan.label}
            className={`teaser-plan${plan.popular ? " popular" : ""}`}
            style={{ "--plan-accent": plan.accent } as React.CSSProperties}
          >
            <div className="teaser-header">
              <span
                className="teaser-badge"
                style={{ color: plan.badge, background: plan.badgeBg, borderColor: plan.badgeBorder }}
              >
                {plan.label}
              </span>
              {plan.popular && <span className="teaser-popular">Más popular</span>}
            </div>
            <div className="teaser-price">
              {plan.price === null ? (
                <span className="price-val">Gratis</span>
              ) : (
                <>
                  <span className="price-val">${plan.price.toLocaleString("es-MX")}</span>
                  <span className="price-unit"> MXN/mes</span>
                </>
              )}
            </div>
            <ul className="teaser-highlights">
              {plan.highlights.map((h) => (
                <li key={h}>
                  <Icon name="check" size={10} />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="teaser-cta">
        <Button href="/precios" variant="outline" tone="secondary" iconLeft={<Icon name="external" size={14} />}>
          Ver todos los planes
        </Button>
      </div>

      <style jsx>{`
        .pricing-teaser-card {
          display: grid;
          gap: 16px;
        }
        .teaser-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .teaser-plan {
          padding: 14px;
          border: 1px solid var(--border);
          border-radius: 14px;
          background: var(--bg2);
          display: grid;
          gap: 10px;
          align-content: start;
        }
        .teaser-plan.popular {
          border-color: var(--plan-accent);
          box-shadow: 0 0 0 1px var(--plan-accent) inset;
        }
        .teaser-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }
        .teaser-badge {
          display: inline-flex;
          align-items: center;
          min-height: 20px;
          padding: 0 8px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          border: 1px solid;
        }
        .teaser-popular {
          font-size: 9px;
          font-weight: 600;
          color: var(--plan-accent);
          letter-spacing: 0.06em;
        }
        .teaser-price {
          display: flex;
          align-items: baseline;
          gap: 2px;
          line-height: 1;
        }
        .price-val {
          font-family: "Syne", sans-serif;
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text);
        }
        .price-unit {
          font-size: 0.7rem;
          color: var(--muted);
          font-weight: 500;
        }
        .teaser-highlights {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 5px;
        }
        .teaser-highlights li {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: var(--text2);
        }
        .teaser-cta {
          display: flex;
          justify-content: flex-end;
        }
        @media (max-width: 560px) {
          .teaser-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Card>
  );
}
