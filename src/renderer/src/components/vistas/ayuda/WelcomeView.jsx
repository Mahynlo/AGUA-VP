import React from "react";
import { Chip } from "@nextui-org/react";
import { HiBookOpen, HiArrowRight } from "react-icons/hi";

const WelcomeView = ({ sections, sectionIcons, navegarA }) => {
  return (
    <div className="max-w-5xl mx-auto py-8 sm:py-2 animate-in fade-in zoom-in-95 duration-500">
      
      {/* ── 1. HEADER (HERO SECTION) ── */}
      <div className="text-center mb-12 sm:mb-12 px-4">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-blue-200/50 dark:border-blue-700/30">
          <HiBookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 dark:text-blue-400 drop-shadow-sm" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-zinc-100 tracking-tight mb-4 leading-tight">
          Centro de Conocimiento
        </h2>
        <p className="text-sm sm:text-base font-medium text-slate-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Encuentra guías, manuales y respuestas a preguntas frecuentes. Selecciona una categoría a continuación o utiliza el buscador para comenzar.
        </p>
      </div>

      {/* ── 2. GRID DE CATEGORÍAS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 px-4">
        {Object.entries(sections).map(([sectionKey, files]) => {
          const sectionConfig = sectionIcons[sectionKey];
          if (!sectionConfig) return null;

          return (
            <button
              key={sectionKey}
              onClick={() => {
                if (files.length > 0) {
                  navegarA(sectionKey, files[0].fileName);
                }
              }}
              className="flex flex-col items-start p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-sm hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 group text-left outline-none focus:ring-2 focus:ring-blue-500/50 hover:-translate-y-1"
            >
              {/* Parte Superior de la Tarjeta */}
              <div className="flex items-start justify-between w-full mb-5">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-100 dark:border-zinc-700/50 text-slate-600 dark:text-zinc-300 group-hover:scale-110 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-300 shadow-sm">
                  {/* Clonamos el icono para asegurarnos de que tenga un tamaño estándar */}
                  {React.cloneElement(sectionConfig.icon, { className: "w-6 h-6" })}
                </div>
                
                <Chip 
                  size="sm" 
                  variant="flat" 
                  color={sectionConfig.color || "primary"} 
                  className="font-bold text-[10px] tracking-widest uppercase px-1 h-6"
                >
                  {files.length} {files.length === 1 ? 'Art.' : 'Arts.'}
                </Chip>
              </div>

              {/* Título y Descripción */}
              <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {sectionConfig.title}
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-500 line-clamp-2 mb-6">
                Explora la documentación y guías relacionadas con el módulo de {sectionConfig.title.toLowerCase()}.
              </p>

              {/* Flecha "Leer más" que aparece al hacer hover */}
              <div className="mt-auto flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Ver manuales
                <HiArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
};

export default WelcomeView;
