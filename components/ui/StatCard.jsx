import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import Card from "./Card";

function parseNumericValue(raw) {
  if (typeof raw === "number") return { prefix: "", num: raw, suffix: "" };
  if (typeof raw !== "string") return null;
  const m = raw.match(/^([^\d]*?)(\d[\d,.]*)(.*)$/);
  if (!m) return null;
  return {
    prefix: m[1],
    num: parseInt(m[2].replace(/[,.]/g, ""), 10),
    suffix: m[3],
  };
}

function AnimatedValue({ value }) {
  const parsed = parseNumericValue(value);
  const [count, setCount] = useState(0);
  const [active, setActive] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active || !parsed) return;
    const duration = 1200;
    let startTs = null;
    let rafId;
    const step = (ts) => {
      if (!startTs) startTs = ts;
      const progress = Math.min((ts - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * parsed.num));
      if (progress < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!parsed) {
    return <strong className="ui-stat-value" title={String(value)}>{value}</strong>;
  }

  return (
    <strong ref={ref} className="ui-stat-value" title={String(value)}>
      {parsed.prefix}{count}{parsed.suffix}
    </strong>
  );
}

const statVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 140, damping: 20 },
  },
};

export default function StatCard({ label, value, hint, tone = "primary", icon = null, className = "" }) {
  return (
    <Card className={["ui-stat-card", `ui-stat-${tone}`, className].filter(Boolean).join(" ")}>
      <motion.div
        className="ui-stat-inner"
        variants={statVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-20px" }}
      >
        {icon ? <span className="ui-stat-icon">{icon}</span> : null}
        <span className="ui-stat-label">{label}</span>
        <AnimatedValue value={value} />
        {hint ? <span className="ui-stat-hint">{hint}</span> : null}
      </motion.div>
    </Card>
  );
}
