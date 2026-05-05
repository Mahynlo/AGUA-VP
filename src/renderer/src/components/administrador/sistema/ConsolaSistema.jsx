/**
 * ConsolaSistema — Consola de administración del sistema
 *
 * Agrupa todos los paneles de administración del sistema:
 *  - Info del Sistema (estado general)
 *  - Logs (visor en tiempo real)
 *  - Backups (gestión de respaldos)
 *  - Base de Datos (info + migraciones)
 *  - Actualizaciones (verificar/descargar/instalar)
 */

import { useState } from "react";
import { Tabs, Tab } from "@nextui-org/react";
import {
  HiChartBar, HiClipboardList, HiSave, HiDatabase, HiRefresh, HiServer
} from "react-icons/hi";

import ErrorBoundary from "./ErrorBoundary";
import PanelInfoSistema from "./PanelInfoSistema";
import PanelLogs from "./PanelLogs";
import PanelBackups from "./PanelBackups";
import PanelBaseDatos from "./PanelBaseDatos";
import PanelActualizaciones from "./PanelActualizaciones";

export default function ConsolaSistema() {
  const [activeTab, setActiveTab] = useState("info");

  return (
    /* Token 1: Contenedor Raíz */
    <div className="w-full bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8 lg:p-10 animate-in fade-in duration-500 flex flex-col gap-8 mb-20">
      
      {/* ── HEADER GLOBAL ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          {/* Regla de tintes */}
          <div className="p-3 bg-slate-500/10 text-slate-600 dark:text-slate-400 rounded-2xl shrink-0">
            <HiServer className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1">
            {/* Token 3: Textos principales */}
            <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
              Consola del Sistema
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
              Monitoreo, mantenimiento y configuración de la plataforma
            </p>
          </div>
        </div>
        
        {/* Regla de tintes para etiquetas (Reemplazo de Chip sólido) */}
        <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg border border-amber-500/20 shrink-0">
          Solo Administradores
        </div>
      </div>

      <div className="flex w-full flex-col">
        {/* Token 7: Pestañas de navegación (Tabs) */}
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={setActiveTab}
          variant="underlined"
          aria-label="Opciones de Consola"
          classNames={{
            base: "w-full",
            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-slate-200 dark:border-zinc-800",
            cursor: "w-full bg-slate-800 dark:bg-zinc-200 h-[2px]",
            tab: "max-w-fit px-0 h-12",
            tabContent: "group-data-[selected=true]:text-slate-800 dark:group-data-[selected=true]:text-zinc-100 group-data-[selected=true]:font-bold text-slate-500 dark:text-zinc-400 font-medium text-sm transition-colors"
          }}
        >
          <Tab
            key="info"
            title={
              <div className="flex items-center gap-2">
                <HiChartBar className="text-lg" />
                <span>Sistema</span>
              </div>
            }
          >
            <div className="pt-6">
              <ErrorBoundary>
                <PanelInfoSistema />
              </ErrorBoundary>
            </div>
          </Tab>

          <Tab
            key="logs"
            title={
              <div className="flex items-center gap-2">
                <HiClipboardList className="text-lg" />
                <span>Logs</span>
              </div>
            }
          >
            <div className="pt-6">
              <ErrorBoundary>
                <PanelLogs />
              </ErrorBoundary>
            </div>
          </Tab>

          <Tab
            key="backups"
            title={
              <div className="flex items-center gap-2">
                <HiSave className="text-lg" />
                <span>Backups</span>
              </div>
            }
          >
            <div className="pt-6">
              <ErrorBoundary>
                <PanelBackups />
              </ErrorBoundary>
            </div>
          </Tab>

          <Tab
            key="basedatos"
            title={
              <div className="flex items-center gap-2">
                <HiDatabase className="text-lg" />
                <span>Base de Datos</span>
              </div>
            }
          >
            <div className="pt-6">
              <ErrorBoundary>
                <PanelBaseDatos />
              </ErrorBoundary>
            </div>
          </Tab>

          <Tab
            key="actualizaciones"
            title={
              <div className="flex items-center gap-2">
                <HiRefresh className="text-lg" />
                <span>Actualizaciones</span>
              </div>
            }
          >
            <div className="pt-6">
              <ErrorBoundary>
                <PanelActualizaciones />
              </ErrorBoundary>
            </div>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}

