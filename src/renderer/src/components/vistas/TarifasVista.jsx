import { Button } from "flowbite-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FlechaReturnIcon } from "../../IconsApp/IconsAppSystem";
import RegistrarTarifa from "./tarifas/RegistrarTarifa";
import RegistrarRangoTarifa from "./tarifas/RegistrarRango";
import { useTarifas } from "../../context/TarifasContext";
import EditarRangosTarifa from "./tarifas/EditarRangoTarifa";
import EditarTarifa from "./tarifas/EditarTarifa";
import EditarTarifaYRangos from "./tarifas/EditarTarifaY_Rangos";
const Tarifas = () => {
  const navigate = useNavigate();
  const { tarifas, loading, actualizarTarifas } = useTarifas();

  if (loading) return <p>Cargando tarifas...</p>;

  return (
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
      <div className="w-full h-full bg-white overflow-x-hidden gap-4 p-4 rounded-lg shadow-md dark:bg-gray-800">

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Tarifas registradas</h1>
          <Button color="gray" className="mb-6" onClick={() => navigate(-1)}>
            <FlechaReturnIcon className="w-6 h-6" />
            <span className="ml-2">Volver</span>
          </Button>
        </div>

        <RegistrarTarifa />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
          {tarifas.map((tarifa) => (
            <div
              key={tarifa.id}
              className="border rounded-lg p-4 shadow-md bg-white hover:shadow-lg transition-all duration-200 dark:bg-gray-700 dark:text-white"
            >
              <div className="flex items-center w-full">

                <h2 className="text-xl font-semibold text-gray-800 mb-2 dark:text-white  w-full">
                  Tarifa {tarifa.nombre}

                </h2>

                <div className="w-full flex justify-end space-x-2">
                  
                  

                  {(tarifa.rangos?.length ?? 0) === 0 && (
                    <RegistrarRangoTarifa
                      tarifaId={tarifa.id}
                      onRangoRegistrado={actualizarTarifas}
                    />
                  )}
                  {(tarifa.rangos?.length ?? 0) > 0 && (
                    <EditarTarifaYRangos tarifa={tarifa} rangosIniciales={tarifa.rangos} onCambio={actualizarTarifas} />
                  )}
                </div>
              </div>

              {/* Mostrar rangos si existen */}
              {tarifa.rangos?.length > 0 ? (
                <table className="w-full text-sm text-left text-gray-700 dark:text-gray-200 mt-4">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50  text-gray-900 dark:bg-gray-600 dark:text-gray-200">
                    
                    <tr>
                      <th scope="col" className="px-2 py-2">Consumo</th>
                      <th scope="col" className="px-2 py-2">Tarifa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tarifa.rangos.map((rango, i) => (
                      <tr key={i} className="border-t ">
                        <td className="px-2 py-2 text-gray-900 dark:text-white"> 
                          De {rango.consumo_min}
                          {rango.consumo_max != null ? ` a ${rango.consumo_max}` : "+"}
                        </td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white">${rango.precio_por_m3}</td>
                      </tr>
                    ))}
                  </tbody>
                  <p className="text-sm text-gray-500 mb-2">
                    <span className="font-semibold"></span> {tarifa.descripcion || "No hay descripción disponible."}
                  </p>
                  <p className="text-sm text-gray-500 mb-2">
                    <span className="text-gray-400 mt-4"> Vigencia de  {tarifa.fecha_inicio} a {tarifa.fecha_fin || "Sin fecha de finalizacion"}</span>
                  </p>
                </table>
              ) : (
                <p className="text-sm text-gray-500 italic mt-2 text-center">Sin rangos definidos.</p>
              )}

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tarifas;

