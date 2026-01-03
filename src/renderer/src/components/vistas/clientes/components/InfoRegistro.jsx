/**
 * Sección de información de registro (solo para edición)
 */

import React from "react";
import { useAuth } from "../../../../context/AuthContext";
import { formatUTCtoHermosillo } from "../../../../utils/formatFecha";

export const InfoRegistro = ({ fechaRegistroCliente }) => {
  const { user } = useAuth();

  return (
    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
      <p className="text-sm text-blue-600 dark:text-blue-400">
        📅 Cliente registrado por: <span className="font-semibold">{user && user.nombre}</span>
        {fechaRegistroCliente && (
          <span className="ml-2">• Fecha: {formatUTCtoHermosillo(fechaRegistroCliente)}</span>
        )}
      </p>
    </div>
  );
};

export default InfoRegistro;
