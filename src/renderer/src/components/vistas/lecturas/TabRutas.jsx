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
  HiRefresh
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
    <div className="h-full flex flex-col gap-6 w-full animate-in fade-in duration-300 pb-8">

      {/* ── 1. TARJETAS DE ESTADÍSTICAS DEL CICLO ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Rutas */}
        <div className="bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm transition-transform hover:-translate-y-0.5 flex flex-col justify-between gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
              Total Rutas
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <HiMap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-800 dark:text-zinc-100 leading-none">
              {estadisticas.totalRutas}
            </p>
            <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 mt-1.5">
              En este período activo
            </p>
          </div>
        </div>

        {/* KPI 2: Completadas */}
        <div className="bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm transition-transform hover:-translate-y-0.5 flex flex-col justify-between gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
              Completadas
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <HiCheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
              {estadisticas.rutasCompletas}
            </p>
            <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 mt-1.5">
              {estadisticas.totalRutas > 0
                ? `${Math.round((estadisticas.rutasCompletas / estadisticas.totalRutas) * 100)}% de las rutas`
                : "Sin rutas registradas"}
            </p>
          </div>
        </div>

        {/* KPI 3: Pendientes */}
        <div className="bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm transition-transform hover:-translate-y-0.5 flex flex-col justify-between gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
              Pendientes
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <HiClock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-amber-600 dark:text-amber-400 leading-none">
              {estadisticas.rutasPendientes}
            </p>
            <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 mt-1.5">
              Rutas por finalizar lectura
            </p>
          </div>
        </div>

        {/* KPI 4: Avance Global de Lecturas */}
        <div className="bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm transition-transform hover:-translate-y-0.5 flex flex-col justify-between gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
              Avance Global
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <HiChartPie className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-3xl font-black text-slate-800 dark:text-zinc-100 leading-none">
                {estadisticas.porcentajeProgreso}%
              </span>
              <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500">
                {estadisticas.lecturasCompletadas} / {estadisticas.totalLecturas}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${estadisticas.porcentajeProgreso}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* ── 2. BARRA DE HERRAMIENTAS: BÚSQUEDA, PERÍODO, FILTROS Y ACCIÓN ── */}
      <div className="bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
        
        {/* Fila Principal de Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
          
          {/* Buscador Estándar */}
          <div className="md:col-span-4 relative flex items-center">
            <span className="absolute left-4 text-slate-400 dark:text-zinc-500 pointer-events-none">
              <HiSearch className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Buscar ruta por nombre o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-3 text-sm font-medium rounded-xl bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all h-[52px] shadow-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
                title="Limpiar búsqueda"
              >
                <HiX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Selector de Período */}
          <div className="md:col-span-3 h-[52px] flex items-center">
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
          <div className="md:col-span-3">
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              aria-label="Filtrar por estado de lectura"
              className="w-full h-[52px] pl-4 pr-8 text-sm font-semibold rounded-xl bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-none appearance-none cursor-pointer transition-all"
            >
              <option value="todos">Todos los Estados</option>
              <option value="completas">Solo Completadas</option>
              <option value="incompletas">Solo Pendientes</option>
            </select>
          </div>

          {/* Botón Nueva Ruta */}
          <div className="md:col-span-2 flex justify-end">
            <ModalRegistrarRuta />
          </div>

        </div>

        {/* Fila Secundaria: Filtros Rápidos por Sector / Pueblo y Limpiar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-slate-200/70 dark:border-zinc-800/70">
          
          {/* Píldoras de Pueblo */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mr-1 flex items-center gap-1">
              <HiLocationMarker className="w-3.5 h-3.5" /> Sector:
            </span>
            {pueblosConfig.map((p) => {
              const isActive = filtroPueblo === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setPueblo(p.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm scale-105"
                      : "bg-white hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Resumen y Botón Limpiar */}
          <div className="flex items-center gap-3 ml-auto sm:ml-0">
            {hasActiveFilters && (
              <button
                onClick={limpiarFiltros}
                className="text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors"
                title="Restablecer todos los filtros"
              >
                <HiFilter className="w-3.5 h-3.5" />
                Limpiar Filtros
              </button>
            )}
            <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">
              Mostrando <strong>{rutasFiltradas.length}</strong> rutas
            </span>
          </div>

        </div>

      </div>

      {/* ── 3. CONTENEDOR DE TARJETAS DE RUTAS ── */}
      {rutasFiltradas.length > 0 ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
            <div className="flex justify-center mt-6 mb-2">
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
        <div className="border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[320px] bg-slate-50/50 dark:bg-zinc-900/20">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 shadow-sm flex items-center justify-center mb-4 text-slate-400 dark:text-zinc-500">
            <HiMap className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-zinc-100 mb-1">
            No se encontraron rutas
          </h3>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mb-6">
            Ajusta los filtros de búsqueda, selecciona otro sector o cambia el período del ciclo.
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
