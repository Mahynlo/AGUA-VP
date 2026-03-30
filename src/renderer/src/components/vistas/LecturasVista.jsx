import { useNavigate } from "react-router-dom";
import { Chip, Tabs, Tab, Skeleton } from "@nextui-org/react";
import { HiMap, HiDocumentText, HiChartBar, HiClock, HiCheckCircle } from "react-icons/hi";
import React, { useState, useMemo } from "react";

import TabRutas from "./lecturas/TabRutas";
import TabMetricas from "./lecturas/TabMetricas";
import { useRutas } from "../../context/RutasContext";

import { LecturasIcon } from "../../IconsApp/IconsResibos";

const Lecturas = () => {
  const navigate = useNavigate(); // Hook de navegación
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

  return (
    // CONTENEDOR PRINCIPAL: Padding exterior fluido
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20">

      {/* CONTENEDOR DE LA VISTA: 'w-full' para ocupar todo el espacio disponible */}
      <div className="w-full min-h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-6 sm:p-8 lg:p-10 flex flex-col gap-8">

        {/* ── 1. HEADER Y ESTADÍSTICAS ── */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          
          {/* Título de la vista */}
          <div className="flex gap-4 items-center shrink-0">
            {/* Mantengo la identidad rojiza pero en estilo Premium SaaS (Rose) */}
            <div className="p-3.5 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl shrink-0 flex items-center justify-center">
              <LecturasIcon className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-none">
                Sistema de Lecturas
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 max-w-lg leading-relaxed">
                Gestiona las rutas, registra lecturas de medidores y evalúa el rendimiento operativo.
              </p>
            </div>
          </div>

          {/* Tarjetas de Estadísticas (KPIs) - Se alinean a la derecha */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full xl:w-auto shrink-0">
            
            {/* KPI: Rutas Activas */}
            <div className="flex flex-col justify-center p-4 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors">
              <div className="flex items-center gap-1.5 mb-2 text-slate-400 dark:text-zinc-500">
                <HiMap className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Rutas Activas</span>
              </div>
              {initialLoading ? (
                <Skeleton className="h-8 w-16 rounded-lg bg-slate-200 dark:bg-zinc-800" />
              ) : (
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400 leading-none">
                  {estadisticas.rutasActivas.toLocaleString('es-MX')}
                </p>
              )}
            </div>

            {/* KPI: Lecturas Hoy */}
            <div className="flex flex-col justify-center p-4 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors">
              <div className="flex items-center gap-1.5 mb-2 text-slate-400 dark:text-zinc-500">
                <HiClock className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Lecturas Hoy</span>
              </div>
              {initialLoading ? (
                <Skeleton className="h-8 w-16 rounded-lg bg-slate-200 dark:bg-zinc-800" />
              ) : (
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                  {estadisticas.lecturasHoy.toLocaleString('es-MX')}
                </p>
              )}
            </div>

            {/* KPI: Completadas */}
            <div className="flex flex-col justify-center p-4 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors">
              <div className="flex items-center gap-1.5 mb-2 text-slate-400 dark:text-zinc-500">
                <HiCheckCircle className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Completadas</span>
              </div>
              {initialLoading ? (
                <Skeleton className="h-8 w-20 rounded-lg bg-slate-200 dark:bg-zinc-800" />
              ) : (
                <p className="text-2xl font-black text-purple-600 dark:text-purple-400 leading-none">
                  {estadisticas.lecturasCompletadas.toLocaleString('es-MX')}
                </p>
              )}
            </div>

            {/* KPI: Eficiencia */}
            <div className="flex flex-col justify-center p-4 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors">
              <div className="flex items-center gap-1.5 mb-2 text-slate-400 dark:text-zinc-500">
                <HiChartBar className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Eficiencia</span>
              </div>
              {initialLoading ? (
                <Skeleton className="h-8 w-16 rounded-lg bg-slate-200 dark:bg-zinc-800" />
              ) : (
                <p className="text-2xl font-black text-orange-500 dark:text-orange-400 leading-none flex items-baseline gap-1">
                  {estadisticas.eficiencia} <span className="text-sm font-bold text-orange-400/70">%</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── 2. NAVEGACIÓN (TABS) Y CONTENIDO ── */}
        <div className="flex flex-col w-full flex-1 mt-4">
          <Tabs
            aria-label="Opciones de Lecturas"
            selectedKey={selectedTab}
            onSelectionChange={handleTabChange}
            variant="underlined"
            classNames={{
              base: "w-full border-b border-slate-200 dark:border-zinc-800 mb-6",
              tabList: "gap-6 w-full relative rounded-none p-0",
              cursor: "w-full bg-blue-600 dark:bg-blue-500 h-0.5",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-blue-600 dark:group-data-[selected=true]:text-blue-400 group-data-[selected=true]:font-bold text-slate-500 dark:text-zinc-400 font-medium text-sm transition-colors",
            }}
          >
            {/* TAB 1: REGISTRO DE LECTURAS */}
            <Tab
              key="lecturas"
              title={
                <div className="flex items-center gap-2.5">
                  <HiDocumentText className="w-5 h-5" />
                  <span>Registro de Lecturas</span>
                  <Chip size="sm" variant="flat" className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold h-5 text-[10px] px-1 ml-1">
                    Rutas
                  </Chip>
                </div>
              }
            >
              <div className="animate-in fade-in duration-500 pt-2">
                <TabRutas />
              </div>
            </Tab>

            {/* TAB 2: MÉTRICAS Y REPORTES */}
            <Tab
              key="metricas"
              title={
                <div className="flex items-center gap-2.5">
                  <HiChartBar className="w-5 h-5" />
                  <span>Métricas y Reportes</span>
                </div>
              }
            >
              <div className="animate-in fade-in duration-500 pt-2">
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