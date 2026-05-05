import { useNavigate } from "react-router-dom";
import { Button, Pagination, Progress } from "@nextui-org/react";
import { Select, SelectItem } from "@nextui-org/react";
import { 
  HiMap, 
  HiFilter, 
  HiX, 
  HiCheckCircle, 
  HiClock, 
  HiChartPie,
  HiSearch,
  HiArrowLeft
} from "react-icons/hi";
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

  const imagenes = { nacori: imagenNacori, matape: imagenMatape, adivino: imagenAdivino };

  const {
    search, setSearch, filtro, setFiltro, filtroPueblo, setPueblo,
    periodoSel, setPeriodoSel, paginaActual, setPagina,
    totalPaginas, rutasPaginadas, estadisticas, limpiarFiltros
  } = useTabRutas(rutas, actualizarRutas, periodoActual);

  if (initialLoading) {
    return <LoadingSkeleton />;
  }

  const hasActiveFilters = search || filtro !== "todos" || filtroPueblo !== "todos";

  // Clases estandarizadas para Inputs Invisibles
  const selectClassNames = {
    trigger: "bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-none h-[52px] focus:ring-2 focus:ring-blue-500/20 focus:outline-none",
    value: "font-medium text-slate-700 dark:text-zinc-200 text-sm"
  };

  return (
    <div className="h-full flex flex-col gap-6 w-full animate-in fade-in duration-500">

      {/* ── 1. HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          {/* Regla de Tintes: Azul para Geografía/Rutas */}
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
            <HiMap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
                Rutas de Lectura
              </h3>
              {loading && !initialLoading && (
                <div className="w-4 h-4 border-2 border-slate-300 dark:border-zinc-600 border-t-blue-600 rounded-full animate-spin ml-1" />
              )}
            </div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mt-1">
              Logística y progreso de toma de consumos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <Button
            variant="flat"
            onPress={() => navigate(-1)}
            className="bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 font-bold rounded-xl h-11 px-4 min-w-0 shadow-sm"
            startContent={<HiArrowLeft className="w-4 h-4" />}
            title="Volver"
          >
            <span className="hidden sm:inline">Volver</span>
          </Button>
          <div className="flex-1 sm:flex-none">
            <ModalRegistrarRuta />
          </div>
        </div>
      </div>

      {/* ── 2. TARJETAS DE ESTADÍSTICAS (KPIs) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 transition-transform hover:-translate-y-1 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Total Rutas</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400"><HiMap className="w-4 h-4" /></div>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">{estadisticas.totalRutas}</p>
        </div>

        <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 transition-transform hover:-translate-y-1 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Completadas</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><HiCheckCircle className="w-4 h-4" /></div>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">{estadisticas.rutasCompletas}</p>
        </div>

        <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 transition-transform hover:-translate-y-1 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Pendientes</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400"><HiClock className="w-4 h-4" /></div>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">{estadisticas.rutasPendientes}</p>
        </div>

        <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 transition-transform hover:-translate-y-1 flex flex-col justify-center gap-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
              <HiChartPie className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Avance Global</span>
            </div>
            <span className="text-lg font-black tracking-tight text-slate-800 dark:text-zinc-100">
              {estadisticas.porcentajeProgreso}%
            </span>
          </div>
          {estadisticas.totalLecturas > 0 ? (
            <Progress
              value={estadisticas.porcentajeProgreso}
              color="primary"
              className="h-2"
              classNames={{
                track: "bg-slate-200 dark:bg-slate-800",
                indicator: "bg-blue-600 dark:bg-blue-500 rounded-full",
              }}
              aria-label="Progreso general"
            />
          ) : (
            <div className="h-2 bg-slate-200 dark:bg-zinc-800 rounded-full w-full" />
          )}
          <div className="flex justify-between mt-1 text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
            <span>{estadisticas.lecturasCompletadas} Hechas</span>
            <span>{estadisticas.totalLecturas} Total</span>
          </div>
        </div>
      </div>

      {/* ── 3. CONTENEDOR PRINCIPAL: Filtros y Grid ── */}
      <div className="border border-slate-200 dark:border-zinc-800 shadow-sm bg-transparent rounded-2xl overflow-hidden flex flex-col flex-1">
        
        {/* Filtros */}
        <div className="p-6 border-b border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
            
            {/* Buscador */}
            <div className="lg:col-span-5 relative w-full flex items-center">
              <span className="absolute left-4 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
                <HiSearch className="w-5 h-5" />
              </span>
              <input
                placeholder="Buscar ruta por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-10 py-3 text-sm font-medium rounded-xl transition-all duration-200 bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-none h-[52px]"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <HiX className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtro Período */}
            <div className="lg:col-span-3">
              <div className="w-full h-[52px] flex items-center">
                <SelectorPeriodoAvanzado
                  value={periodoSel || periodoActual}
                  onChange={setPeriodoSel}
                  placeholder="Período"
                  startYear={2020}
                  isDisabled={loading}
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Filtro Ubicación */}
            <div className="lg:col-span-2">
              <Select
                placeholder="Ubicación"
                selectedKeys={[filtroPueblo]}
                onChange={(e) => setPueblo(e.target.value)}
                variant="flat"
                aria-label="Filtrar por ubicación"
                classNames={selectClassNames}
              >
                <SelectItem key="todos" value="todos">Todas</SelectItem>
                <SelectItem key="ng" value="ng">Nácori</SelectItem>
                <SelectItem key="mp" value="mp">Matapé</SelectItem>
                <SelectItem key="ad" value="ad">Adivino</SelectItem>
              </Select>
            </div>

            {/* Filtro Estado */}
            <div className="lg:col-span-2 flex gap-3">
              <Select
                placeholder="Estado"
                selectedKeys={[filtro]}
                onChange={(e) => setFiltro(e.target.value)}
                variant="flat"
                aria-label="Filtrar por estado"
                classNames={selectClassNames}
              >
                <SelectItem key="todos" value="todos">Todos</SelectItem>
                <SelectItem key="completas" value="completas">Completas</SelectItem>
                <SelectItem key="incompletas" value="incompletas">Pendientes</SelectItem>
              </Select>

              {/* Botón Limpiar */}
              <div className={`transition-all duration-300 overflow-hidden shrink-0 ${hasActiveFilters ? 'w-[52px] opacity-100' : 'w-0 opacity-0'}`}>
                <Button 
                  isIconOnly
                  variant="flat" 
                  onPress={limpiarFiltros}
                  className="bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 h-[52px] w-[52px] rounded-xl shadow-none"
                  title="Limpiar filtros"
                >
                  <HiFilter className="text-xl" />
                </Button>
              </div>
            </div>

          </div>
        </div>

        {/* ── GRID DE RUTAS ── */}
        <div className="flex-1 bg-white dark:bg-zinc-950 p-6 sm:p-8">
          {rutasPaginadas.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

              {/* Paginación Inferior */}
              {totalPaginas > 1 && (
                <div className="flex justify-center mt-12 mb-4">
                  <Pagination
                    total={totalPaginas}
                    page={paginaActual}
                    onChange={setPagina}
                    color="default"
                    variant="flat"
                    showControls
                    classNames={{
                      cursor: "bg-slate-800 text-white dark:bg-zinc-200 dark:text-zinc-900 font-bold shadow-sm",
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            /* ── EMPTY STATE CANÓNICO ── */
            <div className="border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[300px] bg-slate-50/50 dark:bg-zinc-900/30">
                <div className="w-16 h-16 rounded-full bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 shadow-sm flex items-center justify-center mb-4">
                    <HiMap className="text-3xl text-slate-400 dark:text-zinc-500" />
                </div>
                <h3 className="text-lg font-black tracking-tight text-slate-700 dark:text-zinc-200 mb-1">
                    No encontramos rutas
                </h3>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mb-6">
                    Ajusta los filtros de búsqueda o cambia el período seleccionado para ver más resultados.
                </p>
                {hasActiveFilters && (
                    <Button
                        className="font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-xl px-6"
                        startContent={<HiFilter className="text-lg" />}
                        onPress={limpiarFiltros}
                    >
                        Limpiar filtros
                    </Button>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




