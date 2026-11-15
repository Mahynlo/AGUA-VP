import React, { useState, useMemo } from "react";
import {
  HiMap,
  HiFilter,
  HiX,
  HiCheckCircle,
  HiClock,
  HiChartPie,
  HiSearch,
  HiLocationMarker,
  HiRefresh,
  HiChevronDown
} from "react-icons/hi";
import ModalRegistrarRuta from "./RegistrarRuta";
import RutaCard from "./RutaCard";
import LoadingSkeleton from "./LoadingSkeleton";

import imagenNacori from "../../../assets/images/nacori_mapa_ruta1.png";
import imagenMatape from "../../../assets/images/Matape_mapa_ruta.png";
import imagenAdivino from "../../../assets/images/Adivino_mapa_ruta.png";

import { useRutas } from "../../../context/RutasContext";
import { useTabRutas } from "../../../hooks/useTabRutas";
import { prefijoDominante, imgPorPrefijo } from "../../../utils/rutaUtils";
import SelectorPeriodoAvanzado from "../../../components/ui/SelectorPeriodoAvanzado";
import { Indicador, IndicadoresVista, EncabezadoSeccion } from "../../../components/ui/VistaModulo";

const SimplePagination = ({ total, page, onChange }) => {
  if (total <= 1) return null;
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-zinc-900/80 p-1.5 rounded-2xl border border-slate-200 dark:border-zinc-800">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="w-8 h-8 flex items-center justify-center rounded-xl text-sm font-bold disabled:opacity-30 hover:bg-white dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-all shadow-none"
        title="Página anterior"
      >
        ‹
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-black transition-all ${
            p === page
              ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm scale-105"
              : "hover:bg-white dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === total}
        className="w-8 h-8 flex items-center justify-center rounded-xl text-sm font-bold disabled:opacity-30 hover:bg-white dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-all shadow-none"
        title="Página siguiente"
      >
        ›
      </button>
    </div>
  );
};

