# Compra y Vende Fácil

Sistema de gestión para compraventas de vehículos (carros y motos) en Colombia.
Un SaaS por mensualidad: cada compraventa es una **empresa** y nunca ve los datos de otra.

## Cómo está organizado

Monolito modular en TypeScript, en un solo repositorio con pnpm workspaces:

```
apps/
  api/                 Node + Hono + Drizzle + Better Auth
    src/nucleo/        base de datos, contexto de empresa, auditoría, errores, validación
    src/modulos/       un módulo por área de negocio (hoy: identidad)
    drizzle/           migraciones SQL
    pruebas/           pruebas de integración (incluye la de aislamiento entre empresas)
  web/                 React + Vite + Tailwind (marca "Placa")
    src/areas/         Inicio, Vehículos, Negocios, Caja
    src/componentes/   marco de la aplicación y componentes de la marca
    src/api/           cliente tipado de la API (hc de Hono) y sesión
packages/
  compartido/          esquemas Zod, roles y manejo de dinero (lo usan la API y la web)
```

La fuente de verdad del diseño es el documento de arquitectura del MVP.

## Arrancar en su computador

Necesita Node 22, pnpm 10 y Docker.

```bash
pnpm install
cp .env.example .env          # cambie BETTER_AUTH_SECRET: openssl rand -base64 32
docker compose up -d          # PostgreSQL y Redis
pnpm db:migrar                # crea las tablas y el usuario de base de datos de la aplicación
pnpm dev                      # API en :3000 y web en http://localhost:5173
```

Pruebas: `pnpm test` (usa la base `cvf_prueba`, que Docker crea sola). Tipos: `pnpm typecheck`.

## Reglas que no se negocian

1. **Separación por empresa.** Toda tabla de negocio lleva `empresa_id` y Row Level Security.
   Al crear una tabla nueva, agregue en su migración el mismo bloque de
   `drizzle/0001_seguridad_por_empresa.sql` (`ENABLE` + `FORCE` + política `solo_su_empresa`).
   Los datos de una compraventa se leen y escriben siempre dentro de `enEmpresa(empresaId, tx => ...)`.
   El `empresaId` sale de la sesión, nunca del navegador.
2. **La aplicación no puede saltarse RLS.** Se conecta con `DATABASE_URL` (usuario sin superusuario ni
   `BYPASSRLS`). `DATABASE_ADMIN_URL` es solo para migraciones.
3. **La prueba de aislamiento entre empresas (`apps/api/pruebas/aislamiento.test.ts`) no se salta.**
4. **Dinero en pesos enteros** (`bigint` en la base), nunca decimales ni floats. Porcentajes en
   centésimas (5 % = 500). Use las funciones de `packages/compartido/src/dinero.ts`.
5. **Nada se borra.** Lo que tiene dinero se anula con un registro inverso. La aplicación no tiene
   permiso de borrar ni editar la auditoría.
6. **Módulos con fronteras.** Un módulo solo llama al `servicio.ts` de otro, nunca a sus tablas.
7. **Sencillez para el cliente.** Lenguaje cotidiano, pocos campos, celular primero.

## Roles

`propietario` (quien crea la empresa), `administrador`, `vendedor`, `contador`.
Las rutas se protegen con `requiereRol(...)`; la web oculta botones, pero la regla vive en la API.
