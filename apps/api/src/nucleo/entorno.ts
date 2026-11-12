import { z } from "zod";

const esquemaEntorno = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PUERTO: z.coerce.number().int().default(3000),
  /** Conexión de la aplicación: usuario SIN permiso para saltarse RLS. */
  DATABASE_URL: z.url(),
  /** Conexión del dueño de las tablas: solo para migraciones. */
  DATABASE_ADMIN_URL: z.url(),
  /** Opcional en desarrollo. Si está, Better Auth guarda allí sesiones y límites de intentos. */
  REDIS_URL: z.url().optional(),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET debe tener mínimo 32 caracteres"),
  /** Dirección pública de la API, por ejemplo http://localhost:3000 */
  BETTER_AUTH_URL: z.url(),
  /** Dirección de la web, para permitir sus peticiones. */
  WEB_URL: z.url().default("http://localhost:5173"),
  /** Cabecera con la IP del cliente puesta por Caddy (p. ej. x-real-ip). Vacío = IP del socket. Ver nucleo/ip.ts. */
  IP_DESDE_PROXY: z.string().toLowerCase().optional(),
});

export type Entorno = z.infer<typeof esquemaEntorno>;

const resultado = esquemaEntorno.safeParse(process.env);
if (!resultado.success) {
  console.error("Faltan o están mal estas variables de entorno:");
  console.error(z.prettifyError(resultado.error));
  throw new Error("Configuración inválida. Revise el archivo .env (hay un ejemplo en .env.example).");
}

export const entorno: Entorno = resultado.data;
