import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type { ZodType } from "zod";
import { ErrorApp } from "./errores";

/** Valida la entrada con Zod; si falla, responde 400 con el primer mensaje en español. */
export const validar = <T extends ZodType, Destino extends keyof ValidationTargets>(destino: Destino, esquema: T) =>
  zValidator(destino, esquema, (resultado) => {
    if (!resultado.success) {
      const mensaje = resultado.error.issues[0]?.message ?? "Revise los datos.";
      throw new ErrorApp(400, mensaje, "DATOS_INVALIDOS");
    }
  });
