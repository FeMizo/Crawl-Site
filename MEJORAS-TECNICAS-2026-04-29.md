# Mejoras Técnicas Detalladas - SEO Crawler
**Generado:** 29 de abril de 2026  
**Objetivo:** Implementaciones específicas de código  
**Audiencia:** Desarrolladores

---

## 🔐 SEGURIDAD

### 1. JWT HttpOnly Cookie (CRÍTICO)

**Objetivo:** Proteger contra XSS attacks

**Ubicación probable del código:**
```
lib/auth.ts
lib/server/auth.ts
pages/api/auth/login.js
pages/api/auth/register.js
```

**Búsqueda en codebase:**
```bash
grep -r "Set-Cookie" --include="*.ts" --include="*.js"
grep -r "auth_token" --include="*.ts" --include="*.js"
grep -r "document.cookie" --include="*.tsx" --include="*.jsx"
```

**Implementación esperada:**
```typescript
// ✅ CORRECTO
import { serialize } from 'cookie';

export function setAuthCookie(res: Response, token: string) {
  const cookie = serialize('auth_token', token, {
    httpOnly: true,        // 🔐 No accesible desde JavaScript
    secure: process.env.NODE_ENV === 'production', // 🔐 HTTPS only
    sameSite: 'strict',    // 🔐 CSRF prevention
    maxAge: 7 * 24 * 60 * 60, // 7 días
    path: '/'
  });
  
  res.setHeader('Set-Cookie', cookie);
}
```

**Verificación en navegador:**
```javascript
// En DevTools Console:
console.log(document.cookie); // ❌ auth_token NO debe aparecer aquí

// En Network tab:
// Response Headers → Set-Cookie debe tener: HttpOnly; Secure; SameSite=Strict
```

---

### 2. Rate Limiting en Endpoints Sensibles

**Objetivo:** Prevenir brute force en login, register, contact

**Instalación:**
```bash
npm install express-rate-limit --save
npm install @types/express-rate-limit --save-dev
```

**Implementación en `/pages/api/auth/login.ts`:**
```typescript
import rateLimit from 'express-rate-limit';

// Limiter: máx 5 intentos por 5 minutos
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: 'Demasiados intentos. Intenta en 5 minutos.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  keyGenerator: (req, res) => {
    // Rate limit por IP (o user ID si está logueado)
    return req.ip || req.socket.remoteAddress;
  },
  skip: (req, res) => {
    // Skip para IPs whitelist (ej: localhost en dev)
    return process.env.NODE_ENV === 'development';
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  // Aplicar limitador
  await new Promise((resolve, reject) => {
    loginLimiter(req, res, (err) => {
      if (err) reject(err);
      else resolve(null);
    });
  });
  
  // ... resto de lógica de login
}
```

**Aplicar también a:**
```
POST /api/auth/register
POST /api/auth/forgot-password
POST /api/contact
POST /api/projects (máx 10/min por usuario)
```

---

### 3. CORS Configuration

**Verificar en `next.config.js`:**
```javascript
// Actual está bien configurado:
// "connect-src 'self'" en CSP
// Esto significa: solo requests a mismo dominio

// Si necesitas API externa (ej: Stripe):
{
  key: "Content-Security-Policy",
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://js.stripe.com",
    "connect-src 'self' https://api.stripe.com",
    // ... resto
  ].join("; ")
}
```

**Test:**
```bash
# Debe rechazar requests a dominios externos
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Origin: https://attacker.com" \
  -d '{"name":"test"}'
# Esperado: 403 CORS error (o sin CORS headers)
```

---

## 📈 SEO

### 1. Breadcrumb Schema JSON-LD

**Dónde:** Dashboard pages (app/dashboard/*/page.tsx)

**Implementación:**
```typescript
// app/dashboard/projects/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Proyectos | SEO Crawler',
  description: 'Gestiona tus proyectos SEO...',
};

export default function ProjectsPage() {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Inicio",
        "item": "https://crawlsite.app"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Dashboard",
        "item": "https://crawlsite.app/dashboard"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Proyectos",
        "item": "https://crawlsite.app/dashboard/projects"
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {/* Rest of page */}
    </>
  );
}
```

**Verificación en Google Search Console:**
```
Rich Results → Structured Data → Breadcrumb
Debe mostrar las migas (items) correctamente
```

---

### 2. OG Image Optimization

**Crear imagen específica para /aviso-privacidad:**

**Opción A: Imagen estática**
```bash
# Crear archivo public/assets/og-privacy.png (1200x630px)
# Usar diseño consistente con og-image.png existente
```

**Opción B: Generar dinámicamente**
```typescript
// pages/api/og-image.ts (Open Graph Image generation)
import { ImageResponse } from '@vercel/og';

