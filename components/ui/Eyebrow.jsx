export default function Eyebrow({ icon = null, children, className = "" }) {
  return (
    <span className={["ui-eyebrow", className].filter(Boolean).join(" ")}>
      {icon ? <span className="ui-eyebrow-icon">{icon}</span> : null}
      <span>{children}</span>
    </span>
  );
}
