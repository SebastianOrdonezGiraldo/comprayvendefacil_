import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements, memberAc, ownerAc } from "better-auth/plugins/organization/access";

/**
 * Roles de Better Auth para administrar la empresa (invitar, cambiar roles).
 * Los permisos de negocio (quién ve la caja, la ganancia, etc.) se revisan
 * en cada ruta con requiereRol(); ver nucleo/contexto.ts.
 */
export const control = createAccessControl(defaultStatements);

export const rolesAuth = {
  propietario: control.newRole(ownerAc.statements),
  administrador: control.newRole(adminAc.statements),
  vendedor: control.newRole(memberAc.statements),
  contador: control.newRole(memberAc.statements),
};
