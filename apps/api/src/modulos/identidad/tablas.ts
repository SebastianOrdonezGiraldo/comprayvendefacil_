/**
 * Tablas del módulo de identidad.
 *
 * Las usa Better Auth (usuarios, sesiones, empresas, miembros e invitaciones).
 * Las propiedades en TypeScript conservan los nombres que espera Better Auth
 * (name, email, organizationId...); las columnas en la base están en español.
 *
 * Estas tablas NO llevan Row Level Security: Better Auth las consulta antes de
 * saber a qué empresa pertenece la persona. Las tablas de negocio sí la llevan.
 */
import { boolean, index, integer, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { columnaId, creadoEn, fechaHora } from "../../nucleo/columnas";

const actualizadoEn = () =>
  fechaHora("actualizado_en")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const usuario = pgTable("usuario", {
  id: columnaId(),
  name: text("nombre").notNull(),
  email: text("correo").notNull().unique(),
  emailVerified: boolean("correo_verificado").notNull().default(false),
  image: text("imagen"),
  createdAt: creadoEn(),
  updatedAt: actualizadoEn(),
});

export const sesion = pgTable(
  "sesion",
  {
    id: columnaId(),
    token: text("token").notNull().unique(),
    expiresAt: fechaHora("vence_en").notNull(),
    ipAddress: text("ip"),
    userAgent: text("navegador"),
    userId: uuid("usuario_id")
      .notNull()
      .references(() => usuario.id, { onDelete: "cascade" }),
    activeOrganizationId: uuid("empresa_activa_id"),
    createdAt: creadoEn(),
    updatedAt: actualizadoEn(),
  },
  (t) => [index("sesion_usuario_idx").on(t.userId)],
);

/** Credenciales (contraseña) de cada usuario. Se llama cuenta_auth para no confundirla con las cuentas de la caja. */
export const cuentaAuth = pgTable(
  "cuenta_auth",
  {
    id: columnaId(),
    accountId: text("cuenta_externa_id").notNull(),
    providerId: text("proveedor").notNull(),
    userId: uuid("usuario_id")
      .notNull()
      .references(() => usuario.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: fechaHora("access_token_vence_en"),
    refreshTokenExpiresAt: fechaHora("refresh_token_vence_en"),
    scope: text("alcance"),
    password: text("clave_hash"),
    createdAt: creadoEn(),
    updatedAt: actualizadoEn(),
  },
  (t) => [index("cuenta_auth_usuario_idx").on(t.userId)],
);

export const verificacion = pgTable("verificacion", {
  id: columnaId(),
  identifier: text("identificador").notNull(),
  value: text("valor").notNull(),
  expiresAt: fechaHora("vence_en").notNull(),
  createdAt: creadoEn(),
  updatedAt: actualizadoEn(),
});

/** La compraventa (tenant). */
export const empresa = pgTable("empresa", {
  id: columnaId(),
  name: text("nombre").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  metadata: text("metadatos"),
  nit: text("nit"),
  ciudad: text("ciudad"),
  createdAt: creadoEn(),
});

/** Una persona dentro de una empresa, con su rol y su % de comisión (en centésimas: 100 = 1 %). */
export const miembro = pgTable(
  "miembro",
  {
    id: columnaId(),
    organizationId: uuid("empresa_id")
      .notNull()
      .references(() => empresa.id, { onDelete: "cascade" }),
    userId: uuid("usuario_id")
      .notNull()
      .references(() => usuario.id, { onDelete: "cascade" }),
    role: text("rol").notNull(),
    comisionCentesimas: integer("comision_centesimas").notNull().default(0),
    createdAt: creadoEn(),
  },
  (t) => [uniqueIndex("miembro_empresa_usuario_uq").on(t.organizationId, t.userId)],
);

export const invitacion = pgTable(
  "invitacion",
  {
    id: columnaId(),
    organizationId: uuid("empresa_id")
      .notNull()
      .references(() => empresa.id, { onDelete: "cascade" }),
    email: text("correo").notNull(),
    role: text("rol").notNull(),
    status: text("estado").notNull().default("pending"),
    teamId: text("equipo_id"),
    inviterId: uuid("invitado_por")
      .notNull()
      .references(() => usuario.id, { onDelete: "cascade" }),
    expiresAt: fechaHora("vence_en").notNull(),
    createdAt: creadoEn(),
  },
  (t) => [index("invitacion_empresa_idx").on(t.organizationId)],
);
