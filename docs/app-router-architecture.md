# Arquitectura App Router para modulos nuevos

Esta guia define el estandar para agregar modulos internos nuevos sin mezclar responsabilidades.

## 1) Estructura por modulo

```text
app/
  dashboard/
    <modulo>/
      page.tsx
  api/
    <modulo>/
      route.ts
      <recurso>/
        route.ts
      <recurso>/
        [id]/
          route.ts

lib/
  server/
    prisma-route.ts
    <modulo>-access.ts
  <modulo>-data.ts
  <modulo>-auth.ts

components/
  <modulo>/
    ...
types/
  <modulo>.ts
```

## 2) Convenciones de server routes

- Todas las rutas App Router (`app/api/**/route.ts`) deben:
  - Exportar `runtime = "nodejs"`.
  - Envolver handlers con `runPrismaRoute(...)`.
  - Lanzar errores controlados con `routeError(status, message)`.
- El acceso (viewer/editor) va en `lib/server/<modulo>-access.ts`.
- Las operaciones de datos van en `lib/<modulo>-data.ts`.

## 3) Capa Prisma reutilizable

`lib/server/prisma-route.ts` centraliza:

- Respuesta JSON estandar de exito/error.
- Mapeo de errores Prisma comunes:
  - `P2025` -> `404 Recurso no encontrado`
  - `P2002` -> `409 Registro duplicado`
- Manejo de errores de dominio via `RouteError`.

Esto evita repetir `try/catch` en cada endpoint y mantiene respuestas consistentes.

## 4) Flujo recomendado para crear un modulo

1. Crear pagina de modulo en `app/dashboard/<modulo>/page.tsx`.
2. Definir DTOs en `types/<modulo>.ts`.
3. Implementar servicio de datos en `lib/<modulo>-data.ts`.
4. Implementar autenticacion/permisos en `lib/<modulo>-auth.ts`.
5. Crear guardas para rutas en `lib/server/<modulo>-access.ts`.
6. Exponer endpoints en `app/api/<modulo>/**` usando `runPrismaRoute`.
7. Agregar componentes UI en `components/<modulo>/`.
