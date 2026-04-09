import { useId } from "react";

const {
  PHONE_COUNTRIES,
  getPhoneCountry,
  normalizePhoneDigits,
} = require("../../lib/contact-validation");

export default function PhoneField({
  label,
  hint,
  className = "",
  country,
  phone,
  onCountryChange,
  onPhoneChange,
  required = false,
  disabled = false,
}) {
  const generatedId = useId();
  const selectedCountry = getPhoneCountry(country) || PHONE_COUNTRIES[0];

  return (
    <>
      <label
        className={["ui-field", className].filter(Boolean).join(" ")}
        htmlFor={`${generatedId}-phone`}
      >
        {label ? <span className="ui-field-label">{label}</span> : null}
        <span className="ui-phone-shell">
          <span className="ui-phone-country-wrap">
            <select
              id={`${generatedId}-country`}
              className="ui-phone-country-select"
              value={selectedCountry.code}
              disabled={disabled}
              onChange={(event) => onCountryChange?.(event.target.value)}
            >
              {PHONE_COUNTRIES.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
            <span
              className="ui-phone-country-flag"
              aria-hidden="true"
              style={{
                backgroundImage: `url(https://flagcdn.com/w20/${selectedCountry.code.toLowerCase()}.png)`,
              }}
            />
          </span>
          <span className="ui-phone-input-wrap">
            <input
              id={`${generatedId}-phone`}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              className="ui-input ui-phone-input"
              placeholder={selectedCountry.placeholder}
              value={phone}
              disabled={disabled}
              required={required}
              onChange={(event) =>
                onPhoneChange?.(normalizePhoneDigits(event.target.value))
              }
            />
          </span>
        </span>
        {hint ? <span className="ui-field-hint">{hint}</span> : null}
      </label>
      <style jsx>{`
        .ui-phone-shell {
          min-height: 50px;
          display: grid;
          grid-template-columns: minmax(108px, 122px) minmax(0, 1fr);
          min-width: 0;
          border-radius: var(--radius-control);
          border: 1px solid var(--border2);
          background: var(--bg3);
          overflow: hidden;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            transform 0.2s ease;
        }
        .ui-phone-shell:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 4px var(--adim);
        }
        .ui-phone-country-wrap,
        .ui-phone-input-wrap {
          min-width: 0;
        }
        .ui-phone-country-wrap {
          position: relative;
          border-right: 1px solid var(--border2);
          background:
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.04),
              rgba(255, 255, 255, 0.01)
            ),
            var(--bg3);
        }
        .ui-phone-country-select {
          width: 100%;
          height: 100%;
          border: 0;
          background: transparent;
          color: var(--text);
          padding: 0 34px 0 38px;
          outline: none;
          font-size: 14px;
          appearance: none;
          cursor: pointer;
        }
        .ui-phone-country-select option {
          color: #0f172a;
          background: #f8fafc;
        }
        .ui-phone-country-wrap::after {
          content: "";
          position: absolute;
          top: 50%;
          right: 14px;
          width: 8px;
          height: 8px;
          border-right: 1.8px solid currentColor;
          border-bottom: 1.8px solid currentColor;
          color: var(--text2);
          transform: translateY(-65%) rotate(45deg);
          pointer-events: none;
        }
        .ui-phone-country-flag {
          position: absolute;
          left: 14px;
          top: 50%;
          width: 18px;
          height: 12px;
          border-radius: 2px;
          background-color: var(--bg4);
          background-position: center;
          background-size: cover;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
          transform: translateY(-50%);
          pointer-events: none;
        }
        .ui-phone-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          min-height: 48px;
        }
        .ui-phone-prefix {
          position: absolute;
          left: 14px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--text2);
          font-size: 0.92rem;
          pointer-events: none;
          white-space: nowrap;
        }
        .ui-phone-input {
          height: 100%;
          border: 0;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
        }
        .ui-phone-input:focus {
          border: 0;
          box-shadow: none;
        }
        @media (max-width: 640px) {
          .ui-phone-shell {
            grid-template-columns: minmax(88px, 102px) minmax(0, 1fr);
          }
          .ui-phone-input {
            padding-left: 92px;
          }
        }
      `}</style>
    </>
  );
}
