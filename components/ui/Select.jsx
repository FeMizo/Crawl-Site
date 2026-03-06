export default function Select({
  label,
  hint,
  className = "",
  selectClassName = "",
  children,
  ...props
}) {
  return (
    <label className={["ui-field", className].filter(Boolean).join(" ")}>
      {label ? <span className="ui-field-label">{label}</span> : null}
      <select className={["ui-select", selectClassName].filter(Boolean).join(" ")} {...props}>
        {children}
      </select>
      {hint ? <span className="ui-field-hint">{hint}</span> : null}
    </label>
  );
}
