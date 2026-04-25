import Head from "next/head";
import { useState } from "react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Eyebrow from "../components/ui/Eyebrow";
import Icon from "../components/ui/Icon";
import Input from "../components/ui/Input";
import useSessionUser from "../hooks/useSessionUser";
import { tUi, useUiLanguage } from "../lib/ui-language";
import { validateEmail } from "../lib/contact-validation";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://crawlsite.app";
const CONTACT_EMAIL = "contacto@aionsite.com.mx";

const CONTACT_REASONS = ["contactReason1", "contactReason2", "contactReason3"];

export default function ContactoPage() {
  const lang = useUiLanguage();
  const t = (key) => tUi(lang, key);
  const { sessionUser } = useSessionUser();

  const [name, setName] = useState(sessionUser?.name || "");
  const [email, setEmail] = useState(sessionUser?.email || "");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setError("");

    const emailErr = validateEmail(email);
    if (emailErr) { setError(emailErr); return; }
    if (!message.trim()) { setError(t("errMessageEmpty")); return; }
    if (message.length > 2000) { setError(t("errMessageLength")); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t("btnSendMessage"));
      setSuccess(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>{`${t("contactPageTitle")} | SEO Crawler`}</title>
        <meta name="description" content={t("contactPageDesc")} />
        <link rel="canonical" href={`${APP_URL}/contacto`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${APP_URL}/contacto`} />
        <meta property="og:title" content={`${t("contactPageTitle")} | SEO Crawler`} />
        <meta property="og:description" content={t("contactPageDesc")} />
        <meta property="og:image" content={`${APP_URL}/assets/og-image.png`} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/assets/favicon-seo-crawler.svg" />
      </Head>

      <AppShell
        activeKey=""
        user={sessionUser}
        showSidebar={false}
        kicker={t("contactKicker")}
        title={t("contactPageTitle")}
        description={t("contactPageDesc")}
      >
        <div className="contact-grid">
          {/* Info card */}
          <Card className="info-card">
            <Eyebrow icon={<Icon name="roadmap" size={12} />}>
              {t("contactKicker")}
            </Eyebrow>
            <h2>{t("contactInfoTitle")}</h2>
            <ul className="reasons-list">
              {CONTACT_REASONS.map((key) => (
                <li key={key} className="reason-item">
                  <span className="reason-dot" aria-hidden="true" />
                  {t(key)}
                </li>
              ))}
            </ul>
            <div className="contact-email-block">
              <span className="email-label">{t("contactEmailLabel")}</span>
              <a href={`mailto:${CONTACT_EMAIL}`} className="email-link">
                {CONTACT_EMAIL}
              </a>
            </div>
          </Card>

          {/* Form card */}
          <Card as="form" className="form-card" onSubmit={handleSubmit}>
            <Eyebrow icon={<Icon name="settings" size={12} />}>
              {t("eyebrowCredentials")}
            </Eyebrow>

            {success ? (
              <div className="success-block">
                <div className="success-icon" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="success-text">{t("contactSuccess")}</p>
                <Button
                  type="button"
                  variant="outline"
                  tone="secondary"
                  size="sm"
                  onClick={() => setSuccess(false)}
                >
                  {t("btnSendMessage")}
                </Button>
              </div>
            ) : (
              <>
                <Input
                  label={t("labelName")}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label={t("labelEmail")}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <div className="ui-field">
                  <label className="ui-field-label" htmlFor="contact-message">
                    {t("labelMessage")}
                  </label>
                  <textarea
                    id="contact-message"
                    className="ui-input contact-textarea"
                    rows={5}
                    maxLength={2000}
                    placeholder={t("placeholderMessage")}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                  <span className="char-count">
                    {message.length} / 2000
                  </span>
                </div>

                {error ? <p className="feedback error">{error}</p> : null}

                <Button
                  type="submit"
                  variant="solid"
                  tone="primary"
                  size="lg"
                  loading={submitting}
                  iconLeft={<Icon name="run" size={15} />}
                >
                  {t("btnSendMessage")}
                </Button>
              </>
            )}
          </Card>
        </div>

        <style jsx>{`
          .contact-grid {
            display: grid;
            grid-template-columns: minmax(240px, 0.75fr) minmax(320px, 1fr);
            gap: 18px;
            min-width: 0;
          }
          .info-card,
          .form-card {
            display: grid;
            gap: 16px;
            align-content: start;
          }
          :global(.ui-eyebrow) {
            margin-bottom: 4px;
          }
          h2 {
            font-family: "Syne", "Manrope", sans-serif;
            font-weight: 700;
            margin: 0;
            font-size: 1.45rem;
            line-height: 1.15;
          }
          .reasons-list {
            list-style: none;
            margin: 0;
            padding: 0;
            display: grid;
            gap: 10px;
          }
          .reason-item {
            display: flex;
            align-items: center;
            gap: 10px;
            color: var(--text2);
            font-size: 14px;
          }
          .reason-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--accent);
            flex: 0 0 auto;
          }
          .contact-email-block {
            display: grid;
            gap: 4px;
            padding-top: 4px;
            border-top: 1px solid var(--border);
          }
          .email-label {
            font-size: 11px;
            color: var(--muted);
            letter-spacing: 0.1em;
            text-transform: uppercase;
          }
          .email-link {
            font-size: 14px;
            color: var(--accent);
            text-decoration: none;
            word-break: break-all;
          }
          .email-link:hover {
            text-decoration: underline;
          }
          .contact-textarea {
            resize: vertical;
            min-height: 130px;
            padding: 14px 16px;
            font-family: "Manrope", sans-serif;
            font-size: 15px;
            line-height: 1.5;
          }
          .char-count {
            font-size: 11px;
            color: var(--muted);
            text-align: right;
          }
          .feedback.error {
            margin: 0;
            color: var(--error);
            font-size: 14px;
          }
          .success-block {
            display: grid;
            gap: 14px;
          }
          .success-icon {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: var(--adim);
            border: 1px solid rgba(0, 255, 136, 0.3);
            color: var(--accent);
            display: grid;
            place-items: center;
          }
          .success-text {
            margin: 0;
            color: var(--text);
            font-size: 15px;
          }
          @media (max-width: 860px) {
            .contact-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </AppShell>
    </>
  );
}
