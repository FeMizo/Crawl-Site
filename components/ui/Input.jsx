export default function Input({
  label,
  hint,
  className = "",
  inputClassName = "",
  ...props
}) {
  return (
    <label className={["ui-field", className].filter(Boolean).join(" ")}>
      {label ? <span className="ui-field-label">{label}</span> : null}
      <input className={["ui-input", inputClassName].filter(Boolean).join(" ")} {...props} />
      {hint ? <span className="ui-field-hint">{hint}</span> : null}
    </label>
  );
}
