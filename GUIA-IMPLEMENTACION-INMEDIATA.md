# Guía de Implementación Inmediata — SEO Crawler
**Cambios técnicos listos para implementar — 24 de abril de 2026**

---

## 1. CREAR PÁGINA 404 PERSONALIZADA

### Archivo: `pages/404.jsx`
```jsx
import Head from "next/head";
import { useRouter } from "next/router";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Eyebrow from "../components/ui/Eyebrow";
import Icon from "../components/ui/Icon";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://crawlsite.app";

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Página no encontrada | SEO Crawler</title>
        <meta
          name="description"
          content="La página que buscas no existe. Regresa a la página de inicio o crea un proyecto."
        />
        <link rel="canonical" href={`${APP_URL}/404`} />
        <meta name="robots" content="noindex, follow" />
      </Head>

      <AppShell
        activeKey=""
        user={null}
        showSidebar={false}
        kicker="Error"
        title="Página No Encontrada"
        description="404 — Esta URL no existe"
      >
        <Card className="error-card">
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <div style={{ fontSize: "64px", marginBottom: "1rem", color: "var(--error)" }}>
              <Icon name="alert-circle" size={64} />
            </div>

            <h2 style={{ marginBottom: "0.5rem" }}>No encontramos esa página</h2>
            <p style={{ color: "var(--text2)", marginBottom: "2rem" }}>
              Probablemente movimos algo, o la URL está incorrecta.
            </p>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Button
                onClick={() => router.push("/")}
                style={{ backgroundColor: "var(--accent)", color: "var(--bg)" }}
              >
                Ir a la página de inicio
              </Button>
              <Button
                onClick={() => router.push("/precios")}
                variant="outline"
              >
                Ver planes
              </Button>
              <Button
                onClick={() => router.push("/register")}
                variant="outline"
              >
                Crear cuenta
              </Button>
            </div>

            <div style={{ marginTop: "2rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
              <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "0.5rem" }}>
                ¿Algo no funciona?
              </p>
              <a
                href="mailto:contacto@aionsite.com.mx"
                style={{ color: "var(--accent)", textDecoration: "none" }}
              >
                Contacta con soporte
              </a>
            </div>
          </div>
        </Card>
      </AppShell>

      <style>{`
        .error-card {
          max-width: 600px;
          margin: 0 auto;
        }
      `}</style>
    </>
  );
}
```

**Cambios necesarios:**
- Guardar en `pages/404.jsx`
- Ajustar imports según estructura actual (Button, Icon, etc.)
- Status será 404 automáticamente en Next.js

---

## 2. MEJORAR PÁGINA 500

### Archivo: `pages/500.jsx`
```jsx
import Head from "next/head";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Icon from "../components/ui/Icon";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://crawlsite.app";

export default function ServerErrorPage() {
  return (
    <>
      <Head>
        <title>Error del servidor | SEO Crawler</title>
        <meta
          name="description"
          content="Algo salió mal. Nuestro equipo ya está trabajando en el problema."
        />
        <link rel="canonical" href={`${APP_URL}/500`} />
        <meta name="robots" content="noindex, follow" />
      </Head>

      <AppShell
        activeKey=""
        user={null}
        showSidebar={false}
        kicker="Error"
        title="Error del Servidor"
        description="500 — Algo salió mal"
      >
        <Card className="error-card">
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <div style={{ fontSize: "64px", marginBottom: "1rem", color: "var(--error)" }}>
              <Icon name="server-error" size={64} />
            </div>

            <h2 style={{ marginBottom: "0.5rem" }}>Estamos experimentando dificultades</h2>
            <p style={{ color: "var(--text2)", marginBottom: "2rem" }}>
              Nuestro equipo está investigando. Por favor, intenta más tarde.
            </p>

            <Button onClick={() => window.location.href = "/"}>
              Volver al inicio
            </Button>

            <div style={{ marginTop: "2rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
              <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
                Si el problema persiste,{" "}
                <a href="mailto:contacto@aionsite.com.mx" style={{ color: "var(--accent)" }}>
                  contáctanos
                </a>
              </p>
            </div>
          </div>
        </Card>
      </AppShell>
    </>
  );
}
```

---

## 3. AGREGAR OG TAGS EN HOME (index.jsx)

