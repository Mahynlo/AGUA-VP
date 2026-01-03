import React from "react";

/**
 * Componente para mostrar estadísticas de impresión
 */
const EstadisticasImpresion = ({ estadisticas }) => {
  return (
    <div className="mt-2 p-5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-xl border-2 border-purple-200 dark:border-purple-800">
      <div className="grid grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total a Cobrar</p>
          <p className="text-2xl font-bold text-green-600">
            ${estadisticas.totalCobrar.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Consumo Total</p>
          <p className="text-2xl font-bold text-blue-600">
            {estadisticas.consumoTotal} m³
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Adeudos</p>
          <p className="text-2xl font-bold text-orange-600">
            ${estadisticas.adeudosTotal.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Recibos/Página</p>
          <p className="text-2xl font-bold text-purple-600">
            {estadisticas.recibosPorPagina}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EstadisticasImpresion;
