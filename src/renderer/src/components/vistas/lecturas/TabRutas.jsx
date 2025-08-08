import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Card, CardBody, CardHeader, Chip, Pagination, Progress, Skeleton } from "@nextui-org/react";
import { Select, SelectItem } from "@nextui-org/react";
import { HiSearch, HiMap, HiPlus, HiFilter, HiCalendar } from "react-icons/hi";
import ModalRegistrarRuta from "../lecturas/RegistrarRuta";
import RutaCard from "./RutaCard";

import imagenNacori from "../../../assets/images/nacori_mapa_ruta1.png";
import imagenMatape from "../../../assets/images/Matape_mapa_ruta.png";
import imagenAdivino from "../../../assets/images/Adivino_mapa_ruta.png";

import { useRutas } from "../../../context/RutasContext";

export default function TabRutas() {
  const navigate = useNavigate();

  /* ---------------- estados de UI ---------------- */
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("todos");   // completas / incompletas
  const [filtroPueblo, setPueblo] = useState("todos");   // ng / mp / ad
  const [paginaActual, setPagina] = useState(1);
  const [rutasPorPagina, setPorPag] = useState(4);
  const [periodoSel, setPeriodoSel] = useState(null);      // 'YYYY-MM'

  /* ---------------- contexto de rutas ---------------- */
  const { rutas, loading, initialLoading, actualizarRutas, periodoActual } = useRutas();

  /* ----- genera lista de meses disponibles (12 últimos) ----- */
  const opcionesPeriodo = useMemo(() => {
    const hoy = new Date();
    const lista = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const val = d.toISOString().slice(0, 7);      // YYYY-MM
      const label = d.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
      lista.push({ val, label });
    }
    return lista;          // Máximo: mes actual hacia 11 anteriores
  }, []);

  /* ------ traer rutas cuando el usuario cambia de periodo ------ */
  useEffect(() => {
    // Solo hacer fetch si el periodo seleccionado es diferente al actual
    if (periodoSel && periodoSel !== periodoActual) {
      actualizarRutas(periodoSel);
    }
  }, [periodoSel, periodoActual, actualizarRutas]);

  /* --------- cálculo de tarjetas por responsive --------- */
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      setPorPag(w < 640 ? 2 : w < 1024 ? 4 : w < 1280 ? 6 : 8);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  /* --------- utilidades prefijo/imagen --------- */
  const prefijoDominante = (arr = []) => {
    const freq = {}; arr.forEach(s => { const p = s.slice(0, 2).toUpperCase(); freq[p] = (freq[p] || 0) + 1 });
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  };
  const imgPorPrefijo = p => p === "NG" ? imagenNacori : p === "MP" ? imagenMatape : p === "AD" ? imagenAdivino : imagenNacori;

  /* ---------------- cálculo de estadísticas ---------------- */
  const estadisticas = useMemo(() => {
    const totalRutas = rutas.length;
    const rutasCompletas = rutas.filter(r => r.completadas === r.total_puntos).length;
    const rutasPendientes = rutas.filter(r => r.completadas < r.total_puntos).length;
    const totalLecturas = rutas.reduce((acc, r) => acc + (r.total_puntos || 0), 0);
    const lecturasCompletadas = rutas.reduce((acc, r) => acc + (r.completadas || 0), 0);
    const porcentajeProgreso = totalLecturas > 0 ? Math.round((lecturasCompletadas / totalLecturas) * 100) : 0;
    
    return {
      totalRutas,
      rutasCompletas,
      rutasPendientes,
      totalLecturas,
      lecturasCompletadas,
      porcentajeProgreso
    };
  }, [rutas]);

  /* ---------------- filtros ---------------- */
  const rutasFiltradas = rutas
    .filter(r => r.nombre.toLowerCase().includes(search.toLowerCase()))
    .filter(r => {
      if (filtro === "completas") return r.completadas >= r.total_puntos;
      if (filtro === "incompletas") return r.completadas < r.total_puntos;
      return true;
    })
    .filter(r => {
      if (filtroPueblo === "todos") return true;
      return prefijoDominante(r.numeros_serie).toLowerCase() === filtroPueblo;
    });

  /* ---------------- paginación ---------------- */
  const totalPag = Math.ceil(rutasFiltradas.length / rutasPorPagina);
  const pageData = rutasFiltradas.slice((paginaActual - 1) * rutasPorPagina, paginaActual * rutasPorPagina);

  /* ---------------- componente de loading elegante ---------------- */
  const LoadingSkeleton = () => (
    <div className="h-full flex flex-col space-y-4">
      {/* Header skeleton */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="w-40 h-6 rounded-lg" />
                <Skeleton className="w-60 h-4 rounded-lg" />
              </div>
            </div>
            <Skeleton className="w-32 h-10 rounded-lg" />
          </div>
        </CardHeader>
        
        <CardBody className="pt-0">
          {/* Estadísticas skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg border">
                <Skeleton className="w-12 h-6 rounded-lg mb-2" />
                <Skeleton className="w-20 h-3 rounded-lg" />
              </div>
            ))}
          </div>

          {/* Barra de progreso skeleton */}
          <div className="mb-4 p-4 rounded-lg border">
            <div className="flex justify-between items-center mb-2">
              <Skeleton className="w-40 h-4 rounded-lg" />
              <Skeleton className="w-12 h-4 rounded-lg" />
            </div>
            <Skeleton className="w-full h-2 rounded-lg mb-2" />
            <div className="flex justify-between">
              <Skeleton className="w-32 h-3 rounded-lg" />
              <Skeleton className="w-24 h-3 rounded-lg" />
            </div>
          </div>

          {/* Filtros skeleton */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end mb-4">
            <Skeleton className="w-full max-w-md h-10 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton className="w-40 h-10 rounded-lg" />
              <Skeleton className="w-32 h-10 rounded-lg" />
              <Skeleton className="w-32 h-10 rounded-lg" />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Grid skeleton */}
      <div className="flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: rutasPorPagina }).map((_, i) => (
            <Card key={i} className="h-64">
              <CardBody className="p-4">
                <Skeleton className="w-full h-32 rounded-lg mb-3" />
                <Skeleton className="w-3/4 h-5 rounded-lg mb-2" />
                <Skeleton className="w-1/2 h-4 rounded-lg mb-3" />
                <div className="flex justify-between">
                  <Skeleton className="w-16 h-6 rounded-lg" />
                  <Skeleton className="w-20 h-8 rounded-lg" />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

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
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center">
              <p className="text-lg font-bold text-purple-600">
                {estadisticas.porcentajeProgreso}%
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Progreso ({estadisticas.lecturasCompletadas}/{estadisticas.totalLecturas})
              </p>
            </div>
          </div>

          {/* Barra de progreso general */}
          {estadisticas.totalLecturas > 0 && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
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

          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Filtros
            </h2>
          </div>

          {/* Filtros mejorados */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
            {/* Buscador */}
            <div className="flex-1 max-w-md">


              <div className="relative w-full flex">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  <HiSearch className="inline-block mr-2" />
                </span>
                <input
                  placeholder="Buscar rutas..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPagina(1); }}

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

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

              <Select
                label="Período"
                placeholder="Seleccionar período"
                selectedKeys={[periodoSel || periodoActual]}
                onChange={(e) => { setPeriodoSel(e.target.value); setPagina(1); }}
                variant="bordered"
                size="sm"
                className="min-w-[160px]"
                startContent={<HiCalendar className="text-gray-400" />}
              >
                {opcionesPeriodo.map(o => (
                  <SelectItem key={o.val} value={o.val}>{o.label}</SelectItem>
                ))}
              </Select>

              <Select
                label="Ciudad"
                placeholder="Todas las ciudades"
                selectedKeys={[filtroPueblo]}
                onChange={(e) => { setPueblo(e.target.value); setPagina(1); }}
                variant="bordered"
                size="sm"
                className="min-w-[140px]"
                startContent={<HiMap className="text-gray-400" />}
              >
                <SelectItem key="todos" value="todos">Todas</SelectItem>
                <SelectItem key="ng" value="ng">Nácori</SelectItem>
                <SelectItem key="mp" value="mp">Matapé</SelectItem>
                <SelectItem key="ad" value="ad">Adivino</SelectItem>
              </Select>

              <Select
                label="Estado"
                placeholder="Todos los estados"
                selectedKeys={[filtro]}
                onChange={(e) => { setFiltro(e.target.value); setPagina(1); }}
                variant="bordered"
                size="sm"
                className="min-w-[140px]"
                startContent={<HiFilter className="text-gray-400" />}
              >
                <SelectItem key="todos" value="todos">Todos</SelectItem>
                <SelectItem key="completas" value="completas">Completas</SelectItem>
                <SelectItem key="incompletas" value="incompletas">Pendientes</SelectItem>
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Grid de rutas */}
      <div className="flex-1 overflow-y-auto">
        {rutasFiltradas.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
              {pageData.map(r => {
                const pref = prefijoDominante(r.numeros_serie);
                return (
                  <RutaCard
                    key={r.id}
                    ruta={{ ...r, imagen: imgPorPrefijo(pref) }}
                  />
                );
              })}
            </div>

            {/* Paginación mejorada */}
            {totalPag > 1 && (
              <div className="flex justify-center">
                <Pagination
                  total={totalPag}
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
                  onClick={() => {
                    setSearch("");
                    setFiltro("todos");
                    setPueblo("todos");
                  }}
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




