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
        setStatus("success");
        setTimeout(() => router.replace("/projects"), 2000);
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
        <link rel="stylesheet" href="/styles.css" />
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
              <p className="feedback ok">{t("verifySuccess")}</p>
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
        `}</style>
      </AppShell>
    </>
  );
}
