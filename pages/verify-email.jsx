import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Eyebrow from "../components/ui/Eyebrow";
import Icon from "../components/ui/Icon";
import useSessionUser from "../hooks/useSessionUser";
import { tUi, useUiLanguage } from "../lib/ui-language";

export default function VerifyEmailPage() {
  const router = useRouter();
  const lang = useUiLanguage();
  const t = (key) => tUi(lang, key);
  const { setSessionUser } = useSessionUser();
  const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"
  const [errorMsg, setErrorMsg] = useState("");
  const [verifiedUser, setVerifiedUser] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;

    const token = router.query.token;
    if (!token) {
      setErrorMsg(t("verifyErrMissing"));
      setStatus("error");
      return;
    }

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || t("verifyInvalid"));
        }
        setSessionUser(data.user || null);
        setVerifiedUser(data.user || null);
        setStatus("success");
      })
      .catch((err) => {
        setErrorMsg(err instanceof Error ? err.message : t("verifyInvalid"));
        setStatus("error");
      });
  }, [router.isReady, router.query.token]);

  return (
    <>
      <Head>
        <title>Verificar cuenta | SEO Crawler</title>
        <meta name="robots" content="noindex" />
      </Head>

      <AppShell
        activeKey="login"
        showSidebar={false}
        kicker={t("verifyKicker")}
        title={t("verifyPageTitle")}
        description={t("verifyPageDesc")}
      >
        <div className="verify-grid">
          <Card className="verify-card">
            <Eyebrow icon={<Icon name="shield" size={12} />}>{t("verifyKicker")}</Eyebrow>

            {status === "loading" ? (
              <p className="feedback muted">{t("verifyPageTitle")}…</p>
            ) : null}

            {status === "success" ? (
              <div className="welcome-block">
                <div className="welcome-check" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                {verifiedUser?.name ? (
                  <p className="welcome-name">
                    {lang === "en" ? `Welcome, ${verifiedUser.name}!` : `¡Bienvenido/a, ${verifiedUser.name}!`}
                  </p>
                ) : null}
                <p className="feedback ok">{t("verifySuccess")}</p>
                <ol className="onboard-steps">
                  <li className="onboard-step done">
                    <span className="step-dot done-dot" aria-hidden="true">✓</span>
                    {t("verifyStep1Done")}
                  </li>
                  <li className="onboard-step done">
                    <span className="step-dot done-dot" aria-hidden="true">✓</span>
                    {t("verifyStep2Done")}
                  </li>
                  <li className="onboard-step next">
                    <span className="step-dot next-dot" aria-hidden="true">→</span>
                    {t("verifyStep3Prompt")}
                  </li>
                </ol>
                <Button
                  href="/"
                  variant="solid"
                  tone="primary"
                  size="lg"
                  iconLeft={<Icon name="plus" size={15} />}
                >
                  {t("verifyWelcomeBtn")}
                </Button>
              </div>
            ) : null}

            {status === "error" ? (
              <>
                <p className="feedback error">{errorMsg}</p>
                <Button
                  href="/login"
                  variant="outline"
                  tone="secondary"
                  iconLeft={<Icon name="login" size={15} />}
                >
                  {t("btnGoToLogin")}
                </Button>
              </>
            ) : null}
          </Card>
        </div>

        <style jsx>{`
          .verify-grid {
            display: grid;
            grid-template-columns: minmax(320px, 560px);
          }
          .verify-card {
            display: grid;
            gap: 14px;
          }
          :global(.ui-eyebrow) {
            margin-bottom: 8px;
          }
          .feedback {
            margin: 0;
          }
          .feedback.ok {
            color: var(--ok);
          }
          .feedback.error {
            color: var(--error);
          }
          .feedback.muted {
            color: var(--muted);
          }
          .welcome-block {
            display: grid;
            gap: 16px;
          }
          .welcome-check {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: var(--adim);
            border: 1px solid rgba(0, 255, 136, 0.3);
            color: var(--accent);
            display: grid;
            place-items: center;
          }
          .welcome-name {
            margin: 0;
            font-family: "Syne", "Manrope", sans-serif;
            font-weight: 700;
            font-size: 1.3rem;
            color: var(--text);
          }
          .onboard-steps {
            list-style: none;
            margin: 4px 0 0;
            padding: 0;
            display: grid;
            gap: 8px;
          }
          .onboard-step {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            color: var(--text2);
          }
          .onboard-step.next {
            color: var(--text);
            font-weight: 700;
          }
          .step-dot {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: grid;
            place-items: center;
            font-size: 12px;
            flex: 0 0 auto;
          }
          .done-dot {
            background: var(--adim);
            color: var(--accent);
            border: 1px solid rgba(0, 255, 136, 0.24);
          }
          .next-dot {
            background: rgba(77, 141, 255, 0.14);
            color: #77abff;
            border: 1px solid rgba(77, 141, 255, 0.4);
          }
        `}</style>
      </AppShell>
    </>
  );
}
