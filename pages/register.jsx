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
import QuickStepsModule from "../components/shared/QuickStepsModule";
import useSessionUser from "../hooks/useSessionUser";

const { validateEmail, validatePhoneInput } = require("../lib/contact-validation");

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

export default function RegisterPage() {
  const router = useRouter();
  const { sessionUser, setSessionUser } = useSessionUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("MX");
  const [phoneNumber, setPhoneNumber] = useState("");
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
        body: JSON.stringify({ name, email, phoneCountry, phoneNumber, password }),
      });
      const data = await readResponsePayload(response);
      if (!response.ok) throw new Error(data.error || "No se pudo registrar");
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
        <title>Registro | SEO Crawler</title>
        <link rel="stylesheet" href="/styles.css" />
      </Head>
      <AppShell
        activeKey="register"
        user={sessionUser}
        kicker="Acceso / Registro"
        title="Crear cuenta"
        description="Activa tu area privada dentro del mismo sistema del panel para guardar proyectos, historial y reportes."
        actions={
          sessionUser ? (
            <Button href="/projects" variant="solid" tone="primary" iconLeft={<Icon name="projects" size={15} />}>
              Ver proyectos
            </Button>
          ) : (
            <Button href="/login" variant="outline" tone="secondary" iconLeft={<Icon name="login" size={15} />}>
              Iniciar sesion
            </Button>
          )
        }
      >
        <div className="auth-grid">
          <Card className="info-card">
            <Eyebrow icon={<Icon name="register" size={12} />}>Registro</Eyebrow>
            <h2>Comienza en minutos</h2>
            <QuickStepsModule
              compact
              steps={[
                {
                  title: "Crea tu cuenta con nombre, email y contrasena segura.",
                  detail: "El acceso queda habilitado al instante.",
                },
                {
                  title: "Registra tu primer proyecto con una URL valida.",
                  detail: "Desde ahi podras ejecutar rastreos y guardar historial.",
                },
                {
                  title: "Consulta resultados y descarga reportes.",
                  detail: "Toda la operacion vive en el mismo flujo de trabajo.",
                },
              ]}
            />
          </Card>

          <Card as="form" className="form-card" onSubmit={handleSubmit}>
            <Eyebrow icon={<Icon name="register" size={12} />}>Nuevo usuario</Eyebrow>
            <Input label="Nombre" type="text" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <PhoneField
              label="Telefono"
              country={phoneCountry}
              phone={phoneNumber}
              onCountryChange={setPhoneCountry}
              onPhoneChange={setPhoneNumber}
              hint="Opcional. Selecciona el pais para mostrar prefijo y validar longitud."
            />
            <Input
              label="Contrasena"
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error ? <p className="feedback error">{error}</p> : null}
            <Button type="submit" variant="solid" tone="primary" size="lg" loading={submitting} iconLeft={<Icon name="plus" size={15} />}>
              Crear cuenta
            </Button>
            <p className="foot-note">
              Ya tienes acceso. <Link href="/login">Entrar</Link>
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
