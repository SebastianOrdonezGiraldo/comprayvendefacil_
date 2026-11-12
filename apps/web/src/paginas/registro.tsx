import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { esquemaNuevaEmpresa, esquemaRegistro, type DatosRegistro, type NuevaEmpresa } from "@cvf/compartido";
import { authCliente, mensajeDeAuth } from "@/api/auth";
import { api, ErrorApi, leer } from "@/api/cliente";
import { useSalir } from "@/api/salir";
import { LLAVE_YO } from "@/api/sesion";
import { PantallaAcceso } from "@/componentes/pantalla-acceso";
import { AvisoError } from "@/componentes/ui/aviso";
import { Boton } from "@/componentes/ui/boton";
import { Campo } from "@/componentes/ui/campo";

async function crearEmpresa(datos: NuevaEmpresa) {
  return leer(await api.api.empresas.$post({ json: datos }));
}

/** Registro en una sola pantalla: la persona y su compraventa. */
export function PaginaRegistro() {
  const navegar = useNavigate();
  const cliente = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const formulario = useForm<DatosRegistro>({ resolver: zodResolver(esquemaRegistro) });
  const { errors, isSubmitting } = formulario.formState;

  const enviar = formulario.handleSubmit(async (datos) => {
    setError(null);
    const registro = await authCliente.signUp.email({
      name: datos.nombrePersona,
      email: datos.correo,
      password: datos.clave,
    });
    if (registro.error) return setError(mensajeDeAuth(registro.error.code));
    try {
      await crearEmpresa({ nombre: datos.nombre, ciudad: datos.ciudad });
    } catch {
      // La cuenta ya quedó creada: la pantalla de compraventa le permite terminar.
      await cliente.invalidateQueries({ queryKey: LLAVE_YO });
      return navegar("/crear-compraventa", { replace: true });
    }
    await cliente.invalidateQueries({ queryKey: LLAVE_YO });
    navegar("/", { replace: true });
  });

  return (
    <PantallaAcceso
      titulo="Cree su cuenta"
      pie={
        <>
          ¿Ya tiene cuenta?{" "}
          <Link to="/ingresar" className="font-semibold text-texto underline">
            Ingrese aquí
          </Link>
        </>
      }
    >
      <form onSubmit={enviar} className="flex flex-col gap-4" noValidate>
        <AvisoError>{error}</AvisoError>
        <Campo etiqueta="Su nombre" autoComplete="name" error={errors.nombrePersona?.message} {...formulario.register("nombrePersona")} />
        <Campo
          etiqueta="Nombre de la compraventa"
          placeholder="Ej.: Autos La 80"
          autoComplete="organization"
          error={errors.nombre?.message}
          {...formulario.register("nombre")}
        />
        <Campo etiqueta="Ciudad" placeholder="Ej.: Medellín" autoComplete="address-level2" error={errors.ciudad?.message} {...formulario.register("ciudad")} />
        <Campo
          etiqueta="Correo"
          type="email"
          inputMode="email"
          autoComplete="email"
          error={errors.correo?.message}
          {...formulario.register("correo")}
        />
        <Campo
          etiqueta="Contraseña"
          type="password"
          autoComplete="new-password"
          ayuda="Mínimo 8 caracteres"
          error={errors.clave?.message}
          {...formulario.register("clave")}
        />
        <Boton type="submit" tamano="grande" disabled={isSubmitting}>
          {isSubmitting ? "Creando su cuenta…" : "Crear cuenta"}
        </Boton>
      </form>
    </PantallaAcceso>
  );
}

/** Para quien ya tiene usuario pero aún no tiene compraventa (por ejemplo, si se cortó el internet al registrarse). */
export function PaginaCrearEmpresa() {
  const navegar = useNavigate();
  const cliente = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const formulario = useForm<NuevaEmpresa>({ resolver: zodResolver(esquemaNuevaEmpresa) });
  const sesion = useSalir();
  const { errors, isSubmitting } = formulario.formState;

  const enviar = formulario.handleSubmit(async (datos) => {
    setError(null);
    try {
      await crearEmpresa(datos);
    } catch (e) {
      return setError(e instanceof ErrorApi ? e.message : "No se pudo crear. Intente de nuevo.");
    }
    await cliente.invalidateQueries({ queryKey: LLAVE_YO });
    navegar("/", { replace: true });
  });

  return (
    <PantallaAcceso
      titulo="Datos de su compraventa"
      pie={
        <>
          ¿No es su cuenta?{" "}
          <button
            type="button"
            onClick={sesion.salir}
            disabled={sesion.saliendo}
            className="font-semibold text-texto underline"
          >
            Salir
          </button>
        </>
      }
    >
      <form onSubmit={enviar} className="flex flex-col gap-4" noValidate>
        <AvisoError>{error ?? sesion.error}</AvisoError>
        <Campo etiqueta="Nombre de la compraventa" placeholder="Ej.: Autos La 80" error={errors.nombre?.message} {...formulario.register("nombre")} />
        <Campo etiqueta="Ciudad" placeholder="Ej.: Medellín" error={errors.ciudad?.message} {...formulario.register("ciudad")} />
        <Boton type="submit" tamano="grande" disabled={isSubmitting}>
          {isSubmitting ? "Guardando…" : "Continuar"}
        </Boton>
      </form>
    </PantallaAcceso>
  );
}
