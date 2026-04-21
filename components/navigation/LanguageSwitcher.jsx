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
        <span
          className="lang-flag"
          aria-hidden="true"
          style={{ backgroundImage: "url(https://flagcdn.com/w20/mx.png)" }}
        />
      </button>
      <button
        type="button"
        className={`hbtn lang-btn${lang === "en" ? " on" : ""}`}
        onClick={() => onChange("en")}
        title="Inglés"
        aria-label="Cambiar a inglés"
      >
        <span
          className="lang-flag"
          aria-hidden="true"
          style={{ backgroundImage: "url(https://flagcdn.com/w20/us.png)" }}
        />
      </button>
    </div>
  );
}
