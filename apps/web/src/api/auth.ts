import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const authCliente = createAuthClient({
  basePath: "/api/auth",
  plugins: [organizationClient()],
});

/** Traduce los errores de Better Auth a mensajes en español cotidiano. */
export function mensajeDeAuth(codigo: string | undefined): string {
  switch (codigo) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "El correo o la contraseña no coinciden.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "Ya hay una cuenta con ese correo. Ingrese con su contraseña.";
    case "PASSWORD_TOO_SHORT":
      return "La contraseña debe tener mínimo 8 caracteres.";
    case "TOO_MANY_REQUESTS":
      return "Demasiados intentos. Espere un minuto y vuelva a intentar.";
    default:
      return "No se pudo completar. Revise su conexión e intente de nuevo.";
  }
}
