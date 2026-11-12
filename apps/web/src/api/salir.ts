import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { authCliente } from "./auth";

/**
 * Cierra la sesión. Solo borra los datos locales y lleva al ingreso si el
 * servidor confirmó la salida; si no, avisa para que la persona lo intente de nuevo.
 */
export function useSalir() {
  const navegar = useNavigate();
  const cliente = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [saliendo, setSaliendo] = useState(false);

  async function salir() {
    setError(null);
    setSaliendo(true);
    try {
      const { error } = await authCliente.signOut();
      if (error) throw error;
    } catch {
      setSaliendo(false);
      setError("No se pudo cerrar la sesión. Revise su internet e intente de nuevo.");
      return;
    }
    cliente.clear();
    navegar("/ingresar", { replace: true });
  }

  return { salir, error, saliendo };
}
