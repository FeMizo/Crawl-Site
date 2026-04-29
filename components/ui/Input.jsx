import { useId, useState } from "react";
import Icon from "./Icon";

export default function Input({
  label,
  hint,
  className = "",
  inputClassName = "",
  allowPasswordToggle = true,
  id,
  type = "text",
  ...props
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const isPasswordField = type === "password" && allowPasswordToggle;
  const [revealed, setRevealed] = useState(false);
  const resolvedType = isPasswordField && revealed ? "text" : type;

  return (
    <>
      <label className={["ui-field", className].filter(Boolean).join(" ")} htmlFor={inputId}>
        {label ? <span className="ui-field-label">{label}</span> : null}
        <span className="ui-input-wrap">
          <input
            id={inputId}
            type={resolvedType}
            className={[
              "ui-input",
              isPasswordField ? "ui-input-with-toggle" : "",
              inputClassName,
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
          />
          {isPasswordField ? (
            <button
              type="button"
              className="ui-password-toggle"
              onClick={() => setRevealed((current) => !current)}
              aria-label={revealed ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={revealed}
            >
              <Icon name={revealed ? "eyeOff" : "eye"} size={18} />
            </button>
          ) : null}
        </span>
        {hint ? <span className="ui-field-hint">{hint}</span> : null}
      </label>
      <style jsx>{`
        .ui-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          min-width: 0;
        }
        .ui-input-wrap :global(.ui-input-with-toggle) {
          padding-right: 48px;
        }
        .ui-password-toggle {
          position: absolute;
          right: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: 0;
          border-radius: 999px;
          background: transparent;
          color: var(--text2);
          cursor: pointer;
          padding: 0;
        }
        .ui-password-toggle:hover {
          color: var(--text);
          background: rgba(255, 255, 255, 0.06);
        }
        .ui-password-toggle:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
      `}</style>
    </>
  );
}
