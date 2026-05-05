import { useState } from "react";
import { Tabs, Tab, Chip } from "@nextui-org/react";
import { HiOutlineShieldCheck } from "react-icons/hi";
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
  // Estado para la pestaña activa, recuperado de localStorage para mejor UX
  const [selectedTab, setSelectedTab] = useState(() => {
    return localStorage.getItem("admin_activeTab") || "usuarios";
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
          {/* Token 7: Pestañas de Navegación SaaS - Tema Púrpura */}
          <Tabs
            aria-label="Panel de Administración"
            selectedKey={selectedTab}
            onSelectionChange={handleTabChange}
            variant="underlined"
            classNames={{
              base: "w-full border-b border-slate-200 dark:border-zinc-800 mb-6",
              tabList: "gap-6 w-full relative rounded-none p-0",
              cursor: "w-full bg-purple-600 dark:bg-purple-500 h-[2px]", // Cursor Púrpura
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-purple-600 dark:group-data-[selected=true]:text-purple-400 group-data-[selected=true]:font-bold text-slate-500 dark:text-zinc-400 font-medium text-sm transition-colors"
            }}
          >
            {/* TAB: USUARIOS */}
            <Tab
              key="usuarios"
              title={
                <div className="flex items-center gap-2.5">
                  <UsuariosAdminIcon className="w-5 h-5" />
                  <span>Usuarios y Permisos</span>
                </div>
              }
            >
              <div className="pt-2 animate-in fade-in duration-500 h-full flex flex-col">
                <GestionUsuarios />
              </div>
            </Tab>

            {/* TAB: MANTENIMIENTO */}
            <Tab
              key="mantenimiento"
              title={
                <div className="flex items-center gap-2.5">
                  <MantenimientoIcon className="w-5 h-5" />
                  <span>Mantenimiento</span>
                  <Chip size="sm" variant="flat" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold uppercase tracking-widest text-[9px] h-5 px-1 ml-1 rounded-md">
                    Sistema
                  </Chip>
                </div>
              }
            >
              <div className="pt-2 animate-in fade-in duration-500 h-full flex flex-col">
                <ConsolaSistema />
              </div>
            </Tab>

            {/* TAB: CONFIGURACIÓN */}
            <Tab
              key="configuracion"
              title={
                <div className="flex items-center gap-2.5">
                  <ConfiguracionAdminIcon className="w-5 h-5" />
                  <span>Configuración Global</span>
                </div>
              }
            >
              <div className="pt-2 animate-in fade-in duration-500 h-full flex flex-col">
                <PanelConfiguracion />
              </div>
            </Tab>

            {/* TAB: PERSONALIZACIÓN */}
            <Tab
              key="personalizacion"
              title={
                <div className="flex items-center gap-2.5">
                  <ConfiguracionAdminIcon className="w-5 h-5" />
                  <span>Personalización Visual</span>
                </div>
              }
            >
              <div className="pt-2 animate-in fade-in duration-500 h-full flex flex-col">
                <PanelPersonalizacion />
              </div>
            </Tab>

          </Tabs>
        </div>

      </div>
    </div>
  );
}
