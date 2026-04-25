# Plan de Testing y Verificación — SEO Crawler
**24 de abril de 2026 — Verificación Post-Implementación**

---

## TESTING CHECKLIST

### 1. Testing Local (npm run dev)

#### Seguridad
- [ ] Verificar que rate limiting en `/api/auth/login` bloquea después de 20 intentos
- [ ] Probar open redirect en `?next=https://evil.com` → rechazado (redirecciona a /projects)
- [ ] Verificar que Security Headers están presentes con DevTools:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Strict-Transport-Security` present
- [ ] Confirmar que JWT cookie tiene `Secure` flag en HTTPS
- [ ] Verificar que `noindex, nofollow` meta tags están en `/login` y `/register`

#### SEO
- [ ] Buscar "site:crawlsite.app /login" en Google (debería NO aparecer)
- [ ] Verificar sitemap.xml en `http://localhost:3666/sitemap.xml` tiene 7 URLs
- [ ] Comprobar JSON-LD Schema es válido con JSON-LD Playground
- [ ] Revisar OG tags en home con `curl` o DevTools:
  ```bash
  curl -s http://localhost:3666 | grep 'og:title'
  ```
- [ ] Verificar robots.txt permite /precios, /contacto, bloqueado /api, /dashboard

#### Layout & Responsive
- [ ] Abrir home en mobile viewport (375px) - no debe quebrar
- [ ] Revisar que sidebar colapsa en <768px
- [ ] Verificar que footer links no se superponen en mobile
- [ ] Comprobar que fonts Manrope + Syne cargan desde fonts.googleapis.com
- [ ] Revisar que favicon se ve en todas las páginas (Ctrl+Shift+R para limpiar cache)

#### Traducción (i18n)
- [ ] Home → cambiar idioma a inglés desde TopHeader
- [ ] Verificar que localStorage persiste idioma (reload página)
- [ ] Comprobar que `<html lang="en">` se actualiza si cambia a inglés
- [ ] Revisar que footer links cambian a inglés (Inicio → Home, etc.)

#### Form Validation
- [ ] Intentar registrarse con email inválido (`test@`) → error claro
- [ ] Intentar registrarse con contraseña vacía → error requerido
- [ ] Verificar que email se valida antes de enviar
- [ ] Probar phone number con país inválido → error validación

---

### 2. Testing en Producción (Vercel)

#### Performance
- [ ] Medir Core Web Vitals con PageSpeed Insights
  - LCP (Largest Contentful Paint) < 2.5s
  - FID (First Input Delay) < 100ms
  - CLS (Cumulative Layout Shift) < 0.1
- [ ] Verificar que assets (CSS, JS) están minificados
- [ ] Comprobar que imágenes OG están comprimidas (<1MB)
- [ ] Revisar que fonts se cargan con `display=swap`

#### Security
- [ ] Escanear con OWASP ZAP o Burp Scanner
- [ ] Verificar headers con `curl -i https://crawlsite.app`
  ```bash
  curl -i https://crawlsite.app | grep -E 'X-Content|X-Frame|Strict-Transport'
  ```
- [ ] Probar CSRF protection intentando POST sin token desde otro sitio
- [ ] Verificar que cookies son `Secure` + `HttpOnly` + `SameSite=Lax`
- [ ] Comprobar que no hay sensitive data en localStorage (ver DevTools > Application)

#### SEO & Indexability
- [ ] Usar Google Search Console para verificar indexación
  - `/` debe estar indexada
  - `/precios` debe estar indexada
  - `/login`, `/register` deben estar bloqueadas (noindex)
- [ ] Verificar Sitemap en Google Search Console
- [ ] Usar Lighthouse para SEO audit:
  ```bash
  lighthouse https://crawlsite.app --view
  ```
- [ ] Buscar "site:crawlsite.app" para ver páginas indexadas
- [ ] Probar Rich Results Test de Google con URL

#### Mobile
- [ ] Abrir en iPhone 12 (375×812) - responsive check
- [ ] Verificar toque botones tienen mín 44×44px (WCAG)
- [ ] Probar en Chrome Android
- [ ] Verificar que viewport meta está presente

#### Accesibilidad
- [ ] Correr Axe DevTools scan en cada página pública
- [ ] Verificar contrast ratio con WAVE tool (mín WCAG AA)
- [ ] Probar navegación keyboard Tab → todos los elementos accesibles
- [ ] Verificar que focus visible en inputs (outline visible)
- [ ] Usar screen reader (NVDA en Windows) para home + login

#### Functionality
- [ ] Login con email + password correcto → sesión iniciada
- [ ] Login con contraseña incorrecta → error "Credenciales inválidas"
- [ ] Hacer click en "Olvidé mi contraseña" → email enviado
- [ ] Registrarse como nuevo usuario → email verificación
- [ ] Crear proyecto → se guarda en DB
- [ ] Ejecutar crawl → se completa sin timeout
- [ ] Descargar reporte Excel → archivo válido

---

### 3. Testing de Formularios

#### Email Validation
```javascript
// Casos de prueba
const testEmails = [
  "test@example.com",        // ✅ válido
  "user+tag@example.co.uk",  // ✅ válido
  "test",                    // ❌ inválido
  "test@",                   // ❌ inválido
  "@example.com",            // ❌ inválido
  "test @example.com",       // ❌ inválido (espacios)
];
```

#### Phone Validation
```javascript
// Casos de prueba
const testPhones = [
  { country: "MX", phone: "5512345678" },      // ✅ México válido
  { country: "MX", phone: "abc" },             // ❌ inválido
  { country: "US", phone: "2025551234" },      // ✅ USA válido
  { country: "MX", phone: "" },                // ⚠️  opcional, debe ser null
];
```

---

