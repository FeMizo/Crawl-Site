import PreferenceToggles from "../navigation/PreferenceToggles";

export default function TopHeader({
  eyebrow,
  title,
  description,
  lang,
  theme,
  onLangChange,
  onThemeChange,
  actions,
}) {
  return (
    <header className="dashboard-top-header">
      <div className="header-copy">
        <div className="page-kicker">{eyebrow}</div>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="hdr-r">
        <PreferenceToggles
          lang={lang}
          theme={theme}
          onLangChange={onLangChange}
          onThemeChange={onThemeChange}
        />
        {actions ? <div className="hdr-actions">{actions}</div> : null}
      </div>
    </header>
  );
}
