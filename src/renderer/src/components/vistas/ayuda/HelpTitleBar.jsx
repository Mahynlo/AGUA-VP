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
      className="w-full h-12 bg-blue-600 dark:bg-blue-700 text-white flex items-center justify-between select-none z-50 shrink-0 border-b border-blue-700 dark:border-blue-800 shadow-sm transition-colors"
      style={{ WebkitAppRegion: "drag" }}
    >
      {/* ── Izquierda: Identidad Institucional ── */}
      <div className="flex items-center gap-3 px-4">
        <div className="p-1.5 rounded-xl bg-white/15 border border-white/20 text-white shadow-inner flex items-center justify-center shrink-0">
          <HiBookOpen className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-tight text-white leading-tight">
              AGUA VP
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30">
              Centro de Ayuda
            </span>
          </div>
          <span className="text-[9px] font-bold text-blue-100/80 uppercase tracking-widest hidden sm:block">
            Manuales & Procedimientos Técnicos
          </span>
        </div>
      </div>

      {/* ── Centro: Acceso rápido a búsqueda (Ctrl+K) ── */}
      {onOpenSearch && (
        <div className="hidden sm:flex items-center" style={{ WebkitAppRegion: "no-drag" }}>
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white/90 hover:text-white transition-all text-xs font-semibold shadow-inner focus:outline-none focus:ring-2 focus:ring-white/40"
            title="Buscar tema en la documentación (Ctrl+K)"
          >
            <HiSearch className="w-3.5 h-3.5 text-blue-100" />
            <span className="text-xs">Buscar en manuales...</span>
            <kbd className="px-1.5 py-0.5 font-mono text-[9px] font-extrabold bg-blue-900/50 text-white rounded border border-white/25 shadow-sm">
              Ctrl+K
            </kbd>
          </button>
        </div>
      )}

      {/* ── Derecha: Controles de Ventana (Electron) ── */}
      <div className="flex h-full text-white/90" style={{ WebkitAppRegion: "no-drag" }}>
        <button
          onClick={handleMinimize}
          className="h-full w-12 flex items-center justify-center hover:bg-white/15 active:bg-white/25 transition-colors focus:outline-none"
          title="Minimizar"
        >
          <VscChromeMinimize size={14} />
        </button>

        <button
          onClick={handleMaximize}
          className="h-full w-12 flex items-center justify-center hover:bg-white/15 active:bg-white/25 transition-colors focus:outline-none"
          title="Maximizar"
        >
          <VscChromeMaximize size={14} />
        </button>

        <button
          onClick={handleClose}
          className="h-full w-12 flex items-center justify-center hover:bg-rose-600 active:bg-rose-700 transition-colors focus:outline-none"
          title="Cerrar ventana de ayuda"
        >
          <VscChromeClose size={14} />
        </button>
      </div>
    </header>
  );
}
