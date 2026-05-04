import { motion } from "motion/react";

type QuickStep = {
  title: string;
  detail?: string;
};

type QuickStepsModuleProps = {
  title?: string;
  steps: QuickStep[];
  compact?: boolean;
  className?: string;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const stepVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 140, damping: 20 },
  },
};

const badgeVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 18, delay: 0.08 },
  },
};

export default function QuickStepsModule({
  title = "Pasos rapidos",
  steps,
  compact = false,
  className = "",
}: QuickStepsModuleProps) {
  return (
    <div className={["quick-steps-module", compact ? "compact" : "", className].filter(Boolean).join(" ")}>
      <div className="quick-steps-title">{title}</div>
      <motion.div
        className="quick-steps-list"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-30px" }}
      >
        {steps.map((step, index) => (
          <motion.div
            key={`${step.title}-${index}`}
            className="quick-step"
            variants={stepVariants}
          >
            <motion.strong variants={badgeVariants}>
              {index + 1}
            </motion.strong>
            <div>
              <span>{step.title}</span>
              {step.detail ? <small>{step.detail}</small> : null}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <style jsx>{`
        .quick-steps-module {
          display: grid;
          gap: 12px;
        }
        .quick-steps-title {
          color: var(--muted);
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }
        .quick-steps-list {
          display: grid;
          gap: 8px;
        }
        .quick-step {
          display: grid;
          grid-template-columns: 26px minmax(0, 1fr);
          gap: 10px;
          align-items: start;
          color: var(--text2);
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--bg);
          padding: 10px 12px;
          min-width: 0;
        }
        .quick-step strong {
          width: 26px;
          height: 26px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: rgba(77, 141, 255, 0.14);
          color: #77abff;
          font-size: 13px;
        }
        .quick-step div {
          min-width: 0;
          display: grid;
          gap: 4px;
        }
        .quick-step span {
          color: var(--text);
          overflow-wrap: anywhere;
        }
        .quick-step small {
          color: var(--text2);
          font-size: 12px;
          overflow-wrap: anywhere;
        }
        .compact .quick-step {
          padding: 8px 10px;
        }
      `}</style>
    </div>
  );
}