export default async function handler(req, res) {
  const { title = 'SEO Crawler' } = req.query;

  return new ImageResponse(
    (
      <div style={{
        fontSize: 128,
        background: 'linear-gradient(to right, #00ff88, #4d8dff)',
        width: '100%',
        height: '100%',
        display: 'flex',
        textAlign: 'center',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {title}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

**Uso en meta tags:**
```jsx
<meta property="og:image" content={`${APP_URL}/api/og-image?title=${encodeURIComponent(title)}`} />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

---

### 3. Dynamic Meta Tags en Dashboard

**Problema actual:** Dashboard pages usan metadata base (no dinámico)

**Solución: generateMetadata en App Router**

```typescript
// app/dashboard/projects/page.tsx
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Mis Proyectos | SEO Crawler',
    description: 'Administra tus proyectos SEO',
    // Noindex dashboard (private)
    robots: 'noindex, follow',
  };
}

export default function ProjectsPage() {
  // ...
}
```

**Para Pages Router:**
```jsx
// pages/dashboard.jsx
import Head from 'next/head';

export default function DashboardPage() {
  return (
    <>
      <Head>
        <title>Dashboard | SEO Crawler</title>
        <meta name="robots" content="noindex, follow" />
      </Head>
      {/* Content */}
    </>
  );
}
```

---

### 4. Mobile-First Meta Tags

**Verificar que están presentes:**

```html
<!-- Viewport -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />

<!-- Mobile Chrome -->
<meta name="theme-color" content="#0a0f1a" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

<!-- Android -->
<link rel="manifest" href="/manifest.json" />
```

**Crear `/public/manifest.json` si no existe:**
```json
{
  "name": "SEO Crawler",
  "short_name": "Crawler",
  "description": "Auditor SEO online",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#00ff88",
  "icons": [
    {
      "src": "/assets/favicon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/assets/favicon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 📝 TRADUCCIÓN

### Agregar keys para /terminos

**En `lib/ui-language.js`:**
```javascript
const translations = {
  es: {
    // ... keys existentes ...
    
    // Nuevas keys para /terminos
    termsPageTitle: "Términos de Servicio",
    termsPageDesc: "Términos y condiciones de uso de SEO Crawler",
    termsKicker: "Legal",
    
    termsSection1: "Aceptación de Términos",
    termsSection1Text: "Al usar SEO Crawler, aceptas estos términos de servicio...",
    
    termsSection2: "Licencia de Uso",
    termsSection2Text: "Te otorgamos una licencia no exclusiva para usar SEO Crawler...",
    
    termsSection3: "Limitación de Responsabilidad",
    termsSection3Text: "SEO Crawler se proporciona 'tal cual'...",
    
    termsSection4: "Reembolsos y Cancelación",
    termsSection4Text: "Puedes cancelar tu suscripción en cualquier momento...",
  },
  en: {
    // ... keys existentes ...
    
    termsPageTitle: "Terms of Service",
    termsPageDesc: "Terms and conditions of use of SEO Crawler",
    termsKicker: "Legal",
    
    termsSection1: "Acceptance of Terms",
    termsSection1Text: "By using SEO Crawler, you accept these terms of service...",
    
    termsSection2: "License to Use",
    termsSection2Text: "We grant you a non-exclusive license to use SEO Crawler...",
    
    termsSection3: "Limitation of Liability",
    termsSection3Text: "SEO Crawler is provided 'as is'...",
    
    termsSection4: "Refunds and Cancellation",
    termsSection4Text: "You can cancel your subscription at any time...",
  }
};
```

---

## ⚡ PERFORMANCE

### 1. Image Optimization

**Usar Next Image component:**
```jsx
// ❌ HTML nativo
<img src="/logo.png" alt="Logo" />

// ✅ Next Image (optimizado automáticamente)
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority // Para above-the-fold
/>
```

### 2. Font Loading Optimization

**Actual (en _document.jsx):**
```jsx
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&family=Syne:wght@400;600;800&display=swap" rel="stylesheet" />
```

**Mejora (usar font-display=swap):**
```jsx
// Ya está en la URL con display=swap ✅
// Esto es excelente para LCP
```

### 3. Script Loading Optimization

**Para scripts third-party (analytics, etc.):**
```jsx
// ❌ Bloquea rendering
<script src="https://analytics.google.com/..."></script>

// ✅ Carga asincrónica
<Script src="https://analytics.google.com/..." strategy="afterInteractive" />

// ✅ Web worker
<Script src="..." strategy="worker" />
```

---

## 🧪 TESTING CHECKLIST

### Local testing

```bash
# 1. Build production
npm run build
npm start

# 2. Validar security headers
curl -I http://localhost:3000 | grep -i "x-"

# 3. Validar meta tags
curl http://localhost:3000 | grep "<meta name"

# 4. Validar JSON-LD
curl http://localhost:3000 | grep -i "application/ld+json"

# 5. Lighthouse audit
# Abrir Chrome DevTools → Lighthouse → Analyze page load
```

### Staging/Production

```bash
# Google Rich Results Test
https://search.google.com/test/rich-results

# PageSpeed Insights
https://pagespeed.web.dev/

# Security Headers Test
https://securityheaders.com/

# WCAG Accessibility
# Chrome: Install Axe DevTools extension
```

---

## 📦 DEPENDENCIAS RECOMENDADAS

### Ya instaladas ✅
```json
{
  "helmet": "^7.0.0",
  "bcryptjs": "^3.0.2",
  "jsonwebtoken": "^9.0.2",
  "express-rate-limit": "^6.8.0"
}
```

### Por considerar agregar

```bash
# Para GDPR Cookie Banner
npm install cookie-consent --save

# Para email validation mejorada
npm install email-validator --save

# Para monitoreo de errores
npm install @sentry/nextjs --save

# Para generar Open Graph images
npm install @vercel/og --save
```

---

## 📊 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

```
SEMANA 1 (Crítica):
1. Verificar httpOnly en JWT (30 min)
2. Implementar rate limiting login (1 hora)
3. Crear página /terminos (2 horas)
4. Agregar link terminos al footer (15 min)

SEMANA 2 (Mejoras):
5. Breadcrumb schema en dashboard (1 hora)
6. OG image optimization (1 hora)
7. Core Web Vitals audit (1 hora)

SEMANA 3+ (Opcional):
8. Cookie banner GDPR (2-3 horas)
9. Monitoreo con Sentry (2 horas)
10. WCAG AA audit formal (2 horas)
```

---

**Documento técnico de referencia**  
**Última actualización:** 2026-04-29  
**Para desarrolladores del proyecto**
