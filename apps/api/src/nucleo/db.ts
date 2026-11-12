import { sql } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { entorno } from "./entorno";
import * as esquema from "./esquema";

export type Esquema = typeof esquema;
export type Db = NodePgDatabase<Esquema>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export const pool = new Pool({ connectionString: entorno.DATABASE_URL, max: 10 });

/**
 * Conexión general. Úsela solo para tablas sin empresa (identidad, plataforma).
 * Para datos de una compraventa use siempre enEmpresa().
 */
export const db: Db = drizzle(pool, { schema: esquema, casing: "snake_case" });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Ejecuta `trabajo` dentro de una transacción "amarrada" a una empresa.
 *
 * Fija app.empresa_id solo para esta transacción (equivale a SET LOCAL), y las
 * políticas de Row Level Security de PostgreSQL filtran cada consulta por esa
 * empresa. Si alguien olvida un filtro en el código, la base devuelve cero filas
 * de otras compraventas en vez de mostrarlas.
 */
export async function enEmpresa<T>(empresaId: string, trabajo: (tx: Tx) => Promise<T>): Promise<T> {
  if (!UUID.test(empresaId)) throw new Error("empresaId inválido");
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.empresa_id', ${empresaId}, true)`);
    return trabajo(tx);
  });
}
