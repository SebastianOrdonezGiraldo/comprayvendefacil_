import { hc, type ClientResponse } from "hono/client";
import type { SuccessStatusCode } from "hono/utils/http-status";
import type { TipoApp } from "@cvf/api/tipos";

/** Cliente tipado de la API: los tipos vienen directo de las rutas de Hono. */
export const api = hc<TipoApp>("/", { init: { credentials: "include" } });

export class ErrorApi extends Error {
  constructor(
    readonly estado: number,
    readonly codigo: string,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

type CuerpoOk<R> = R extends ClientResponse<infer T, infer S, infer _F> ? (S extends SuccessStatusCode ? T : never) : never;

/** Devuelve el cuerpo de una respuesta exitosa; si es error, lanza un ErrorApi con mensaje para la persona. */
export async function leer<R extends ClientResponse<unknown, number, string>>(respuesta: R): Promise<CuerpoOk<R>> {
  if (respuesta.ok) return (await respuesta.json()) as CuerpoOk<R>;
  let codigo = "ERROR";
  let mensaje = "Algo salió mal. Intente de nuevo.";
  try {
    const cuerpo = (await respuesta.json()) as { error?: { codigo?: string; mensaje?: string } };
    codigo = cuerpo.error?.codigo ?? codigo;
    mensaje = cuerpo.error?.mensaje ?? mensaje;
  } catch {
    // respuesta sin cuerpo JSON
  }
  throw new ErrorApi(respuesta.status, codigo, mensaje);
}
