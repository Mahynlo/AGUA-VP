import React from "react";
import { HiCurrencyDollar, HiChartBar, HiExclamationCircle, HiDocumentDuplicate } from "react-icons/hi";

/**
 * Componente para mostrar estadísticas de impresión
 */
const EstadisticasImpresion = ({ estadisticas }) => {
  return (
    <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
        
        {/* Métrica 1: Total a Cobrar */}
        <div className="p-4 sm:p-5 flex flex-col items-center justify-center text-center hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
          <div className="flex items-center gap-1.5 mb-1.5 text-slate-400 dark:text-zinc-500">
            <HiCurrencyDollar className="w-3.5 h-3.5" />
            <p className="text-[10px] font-bold uppercase tracking-widest">
              Total a Cobrar
            </p>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            ${estadisticas.totalCobrar.toFixed(2)}
          </p>
        </div>

        {/* Métrica 2: Consumo Total */}
        <div className="p-4 sm:p-5 flex flex-col items-center justify-center text-center hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
          <div className="flex items-center gap-1.5 mb-1.5 text-slate-400 dark:text-zinc-500">
            <HiChartBar className="w-3.5 h-3.5" />
            <p className="text-[10px] font-bold uppercase tracking-widest">
              Consumo Total
            </p>
          </div>
          <p className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight flex items-baseline gap-1">
            {estadisticas.consumoTotal} <span className="text-sm font-bold text-blue-400/70">m³</span>
          </p>
        </div>

        {/* Métrica 3: Adeudos */}
        <div className="p-4 sm:p-5 flex flex-col items-center justify-center text-center hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
          <div className="flex items-center gap-1.5 mb-1.5 text-slate-400 dark:text-zinc-500">
            <HiExclamationCircle className="w-3.5 h-3.5" />
            <p className="text-[10px] font-bold uppercase tracking-widest">
              Adeudos
            </p>
          </div>
          <p className="text-xl sm:text-2xl font-black text-orange-500 dark:text-orange-400 tracking-tight">
            ${estadisticas.adeudosTotal.toFixed(2)}
          </p>
        </div>

        {/* Métrica 4: Recibos por Página */}
        <div className="p-4 sm:p-5 flex flex-col items-center justify-center text-center hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
          <div className="flex items-center gap-1.5 mb-1.5 text-slate-400 dark:text-zinc-500">
            <HiDocumentDuplicate className="w-3.5 h-3.5" />
            <p className="text-[10px] font-bold uppercase tracking-widest">
              Formatos/Pág
            </p>
          </div>
          <p className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
            {estadisticas.recibosPorPagina}
          </p>
        </div>

      </div>
    </div>
  );
};

export default EstadisticasImpresion;
