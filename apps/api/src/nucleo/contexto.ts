import { and, eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { esRol, type Rol } from "@cvf/compartido";
import { auth } from "../modulos/identidad/auth";
import { miembro } from "../modulos/identidad/tablas";
import { db } from "./db";
import { noAutorizado, prohibido, sinEmpresa } from "./errores";

type Sesion = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export interface ContextoEmpresa {
  empresaId: string;
  usuarioId: string;
  rol: Rol;
}

export type Variables = {
  usuario: Sesion["user"] | null;
  sesion: Sesion["session"] | null;
  /** Solo existe después de requiereEmpresa. El empresaId NUNCA viene del navegador. */
  empresa: ContextoEmpresa;
};

export type Entorno = { Variables: Variables };

/** Lee la sesión de la cookie y la deja en el contexto (o null). */
export const conSesion = createMiddleware<Entorno>(async (c, next) => {
  const datos = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set("usuario", datos?.user ?? null);
  c.set("sesion", datos?.session ?? null);
  await next();
});

/** Exige sesión y empresa activa; deja empresaId, usuarioId y rol en el contexto. */
export const requiereEmpresa = createMiddleware<Entorno>(async (c, next) => {
  const usuario = c.get("usuario");
  const sesion = c.get("sesion");
  if (!usuario || !sesion) throw noAutorizado();

  const empresaId = sesion.activeOrganizationId;
  if (!empresaId) throw sinEmpresa();

  // Se confirma contra la base que la persona sigue siendo miembro y con qué rol.
  const [fila] = await db
    .select({ rol: miembro.role })
    .from(miembro)
    .where(and(eq(miembro.organizationId, empresaId), eq(miembro.userId, usuario.id)))
    .limit(1);
  if (!fila || !esRol(fila.rol)) throw sinEmpresa();

  c.set("empresa", { empresaId, usuarioId: usuario.id, rol: fila.rol });
  await next();
});

/** Permite la ruta solo a los roles indicados. La web oculta botones, pero la regla vive aquí. */
export const requiereRol = (...roles: Rol[]) =>
  createMiddleware<Entorno>(async (c, next) => {
    const { rol } = c.get("empresa");
    if (!roles.includes(rol)) throw prohibido();
    await next();
  });
