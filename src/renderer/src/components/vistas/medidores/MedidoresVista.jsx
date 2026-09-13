import React, { useMemo, useState } from "react";
import { HiCog, HiCheck, HiX, HiLocationMarker, HiMap, HiTable, HiCube, HiSparkles } from "react-icons/hi";

import { useMedidores } from "../../../context/MedidoresContext";
import { MedidoresIcon } from "../../../IconsApp/IconsSidebar";
import LoadingSkeleton from "./components/LoadingSkeleton";

// Componentes de Pestañas
import TabMapaMedidores from "./TabMapaMedidores";
import TabInventarioMedidores from "./TabInventarioMedidores";

const Medidores = () => {
  const {
    allMedidores,
    medidoresAsignados,
    medidoresNoAsignados,
    loading,
    initialLoading
  } = useMedidores();

  // Estado para la pestaña activa, recuperado de localStorage
  const [selectedTab, setSelectedTab] = useState(() => {
    return localStorage.getItem("medidores_activeTab") || "mapa";
  });

  const handleTabChange = (key) => {
    setSelectedTab(key);
    localStorage.setItem("medidores_activeTab", key);
  };

  // Estadísticas calculadas desde allMedidores (dataset completo)
  const estadisticas = useMemo(() => {
    if (initialLoading) {
      return { total: 0, asignados: 0, libres: 0, activos: 0, inactivos: 0, porcentajeAsignados: 0, porcentajeActivos: 0 };
    }
    if (!allMedidores || allMedidores.length === 0) {
      return { total: 0, asignados: 0, libres: 0, activos: 0, inactivos: 0, porcentajeAsignados: 0, porcentajeActivos: 0 };
    }
    const activos = allMedidores.filter(m => m.estado_medidor === "Activo").length;
    const inactivos = allMedidores.filter(m => m.estado_medidor === "Inactivo").length;
    return {
      total: allMedidores.length,
      asignados: medidoresAsignados.length,
      libres: medidoresNoAsignados.length,
      activos,
      inactivos,
      porcentajeAsignados: allMedidores.length > 0 ? (medidoresAsignados.length / allMedidores.length * 100) : 0,
      porcentajeActivos: allMedidores.length > 0 ? (activos / allMedidores.length * 100) : 0
    };
  }, [allMedidores, medidoresAsignados, medidoresNoAsignados, initialLoading]);

  // ESTADO DE CARGA INICIAL
  if (initialLoading) {
    return (
      <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20">
        <div className="w-full min-h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-6 sm:p-8 lg:p-10 flex flex-col gap-8 mb-12">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    // CONTENEDOR PRINCIPAL: Padding exterior fluido y fondo gris sutil
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20 scroll-smooth">

      {/* CONTENEDOR DE LA VISTA: 'w-full min-h-full' para ocupar todo el espacio disponible */}
      <div className="w-full min-h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-6 sm:p-8 lg:p-10 flex flex-col gap-8">

        {/* ── 1. HEADER Y ESTADÍSTICAS ── */}
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-8 pb-2">
          
          {/* Título de la vista */}
          <div className="flex gap-4 items-start shrink-0">
            {/* Regla de Tintes (Azul Base) */}
            <div className="p-3.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0 flex items-center justify-center">
              <MedidoresIcon className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1 pt-0.5">
              <div className="flex items-center gap-3">
                {/* Token 3: Textos Principales */}
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
                  Gestión de Medidores
                </h1>
                {/* Loader Sutil de actualización */}
                {loading && !initialLoading && (
                  <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" title="Actualizando datos en tiempo real..."></div>
                )}
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400 max-w-lg mt-1 leading-relaxed">
                Administra el inventario de hardware, monitorea geolocalizaciones y gestiona la asignación a predios.
              </p>
            </div>
          </div>

          {/* Tarjetas de Estadísticas (KPIs) - Se alinean a la derecha */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full xl:w-auto shrink-0">
            
            {/* KPI: Total Medidores */}
            <div className="flex flex-col justify-center p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1 gap-3 min-w-[140px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Total</span>
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400"><HiCube className="w-4 h-4" /></div>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">
                {estadisticas.total.toLocaleString('es-MX')}
              </p>
            </div>

            {/* KPI: Asignados */}
            <div className="flex flex-col justify-center p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1 gap-3 min-w-[140px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Asignados</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><HiCheck className="w-4 h-4" /></div>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">
                {estadisticas.asignados.toLocaleString('es-MX')}
              </p>
            </div>

            {/* KPI: Disponibles */}
            <div className="flex flex-col justify-center p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1 gap-3 min-w-[140px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Disponibles</span>
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"><HiSparkles className="w-4 h-4" /></div>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">
                {estadisticas.libres.toLocaleString('es-MX')}
              </p>
            </div>

            {/* KPI: En Servicio */}
            <div className="flex flex-col justify-center p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1 gap-3 min-w-[140px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">En Servicio</span>
                <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400"><HiLocationMarker className="w-4 h-4" /></div>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">
                {estadisticas.activos.toLocaleString('es-MX')}
              </p>
            </div>

          </div>
        </div>

        {/* ── 2. NAVEGACIÓN (TABS) Y CONTENIDO ── */}
        <div className="flex flex-col w-full flex-1">
          {/* Pestañas de Navegación SaaS Unificadas */}
          <div className="w-full border-b border-slate-200 dark:border-zinc-800 mb-6">
            <nav className="flex gap-8 w-full -mb-px">
              {/* TAB 1: MAPA */}
              <button
                type="button"
                onClick={() => handleTabChange("mapa")}
                className={`flex items-center gap-2.5 py-3 text-sm border-b-2 transition-colors cursor-pointer shrink-0 ${
                  selectedTab === "mapa"
                    ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
                }`}
              >
                <HiMap className="text-lg" />
                <span>Mapa y Ubicaciones</span>
              </button>

              {/* TAB 2: INVENTARIO */}
              <button
                type="button"
                onClick={() => handleTabChange("inventario")}
                className={`flex items-center gap-2.5 py-3 text-sm border-b-2 transition-colors cursor-pointer shrink-0 ${
                  selectedTab === "inventario"
                    ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
                }`}
              >
                <HiTable className="text-lg" />
                <span>Inventario General</span>
                <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black h-5 text-[10px] px-2 ml-1 rounded-md border border-blue-500/20 inline-flex items-center">
                  {estadisticas.total}
                </span>
              </button>
            </nav>
          </div>

          {/* CONTENIDOS */}
          {selectedTab === "mapa" && (
            <div className="pt-1 h-full flex flex-col">
              <TabMapaMedidores />
            </div>
          )}

          {selectedTab === "inventario" && (
            <div className="pt-1 h-full flex flex-col">
              <TabInventarioMedidores />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Medidores;
