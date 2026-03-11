import LanguageSwitcher from "./LanguageSwitcher";
import ThemeSwitcher from "./ThemeSwitcher";

export default function PreferenceToggles({
  lang,
  theme,
  onLangChange,
  onThemeChange,
}) {
  return (
    <>
      <LanguageSwitcher lang={lang} onChange={onLangChange} />
      <div className="hdiv" />
      <ThemeSwitcher lang={lang} theme={theme} onChange={onThemeChange} />
    </>
  );
}
