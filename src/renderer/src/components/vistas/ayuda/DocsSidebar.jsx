import React from "react";
import { Button, Chip } from "@nextui-org/react";
import {
  HiBookOpen,
  HiSearch,
  HiOutlineX,
  HiDocument,
  HiFolder
} from "react-icons/hi";

const DocsSidebar = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  onOpenSearch,
  filteredSections,
  sectionIcons,
  selectedSection,
  selectedFile,
  navegarA
}) => {
  return (
    <div className={`
      fixed lg:relative inset-y-0 left-0 z-30 w-80 h-full
      transform transition-transform duration-300 ease-in-out lg:transform-none
      bg-slate-50 dark:bg-zinc-900/60 border-r border-slate-200 dark:border-zinc-800/80
      flex flex-col
      ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      
      {/* ── HEADER DEL SIDEBAR ── */}
      <div className="p-5 border-b border-slate-200 dark:border-zinc-800/80">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl">
              <HiBookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-black text-slate-800 dark:text-zinc-100 tracking-tight">
              Documentación
            </h2>
          </div>
          
          {/* Botón Cerrar (Solo Móvil) */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>
        
        {/* Fake Input de Búsqueda */}
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm text-slate-500 dark:text-zinc-400 hover:border-blue-400 dark:hover:border-blue-800 hover:text-slate-700 dark:hover:text-zinc-300 transition-all shadow-sm group"
        >
          <HiSearch className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
          <span className="font-medium">Buscar guías y manuales...</span>
          {/* Opcional: Atajo de teclado visual (ej. Ctrl K) */}
          <kbd className="ml-auto hidden sm:inline-flex items-center gap-1 px-1.5 font-mono text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-zinc-800 rounded border border-slate-200 dark:border-zinc-700">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* ── NAVEGACIÓN (LISTA DE ARCHIVOS) ── */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {Object.keys(filteredSections).length === 0 ? (
          /* Estado Vacío */
          <div className="text-center py-10 px-4 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-white/50 dark:bg-zinc-900/30 mt-4">
            <HiFolder className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600 dark:text-zinc-300">Sin contenido</p>
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-500 mt-1">No hay secciones disponibles.</p>
          </div>
        ) : (
          <div className="space-y-6 pb-6">
            {Object.entries(filteredSections).map(([sectionKey, files]) => {
              const sectionConfig = sectionIcons[sectionKey];
              if (!sectionConfig) return null;
              
              return (
                <div key={sectionKey} className="animate-in fade-in duration-300">
                  
                  {/* Título de la Sección */}
                  <div className="flex items-center justify-between mb-2.5 px-2">
                    <div className="flex items-center gap-2">
                      {/* Icono de la sección (clonado para ajustar tamaño sutilmente) */}
                      <span className="text-slate-400 dark:text-zinc-500">
                        {React.cloneElement(sectionConfig.icon, { className: "w-4 h-4" })}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                        {sectionConfig.title}
                      </span>
                    </div>
                    <Chip 
                        size="sm" 
                        variant="flat" 
                        color={sectionConfig.color} 
                        className="h-5 text-[9px] font-bold tracking-wider px-1"
                    >
                      {files.length}
                    </Chip>
                  </div>
                  
                  {/* Lista de archivos de la sección */}
                  <div className="flex flex-col gap-1">
                    {files.map((file) => {
                      const isSelected = selectedSection === sectionKey && selectedFile === file.fileName;
                      
                      return (
                        <button
                          key={file.fileName}
                          onClick={() => navegarA(sectionKey, file.fileName)}
                          className={`
                            w-full text-left flex items-start gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 group
                            ${isSelected 
                              ? 'bg-white dark:bg-zinc-800/80 shadow-sm ring-1 ring-slate-200 dark:ring-zinc-700' 
                              : 'hover:bg-slate-200/50 dark:hover:bg-zinc-800/50'
                            }
                          `}
                        >
                          <HiDocument className={`w-4 h-4 mt-0.5 shrink-0 transition-colors ${
                              isSelected ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-500 dark:group-hover:text-zinc-400'
                          }`} />
                          
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate transition-colors ${
                                isSelected 
                                    ? 'font-bold text-blue-600 dark:text-blue-400' 
                                    : 'font-medium text-slate-600 dark:text-zinc-300 group-hover:text-slate-900 dark:group-hover:text-white'
                            }`}>
                              {file.metadata?.titulo || file.fileName.replace('.md', '')}
                            </p>
                            
                            {file.metadata?.descripcion && (
                              <p className={`text-[10px] truncate mt-0.5 leading-tight ${
                                  isSelected ? 'text-slate-500 dark:text-zinc-400' : 'text-slate-400 dark:text-zinc-500'
                              }`}>
                                {file.metadata.descripcion}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocsSidebar;
