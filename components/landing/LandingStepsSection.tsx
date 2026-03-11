import Card from "../ui/Card";
import QuickStepsModule from "../shared/QuickStepsModule";

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
    {
      title: text(content, "step1", "Crea tu cuenta para guardar proyectos y rastreos."),
      detail: "Accede a historial y configuracion de tu espacio.",
    },
    {
      title: text(content, "step2", "Registra la URL principal del sitio que quieres auditar."),
      detail: "El sistema crea el proyecto y prepara el analisis.",
    },
    {
      title: text(content, "step3", "Ejecuta el rastreo y revisa errores SEO con prioridad."),
      detail: "Filtra hallazgos y descarga reporte cuando termines.",
    },
  ].filter((step) => step.title);

  return (
    <Card className="steps-card">
      <QuickStepsModule title={title} steps={steps} />

      <style jsx>{`
        .steps-card {
          display: grid;
          gap: 10px;
        }
      `}</style>
    </Card>
  );
}
