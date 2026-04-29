import { useEffect, useRef, useState } from "react";

const LANG_OPTIONS = [
  { id: "es", label: "Español", flag: "https://flagcdn.com/w20/mx.png" },
  { id: "en", label: "English", flag: "https://flagcdn.com/w20/us.png" },
];

const THEME_OPTIONS = [
  { id: "dark", icon: "🌙", label: { es: "Oscuro", en: "Dark" } },
  { id: "light", icon: "☀️", label: { es: "Claro", en: "Light" } },
  { id: "hc-dark", icon: "🌑", label: { es: "HC oscuro", en: "HC dark" } },
  { id: "hc-light", icon: "🔆", label: { es: "HC claro", en: "HC light" } },
];

export default function PreferenceToggles({ lang, theme, onLangChange, onThemeChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const locale = lang === "en" ? "en" : "es";

  const currentLang = LANG_OPTIONS.find((l) => l.id === lang) || LANG_OPTIONS[0];
  const currentTheme = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    function onMouse(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onMouse);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouse);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="pref-wrap" ref={ref}>
      <button
        type="button"
        className="pref-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Preferencias de idioma y tema"
      >
        <span
          className="pref-flag"
          aria-hidden="true"
          style={{ backgroundImage: `url(${currentLang.flag})` }}
        />
        <span className="pref-pipe" aria-hidden="true" />
        <span className="pref-theme-icon" aria-hidden="true">{currentTheme.icon}</span>
        <span
          className="pref-chevron"
          aria-hidden="true"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="pref-dropdown" role="dialog" aria-label="Preferencias">
          <div className="pref-section-label">{locale === "es" ? "Idioma" : "Language"}</div>
          <div className="pref-options">
            {LANG_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`pref-option${lang === opt.id ? " on" : ""}`}
                aria-pressed={lang === opt.id}
                onClick={() => { onLangChange(opt.id); setOpen(false); }}
              >
                <span
                  className="pref-flag"
                  aria-hidden="true"
                  style={{ backgroundImage: `url(${opt.flag})` }}
                />
                {opt.label}
              </button>
            ))}
          </div>

          <div className="pref-sep" />

          <div className="pref-section-label">{locale === "es" ? "Tema" : "Theme"}</div>
          <div className="pref-options">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`pref-option${theme === opt.id ? " on" : ""}`}
                aria-pressed={theme === opt.id}
                onClick={() => { onThemeChange(opt.id); setOpen(false); }}
              >
                <span aria-hidden="true">{opt.icon}</span>
                {opt.label[locale]}
              </button>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .pref-wrap {
          position: relative;
          z-index: 50;
        }
        .pref-trigger {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: var(--bg3);
          border: 1px solid var(--border2);
          border-radius: 10px;
          color: var(--text2);
          padding: 7px 11px;
          font-size: 13px;
          font-family: "Manrope", sans-serif;
          font-weight: 700;
          cursor: pointer;
          transition: border-color 0.18s, color 0.18s, background 0.18s;
        }
        .pref-trigger:hover,
        .pref-trigger[aria-expanded="true"] {
          border-color: var(--accent);
          color: var(--accent);
          background: var(--adim);
        }
        .pref-trigger:active {
          transform: scale(0.97);
        }
        .pref-trigger:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        .pref-flag {
          display: inline-block;
          width: 20px;
          height: 14px;
          background-size: cover;
          background-position: center;
          border-radius: 2px;
          flex: 0 0 auto;
        }
        .pref-pipe {
          width: 1px;
          height: 14px;
          background: var(--border2);
          flex: 0 0 auto;
        }
        .pref-theme-icon {
          font-size: 13px;
          line-height: 1;
        }
        .pref-chevron {
          display: inline-flex;
          align-items: center;
          flex: 0 0 auto;
          transition: transform 0.18s;
          opacity: 0.55;
        }
        @keyframes pref-in {
          from { opacity: 0; transform: translateY(-5px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        .pref-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          min-width: 175px;
          background: var(--bg2);
          border: 1px solid var(--border2);
          border-radius: 14px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.32);
          animation: pref-in 0.14s ease-out both;
          transform-origin: top right;
        }
        .pref-section-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text3);
          padding: 4px 8px 2px;
        }
        .pref-options {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .pref-option {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 8px 10px;
          border-radius: 8px;
          font-size: 13px;
          font-family: "Manrope", sans-serif;
          font-weight: 700;
          color: var(--text2);
          border: none;
          background: transparent;
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: background 0.13s, color 0.13s;
        }
        .pref-option:hover {
          background: var(--bg3);
          color: var(--text);
        }
        .pref-option.on {
          color: var(--accent);
          background: var(--adim);
        }
        .pref-sep {
          height: 1px;
          background: var(--border2);
          margin: 4px 2px;
        }
      `}</style>
    </div>
  );
}
