# Reporte de Auditoría y Mejoras — SEO Crawler
**Fecha:** 24 de abril de 2026  
**Proyecto:** SEO Crawler (crawlsite.app)  
**Estado:** Análisis automático basado en README.md, CLAUDE.md y código fuente

---

## Resumen Ejecutivo

El sitio web de SEO Crawler muestra una arquitectura sólida y bien documentada. El reporte anterior (2026-04-23) implementó 12 mejoras significativas en **seguridad**, **SEO** y **estructura**. Este análisis complementario identifica áreas adicionales de optimización en **traducción**, **flujo de usuario**, **layout responsivo**, **nuevos errores detectados** y **recomendaciones avanzadas**.

---

## 1. ESTADO DE SEGURIDAD

### ✅ Implementado (desde 2026-04-23)
- Rate limiting en rutas de autenticación (login, register, forgot-password)
- Open redirect prevention en `login.jsx` con `safeRedirect()`
- Security headers HTTP en Next.js (X-Content-Type-Options, X-Frame-Options, HSTS, etc.)
- Cookie JWT en `auth_token` (validación en cada módulo)

### ⚠️ Recomendaciones adicionales
1. **CSP (Content Security Policy):**
   - Status actual: helmjs con config por defecto
   - Recomendación: Configurar CSP personalizado restricto a `'self'` + Google Fonts
   - Impacto: Previene inyección de scripts de orígenes desconocidos
   - Esfuerzo: Medio (auditar scripts inline)

2. **Cookie SameSite Policy:**
   - Status actual: `"lax"` (permite redirecciones desde links externos)
   - Recomendación: Cambiar a `"strict"` si el flujo de email no es crítico
   - Impacto: Mayor protección CSRF pero puede romper flujo post-login desde emails
   - Esfuerzo: Bajo

3. **Input Sanitization:**
   - Revisar que `normalizeUrl()` en `pages/index.jsx` rechace URLs malformadas
   - Verificar que el campo de nombre de proyecto valida contra inyección XSS
   - Esfuerzo: Bajo (auditoría)

4. **API Rate Limiting avanzado:**
   - El crawl endpoint `/api/crawl.js` tiene rate limiting
   - Se recomienda implementar rate limiting por usuario (no solo por IP) para evitar abuso de cuentas premium
   - Esfuerzo: Medio

---

## 2. ESTADO DE SEO

### ✅ Implementado (desde 2026-04-23)
- `noindex, nofollow` en `/login` y `/register`
- `robots.txt` actualizado con Disallow en rutas privadas
- JSON-LD Schema: SoftwareApplication + HowTo en home
- FAQPage schema en `/precios`
- Twitter Card metatags (`twitter:site`)
- OG tags en `/aviso-privacidad`
- Sitemap XML dinámico con cache headers

### ⚠️ Recomendaciones adicionales
1. **Open Graph en Home y Precios:**
   - Status: `twitter:site` presente, OG tags parciales
   - Recomendación: Agregar `og:type`, `og:image:alt`, `og:locale` en todas las páginas públicas
   - Prioridad: Media
   - Impacto: Mejora compartibilidad en redes sociales

2. **Structured Data para Testimonios/Reviews:**
   - Status: Ausente
   - Recomendación: Si hay testimonios de clientes, agregar `@type: Review` o `@type: AggregateRating`
   - Impacto: Posible rich result "Opiniones" en SERP
   - Esfuerzo: Bajo-Medio

3. **Página de Términos de Servicio:**
   - Status: Ausente (solo aviso privacidad)
   - Recomendación: Crear `/terminos` y agregarla a `robots.txt` (Disallow) y footer
   - Impacto: Mejora confianza legal y cumplimiento GDPR
   - Esfuerzo: Medio

4. **robots.txt mejorado:**
   - Status: Hardcoded en `public/robots.txt`
   - Recomendación: Generar dinámicamente con `process.env.APP_URL` (como sitemap.xml)
   - Impacto: Flexibilidad en deploy
   - Esfuerzo: Bajo

5. **Página de Contacto Pública:**
   - Status: Endpoint `/api/contact` existe pero sin página `/contacto`
   - Recomendación: Crear página `/contacto` indexable (no en robots.txt Disallow)
   - Impacto: +conversion, mejora SEO, trust signals
   - Esfuerzo: Bajo

6. **Canonical tags en home:**
   - Status: Revisar si existe `<link rel="canonical">` en `pages/index.jsx`
   - Recomendación: Agregar `canonical` explícito si falta
   - Impacto: Previene duplicate content
   - Esfuerzo: Trivial

---

## 3. ESTADO DE FLUJO DE USUARIO

### ✅ Buenas prácticas implementadas
- Autenticación OAuth-ready (JWT en cookie)
- Email verification flow con resend (en login.jsx)
- Password recovery completo (forgot-password → reset-password)
- Role-based access control (OWNER, SUPER_ADMIN, ADMIN, EDITOR, USER)

