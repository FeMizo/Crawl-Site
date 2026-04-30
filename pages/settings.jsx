import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Eyebrow from "../components/ui/Eyebrow";
import Icon from "../components/ui/Icon";
import Input from "../components/ui/Input";
import PhoneField from "../components/ui/PhoneField";
import Select from "../components/ui/Select";
import useSessionUser from "../hooks/useSessionUser";
import { tUi, useUiLanguage } from "../lib/ui-language";

const { validatePhoneInput } = require("../lib/contact-validation");

const LANG_OPTIONS = [
  { value: "es", label: "Espanol" },
  { value: "en", label: "Inglés" },
];

const THEME_OPTIONS = [
  { value: "dark", label: "Oscuro" },
  { value: "light", label: "Claro" },
  { value: "hc-dark", label: "Alto contraste oscuro" },
  { value: "hc-light", label: "Alto contraste claro" },
];

export default function SettingsPage() {
  const router = useRouter();
  const lang = useUiLanguage();
  const t = (key) => tUi(lang, key);
  const { sessionUser, setSessionUser, clearSessionUser } = useSessionUser();
  const [counts, setCounts] = useState({ projects: 0, crawlRuns: 0 });
  const [name, setName] = useState(() => sessionUser?.name || "");
  const [phoneCountry, setPhoneCountry] = useState("MX");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [language, setLanguage] = useState("es");
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me?includeCounts=1")
      .then(async (response) => {
        if (response.status === 401) {
          clearSessionUser();
          router.replace("/login?next=/settings");
          return null;
        }
        const data = await response.json();
        if (!active || !data?.user) return null;
        setSessionUser(data.user || null);
        setName(data.user.name || "");
        setPhoneCountry(data.user.phoneCountry || "MX");
        setPhoneNumber(data.user.phoneNumber || "");
        setCounts(data.counts || { projects: 0, crawlRuns: 0 });
        return data;
      })
      .catch(() => {});

    const savedLang = window.localStorage.getItem("seoCrawlerLang") || "es";
    const savedTheme = window.localStorage.getItem("seoCrawlerTheme") || "dark";
    setLanguage(savedLang);
    setTheme(savedTheme);

    return () => {
      active = false;
    };
  }, [clearSessionUser, router, setSessionUser]);

  const applyLanguage = (nextLanguage) => {
    setLanguage(nextLanguage);
    document.documentElement.lang = nextLanguage;
    window.localStorage.setItem("seoCrawlerLang", nextLanguage);
    if (typeof window.setLang === "function") {
      try {
        window.setLang(nextLanguage);
      } catch {}
    }
  };

  const applyTheme = (nextTheme) => {
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    window.localStorage.setItem("seoCrawlerTheme", nextTheme);
    if (typeof window.setTheme === "function") {
      try {
        window.setTheme(nextTheme);
      } catch {}
    }
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileMessage("");
    setProfileError("");
    const normalizedName = name.trim();
    if (!normalizedName) {
      setProfileError(t("errEnterUsername"));
      return;
    }
    const phone = validatePhoneInput(phoneCountry, phoneNumber, {
      required: false,
    });
    if (!phone.ok) {
      setProfileError(phone.error);
      return;
    }

    setProfileSubmitting(true);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: normalizedName, phoneCountry, phoneNumber }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "No se pudo actualizar el perfil.");
      }
      setSessionUser(data.user || null);
      setName(data.user?.name || normalizedName);
      setProfileMessage(t("profileSaved"));
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "No se pudo actualizar el perfil.",
      );
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError(t("errPasswordFields"));
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError(t("errNewPasswordLength"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t("errPasswordMatch"));
      return;
    }

    setPasswordSubmitting(true);
    try {
      const response = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "No se pudo actualizar la contrasena.");
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage(t("passwordUpdated"));
    } catch (err) {
      setPasswordError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la contrasena.",
      );
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Ajustes | SEO Crawler</title>
        <meta name="description" content="Configura tu cuenta de SEO Crawler: actualiza tus datos personales, gestiona notificaciones y administra tu suscripción activa." />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_APP_URL || ""}/settings`} />
      </Head>
      <AppShell
        activeKey="settings"
        user={sessionUser}
        kicker={t("settingsKicker")}
        title={t("settingsPageTitle")}
        description={t("settingsPageDesc")}
        actions={
          sessionUser?.permissions?.canManageUsers ? (
            <Button href="/admin/users" variant="outline" tone="secondary" iconLeft={<Icon name="users" size={15} />}>
              {t("btnManageUsers")}
            </Button>
          ) : null
        }
      >
        <div className="settings-grid">
          <Card
            as="form"
            className="settings-card"
            onSubmit={handleProfileSubmit}
          >
            <Eyebrow icon={<Icon name="user" size={12} />}>{t("eyebrowProfile")}</Eyebrow>
            <Input label={t("labelEmail")} value={sessionUser?.email || ""} disabled readOnly />
            <Input label={t("labelRole")} value={sessionUser?.roleLabel || ""} disabled readOnly />
            <Input
              label={t("labelUsername")}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={80}
            />
            <PhoneField
              label={t("labelPhone")}
              country={phoneCountry}
              phone={phoneNumber}
              onCountryChange={setPhoneCountry}
              onPhoneChange={setPhoneNumber}
              hint={t("hintPhoneOptional")}
            />
            {profileError ? (
              <p className="feedback error">{profileError}</p>
            ) : null}
            {profileMessage ? (
              <p className="feedback ok">{profileMessage}</p>
            ) : null}
            <Button
              type="submit"
              variant="solid"
              tone="primary"
              loading={profileSubmitting}
              iconLeft={<Icon name="edit" size={14} />}
            >
              {t("btnSaveProfile")}
            </Button>
          </Card>

          <Card className="settings-card">
            <Eyebrow icon={<Icon name="settings" size={12} />}>{t("eyebrowPreferences")}</Eyebrow>
            <Select
              label={t("labelDefaultLang")}
              value={language}
              onChange={(event) => applyLanguage(event.target.value)}
            >
              {LANG_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select
              label={t("labelDefaultTheme")}
              value={theme}
              onChange={(event) => applyTheme(event.target.value)}
            >
              {THEME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <div className="meta-grid">
              <div>
                <strong>{counts.projects || 0}</strong>
                <span>{t("statProjectsLabel")}</span>
              </div>
              <div>
                <strong>{counts.crawlRuns || 0}</strong>
                <span>{t("statCrawlsLabel")}</span>
              </div>
            </div>
          </Card>

          <Card
            as="form"
            className="settings-card"
            onSubmit={handlePasswordSubmit}
          >
            <Eyebrow icon={<Icon name="shield" size={12} />}>{t("eyebrowSecurity")}</Eyebrow>
            <Input
              label={t("labelCurrentPassword")}
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
            <Input
              label={t("labelNewPassword")}
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={8}
              required
            />
            <Input
              label={t("labelConfirmPassword")}
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              required
            />
            {passwordError ? (
              <p className="feedback error">{passwordError}</p>
            ) : null}
            {passwordMessage ? (
              <p className="feedback ok">{passwordMessage}</p>
            ) : null}
            <Button
              type="submit"
              variant="solid"
              tone="primary"
              loading={passwordSubmitting}
              iconLeft={<Icon name="shield" size={14} />}
            >
              {t("btnUpdatePassword")}
            </Button>
          </Card>
        </div>

        <style jsx>{`
          .settings-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 18px;
            min-width: 0;
            align-items: stretch;
            align-content: start;
          }
          .settings-card {
            display: grid;
            gap: 14px;
            min-width: 0;
          }
          .feedback {
            margin: 0;
          }
          .feedback.error {
            color: var(--error);
          }
          .feedback.ok {
            color: var(--ok);
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            margin-top: 8px;
          }
          .meta-grid div {
            border: 1px solid var(--border);
            border-radius: 12px;
            background: var(--bg3);
            padding: 12px;
            display: grid;
            gap: 4px;
          }
          .meta-grid strong {
            font-size: 1.2rem;
            line-height: 1;
          }
          .meta-grid span {
            color: var(--muted);
            font-size: 12px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
        `}</style>
      </AppShell>
    </>
  );
}
