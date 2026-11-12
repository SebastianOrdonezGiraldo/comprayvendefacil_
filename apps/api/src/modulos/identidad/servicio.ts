/**
 * Servicio del módulo de identidad: lo único que otros módulos pueden llamar.
 */
import { and, eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import type { NuevaEmpresa, Rol } from "@cvf/compartido";
import { esRol } from "@cvf/compartido";
import { registrarAuditoria } from "../../nucleo/auditoria";
import { db, enEmpresa } from "../../nucleo/db";
import { ErrorApp } from "../../nucleo/errores";
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

export async function empresaDeUsuario(usuarioId: string, empresaId: string | null | undefined) {
  if (!empresaId) return null;
  const [fila] = await db
    .select({ id: empresa.id, nombre: empresa.name, ciudad: empresa.ciudad, nit: empresa.nit, rol: miembro.role })
    .from(miembro)
    .innerJoin(empresa, eq(empresa.id, miembro.organizationId))
    .where(and(eq(miembro.userId, usuarioId), eq(miembro.organizationId, empresaId)))
    .limit(1);
  if (!fila || !esRol(fila.rol)) return null;
  return { id: fila.id, nombre: fila.nombre, ciudad: fila.ciudad, nit: fila.nit, rol: fila.rol as Rol };
}

/**
 * Crea la compraventa de quien se acaba de registrar y la deja como empresa activa
 * de su sesión. Quien la crea queda como propietario.
 */
export async function crearEmpresa(datos: NuevaEmpresa, usuarioId: string, cabeceras: Headers) {
  const yaTiene = await db.select({ id: miembro.id }).from(miembro).where(eq(miembro.userId, usuarioId)).limit(1);
  if (yaTiene.length > 0) throw new ErrorApp(409, "Usted ya tiene una compraventa registrada.", "YA_TIENE_EMPRESA");

  const creada = await auth.api.createOrganization({
    headers: cabeceras,
    body: { name: datos.nombre, slug: crearSlug(datos.nombre), ciudad: datos.ciudad },
  });
  if (!creada) throw new ErrorApp(500, "No se pudo crear la compraventa. Intente de nuevo.");

  await enEmpresa(creada.id, (tx) =>
    registrarAuditoria(tx, {
      empresaId: creada.id,
      usuarioId,
      accion: "crear",
      entidad: "empresa",
      entidadId: creada.id,
      despues: { nombre: datos.nombre, ciudad: datos.ciudad },
    }),
  );

  return { id: creada.id, nombre: creada.name, ciudad: datos.ciudad };
}
