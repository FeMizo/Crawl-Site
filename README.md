# 🕷️ SEO Crawler

Herramienta web para detectar errores SEO. Interfaz en el browser + reporte Excel descargable.

## Errores detectados

| Error | Descripción |
|-------|-------------|
| **404 Not Found** | Páginas rotas |
| **Sin `<title>`** | Páginas sin título |
| **Sin meta description** | Sin descripción para buscadores |
| **Noindex activo** | Páginas bloqueadas con `noindex` |
| **Redirects internos** | URLs con redirecciones 301/302 |
| **Timeouts** | Páginas inaccesibles |

## Instalación

```bash
npm install
```

## Uso

```bash
# Producción
npm start

# Desarrollo (auto-reload)
npm run dev
```

Abre el navegador en **http://localhost:3000**

## Estructura

```
seo-crawler/
├── src/
│   └── server.js       ← Backend Express + crawler + generador Excel
├── public/
│   └── index.html      ← Interfaz web completa
├── package.json
└── README.md
```

## Requerimientos

- Node.js 14+
- Puerto 3000 disponible (o cambia con `PORT=xxxx npm start`)
