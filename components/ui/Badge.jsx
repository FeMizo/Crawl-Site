export default function Badge({ tone = "secondary", children, className = "" }) {
  return (
    <span className={["ui-badge", `ui-badge-${tone}`, className].filter(Boolean).join(" ")}>
      {children}
    </span>
  );
}
