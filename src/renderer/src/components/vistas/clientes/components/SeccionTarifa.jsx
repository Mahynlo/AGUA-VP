import React, { useMemo } from "react";
import { Select, SelectItem } from "@heroui/react";
import { HiCurrencyDollar, HiInformationCircle } from "react-icons/hi";
import { useTarifas } from "../../../../context/TarifasContext";

export const SeccionTarifa = ({ 
  formData, 
  erroresCampos, 
  mostrarErrores, 
  onChange, 
  limpiarError,
  modo = 'crear',
  tarifaIdOriginal // <--- NUEVA PROP: El ID real de la base de datos
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

          <Select
            aria-label="Tarifa"
            placeholder={esEdicion && infoTarifaOriginal 
              ? `Mantener actual (${infoTarifaOriginal.nombre})` 
              : "Selecciona una tarifa"}
            selectedKeys={formData.tarifaSeleccionada ? [formData.tarifaSeleccionada.toString()] : []}
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0];
              onChange('tarifaSeleccionada', selectedKey || "");
              limpiarError('tarifa');
            }}
            color="primary"
            variant="bordered"
            size="md"
            isRequired={!esEdicion} 
            isLoading={loading}
            isDisabled={loading || !tarifas || tarifas.length === 0}
            className="w-full"
            startContent={<HiCurrencyDollar className="text-gray-400 text-lg" />}
            isInvalid={mostrarErrores && erroresCampos.tarifa}
            errorMessage={mostrarErrores && erroresCampos.tarifa && "La tarifa es requerida"}
          >
            {!loading && tarifas && Array.isArray(tarifas) && tarifas.length > 0 ? (
              tarifas.map((tarifa) => {
                const tarifaId = tarifa.id?.toString();
                return (
                  <SelectItem 
                    key={tarifaId} 
                    textValue={`${tarifa.nombre}`}
                  >
                    <div className="flex flex-col">
                      <span className="text-small font-bold">{tarifa.nombre}</span>
                      <span className="text-tiny text-default-500">{tarifa.descripcion}</span>
                    </div>
                  </SelectItem>
                );
              })
            ) : (
              <SelectItem key="no-data" isDisabled>
                 {loading ? "Cargando..." : "No hay tarifas"}
              </SelectItem>
            )}
          </Select>
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