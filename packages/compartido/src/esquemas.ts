import { z } from "zod";

/** Datos para crear la compraventa al registrarse por primera vez. */
export const esquemaNuevaEmpresa = z.object({
  nombre: z.string().trim().min(2, "Escriba el nombre de la compraventa").max(120),
  ciudad: z.string().trim().min(2, "Escriba la ciudad").max(80),
});
export type NuevaEmpresa = z.infer<typeof esquemaNuevaEmpresa>;

export const esquemaRegistro = esquemaNuevaEmpresa.extend({
  nombrePersona: z.string().trim().min(2, "Escriba su nombre").max(120),
  correo: z.email("Revise el correo"),
  clave: z.string().min(8, "La contraseña debe tener mínimo 8 caracteres").max(128),
});
export type DatosRegistro = z.infer<typeof esquemaRegistro>;

export const esquemaIngreso = z.object({
  correo: z.email("Revise el correo"),
  clave: z.string().min(1, "Escriba la contraseña"),
});
export type DatosIngreso = z.infer<typeof esquemaIngreso>;
