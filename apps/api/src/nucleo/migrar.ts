/**
 * Aplica las migraciones y deja listo el usuario de base de datos de la aplicación.
 *
 * Corre con DATABASE_ADMIN_URL (dueño de las tablas). Luego crea o actualiza el
 * usuario de DATABASE_URL como un usuario SIN superusuario y SIN BYPASSRLS, con
 * permisos solo para leer y escribir datos. Así la aplicación nunca puede
 * saltarse la separación por empresa.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";
import { fileURLToPath } from "node:url";
import path from "node:path";

const adminUrl = process.env.DATABASE_ADMIN_URL;
const appUrl = process.env.DATABASE_URL;
if (!adminUrl || !appUrl) throw new Error("Faltan DATABASE_ADMIN_URL y DATABASE_URL");

const carpetaMigraciones =
  process.env.CARPETA_MIGRACIONES ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../drizzle");

export async function migrar() {
  const cliente = new Client({ connectionString: adminUrl });
  await cliente.connect();
  try {
    await migrate(drizzle(cliente), { migrationsFolder: carpetaMigraciones });
    await prepararUsuarioApp(cliente, new URL(appUrl!));
  } finally {
    await cliente.end();
  }
}

async function prepararUsuarioApp(cliente: Client, url: URL) {
  const usuario = decodeURIComponent(url.username);
  const clave = decodeURIComponent(url.password);
  if (!/^[a-z_][a-z0-9_]*$/.test(usuario)) throw new Error(`Nombre de usuario de base de datos inválido: ${usuario}`);
  const admin = new URL(adminUrl!);
  if (decodeURIComponent(admin.username) === usuario) {
    throw new Error("DATABASE_URL debe usar un usuario distinto al de DATABASE_ADMIN_URL (el dueño se salta RLS).");
  }
  const existe = await cliente.query("select 1 from pg_roles where rolname = $1", [usuario]);
  const claveSql = clave.replaceAll("'", "''");
  const verbo = existe.rowCount ? "alter" : "create";
  await cliente.query(
    `${verbo} role ${usuario} with login password '${claveSql}' nosuperuser nobypassrls nocreatedb nocreaterole`,
  );
  await cliente.query(`grant usage on schema public to ${usuario}`);
  await cliente.query(`grant select, insert, update, delete on all tables in schema public to ${usuario}`);
  await cliente.query(`grant usage, select on all sequences in schema public to ${usuario}`);
  // Nada se borra: la auditoría solo admite insertar y leer.
  await cliente.query(`revoke update, delete on auditoria from ${usuario}`);
}
