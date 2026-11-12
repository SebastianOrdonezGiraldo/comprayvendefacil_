import { Redis } from "ioredis";
import type { SecondaryStorage } from "better-auth";
import { entorno } from "./entorno";

/** Redis es opcional en desarrollo; en producción siempre está. Las llaves llevan prefijo cvf:. */
export const redis = entorno.REDIS_URL
  ? new Redis(entorno.REDIS_URL, { keyPrefix: "cvf:", maxRetriesPerRequest: 2 })
  : null;

/** Almacén de Better Auth en Redis: sesiones en caché y límite de intentos de ingreso. */
export function almacenSecundario(r: Redis): SecondaryStorage {
  return {
    get: (llave) => r.get(llave),
    getAndDelete: (llave) => r.getdel(llave),
    set: async (llave, valor, ttl) => {
      if (ttl) await r.set(llave, valor, "EX", ttl);
      else await r.set(llave, valor);
    },
    delete: async (llave) => {
      await r.del(llave);
    },
    increment: async (llave, ttl) => {
      const [[, valor] = []] = (await r.multi().incr(llave).exec()) ?? [];
      if (valor === 1) await r.expire(llave, ttl);
      return Number(valor);
    },
  };
}
