import Head from "next/head";
import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Eyebrow from "../components/ui/Eyebrow";
import Icon from "../components/ui/Icon";
import Input from "../components/ui/Input";
import PhoneField from "../components/ui/PhoneField";
import Select from "../components/ui/Select";

const { validatePhoneInput } = require("../lib/contact-validation");

const LANG_OPTIONS = [
  { value: "es", label: "Espanol" },
  { value: "en", label: "Ingles" },
];

const THEME_OPTIONS = [
  { value: "dark", label: "Oscuro" },
  { value: "light", label: "Claro" },
  { value: "hc-dark", label: "Alto contraste oscuro" },
  { value: "hc-light", label: "Alto contraste claro" },
];

export default function SettingsPage() {
  const [me, setMe] = useState(null);
  const [counts, setCounts] = useState({ projects: 0, crawlRuns: 0 });
  const [name, setName] = useState("");
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
    fetch("/api/auth/me")
      .then(async (response) => {
        if (response.status === 401) {
          window.location.href = "/login?next=/settings";
          return null;
        }
        const data = await response.json();
        if (!active || !data?.user) return null;
        setMe(data.user);
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
  }, []);

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
      setProfileError("Ingresa un nombre de usuario.");
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
      setMe(data.user || null);
      setName(data.user?.name || normalizedName);
      setProfileMessage("Nombre de usuario actualizado.");
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
      setPasswordError("Completa todos los campos de contrasena.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("La nueva contrasena debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("La confirmacion de contrasena no coincide.");
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
      setPasswordMessage("Contrasena actualizada correctamente.");
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
        <link rel="stylesheet" href="/styles.css" />
      </Head>
      <AppShell
        activeKey="settings"
        user={me}
        kicker="Ajustes / Cuenta"
        title="Ajustes de cuenta"
        description="Administra nombre de usuario, contrasena y preferencias de idioma/tema."
        actions={
          me?.permissions?.canManageUsers ? (
            <Button href="/admin/users" variant="outline" tone="secondary" iconLeft={<Icon name="users" size={15} />}>
              Gestionar usuarios
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
            <Eyebrow icon={<Icon name="user" size={12} />}>Perfil</Eyebrow>
            <Input label="Email" value={me?.email || ""} disabled readOnly />
            <Input label="Rol efectivo" value={me?.roleLabel || ""} disabled readOnly />
            <Input
              label="Nombre de usuario"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={80}
            />
            <PhoneField
              label="Telefono"
              country={phoneCountry}
              phone={phoneNumber}
              onCountryChange={setPhoneCountry}
              onPhoneChange={setPhoneNumber}
              hint="Opcional. Se guarda el numero nacional y se muestra el prefijo del pais."
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
              Guardar perfil
            </Button>
          </Card>

          <Card className="settings-card">
            <Eyebrow icon={<Icon name="settings" size={12} />}>
              Preferencias
            </Eyebrow>
            <Select
              label="Idioma por defecto"
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
              label="Tema por defecto"
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
                <span>Proyectos</span>
              </div>
              <div>
                <strong>{counts.crawlRuns || 0}</strong>
                <span>Rastreos</span>
              </div>
            </div>
          </Card>

          <Card
            as="form"
            className="settings-card"
            onSubmit={handlePasswordSubmit}
          >
            <Eyebrow icon={<Icon name="shield" size={12} />}>Seguridad</Eyebrow>
            <Input
              label="Contrasena actual"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
            <Input
              label="Nueva contrasena"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={8}
              required
            />
            <Input
              label="Confirmar nueva contrasena"
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
              Actualizar contrasena
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
