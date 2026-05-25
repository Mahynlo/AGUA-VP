import { useState } from "react";
import {
  HiChartBar, HiClipboardList, HiSave, HiDatabase, HiRefresh, HiServer
} from "react-icons/hi";

import ErrorBoundary from "./ErrorBoundary";
import PanelInfoSistema from "./PanelInfoSistema";
import PanelLogs from "./PanelLogs";
import PanelBackups from "./PanelBackups";
import PanelBaseDatos from "./PanelBaseDatos";
import PanelActualizaciones from "./PanelActualizaciones";

const TABS = [
  { key: "info",          label: "Sistema",         icon: HiChartBar },
  { key: "logs",          label: "Logs",             icon: HiClipboardList },
  { key: "backups",       label: "Backups",          icon: HiSave },
  { key: "basedatos",     label: "Base de Datos",    icon: HiDatabase },
  { key: "actualizaciones", label: "Actualizaciones", icon: HiRefresh },
];

export default function ConsolaSistema() {
  const [activeTab, setActiveTab] = useState("info");

  return (
    <div className="w-full bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8 lg:p-10 flex flex-col gap-8 mb-20">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-500/10 text-slate-600 dark:text-slate-400 rounded-2xl shrink-0">
            <HiServer className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
              Consola del Sistema
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
              Monitoreo, mantenimiento y configuración de la plataforma
            </p>
          </div>
        </div>
        <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg border border-amber-500/20 shrink-0">
          Solo Administradores
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex flex-col gap-0">
        {/* Barra de pestañas */}
        <div className="flex gap-0 border-b border-slate-200 dark:border-zinc-800 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 h-12 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px focus:outline-none ${
                activeTab === key
                  ? "border-slate-800 dark:border-zinc-200 text-slate-800 dark:text-zinc-100 font-bold"
                  : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300"
              }`}
            >
              <Icon className="text-lg shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Contenido de la pestaña activa */}
        <div className="pt-6">
          <ErrorBoundary>
            {activeTab === "info"           && <PanelInfoSistema />}
            {activeTab === "logs"           && <PanelLogs />}
            {activeTab === "backups"        && <PanelBackups />}
            {activeTab === "basedatos"      && <PanelBaseDatos />}
            {activeTab === "actualizaciones"&& <PanelActualizaciones />}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