### 4. Testing de URLs y Redirects

#### 404 Handling
```bash
curl -I https://crawlsite.app/no-existe
# Debe retornar 404, no 200
```

#### Redirects
```bash
curl -I https://crawlsite.app/index.html
# Debe redirigir a /dashboard con 302
```

#### HTTPS Enforcement
```bash
curl -I http://crawlsite.app
# Debe redirigir a HTTPS
```

---

### 5. Database & API Testing

#### Auth Endpoints
```bash
# Login correcto
curl -X POST https://crawlsite.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Debe retornar 200 con JWT
```

#### Rate Limiting
```bash
# 21 intentos en 15 min desde misma IP
for i in {1..21}; do
  curl -X POST https://crawlsite.app/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test","password":"wrong"}'
done

# Intento #21 debe retornar 429 (Too Many Requests)
```

#### Crawl API
```bash
curl -X POST https://crawlsite.app/api/crawl \
  -H "Content-Type: application/json" \
  -d '{"projectId":"123","url":"https://example.com"}'

# Debe validar user session, retornar 200 + crawl job ID
```

---

### 6. Lighthouse Audit

```bash
# Install global
npm install -g @google/chrome-devtools-protocol

# Run audit
lighthouse https://crawlsite.app --view

# Check scores
# Performance: 90+
# Accessibility: 90+
# Best Practices: 90+
# SEO: 100
```

---

### 7. Manual Smoke Tests

#### Desktop (Chrome latest)
- [ ] Home loads without errors
- [ ] Can see all 5 pricing tiers
- [ ] FAQ section visible and readable
- [ ] Footer links work (external + internal)
- [ ] Form validation works on register

#### Mobile (Chrome mobile emulation)
- [ ] Home responsive at 375px
- [ ] Buttons are easily clickable (44x44px min)
- [ ] Text readable without zoom
- [ ] No horizontal scroll

#### Different Browsers
- [ ] Firefox latest
- [ ] Safari latest (if possible)
- [ ] Edge latest
- [ ] Mobile Safari (iOS)

---

### 8. Monitoring Post-Deploy

#### Logs
```bash
# Check Vercel logs for errors
vercel logs --prod

# Check for 404s, 500s
vercel logs --prod | grep -E '404|500'
```

#### Analytics
- [ ] Google Analytics: verificar eventos de signup, login
- [ ] Sentry: no nuevos errors después de deploy
- [ ] Error tracking: verificar console errors en DevTools

#### User Behavior
- [ ] Heatmaps con Hotjar (si está configurado)
- [ ] Revisar bounce rate en home
- [ ] Verificar conversion rate de /precios → /register

---

## VALIDATION TOOLS

| Tool | URL | Purpose |
|------|-----|---------|
| Google Lighthouse | https://developers.google.com/web/tools/lighthouse | Performance, SEO, a11y |
| Axe DevTools | https://www.deque.com/axe/devtools/ | Accessibility audit |
| WAVE | https://wave.webaim.org/ | Visual accessibility checker |
| Google Rich Results | https://search.google.com/test/rich-results | Schema validation |
| JSON-LD Playground | https://json-ld.org/playground/ | Schema validation |
| SSL Labs | https://www.ssllabs.com/ssltest/ | SSL/TLS security |
| OWASP ZAP | https://www.zaproxy.org/ | Security scanning |
| PageSpeed Insights | https://pagespeed.web.dev/ | Core Web Vitals |
| Mobile-Friendly Test | https://search.google.com/test/mobile-friendly | Mobile responsiveness |

---

## CRITICAL METRICS TO MONITOR

After deploying changes, monitor these KPIs:

### Performance
- Page load time < 3s
- Core Web Vitals: LCP, FID, CLS all green
- JS bundle size < 200KB (gzipped)

### Security
- No OWASP Top 10 vulnerabilities
- All security headers present
- No exposed secrets in logs

### SEO
- Crawlability: 0 blocked resources
- Indexability: public pages indexed
- Structured data: 0 errors

### User Experience
- Error rate < 1%
- Signup completion rate > 5%
- Average session duration > 2min

---

## ROLLBACK PLAN

If issues found after deploy:

```bash
# View deployment history
vercel deployments

# Rollback to previous
vercel rollback

# Or manually redeploy from git
git revert <commit-hash>
git push
# Wait for CI/CD to redeploy
```

---

## POST-IMPLEMENTATION TASKS

After all testing passes:

1. **Update Documentation**
   - [ ] Update CLAUDE.md with new features
   - [ ] Document 404 page behavior in README
   - [ ] Add i18n guidelines to docs/

2. **Notify Team**
   - [ ] Send deployment notice to team
   - [ ] Share test results in Slack/email
   - [ ] Update project status in tracker

3. **Monitor**
   - [ ] Set up alerts in Sentry
   - [ ] Enable Google Search Console monitoring
   - [ ] Monitor Core Web Vitals weekly

4. **Next Phase**
   - [ ] Schedule accessibility audit (WCAG AA formal)
   - [ ] Plan CSP policy implementation
   - [ ] Design onboarding tour component

---

## SIGN-OFF CHECKLIST

- [ ] All critical tests passed
- [ ] No new errors in logs
- [ ] Google Search Console indexed pages correctly
- [ ] Lighthouse scores acceptable (90+)
- [ ] Mobile responsive verified
- [ ] Accessibility basic checks passed
- [ ] Rate limiting working correctly
- [ ] Database migrations successful
- [ ] Email sending verified
- [ ] Team approved deployment

**Status:** Ready for production ✓

---

**Notes:**
- Keep this document updated after each deployment
- Schedule monthly SEO audits with Google Search Console
- Review Core Web Vitals monthly
- Conduct quarterly accessibility audits
