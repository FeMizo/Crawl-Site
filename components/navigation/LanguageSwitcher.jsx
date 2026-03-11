export default function LanguageSwitcher({ lang, onChange }) {
  return (
    <div className="toolbar-block">
      <button
        type="button"
        className={`hbtn lang-btn${lang === "es" ? " on" : ""}`}
        onClick={() => onChange("es")}
        title="Espanol"
        aria-label="Cambiar a espanol"
      >
        <span className="lang-emoji" aria-hidden="true">🇲🇽</span>
      </button>
      <button
        type="button"
        className={`hbtn lang-btn${lang === "en" ? " on" : ""}`}
        onClick={() => onChange("en")}
        title="English"
        aria-label="Switch to English"
      >
        <span className="lang-emoji" aria-hidden="true">🇺🇸</span>
      </button>
    </div>
  );
}
