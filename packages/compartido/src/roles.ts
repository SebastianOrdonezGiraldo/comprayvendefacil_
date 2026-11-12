/** Los cuatro roles del PRD. El que crea la empresa queda como propietario. */
export const ROLES = ["propietario", "administrador", "vendedor", "contador"] as const;
export type Rol = (typeof ROLES)[number];

export const NOMBRE_ROL: Record<Rol, string> = {
  propietario: "Dueño",
  administrador: "Administrador",
  vendedor: "Vendedor",
  contador: "Contador",
};

export function esRol(valor: unknown): valor is Rol {
  return typeof valor === "string" && (ROLES as readonly string[]).includes(valor);
}
