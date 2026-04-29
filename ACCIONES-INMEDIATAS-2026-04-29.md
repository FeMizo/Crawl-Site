# Acciones Inmediatas - SEO Crawler
**Generado:** 29 de abril de 2026  
**Basado en:** Auditoría automatizada 2026-04-29  
**Prioridad:** INMEDIATA (implementar esta semana)

---

## ⚡ 3 Acciones Críticas

### 1. ✅ VERIFICAR HTTPONLY FLAG EN JWT COOKIE (30 min)

**Por qué:** La cookie de autenticación debe tener `httpOnly: true` para prevenir XSS.

**Dónde buscar:**
```
lib/auth.ts
lib/server/auth.ts
pages/api/auth/*
```

**Verificación:**
```javascript
// ❌ MALO
res.setHeader('Set-Cookie', 'auth_token=' + token);

// ✅ BUENO
res.setHeader('Set-Cookie', [
  `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${7*86400}`
]);
```

**Cómo verificar en production:**
```bash
# En navegador DevTools → Network → Copiar una cookie
# Verificar que NO aparece en document.cookie

# En terminal:
curl -I https://crawlsite.app/api/auth/me \
  -H "Cookie: auth_token=test" | grep Set-Cookie
```

**Acción:** 
- [ ] Localizar código de `setCookie` para JWT
- [ ] Agregar flags: HttpOnly, Secure, SameSite=Strict
- [ ] Test en local: `npm run dev`
- [ ] Validar: `document.cookie` debe estar vacío

---

### 2. 🛡️ VALIDAR RATE LIMITING EN LOGIN (30 min)

**Por qué:** Prevenir ataques de fuerza bruta en /api/auth/login

**Dónde está:**
```
pages/api/auth/login.js (o .ts)
```

**Verificación esperada:**
```javascript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 5, // máximo 5 intentos
  message: 'Demasiados intentos de login. Intenta después de 5 minutos.'
});

router.post('/login', loginLimiter, async (req, res) => { ... });
```

**Si NO está implementado:**
```bash
npm install express-rate-limit --save
```

**Acción:**
- [ ] Buscar `express-rate-limit` en `pages/api/auth/login`
- [ ] Si NO existe, agregar limitador
- [ ] Aplicar también a: `/register`, `/forgot-password`
- [ ] Test: Hacer 6 requests rápidos, debe rechazar el 6to

---

### 3. 📄 CREAR PÁGINA `/TERMINOS` (2-3 horas)

**Por qué:** Cumplimiento legal si tienes usuarios pagos (planes BASIC, PRO, etc.)

**Dónde crear:**
```
pages/terminos.jsx  (o app/terminos/page.tsx si migrás a App Router)
```

**Template mínimo:**
```jsx
import Head from "next/head";
import AppShell from "../components/layout/AppShell";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://crawlsite.app";

export default function TerminosPage() {
  return (
    <>
      <Head>
        <title>Términos de Servicio | SEO Crawler</title>
        <meta name="description" content="Términos y condiciones de uso de SEO Crawler" />
        <link rel="canonical" href={`${APP_URL}/terminos`} />
      </Head>
      <AppShell activeKey="" showSidebar={false} title="Términos de Servicio">
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
          <h1>Términos de Servicio</h1>
          <p>Última actualización: {new Date().toLocaleDateString('es-MX')}</p>
          
          <section>
            <h2>1. Aceptación de Términos</h2>
            <p>Al usar SEO Crawler, aceptas estos términos...</p>
          </section>
          
          <section>
            <h2>2. Licencia de uso</h2>
            <p>Te otorgamos una licencia no exclusiva para usar el servicio...</p>
          </section>
          
          <section>
            <h2>3. Limitación de responsabilidad</h2>
            <p>SEO Crawler se proporciona "tal cual"...</p>
          </section>
          
          <section>
            <h2>4. Cancelación y reembolsos</h2>
            <p>Puedes cancelar tu suscripción en cualquier momento...</p>
          </section>
        </div>
      </AppShell>
    </>
  );
}
```