### ⚠️ Áreas de mejora

1. **Flujo de onboarding:**
   - Status: Home → Signup → Login → Dashboard
   - Problema: El usuario debe crear un proyecto manualmente desde home
   - Recomendación: Post-signup, redirigir a quick-onboarding que:
     - Explique los 3 pasos (crear proyecto → correr crawl → revisar errores)
     - Sugiera URL de ejemplo para primer crawl
     - Muestre tour de dashboard
   - Impacto: +conversion, -churn
   - Esfuerzo: Medio

2. **Página 404/500 personalizada:**
   - Status: No existe `pages/404.jsx`
   - Problema: Usuarios en URLs inexistentes ven error genérico de Next.js
   - Recomendación: Crear `pages/404.jsx` con:
     - Mensagem clara ("Página no encontrada")
     - Links a Home, Precios, Registro
     - Sugerencia de contacto si es error sistemático
   - Impacto: Mejora UX y SEO (404 debe devolverse con status 404, no 200)
   - Esfuerzo: Bajo

3. **Email de bienvenida:**
   - Status: Probablemente ausente
   - Recomendación: Post-signup, enviar email con:
     - Confirmación de cuenta
     - Link a dashboard
     - Primer paso: crear proyecto
   - Impacto: Mejora engagement
   - Esfuerzo: Medio

4. **Flujo de redirección post-login:**
   - Status: usa `safeRedirect()` con fallback `/projects`
   - Problema: Usuario nuevo redirige a projects (vacío) en lugar de home/onboarding
   - Recomendación: Detectar si es primera vez, redirigir a home con parámetro `?new=1`
   - Esfuerzo: Bajo

5. **Plan upgrade flow:**
   - Status: Existe `/subscription` pero flujo no es claro
   - Recomendación: En dashboard, mostrar upgrade CTA cuando usuario toca limits
   - Esfuerzo: Medio

---

## 4. ESTADO DE LAYOUT Y RESPONSIVE

### ✅ Buenas prácticas
- Dark-first UI (por defecto)
- Fonts Manrope + Syne ya establecidas
- CSS variables por tema (dark, light, hc-dark, hc-light)
- Viewport meta en `_document.jsx`
- Favicon centralizado

### ⚠️ Problemas detectados

1. **Layout responsive en mobile:**
   - Status: AppShell tiene `no-sidebar` state
   - Problema: Footer en AppShell tiene links hardcodeados a `https://aionsite.com.mx/`
   - Recomendación:
     - Verificar que sidebar collapsa en mobile (<768px)
     - Revisar que grid/cards se ajusten en 320px-480px (mobile)
     - Testing: verificar en Chrome DevTools mobile viewport
   - Esfuerzo: Bajo (auditoría)

