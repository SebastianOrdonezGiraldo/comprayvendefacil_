import { serve } from "@hono/node-server";
import { app } from "./app";
import { entorno } from "./nucleo/entorno";
import { migrar } from "./nucleo/migrar";
import { registro } from "./nucleo/registro";

// En producción las migraciones corren al arrancar (ver la arquitectura: un git push publica).
if (entorno.NODE_ENV === "production") {
  await migrar();
  registro.info("migraciones aplicadas");
}

serve({ fetch: app.fetch, port: entorno.PUERTO }, (info) => {
  registro.info(`API escuchando en http://localhost:${info.port}`);
});
