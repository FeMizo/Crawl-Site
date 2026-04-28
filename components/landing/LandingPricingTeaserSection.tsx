import Card from "../ui/Card";
import Eyebrow from "../ui/Eyebrow";
import Button from "../ui/Button";
import Icon from "../ui/Icon";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PLANS, FEATURE_LABELS } = require("../../lib/plan-data");

const TEASER_KEYS = ["FREE", "STARTER", "PRO"];

function getHighlights(plan: any): string[] {
  const items: string[] = [];
  items.push(`${plan.maxProjects} proyecto${plan.maxProjects > 1 ? "s" : ""}`);
  items.push(`${plan.maxPagesPerCrawl.toLocaleString("es-MX")} páginas/rastreo`);
  items.push(plan.maxCrawlsPerMonth >= 999 ? "Rastreos ilimitados" : `${plan.maxCrawlsPerMonth} rastreo${plan.maxCrawlsPerMonth > 1 ? "s" : ""}/mes`);
  if (plan.features.length > 0) {
    items.push(FEATURE_LABELS[plan.features[0]] || plan.features[0]);
  }
  return items;
}

const TEASER_PLANS = (PLANS as any[])
  .filter((p: any) => TEASER_KEYS.includes(p.key))
  .map((p: any) => ({ ...p, popular: !!p.highlighted, highlights: getHighlights(p) }));

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
              {plan.highlights.map((h: string) => (
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
