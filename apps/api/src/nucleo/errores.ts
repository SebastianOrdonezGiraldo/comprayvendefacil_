import type { ContentfulStatusCode } from "hono/utils/http-status";

/** Error con un mensaje que se le puede mostrar a la persona tal cual. */
export class ErrorApp extends Error {
  constructor(
    readonly estado: ContentfulStatusCode,
    mensaje: string,
    readonly codigo = "ERROR",
  ) {
    super(mensaje);
  }
}

export const noAutorizado = () => new ErrorApp(401, "Inicie sesión para continuar.", "SIN_SESION");
export const sinEmpresa = () => new ErrorApp(403, "Primero cree su compraventa.", "SIN_EMPRESA");
export const prohibido = () => new ErrorApp(403, "Su rol no tiene permiso para esto.", "PROHIBIDO");
