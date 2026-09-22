import React, { useMemo } from "react";
import { HiCurrencyDollar, HiInformationCircle, HiChevronDown } from "react-icons/hi";
import { useTarifas } from "../../../../context/TarifasContext";

export const SeccionTarifa = ({ 
  formData, 
  erroresCampos, 
  mostrarErrores, 
  onChange, 
  limpiarError,
  modo = 'crear',
  tarifaIdOriginal
}) => {
  const { tarifas, loading } = useTarifas();
  const esEdicion = modo === 'editar';

  // 1. Buscamos la info de la tarifa ORIGINAL (Fija, de la BD)
  const infoTarifaOriginal = useMemo(() => {
    if (!tarifas || !tarifaIdOriginal) return null;
    return tarifas.find(t => t.id?.toString() === tarifaIdOriginal?.toString());
  }, [tarifas, tarifaIdOriginal]);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 p-6 space-y-5">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200/70 dark:border-zinc-800/70">
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
          <HiCurrencyDollar className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-black text-sm text-slate-800 dark:text-zinc-100 uppercase tracking-wider leading-none">
            Tarifa del Cliente
          </h3>
          <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
            Esquema tarifario aplicable al consumo
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* 2. Mostramos la tarjeta de información basada en la tarifa ORIGINAL */}
        {esEdicion && infoTarifaOriginal && (
            <div className="bg-emerald-500/10 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
                <div className="flex items-start gap-3">
                    <HiInformationCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                            Tarifa Actual:
                        </p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200 mt-0.5">
                            {infoTarifaOriginal.nombre} <span className="text-slate-400 font-normal">· {infoTarifaOriginal.descripcion}</span>
                        </p>
                    </div>
                </div>
            </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
            {esEdicion 
              ? "Selecciona una nueva tarifa (opcional si deseas cambiarla):" 
              : "Selecciona la tarifa que se aplicará a este cliente:"}
            {!esEdicion && <span className="text-red-500"> *</span>}
          </label>

          <div className="relative">
            <select
              aria-label="Tarifa"
              value={formData.tarifaSeleccionada ? formData.tarifaSeleccionada.toString() : ""}
              onChange={(e) => {
                onChange('tarifaSeleccionada', e.target.value);
                limpiarError('tarifa');
              }}
              disabled={loading || !tarifas || tarifas.length === 0}
              className={`w-full h-11 pl-4 pr-10 text-sm font-semibold rounded-xl bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 border ${
                mostrarErrores && erroresCampos.tarifa 
                  ? "border-rose-500 focus:ring-rose-500/20 focus:border-rose-500" 
                  : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:ring-blue-500/20 focus:border-blue-500"
              } focus:outline-none focus:ring-2 shadow-none appearance-none cursor-pointer transition-all`}
            >
              <option value="">
                {loading 
                  ? "Cargando tarifas..." 
                  : esEdicion && infoTarifaOriginal 
                    ? `Mantener actual (${infoTarifaOriginal.nombre})` 
                    : "-- Selecciona una tarifa --"}
              </option>
              {!loading && tarifas && Array.isArray(tarifas) && tarifas.map((tarifa) => (
                <option key={tarifa.id} value={tarifa.id.toString()}>
                  {tarifa.nombre} - {tarifa.descripcion}
                </option>
              ))}
            </select>
            <HiChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          {mostrarErrores && erroresCampos.tarifa && (
            <p className="text-xs text-rose-500 font-semibold mt-1">La tarifa es requerida</p>
          )}
        </div>

        {esEdicion && (
          <div className="px-1">
             <p className="text-xs text-slate-500 dark:text-zinc-400">
                * Si dejas este campo vacío, se mantendrá la tarifa <strong>{infoTarifaOriginal?.nombre || "actual"}</strong>.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeccionTarifa;