import { useState } from "react";
import { HiOutlineShieldCheck } from "react-icons/hi";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  UsuariosAdminIcon,
  MantenimientoIcon,
  ConfiguracionAdminIcon
} from "../../IconsApp/IconsAdmin";

// Importar componentes
import GestionUsuarios from "./GestionUsuarios";
import ConsolaSistema from "./sistema/ConsolaSistema";
import PanelConfiguracion from "./PanelConfiguracion";
import PanelPersonalizacion from "./PanelPersonalizacion";

export default function Administrador() {
  const { user } = useAuth();

  const esOperador = user?.rol === 'operador';
  const tabInicialPorDefecto = esOperador ? "mantenimiento" : "usuarios";

  // Estado para la pestaña activa, recuperado de localStorage para mejor UX
  const [selectedTab, setSelectedTab] = useState(() => {
    const guardada = localStorage.getItem("admin_activeTab");
    if (esOperador && (guardada === "usuarios" || guardada === "configuracion")) {
      return "mantenimiento";
    }
    return guardada || tabInicialPorDefecto;
  });

  const handleTabChange = (key) => {
    setSelectedTab(key);
    localStorage.setItem("admin_activeTab", key);
  };

  return (
    // CONTENEDOR PRINCIPAL: Padding exterior fluido y fondo gris sutil estandarizado
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20 scroll-smooth">
      
      {/* CONTENEDOR DE LA VISTA: 'w-full min-h-full' para ocupar todo el espacio disponible */}
      <div className="w-full min-h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-6 sm:p-8 lg:p-10 flex flex-col gap-10 animate-in fade-in duration-500">

        {/* ── 1. HEADER Y DESCRIPCIÓN ── */}
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-8">
          
          <div className="flex gap-4 items-start shrink-0">
            {/* Regla de Tintes (Púrpura Corporativo para Admin) */}
            <div className="p-3.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl shrink-0 flex items-center justify-center">
              <HiOutlineShieldCheck className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1 pt-0.5">
              {/* Token 3: Textos Principales */}
              <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
                Administración del Sistema
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 max-w-lg mt-1 leading-relaxed">
                Panel de control central para gestión de usuarios, mantenimiento y reglas de negocio.
              </p>
            </div>
          </div>
        </div>

        {/* ── 2. NAVEGACIÓN (TABS) Y CONTENIDO ── */}
        <div className="flex flex-col w-full flex-1 mt-2">
          {/* Pestañas de Navegación SaaS - Tema Púrpura */}
          <div className="w-full border-b border-slate-200 dark:border-zinc-800 mb-6">
            <nav className="flex gap-6 w-full -mb-px">
              {/* TAB: USUARIOS */}
              {!esOperador && (
                <button
                  type="button"
                  onClick={() => handleTabChange("usuarios")}
                  className={`flex items-center gap-2.5 py-3 text-sm border-b-2 transition-colors cursor-pointer shrink-0 ${
                    selectedTab === "usuarios"
                      ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
                  }`}
                >
                  <UsuariosAdminIcon className="w-5 h-5" />
                  <span>Usuarios y Permisos</span>
                </button>
              )}

              {/* TAB: MANTENIMIENTO */}
              <button
                type="button"
                onClick={() => handleTabChange("mantenimiento")}
                className={`flex items-center gap-2.5 py-3 text-sm border-b-2 transition-colors cursor-pointer shrink-0 ${
                  selectedTab === "mantenimiento"
                    ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
                }`}
              >
                <MantenimientoIcon className="w-5 h-5" />
                <span>Mantenimiento</span>
                <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold uppercase tracking-widest text-[9px] h-5 px-1.5 ml-1 rounded-md inline-flex items-center">
                  Sistema
                </span>
              </button>

              {/* TAB: CONFIGURACIÓN */}
              {!esOperador && (
                <button
                  type="button"
                  onClick={() => handleTabChange("configuracion")}
                  className={`flex items-center gap-2.5 py-3 text-sm border-b-2 transition-colors cursor-pointer shrink-0 ${
                    selectedTab === "configuracion"
                      ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
                  }`}
                >
                  <ConfiguracionAdminIcon className="w-5 h-5" />
                  <span>Configuración Global</span>
                </button>
              )}

              {/* TAB: PERSONALIZACIÓN */}
              <button
                type="button"
                onClick={() => handleTabChange("personalizacion")}
                className={`flex items-center gap-2.5 py-3 text-sm border-b-2 transition-colors cursor-pointer shrink-0 ${
                  selectedTab === "personalizacion"
                    ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
                }`}
              >
                <ConfiguracionAdminIcon className="w-5 h-5" />
                <span>Personalización Visual</span>
              </button>
            </nav>
          </div>

          {/* CONTENIDOS */}
          {!esOperador && selectedTab === "usuarios" && (
            <div className="pt-2 animate-in fade-in duration-500 h-full flex flex-col">
              <GestionUsuarios />
            </div>
          )}

          {selectedTab === "mantenimiento" && (
            <div className="pt-2 animate-in fade-in duration-500 h-full flex flex-col">
              <ConsolaSistema />
            </div>
          )}

          {!esOperador && selectedTab === "configuracion" && (
            <div className="pt-2 animate-in fade-in duration-500 h-full flex flex-col">
              <PanelConfiguracion />
            </div>
          )}

          {selectedTab === "personalizacion" && (
            <div className="pt-2 animate-in fade-in duration-500 h-full flex flex-col">
              <PanelPersonalizacion />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