export default function TabRutas() {
  const { rutas, loading, initialLoading, actualizarRutas, periodoActual } = useRutas();

  const imagenes = { nacori: imagenNacori, matape: imagenMatape, adivino: imagenAdivino };

  const {
    search,
    setSearch,
    filtro,
    setFiltro,
    filtroPueblo,
    setPueblo,
    periodoSel,
    setPeriodoSel,
    periodoEfectivo,
    siguientePeriodo,
    periodosInfo,
    ultimoPeriodoRegistrado,
    paginaActual,
    setPagina,
    totalPaginas,
    rutasPaginadas,
    estadisticas,
    limpiarFiltros
  } = useTabRutas(rutas, actualizarRutas, periodoActual);

  // Filtrado local por pueblo y por estado para visualización inmediata
  const rutasFiltradas = useMemo(() => {
    let list = [...(rutasPaginadas || [])];

    if (filtroPueblo && filtroPueblo !== "todos") {
      list = list.filter((r) => {
        const pref = prefijoDominante(r.numeros_serie || []).toLowerCase();
        const nom = (r.nombre || "").toLowerCase();
        if (filtroPueblo === "ng") return pref === "ng" || nom.includes("nacori");
        if (filtroPueblo === "mp") return pref === "mp" || nom.includes("matape");
        if (filtroPueblo === "ad") return pref === "ad" || nom.includes("adivino");
        return true;
      });
    }

    if (filtro === "completas") {
      list = list.filter((r) => r.total_puntos > 0 && r.completadas === r.total_puntos);
    } else if (filtro === "incompletas") {
      list = list.filter((r) => r.total_puntos > 0 && r.completadas < r.total_puntos);
    }

    return list;
  }, [rutasPaginadas, filtroPueblo, filtro]);

  if (initialLoading) {
    return <LoadingSkeleton />;
  }

  const hasActiveFilters = Boolean(search || filtro !== "todos" || filtroPueblo !== "todos");

  const pueblosConfig = [
    { key: "todos", label: "Todos los Sectores" },
    { key: "ng", label: "Nácori Grande" },
    { key: "mp", label: "Matapé" },
    { key: "ad", label: "Adivino" }
  ];

  return (
    <div className="h-full flex flex-col gap-5 w-full animate-in fade-in duration-300 pb-6">

      {/* ── 1. INDICADORES DEL PERIODO (se muestran junto al título del módulo) ── */}
      <IndicadoresVista>
        <Indicador
          icon={HiMap}
          tint="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          label="Total rutas"
          value={estadisticas.totalRutas}
          detalle="En el periodo seleccionado"
        />
        <Indicador
          icon={HiCheckCircle}
          tint="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          label="Completadas"
          value={estadisticas.rutasCompletas}
          valueClass="text-emerald-600 dark:text-emerald-400"
          detalle={estadisticas.totalRutas > 0
            ? `${Math.round((estadisticas.rutasCompletas / estadisticas.totalRutas) * 100)}% de las rutas`
            : "Sin rutas registradas"}
        />
        <Indicador
          icon={HiClock}
          tint="bg-orange-500/10 text-orange-600 dark:text-orange-400"
          label="Pendientes"
          value={estadisticas.rutasPendientes}
          valueClass="text-orange-600 dark:text-orange-400"
          detalle="Rutas por terminar de leer"
        />
        {/* Avance global con barra */}
        <Indicador
          icon={HiChartPie}
          tint="bg-purple-500/10 text-purple-600 dark:text-purple-400"
          label="Avance global"
          value={`${estadisticas.porcentajeProgreso}%`}
          sufijo={
            <span className="ml-auto text-xs font-semibold text-slate-400 dark:text-zinc-500 tabular-nums whitespace-nowrap" title="Lecturas capturadas / medidores de las rutas">
              {estadisticas.lecturasCompletadas} / {estadisticas.totalLecturas}
            </span>
          }
        >
          <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${estadisticas.porcentajeProgreso}%` }}
            />
          </div>
        </Indicador>
      </IndicadoresVista>

      {/* ── SUBTÍTULO DE LA PESTAÑA ── */}
      <EncabezadoSeccion
        icon={HiMap}
        titulo="Rutas de lectura"
        descripcion="Elige una ruta para capturar sus lecturas, generar o recalcular sus facturas."
        cargando={loading}
      >
        <ModalRegistrarRuta />
      </EncabezadoSeccion>

      {/* ── 2. BARRA DE HERRAMIENTAS: BÚSQUEDA, PERÍODO, FILTROS Y ACCIÓN ── */}
      <div className="bg-slate-50/60 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col gap-3 relative z-30">

        {/* Fila Principal de Filtros */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">

          {/* Buscador */}
          <div className="relative flex items-center flex-1 min-w-0">
            <span className="absolute left-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none">
              <HiSearch className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Buscar ruta por nombre o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 text-sm font-medium rounded-xl bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all h-11 shadow-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
                title="Limpiar búsqueda"
              >
                <HiX className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Selector de Período */}
            <div className="h-11 flex items-center sm:w-72">
              <SelectorPeriodoAvanzado
                value={periodoEfectivo}
                onChange={setPeriodoSel}
                placeholder="Período"
                startYear={2020}
                isDisabled={loading}
                className="w-full h-full"
                periodosInfo={periodosInfo}
                siguientePeriodo={siguientePeriodo}
                ultimoPeriodoRegistrado={ultimoPeriodoRegistrado}
              />
            </div>

            {/* Selector de Estado */}
            <div className="relative sm:w-48">
              <select
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                aria-label="Filtrar por estado de lectura"
                className="w-full h-11 pl-3.5 pr-8 text-sm font-semibold rounded-xl bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-none appearance-none cursor-pointer transition-all"
              >
                <option value="todos">Todos los estados</option>
                <option value="completas">Solo completadas</option>
                <option value="incompletas">Solo pendientes</option>
              </select>
              <HiChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Fila Secundaria: Sector, Limpiar y conteo */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">

          {/* Control segmentado de sector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1">
              <HiLocationMarker className="w-3.5 h-3.5" /> Sector
            </span>
            <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-200/50 dark:bg-zinc-800/60">
              {pueblosConfig.map((p) => {
                const isActive = filtroPueblo === p.key;
                return (
                  <button
                    key={p.key}
                    onClick={() => setPueblo(p.key)}
                    aria-pressed={isActive}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? "bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 shadow-sm"
                        : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resumen y Botón Limpiar */}
          <div className="flex items-center gap-3 ml-auto sm:ml-0">
            {hasActiveFilters && (
              <button
                onClick={limpiarFiltros}
                className="text-xs font-bold text-slate-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                title="Restablecer todos los filtros"
              >
                <HiFilter className="w-3.5 h-3.5" />
                Limpiar filtros
              </button>
            )}
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              {rutasFiltradas.length} {rutasFiltradas.length === 1 ? "ruta" : "rutas"}
            </span>
          </div>

        </div>

      </div>

      {/* ── 3. CONTENEDOR DE TARJETAS DE RUTAS ── */}
      {rutasFiltradas.length > 0 ? (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
            {rutasFiltradas.map((r) => {
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
            <div className="flex justify-center mt-2">
              <SimplePagination
                total={totalPaginas}
                page={paginaActual}
                onChange={setPagina}
              />
            </div>
          )}
        </div>
      ) : (
        /* Estado Vacío Canónico */
        <div className="border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[280px] bg-slate-50/50 dark:bg-zinc-900/20">
          <div className="w-14 h-14 rounded-xl bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 shadow-sm flex items-center justify-center mb-4 text-slate-400 dark:text-zinc-500">
            <HiMap className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black tracking-tight text-slate-800 dark:text-zinc-100 mb-1">
            No se encontraron rutas
          </h3>
          <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mb-5">
            Ajusta la búsqueda, elige otro sector o cambia el periodo.
          </p>
          {hasActiveFilters && (
            <button
              onClick={limpiarFiltros}
              className="font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-5 py-2.5 text-xs shadow-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <HiFilter className="text-sm" />
              Limpiar todos los filtros
            </button>
          )}
        </div>
      )}

    </div>
  );
}