### Cambio en `pages/index.jsx` (en la sección `<Head>`)
```jsx
export default function HomePage() {
  // ... existing code ...
  
  return (
    <>
      <Head>
        <title>SEO Crawler | Auditoría SEO Automática en Línea</title>
        <meta
          name="description"
          content="Detecta errores 404, páginas sin title, meta description faltante, redirects, noindex y más. Auditoría SEO completa en minutos."
        />
        <link rel="canonical" href={APP_URL} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={APP_URL} />
        <meta property="og:title" content="SEO Crawler | Auditoría SEO Automática" />
        <meta property="og:description" content="Detecta errores 404, páginas sin title, meta description faltante, redirects, noindex y más." />
        <meta property="og:image" content={`${APP_URL}/assets/og-image.png`} />
        <meta property="og:image:alt" content="SEO Crawler - Herramienta de auditoría SEO" />
        <meta property="og:locale" content="es_MX" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@aionsite" />
        <meta name="twitter:title" content="SEO Crawler | Auditoría SEO Automática" />
        <meta name="twitter:description" content="Detecta errores SEO en tu sitio web automáticamente." />
        <meta name="twitter:image" content={`${APP_URL}/assets/og-image.png`} />

        {/* Schema JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA_GRAPH) }}
        />
      </Head>

      {/* ... rest of component ... */}
    </>
  );
}
```

---

## 4. HARDCODED TEXT EN AppShell → TRADUCCIÓN

### Cambio en `components/layout/AppShell.jsx`

**Antes:**
```jsx
<a href="https://aionsite.com.mx/" target="_blank" rel="noopener noreferrer" className="footer-nav-link">Home</a>
<a href="https://aionsite.com.mx/blog" target="_blank" rel="noopener noreferrer" className="footer-nav-link">Blog</a>
<a href="/precios" className="footer-nav-link">Precios</a>
```

**Después:**
```jsx
import { useUiLanguage, tUi } from "../lib/ui-language";

export default function AppShell({ ... }) {
  const lang = useUiLanguage();
  const t = (key) => tUi(lang, key);

  // ... rest of code ...

  return (
    // ...
    <nav className="app-footer-nav" aria-label="Footer">
      <a href="https://aionsite.com.mx/" target="_blank" rel="noopener noreferrer" className="footer-nav-link">
        {t("footerHome") || "Home"}
      </a>
      <span className="footer-nav-sep" aria-hidden="true">·</span>
      <a href="https://aionsite.com.mx/blog" target="_blank" rel="noopener noreferrer" className="footer-nav-link">
        {t("footerBlog") || "Blog"}
      </a>
      <span className="footer-nav-sep" aria-hidden="true">·</span>
      <a href="/precios" className="footer-nav-link">
        {t("footerPrices") || "Precios"}
      </a>
      <span className="footer-nav-sep" aria-hidden="true">·</span>
      <a href="/aviso-privacidad" className="footer-nav-link">
        {t("footerPrivacy") || "Aviso de privacidad"}
      </a>
    </nav>
  );
}
```

**También agregar a `lib/ui-language.js`:**
```js
const UI_COPY = {
  es: {
    // ... existing keys ...
    footerHome: "Inicio",
    footerBlog: "Blog",
    footerPrices: "Precios",
    footerPrivacy: "Aviso de privacidad",
    footerContact: "Contacto",
  },
  en: {
    // ... existing keys ...
    footerHome: "Home",
    footerBlog: "Blog",
    footerPrices: "Pricing",
    footerPrivacy: "Privacy Policy",
    footerContact: "Contact",
  },
};
```

---

## 5. CREAR PÁGINA DE CONTACTO (`pages/contacto.jsx`)

