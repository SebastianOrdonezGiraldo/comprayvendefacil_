import type { ReactNode } from "react";

/** Mensaje de error general de un formulario. */
export function AvisoError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <div role="alert" className="rounded-placa bg-perdida-fondo px-4 py-3 text-perdida font-medium">
      {children}
    </div>
  );
}
