const THEME_OPTIONS = [
  { id: "dark", label: "Oscuro" },
  { id: "light", label: "Claro" },
  { id: "hc-dark", label: "HC oscuro" },
  { id: "hc-light", label: "HC claro" },
];

export default function ThemeSwitcher({ theme, onChange }) {
  return (
    <div className="toolbar-block toolbar-themes">
      {THEME_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`hbtn${theme === option.id ? " on" : ""}`}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