**Checklist:**
- [ ] Crear archivo `pages/terminos.jsx`
- [ ] Agregar meta tags (title, description, canonical)
- [ ] Incluir secciones legales básicas:
  - Aceptación de términos
  - Licencia de uso
  - Limitación de responsabilidad
  - Reembolsos / cancelación
  - Propiedad intelectual
  - Limitaciones de uso
- [ ] Agregar enlace en footer: `<Link href="/terminos">Términos</Link>`
- [ ] Actualizar sitemap.xml si está dinámico
- [ ] Traducir al inglés si lo requieres

---

## ✨ 5 Mejoras Opcionales (No Críticas)

### 1. Mejorar og:image en /aviso-privacidad
**Tiempo:** 15 min  
**Impacto:** Mejor preview en redes sociales

```jsx
// Actual
<meta property="og:image" content={`${APP_URL}/assets/og-image.png`} />

// Mejorado (crear imagen específica)
<meta property="og:image" content={`${APP_URL}/assets/og-privacy.png`} />
```

### 2. Agregar Breadcrumb schema en dashboard
**Tiempo:** 1 hora  
**Impacto:** Rich snippets en Google Search

```jsx
// En app/dashboard/[module]/page.tsx
const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "position": 1, "name": "Home", "item": APP_URL },
    { "position": 2, "name": "Dashboard", "item": `${APP_URL}/dashboard` }
  ]
};

export const metadata = {
  // ... otros metadata ...
  // Agregar script con breadcrumb
};
```

### 3. Setup Cookie Banner (GDPR)
**Tiempo:** 2-3 horas  
**Impacto:** Cumplimiento GDPR/privacidad

```bash
npm install next-cookie-consent
```

Implementar banner que pida consentimiento para:
- Analytics
- Marketing cookies
- Essential cookies (siempre activos)

### 4. Validar Core Web Vitals
**Tiempo:** 30 min  
**Impacto:** SEO + Ranking

```bash
# Ir a https://pagespeed.web.dev/
# Ingresar: https://crawlsite.app
# Revisar:
# - LCP (< 2.5s) = Largest Contentful Paint
# - FID (< 100ms) = First Input Delay  
# - CLS (< 0.1) = Cumulative Layout Shift
```

**Si hay problemas:**
- Optimizar imágenes (Next Image component)
- Lazy load scripts no críticos
- Minificar CSS/JS

### 5. WCAG AA Audit formal
**Tiempo:** 1-2 horas  
**Impacto:** Accesibilidad legal

```bash
# Instalar Axe DevTools chrome extension
# Navegar a https://crawlsite.app
# Abrir DevTools → Axe DevTools → Scan

# O via CLI:
npm install --save-dev @axe-core/cli
npx axe https://crawlsite.app
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

```
CRÍTICAS (Esta semana):
[X] Verificar httpOnly en JWT cookie
[X] Validar rate limiting en /api/auth/login
[X] Crear página /terminos y agregar a footer

OPCIONALES (Próximas 2 semanas):
[X] Mejorar og:image en /aviso-privacidad
[X] Agregar Breadcrumb schema en dashboard
[X] Setup Cookie Banner (GDPR)
[ ] Core Web Vitals audit (PageSpeed Insights)
[X] WCAG AA formal audit (Axe DevTools)
```

---

## 🧪 TESTING LOCAL

```bash
# Desarrollo
npm run dev
# Acceder a http://localhost:3666

# Build production
npm run build
npm start
# Acceder a http://localhost:3000

# Validar seguridad headers
curl -I http://localhost:3000 | grep -i "x-frame-options"
# Debe mostrar: X-Frame-Options: SAMEORIGIN

# Validar estructura de archivos nuevos
ls -la pages/terminos.jsx  # Debe existir después de crear
```

---

## 📞 NOTAS

- **Cambios sin riesgo:** Crear /terminos es seguro (nuevo archivo, no afecta existentes)
- **Requiere testing:** JWT httpOnly y rate limiting requieren pruebas en dev + staging
- **Sin deadline:** Las mejoras opcionales son "nice-to-have"

---

**Documento de referencia rápida**  
**Última actualización:** 2026-04-29  
**Para:** Felipe Miss (femiss0693@gmail.com)
