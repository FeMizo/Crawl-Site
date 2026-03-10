import Button from "../ui/Button";
import Card from "../ui/Card";
import Icon from "../ui/Icon";
import Input from "../ui/Input";

type LandingHeroSectionProps = {
  content: Record<string, unknown>;
  url: string;
  submitting: boolean;
  onUrlChange: (value: string) => void;
  onSubmit: () => void;
};

function text(content: Record<string, unknown>, key: string, fallback: string): string {
  const value = content[key];
  if (typeof value !== "string") return fallback;
  return value.trim() || fallback;
}

export default function LandingHeroSection({
  content,
  url,
  submitting,
  onUrlChange,
  onSubmit,
}: LandingHeroSectionProps) {
  const eyebrow = text(content, "eyebrow", "URL inicial");
  const title = text(content, "title", "Define la URL principal de tu sitio y lanza el rastreo");
  const description = text(
    content,
    "description",
    "El sistema crea tu proyecto, inicia el rastreo y te lleva al dashboard con resultados listos para revisar.",
  );
  const urlLabel = text(content, "urlLabel", "URL del sitio a analizar");
  const urlPlaceholder = text(content, "urlPlaceholder", "https://www.tu-sitio.com");
  const ctaLabel = text(content, "ctaLabel", "Crear y analizar");

  return (
    <Card className="hero-card">
      <div className="hero-copy">
        <div className="eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="hero-form">
        <Input
          label={urlLabel}
          type="url"
          value={url}
          onChange={(event) => onUrlChange(event.target.value)}
          placeholder={urlPlaceholder}
        />
        <Button
          type="button"
          variant="solid"
          tone="primary"
          size="lg"
          onClick={onSubmit}
          loading={submitting}
          iconLeft={<Icon name="dashboard" size={16} />}
        >
          {ctaLabel}
        </Button>
      </div>

      <style jsx>{`
        .hero-card {
          background: linear-gradient(180deg, rgba(18, 36, 66, 0.95), rgba(12, 25, 48, 0.95));
          display: grid;
          gap: 18px;
        }
        .hero-copy {
          min-width: 0;
        }
        .hero-copy h2 {
          font-family: "Syne", "Manrope", sans-serif;
          font-weight: 700;
          font-size: clamp(1.45rem, 2.2vw, 2.05rem);
          line-height: 1.04;
          margin: 0 0 12px;
          overflow-wrap: anywhere;
        }
        .hero-copy p {
          margin: 0;
          color: var(--text2);
          overflow-wrap: anywhere;
        }
        .eyebrow {
          color: var(--muted);
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .hero-form {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 14px;
          align-items: end;
          min-width: 0;
        }
        @media (max-width: 680px) {
          .hero-form {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Card>
  );
}
