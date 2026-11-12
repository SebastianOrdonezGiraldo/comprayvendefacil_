import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utilidades";

type PropsCampo = InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string;
  error?: string;
  ayuda?: string;
};

/** Etiqueta + caja de texto + mensaje de error, en un solo componente. */
export const Campo = forwardRef<HTMLInputElement, PropsCampo>(function Campo(
  { etiqueta, error, ayuda, className, id, ...props },
  ref,
) {
  const generado = useId();
  const idCampo = id ?? generado;
  const idMensaje = `${idCampo}-mensaje`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={idCampo} className="text-base font-semibold">
        {etiqueta}
      </label>
      <input
        ref={ref}
        id={idCampo}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || ayuda ? idMensaje : undefined}
        className={cn(
          "min-h-12 rounded-placa border border-borde bg-superficie px-3.5 text-[17px] outline-none",
          "focus:border-asfalto focus:ring-2 focus:ring-placa",
          error && "border-perdida",
          className,
        )}
        {...props}
      />
      {(error || ayuda) && (
        <p id={idMensaje} className={cn("text-sm", error ? "text-perdida font-medium" : "text-tenue")}>
          {error ?? ayuda}
        </p>
      )}
    </div>
  );
});
