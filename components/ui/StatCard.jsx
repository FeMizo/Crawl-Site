import Card from "./Card";

export default function StatCard({ label, value, hint, tone = "primary", icon = null, className = "" }) {
  return (
    <Card className={["ui-stat-card", `ui-stat-${tone}`, className].filter(Boolean).join(" ")}>
      {icon ? <span className="ui-stat-icon">{icon}</span> : null}
      <span className="ui-stat-label">{label}</span>
      <strong className="ui-stat-value">{value}</strong>
      {hint ? <span className="ui-stat-hint">{hint}</span> : null}
    </Card>
  );
}
