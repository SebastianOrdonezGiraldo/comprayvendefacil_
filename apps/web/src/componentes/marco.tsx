import { Car, Handshake, House, LogOut, Plus, Wallet, type LucideIcon } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { NOMBRE_ROL } from "@cvf/compartido";
import { useSalir } from "@/api/salir";
import { useYo } from "@/api/sesion";
import { cn } from "@/lib/utilidades";

function Pestana({ a, icono: Icono, texto }: { a: string; icono: LucideIcon; texto: string }) {
  return (
    <NavLink
      to={a}
      end={a === "/"}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center gap-0.5 py-1.5 min-h-13 text-[13px]",
          isActive ? "text-texto font-bold" : "text-tenue",
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icono size={24} strokeWidth={isActive ? 2.6 : 2} aria-hidden />
          <span>{texto}</span>
        </>
      )}
    </NavLink>
  );
}

/**
 * Marco de la aplicación: barra superior con el logo y la compraventa, y abajo
 * las cuatro áreas del PRD (Inicio, Vehículos, Negocios, Caja) más el botón Registrar.
 */
export function Marco() {
  const { data } = useYo();
  const navegar = useNavigate();
  const { salir, error, saliendo } = useSalir();

  return (
    <div className="h-full flex flex-col max-w-3xl mx-auto bg-fondo">
      <header className="flex-none flex items-center gap-3 bg-superficie border-b border-borde px-4 py-2.5">
        {/* En celular solo la placa; en pantallas más anchas el logo completo. */}
        <img src="/marca/cvf-placa.svg" alt="Compra y Vende Fácil" className="h-9 w-auto sm:hidden" />
        <img src="/marca/cvf-horizontal-claro.svg" alt="Compra y Vende Fácil" className="hidden sm:block h-9 w-auto" />
        <div className="ml-auto text-right leading-tight min-w-0">
          <b className="block truncate">{data?.empresa?.nombre}</b>
          <span className="text-sm text-tenue">
            {data?.empresa?.ciudad}
            {data?.empresa && ` · ${NOMBRE_ROL[data.empresa.rol]}`}
          </span>
        </div>
        <button
          onClick={salir}
          disabled={saliendo}
          className="p-2 -mr-2 rounded-placa text-tenue hover:text-texto hover:bg-fondo"
          aria-label="Salir"
          title="Salir"
        >
          <LogOut size={22} aria-hidden />
        </button>
      </header>

      {error && (
        <div role="alert" className="flex-none bg-perdida-fondo text-perdida font-medium px-4 py-2.5">
          {error}
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-4 py-5">
        <Outlet />
      </main>

      <nav className="flex-none grid grid-cols-5 items-end bg-superficie border-t border-borde px-1 pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom))]">
        <Pestana a="/" icono={House} texto="Inicio" />
        <Pestana a="/vehiculos" icono={Car} texto="Vehículos" />
        <button
          className="flex flex-col items-center gap-0.5 py-1.5 min-h-13 text-[13px] font-semibold"
          onClick={() => navegar("/registrar")}
        >
          <span className="grid place-items-center w-10 h-8 rounded-placa bg-placa text-sobre-placa border-2 border-asfalto">
            <Plus size={20} aria-hidden />
          </span>
          <span>Registrar</span>
        </button>
        <Pestana a="/negocios" icono={Handshake} texto="Negocios" />
        <Pestana a="/caja" icono={Wallet} texto="Caja" />
      </nav>
    </div>
  );
}
