import RegistrarRangoTarifa from "./RegistrarRango";
import EditarTarifaYRangos from "./EditarTarifaY_Rangos";
import {formatoFirstDay} from "../../../utils/formatFecha";
export default function TarifaCard({ tarifa }) {
  const tieneRangos = (tarifa.rangos?.length ?? 0) > 0;

  return (
    <div className="border rounded-lg p-5 shadow-sm bg-white dark:bg-gray-700 dark:text-white transition-all hover:shadow-lg overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Tarifa {tarifa.nombre}
        </h2>
        <div className="flex gap-2">
          {!tieneRangos && (
            <RegistrarRangoTarifa
              tarifaId={tarifa.id}
            />
          )}
          {tieneRangos && (
            <EditarTarifaYRangos
              tarifa={tarifa}
              rangosIniciales={tarifa.rangos}
            />
          )}
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
        {tarifa.descripcion || "Sin descripción disponible."}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Vigencia: <strong>{formatoFirstDay(tarifa.fecha_inicio)}</strong> a{" "}
        {formatoFirstDay(tarifa.fecha_fin) || "sin fecha de finalización"}
      </p>

      {tieneRangos ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-700 dark:text-gray-200 border-collapse">
            <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-600">
              <tr>
                <th className="px-3 py-2">Consumo</th>
                <th className="px-3 py-2">Tarifa ($/m³)</th>
              </tr>
            </thead>
            <tbody>
              {tarifa.rangos.map((rango, index) => (
                <tr
                  key={index}
                  className="border-t border-gray-200 dark:border-gray-500"
                >
                  <td className="px-3 py-2">
                    De <strong>{rango.consumo_min}</strong>{" "}
                    {rango.consumo_max != null
                      ? `a ${rango.consumo_max}`
                      : "+"}
                  </td>
                  <td className="px-3 py-2">${rango.precio_por_m3}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic mt-4 text-center">
          Sin rangos definidos para esta tarifa.
        </p>
      )}
    </div>
  );
}
