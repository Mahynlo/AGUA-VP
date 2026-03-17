import { useNavigate } from "react-router-dom";
import { Button, Card, CardBody, CardHeader, Pagination, Progress } from "@nextui-org/react";
import { Select, SelectItem } from "@nextui-org/react";
import { HiSearch, HiMap, HiPlus, HiFilter, HiCalendar } from "react-icons/hi";
import ModalRegistrarRuta from "../lecturas/RegistrarRuta";
import RutaCard from "./RutaCard";
import LoadingSkeleton from "./components/LoadingSkeleton";

import imagenNacori from "../../../assets/images/nacori_mapa_ruta1.png";
import imagenMatape from "../../../assets/images/Matape_mapa_ruta.png";
import imagenAdivino from "../../../assets/images/Adivino_mapa_ruta.png";

import { useRutas } from "../../../context/RutasContext";
import { useTabRutas } from "../../../hooks/useTabRutas";
import { prefijoDominante, imgPorPrefijo } from "../../../utils/rutaUtils";
import SelectorPeriodoAvanzado from "../../ui/SelectorPeriodoAvanzado";

export default function TabRutas() {
  const navigate = useNavigate();
  const { rutas, loading, initialLoading, actualizarRutas, periodoActual } = useRutas();

  // Imágenes organizadas para pasar a la utilidad
  const imagenes = { nacori: imagenNacori, matape: imagenMatape, adivino: imagenAdivino };

  // Hook personalizado para manejar toda la lógica de filtros, paginación y estadísticas
  const {
    search,
    setSearch,
    filtro,
    setFiltro,
    filtroPueblo,
    setPueblo,
    periodoSel,
    setPeriodoSel,
    paginaActual,
    setPagina,
    totalPaginas,
    rutasPaginadas,
    estadisticas,
    limpiarFiltros
  } = useTabRutas(rutas, actualizarRutas, periodoActual);

  /* ---------------- render ---------------- */
  // Solo mostrar skeleton en la carga inicial para evitar parpadeos
  if (initialLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="h-full flex flex-col space-y-4">

      {/* Header con estadísticas */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
            <div className="flex items-center gap-3">
              <HiMap className="w-8 h-8 text-blue-600" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Rutas de Lectura
                  </h2>
                  {loading && !initialLoading && (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Gestiona las rutas para la toma de lecturas
                </p>
              </div>
            </div>
            <ModalRegistrarRuta />
          </div>
        </CardHeader>

        <CardBody className="pt-0">
          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
              <p className="text-lg font-bold text-blue-600">{estadisticas.totalRutas}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">Total Rutas</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
              <p className="text-lg font-bold text-green-600">{estadisticas.rutasCompletas}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">Rutas Completadas</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg text-center">
              <p className="text-lg font-bold text-orange-600">{estadisticas.rutasPendientes}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">Rutas Pendientes</p>
            </div>
           {estadisticas.totalLecturas > 0 && (
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Progreso General del Período
                </h3>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {estadisticas.porcentajeProgreso}%
                </span>
              </div>
              <Progress
                value={estadisticas.porcentajeProgreso}
                color="primary"
                size="md"
                className="mb-2"
                classNames={{
                  track: "bg-gray-200 dark:bg-gray-700",
                  indicator: "bg-gradient-to-r from-blue-500 to-purple-600",
                }}
              />
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>{estadisticas.lecturasCompletadas} lecturas completadas</span>
                <span>{estadisticas.totalLecturas} lecturas totales</span>
              </div>
            </div>
          )}
          </div>

          

          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Filtros
            </h2>
          </div>

          {/* Filtros mejorados */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* Buscador */}
            <div className="relative w-full flex">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                <HiSearch className="inline-block mr-2" />
              </span>
              <input
                placeholder="Buscar rutas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-gray-300 text-gray-600 rounded-xl pl-10 pr-10 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
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

            {/* Período */}
            <SelectorPeriodoAvanzado
              value={periodoSel || periodoActual}
              onChange={setPeriodoSel}
              label="Período"
              placeholder="Seleccionar período"
              startYear={2020}
              size="sm"
              isDisabled={loading}
            />

            {/* Ciudad */}
            <Select
              label="Ciudad"
              placeholder="Todas las ciudades"
              selectedKeys={[filtroPueblo]}
              onChange={(e) => setPueblo(e.target.value)}
              variant="bordered"
              size="sm"
              startContent={<HiMap className="text-gray-400" />}
            >
              <SelectItem key="todos" value="todos">Todas</SelectItem>
              <SelectItem key="ng" value="ng">Nácori</SelectItem>
              <SelectItem key="mp" value="mp">Matapé</SelectItem>
              <SelectItem key="ad" value="ad">Adivino</SelectItem>
            </Select>

            {/* Estado */}
            <Select
              label="Estado"
              placeholder="Todos los estados"
              selectedKeys={[filtro]}
              onChange={(e) => setFiltro(e.target.value)}
              variant="bordered"
              size="sm"
              startContent={<HiFilter className="text-gray-400" />}
            >
              <SelectItem key="todos" value="todos">Todos</SelectItem>
              <SelectItem key="completas" value="completas">Completas</SelectItem>
              <SelectItem key="incompletas" value="incompletas">Pendientes</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Grid de rutas */}
      <div className="flex-1 overflow-y-auto">
        {rutasPaginadas.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
              {rutasPaginadas.map(r => {
                const pref = prefijoDominante(r.numeros_serie);
                return (
                  <RutaCard
                    key={r.id}
                    ruta={{ ...r, imagen: imgPorPrefijo(pref, imagenes) }}
                  />
                );
              })}
            </div>

            {/* Paginación mejorada */}
            {totalPaginas > 1 && (
              <div className="flex justify-center">
                <Pagination
                  total={totalPaginas}
                  page={paginaActual}
                  onChange={setPagina}
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
                <HiMap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No se encontraron rutas
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No hay rutas que coincidan con los filtros aplicados
                </p>
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<HiPlus className="w-4 h-4" />}
                  onClick={limpiarFiltros}
                >
                  Limpiar filtros
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}




