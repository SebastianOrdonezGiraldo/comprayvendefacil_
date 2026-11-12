import { Navigate, Outlet, createBrowserRouter } from "react-router";
import { useYo } from "@/api/sesion";
import { AreaInicio } from "@/areas/inicio";
import { AreaCaja, AreaNegocios, AreaRegistrar, AreaVehiculos } from "@/areas/otras";
import { Marco } from "@/componentes/marco";
import { PaginaIngresar } from "@/paginas/ingresar";
import { PaginaCrearEmpresa, PaginaRegistro } from "@/paginas/registro";

function Cargando() {
  return (
    <div className="h-full grid place-items-center text-tenue" aria-busy="true">
      Cargando…
    </div>
  );
}

function ErrorCarga() {
  return (
    <div className="h-full grid place-items-center px-6 text-center">
      <p>
        No pudimos conectarnos. Revise su internet y{" "}
        <button className="underline font-semibold" onClick={() => location.reload()}>
          vuelva a intentar
        </button>
        .
      </p>
    </div>
  );
}

/** Solo para quien tiene sesión y compraventa. */
function ConEmpresa() {
  const { data, isPending, isError } = useYo();
  if (isPending) return <Cargando />;
  if (isError) return <ErrorCarga />;
  if (!data) return <Navigate to="/ingresar" replace />;
  if (!data.empresa) return <Navigate to="/crear-compraventa" replace />;
  return <Outlet />;
}

/** Para quien ya inició sesión pero no ha creado su compraventa. */
function SinEmpresa() {
  const { data, isPending, isError } = useYo();
  if (isPending) return <Cargando />;
  if (isError) return <ErrorCarga />;
  if (!data) return <Navigate to="/ingresar" replace />;
  if (data.empresa) return <Navigate to="/" replace />;
  return <Outlet />;
}

/** Ingreso y registro: si ya hay sesión, va directo a la aplicación. */
function Publica() {
  const { data, isPending } = useYo();
  if (isPending) return <Cargando />;
  if (data) return <Navigate to="/" replace />;
  return <Outlet />;
}

export const enrutador = createBrowserRouter([
  {
    element: <Publica />,
    children: [
      { path: "/ingresar", element: <PaginaIngresar /> },
      { path: "/registro", element: <PaginaRegistro /> },
    ],
  },
  { element: <SinEmpresa />, children: [{ path: "/crear-compraventa", element: <PaginaCrearEmpresa /> }] },
  {
    element: <ConEmpresa />,
    children: [
      {
        element: <Marco />,
        children: [
          { path: "/", element: <AreaInicio /> },
          { path: "/vehiculos", element: <AreaVehiculos /> },
          { path: "/negocios", element: <AreaNegocios /> },
          { path: "/caja", element: <AreaCaja /> },
          { path: "/registrar", element: <AreaRegistrar /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
