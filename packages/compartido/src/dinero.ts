/**
 * Dinero: siempre pesos colombianos ENTEROS. Nunca decimales ni floats.
 *
 * En la base de datos se guarda en columnas bigint. En JavaScript se maneja
 * como number entero, que es exacto hasta 9.007.199.254.740.991 (nueve mil
 * billones de pesos), muy por encima de cualquier cifra de una compraventa.
 *
 * Los porcentajes se guardan en centésimas de punto: 5 % = 500, 1,5 % = 150.
 */

export type Pesos = number;
/** Porcentaje en centésimas: 500 = 5 %. */
export type Centesimas = number;

export class ErrorDinero extends Error {}

/** Verifica que un valor sea un monto válido en pesos enteros. */
export function pesos(valor: number): Pesos {
  if (!Number.isSafeInteger(valor)) {
    throw new ErrorDinero(`Monto inválido: ${valor}. El dinero va en pesos enteros.`);
  }
  return valor;
}

/** Suma montos en pesos, verificando cada uno. */
export function sumar(...montos: Pesos[]): Pesos {
  return pesos(montos.reduce((total, m) => total + pesos(m), 0));
}

/**
 * Aplica un porcentaje y redondea al peso más cercano
 * (las mitades se alejan de cero: 0,5 → 1, −0,5 → −1).
 */
export function porcentaje(monto: Pesos, centesimas: Centesimas): Pesos {
  pesos(monto);
  if (!Number.isSafeInteger(centesimas) || centesimas < 0 || centesimas > 10_000) {
    throw new ErrorDinero(`Porcentaje inválido: ${centesimas} centésimas.`);
  }
  // Se calcula con BigInt para que el producto intermedio nunca pierda precisión.
  const producto = BigInt(monto) * BigInt(centesimas);
  const signo = producto < 0n ? -1n : 1n;
  const absoluto = producto * signo;
  const redondeado = ((absoluto + 5_000n) / 10_000n) * signo;
  return pesos(Number(redondeado));
}

const formateador = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

/** 46000000 → "$ 46.000.000" (formato colombiano). */
export function formatoPesos(monto: Pesos): string {
  return formateador.format(pesos(monto));
}

/**
 * Convierte lo que escribe la persona ("46.000.000", "$46,000,000", "46000000")
 * a pesos enteros. Devuelve null si no hay un número válido.
 */
export function leerPesos(texto: string): Pesos | null {
  const negativo = texto.trim().startsWith("-");
  const digitos = texto.replace(/[^\d]/g, "");
  if (digitos === "") return null;
  const valor = Number(digitos) * (negativo ? -1 : 1);
  return Number.isSafeInteger(valor) ? valor : null;
}
