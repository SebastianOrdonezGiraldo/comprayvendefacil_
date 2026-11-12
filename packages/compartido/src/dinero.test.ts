import { describe, expect, it } from "vitest";
import { ErrorDinero, formatoPesos, leerPesos, porcentaje, sumar } from "./dinero";

describe("dinero", () => {
  it("suma pesos enteros", () => {
    expect(sumar(40_000_000, 1_500_000, -460_000)).toBe(41_040_000);
  });

  it("rechaza decimales", () => {
    expect(() => sumar(10.5)).toThrow(ErrorDinero);
  });

  it("aplica porcentajes en centésimas y redondea al peso", () => {
    expect(porcentaje(50_000_000, 500)).toBe(2_500_000); // 5 %
    expect(porcentaje(46_000_000, 100)).toBe(460_000); // 1 %
    expect(porcentaje(333, 150)).toBe(5); // 4,995 → 5
    expect(porcentaje(100, 50)).toBe(1); // 0,5 → 1
    expect(porcentaje(-100, 50)).toBe(-1);
  });

  it("calcula el ejemplo de la arquitectura sin errores de redondeo", () => {
    const comision = porcentaje(46_000_000, 100);
    const ganancia = sumar(46_000_000, -40_000_000, -1_500_000, -comision);
    expect(ganancia).toBe(4_040_000);
  });

  it("formatea en pesos colombianos", () => {
    expect(formatoPesos(46_000_000).replace(/\s/g, " ")).toBe("$ 46.000.000");
  });

  it("lee lo que escribe la persona", () => {
    expect(leerPesos("46.000.000")).toBe(46_000_000);
    expect(leerPesos("$ 1,500,000")).toBe(1_500_000);
    expect(leerPesos("abc")).toBeNull();
  });
});
