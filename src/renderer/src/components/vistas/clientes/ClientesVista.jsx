import React, { useState, useEffect, useMemo } from "react";
import { HiUserCircle, HiUsers, HiUserAdd, HiTrendingUp } from "react-icons/hi";
import { TabClientes } from "./TabClientes";
import { TabMetricas } from "./TabMetricas";
import { Tabs, Tab, Chip, Skeleton } from "@nextui-org/react";
import { MetricasLecturaIcon } from "../../../IconsApp/IconsResibos";
import { useClientes } from "../../../context/ClientesContext";

const Clientes = () => {
  const { clientes, loading, initialLoading } = useClientes();

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

    if (clientes && clientes.length > 0) {
      const hoy = new Date();
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

      const nuevosEsteMes = clientes.filter(cliente => {
        if (cliente.fechaRegistro) {
          const fechaRegistro = new Date(cliente.fechaRegistro);
          return fechaRegistro >= inicioMes;
        }
        return false;
      }).length;

      const ciudadesUnicas = [...new Set(clientes.map(cliente => cliente.ciudad))].length;

      return {
        total: clientes.length,
        activos: clientes.filter(cliente => cliente.estado === "Activo" || !cliente.estado).length,
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
  }, [clientes, initialLoading]);

  return (
    // CONTENEDOR PRINCIPAL: padding exterior fluido para dejar el espacio de separación sutil
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20">

      {/* CONTENEDOR DE LA VISTA: 'w-full' para que ocupe todo el espacio (sin max-w) */}
      <div className="w-full min-h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-6 sm:p-8 lg:p-10 flex flex-col gap-8">

        {/* ── 1. HEADER Y ESTADÍSTICAS ── */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          
          {/* Título de la vista */}
          <div className="flex gap-4 items-center shrink-0">
            <div className="p-3.5 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
              <HiUsers className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-none">
                Gestión de Clientes
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 max-w-lg leading-relaxed">
                Administra la información, analiza el comportamiento y gestiona el estado de todos los clientes.
              </p>
            </div>
          </div>

          {/* Tarjetas de Estadísticas (KPIs) - Se alinean a la derecha en pantallas grandes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full xl:w-auto shrink-0">
            
            {/* KPI: Total Clientes */}
            <div className="flex flex-col justify-center p-4 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors">
              <div className="flex items-center gap-1.5 mb-2 text-slate-400 dark:text-zinc-500">
                <HiUsers className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Total Clientes</span>
              </div>
              {initialLoading ? (
                <Skeleton className="h-8 w-16 rounded-lg bg-slate-200 dark:bg-zinc-800" />
              ) : (
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400 leading-none">
                  {estadisticas.total.toLocaleString('es-MX')}
                </p>
              )}
            </div>

            {/* KPI: Activos */}
            <div className="flex flex-col justify-center p-4 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors">
              <div className="flex items-center gap-1.5 mb-2 text-slate-400 dark:text-zinc-500">
                <HiUserCircle className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Activos</span>
              </div>
              {initialLoading ? (
                <Skeleton className="h-8 w-16 rounded-lg bg-slate-200 dark:bg-zinc-800" />
              ) : (
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                  {estadisticas.activos.toLocaleString('es-MX')}
                </p>
              )}
            </div>

            {/* KPI: Nuevos (Mes) */}
            <div className="flex flex-col justify-center p-4 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors">
              <div className="flex items-center gap-1.5 mb-2 text-slate-400 dark:text-zinc-500">
                <HiUserAdd className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Nuevos (Mes)</span>
              </div>
              {initialLoading ? (
                <Skeleton className="h-8 w-12 rounded-lg bg-slate-200 dark:bg-zinc-800" />
              ) : (
                <p className="text-2xl font-black text-purple-600 dark:text-purple-400 leading-none">
                  {estadisticas.nuevosEsteMes}
                </p>
              )}
            </div>

            {/* KPI: Ciudades */}
            <div className="flex flex-col justify-center p-4 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors">
              <div className="flex items-center gap-1.5 mb-2 text-slate-400 dark:text-zinc-500">
                <HiTrendingUp className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Ciudades</span>
              </div>
              {initialLoading ? (
                <Skeleton className="h-8 w-12 rounded-lg bg-slate-200 dark:bg-zinc-800" />
              ) : (
                <p className="text-2xl font-black text-orange-500 dark:text-orange-400 leading-none">
                  {estadisticas.ciudades}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── 2. NAVEGACIÓN (TABS) Y CONTENIDO ── */}
        <div className="flex flex-col w-full flex-1 mt-4">
          <Tabs
            aria-label="Opciones de Clientes"
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
            {/* TAB 1: LISTA DE CLIENTES */}
            <Tab
              key="Clientes"
              title={
                <div className="flex items-center gap-2.5">
                  <HiUserCircle className="w-5 h-5" />
                  <span>Lista de Clientes</span>
                  <Chip size="sm" variant="flat" className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold h-5 text-[10px] px-1 ml-1">
                    {estadisticas.total}
                  </Chip>
                </div>
              }
            >
              <div className="animate-in fade-in duration-500">
                <TabClientes />
              </div>
            </Tab>

            {/* TAB 2: MÉTRICAS Y ANÁLISIS */}
            <Tab
              key="Metricas"
              title={
                <div className="flex items-center gap-2.5">
                  <MetricasLecturaIcon className="w-5 h-5" />
                  <span>Métricas y Análisis</span>
                  <Chip size="sm" variant="flat" className="bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-[9px] h-5 px-1 ml-1">
                    Gráficos
                  </Chip>
                </div>
              }
            >
              <div className="animate-in fade-in duration-500">
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