2. **Contraste de colores accesible:**
   - Status: WCAG AA compliance no verificada
   - Problema: `--muted` (#585858 en dark) puede tener bajo contraste con `--bg` (#080808)
   - Recomendación: Correr herramienta Axe / WAVE en cada página
   - Esfuerzo: Bajo (tooling)

3. **Focus visible en inputs:**
   - Status: Revisar estilos CSS para `:focus`
   - Problema: Navegación keyboard podría ser difícil si focus no es visible
   - Recomendación: Agregar `outline: 2px solid var(--accent)` en inputs/buttons
   - Esfuerzo: Bajo

4. **Typography scale:**
   - Status: Fonts son Manrope + Syne
   - Problema: No hay documentación de tamaños (h1, h2, body, caption)
   - Recomendación: Crear guía CSS con @media queries para mobile/tablet/desktop
   - Esfuerzo: Bajo

---

## 5. ESTADO DE TRADUCCIÓN

### ✅ Implementado
- Sistema bilingüe (es/en) vía `lib/ui-language.js`
- LocalStorage para persistencia de idioma
- `data-theme` y `data-lang` en `<html>`

### ⚠️ Problemas detectados

1. **Traducciones incompletas:**
   - Status: `ui-language.js` tiene llaves en español, falta traducción al inglés
   - Ejemplo: `navDashboard: "Inicio"` sin entry `en.navDashboard`
   - Recomendación:
     - Agregar segundo objeto `en: { ... }` al UI_COPY
     - Traducir todas las llaves al inglés
     - Crear script de validación para detectar llaves faltantes
   - Prioridad: Media
   - Esfuerzo: Medio-Alto

2. **Hardcoded Spanish text:**
   - Status: Revisar componentes como AppShell (footer links, copyright)
   - Problema: Links como "Home", "Blog", "Precios", "Aviso de privacidad" están en español
   - Recomendación: Pasar a `useUiLanguage()` y tUi
   - Esfuerzo: Bajo

3. **Meta tags en 2 idiomas:**
   - Status: Todas las páginas usan solo español en `<title>` y `<meta name="description">`
   - Problema: Si hay versión en inglés, Google no sabe cuál servir
   - Recomendación: Si se planing i18n completo:
     - Usar `<link rel="alternate" hreflang="es" ... />`
     - Crear rutas `/en/*` o subdomain `en.crawlsite.app`
     - Duplicar meta tags en cada idioma
   - Esfuerzo: Alto
   - Prioridad: Baja (decidir si hay mercado en inglés)

4. **Phone input localization:**
   - Status: PhoneField tiene `phoneCountry: "MX"`
   - Problema: Debería basarse en locale del navegador o IP
   - Recomendación: Detectar país con `navigator.language` o IP geolocation
   - Esfuerzo: Bajo

---

## 6. NUEVOS ERRORES Y BUGS DETECTADOS

### ⚠️ Potenciales problemas

1. **Hydration mismatch en theme/lang:**
   - Risk: Si script en `_document.jsx` runs antes de render, puede causar flicker
   - Solución: Verificar que INIT_SCRIPT se ejecuta correctamente
   - Test: Reload home en DevTools, verificar sin flash de tema

2. **Email validation:**
   - Status: Usa `lib/contact-validation.js` con `validateEmail()`
   - Risk: Regex podría rechazar emails válidos (RFC 5322 muy amplio)
   - Recomendación: Usar librería `email-validator` o enviar email de confirmación
   - Esfuerzo: Bajo

3. **Phone validation:**
   - Status: Usa `validatePhoneInput()` en register
   - Risk: Si es requerido, algunos usuarios no pueden registrarse (ej: sin teléfono)
   - Recomendación: Hacer campo opcional (ya está, revisar UX)
   - Esfuerzo: Bajo

4. **Missing error pages:**
   - Status: No hay `pages/404.jsx` ni `pages/500.jsx`
   - Impact: Usuarios ven default Next.js error en 404s
   - Esfuerzo: Bajo

5. **Crawl timeout handling:**
   - Status: `/api/crawl.js` existe pero no hay timeout docs
   - Risk: Si crawler cuelga, request puede quedar pendiente
   - Recomendación: Documentar timeout behavior (probablemente 30s en Vercel)
   - Esfuerzo: Bajo

---

## 7. RECOMENDACIONES POR PRIORIDAD

### 🔴 CRÍTICA (implementar inmediatamente)
1. Crear página 404 personalizada
2. Traducir todas las llaves a inglés (si se planea i18n)
3. Hardcoded text en AppShell → usar tUi()

### 🟡 ALTA (próximas 2 semanas)
1. Página de Términos de Servicio
2. Página de Contacto pública
3. CSP policy personalizada
4. Onboarding post-signup mejorado

### 🔵 MEDIA (próximo mes)
1. Agregar testimonios con Review schema
2. Testing WCAG AA (accesibilidad)
3. Canonical tags en todas las páginas
4. Email de bienvenida post-signup

### 🟢 BAJA (backlog)
1. i18n completo (si hay mercado en inglés)
2. Sitemap dinámico con robots.txt
3. IP geolocation para phone country
4. Rate limiting avanzado (por usuario)

---

## 8. CHECKLIST DE IMPLEMENTACIÓN COMPLETADA

| Mejora | Estado | Fecha |
|--------|--------|-------|
| Rate limiting auth | ✅ | 2026-04-23 |
| Open redirect fix | ✅ | 2026-04-23 |
| Security headers | ✅ | 2026-04-23 |
| noindex auth pages | ✅ | 2026-04-23 |
| robots.txt update | ✅ | 2026-04-23 |
| FAQPage schema | ✅ | 2026-04-23 |
| Twitter Card tags | ✅ | 2026-04-23 |
| OG tags privacy | ✅ | 2026-04-23 |
| lang="es" en HTML | ✅ | 2026-04-23 |
| Footer link a precios | ✅ | 2026-04-23 |
| Página 404 | ❌ | Pendiente |
| Página de contacto | ❌ | Pendiente |
| Traducción inglés | ❌ | Pendiente |
| Terms of Service | ❌ | Pendiente |

---

## 9. PRÓXIMOS PASOS

1. **Inmediato:** Crear `pages/404.jsx` con links internos y contacto
2. **Semana 1:** Agregar página `/contacto` indexable
3. **Semana 2:** Crear `/terminos` y actualizar footer
4. **Semana 3:** Configurar CSP personalizada en `next.config.js`
5. **Semana 4:** Auditar accesibilidad WCAG AA con Axe

---

**Nota:** Este reporte complementa el análisis anterior (2026-04-23). Las 12 mejoras ya implementadas son sólidas. Las recomendaciones aquí son de optimización adicional y no bloqueadores.
