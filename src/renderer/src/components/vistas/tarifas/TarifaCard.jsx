import { HiCalendar, HiCurrencyDollar, HiExclamation } from "react-icons/hi";
import RegistrarRangoTarifa from "./RegistrarRango";
import EditarTarifaYRangos from "./EditarTarifaY_Rangos";
import { formatoFirstDay } from "../../../utils/formatFecha";

export default function TarifaCard({ tarifa }) {
  const tieneRangos = (tarifa.rangos?.length ?? 0) > 0;

  const hoy = new Date();
  const fechaFin = new Date(tarifa.fecha_fin);
  const fechaInicio = new Date(tarifa.fecha_inicio);
  const esVigente = hoy >= fechaInicio && hoy <= fechaFin;

  const treintaDias = new Date();
  treintaDias.setDate(treintaDias.getDate() + 30);
  const vencePronto = fechaFin <= treintaDias && fechaFin >= hoy;

  const getStatusStyles = () => {
    if (!esVigente) return "bg-red-500/10 text-red-600 dark:text-red-400";
    if (vencePronto) return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  };

  const getStatusText = () => {
    if (!esVigente) return "Vencida";
    if (vencePronto) return "Por vencer";
    return "Vigente";
  };

  return (
    <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 h-full shadow-none flex flex-col">

      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex justify-between items-start w-full gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100 truncate">
              Tarifa {tarifa.nombre}
            </h3>

            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${getStatusStyles()}`}>
                <HiCalendar className="w-3.5 h-3.5" />
                {getStatusText()}
              </span>
              {vencePronto && (
                <span className="inline-flex items-center px-1.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <HiExclamation className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0">
            {!tieneRangos ? (
              <RegistrarRangoTarifa tarifaId={tarifa.id} />
            ) : (
              <EditarTarifaYRangos tarifa={tarifa} rangosIniciales={tarifa.rangos} />
            )}
          </div>
        </div>
      </div>

      <hr className="border-t border-slate-200 dark:border-zinc-800/80 mx-0" />

      {/* Body */}
      <div className="px-6 py-5 flex-1">
        <div className="space-y-6">

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
              <HiCalendar className="w-3.5 h-3.5" />
              <span>
                {formatoFirstDay(tarifa.fecha_inicio)} - {formatoFirstDay(tarifa.fecha_fin) || "INDEFINIDA"}
              </span>
            </div>

            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
              {tarifa.descripcion || "Sin descripción disponible."}
            </p>
          </div>

          {tieneRangos ? (
            <div>
              <div className="flex items-center gap-1.5 mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                <HiCurrencyDollar className="w-3.5 h-3.5" />
                <span>Estructura de Precios</span>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800 pb-2 px-2">
                      CONSUMO (m³)
                    </th>
                    <th className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800 pb-2 px-2 text-right">
                      TARIFA ($/m³)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tarifa.rangos.map((rango, index) => (
                    <tr key={index} className="hover:bg-slate-100/50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="text-sm font-medium text-slate-600 dark:text-zinc-300 border-b border-slate-100 dark:border-zinc-800/50 py-3 px-2">
                        <span>
                          {rango.consumo_min}
                          {rango.consumo_max != null ? ` - ${rango.consumo_max}` : "+"}
                        </span>
                      </td>
                      <td className="text-sm font-medium text-slate-600 dark:text-zinc-300 border-b border-slate-100 dark:border-zinc-800/50 py-3 px-2 text-right">
                        <span className="font-black tracking-tight text-slate-800 dark:text-zinc-100">
                          ${parseFloat(rango.precio_por_m3).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-slate-500/10 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto mb-3">
                <HiCurrencyDollar className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-4">
                Sin rangos definidos
              </p>
              <RegistrarRangoTarifa tarifaId={tarifa.id} />
            </div>
          )}
        </div>
      </div>

      {tieneRangos && (
        <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800/50">
          <div className="w-full text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 text-center">
            {tarifa.rangos.length} rango{tarifa.rangos.length !== 1 ? 's' : ''} configurado{tarifa.rangos.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}
