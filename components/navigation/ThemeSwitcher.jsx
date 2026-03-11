const THEME_OPTIONS = [
  { id: "dark", icon: "🌙", label: { es: "Oscuro", en: "Dark" } },
  { id: "light", icon: "☀️", label: { es: "Claro", en: "Light" } },
  { id: "hc-dark", icon: "🌑", label: { es: "HC oscuro", en: "HC dark" } },
  { id: "hc-light", icon: "🔆", label: { es: "HC claro", en: "HC light" } },
];

export default function ThemeSwitcher({ theme, lang, onChange }) {
  const locale = lang === "en" ? "en" : "es";

  return (
    <div className="toolbar-block toolbar-themes">
      {THEME_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`hbtn${theme === option.id ? " on" : ""}`}
          onClick={() => onChange(option.id)}
          title={option.label[locale]}
          aria-label={option.label[locale]}
        >
          <span className="theme-emoji" aria-hidden="true">{option.icon}</span>
        </button>
      ))}
    </div>
  );
}
