import React, { useMemo, useState } from "react";
import { Tabs, Tab, Skeleton, Chip } from "@nextui-org/react";
import { HiCog, HiCheck, HiX, HiLocationMarker, HiMap, HiTable } from "react-icons/hi";

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
      <div className="w-full min-h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-6 sm:p-8 lg:p-10 flex flex-col gap-10 animate-in fade-in duration-500">

        {/* ── 1. HEADER Y ESTADÍSTICAS ── */}
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-8">
          
          {/* Título de la vista */}
          <div className="flex gap-4 items-start shrink-0">
            {/* Regla de Tintes (Azul Base) */}
            <div className="p-3.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0 flex items-center justify-center">
              <MedidoresIcon className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1 pt-0.5">
              <div className="flex items-center gap-3">
                {/* Token 3: Textos Principales */}
                <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
                  Gestión de Medidores
                </h1>
                {/* Loader Sutil de actualización */}
                {loading && !initialLoading && (
                  <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" title="Actualizando datos..."></div>
                )}
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 max-w-lg mt-1 leading-relaxed">
                Administra el inventario, monitorea ubicaciones y gestiona la asignación de todos los medidores.
              </p>
            </div>
          </div>

          {/* Tarjetas de Estadísticas (KPIs) - Se alinean a la derecha */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full xl:w-auto shrink-0">
            
            {/* KPI: Total (Azul) */}
            <div className="flex flex-col gap-3 p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Total Inventario</span>
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400"><HiCog className="w-4 h-4" /></div>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">
                {estadisticas.total.toLocaleString('es-MX')}
              </p>
            </div>

            {/* KPI: Asignados (Esmeralda) */}
            <div className="flex flex-col gap-3 p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Asignados</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><HiCheck className="w-4 h-4" /></div>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none flex items-baseline gap-1.5">
                {estadisticas.asignados.toLocaleString('es-MX')}
                <span className="text-xs font-bold text-emerald-500/80">({estadisticas.porcentajeAsignados.toFixed(0)}%)</span>
              </p>
            </div>

            {/* KPI: Disponibles/Libres (Rosa/Rojo suave) */}
            <div className="flex flex-col gap-3 p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Disponibles</span>
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400"><HiX className="w-4 h-4" /></div>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">
                {estadisticas.libres.toLocaleString('es-MX')}
              </p>
            </div>

            {/* KPI: Activos (Naranja) */}
            <div className="flex flex-col gap-3 p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">En Servicio</span>
                <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400"><HiLocationMarker className="w-4 h-4" /></div>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none flex items-baseline gap-1.5">
                {estadisticas.activos.toLocaleString('es-MX')}
                <span className="text-xs font-bold text-orange-500/80">({estadisticas.porcentajeActivos.toFixed(0)}%)</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── 2. NAVEGACIÓN (TABS) Y CONTENIDO ── */}
        <div className="flex flex-col w-full flex-1 mt-2">
          {/* Token 7: Pestañas de Navegación SaaS - Ahora unificadas en color Azul */}
          <Tabs
            aria-label="Opciones de Medidores"
            selectedKey={selectedTab}
            onSelectionChange={handleTabChange}
            variant="underlined"
            classNames={{
              base: "w-full border-b border-slate-200 dark:border-zinc-800 mb-6",
              tabList: "gap-6 w-full relative rounded-none p-0",
              cursor: "w-full bg-blue-600 dark:bg-blue-500 h-[2px]", // Cursor azul
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-blue-600 dark:group-data-[selected=true]:text-blue-400 group-data-[selected=true]:font-bold text-slate-500 dark:text-zinc-400 font-medium text-sm transition-colors", // Texto azul activo
            }}
          >
            {/* TAB 1: MAPA */}
            <Tab
              key="mapa"
              title={
                <div className="flex items-center gap-2.5">
                  <HiMap className="text-lg" />
                  <span>Mapa y Ubicaciones</span>
                </div>
              }
            >
              <div className="pt-2 animate-in fade-in duration-500 h-full flex flex-col">
                <TabMapaMedidores />
              </div>
            </Tab>

            {/* TAB 2: INVENTARIO */}
            <Tab
              key="inventario"
              title={
                <div className="flex items-center gap-2.5">
                  <HiTable className="text-lg" />
                  <span>Inventario General</span>
                  <Chip size="sm" variant="flat" className="bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-bold h-5 text-[10px] px-1 ml-1 rounded-md">
                    {estadisticas.total}
                  </Chip>
                </div>
              }
            >
              <div className="pt-2 animate-in fade-in duration-500 h-full flex flex-col">
                <TabInventarioMedidores />
              </div>
            </Tab>
          </Tabs>
        </div>

      </div>
    </div>
  );
};

export default Medidores;
