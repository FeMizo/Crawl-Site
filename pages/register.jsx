import Head from "next/head";
import Link from "next/link";
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
import QuickStepsModule from "../components/shared/QuickStepsModule";
import useSessionUser from "../hooks/useSessionUser";
import { tUi, useUiLanguage } from "../lib/ui-language";

const { validateEmail, validatePhoneInput } = require("../lib/contact-validation");

const JOB_ROLE_OPTIONS = [
  { value: "", label: "¿Cuál es tu rol? (opcional)" },
  { value: "business_owner", label: "Propietario de negocio" },
  { value: "marketing", label: "Marketing" },
  { value: "seo", label: "Especialista SEO" },
  { value: "agency", label: "Agencia" },
  { value: "developer", label: "Desarrollador" },
  { value: "consultant", label: "Consultor" },
  { value: "designer", label: "Diseñador" },
  { value: "other", label: "Otro" },
];

async function readResponsePayload(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {
      error: response.ok
        ? "Respuesta inválida del servidor."
        : `Error del servidor (${response.status}).`,
    };
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const lang = useUiLanguage();
  const t = (key) => tUi(lang, key);
  const { sessionUser, setSessionUser } = useSessionUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("MX");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me?optional=1")
      .then(async (response) => {
        if (!active) return;
        if (!response.ok) return;
        const data = await response.json();
        if (data.user) {
          setSessionUser(data.user);
          router.replace("/projects");
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    const phone = validatePhoneInput(phoneCountry, phoneNumber, {
      required: false,
    });
    if (!phone.ok) {
      setError(phone.error);
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phoneCountry, phoneNumber, jobRole: jobRole || undefined, password }),
      });
      const data = await readResponsePayload(response);
      if (!response.ok) throw new Error(data.error || "No se pudo registrar");
      if (data.pending) {
        setPending(true);
        return;
      }
      setSessionUser(data.user || null);
      router.push("/projects");
    } catch (err) {
      setError(err.message || "No se pudo registrar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Crear cuenta | SEO Crawler</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="Regístrate en SEO Crawler y empieza a auditar sitios web en minutos. Detecta errores 404, páginas con noindex, redirecciones y metadatos incompletos." />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_APP_URL || ""}/register`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_APP_URL || ""}/register`} />
        <meta property="og:title" content="Crear cuenta | SEO Crawler" />
        <meta property="og:description" content="Regístrate en SEO Crawler y empieza a auditar sitios web en minutos. Detecta errores 404, páginas con noindex, redirecciones y metadatos incompletos." />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_APP_URL || ""}/assets/og-image.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Crear cuenta | SEO Crawler" />
        <meta name="twitter:description" content="Regístrate en SEO Crawler y empieza a auditar sitios web en minutos. Detecta errores 404, páginas con noindex, redirecciones y metadatos incompletos." />
        <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_APP_URL || ""}/assets/og-image.png`} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/assets/favicon-seo-crawler.svg" />
      </Head>
      <AppShell
        activeKey="register"
        user={sessionUser}
        showSidebar={false}
        kicker={t("registerKicker")}
        title={t("registerPageTitle")}
        description={t("registerPageDesc")}
        actions={
          sessionUser ? (
            <Button href="/projects" variant="solid" tone="primary" iconLeft={<Icon name="projects" size={15} />}>
              {t("btnViewProjects")}
            </Button>
          ) : (
            <Button href="/login" variant="outline" tone="secondary" iconLeft={<Icon name="login" size={15} />}>
              {t("navLogin")}
            </Button>
          )
        }
      >
        <div className="auth-grid">
          <Card className="info-card">
            <Eyebrow icon={<Icon name="register" size={12} />}>{t("eyebrowRegister")}</Eyebrow>
            <h2>{t("registerInfoTitle")}</h2>
            <QuickStepsModule
              compact
              steps={[
                {
                  title: t("registerStep1Title"),
                  detail: t("registerStep1Detail"),
                },
                {
                  title: t("registerStep2Title"),
                  detail: t("registerStep2Detail"),
                },
                {
                  title: t("registerStep3Title"),
                  detail: t("registerStep3Detail"),
                },
              ]}
            />
          </Card>

          {pending ? (
            <Card className="form-card">
              <Eyebrow icon={<Icon name="register" size={12} />}>{t("eyebrowNewUser")}</Eyebrow>
              <h2>{t("registerPendingTitle")}</h2>
              <p>{t("registerPendingDesc")}</p>
              <p className="note">{t("registerPendingNote")}</p>
              <Button href="/login" variant="outline" tone="secondary" iconLeft={<Icon name="login" size={15} />}>
                {t("btnBackToLogin")}
              </Button>
            </Card>
          ) : (
            <Card as="form" className="form-card" onSubmit={handleSubmit}>
              <Eyebrow icon={<Icon name="register" size={12} />}>{t("eyebrowNewUser")}</Eyebrow>
              <Input label={t("labelName")} type="text" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label={t("labelEmail")} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <PhoneField
                label={t("labelPhone")}
                country={phoneCountry}
                phone={phoneNumber}
                onCountryChange={setPhoneCountry}
                onPhoneChange={setPhoneNumber}
                hint={t("hintPhoneSelect")}
              />
              <Select
                label="Tu perfil"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
              >
                {JOB_ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
              <Input
                label={t("labelPassword")}
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error ? <p className="feedback error">{error}</p> : null}
              <Button type="submit" variant="solid" tone="primary" size="lg" loading={submitting} iconLeft={<Icon name="plus" size={15} />}>
                {t("btnCreateAccount")}
              </Button>
              <p className="foot-note">
                {t("registerHasAccount")} <Link href="/login">{t("linkSignIn")}</Link>
              </p>
            </Card>
          )}
        </div>
        <style jsx>{`
          .auth-grid {
            display: grid;
            grid-template-columns: minmax(260px, 0.8fr) minmax(320px, 0.9fr);
            gap: 18px;
            min-width: 0;
          }
          .info-card,
          .form-card {
            gap: 16px;
          }
          :global(.ui-eyebrow) {
            margin-bottom: 12px;
          }
          h2 {
            font-family: "Syne", "Manrope", sans-serif;
            font-weight: 700;
            margin: 0 0 12px;
            font-size: 1.55rem;
          }
          p {
            color: var(--text2);
            margin: 0;
          }
          .form-card {
            display: grid;
            gap: 14px;
          }
          .feedback.error {
            color: var(--error);
          }
          .note {
            font-size: 13px;
            color: var(--muted);
          }
          .foot-note :global(a) {
            color: var(--text);
          }
          @media (max-width: 860px) {
            .auth-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </AppShell>
    </>
  );
}
