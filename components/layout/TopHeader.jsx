import PreferenceToggles from "../navigation/PreferenceToggles";
import UserMenu from "./UserMenu";

export default function TopHeader({
  eyebrow,
  title,
  description,
  lang,
  theme,
  onLangChange,
  onThemeChange,
  actions,
  user,
}) {
  return (
    <header className="dashboard-top-header">
      <div className="header-copy">
        {eyebrow ? <div className="page-kicker">{eyebrow}</div> : null}
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
        {user ? <UserMenu user={user} /> : null}
      </div>
    </header>
  );
}
