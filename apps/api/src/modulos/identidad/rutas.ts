import { validar } from "../../nucleo/validar";
import { Hono } from "hono";
import { esquemaNuevaEmpresa } from "@cvf/compartido";
import { listarAuditoria } from "../../nucleo/auditoria";
import { requiereEmpresa, requiereRol, type Entorno } from "../../nucleo/contexto";
import { enEmpresa } from "../../nucleo/db";
import { noAutorizado } from "../../nucleo/errores";
import { crearEmpresa, empresaActivaDe } from "./servicio";

export const rutasIdentidad = new Hono<Entorno>()
  /** Quién soy, en qué empresa estoy y con qué rol. La web lo usa al abrir. */
  .get("/yo", async (c) => {
    const usuario = c.get("usuario");
    const sesion = c.get("sesion");
    if (!usuario || !sesion) throw noAutorizado();
    const empresa = await empresaActivaDe(usuario.id, sesion.activeOrganizationId);
    return c.json({
      usuario: { id: usuario.id, nombre: usuario.name, correo: usuario.email },
      empresa,
    });
  })

  /** Crear la compraventa (segundo paso del registro). */
  .post("/empresas", validar("json", esquemaNuevaEmpresa), async (c) => {
    const usuario = c.get("usuario");
    if (!usuario) throw noAutorizado();
    const empresa = await crearEmpresa(c.req.valid("json"), usuario.id, c.req.raw.headers);
    return c.json({ empresa }, 201);
  })

  /** Últimos cambios en la empresa. Solo dueño y administrador. */
  .get("/actividad", requiereEmpresa, requiereRol("propietario", "administrador"), async (c) => {
    const { empresaId } = c.get("empresa");
    const filas = await enEmpresa(empresaId, (tx) => listarAuditoria(tx));
    return c.json({
      actividad: filas.map((f) => ({
        id: f.id,
        accion: f.accion,
        entidad: f.entidad,
        entidadId: f.entidadId,
        usuarioId: f.usuarioId,
        fecha: f.creadoEn.toISOString(),
      })),
    });
  });
