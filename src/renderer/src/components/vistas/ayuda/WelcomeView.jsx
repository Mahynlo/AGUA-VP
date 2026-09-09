import React from "react";
import { Chip } from "@nextui-org/react";
import {
  HiBookOpen,
  HiArrowRight,
  HiSearch,
  HiDocumentText,
  HiLightningBolt,
  HiChevronRight
} from "react-icons/hi";

const WelcomeView = ({ sections = {}, sectionIcons = {}, navegarA, onOpenSearch }) => {
  const totalSections = Object.keys(sections).length;
  const totalArticles = Object.values(sections).reduce((acc, curr) => acc + curr.length, 0);

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-6 animate-in fade-in zoom-in-95 duration-400 space-y-10">
      
      {/* ── 1. HERO BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-6 sm:p-10 shadow-lg">
        {/* Adorno visual de fondo */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute left-1/2 -top-12 w-60 h-60 rounded-full bg-blue-400/10 blur-xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold uppercase tracking-wider text-blue-100">
            <HiLightningBolt className="w-3.5 h-3.5 text-amber-300" />
            <span>Documentación Oficial AguaVP</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Centro de Ayuda y Base de Conocimiento
          </h1>

          <p className="text-sm sm:text-base text-blue-100/90 font-medium leading-relaxed">
            Consulta manuales operativos paso a paso, tutoriales de cobranza, gestión de medidores, toma de lecturas y configuración del sistema.
          </p>

          {/* Métricas y Botón de Búsqueda Rápida */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-xs font-semibold text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{totalSections} Módulos Activos</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-xs font-semibold text-white">
              <HiDocumentText className="w-4 h-4 text-blue-200" />
              <span>{totalArticles} Guías y Manuales</span>
            </div>

            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs transition-all shadow-sm"
              >
                <HiSearch className="w-3.5 h-3.5" />
                <span>Búsqueda Rápida (Ctrl+K)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. GRID DE CATEGORÍAS Y MÓDULOS ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-zinc-100 tracking-tight">
              Módulos del Sistema
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
              Selecciona una categoría para explorar sus manuales operativos y guías de uso
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Object.entries(sections).map(([sectionKey, files]) => {
            const sectionConfig = sectionIcons[sectionKey] || {
              title: sectionKey,
              subtitle: "Manuales y documentación",
              badgeClass: "bg-blue-500/10 text-blue-600 border-blue-200",
              icon: <HiBookOpen className="w-5 h-5" />
            };

            const firstFile = files.length > 0 ? files[0] : null;

            return (
              <div
                key={sectionKey}
                className="flex flex-col bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-2xs hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 group"
              >
                {/* Cabecera de la Tarjeta */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3 rounded-2xl shrink-0 flex items-center justify-center border shadow-2xs group-hover:scale-105 transition-transform duration-300 ${
                        sectionConfig.badgeClass ||
                        "bg-blue-500/10 text-blue-600 border-blue-200"
                      }`}
                    >
                      {React.cloneElement(sectionConfig.icon, { className: "w-5 h-5" })}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {sectionConfig.title}
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                        {files.length} {files.length === 1 ? "artículo" : "artículos"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subtítulo / Descripción corta */}
                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 leading-relaxed mb-4 line-clamp-2">
                  {sectionConfig.subtitle || `Explora las guías de ${sectionConfig.title.toLowerCase()}.`}
                </p>

                {/* Vista previa de artículos destacados */}
                {files.length > 0 && (
                  <div className="space-y-1.5 mb-5 flex-1">
                    {files.slice(0, 3).map((file) => (
                      <button
                        key={file.fileName}
                        onClick={() => navegarA(sectionKey, file.fileName)}
                        className="w-full text-left flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50/80 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-slate-100 dark:border-zinc-800/80 group/item"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <HiDocumentText className="w-3.5 h-3.5 text-slate-400 group-hover/item:text-blue-500 shrink-0" />
                          <span className="text-xs font-semibold truncate">
                            {file.metadata?.titulo || file.fileName.replace(".md", "")}
                          </span>
                        </div>
                        <HiChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/item:text-blue-500 shrink-0" />
                      </button>
                    ))}

                    {files.length > 3 && (
                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-2 pt-0.5">
                        + {files.length - 3} guías adicionales
                      </p>
                    )}
                  </div>
                )}

                {/* Botón Explorar */}
                <div className="mt-auto pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                  <button
                    onClick={() => {
                      if (firstFile) {
                        navegarA(sectionKey, firstFile.fileName);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white dark:bg-zinc-800 dark:hover:bg-blue-600 dark:text-zinc-300 dark:hover:text-white text-xs font-bold transition-all shadow-2xs group/btn"
                  >
                    <span>Explorar Módulo</span>
                    <HiArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. FOOTER TIP / SHORTCUT ── */}
      <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-zinc-400">
        <div className="flex items-center gap-2 font-medium">
          <span className="text-base">💡</span>
          <span>
            <strong>Atajo rápido:</strong> Presiona <kbd className="px-1.5 py-0.5 font-mono text-[10px] font-bold bg-white dark:bg-zinc-800 rounded border border-slate-300 dark:border-zinc-700">Ctrl + K</kbd> para buscar en títulos, descripciones y contenido de cualquier guía.
          </span>
        </div>
        <div className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
          AguaVP Documentation System v1.0
        </div>
      </div>

    </div>
  );
};

export default WelcomeView;
