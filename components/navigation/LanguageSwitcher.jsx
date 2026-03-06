export default function LanguageSwitcher({ lang, onChange }) {
  return (
    <div className="toolbar-block">
      <button
        type="button"
        className={`hbtn lang-btn${lang === "es" ? " on" : ""}`}
        onClick={() => onChange("es")}
      >
        ES
      </button>
      <button
        type="button"
        className={`hbtn lang-btn${lang === "en" ? " on" : ""}`}
        onClick={() => onChange("en")}
      >
        EN
      </button>
    </div>
  );
}
