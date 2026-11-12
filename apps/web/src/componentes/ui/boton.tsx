import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utilidades";

/** Botón (estilo shadcn/ui) con las variantes de la marca Placa. Alto mínimo de 48 px para usar con el dedo. */
const variantes = cva(
  "inline-flex items-center justify-center gap-2 rounded-placa font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-asfalto",
  {
    variants: {
      variante: {
        principal: "bg-placa text-sobre-placa border-2 border-asfalto hover:brightness-95",
        oscuro: "bg-asfalto text-white hover:bg-escenario",
        borde: "bg-superficie text-texto border border-borde hover:bg-fondo",
        texto: "bg-transparent text-texto underline-offset-4 hover:underline",
      },
      tamano: {
        normal: "min-h-12 px-5 text-base",
        grande: "min-h-14 px-6 text-lg w-full",
        chico: "min-h-10 px-3 text-sm",
      },
    },
    defaultVariants: { variante: "principal", tamano: "normal" },
  },
);

export type PropsBoton = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof variantes>;

export function Boton({ className, variante, tamano, ...props }: PropsBoton) {
  return <button className={cn(variantes({ variante, tamano }), className)} {...props} />;
}
