/**
 * Sección de asignación de medidor (solo para edición)
 */

import React from "react";
import { HiCog } from "react-icons/hi";
import BuscarMedidor from "../BuscarMedidor";

export const SeccionMedidor = ({ 
  clienteId, 
  medidorAsignado, 
  onLiberarMedidor, 
  onMedidorSeleccionado 
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 p-6 space-y-5">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200/70 dark:border-zinc-800/70">
        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
          <HiCog className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-black text-sm text-slate-800 dark:text-zinc-100 uppercase tracking-wider leading-none">
            Gestión de Medidor
          </h3>
          <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
            Asigna o modifica los medidores asociados a este cliente
          </p>
        </div>
      </div>

      <BuscarMedidor
        clienteId={clienteId}
        medidorAsignado={medidorAsignado}
        onLiberarMedidor={onLiberarMedidor}
        onMedidorSeleccionado={onMedidorSeleccionado}
      />
    </div>
  );
};

export default SeccionMedidor;
