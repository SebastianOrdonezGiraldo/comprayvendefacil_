import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { esquemaIngreso, type DatosIngreso } from "@cvf/compartido";
import { authCliente, mensajeDeAuth } from "@/api/auth";
import { LLAVE_YO } from "@/api/sesion";
import { PantallaAcceso } from "@/componentes/pantalla-acceso";
import { AvisoError } from "@/componentes/ui/aviso";
import { Boton } from "@/componentes/ui/boton";
import { Campo } from "@/componentes/ui/campo";

export function PaginaIngresar() {
  const navegar = useNavigate();
  const cliente = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const formulario = useForm<DatosIngreso>({ resolver: zodResolver(esquemaIngreso) });
  const { errors, isSubmitting } = formulario.formState;

  const enviar = formulario.handleSubmit(async (datos) => {
    setError(null);
    const { error } = await authCliente.signIn.email({ email: datos.correo, password: datos.clave });
    if (error) return setError(mensajeDeAuth(error.code));
    await cliente.invalidateQueries({ queryKey: LLAVE_YO });
    navegar("/", { replace: true });
  });

  return (
    <PantallaAcceso
      titulo="Ingresar"
      pie={
        <>
          ¿Primera vez?{" "}
          <Link to="/registro" className="font-semibold text-texto underline">
            Cree la cuenta de su compraventa
          </Link>
        </>
      }
    >
      <form onSubmit={enviar} className="flex flex-col gap-4" noValidate>
        <AvisoError>{error}</AvisoError>
        <Campo
          etiqueta="Correo"
          type="email"
          autoComplete="email"
          inputMode="email"
          error={errors.correo?.message}
          {...formulario.register("correo")}
        />
        <Campo
          etiqueta="Contraseña"
          type="password"
          autoComplete="current-password"
          error={errors.clave?.message}
          {...formulario.register("clave")}
        />
        <Boton type="submit" tamano="grande" disabled={isSubmitting}>
          {isSubmitting ? "Ingresando…" : "Ingresar"}
        </Boton>
      </form>
    </PantallaAcceso>
  );
}
