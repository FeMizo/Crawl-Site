import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Icon from "../components/ui/Icon";
import Input from "../components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then(async (response) => {
        if (!active) return;
        if (!response.ok) return;
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
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo iniciar sesion");
      router.push(typeof router.query.next === "string" ? router.query.next : "/projects");
    } catch (err) {
      setError(err.message || "No se pudo iniciar sesion");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Iniciar sesion | SEO Crawler</title>
        <link rel="stylesheet" href="/styles.css" />
      </Head>
      <AppShell
        activeKey="login"
        user={sessionUser}
        kicker="Acceso / Iniciar sesion"
        title="Iniciar sesion"
        description="Accede al mismo sistema visual del panel para gestionar proyectos, historial y corridas guardadas."
        actions={
          sessionUser ? (
            <Button href="/projects" variant="solid" tone="primary" iconLeft={<Icon name="projects" size={15} />}>
              Ver proyectos
            </Button>
          ) : (
            <Button href="/register" variant="outline" tone="secondary" iconLeft={<Icon name="register" size={15} />}>
              Registro
            </Button>
          )
        }
      >
        <div className="auth-grid">
          <Card className="info-card">
            <div className="eyebrow"><Icon name="workspace" size={12} /> Espacio de trabajo</div>
            <h2>Tu acceso abre el panel privado</h2>
            <p>
              Una vez dentro, cada corrida queda ligada a un proyecto y podras volver a
              cargar cualquier corrida desde el panel.
            </p>
          </Card>

          <Card as="form" className="form-card" onSubmit={handleSubmit}>
            <div className="eyebrow"><Icon name="login" size={12} /> Credenciales</div>
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input
              label="Contrasena"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error ? <p className="feedback error">{error}</p> : null}
            <Button type="submit" variant="solid" tone="primary" size="lg" loading={submitting} iconLeft={<Icon name="login" size={15} />}>
              Entrar
            </Button>
            <p className="foot-note">
              No tienes cuenta. <Link href="/register">Crear cuenta</Link>
            </p>
          </Card>
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
          .eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: var(--muted);
            font-size: 11px;
            letter-spacing: 0.22em;
            text-transform: uppercase;
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
