import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { conSesion, type Entorno } from "./nucleo/contexto";
import { entorno } from "./nucleo/entorno";
import { ErrorApp } from "./nucleo/errores";
import { registro } from "./nucleo/registro";
import { auth } from "./modulos/identidad/auth";
import { rutasIdentidad } from "./modulos/identidad/rutas";

const app = new Hono<Entorno>();

app.use("*", secureHeaders());
app.use(
  "/api/*",
  cors({ origin: entorno.WEB_URL, credentials: true, allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE"] }),
);

// Better Auth atiende registro, ingreso, salida y empresas en /api/auth/*
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

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
