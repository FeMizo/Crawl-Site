# SEO Crawler

Aplicacion para ejecutar rastreos SEO, guardar historial por proyecto y revisar hallazgos desde dashboard web.

## Pasos rapidos

1. Crea tu cuenta para habilitar persistencia de proyectos y corridas.
2. Registra la URL principal del sitio a auditar.
3. Ejecuta el rastreo y revisa los errores SEO priorizados en el dashboard.

## Errores detectados

| Error | Descripcion |
|-------|-------------|
| **404 Not Found** | Paginas rotas |
| **Sin `<title>`** | Paginas sin titulo |
| **Sin meta description** | Sin descripcion para buscadores |
| **Noindex activo** | Paginas bloqueadas con `noindex` |
| **Redirects internos** | URLs con redirecciones 301/302 |
| **Timeouts** | Paginas inaccesibles |

## Requerimientos

- Node.js 18.17+
- Docker (opcional para Postgres local)

## Instalacion

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

- Web: `http://localhost:3000`
- API crawler: `http://localhost:3001`

## Produccion local

```bash
npm run build
npm start
```

## Base de datos (Prisma)

```bash
npm run db:up
npm run db:push
npm run db:seed
```

## Arquitectura App Router

Guia para nuevos modulos: `docs/app-router-architecture.md`
