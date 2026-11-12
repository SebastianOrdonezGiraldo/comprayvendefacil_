import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context } from "hono";
import { entorno } from "./entorno";

/** Cabecera interna con la IP del cliente. Se sobrescribe siempre: lo que mande el navegador se ignora. */
export const CABECERA_IP = "x-cvf-ip-cliente";

/**
 * IP real del cliente, para el límite de intentos de ingreso.
 *
 * - Por defecto, la dirección del socket (la API atendiendo directo).
 * - Con IP_DESDE_PROXY=x-real-ip, la cabecera que pone Caddy. Úsela SOLO si la
 *   API no es alcanzable sin pasar por Caddy (en producción el puerto de la API
 *   no se publica) y Caddy reemplaza esa cabecera: header_up X-Real-IP {remote_host}.
 */
export function ipCliente(c: Context): string {
  if (entorno.IP_DESDE_PROXY) {
    const valor = c.req.header(entorno.IP_DESDE_PROXY)?.trim();
    if (valor && !valor.includes(",")) return valor;
  }
  try {
    return getConnInfo(c).remote.address ?? "desconocida";
  } catch {
    return "desconocida"; // pruebas sin socket real
  }
}
