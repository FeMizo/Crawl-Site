# Roadmap Auditado (estado real del codigo)

Fecha de auditoria: 2026-03-10

## 1) Analisis del repositorio

### Estructura detectada

- `src/`: backend crawler legacy en Express (`src/server.js`).
- `pages/`: frontend Pages Router (landing, auth, dashboard, proyectos, historial, ajustes).
- `app/`: App Router para modulo roadmap (`app/dashboard/roadmap`, `app/api/roadmap/**`).
- `components/`: UI compartida, layout, navegacion, landing, roadmap.
- `lib/`: capa de datos, auth, i18n UI, utilidades server (Prisma route wrapper).
- `prisma/`: esquema y seed de BD.
- `docs/`: guias de arquitectura.

### Modulos existentes

- Autenticacion (`/api/auth/*`, login/register/forgot/settings).
- Proyectos (`/api/projects*`, `pages/projects.jsx`).
- Historial/rastreos (`/api/history`, `pages/history.jsx`).
- Crawler SEO + export (`/api/crawl`, `/api/site-info`, `/api/download/:sessionId`).
- Roadmap interno (App Router + Prisma).
- Landing configurable por secciones (`lib/landing-sections.ts`, `components/landing/*`).

### Features dashboard detectadas

- Shell unificado con sidebar, header, cards y stats (`components/layout/AppShell.jsx`).
- Historial por proyecto en dashboard (`pages/dashboard.jsx`).
- Roadmap con progreso global/fase, alta de fases/tareas, toggle y borrado (`components/roadmap/RoadmapBoard.tsx`).
- Ajustes de cuenta (nombre, idioma, tema, cambio de contrasena) (`pages/settings.jsx`).

### Autenticacion, roles o permisos detectados

- Sesion JWT en cookie `auth_token` (`src/server.js`, `lib/roadmap-auth.ts`).
- Endpoints protegidos con `requireAuth` en backend legacy (`src/server.js`).
- Viewer/editor para roadmap con `ROADMAP_ADMIN_EMAILS` (`lib/roadmap-auth.ts`, `lib/server/roadmap-access.ts`).
- Estado actual: control por admin existe, pero si `ROADMAP_ADMIN_EMAILS` esta vacio, cualquier usuario autenticado edita roadmap.

### Mejoras visuales detectadas

- Sistema de temas (`dark`, `light`, `hc-dark`, `hc-light`) y persistencia local.
- Selector de idioma ES/EN y textos UI traducibles (`lib/ui-language.js`, `public/app.js`).
- Banderas/emoji para idioma y tema en navegacion (`components/navigation/*`).
- Modulo reutilizable de "Pasos rapidos" (`components/shared/QuickStepsModule.tsx`).

## 2) Roadmap actualizado (implementacion real)

| Fase | Tarea | Estado | done | Archivos relacionados | Notas tecnicas |
|---|---|---|---|---|---|
| Fundacion del producto | Definir arquitectura de App Router para modulos nuevos | done | `true` | `docs/app-router-architecture.md`, `app/dashboard/roadmap/page.tsx`, `app/api/roadmap/route.ts` | Estructura por modulo y convenciones App Router ya documentadas y aplicadas en roadmap. |
| Fundacion del producto | Crear capa Prisma reutilizable para server routes | done | `true` | `lib/server/prisma-route.ts`, `app/api/roadmap/phases/route.ts`, `app/api/roadmap/tasks/route.ts` | `runPrismaRoute` + `routeError` centralizan respuestas y manejo de errores Prisma. |
| Fundacion del producto | Configurar roadmap persistente con progreso global | done | `true` | `prisma/schema.prisma`, `lib/roadmap-data.ts`, `components/roadmap/RoadmapBoard.tsx` | Persistencia en `RoadmapPhase/RoadmapTask` y calculo de progreso global/fase implementado. |
| Crecimiento y calidad | Restringir edicion por administradores | partial | `false` | `lib/roadmap-auth.ts`, `lib/server/roadmap-access.ts`, `app/api/roadmap/tasks/[taskId]/route.ts` | Ya hay control editor, pero falta endurecer default para que no edite cualquier usuario cuando `ROADMAP_ADMIN_EMAILS` no esta configurado. Paso siguiente: negar edicion por defecto y habilitar solo allowlist/rol explicito. |
| Crecimiento y calidad | Agregar filtros por estado y busqueda de tareas | pending | `false` | `components/roadmap/RoadmapBoard.tsx`, `lib/roadmap-data.ts`, `app/api/roadmap/route.ts` | No existen filtros/search en UI ni query params en API. Paso siguiente: `status=all|done|pending`, `q=texto`, filtrado server-side + controles en UI. |
| Crecimiento y calidad | Agregar pruebas de integracion para endpoints roadmap | pending | `false` | `app/api/roadmap/*`, `lib/server/prisma-route.ts` | No hay suite de integracion para roadmap. Paso siguiente: agregar runner (Vitest/Jest) + pruebas para GET/POST/PATCH/DELETE y casos 401/403/404/400. |

## 3) Actualizacion automatica aplicada

- Se actualizo `prisma/seed.js` para que tareas `done` se creen con `completed: true`.
- Si la BD ya tiene fases creadas, el seed ahora sincroniza `completed` por titulo de tarea.
- Mapeo aplicado en seed:
  - `done`: 3 tareas.
  - `partial/pending`: 3 tareas (se mantienen `completed: false` hasta cierre real).
