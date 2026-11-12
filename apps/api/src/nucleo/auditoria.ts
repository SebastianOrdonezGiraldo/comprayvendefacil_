import { desc } from "drizzle-orm";
import { index, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { empresa, usuario } from "../modulos/identidad/tablas";
import { columnaId, creadoEn } from "./columnas";
import type { Tx } from "./db";

/**
 * Quién hizo qué y cuándo. Es la primera tabla de negocio: lleva empresa_id
 * y Row Level Security (ver drizzle/0001_seguridad_por_empresa.sql).
 */
export const auditoria = pgTable(
  "auditoria",
  {
    id: columnaId(),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresa.id),
    usuarioId: uuid("usuario_id").references(() => usuario.id),
    accion: text("accion").notNull(),
    entidad: text("entidad").notNull(),
    entidadId: uuid("entidad_id"),
    antes: jsonb("antes"),
    despues: jsonb("despues"),
    creadoEn: creadoEn(),
  },
  (t) => [index("auditoria_empresa_fecha_idx").on(t.empresaId, t.creadoEn)],
);

export interface EntradaAuditoria {
  empresaId: string;
  usuarioId: string | null;
  accion: string;
  entidad: string;
  entidadId?: string | null;
  antes?: unknown;
  despues?: unknown;
}

/** Se llama DENTRO de la misma transacción del cambio, para que nunca quede un cambio sin rastro. */
export async function registrarAuditoria(tx: Tx, entrada: EntradaAuditoria) {
  await tx.insert(auditoria).values({
    empresaId: entrada.empresaId,
    usuarioId: entrada.usuarioId,
    accion: entrada.accion,
    entidad: entrada.entidad,
    entidadId: entrada.entidadId ?? null,
    antes: entrada.antes ?? null,
    despues: entrada.despues ?? null,
  });
}

/** Lo más reciente primero. RLS garantiza que solo vea lo de la empresa activa. */
export function listarAuditoria(tx: Tx, limite = 50) {
  return tx.select().from(auditoria).orderBy(desc(auditoria.creadoEn)).limit(limite);
}
