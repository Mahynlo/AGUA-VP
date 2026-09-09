import React from "react";
import { HiBookOpen, HiSearch } from "react-icons/hi";
import { VscChromeMinimize, VscChromeMaximize, VscChromeClose } from "react-icons/vsc";

export default function HelpTitleBar({ onOpenSearch }) {
  const handleMinimize = () => {
    if (window.electronAPI?.minimize) window.electronAPI.minimize();
  };

  const handleMaximize = () => {
    if (window.electronAPI?.maximize) window.electronAPI.maximize();
  };

  const handleClose = () => {
    if (window.electronAPI?.close) window.electronAPI.close();
  };

  return (
    <header
      className="w-full h-11 bg-slate-900 text-white flex items-center justify-between select-none z-50 shrink-0 border-b border-slate-800"
      style={{ WebkitAppRegion: "drag" }}
    >
      {/* ── Izquierda: Icono y Título ── */}
      <div className="flex items-center gap-2.5 px-4">
        <div className="p-1 rounded-lg bg-sky-500/20 text-sky-400">
          <HiBookOpen className="w-4 h-4" />
        </div>
        <span className="text-xs font-black tracking-wide text-slate-200">
          AguaVP <span className="text-slate-400 font-medium">| Centro de Ayuda</span>
        </span>
      </div>

      {/* ── Centro: Acceso rápido a búsqueda ── */}
      {onOpenSearch && (
        <div className="hidden sm:flex items-center" style={{ WebkitAppRegion: "no-drag" }}>
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors text-xs font-medium shadow-sm"
            title="Buscar en la documentación (Ctrl+K)"
          >
            <HiSearch className="w-3.5 h-3.5 text-sky-400" />
            <span>Buscar tema...</span>
            <kbd className="px-1.5 py-0.5 font-mono text-[9px] font-bold bg-slate-900 text-slate-400 rounded border border-slate-700">
              Ctrl+K
            </kbd>
          </button>
        </div>
      )}

      {/* ── Derecha: Controles de Ventana (Electron) ── */}
      <div className="flex h-full" style={{ WebkitAppRegion: "no-drag" }}>
        <button
          onClick={handleMinimize}
          className="h-full w-11 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
          title="Minimizar"
        >
          <VscChromeMinimize size={13} />
        </button>

        <button
          onClick={handleMaximize}
          className="h-full w-11 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
          title="Maximizar"
        >
          <VscChromeMaximize size={13} />
        </button>

        <button
          onClick={handleClose}
          className="h-full w-11 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-600 transition-colors focus:outline-none"
          title="Cerrar"
        >
          <VscChromeClose size={13} />
        </button>
      </div>
    </header>
  );
}
