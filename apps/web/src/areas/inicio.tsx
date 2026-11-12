import { useYo } from "@/api/sesion";
import { Proximamente } from "./proximamente";

export function AreaInicio() {
  const { data } = useYo();
  const nombre = data?.usuario.nombre.split(" ")[0];
  return (
    <Proximamente titulo={`Hola, ${nombre ?? ""}`}>
      <p className="text-lg text-texto font-semibold mb-1">Aquí verá cuánto ganó este mes.</p>
      <p>Cuando registre su primer vehículo, esta pantalla le mostrará la ganancia, la plata en inventario y lo que le deben.</p>
    </Proximamente>
  );
}
