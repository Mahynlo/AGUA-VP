import React from "react";
import { useLocation, Link } from "react-router-dom";
import { HiChartPie, HiShieldCheck } from "react-icons/hi";
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
} from "../../IconsApp/IconsResibos";
import { useAuth } from "../../context/AuthContext";

/**
 * Paleta de estilos e identidades por módulo según aguavp-ui-system
 */
const COLOR_STYLES = {
  blue: {
    active: "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black",
    hover: "hover:bg-blue-50/70 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400",
    iconActive: "text-blue-600 dark:text-blue-400",
  },
  amber: {
    active: "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black",
    hover: "hover:bg-amber-50/70 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400",
    iconActive: "text-amber-600 dark:text-amber-400",
  },
  emerald: {
    active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black",
    hover: "hover:bg-emerald-50/70 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400",
    iconActive: "text-emerald-600 dark:text-emerald-400",
  },
  indigo: {
    active: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black",
    hover: "hover:bg-indigo-50/70 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400",
    iconActive: "text-indigo-600 dark:text-indigo-400",
  },
  sky: {
    active: "bg-sky-500/10 text-sky-600 dark:text-sky-400 font-black",
    hover: "hover:bg-sky-50/70 dark:hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400",
    iconActive: "text-sky-600 dark:text-sky-400",
  },
  slate: {
    active: "bg-slate-500/15 text-slate-800 dark:text-zinc-100 font-black",
    hover: "hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-100",
    iconActive: "text-slate-800 dark:text-zinc-200",
  },
};

const NAV_GROUPS = [
  {
    key: "principal",
    label: "Principal",
    items: [
      {
        path: "/home",
        label: "Inicio",
        icon: HiChartPie,
        color: "indigo",
        indicator: "bg-indigo-600 dark:bg-indigo-500",
        shadow: "shadow-[0_0_10px_rgba(79,70,229,0.5)]",
      },
      {
        path: "/clientes",
        label: "Clientes",
        icon: ClientsIcon,
        color: "blue",
        indicator: "bg-blue-600 dark:bg-blue-500",
        shadow: "shadow-[0_0_10px_rgba(37,99,235,0.5)]",
      },
      {
        path: "/medidores",
        label: "Medidores",
        icon: MedidoresIcon,
        color: "blue",
        indicator: "bg-blue-600 dark:bg-blue-500",
        shadow: "shadow-[0_0_10px_rgba(37,99,235,0.5)]",
      },
    ],
  },
  {
    key: "operaciones",
    label: "Operaciones",
    items: [
      {
        path: "/resibos/lecturas",
        label: "Lecturas",
        icon: LecturasIcon,
        color: "amber",
        indicator: "bg-amber-500 dark:bg-amber-400",
        shadow: "shadow-[0_0_10px_rgba(245,158,11,0.5)]",
      },
      {
        path: "/resibos/impresion",
        label: "Impresión",
        icon: ImpresionResibosIcon,
        color: "indigo",
        indicator: "bg-indigo-600 dark:bg-indigo-500",
        shadow: "shadow-[0_0_10px_rgba(79,70,229,0.5)]",
      },
      {
        path: "/resibos/tarifas",
        label: "Tarifas",
        icon: TarifaIcon,
        color: "emerald",
        indicator: "bg-emerald-600 dark:bg-emerald-500",
        shadow: "shadow-[0_0_10px_rgba(16,185,129,0.5)]",
      },
      {
        path: "/resibos/pagos",
        label: "Pagos",
        icon: PagosIcon,
        color: "emerald",
        indicator: "bg-emerald-600 dark:bg-emerald-500",
        shadow: "shadow-[0_0_10px_rgba(16,185,129,0.5)]",
      },
    ],
  },
  {
    key: "sistema",
    label: "Sistema",
    items: [
      {
        path: "/administrador",
        label: "Admin",
        icon: HiShieldCheck,
        color: "slate",
        indicator: "bg-slate-800 dark:bg-slate-200",
        shadow: "shadow-[0_0_10px_rgba(100,116,139,0.5)]",
        requireRoles: ["superadmin", "administrador", "operador"],
      },
      {
        path: "/ayuda",
        label: "Ayuda",
        icon: AyudaIcon,
        color: "sky",
        indicator: "bg-sky-600 dark:bg-sky-500",
        shadow: "shadow-[0_0_10px_rgba(2,132,199,0.5)]",
      },
    ],
  },
];

function SidebarApp() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Ocultar elementos si estamos en el login o si no hay sesión activa
  const isAuthRoute =
    location.pathname === "/" ||
    location.pathname === "/registro" ||
    location.pathname === "/recuperarPassword";

  if (isAuthRoute || !isAuthenticated()) return null;

  const userRol = user?.rol;

  const handleItemClick = (e, item) => {
    if (item.path === "/ayuda") {
      if (window.docsApp?.openHelpWindow) {
        e.preventDefault();
        window.docsApp.openHelpWindow();
      }
    }
  };

  return (
    <aside
      className="fixed top-16 left-0 z-40 w-24 h-[calc(100dvh-4rem)] bg-white dark:bg-zinc-950 border-r border-slate-200/80 dark:border-zinc-800/80 transition-transform -translate-x-full sm:translate-x-0 overflow-y-auto custom-scrollbar py-3.5 shadow-sm select-none"
      aria-label="Barra Lateral de Navegación"
    >
      <div className="flex flex-col items-center px-2 space-y-1">
        {NAV_GROUPS.map((group, groupIndex) => {
          const visibleItems = group.items.filter((item) => {
            if (!item.requireRoles) return true;
            return item.requireRoles.includes(userRol);
          });

          if (visibleItems.length === 0) return null;

          return (
            <React.Fragment key={group.key}>
              {groupIndex > 0 && (
                <div className="w-10 h-px bg-slate-200/80 dark:bg-zinc-800/80 my-2 mx-auto shrink-0" />
              )}
              {visibleItems.map((item) => {
                const isActive =
                  (location.pathname.startsWith(item.path) && item.path !== "/home") ||
                  location.pathname === item.path;

                const style = COLOR_STYLES[item.color] || COLOR_STYLES.blue;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={(e) => handleItemClick(e, item)}
                    className={`relative flex flex-col items-center justify-center w-full py-2.5 px-1.5 rounded-2xl transition-all duration-200 group cursor-pointer active:scale-95 ${
                      isActive
                        ? `${style.active} shadow-sm ring-1 ring-black/5 dark:ring-white/5`
                        : `text-slate-500 dark:text-zinc-400 ${style.hover}`
                    }`}
                    title={item.label}
                  >
                    {isActive && (
                      <div
                        className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 rounded-r-full ${item.indicator} ${item.shadow}`}
                      />
                    )}
                    <Icon
                      className={`w-6 h-6 mb-1 shrink-0 transition-transform duration-200 ${
                        isActive
                          ? `${style.iconActive} scale-110 drop-shadow-sm`
                          : "group-hover:scale-110 opacity-75 group-hover:opacity-100"
                      }`}
                    />
                    <span className="text-[10px] font-bold tracking-wider uppercase text-center w-full truncate px-0.5 leading-tight">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </aside>
  );
}

export default SidebarApp;