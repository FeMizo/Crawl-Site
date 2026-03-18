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
        <span className="ui-phone-row">
          <span className="ui-phone-country">
            <select
              id={`${generatedId}-country`}
              className="ui-select ui-phone-country-select"
              value={selectedCountry.code}
              disabled={disabled}
              onChange={(event) => onCountryChange?.(event.target.value)}
            >
              {PHONE_COUNTRIES.map((option) => (
                <option key={option.code} value={option.code}>
                  {`${option.flag} ${option.label} (${option.prefix})`}
                </option>
              ))}
            </select>
          </span>
          <span className="ui-phone-input-wrap">
            <span className="ui-phone-prefix" aria-hidden="true">
              {selectedCountry.flag} {selectedCountry.prefix}
            </span>
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
        .ui-phone-row {
          display: grid;
          grid-template-columns: minmax(132px, 188px) minmax(0, 1fr);
          gap: 10px;
          min-width: 0;
        }
        .ui-phone-country,
        .ui-phone-input-wrap {
          min-width: 0;
        }
        .ui-phone-country-select {
          width: 100%;
        }
        .ui-phone-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
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
          padding-left: 88px;
        }
        @media (max-width: 640px) {
          .ui-phone-row {
            grid-template-columns: 1fr;
          }
          .ui-phone-input {
            padding-left: 92px;
          }
        }
      `}</style>
    </>
  );
}
