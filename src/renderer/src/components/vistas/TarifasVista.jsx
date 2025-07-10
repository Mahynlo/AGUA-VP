import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "flowbite-react";
import { useTarifas } from "../../context/TarifasContext";
import { FlechaReturnIcon } from "../../IconsApp/IconsAppSystem";
import RegistrarTarifa from "./tarifas/RegistrarTarifa";
import TarifaCard from "./tarifas/TarifaCard";
import { SearchIcon } from "../../IconsApp/IconsSidebar";
export default function Tarifas() {
  const navigate = useNavigate();
  const { tarifas, loading, actualizarTarifas } = useTarifas();
  const [search, setSearch] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-gray-700 dark:text-gray-200">Cargando tarifas...</p>
      </div>
    );
  }

  // Filtro por nombre o por año (fecha_inicio o fecha_fin)
  const tarifasFiltradas = tarifas.filter((tarifa) => {
    const texto = search.toLowerCase().trim();
    const nombreCoincide = tarifa.nombre.toLowerCase().includes(texto);
    const añoInicio = tarifa.fecha_inicio?.slice(0, 4);
    const añoFin = tarifa.fecha_fin?.slice(0, 4);
    const añoCoincide = texto && (añoInicio?.includes(texto) || añoFin?.includes(texto));
    return nombreCoincide || añoCoincide;
  });

  const tarifasPorPagina = 4;
  const totalPaginas = Math.ceil(tarifasFiltradas.length / tarifasPorPagina);
  const tarifasPaginadas = tarifasFiltradas.slice(
    (paginaActual - 1) * tarifasPorPagina,
    paginaActual * tarifasPorPagina
  );



  return (
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-hidden p-4 sm:ml-64">
      <div className="w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tarifas registradas
          </h1>
          <Button color="gray" onClick={() => navigate(-1)}>
            <FlechaReturnIcon className="w-6 h-6" />
            <span className="ml-2">Volver</span>
          </Button>
        </div>

        {/* Buscador y registrar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-1/3">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
              <SearchIcon className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre o año (ej. 2024)"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPaginaActual(1);
              }}
              className="pl-10 pr-10 py-2 w-full rounded-xl border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-neutral-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />

            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <RegistrarTarifa />
        </div>



        {/* Contenedor scrollable de tarjetas */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {tarifasPaginadas.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-300 italic text-center col-span-full">
                No se encontraron tarifas que coincidan.
              </p>
            ) : (
              tarifasPaginadas.map((tarifa) => (
                <TarifaCard
                  key={tarifa.id}
                  tarifa={tarifa}
                  onActualizar={actualizarTarifas}
                />
              ))
            )}
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex justify-center items-center mt-6 gap-2">
              <Button
                color="gray"
                onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
                disabled={paginaActual === 1}
              >
                Anterior
              </Button>
              <span className="text-gray-700 dark:text-gray-300">
                Página {paginaActual} de {totalPaginas}
              </span>
              <Button
                color="gray"
                onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}




