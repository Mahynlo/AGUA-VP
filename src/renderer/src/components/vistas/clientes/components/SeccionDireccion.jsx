/**
 * Sección de dirección del formulario de cliente
 */

import React from "react";
import { HiLocationMarker, HiChevronDown } from "react-icons/hi";
import { CustomTextarea } from "../../../ui/FormComponents";

const pueblos = [
  { key: "Nacori Grande", label: "Nacori Grande" },
  { key: "Matape", label: "Matape" },
  { key: "Adivino", label: "Adivino" },
];

export const SeccionDireccion = ({
  formData,
  erroresCampos,
  mostrarErrores,
  onChange,
  limpiarError
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 p-6 space-y-5">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200/70 dark:border-zinc-800/70">
        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
          <HiLocationMarker className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-black text-sm text-slate-800 dark:text-zinc-100 uppercase tracking-wider leading-none">
            Dirección de Residencia
          </h3>
          <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
            Pueblo y domicilio completo del cliente
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Pueblo */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
            Pueblo <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              aria-label="Ciudad"
              value={formData.ciudad || ""}
              onChange={(e) => {
                onChange('ciudad', e.target.value);
                limpiarError('ciudad');
              }}
              className={`w-full h-11 pl-4 pr-10 text-sm font-semibold rounded-xl bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 border ${
                mostrarErrores && erroresCampos.ciudad 
                  ? "border-rose-500 focus:ring-rose-500/20 focus:border-rose-500" 
                  : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:ring-blue-500/20 focus:border-blue-500"
              } focus:outline-none focus:ring-2 shadow-none appearance-none cursor-pointer transition-all`}
            >
              <option value="">-- Selecciona un pueblo --</option>
              {pueblos.map((pueblo) => (
                <option key={pueblo.key} value={pueblo.key}>{pueblo.label}</option>
              ))}
            </select>
            <HiChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          {mostrarErrores && erroresCampos.ciudad && (
            <p className="text-xs text-rose-500 font-semibold mt-1">La ciudad es requerida</p>
          )}
        </div>

        {/* Dirección Completa */}
        <CustomTextarea
          label="Dirección Completa"
          placeholder="Ingresa la dirección completa del cliente..."
          value={formData.direccion}
          onChange={(e) => {
            onChange('direccion', e.target.value);
            limpiarError('direccion');
          }}
          required
          minRows={3}
          isInvalid={mostrarErrores && !!erroresCampos.direccion}
          errorMessage="La dirección es requerida"
        />
      </div>
    </div>
  );
};

export default SeccionDireccion;
