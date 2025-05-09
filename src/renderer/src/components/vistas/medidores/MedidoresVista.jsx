import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MapaMedidores from "../../mapa/MapaMedidores";
import RegistrarMedidor from "./RegistrarMedidores";
import { useMedidores } from "../../../context/MedidoresContext";
const Medidores = () => {
  const {
    medidores,
    medidoresAsignados,
    medidoresNoAsignados,
    filtrarMedidores,
    loading
  } = useMedidores();

  if (loading) return <p>Cargando medidores...</p>;

  const resultado = filtrarMedidores({ pueblo: "", numeroSerie: "" });

  // rediemencionar la tabla dependiendo del tamaño de la pantalla
  const [mapaHeight, setMapaHeight] = useState(getMapaHeight()); // Altura inicial de la tabla

  function getMapaHeight() { // Función para calcular la altura de la tabla
    return window.devicePixelRatio >= 1.25 ? "min-h-[30rem] max-h-[55rem]" : "min-h-[58rem] max-h-[58rem]";
  }

  useEffect(() => { // Ajustar la altura de la tabla al cambiar el tamaño de la ventana
    const handleResize = () => setMapaHeight(getMapaHeight());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
      <div className="grid grid-cols-5 grid-rows-5 gap-2 h-full">

        <div className="col-span-3 row-span-5 h-full">
          <div className="h-full w-full rounded overflow-hidden">
            <MapaMedidores medidores={medidores} />
          </div>
        </div>

        <div className="col-span-2 row-span-5 p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 overflow-y-auto">
          <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Medidores</h5>
          <RegistrarMedidor />

          <div class="grid grid-cols-3 grid-rows-1 gap-2 mt-2">
            <div class="block  p-6 bg-gray-100 border border-gray-400 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-500">
              <h2>Total: {medidores.length}</h2>
            </div>
            <div class="block  p-6 bg-gray-100 border border-gray-400 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-500">
              <h3>Asignados: {medidoresAsignados.length}</h3>
            </div>
            <div class="block  p-6 bg-gray-100 border border-gray-400 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-500">
              <h3>No asignados: {medidoresNoAsignados.length}</h3>
            </div>

          </div>

          <div className="block mt-2 p-3 bg-gray-100 border border-gray-400 rounded-lg shadow dark:bg-gray-800 dark:border-gray-500">
              <h1 className="text-[18px]">Información de medidores</h1>
              <ul className="mt-4 space-y-1 text-sm max-h-[360px] overflow-y-auto pr-2">
                {resultado.map(m => (
                  <li
                    key={m.id}
                    className="flex justify-between items-center p-2 bg-gray-200 rounded-md dark:bg-gray-700"
                  >
                    {m.numero_serie} - {m.ubicacion} - {m.longitud},{m.latitud} - Estado:{" "}
                    {m.estado_medidor}
                  </li>
                ))}
              </ul>
            </div>


        </div>

      </div>
    </div>

  )
};

export default Medidores;