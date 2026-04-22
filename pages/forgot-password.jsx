import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Eyebrow from "../components/ui/Eyebrow";
import Icon from "../components/ui/Icon";
import Input from "../components/ui/Input";
import useSessionUser from "../hooks/useSessionUser";
import { tUi, useUiLanguage } from "../lib/ui-language";

const { validateEmail } = require("../lib/contact-validation");

export default function ForgotPasswordPage() {
  const lang = useUiLanguage();
  const t = (key) => tUi(lang, key);
  const { sessionUser, setSessionUser } = useSessionUser();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me?optional=1")
      .then(async (response) => {
        if (!active || !response.ok) return;
        const data = await response.json();
        setSessionUser(data.user || null);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError(t("errEnterEmail"));
      return;
    }
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "No se pudo procesar la solicitud.");
      }
      setSuccess(t("forgotEmailSent"));
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo procesar la solicitud.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Recuperar acceso | SEO Crawler</title>
        <meta name="description" content="Recupera el acceso a tu cuenta de SEO Crawler. Recibirás instrucciones por correo para restablecer tu contraseña de forma segura." />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_APP_URL || ""}/forgot-password`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_APP_URL || ""}/forgot-password`} />
        <meta property="og:title" content="Recuperar acceso | SEO Crawler" />
        <meta property="og:description" content="Recupera el acceso a tu cuenta de SEO Crawler. Recibirás instrucciones por correo para restablecer tu contraseña de forma segura." />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_APP_URL || ""}/assets/og-image.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Recuperar acceso | SEO Crawler" />
        <meta name="twitter:description" content="Recupera el acceso a tu cuenta de SEO Crawler. Recibirás instrucciones por correo para restablecer tu contraseña de forma segura." />
        <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_APP_URL || ""}/assets/og-image.png`} />
        <link rel="stylesheet" href="/styles.css" />
      </Head>

      <AppShell
        activeKey="login"
        user={sessionUser}
        showSidebar={false}
        kicker={t("forgotKicker")}
        title={t("forgotPageTitle")}
        description={t("forgotPageDesc")}
        actions={
          <Button href="/login" variant="outline" tone="secondary" iconLeft={<Icon name="login" size={15} />}>
            {t("btnBackToLogin")}
          </Button>
        }
      >
        <div className="forgot-grid">
          <Card as="form" className="forgot-form" onSubmit={handleSubmit}>
            <Eyebrow icon={<Icon name="settings" size={12} />}>{t("eyebrowRecovery")}</Eyebrow>
            <Input
              label={t("labelEmail")}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            {error ? <p className="feedback error">{error}</p> : null}
            {success ? <p className="feedback ok">{success}</p> : null}
            <Button type="submit" variant="solid" tone="primary" size="lg" loading={submitting}>
              {t("btnSendResetLink")}
            </Button>
            <p className="foot-note">
              <Link href="/login">{t("linkBackToSignIn")}</Link>
            </p>
          </Card>
        </div>

        <style jsx>{`
          .forgot-grid {
            display: grid;
            grid-template-columns: minmax(320px, 560px);
          }
          .forgot-form {
            display: grid;
            gap: 14px;
          }
          :global(.ui-eyebrow) {
            margin-bottom: 8px;
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
          .foot-note {
            margin: 0;
          }
          .foot-note :global(a) {
            color: var(--text);
          }
        `}</style>
      </AppShell>
    </>
  );
}
