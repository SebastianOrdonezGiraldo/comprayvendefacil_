import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { conSesion, type Entorno } from "./nucleo/contexto";
import { entorno } from "./nucleo/entorno";
import { ErrorApp } from "./nucleo/errores";
import { registro } from "./nucleo/registro";
import { auth } from "./modulos/identidad/auth";
import { CABECERA_IP, ipCliente } from "./nucleo/ip";
import { rutasIdentidad } from "./modulos/identidad/rutas";

const app = new Hono<Entorno>();

app.use("*", secureHeaders());
app.use(
  "/api/*",
  cors({ origin: entorno.WEB_URL, credentials: true, allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE"] }),
);

/**
 * De las rutas de empresas de Better Auth solo se expone cambiar la empresa activa.
 * Crear, editar o borrar empresas pasa por nuestros servicios, que validan y dejan auditoría.
 */
const RUTAS_EMPRESA_PERMITIDAS = new Set(["/api/auth/organization/set-active"]);

// Better Auth atiende registro, ingreso y salida en /api/auth/*
app.on(["GET", "POST"], "/api/auth/*", (c) => {
  if (c.req.path.startsWith("/api/auth/organization/") && !RUTAS_EMPRESA_PERMITIDAS.has(c.req.path)) {
    return c.json({ error: { codigo: "NO_ENCONTRADO", mensaje: "Ruta no disponible." } }, 404);
  }
  // La IP para el límite de intentos la pone el servidor; nunca se toma tal cual del navegador.
  const cabeceras = new Headers(c.req.raw.headers);
  cabeceras.set(CABECERA_IP, ipCliente(c));
  return auth.handler(new Request(c.req.raw, { headers: cabeceras }));
});

app.use("/api/*", conSesion);

app.onError((error, c) => {
  if (error instanceof ErrorApp) {
    return c.json({ error: { codigo: error.codigo, mensaje: error.message } }, error.estado);
  }
  registro.error({ err: error, ruta: c.req.path }, "error no controlado");
  return c.json({ error: { codigo: "ERROR", mensaje: "Algo salió mal. Intente de nuevo." } }, 500);
});

const rutas = app
  .get("/salud", (c) => c.json({ ok: true }))
  .route("/api", rutasIdentidad);

export type TipoApp = typeof rutas;
export { app };
