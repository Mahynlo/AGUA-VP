import { useNavigate } from "react-router-dom";
import { Chip, Tabs, Tab, Skeleton } from "@nextui-org/react";
import { HiMap, HiDocumentText, HiChartBar, HiClock, HiCheckCircle } from "react-icons/hi";
import React, { useState, useMemo } from "react";

import TabRutas from "./lecturas/TabRutas";
import TabMetricas from "./lecturas/TabMetricas";
import { useRutas } from "../../context/RutasContext";

import { LecturasIcon } from "../../IconsApp/IconsResibos";

const Lecturas = () => {
  const navigate = useNavigate();
  const { rutas, initialLoading, pagination } = useRutas();

  // Estado para la pestaña activa, recuperado de localStorage
  const [selectedTab, setSelectedTab] = useState(() => {
    return localStorage.getItem("lecturas_activeTab") || "lecturas";
  });

  const handleTabChange = (key) => {
    setSelectedTab(key);
    localStorage.setItem("lecturas_activeTab", key);
  };

  // Calcular estadísticas reales basadas en los datos
  const estadisticas = useMemo(() => {
    if (initialLoading) {
      return {
        rutasActivas: 0,
        lecturasHoy: 0,
        lecturasCompletadas: 0,
        eficiencia: 0
      };
    }

    // Si hay paginación, usar el total global.
    const totalRutas = pagination ? pagination.total : rutas.length;

    const lecturasCompletadas = rutas.reduce((acc, r) => acc + (r.completadas || 0), 0);
    const totalLecturas = rutas.reduce((acc, r) => acc + (r.total_puntos || 0), 0);
    const eficiencia = totalLecturas > 0 ? Math.round((lecturasCompletadas / totalLecturas) * 100) : 0;

    return {
      rutasActivas: totalRutas,
      lecturasHoy: lecturasCompletadas,
      lecturasCompletadas: lecturasCompletadas,
      eficiencia: eficiencia
    };
  }, [rutas, initialLoading, pagination]);

  // ESTADO DE CARGA INICIAL
  if (initialLoading) {
    return (
      <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20">
        <div className="w-full min-h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-6 sm:p-8 lg:p-10 flex flex-col gap-8 mb-12">
            <div className="flex items-center gap-4">
              <Skeleton className="w-14 h-14 rounded-2xl" />
              <div className="flex flex-col gap-2">
                <Skeleton className="w-48 h-6 rounded-lg" />
                <Skeleton className="w-72 h-4 rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
               {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
               {[1,2,3].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
            </div>
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
            {/* Regla de Tintes (Ámbar Corporativo) */}
            <div className="p-3.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl shrink-0 flex items-center justify-center">
              <LecturasIcon className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1 pt-0.5">
              {/* Token 3: Textos Principales */}
              <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
                Sistema de Lecturas
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 max-w-lg mt-1 leading-relaxed">
                Gestiona las rutas, registra lecturas de medidores y evalúa el rendimiento operativo.
              </p>
            </div>
          </div>

          {/* Tarjetas de Estadísticas (KPIs) - Se alinean a la derecha */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full xl:w-auto shrink-0">
            
            {/* KPI: Rutas Activas (Azul) */}
            <div className="flex flex-col gap-3 p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Rutas Activas</span>
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400"><HiMap className="w-4 h-4" /></div>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">
                {estadisticas.rutasActivas.toLocaleString('es-MX')}
              </p>
            </div>

            {/* KPI: Lecturas Hoy (Esmeralda) */}
            <div className="flex flex-col gap-3 p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Lecturas Hoy</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><HiClock className="w-4 h-4" /></div>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">
                {estadisticas.lecturasHoy.toLocaleString('es-MX')}
              </p>
            </div>

            {/* KPI: Completadas (Púrpura) */}
            <div className="flex flex-col gap-3 p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Completadas</span>
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400"><HiCheckCircle className="w-4 h-4" /></div>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">
                {estadisticas.lecturasCompletadas.toLocaleString('es-MX')}
              </p>
            </div>

            {/* KPI: Eficiencia (Naranja) */}
            <div className="flex flex-col gap-3 p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Eficiencia</span>
                <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400"><HiChartBar className="w-4 h-4" /></div>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none flex items-baseline gap-1">
                {estadisticas.eficiencia} <span className="text-sm font-bold text-orange-400/80">%</span>
              </p>
            </div>

          </div>
        </div>

        {/* ── 2. NAVEGACIÓN (TABS) Y CONTENIDO ── */}
        <div className="flex flex-col w-full flex-1 mt-2">
          {/* Token 7: Pestañas de Navegación SaaS - Ahora unificadas en color Ámbar */}
          <Tabs
            aria-label="Opciones de Lecturas"
            selectedKey={selectedTab}
            onSelectionChange={handleTabChange}
            variant="underlined"
            classNames={{
              base: "w-full border-b border-slate-200 dark:border-zinc-800 mb-6",
              tabList: "gap-6 w-full relative rounded-none p-0",
              cursor: "w-full bg-amber-600 dark:bg-amber-500 h-[2px]", // Cursor Ámbar
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-amber-600 dark:group-data-[selected=true]:text-amber-500 group-data-[selected=true]:font-bold text-slate-500 dark:text-zinc-400 font-medium text-sm transition-colors", // Texto Ámbar activo
            }}
          >
            {/* TAB 1: REGISTRO DE LECTURAS */}
            <Tab
              key="lecturas"
              title={
                <div className="flex items-center gap-2.5">
                  <HiDocumentText className="text-lg" />
                  <span>Registro de Lecturas</span>
                  <Chip size="sm" variant="flat" className="bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-bold h-5 text-[10px] px-1 ml-1 rounded-md">
                    Rutas
                  </Chip>
                </div>
              }
            >
              <div className="pt-2 animate-in fade-in duration-500 h-full flex flex-col">
                <TabRutas />
              </div>
            </Tab>

            {/* TAB 2: MÉTRICAS Y REPORTES */}
            <Tab
              key="metricas"
              title={
                <div className="flex items-center gap-2.5">
                  <HiChartBar className="text-lg" />
                  <span>Métricas y Reportes</span>
                </div>
              }
            >
              <div className="pt-2 animate-in fade-in duration-500 h-full flex flex-col">
                <TabMetricas />
              </div>
            </Tab>
          </Tabs>
        </div>

      </div>
    </div>
  );
};

export default Lecturas;