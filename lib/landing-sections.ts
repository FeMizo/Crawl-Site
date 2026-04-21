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
      step1: "Crea tu cuenta e inicia sesion para habilitar tu espacio de trabajo.",
      step2: "Registra la URL principal del dominio que quieres auditar.",
      step3: "Lanza el rastreo, revisa hallazgos y guarda el historial.",
    },
  },
  {
    id: "landing-features",
    key: "features",
    label: "Qué detecta",
    order: 2,
    content: {},
  },
  {
    id: "landing-pricing-teaser",
    key: "pricing-teaser",
    label: "Planes (teaser)",
    order: 3,
    content: {},
  },
  {
    id: "landing-faq",
    key: "faq",
    label: "Preguntas frecuentes",
    order: 4,
    content: {},
  },
];

export function getLandingSections(): LandingSectionDto[] {
  return DEFAULT_LANDING_SECTIONS.map((section) => ({
    ...section,
    content: { ...section.content },
  }));
}
