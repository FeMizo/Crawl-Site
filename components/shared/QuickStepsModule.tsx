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

export default function QuickStepsModule({
  title = "Pasos rapidos",
  steps,
  compact = false,
  className = "",
}: QuickStepsModuleProps) {
  return (
    <div className={["quick-steps-module", compact ? "compact" : "", className].filter(Boolean).join(" ")}>
      <div className="quick-steps-title">{title}</div>
      <div className="quick-steps-list">
        {steps.map((step, index) => (
          <div key={`${step.title}-${index}`} className="quick-step">
            <strong>{index + 1}</strong>
            <div>
              <span>{step.title}</span>
              {step.detail ? <small>{step.detail}</small> : null}
            </div>
          </div>
        ))}
      </div>

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
