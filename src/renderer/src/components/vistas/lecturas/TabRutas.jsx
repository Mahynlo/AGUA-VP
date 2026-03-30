import { useNavigate } from "react-router-dom";
import { Button, Card, CardBody, CardHeader, Pagination, Progress } from "@nextui-org/react";
import { Select, SelectItem } from "@nextui-org/react";
import { HiSearch, HiMap, HiPlus, HiFilter, HiX, HiCheckCircle, HiClock, HiChartPie } from "react-icons/hi";
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
  if (initialLoading) {
    return <LoadingSkeleton />;
  }

  const hasActiveFilters = search || filtro !== "todos" || filtroPueblo !== "todos";

  const selectClassNames = {
    trigger: "bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 shadow-sm rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors h-11",
    value: "font-medium text-slate-700 dark:text-zinc-200 text-sm"
  };

  return (
    <div className="h-full flex flex-col space-y-6 w-full animate-in fade-in duration-300">

      {/* ── HEADER Y FILTROS ── */}
      <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
        
        {/* Título Principal */}
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl">
              <HiMap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                  Rutas de Lectura
                </h3>
                {loading && !initialLoading && (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
                Logística y progreso de toma de consumos
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto flex-1 sm:flex-none">
            <ModalRegistrarRuta />
          </div>
        </CardHeader>

        <CardBody className="p-6 bg-slate-50/50 dark:bg-black/10 flex flex-col gap-6">
          
          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="p-2.5 bg-slate-100 dark:bg-zinc-800 rounded-xl text-slate-500 dark:text-zinc-400 shrink-0">
                <HiMap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">Total Rutas</p>
                <p className="text-xl font-black text-slate-800 dark:text-zinc-100 leading-none">{estadisticas.totalRutas}</p>
              </div>
            </div>

            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                <HiCheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-500/70 uppercase tracking-widest mb-0.5">Completadas</p>
                <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 leading-none">{estadisticas.rutasCompletas}</p>
              </div>
            </div>

            <div className="bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 p-4 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="p-2.5 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-xl shrink-0">
                <HiClock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-orange-600/70 dark:text-orange-500/70 uppercase tracking-widest mb-0.5">Pendientes</p>
                <p className="text-xl font-black text-orange-700 dark:text-orange-400 leading-none">{estadisticas.rutasPendientes}</p>
              </div>
            </div>

            {/* Progreso General */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-2xl shadow-sm flex flex-col justify-center gap-1.5 min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <div className="flex items-center gap-1 text-blue-700 dark:text-blue-400">
                    <HiChartPie className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Avance de Lectura</span>
                </div>
                <span className="text-sm font-black text-blue-700 dark:text-blue-400">
                  {estadisticas.porcentajeProgreso}%
                </span>
              </div>
              {estadisticas.totalLecturas > 0 ? (
                  <Progress
                    value={estadisticas.porcentajeProgreso}
                    color="primary"
                    className="h-2"
                    classNames={{
                      track: "bg-blue-200 dark:bg-blue-900/50",
                      indicator: "bg-blue-600 dark:bg-blue-500 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]",
                    }}
                    aria-label="Progreso general de lecturas"
                  />
              ) : (
                  <div className="h-2 bg-slate-200 dark:bg-zinc-700 rounded-full w-full"></div>
              )}
              <div className="flex justify-between mt-0.5 text-[9px] font-bold text-blue-500/80 dark:text-blue-300/60 uppercase tracking-widest">
                <span>{estadisticas.lecturasCompletadas} Hechas</span>
                <span>{estadisticas.totalLecturas} Total</span>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-slate-200 dark:bg-zinc-800"></div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
            
            {/* Buscador */}
            <div className="lg:col-span-2 relative w-full flex items-center">
              <span className="absolute left-3 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
                <HiSearch className="w-5 h-5" />
              </span>
              <input
                placeholder="Buscar ruta por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-sm h-11"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <HiX className="w-4 h-4" />
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
              className="w-full h-11"
            />

            {/* Ciudad */}
            <Select
              placeholder="Todas las ubicaciones"
              selectedKeys={[filtroPueblo]}
              onChange={(e) => setPueblo(e.target.value)}
              variant="bordered"
              aria-label="Filtrar por ciudad"
              classNames={selectClassNames}
            >
              <SelectItem key="todos" value="todos">Todas</SelectItem>
              <SelectItem key="ng" value="ng">Nácori</SelectItem>
              <SelectItem key="mp" value="mp">Matapé</SelectItem>
              <SelectItem key="ad" value="ad">Adivino</SelectItem>
            </Select>

            {/* Estado */}
            <div className="flex gap-2">
                <Select
                placeholder="Todos los estados"
                selectedKeys={[filtro]}
                onChange={(e) => setFiltro(e.target.value)}
                variant="bordered"
                aria-label="Filtrar por estado"
                classNames={selectClassNames}
                >
                <SelectItem key="todos" value="todos">Todos</SelectItem>
                <SelectItem key="completas" value="completas">Completas</SelectItem>
                <SelectItem key="incompletas" value="incompletas">Pendientes</SelectItem>
                </Select>

                {/* Botón Limpiar (Solo icono para ahorrar espacio en desktop) */}
                {hasActiveFilters && (
                    <Button 
                        variant="flat" 
                        color="default"
                        onPress={limpiarFiltros}
                        className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm h-11 min-w-[44px] px-0 shrink-0"
                        title="Limpiar filtros"
                    >
                        <HiFilter className="text-slate-400 text-lg" />
                    </Button>
                )}
            </div>

          </div>
        </CardBody>
      </Card>

      {/* ── GRID DE RUTAS ── */}
      <div className="flex-1 overflow-y-auto">
        {rutasPaginadas.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-6">
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
              <div className="flex justify-center mt-6 mb-4">
                <Pagination
                  total={totalPaginas}
                  page={paginaActual}
                  onChange={setPagina}
                  color="primary"
                  variant="light"
                  showControls
                  classNames={{
                    cursor: "bg-blue-600 text-white font-bold shadow-md",
                  }}
                />
              </div>
            )}
          </>
        ) : (
            <div className="border-dashed border-2 border-slate-200 dark:border-zinc-800 bg-transparent rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-center mb-4">
                    <HiMap className="w-8 h-8 text-slate-400 dark:text-zinc-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    No se encontraron rutas
                </h3>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-500 max-w-sm mx-auto mb-5">
                    No hay rutas de lectura que coincidan con los filtros aplicados en el periodo seleccionado.
                </p>
                {hasActiveFilters && (
                    <Button
                        color="primary"
                        variant="flat"
                        className="font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        startContent={<HiFilter className="text-lg" />}
                        onPress={limpiarFiltros}
                    >
                        Limpiar todos los filtros
                    </Button>
                )}
            </div>
        )}
      </div>
    </div>
  );
}



