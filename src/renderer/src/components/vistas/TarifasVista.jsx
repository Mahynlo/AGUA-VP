import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Card, CardBody, CardHeader, Chip, Pagination } from "@nextui-org/react";
import { HiArrowLeft, HiSearch, HiCurrencyDollar, HiCalendar, HiPlus, HiTrendingUp } from "react-icons/hi";
import { useTarifas } from "../../context/TarifasContext";
import RegistrarTarifa from "./tarifas/RegistrarTarifa";
import TarifaCard from "./tarifas/TarifaCard";
import { TarifaIcon } from "../../IconsApp/IconsResibos";
export default function Tarifas() {
  const navigate = useNavigate();
  const { tarifas, loading, actualizarTarifas } = useTarifas();
  const [search, setSearch] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  // Estadísticas calculadas
  const estadisticas = useMemo(() => {
    if (!tarifas || tarifas.length === 0) {
      return {
        total: 0,
        activas: 0,
        vigentes: 0,
        proximasAVencer: 0,
        promedioRango1: 0,
        ultimaActualizacion: null
      };
    }

    const hoy = new Date();
    const treintaDias = new Date();
    treintaDias.setDate(treintaDias.getDate() + 30);

    let vigentes = 0;
    let proximasAVencer = 0;
    let sumaRango1 = 0;
    let contadorRango1 = 0;
    let fechaUltimaActualizacion = null;

    tarifas.forEach(tarifa => {
      const fechaFin = new Date(tarifa.fecha_fin);

      // Verificar si está vigente
      if (fechaFin >= hoy) {
        vigentes++;
      }

      // Verificar si vence pronto
      if (fechaFin >= hoy && fechaFin <= treintaDias) {
        proximasAVencer++;
      }

      // Calcular promedio del primer rango
      if (tarifa.rangos && tarifa.rangos.length > 0) {
        sumaRango1 += parseFloat(tarifa.rangos[0].precio_por_m3 || 0);
        contadorRango1++;
      }

      // Fecha de última actualización
      const fechaCreacion = new Date(tarifa.fecha_inicio);
      if (!fechaUltimaActualizacion || fechaCreacion > fechaUltimaActualizacion) {
        fechaUltimaActualizacion = fechaCreacion;
      }
    });

    return {
      total: tarifas.length,
      activas: tarifas.filter(t => t.activa).length,
      vigentes,
      proximasAVencer,
      promedioRango1: contadorRango1 > 0 ? sumaRango1 / contadorRango1 : 0,
      ultimaActualizacion: fechaUltimaActualizacion
    };
  }, [tarifas]);

  if (loading) {
    return (
      <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
        <div className="flex justify-center items-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Cargando tarifas...</p>
          </div>
        </div>
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
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
      <div className="w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col gap-6">




        {/* Header con título y estadísticas */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <TarifaIcon className="bg-green-500 text-white rounded-full p-2" />
                Gestión de Tarifas
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Administra las tarifas del sistema de agua potable
              </p>
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white min-w-[120px]">
                <CardBody className="text-center p-4">
                  <HiCurrencyDollar className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{estadisticas.total}</p>
                  <p className="text-xs opacity-90">Total Tarifas</p>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white min-w-[120px]">
                <CardBody className="text-center p-4">
                  <HiCalendar className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{estadisticas.vigentes}</p>
                  <p className="text-xs opacity-90">Vigentes</p>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white min-w-[120px]">
                <CardBody className="text-center p-4">
                  <HiTrendingUp className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-2xl font-bold">${estadisticas.promedioRango1.toFixed(2)}</p>
                  <p className="text-xs opacity-90">Precio Promedio</p>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white min-w-[120px]">
                <CardBody className="text-center p-4">
                  <HiCalendar className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{estadisticas.proximasAVencer}</p>
                  <p className="text-xs opacity-90">Próximas a Vencer</p>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>

        {/* Buscador y registrar */}
        <Card>
          <CardBody>
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
              <div className="flex-1 max-w-md">
               
                <div className="relative w-full flex">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                  <HiSearch className="inline-block mr-2" />
                                </span>
                                <input
                                  placeholder="Buscar rutas..."
                                  value={search}
                                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPaginaActual(1);
                  }}
                
                                  className="border  border-gray-300 text-gray-600 rounded-xl pl-10 pr-10 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                />
                                {/* Botón para limpiar */}
                                {search && (
                                  <button
                                    onClick={() => setSearch("")}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
              </div>
              <RegistrarTarifa />
            </div>
          </CardBody>
        </Card>



        {/* Grid de tarifas */}
        <div className="flex-1 overflow-y-auto">
          {tarifasPaginadas.length > 0 ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                {tarifasPaginadas.map((tarifa) => (
                  <TarifaCard key={tarifa.id} tarifa={tarifa} />
                ))}
              </div>

              {/* Paginación mejorada */}
              {totalPaginas > 1 && (
                <div className="flex justify-center">
                  <Pagination
                    total={totalPaginas}
                    page={paginaActual}
                    onChange={setPaginaActual}
                    color="primary"
                    showControls
                    showShadow
                    classNames={{
                      wrapper: "gap-0 overflow-visible h-8 rounded border border-divider",
                      item: "w-8 h-8 text-small rounded-none bg-transparent",
                      cursor: "bg-gradient-to-b shadow-lg from-blue-500 to-blue-800 dark:from-blue-300 dark:to-blue-700 text-white font-bold",
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardBody>
                <div className="text-center py-12">
                  <HiCurrencyDollar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    No se encontraron tarifas
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {search ? "No hay tarifas que coincidan con tu búsqueda" : "Aún no hay tarifas registradas"}
                  </p>
                  {search && (
                    <Button
                      color="primary"
                      variant="flat"
                      startContent={<HiSearch className="w-4 h-4" />}
                      onClick={() => setSearch("")}
                    >
                      Limpiar búsqueda
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}




