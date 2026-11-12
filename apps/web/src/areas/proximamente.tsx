import type { ReactNode } from "react";

/** Estado vacío para las áreas que llegan en las siguientes entregas. */
export function Proximamente({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h1 className="text-3xl mb-4">{titulo}</h1>
      <div className="rounded-placa border border-dashed border-borde bg-superficie px-5 py-8 text-center text-tenue">
        {children}
      </div>
    </section>
  );
}
