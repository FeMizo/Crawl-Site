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
import QuickStepsModule from "../components/shared/QuickStepsModule";
import useSessionUser from "../hooks/useSessionUser";

const { validateEmail } = require("../lib/contact-validation");

async function readResponsePayload(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {
      error: response.ok
        ? "Respuesta invalida del servidor."
        : `Error del servidor (${response.status}).`,
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { sessionUser, setSessionUser } = useSessionUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me?optional=1")
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
    setError("");
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await readResponsePayload(response);
      if (!response.ok) throw new Error(data.error || "No se pudo iniciar sesion");
      setSessionUser(data.user || null);
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
        <meta name="description" content="Accede a tu panel de SEO Crawler para gestionar proyectos, revisar el historial de rastreos y descargar reportes de auditoría SEO en Excel." />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_APP_URL || ""}/login`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_APP_URL || ""}/login`} />
        <meta property="og:title" content="Iniciar sesion | SEO Crawler" />
        <meta property="og:description" content="Accede a tu panel de SEO Crawler para gestionar proyectos, revisar el historial de rastreos y descargar reportes de auditoría SEO en Excel." />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_APP_URL || ""}/assets/og-image.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Iniciar sesion | SEO Crawler" />
        <meta name="twitter:description" content="Accede a tu panel de SEO Crawler para gestionar proyectos, revisar el historial de rastreos y descargar reportes de auditoría SEO en Excel." />
        <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_APP_URL || ""}/assets/og-image.png`} />
        <link rel="stylesheet" href="/styles.css" />
      </Head>
      <AppShell
        activeKey="login"
        user={sessionUser}
        showSidebar={false}
        kicker="Acceso / Iniciar sesion"
        title="Iniciar sesion"
        description="Accede al mismo sistema visual del panel para gestionar proyectos, historial y rastreos guardados."
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
            <Eyebrow icon={<Icon name="workspace" size={12} />}>Espacio de trabajo</Eyebrow>
            <h2>Acceso rapido al trabajo diario</h2>
            <QuickStepsModule
              compact
              steps={[
                {
                  title: "Inicia sesion con tu correo y contrasena.",
                  detail: "Se restaura tu preferencia de idioma y tema.",
                },
                {
                  title: "Abre un proyecto o crea uno nuevo.",
                  detail: "Todos los rastreos quedan ligados al proyecto.",
                },
                {
                  title: "Revisa historial y retoma corridas anteriores.",
                  detail: "Puedes cargar resultados guardados cuando quieras.",
                },
              ]}
            />
          </Card>

          <Card as="form" className="form-card" onSubmit={handleSubmit}>
            <Eyebrow icon={<Icon name="login" size={12} />}>Credenciales</Eyebrow>
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
            <p className="foot-note">
              <Link href="/forgot-password">Olvide mi contrasena</Link>
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
