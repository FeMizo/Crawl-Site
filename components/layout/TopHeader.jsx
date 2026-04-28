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
  user,
}) {
  return (
    <header className="dashboard-top-header">
      <div className="header-breadcrumb">
        {eyebrow ? <div className="page-kicker">{eyebrow}</div> : null}
      </div>
      <div className="header-copy">
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
        {user ? <UserMenu user={user} /> : null}
      </div>
    </header>
  );
}