```jsx
import Head from "next/head";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Eyebrow from "../components/ui/Eyebrow";
import Icon from "../components/ui/Icon";
import Input from "../components/ui/Input";
import { useState } from "react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://crawlsite.app";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (res.ok) {
        setSubmitted(true);
        setName("");
        setEmail("");
        setMessage("");
      } else {
        const data = await res.json();
        setError(data.error || "Error al enviar el mensaje");
      }
    } catch (err) {
      setError("Error de conexión. Intenta más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Contacto | SEO Crawler</title>
        <meta
          name="description"
          content="¿Preguntas? Contáctanos. Nuestro equipo responde en 24 horas."
        />
        <link rel="canonical" href={`${APP_URL}/contacto`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${APP_URL}/contacto`} />
        <meta property="og:title" content="Contacto | SEO Crawler" />
        <meta property="og:description" content="¿Preguntas? Contáctanos y resolvemos tu duda." />
      </Head>

      <AppShell
        activeKey=""
        user={null}
        showSidebar={false}
        kicker="Soporte"
        title="Ponte en contacto"
        description="Responderemos en las próximas 24 horas"
      >
        <Card className="contact-card">
          {submitted ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <Icon name="check-circle" size={48} style={{ color: "var(--ok)", marginBottom: "1rem" }} />
              <h3>Mensaje enviado</h3>
              <p style={{ color: "var(--text2)" }}>
                Gracias por escribirnos. Nuestro equipo se comunicará pronto.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ maxWidth: "500px", margin: "0 auto" }}>
              {error && (
                <div style={{ color: "var(--error)", marginBottom: "1rem", padding: "0.5rem", backgroundColor: "var(--edim)", borderRadius: "4px" }}>
                  {error}
                </div>
              )}

              <label style={{ display: "block", marginBottom: "1rem" }}>
                <span style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Nombre</span>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Tu nombre"
                />
              </label>

              <label style={{ display: "block", marginBottom: "1rem" }}>
                <span style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Correo electrónico</span>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                />
              </label>

              <label style={{ display: "block", marginBottom: "2rem" }}>
                <span style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>Mensaje</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  placeholder="Cuéntanos cómo podemos ayudarte..."
                  style={{
                    width: "100%",
                    minHeight: "120px",
                    padding: "0.5rem",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                    backgroundColor: "var(--bg2)",
                    color: "var(--text)",
                    fontFamily: "inherit",
                  }}
                />
              </label>

              <Button
                type="submit"
                disabled={loading}
                style={{ width: "100%", backgroundColor: "var(--accent)", color: "var(--bg)" }}
              >
                {loading ? "Enviando..." : "Enviar mensaje"}
              </Button>
            </form>
          )}
        </Card>
      </AppShell>
    </>
  );
}
```

**Agregar a `robots.txt`:**
```
Allow: /contacto
```

**Actualizar footer en AppShell para incluir link:**
```jsx
<a href="/contacto" className="footer-nav-link">Contacto</a>
```

---

## 6. MEJORAR VALIDACIÓN DE EMAIL

### Cambio en `lib/contact-validation.js`
Reemplazar con validación más robusta:

```js
export function validateEmail(email) {
  // Simple RFC 5322-ish validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email || !email.trim()) {
    return "El correo electrónico es requerido.";
  }
  
  if (email.length > 254) {
    return "El correo electrónico es muy largo.";
  }
  
  if (!emailRegex.test(email)) {
    return "Por favor ingresa un correo electrónico válido.";
  }
  
  return null;
}
```

---

## 7. AGREGAR CANONICAL TAGS EN TODAS LAS PÁGINAS

### Template para cada página:
```jsx
<Head>
  <title>Título | SEO Crawler</title>
  <meta name="description" content="..." />
  <link rel="canonical" href={`${APP_URL}/ruta-exacta`} />
  {/* ... rest of tags ... */}
</Head>
```

Verificar en:
- ✅ `pages/index.jsx` (home)
- ✅ `pages/precios.jsx`
- ✅ `pages/aviso-privacidad.jsx`
- ✅ `pages/login.jsx`
- ✅ `pages/register.jsx`
- ✅ `pages/forgot-password.jsx`
- ❌ `pages/reset-password.jsx` (agregar)
- ❌ `pages/verify-email.jsx` (agregar)

---

## 8. MEJORAR next.config.js CON CACHING

### Agregar cache-control headers optimizados:
```js
async headers() {
  return [
    {
      source: "/(.*)",
      headers: securityHeaders,
    },
    {
      source: "/assets/:path*",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
    {
      source: "/api/:path*",
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
      ],
    },
  ];
}
```

---

## 9. VERIFICACIÓN CHECKLIST

Después de implementar cada cambio:

- [ ] Crear `pages/404.jsx` y `pages/500.jsx`
- [ ] Agregar OG tags a home
- [ ] Traducir hardcoded text en AppShell
- [ ] Crear página `/contacto`
- [ ] Agregar `/contacto` a footer
- [ ] Actualizar `robots.txt` para permitir `/contacto`
- [ ] Mejorar validación de email
- [ ] Agregar canonical tags en todas las páginas
- [ ] Actualizar cache-control en `next.config.js`
- [ ] Build local: `npm run build`
- [ ] Test en desarrollo: `npm run dev`
- [ ] Verificar en mobile DevTools
- [ ] Commit a git con mensaje descriptivo

---

## 10. ORDEN DE IMPLEMENTACIÓN RECOMENDADO

1. **Día 1:** Crear 404/500 + OG tags (más rápido)
2. **Día 2:** Traducir hardcoded text en AppShell
3. **Día 3:** Crear página de contacto + footer link
4. **Día 4:** Mejorar validación + canonical tags
5. **Día 5:** Cache headers + testing completo + merge

---

**Tiempo estimado:** 8-12 horas de desarrollo
**Riesgo:** Bajo (cambios no destructivos, fácil de revertir)
**Impacto:** Alto (SEO, UX, accesibilidad, confianza)
