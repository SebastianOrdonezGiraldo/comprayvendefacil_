/**
 * PRUEBA DE AISLAMIENTO ENTRE EMPRESAS. No se puede saltar ni desactivar.
 *
 * Crea dos compraventas y verifica que ninguna ve datos de la otra, ni por la
 * API ni directamente en la base (Row Level Security).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "pg";
import { sql } from "drizzle-orm";
import { app } from "../src/app";
import { auditoria } from "../src/nucleo/auditoria";
import { db, enEmpresa, pool } from "../src/nucleo/db";

const ORIGEN = "http://localhost:5173";

async function pedir(ruta: string, opciones: { metodo?: string; cuerpo?: unknown; cookie?: string } = {}) {
  const cabeceras: Record<string, string> = { origin: ORIGEN };
  if (opciones.cuerpo !== undefined) cabeceras["content-type"] = "application/json";
  if (opciones.cookie) cabeceras.cookie = opciones.cookie;
  const respuesta = await app.request(ruta, {
    method: opciones.metodo ?? (opciones.cuerpo !== undefined ? "POST" : "GET"),
    headers: cabeceras,
    body: opciones.cuerpo !== undefined ? JSON.stringify(opciones.cuerpo) : undefined,
  });
  const galletas = respuesta.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  const texto = await respuesta.text();
  return { estado: respuesta.status, datos: texto ? JSON.parse(texto) : null, galletas };
}

async function registrar(nombre: string, correo: string) {
  const r = await pedir("/api/auth/sign-up/email", {
    cuerpo: { name: nombre, email: correo, password: "clave-segura-123" },
  });
  expect(r.estado).toBe(200);
  return { cookie: r.galletas, usuarioId: r.datos.user.id as string };
}

async function registrarConEmpresa(nombre: string, correo: string, empresa: string) {
  const persona = await registrar(nombre, correo);
  const r = await pedir("/api/empresas", { cuerpo: { nombre: empresa, ciudad: "Medellín" }, cookie: persona.cookie });
  expect(r.estado).toBe(201);
  return { ...persona, empresaId: r.datos.empresa.id as string };
}

let a: Awaited<ReturnType<typeof registrarConEmpresa>>;
let b: Awaited<ReturnType<typeof registrarConEmpresa>>;

beforeAll(async () => {
  a = await registrarConEmpresa("Ana Dueña", "ana@autos-a.co", "Autos La 80");
  b = await registrarConEmpresa("Beto Dueño", "beto@motos-b.co", "Motos del Sur");
});

afterAll(async () => {
  await pool.end();
});

describe("aislamiento entre empresas", () => {
  it("cada persona ve solo su compraventa, como propietario", async () => {
    const ra = await pedir("/api/yo", { cookie: a.cookie });
    const rb = await pedir("/api/yo", { cookie: b.cookie });
    expect(ra.datos.empresa).toMatchObject({ id: a.empresaId, nombre: "Autos La 80", rol: "propietario" });
    expect(rb.datos.empresa).toMatchObject({ id: b.empresaId, nombre: "Motos del Sur", rol: "propietario" });
  });

  it("la actividad de una empresa no muestra la de la otra", async () => {
    const ra = await pedir("/api/actividad", { cookie: a.cookie });
    const rb = await pedir("/api/actividad", { cookie: b.cookie });
    expect(ra.estado).toBe(200);
    expect(ra.datos.actividad).toHaveLength(1);
    expect(ra.datos.actividad[0].entidadId).toBe(a.empresaId);
    expect(rb.datos.actividad).toHaveLength(1);
    expect(rb.datos.actividad[0].entidadId).toBe(b.empresaId);
  });

  it("la base de datos filtra por empresa aunque la consulta no tenga filtro", async () => {
    const deA = await enEmpresa(a.empresaId, (tx) => tx.select().from(auditoria));
    expect(deA.map((f) => f.empresaId)).toEqual([a.empresaId]);
  });

  it("sin empresa fijada, la base no devuelve nada", async () => {
    const filas = await db.select().from(auditoria);
    expect(filas).toHaveLength(0);
  });

  it("no se puede escribir un registro a nombre de otra empresa", async () => {
    await expect(
      enEmpresa(a.empresaId, (tx) =>
        tx.insert(auditoria).values({ empresaId: b.empresaId, usuarioId: a.usuarioId, accion: "x", entidad: "x" }),
      ),
    ).rejects.toThrow();
  });

  it("la aplicación se conecta con un usuario que no puede saltarse RLS", async () => {
    const [fila] = (
      await db.execute(sql`select rolsuper, rolbypassrls from pg_roles where rolname = current_user`)
    ).rows as { rolsuper: boolean; rolbypassrls: boolean }[];
    expect(fila).toEqual({ rolsuper: false, rolbypassrls: false });
  });

  it("la auditoría no se puede borrar ni editar", async () => {
    await expect(enEmpresa(a.empresaId, (tx) => tx.delete(auditoria))).rejects.toThrow();
  });
});

describe("sesión y roles", () => {
  it("sin sesión, la API responde 401", async () => {
    const r = await pedir("/api/yo");
    expect(r.estado).toBe(401);
    expect(r.datos.error.codigo).toBe("SIN_SESION");
  });

  it("una persona sin compraventa no puede pedir datos de empresa", async () => {
    const sola = await registrar("Sin Empresa", "sola@correo.co");
    const r = await pedir("/api/actividad", { cookie: sola.cookie });
    expect(r.estado).toBe(403);
    expect(r.datos.error.codigo).toBe("SIN_EMPRESA");
  });

  it("no se pueden crear ni editar empresas por las rutas directas de Better Auth (no dejarían auditoría)", async () => {
    const crear = await pedir("/api/auth/organization/create", {
      cuerpo: { name: "Sin auditoría", slug: "sin-auditoria" },
      cookie: a.cookie,
    });
    expect(crear.estado).toBe(404);
    const editar = await pedir("/api/auth/organization/update", {
      cuerpo: { data: { name: "Otro nombre" }, organizationId: a.empresaId },
      cookie: a.cookie,
    });
    expect(editar.estado).toBe(404);
  });

  it("no se puede crear una segunda compraventa", async () => {
    const r = await pedir("/api/empresas", { cuerpo: { nombre: "Otra", ciudad: "Cali" }, cookie: a.cookie });
    expect(r.estado).toBe(409);
  });

  it("un vendedor no ve la actividad de la empresa", async () => {
    const vendedor = await registrar("Vero Vendedora", "vero@autos-a.co");
    // Se agrega como vendedora de la empresa A directamente en la base (las invitaciones llegan en otra entrega).
    const admin = new Client({ connectionString: process.env.DATABASE_ADMIN_URL });
    await admin.connect();
    await admin.query(
      "insert into miembro (id, empresa_id, usuario_id, rol) values (gen_random_uuid(), $1, $2, 'vendedor')",
      [a.empresaId, vendedor.usuarioId],
    );
    await admin.end();

    const activa = await pedir("/api/auth/organization/set-active", {
      cuerpo: { organizationId: a.empresaId },
      cookie: vendedor.cookie,
    });
    expect(activa.estado).toBe(200);
    const cookie = activa.galletas || vendedor.cookie;

    const yo = await pedir("/api/yo", { cookie });
    expect(yo.datos.empresa.rol).toBe("vendedor");
    const r = await pedir("/api/actividad", { cookie });
    expect(r.estado).toBe(403);
    expect(r.datos.error.codigo).toBe("PROHIBIDO");
  });

  it("un vendedor no puede activar una empresa ajena", async () => {
    const intruso = await registrar("Intruso", "intruso@correo.co");
    const r = await pedir("/api/auth/organization/set-active", {
      cuerpo: { organizationId: b.empresaId },
      cookie: intruso.cookie,
    });
    expect(r.estado).not.toBe(200);
  });
});

describe("volver a ingresar", () => {
  it("al ingresar de nuevo, la sesión queda en la compraventa de la persona", async () => {
    const r = await pedir("/api/auth/sign-in/email", {
      cuerpo: { email: "ana@autos-a.co", password: "clave-segura-123" },
    });
    expect(r.estado).toBe(200);
    const yo = await pedir("/api/yo", { cookie: r.galletas });
    expect(yo.datos.empresa).toMatchObject({ id: a.empresaId, rol: "propietario" });
  });
});
