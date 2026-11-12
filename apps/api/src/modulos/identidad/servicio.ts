/**
 * Servicio del módulo de identidad: lo único que otros módulos pueden llamar.
 */
import { and, asc, eq, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import type { NuevaEmpresa, Rol } from "@cvf/compartido";
import { esRol } from "@cvf/compartido";
import { registrarAuditoria } from "../../nucleo/auditoria";
import { db } from "../../nucleo/db";
import { ErrorApp } from "../../nucleo/errores";
import { registro } from "../../nucleo/registro";
import { auth } from "./auth";
import { empresa, miembro } from "./tablas";

function crearSlug(nombre: string) {
  const base = nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base || "compraventa"}-${randomBytes(3).toString("hex")}`;
}

/**
 * La empresa en la que trabaja la persona: la activa de la sesión o, si la sesión
 * no tiene una (por ejemplo, si falló el último paso al crearla), su primera membresía.
 */
export async function empresaActivaDe(usuarioId: string, empresaActivaId: string | null | undefined) {
  const condicion = empresaActivaId
    ? and(eq(miembro.userId, usuarioId), eq(miembro.organizationId, empresaActivaId))
    : eq(miembro.userId, usuarioId);
  const [fila] = await db
    .select({ id: empresa.id, nombre: empresa.name, ciudad: empresa.ciudad, nit: empresa.nit, rol: miembro.role })
    .from(miembro)
    .innerJoin(empresa, eq(empresa.id, miembro.organizationId))
    .where(condicion)
    .orderBy(asc(miembro.createdAt))
    .limit(1);
  if (!fila || !esRol(fila.rol)) return null;
  return { id: fila.id, nombre: fila.nombre, ciudad: fila.ciudad, nit: fila.nit, rol: fila.rol as Rol };
}

/**
 * Crea la compraventa de quien se acaba de registrar. La empresa, la membresía
 * de propietario y la auditoría se guardan en UNA sola transacción: o queda
 * todo o no queda nada.
 */
export async function crearEmpresa(datos: NuevaEmpresa, usuarioId: string, cabeceras: Headers) {
  const creada = await db.transaction(async (tx) => {
    // Evita que dos clics simultáneos creen dos empresas para la misma persona.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${usuarioId}))`);
    const yaTiene = await tx.select({ id: miembro.id }).from(miembro).where(eq(miembro.userId, usuarioId)).limit(1);
    if (yaTiene.length > 0) throw new ErrorApp(409, "Usted ya tiene una compraventa registrada.", "YA_TIENE_EMPRESA");

    const [nueva] = await tx
      .insert(empresa)
      .values({ name: datos.nombre, slug: crearSlug(datos.nombre), ciudad: datos.ciudad })
      .returning({ id: empresa.id, nombre: empresa.name, ciudad: empresa.ciudad });
    if (!nueva) throw new ErrorApp(500, "No se pudo crear la compraventa. Intente de nuevo.");
    await tx.insert(miembro).values({ organizationId: nueva.id, userId: usuarioId, role: "propietario" });

    await tx.execute(sql`select set_config('app.empresa_id', ${nueva.id}, true)`);
    await registrarAuditoria(tx, {
      empresaId: nueva.id,
      usuarioId,
      accion: "crear",
      entidad: "empresa",
      entidadId: nueva.id,
      despues: { nombre: datos.nombre, ciudad: datos.ciudad },
    });
    return nueva;
  });

  // Deja la empresa como activa en la sesión. Si esto falla, empresaActivaDe() la encuentra igual.
  try {
    await auth.api.setActiveOrganization({ headers: cabeceras, body: { organizationId: creada.id } });
  } catch (error) {
    registro.warn({ err: error }, "no se pudo marcar la empresa activa en la sesión");
  }
  return creada;
}
