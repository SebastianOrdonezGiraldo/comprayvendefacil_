import { Client } from "pg";
import type { TestProject } from "vitest/node";

/** Aplica las migraciones en la base de pruebas y la deja vacía antes de correr. */
export default async function preparar(proyecto: TestProject) {
  const env = proyecto.config.env as Record<string, string>;
  Object.assign(process.env, env);
  const { migrar } = await import("../src/nucleo/migrar");
  await migrar();
  const cliente = new Client({ connectionString: env.DATABASE_ADMIN_URL });
  await cliente.connect();
  await cliente.query(
    "truncate auditoria, invitacion, miembro, empresa, sesion, cuenta_auth, verificacion, usuario cascade",
  );
  await cliente.end();
}
