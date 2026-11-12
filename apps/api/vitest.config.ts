import { defineConfig } from "vitest/config";

const BASE = process.env.PRUEBAS_PG ?? "localhost:5432/cvf_prueba";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "pruebas/**/*.test.ts"],
    globalSetup: ["./pruebas/preparar.ts"],
    fileParallelism: false,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: process.env.PRUEBAS_DATABASE_URL ?? `postgres://cvf_app_prueba:prueba@${BASE}`,
      DATABASE_ADMIN_URL: process.env.PRUEBAS_DATABASE_ADMIN_URL ?? `postgres://cvf_admin:clave-local@${BASE}`,
      BETTER_AUTH_SECRET: "secreto-de-pruebas-de-32-caracteres-minimo",
      BETTER_AUTH_URL: "http://localhost:3000",
      WEB_URL: "http://localhost:5173",
      CARPETA_MIGRACIONES: "./drizzle",
    },
  },
});
