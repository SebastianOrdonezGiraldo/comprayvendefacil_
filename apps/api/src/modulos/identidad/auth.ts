import { asc, eq } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins/organization";
import { db } from "../../nucleo/db";
import { nuevoId } from "../../nucleo/columnas";
import { entorno } from "../../nucleo/entorno";
import { CABECERA_IP } from "../../nucleo/ip";
import { almacenSecundario, redis } from "../../nucleo/redis";
import { control, rolesAuth } from "./permisos";
import * as tablas from "./tablas";

export const auth = betterAuth({
  baseURL: entorno.BETTER_AUTH_URL,
  basePath: "/api/auth",
  secret: entorno.BETTER_AUTH_SECRET,
  trustedOrigins: [entorno.WEB_URL],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      usuario: tablas.usuario,
      sesion: tablas.sesion,
      cuenta_auth: tablas.cuentaAuth,
      verificacion: tablas.verificacion,
      empresa: tablas.empresa,
      miembro: tablas.miembro,
      invitacion: tablas.invitacion,
    },
  }),
  user: { modelName: "usuario" },
  session: {
    modelName: "sesion",
    expiresIn: 60 * 60 * 24 * 30, // 30 días: la gente entra desde el celular y no quiere volver a escribir la clave
    updateAge: 60 * 60 * 24,
  },
  account: { modelName: "cuenta_auth" },
  verification: { modelName: "verificacion" },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  secondaryStorage: redis ? almacenSecundario(redis) : undefined,
  rateLimit: {
    enabled: entorno.NODE_ENV === "production",
    storage: redis ? "secondary-storage" : "memory",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
    },
  },
  advanced: {
    cookiePrefix: "cvf",
    // Solo se confía en una cabecera que el servidor reescribe en cada petición (ver nucleo/ip.ts).
    ipAddress: { ipAddressHeaders: [CABECERA_IP] },
    database: { generateId: () => nuevoId() },
  },
  databaseHooks: {
    session: {
      create: {
        // Al ingresar, la sesión queda amarrada a la compraventa de la persona sin preguntarle nada.
        before: async (sesion) => {
          const [fila] = await db
            .select({ empresaId: tablas.miembro.organizationId })
            .from(tablas.miembro)
            .where(eq(tablas.miembro.userId, sesion.userId))
            .orderBy(asc(tablas.miembro.createdAt))
            .limit(1);
          return { data: { ...sesion, activeOrganizationId: fila?.empresaId ?? null } };
        },
      },
    },
  },
  plugins: [
    organization({
      ac: control,
      roles: rolesAuth,
      creatorRole: "propietario",
      // Una persona crea una sola compraventa al registrarse. Más empresas por persona no está en el MVP.
      organizationLimit: 1,
      schema: {
        organization: {
          modelName: "empresa",
          additionalFields: {
            nit: { type: "string", required: false },
            ciudad: { type: "string", required: false },
          },
        },
        member: {
          modelName: "miembro",
          additionalFields: {
            comisionCentesimas: { type: "number", required: false, defaultValue: 0, input: false },
          },
        },
        invitation: { modelName: "invitacion" },
      },
    }),
  ],
});

export type Auth = typeof auth;
