import Card from "../ui/Card";
import Icon from "../ui/Icon";

type LandingStepsSectionProps = {
  content: Record<string, unknown>;
};

function text(content: Record<string, unknown>, key: string, fallback: string): string {
  const value = content[key];
  if (typeof value !== "string") return fallback;
  return value.trim() || fallback;
}

export default function LandingStepsSection({ content }: LandingStepsSectionProps) {
  const title = text(content, "title", "Pasos rapidos");
  const steps = [
    text(content, "step1", "Crea tu cuenta para guardar proyectos y rastreos."),
    text(content, "step2", "Registra la URL principal del sitio que quieres auditar."),
    text(content, "step3", "Ejecuta el rastreo y revisa errores SEO con prioridad."),
  ].filter(Boolean);

  return (
    <Card className="steps-card">
      <div className="eyebrow">
        <Icon name="roadmap" size={12} />
        {title}
      </div>
      <div className="steps-grid">
        {steps.map((step, index) => (
          <div key={`${step}-${index}`} className="step-item">
            <strong>{index + 1}</strong>
            <span>{step}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .steps-card {
          display: grid;
          gap: 14px;
        }
        .eyebrow {
          color: var(--muted);
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 10px;
        }
        .step-item {
          display: grid;
          grid-template-columns: 26px 1fr;
          gap: 10px;
          align-items: center;
          color: var(--text2);
          border: 1px solid var(--border);
          border-radius: 14px;
          background: var(--bg);
          padding: 12px;
        }
        .step-item strong {
          width: 26px;
          height: 26px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: rgba(77, 141, 255, 0.14);
          color: #77abff;
        }
      `}</style>
    </Card>
  );
}
