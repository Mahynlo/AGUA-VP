import React, { useState, useEffect, useMemo } from "react";
import { HiUserCircle, HiUsers, HiUserAdd, HiTrendingUp, HiMap } from "react-icons/hi";
import { TabClientes } from "./TabClientes";
import { TabMetricas } from "./TabMetricas";
import { Tabs, Tab, Chip, Skeleton } from "@nextui-org/react";
import { MetricasLecturaIcon } from "../../../IconsApp/IconsResibos";
import { useClientes } from "../../../context/ClientesContext";

const Clientes = () => {
  const { clientes, allClientes, pagination, estadisticasServidor, initialLoading } = useClientes();

  // Estado para la pestaña activa, recuperado de localStorage
  const [selectedTab, setSelectedTab] = useState(() => {
    return localStorage.getItem("clientes_activeTab") || "Clientes";
  });

  const handleTabChange = (key) => {
    setSelectedTab(key);
    localStorage.setItem("clientes_activeTab", key);
  };

  // Calcular estadísticas reales basadas en los datos
  const estadisticas = useMemo(() => {
    if (initialLoading) {
      return {
        total: 0,
        activos: 0,
        nuevosEsteMes: 0,
        ciudades: 0
      };
    }

    const resumen = estadisticasServidor?.resumen || {};
    const totalClientes = pagination?.total ?? resumen.total_clientes ?? allClientes?.length ?? clientes?.length ?? 0;
    const clientesBase = (allClientes && allClientes.length > 0) ? allClientes : (clientes || []);

    if (clientesBase.length > 0 || totalClientes > 0) {
      const hoy = new Date();
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

      const nuevosEsteMes = resumen.clientes_ultimo_mes ?? clientesBase.filter(cliente => {
        if (cliente.fechaRegistro) {
          const fechaRegistro = new Date(cliente.fechaRegistro);
          return fechaRegistro >= inicioMes;
        }
        return false;
      }).length;

      const ciudadesUnicas = resumen?.distribucion?.por_ciudad?.length
        ? resumen.distribucion.por_ciudad.length
        : [...new Set(clientesBase.map(cliente => cliente.ciudad).filter(Boolean))].length;

      return {
        total: totalClientes,
        activos: resumen.clientes_activos ?? clientesBase.filter(cliente => cliente.estado === "Activo" || !cliente.estado).length,
        nuevosEsteMes,
        ciudades: ciudadesUnicas
      };
    }

    return {
      total: 0,
      activos: 0,
      nuevosEsteMes: 0,
      ciudades: 0
    };
  }, [allClientes, clientes, estadisticasServidor, pagination, initialLoading]);

  // ESTADO DE CARGA INICIAL
  if (initialLoading && !clientes?.length) {
    return (
      <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20">
        <div className="w-full min-h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-6 sm:p-8 lg:p-10 flex flex-col gap-8">
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

      {/* CONTENEDOR DE LA VISTA: 'w-full min-h-full' para ocupar todo el espacio */}
      <div className="w-full min-h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-6 sm:p-8 lg:p-10 flex flex-col gap-10 animate-in fade-in duration-500">

        {/* ── 1. HEADER Y ESTADÍSTICAS ── */}
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-8">
          
          {/* Título de la vista */}
          <div className="flex gap-4 items-start shrink-0">
            {/* Regla de Tintes (Azul Corporativo) */}
            <div className="p-3.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
              <HiUsers className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1 pt-0.5">
              <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
                Gestión de Clientes
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 max-w-lg mt-1 leading-relaxed">
                Administra la información, analiza el comportamiento y gestiona el estado de todos los clientes.
              </p>
            </div>
          </div>

          {/* Tarjetas de Estadísticas (KPIs) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full xl:w-auto shrink-0">
            
            {/* KPI: Total Clientes */}
            <div className="flex flex-col justify-center p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1 gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Total</span>
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400"><HiUsers className="w-4 h-4" /></div>
              </div>
              {initialLoading ? (
                <Skeleton className="h-8 w-16 rounded-lg bg-slate-200 dark:bg-zinc-800" />
              ) : (
                <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">
                  {estadisticas.total.toLocaleString('es-MX')}
                </p>
              )}
            </div>

            {/* KPI: Activos */}
            <div className="flex flex-col justify-center p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1 gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Activos</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><HiUserCircle className="w-4 h-4" /></div>
              </div>
              {initialLoading ? (
                <Skeleton className="h-8 w-16 rounded-lg bg-slate-200 dark:bg-zinc-800" />
              ) : (
                <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">
                  {estadisticas.activos.toLocaleString('es-MX')}
                </p>
              )}
            </div>

            {/* KPI: Nuevos (Mes) */}
            <div className="flex flex-col justify-center p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1 gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Nuevos</span>
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400"><HiUserAdd className="w-4 h-4" /></div>
              </div>
              {initialLoading ? (
                <Skeleton className="h-8 w-12 rounded-lg bg-slate-200 dark:bg-zinc-800" />
              ) : (
                <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">
                  {estadisticas.nuevosEsteMes.toLocaleString('es-MX')}
                </p>
              )}
            </div>

            {/* KPI: Ciudades */}
            <div className="flex flex-col justify-center p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1 gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Ciudades</span>
                <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400"><HiMap className="w-4 h-4" /></div>
              </div>
              {initialLoading ? (
                <Skeleton className="h-8 w-12 rounded-lg bg-slate-200 dark:bg-zinc-800" />
              ) : (
                <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">
                  {estadisticas.ciudades.toLocaleString('es-MX')}
                </p>
              )}
            </div>

          </div>
        </div>

        {/* ── 2. NAVEGACIÓN (TABS) Y CONTENIDO ── */}
        <div className="flex flex-col w-full flex-1 mt-2">
          <Tabs
            aria-label="Opciones de Clientes"
            selectedKey={selectedTab}
            onSelectionChange={handleTabChange}
            variant="underlined"
            classNames={{
              base: "w-full border-b border-slate-200 dark:border-zinc-800 mb-6",
              tabList: "gap-6 w-full relative rounded-none p-0",
              cursor: "w-full bg-blue-600 dark:bg-blue-500 h-[2px]",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-slate-800 dark:group-data-[selected=true]:text-zinc-100 group-data-[selected=true]:font-bold text-slate-500 dark:text-zinc-400 font-medium text-sm transition-colors",
            }}
          >
            {/* TAB 1: LISTA DE CLIENTES */}
            <Tab
              key="Clientes"
              title={
                <div className="flex items-center gap-2.5">
                  <HiUserCircle className="text-lg" />
                  <span>Directorio</span>
                  <Chip size="sm" variant="flat" className="bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-bold h-5 text-[10px] px-1 ml-1 rounded-md">
                    {estadisticas.total}
                  </Chip>
                </div>
              }
            >
              <div className="pt-2 animate-in fade-in duration-500 h-full flex flex-col">
                <TabClientes />
              </div>
            </Tab>

            {/* TAB 2: MÉTRICAS Y ANÁLISIS */}
            <Tab
              key="Metricas"
              title={
                <div className="flex items-center gap-2.5">
                  <MetricasLecturaIcon className="text-lg" />
                  <span>Análisis</span>
                  <Chip size="sm" variant="flat" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest text-[9px] h-5 px-1 ml-1 rounded-md">
                    Gráficos
                  </Chip>
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

export default Clientes;