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

      <style jsx>{`
        .features-card {
          display: grid;
          gap: 16px;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }
        .feature-item {
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
        @media (max-width: 560px) {
          .features-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </Card>
  );
}
