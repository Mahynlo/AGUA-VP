import React from "react";
import { HiCurrencyDollar, HiChartBar, HiExclamationCircle, HiDocumentDuplicate } from "react-icons/hi";

/**
 * Componente para mostrar estadísticas de impresión
 */
const EstadisticasImpresion = ({ estadisticas }) => {
  const metricas = [
    {
      icon: HiCurrencyDollar,
      label: "Total a Cobrar",
      value: `$${estadisticas.totalCobrar.toFixed(2)}`,
      valueClass: "text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: HiChartBar,
      label: "Consumo Total",
      value: estadisticas.consumoTotal,
      suffix: "m³",
      valueClass: "text-slate-800 dark:text-zinc-100",
    },
    {
      icon: HiExclamationCircle,
      label: "Adeudos",
      value: `$${estadisticas.adeudosTotal.toFixed(2)}`,
      valueClass: "text-amber-600 dark:text-amber-400",
    },
    {
      icon: HiDocumentDuplicate,
      label: "Formatos/Pág",
      value: estadisticas.recibosPorPagina,
      valueClass: "text-slate-800 dark:text-zinc-100",
    },
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-zinc-800/60">
        {metricas.map(({ icon: Icon, label, value, suffix, valueClass }) => (
          <div
            key={label}
            className="p-4 sm:p-5 flex flex-col items-center justify-center text-center gap-2"
          >
            <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500">
              <Icon className="w-3.5 h-3.5" />
              <p className="text-[10px] font-bold uppercase tracking-widest">{label}</p>
            </div>
            <p className={`text-xl sm:text-2xl font-black tracking-tight ${valueClass}`}>
              {value}
              {suffix && (
                <span className="text-sm font-bold text-slate-400 dark:text-zinc-500 ml-1">
                  {suffix}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EstadisticasImpresion;
