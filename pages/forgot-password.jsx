import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Eyebrow from "../components/ui/Eyebrow";
import Icon from "../components/ui/Icon";
import Input from "../components/ui/Input";

export default function ForgotPasswordPage() {
  const [sessionUser, setSessionUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
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
      setError("Ingresa el email de tu cuenta.");
      return;
    }

    if (password.length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("La confirmacion no coincide.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "No se pudo actualizar la contrasena.");
      }

      setSuccess("Contrasena actualizada. Ya puedes iniciar sesion.");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la contrasena.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Recuperar acceso | SEO Crawler</title>
        <link rel="stylesheet" href="/styles.css" />
      </Head>

      <AppShell
        activeKey="login"
        user={sessionUser}
        kicker="Acceso / Recuperar contrasena"
        title="Olvidaste tu contrasena"
        description="Restablece el acceso usando tu email y define una nueva contrasena."
        actions={
          <Button href="/login" variant="outline" tone="secondary" iconLeft={<Icon name="login" size={15} />}>
            Volver a login
          </Button>
        }
      >
        <div className="forgot-grid">
          <Card as="form" className="forgot-form" onSubmit={handleSubmit}>
            <Eyebrow icon={<Icon name="settings" size={12} />}>Recuperacion</Eyebrow>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Input
              label="Nueva contrasena"
              type="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <Input
              label="Confirmar contrasena"
              type="password"
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
            {error ? <p className="feedback error">{error}</p> : null}
            {success ? <p className="feedback ok">{success}</p> : null}
            <Button type="submit" variant="solid" tone="primary" size="lg" loading={submitting}>
              Actualizar contrasena
            </Button>
            <p className="foot-note">
              <Link href="/login">Volver a iniciar sesion</Link>
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
