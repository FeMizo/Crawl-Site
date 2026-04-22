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
import useSessionUser from "../hooks/useSessionUser";
import { tUi, useUiLanguage } from "../lib/ui-language";

export default function ResetPasswordPage() {
  const router = useRouter();
  const lang = useUiLanguage();
  const t = (key) => tUi(lang, key);
  const { sessionUser, setSessionUser } = useSessionUser();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tokenReady, setTokenReady] = useState(false);

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

  // Wait for router to hydrate so we can read ?token
  useEffect(() => {
    if (!router.isReady) return;
    if (!router.query.token) {
      setError(t("errTokenMissing"));
    }
    setTokenReady(true);
  }, [router.isReady, router.query.token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const token = router.query.token;
    if (!token) {
      setError(t("errTokenMissing"));
      return;
    }
    if (password.length < 8) {
      setError(t("errPasswordMinLength"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("errConfirmNoMatch"));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || t("resetTokenInvalid"));
      }
      setSuccess(t("resetSuccess"));
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("resetTokenInvalid"));
    } finally {
      setSubmitting(false);
    }
  };

  const tokenInvalid = tokenReady && !router.query.token;

  return (
    <>
      <Head>
        <title>Restablecer contraseña | SEO Crawler</title>
        <meta name="robots" content="noindex" />
        <link rel="stylesheet" href="/styles.css" />
      </Head>

      <AppShell
        activeKey="login"
        user={sessionUser}
        showSidebar={false}
        kicker={t("resetKicker")}
        title={t("resetPageTitle")}
        description={t("resetPageDesc")}
        actions={
          <Button href="/login" variant="outline" tone="secondary" iconLeft={<Icon name="login" size={15} />}>
            {t("btnBackToLogin")}
          </Button>
        }
      >
        <div className="reset-grid">
          <Card as="form" className="reset-form" onSubmit={handleSubmit}>
            <Eyebrow icon={<Icon name="shield" size={12} />}>{t("eyebrowReset")}</Eyebrow>

            {tokenInvalid ? (
              <>
                <p className="feedback error">{t("errTokenMissing")}</p>
                <p className="foot-note">
                  <Link href="/forgot-password">{t("eyebrowRecovery")}</Link>
                </p>
              </>
            ) : (
              <>
                <Input
                  label={t("labelNewPassword")}
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <Input
                  label={t("labelConfirmPasswordShort")}
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
                {error ? <p className="feedback error">{error}</p> : null}
                {success ? (
                  <>
                    <p className="feedback ok">{success}</p>
                    <p className="foot-note">
                      <Link href="/login">{t("linkBackToSignIn")}</Link>
                    </p>
                  </>
                ) : null}
                {!success ? (
                  <Button type="submit" variant="solid" tone="primary" size="lg" loading={submitting}>
                    {t("btnSetPassword")}
                  </Button>
                ) : null}
              </>
            )}
          </Card>
        </div>

        <style jsx>{`
          .reset-grid {
            display: grid;
            grid-template-columns: minmax(320px, 560px);
          }
          .reset-form {
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
