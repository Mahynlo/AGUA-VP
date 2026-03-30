import React from "react";
import { useLocation, Link } from "react-router-dom";
import { HiChartPie } from "react-icons/hi";
import {
  ClientsIcon,
  AyudaIcon,
  MedidoresIcon,
} from "../../IconsApp/IconsSidebar";
import {
  TarifaIcon,
  LecturasIcon,
  PagosIcon,
  ImpresionResibosIcon,
  HistorialResibosIcon,
} from "../../IconsApp/IconsResibos";

function SidebarApp() {
  const location = useLocation();

  // Ocultar elementos si estamos en el login o registro
  const isAuthRoute = location.pathname === '/' || location.pathname === '/registro' || location.pathname === '/recuperarPassword';

  if (isAuthRoute) return null;

  // Diseño de los ítems de navegación (Modo Claro / Modo Oscuro Suavizado)
  const itemClass = (path) => {
    // Lógica para saber si la ruta actual coincide o es hija de la ruta del botón
    const isActive = (location.pathname.startsWith(path) && path !== "/home") || location.pathname === path;

    return `
      relative flex flex-col items-center justify-center w-full py-3 mb-2 rounded-xl transition-all duration-300 ease-in-out group cursor-pointer
      ${isActive
        ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
        : "text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/50 hover:text-blue-600 dark:hover:text-blue-400"
      }
    `;
  };

  // Diseño de los iconos
  const getIconClass = (path) => {
    const isActive = (location.pathname.startsWith(path) && path !== "/home") || location.pathname === path;

    return `
      w-6 h-6 mb-1.5 transition-transform duration-300 ease-out
      ${isActive ? "scale-110 drop-shadow-sm" : "group-hover:scale-110 grayscale opacity-80 group-hover:opacity-100 group-hover:grayscale-0"}
    `;
  };

  // Indicador lateral activo (La pequeña barrita azul a la izquierda)
  const ActiveIndicator = ({ path }) => {
    const isActive = (location.pathname.startsWith(path) && path !== "/home") || location.pathname === path;
    if (!isActive) return null;
    return (
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-blue-600 dark:bg-blue-500 rounded-r-full shadow-[0_0_8px_rgba(37,99,235,0.5)]"></div>
    );
  };

  return (
    // CAMBIO APLICADO AQUÍ: dark:bg-zinc-900 en lugar de zinc-950 para un oscuro más suave
    <aside 
      className="fixed top-16 left-0 z-40 w-24 h-[calc(100vh-4rem)] bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800/80 transition-transform -translate-x-full sm:translate-x-0 overflow-y-auto custom-scrollbar pt-6 pb-4 shadow-sm" 
      aria-label="Barra Lateral"
    >
      <div className="flex flex-col items-center px-3 space-y-1">
        
        <Link to="/home" className={itemClass("/home")} title="Inicio">
          <ActiveIndicator path="/home" />
          <HiChartPie className={getIconClass("/home")} />
          <span className="text-[10px] font-bold tracking-wider uppercase text-center w-full truncate px-1">
            Inicio
          </span>
        </Link>

        <Link to="/clientes" className={itemClass("/clientes")} title="Clientes">
          <ActiveIndicator path="/clientes" />
          <ClientsIcon className={getIconClass("/clientes")} />
          <span className="text-[10px] font-bold tracking-wider uppercase text-center w-full truncate px-1">
            Clientes
          </span>
        </Link>

        <Link to="/medidores" className={itemClass("/medidores")} title="Medidores">
          <ActiveIndicator path="/medidores" />
          <MedidoresIcon className={getIconClass("/medidores")} />
          <span className="text-[10px] font-bold tracking-wider uppercase text-center w-full truncate px-1">
            Medidores
          </span>
        </Link>

        {/* Separador sutil ajustado al nuevo fondo oscuro */}
        <div className="w-10 h-px bg-slate-200 dark:bg-zinc-700/50 my-2"></div>

        <Link to="/resibos/lecturas" className={itemClass("/resibos/lecturas")} title="Lecturas">
          <ActiveIndicator path="/resibos/lecturas" />
          <LecturasIcon className={getIconClass("/resibos/lecturas")} />
          <span className="text-[10px] font-bold tracking-wider uppercase text-center w-full truncate px-1">
            Lecturas
          </span>
        </Link>

        <Link to="/resibos/impresion" className={itemClass("/resibos/impresion")} title="Impresión">
          <ActiveIndicator path="/resibos/impresion" />
          <ImpresionResibosIcon className={getIconClass("/resibos/impresion")} />
          <span className="text-[10px] font-bold tracking-wider uppercase text-center w-full truncate px-1">
            Impresión
          </span>
        </Link>

        <Link to="/resibos/tarifas" className={itemClass("/resibos/tarifas")} title="Tarifas">
          <ActiveIndicator path="/resibos/tarifas" />
          <TarifaIcon className={getIconClass("/resibos/tarifas")} />
          <span className="text-[10px] font-bold tracking-wider uppercase text-center w-full truncate px-1">
            Tarifas
          </span>
        </Link>

        <Link to="/resibos/pagos" className={itemClass("/resibos/pagos")} title="Pagos">
          <ActiveIndicator path="/resibos/pagos" />
          <PagosIcon className={getIconClass("/resibos/pagos")} />
          <span className="text-[10px] font-bold tracking-wider uppercase text-center w-full truncate px-1">
            Pagos
          </span>
        </Link>

        <Link to="/resibos/historial" className={itemClass("/resibos/historial")} title="Historial">
          <ActiveIndicator path="/resibos/historial" />
          <HistorialResibosIcon className={getIconClass("/resibos/historial")} />
          <span className="text-[10px] font-bold tracking-wider uppercase text-center w-full truncate px-1">
            Historial
          </span>
        </Link>

        {/* Separador sutil ajustado al nuevo fondo oscuro */}
        <div className="w-10 h-px bg-slate-200 dark:bg-zinc-700/50 my-2"></div>

        <Link to="/ayuda" className={itemClass("/ayuda")} title="Ayuda">
          <ActiveIndicator path="/ayuda" />
          <AyudaIcon className={getIconClass("/ayuda")} />
          <span className="text-[10px] font-bold tracking-wider uppercase text-center w-full truncate px-1">
            Ayuda
          </span>
        </Link>

      </div>
    </aside>
  );
}

export default SidebarApp;