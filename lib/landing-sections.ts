import type { LandingSectionDto } from "../types/landing";

const DEFAULT_LANDING_SECTIONS: LandingSectionDto[] = [
  {
    id: "landing-hero",
    key: "hero",
    label: "Hero principal",
    order: 0,
    content: {
      eyebrow: "URL inicial",
      title: "Define la URL principal de tu sitio y lanza el rastreo",
      description:
        "El sistema crea tu proyecto, inicia el rastreo y te lleva al dashboard con resultados listos para revisar.",
      urlLabel: "URL del sitio a analizar",
      urlPlaceholder: "https://www.tu-sitio.com",
      ctaLabel: "Crear y analizar",
    },
  },
  {
    id: "landing-steps",
    key: "steps",
    label: "Pasos rapidos",
    order: 1,
    content: {
      title: "Pasos rapidos",
      step1: "Crea tu cuenta para guardar proyectos y rastreos.",
      step2: "Registra la URL principal del sitio que quieres auditar.",
      step3: "Ejecuta el rastreo y revisa errores SEO con prioridad.",
    },
  },
];

export function getLandingSections(): LandingSectionDto[] {
  return DEFAULT_LANDING_SECTIONS.map((section) => ({
    ...section,
    content: { ...section.content },
  }));
}
