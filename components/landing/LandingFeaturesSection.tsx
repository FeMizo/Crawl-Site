import Card from "../ui/Card";
import Eyebrow from "../ui/Eyebrow";
import Icon from "../ui/Icon";
import { motion } from "motion/react";

const FEATURES = [
  {
    icon: "external",
    title: "Errores 404",
    desc: "Detecta páginas rotas antes de que afecten tu ranking.",
  },
  {
    icon: "eye",
    title: "Páginas noindex",
    desc: "Identifica URLs excluidas del índice de búsqueda.",
  },
  {
    icon: "roadmap",
    title: "Redirecciones",
    desc: "Mapea cadenas de 301/302 que diluyen autoridad de enlace.",
  },
  {
    icon: "edit",
    title: "Metadatos faltantes",
    desc: "Encuentra títulos y descripciones vacíos o duplicados.",
  },
  {
    icon: "tasks",
    title: "Reporte Excel",
    desc: "Exporta todos los hallazgos a .xlsx para compartir o archivar.",
  },
  {
    icon: "history",
    title: "Historial de rastreos",
    desc: "Compara auditorías anteriores y mide tu progreso.",
  },
] as const;

export default function LandingFeaturesSection() {
  return (
    <Card className="features-card">
      <Eyebrow icon={<Icon name="shield" size={12} />}>Qué detecta el crawler</Eyebrow>
      <motion.div 
        className="features-grid"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1 } }
        }}
      >
        {FEATURES.map((f) => (
          <motion.div 
            key={f.title} 
            className="feature-item"
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
            }}
            whileHover={{ y: -2, scale: 1.02, transition: { duration: 0.2 } }}
          >
            <span className="feature-icon">
              <Icon name={f.icon} size={15} />
            </span>
            <div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <style jsx global>{`
        .features-card {
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow: hidden;
        }
        .features-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }
        .feature-item {
          flex: 1 1 calc(33.333% - 16px);
          min-width: 200px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        .feature-icon {
          flex-shrink: 0;
          margin-top: 1px;
          color: var(--accent);
          opacity: 0.85;
        }
        .feature-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 2px;
        }
        .feature-desc {
          font-size: 11px;
          color: var(--text2);
          line-height: 1.5;
        }
        @media (max-width: 640px) {
          .features-grid {
            flex-wrap: nowrap;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            padding-bottom: 8px;
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .features-grid::-webkit-scrollbar {
            display: none;
          }
          .feature-item {
            flex: 0 0 240px;
            scroll-snap-align: start;
          }
        }
      `}</style>
    </Card>
  );
}
