import type { ReactNode } from "react";

/** Marco de las pantallas de ingreso y registro: franja negra con el logo y el formulario debajo. */
export function PantallaAcceso({ titulo, children, pie }: { titulo: string; children: ReactNode; pie?: ReactNode }) {
  return (
    <div className="min-h-full flex flex-col">
      <header className="bg-asfalto px-4 pt-10 pb-8 flex justify-center">
        <img src="/marca/cvf-horizontal-oscuro.svg" alt="Compra y Vende Fácil" className="h-14 w-auto" />
      </header>
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-6">
        <h1 className="text-3xl mb-5">{titulo}</h1>
        {children}
        {pie && <div className="mt-6 text-center text-tenue">{pie}</div>}
      </main>
    </div>
  );
}
