import { createMiddleware } from "hono/factory";
import type { Rol } from "@cvf/compartido";
import { auth } from "../modulos/identidad/auth";
import { empresaActivaDe } from "../modulos/identidad/servicio";
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

  // Se confirma contra la base que la persona sigue siendo miembro y con qué rol.
  const empresa = await empresaActivaDe(usuario.id, sesion.activeOrganizationId);
  if (!empresa) throw sinEmpresa();

  c.set("empresa", { empresaId: empresa.id, usuarioId: usuario.id, rol: empresa.rol });
  await next();
});

/** Permite la ruta solo a los roles indicados. La web oculta botones, pero la regla vive aquí. */
export const requiereRol = (...roles: Rol[]) =>
  createMiddleware<Entorno>(async (c, next) => {
    const { rol } = c.get("empresa");
    if (!roles.includes(rol)) throw prohibido();
    await next();
  });
