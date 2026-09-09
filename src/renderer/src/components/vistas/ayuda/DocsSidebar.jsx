import React, { useState, useEffect, useMemo } from "react";
import {
  HiSearch,
  HiOutlineX,
  HiDocumentText,
  HiFolder,
  HiChevronDown,
  HiHome,
  HiX
} from "react-icons/hi";

const DocsSidebar = ({
  sidebarOpen,
  setSidebarOpen,
  onOpenSearch,
  filteredSections = {},
  sectionIcons = {},
  selectedSection,
  selectedFile,
  navegarA
}) => {
  // Estado para controlar qué secciones están expandidas
  const [expandedSections, setExpandedSections] = useState({});
  // Filtro local rápido en el sidebar
  const [sidebarFilter, setSidebarFilter] = useState("");

  // Inicializar y auto-expandir la sección activa
  useEffect(() => {
    if (filteredSections) {
      setExpandedSections((prev) => {
        const nextState = { ...prev };
        Object.keys(filteredSections).forEach((sec) => {
          if (nextState[sec] === undefined) {
            nextState[sec] = true; // Por defecto todas expandidas
          }
        });
        if (selectedSection) {
          nextState[selectedSection] = true;
        }
        return nextState;
      });
    }
  }, [filteredSections, selectedSection]);

  const toggleSection = (sectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const expandAll = () => {
    const all = {};
    Object.keys(filteredSections).forEach((k) => (all[k] = true));
    setExpandedSections(all);
  };

  const collapseAll = () => {
    const none = {};
    Object.keys(filteredSections).forEach((k) => (none[k] = false));
    setExpandedSections(none);
  };

  // Filtrado reactivo en el sidebar
  const visibleSections = useMemo(() => {
    if (!sidebarFilter.trim()) return filteredSections;
    const term = sidebarFilter.toLowerCase().trim();
    const result = {};

    Object.entries(filteredSections).forEach(([secKey, files]) => {
      const matchingFiles = files.filter(
        (f) =>
          f.fileName.toLowerCase().includes(term) ||
          f.metadata?.titulo?.toLowerCase().includes(term) ||
          f.metadata?.descripcion?.toLowerCase().includes(term)
      );
      if (matchingFiles.length > 0) {
        result[secKey] = matchingFiles;
      }
    });
    return result;
  }, [filteredSections, sidebarFilter]);

  return (
    <div className="w-full h-full bg-white dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-800 flex flex-col select-none overflow-hidden">
      
      {/* ── HEADER DEL SIDEBAR ── */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/40 shrink-0">
        
        {/* Fila 1: Catálogo General y Acciones */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <button
            onClick={() => {
              navegarA(null, null);
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all group text-left ${
              !selectedSection && !selectedFile
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black shadow-sm"
                : "text-slate-700 dark:text-zinc-200 hover:bg-slate-200/50 dark:hover:bg-zinc-800/60"
            }`}
            title="Ir al inicio del centro de ayuda"
          >
            <div className="p-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
              <HiHome className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold tracking-tight">Catálogo General</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={expandAll}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 px-1.5 py-1 rounded-md hover:bg-slate-200/50 dark:hover:bg-zinc-800 transition-colors"
              title="Expandir todas las secciones"
            >
              + Todo
            </button>
            <button
              onClick={collapseAll}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 px-1.5 py-1 rounded-md hover:bg-slate-200/50 dark:hover:bg-zinc-800 transition-colors"
              title="Colapsar todas las secciones"
            >
              - Todo
            </button>
            {/* Botón Ocultar Menú (Visible tanto en móvil como en escritorio) */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors ml-0.5"
              title="Ocultar menú lateral"
            >
              <HiOutlineX className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Fila 2: Input de Filtro Rápido */}
        <div className="relative flex items-center">
          <span className="absolute left-3 text-slate-400 dark:text-zinc-500 pointer-events-none">
            <HiSearch className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            placeholder="Filtrar manuales..."
            value={sidebarFilter}
            onChange={(e) => setSidebarFilter(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs font-medium rounded-xl bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700/80 hover:border-slate-300 dark:hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
          />
          {sidebarFilter && (
            <button
              onClick={() => setSidebarFilter("")}
              className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              <HiX className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── NAVEGACIÓN (LISTA DE SECCIONES Y ARTÍCULOS) ── */}
      <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2.5 custom-scrollbar">
        {Object.keys(visibleSections).length === 0 ? (
          /* Estado Vacío de Búsqueda */
          <div className="text-center py-8 px-4 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/30">
            <HiFolder className="w-7 h-7 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600 dark:text-zinc-300">
              Sin coincidencias
            </p>
            <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 mt-1">
              No se encontraron manuales con "{sidebarFilter}"
            </p>
            <button
              onClick={onOpenSearch}
              className="mt-2.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Buscar en todo el contenido (Ctrl+K)
            </button>
          </div>
        ) : (
          Object.entries(visibleSections).map(([sectionKey, files]) => {
            const sectionConfig = sectionIcons[sectionKey];
            if (!sectionConfig) return null;

            const isExpanded = expandedSections[sectionKey] ?? true;
            const isCurrentSection = selectedSection === sectionKey;

            return (
              <div
                key={sectionKey}
                className="rounded-2xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-900/20 overflow-hidden transition-all duration-200"
              >
                {/* Cabecera del Acordeón de Sección */}
                <button
                  onClick={() => toggleSection(sectionKey)}
                  className={`w-full flex items-center justify-between px-3 py-2 transition-colors text-left group ${
                    isCurrentSection
                      ? "bg-blue-500/5 dark:bg-blue-500/10"
                      : "hover:bg-slate-100/70 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 flex items-center justify-center border ${
                        sectionConfig.badgeClass ||
                        "bg-blue-500/10 text-blue-600 border-blue-200"
                      }`}
                    >
                      {React.cloneElement(sectionConfig.icon, { className: "w-3.5 h-3.5" })}
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {sectionConfig.title}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 shadow-2xs">
                      {files.length}
                    </span>
                    <HiChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 transition-transform duration-200 ${
                        isExpanded ? "rotate-0" : "-rotate-90"
                      }`}
                    />
                  </div>
                </button>

                {/* Lista de Archivos (Colapsable) */}
                {isExpanded && (
                  <div className="px-1.5 pb-1.5 pt-0.5 space-y-0.5">
                    {files.map((file) => {
                      const isSelected =
                        selectedSection === sectionKey &&
                        selectedFile === file.fileName;

                      return (
                        <button
                          key={file.fileName}
                          onClick={() => {
                            navegarA(sectionKey, file.fileName);
                            if (window.innerWidth < 1024) setSidebarOpen(false);
                          }}
                          className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all duration-150 group relative ${
                            isSelected
                              ? "bg-blue-600 text-white shadow-sm font-bold"
                              : "text-slate-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800/80 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          <HiDocumentText
                            className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                              isSelected
                                ? "text-white"
                                : "text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs truncate leading-snug">
                              {file.metadata?.titulo || file.fileName.replace(".md", "")}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── FOOTER DEL SIDEBAR ── */}
      <div className="p-3 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/40 shrink-0">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-2xs"
        >
          <HiSearch className="w-3.5 h-3.5 text-blue-500" />
          <span>Búsqueda avanzada</span>
          <kbd className="font-mono text-[9px] px-1 bg-slate-100 dark:bg-zinc-800 rounded border border-slate-200 dark:border-zinc-700">
            Ctrl+K
          </kbd>
        </button>
      </div>
    </div>
  );
};

export default DocsSidebar;
