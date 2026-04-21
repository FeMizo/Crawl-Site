import Card from "../ui/Card";
import Eyebrow from "../ui/Eyebrow";
import Icon from "../ui/Icon";

const FAQ = [
  {
    q: "¿Necesito registrarme para rastrear?",
    a: "Puedes probar con una URL directamente desde esta página. Para guardar proyectos y ver historial necesitas una cuenta gratuita.",
  },
  {
    q: "¿Cuántas páginas analiza el crawler?",
    a: "El plan gratuito analiza hasta 50 páginas por rastreo. Los planes de pago van desde 300 hasta 10,000 páginas por ejecución.",
  },
  {
    q: "¿Qué errores detecta?",
    a: "Errores 404, páginas con noindex, redirecciones 301/302, títulos y meta descriptions faltantes o duplicados.",
  },
  {
    q: "¿Con qué frecuencia puedo rastrear?",
    a: "El plan gratuito permite 1 rastreo al mes. Starter incluye 10/mes y Pro permite rastreos ilimitados.",
  },
];

export default function LandingFaqSection() {
  return (
    <Card className="faq-card">
      <Eyebrow icon={<Icon name="history" size={12} />}>Preguntas frecuentes</Eyebrow>
      <div className="faq-list">
        {FAQ.map((item) => (
          <div key={item.q} className="faq-item">
            <h3>{item.q}</h3>
            <p>{item.a}</p>
          </div>
        ))}
      </div>

      <style jsx>{`
        .faq-card {
          display: grid;
          gap: 16px;
        }
        .faq-list {
          display: grid;
          gap: 14px;
        }
        .faq-item h3 {
          font-family: "Syne", "Manrope", sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          margin: 0 0 4px;
          color: var(--text);
        }
        .faq-item p {
          margin: 0;
          font-size: 12px;
          color: var(--text2);
          line-height: 1.6;
        }
      `}</style>
    </Card>
  );
}
