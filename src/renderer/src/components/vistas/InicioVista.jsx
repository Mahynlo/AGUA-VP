import React from "react";
import { Skeleton, Button, Chip } from "@heroui/react";
import PieChart from "../charts/piechart";
import LineChart from "../charts/lineChart";
import CalendarComponent from "../calendario/Calendario";
import { ConsumoIcon, ClientesHomeIcon, MedidioresIcon } from "../../IconsApp/IconsHome";
import { 
  HiCurrencyDollar, 
  HiTrendingUp, 
  HiTrendingDown, 
  HiChartBar, 
  HiChartPie, 
  HiLocationMarker,
  HiRefresh
} from "react-icons/hi";
import { useDashboard } from "../../context/DashboardContext";

const InicioVista = () => {
  const { dashboardData, loading, refetch } = useDashboard();

  // Extraer datos o usar valores por defecto/seguros
  const stats = dashboardData?.tarjetas || {};
  const consumo = stats.consumo || { actual: 0, variacion: 0 };
  const clientes = stats.clientes || { total: 0, nuevos: 0, crecimiento: 0 };
  const medidores = stats.medidores || { total: 0, nuevos_este_mes: 0, crecimiento_nuevos: 0 };
  const recaudo = stats.pagos || { actual: 0, variacion: 0 }; 

  // Datos para gráficos
  const graficosAPI = dashboardData?.graficos || {};
  const graficos = {
    consumo_mensual: 
      graficosAPI.linea_historico?.map(h => ({ mes: h.mes || h.fecha, total: h.consumo || h.total || 0 })) ||
      graficosAPI.consumo_mensual ||
      (Array.isArray(graficosAPI.historicoConsumo) ? graficosAPI.historicoConsumo : []),
    estado_clientes: 
      graficosAPI.pie_distribucion?.map(p => ({ estado: p.nombre || p.ruta || p.estado, cantidad: p.valor || p.cantidad || p.consumo || 0 })) ||
      graficosAPI.estado_clientes ||
      graficosAPI.distribucionPueblos?.map(p => ({ estado: p.nombre || p.ruta || p.estado, cantidad: p.valor || p.cantidad || p.consumo || 0 })) ||
      (Array.isArray(graficosAPI.pastel) ? graficosAPI.pastel : [])
  };

  // Validación de estado de carga inicial
  if (loading && !dashboardData) {
    return (
      <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20">
        <div className="w-full min-h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-6 sm:p-8 lg:p-10 space-y-8 animate-pulse">
          {/* Skeleton Header */}
          <div className="flex justify-between items-center pb-2">
            <div className="space-y-3">
              <Skeleton className="h-8 w-64 rounded-xl" />
              <Skeleton className="h-4 w-96 rounded-lg" />
            </div>
            <Skeleton className="h-11 w-32 rounded-xl" />
          </div>

          {/* Skeleton KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-4">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-8 w-32 rounded-xl" />
                <Skeleton className="h-6 w-20 rounded-md" />
              </div>
            ))}
          </div>

          {/* Skeleton Calendario y Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-4">
              <Skeleton className="h-6 w-32 rounded-md" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
            <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-4">
              <Skeleton className="h-6 w-48 rounded-md" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    // CONTENEDOR PRINCIPAL: Padding exterior fluido y fondo gris sutil estandarizado
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20 scroll-smooth">
      
      {/* CONTENEDOR DE LA VISTA: 'w-full min-h-full' para ocupar todo el espacio disponible */}
      <div className="w-full min-h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-6 sm:p-8 lg:p-10 flex flex-col gap-8">

        {/* ── 1. HEADER Y ACCIONES ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
          <div className="flex gap-4 items-start">
            {/* Regla de Tintes (Indigo Corporativo para Dashboard) */}
            <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0 flex items-center justify-center">
              <HiChartBar className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1 pt-0.5">
              {/* Token 3: Textos Principales */}
              <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
                Panel General
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 max-w-lg mt-1 leading-relaxed">
                Resumen ejecutivo del consumo, recaudación y estado operativo del sistema de agua.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onPress={() => refetch && refetch()}
              isLoading={loading}
              className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 font-bold rounded-xl h-11 px-5 shadow-sm"
            >
              {!loading && <HiRefresh className="text-lg" />}
              Recargar
            </Button>
          </div>
        </div>

        {/* ── 2. KPIs (Tarjetas de Métricas) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">

          {/* KPI 1: Consumo (Cian / Azul) */}
          <div className="flex flex-col justify-between gap-4 p-5 bg-slate-50/80 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Consumo Total</span>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <ConsumoIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 font-mono leading-none">
                {consumo.actual.toLocaleString('es-MX')}
              </h3>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">m³</span>
            </div>
            <div className="flex items-center">
              <Chip
                size="sm"
                color={consumo.variacion >= 0 ? "danger" : "success"}
                variant="ghost"
                className="font-bold text-[10px] uppercase tracking-wider px-1.5 h-6"
              >
                {consumo.variacion >= 0 ? <HiTrendingUp className="w-3 h-3" /> : <HiTrendingDown className="w-3 h-3" />}
                {consumo.variacion > 0 ? '+' : ''}{consumo.variacion}% vs ant.
              </Chip>
            </div>
          </div>

          {/* KPI 2: Clientes (Azul) */}
          <div className="flex flex-col justify-between gap-4 p-5 bg-slate-50/80 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Clientes Activos</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <ClientesHomeIcon className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 font-mono leading-none">
                {clientes.total.toLocaleString('es-MX')}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Chip
                size="sm"
                variant="ghost"
                className="font-bold text-[10px] uppercase tracking-wider px-1.5 h-6 bg-blue-500/10 text-blue-600 dark:text-blue-400"
              >
                <HiTrendingUp className="w-3 h-3" />
                +{clientes.nuevos} nuevos
              </Chip>
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Este mes</span>
            </div>
          </div>

          {/* KPI 3: Medidores (Sky / Ámbar) */}
          <div className="flex flex-col justify-between gap-4 p-5 bg-slate-50/80 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Medidores Inst.</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <MedidioresIcon className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 font-mono leading-none">
                {medidores.total.toLocaleString('es-MX')}
              </h3>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                <span>Nuevos: +{medidores.nuevos_este_mes}</span>
                <span className="text-amber-600 dark:text-amber-400 font-mono">{medidores.crecimiento_nuevos || 0}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200/80 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(Math.max(medidores.crecimiento_nuevos || 0, 0), 100)}%` }} 
                />
              </div>
            </div>
          </div>

          {/* KPI 4: Recaudación (Esmeralda) */}
          <div className="flex flex-col justify-between gap-4 p-5 bg-slate-50/80 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Recaudación</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <HiCurrencyDollar className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-emerald-500 dark:text-emerald-400">$</span>
              <h3 className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 font-mono leading-none">
                {(recaudo.actual || 0).toLocaleString('es-MX')}
              </h3>
            </div>
            <div className="flex items-center">
              <Chip
                size="sm"
                color={recaudo.variacion >= 0 ? "success" : "danger"}
                variant="ghost"
                className="font-bold text-[10px] uppercase tracking-wider px-1.5 h-6"
              >
                {recaudo.variacion >= 0 ? <HiTrendingUp className="w-3 h-3" /> : <HiTrendingDown className="w-3 h-3" />}
                {recaudo.variacion > 0 ? '+' : ''}{recaudo.variacion}% vs ant.
              </Chip>
            </div>
          </div>

        </div>

        {/* ── 3. CALENDARIO ── */}
        <div className="w-full bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs overflow-hidden p-4 sm:p-6">
          <CalendarComponent />
        </div>

        {/* ── 4. GRÁFICOS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Gráfico de Líneas (Principal) */}
          <div className="lg:col-span-3 flex flex-col bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
            <div className="p-6 border-b border-slate-100 dark:border-zinc-800/80 flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <HiChartBar className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-0.5">Análisis histórico mensual</h3>
                <p className="text-lg font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">Tendencias de Consumo</p>
              </div>
            </div>
            <div className="flex-1 p-4 sm:p-6 w-full flex items-center justify-center">
              <LineChart data={graficos.consumo_mensual} />
            </div>
          </div>

          {/* Gráfico Circular (Secundario) */}
          <div className="lg:col-span-1 flex flex-col bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
            <div className="p-6 border-b border-slate-100 dark:border-zinc-800/80 flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                <HiLocationMarker className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-0.5">Distribución actual</h3>
                <p className="text-lg font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">Consumo por Ruta</p>
              </div>
            </div>
            <div className="flex-1 p-4 sm:p-6 w-full flex items-center justify-center">
              <PieChart data={graficos.estado_clientes} unit="m³" />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default InicioVista;