import { useQuery } from "@tanstack/react-query";
import { api, ErrorApi, leer } from "./cliente";

export const LLAVE_YO = ["yo"] as const;

/**
 * Quién está usando la aplicación y en qué compraventa.
 * Devuelve null si no hay sesión (en vez de error), para decidir a dónde llevar a la persona.
 */
export function useYo() {
  return useQuery({
    queryKey: LLAVE_YO,
    queryFn: async () => {
      try {
        return await leer(await api.api.yo.$get());
      } catch (error) {
        if (error instanceof ErrorApi && error.estado === 401) return null;
        throw error;
      }
    },
    staleTime: 60_000,
  });
}
