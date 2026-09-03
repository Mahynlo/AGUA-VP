import React from "react";
import { HiCurrencyDollar, HiChartBar, HiExclamationCircle, HiDocumentDuplicate } from "react-icons/hi";

/**
 * Componente para mostrar estadísticas financieras y de volumen de impresión
 * Diseñado con mayor amplitud horizontal y formato numérico adaptativo para cifras monetarias grandes.
 */
const EstadisticasImpresion = ({ estadisticas = {} }) => {
  const totalCobrarNum = Number(estadisticas?.totalCobrar || 0);
  const adeudosTotalNum = Number(estadisticas?.adeudosTotal || 0);
  const consumoTotalNum = Number(estadisticas?.consumoTotal || 0);
  const recibosPorPagina = estadisticas?.recibosPorPagina || 2;
  const cantidadRecibos = estadisticas?.cantidadRecibos || 0;

  const totalCobrarFormatted = totalCobrarNum.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const adeudosTotalFormatted = adeudosTotalNum.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const consumoTotalFormatted = consumoTotalNum.toLocaleString("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col gap-3.5">
      
      {/* ── Fila 1: Tarjetas Financieras Principales (Total a Cobrar y Adeudos) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        
        {/* Total a Cobrar */}
        <div 
          className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between gap-1.5 transition-all hover:bg-emerald-500/15"
          title={`Total a Cobrar: $${totalCobrarFormatted}`}
        >
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
            <span className="text-[10px] font-black uppercase tracking-wider">
              Total a Cobrar
            </span>
            <div className="p-1 rounded-lg bg-emerald-500/20">
              <HiCurrencyDollar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight leading-tight truncate">
              ${totalCobrarFormatted}
            </p>
            <p className="text-[9px] font-semibold text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">
              Monto a recaudar
            </p>
          </div>
        </div>

        {/* Adeudos Acumulados */}
        <div 
          className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col justify-between gap-1.5 transition-all hover:bg-amber-500/15"
          title={`Adeudos Pendientes: $${adeudosTotalFormatted}`}
        >
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
            <span className="text-[10px] font-black uppercase tracking-wider">
              Adeudos
            </span>
            <div className="p-1 rounded-lg bg-amber-500/20">
              <HiExclamationCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl font-black text-amber-700 dark:text-amber-400 tracking-tight leading-tight truncate">
              ${adeudosTotalFormatted}
            </p>
            <p className="text-[9px] font-semibold text-amber-600/70 dark:text-amber-400/70 mt-0.5">
              Saldos anteriores
            </p>
          </div>
        </div>

      </div>

      {/* ── Fila 2: Métricas Secundarias (Consumo y Recibos/Formatos) ── */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-zinc-800/80">
        
        {/* Consumo Total */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/70 dark:border-zinc-800 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500">
            <HiChartBar className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Consumo Total</span>
          </div>
          <p className="text-sm sm:text-base font-black text-slate-800 dark:text-zinc-100 leading-none truncate">
            {consumoTotalFormatted} <span className="text-xs font-semibold text-slate-400">m³</span>
          </p>
        </div>

        {/* Recibos / Formatos */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/70 dark:border-zinc-800 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500">
            <HiDocumentDuplicate className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Por Hoja</span>
          </div>
          <p className="text-sm sm:text-base font-black text-slate-800 dark:text-zinc-100 leading-none truncate">
            {recibosPorPagina} <span className="text-xs font-semibold text-slate-400">recibos/pág</span>
          </p>
        </div>

      </div>

    </div>
  );
};

export default EstadisticasImpresion;
