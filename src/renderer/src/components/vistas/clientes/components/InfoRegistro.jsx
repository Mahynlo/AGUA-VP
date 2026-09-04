import React from "react";
import { HiInformationCircle } from "react-icons/hi";
import { useAuth } from "../../../../context/AuthContext";
import { formatUTCtoHermosillo } from "../../../../utils/formatFecha";

export const InfoRegistro = ({ fechaRegistroCliente }) => {
  const { user } = useAuth();

  return (
    <div className="rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-4">
      <div className="flex items-center gap-2.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
        <HiInformationCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
        <span>
          Cliente registrado por: <strong className="font-black text-slate-800 dark:text-zinc-100">{user?.nombre || "Sistema"}</strong>
          {fechaRegistroCliente && (
            <span className="ml-2 text-slate-500 dark:text-zinc-400 font-normal">
              · Fecha: {formatUTCtoHermosillo(fechaRegistroCliente)}
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

export default InfoRegistro;
