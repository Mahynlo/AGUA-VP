import React from "react";
import { Chip, Progress, Skeleton } from "@nextui-org/react";
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
  HiLocationMarker 
} from "react-icons/hi";
import { useDashboard } from "../../context/DashboardContext";

const InicioVista = () => {
    const { dashboardData, loading } = useDashboard();

    // Extraer datos o usar valores por defecto/seguros
    const stats = dashboardData?.tarjetas || {};
    const consumo = stats.consumo || { actual: 0, variacion: 0 };
    const clientes = stats.clientes || { total: 0, nuevos: 0, crecimiento: 0 };
    const medidores = stats.medidores || { total: 0, nuevos_este_mes: 0, crecimiento_nuevos: 0 };
    const recaudo = stats.pagos || { actual: 0, variacion: 0 }; 

    // Datos para gráficos
    const graficosAPI = dashboardData?.graficos || {};
    const graficos = {
        consumo_mensual: graficosAPI.linea_historico?.map(h => ({ mes: h.mes, total: h.consumo })) || [],
        estado_clientes: graficosAPI.pie_distribucion?.map(p => ({ estado: p.nombre, cantidad: p.valor })) || []
    };

    if (loading && !dashboardData) {
        return (
            <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20">
                <div className="w-full min-h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-6 sm:p-8 lg:p-10 flex flex-col gap-8 mb-12">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-14 h-14 rounded-2xl" />
                        <div className="flex flex-col gap-2">
                            <Skeleton className="w-64 h-6 rounded-lg" />
                            <Skeleton className="w-48 h-4 rounded-lg" />
                        </div>
                    </div>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="rounded-2xl h-40" />
                        ))}
                    </div>
                    <Skeleton className="rounded-2xl h-[600px] w-full mt-4" />
                </div>
            </div>
        );
    }

    return (
        // CONTENEDOR PRINCIPAL: Padding exterior fluido y fondo gris sutil
        <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20 scroll-smooth">

            {/* CONTENEDOR DE LA VISTA: 'w-full min-h-full' para ocupar todo el espacio */}
            <div className="w-full min-h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-6 sm:p-8 lg:p-10 flex flex-col gap-10 animate-in fade-in duration-500">

                {/* ── 1. HEADER DEL DASHBOARD ── */}
                <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-8">
                    <div className="flex gap-4 items-start shrink-0">
                        {/* Regla de Tintes (Índigo para el Panel General) */}
                        <div className="p-3.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0 flex items-center justify-center">
                            <HiChartPie className="w-8 h-8" />
                        </div>
                        <div className="flex flex-col gap-1 pt-0.5">
                            {/* Token 3: Textos Principales */}
                            <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
                                Panel General
                            </h1>
                            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                                Resumen operativo y financiero · <span className="font-bold text-indigo-600 dark:text-indigo-400">{dashboardData?.meta?.mes_actual || 'Mes Actual'}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── 2. KPIs (Tarjetas de Métricas) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">

                    {/* KPI 1: Consumo (Rosa/Rojo) */}
                    <div className="flex flex-col justify-between gap-4 p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Consumo Total</span>
                            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                <ConsumoIcon className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <h3 className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
                                {consumo.actual.toLocaleString('es-MX')}
                            </h3>
                            <span className="text-sm font-bold text-slate-400 dark:text-zinc-500">m³</span>
                        </div>
                        <div className="flex items-center mt-2">
                            <Chip
                                size="sm"
                                color={consumo.variacion >= 0 ? "danger" : "success"}
                                variant="flat"
                                className="font-bold text-[10px] uppercase tracking-wider px-1 h-6"
                                startContent={consumo.variacion >= 0 ? <HiTrendingUp className="w-3 h-3" /> : <HiTrendingDown className="w-3 h-3" />}
                            >
                                {consumo.variacion > 0 ? '+' : ''}{consumo.variacion}% vs ant.
                            </Chip>
                        </div>
                    </div>

                    {/* KPI 2: Clientes (Azul) */}
                    <div className="flex flex-col justify-between gap-4 p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Clientes Activos</span>
                            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <ClientesHomeIcon className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
                                {clientes.total.toLocaleString('es-MX')}
                            </h3>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <Chip
                                size="sm"
                                color="primary"
                                variant="flat"
                                className="font-bold text-[10px] uppercase tracking-wider px-1 h-6 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                startContent={<HiTrendingUp className="w-3 h-3" />}
                            >
                                +{clientes.nuevos} nuevos
                            </Chip>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Este mes</span>
                        </div>
                    </div>

                    {/* KPI 3: Medidores (Ámbar) */}
                    <div className="flex flex-col justify-between gap-4 p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Medidores Inst.</span>
                            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <MedidioresIcon className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
                                {medidores.total.toLocaleString('es-MX')}
                            </h3>
                        </div>
                        <div className="flex flex-col gap-2 mt-2">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                                <span>Nuevos: +{medidores.nuevos_este_mes}</span>
                                <span className="text-amber-500 dark:text-amber-400">{medidores.crecimiento_nuevos || 0}%</span>
                            </div>
                            <Progress
                                value={medidores.crecimiento_nuevos || 0}
                                color="warning"
                                size="sm"
                                classNames={{ track: "bg-slate-200 dark:bg-zinc-800", indicator: "bg-amber-500" }}
                            />
                        </div>
                    </div>

                    {/* KPI 4: Recaudación (Esmeralda) */}
                    <div className="flex flex-col justify-between gap-4 p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Recaudación</span>
                            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <HiCurrencyDollar className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold text-emerald-500 dark:text-emerald-400">$</span>
                            <h3 className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
                                {(recaudo.actual || 0).toLocaleString('es-MX')}
                            </h3>
                        </div>
                        <div className="flex items-center mt-2">
                            <Chip
                                size="sm"
                                color={recaudo.variacion >= 0 ? "success" : "danger"}
                                variant="flat"
                                className="font-bold text-[10px] uppercase tracking-wider px-1 h-6"
                                startContent={recaudo.variacion >= 0 ? <HiTrendingUp className="w-3 h-3" /> : <HiTrendingDown className="w-3 h-3" />}
                            >
                                {recaudo.variacion > 0 ? '+' : ''}{recaudo.variacion}% vs ant.
                            </Chip>
                        </div>
                    </div>

                </div>

                {/* ── 3. CALENDARIO ── */}
                <div className="w-full bg-slate-50 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden p-4 sm:p-6">
                    <CalendarComponent />
                </div>

                {/* ── 4. GRÁFICOS ── */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    
                    {/* Gráfico de Líneas (Principal) */}
                    <div className="lg:col-span-3 flex flex-col bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
                        <div className="p-6 border-b border-slate-100 dark:border-zinc-800/80 flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-lg text-slate-500 dark:text-zinc-400">
                                <HiChartBar className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-0.5">Análisis histórico mensual</h3>
                                <p className="text-lg font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">Tendencias de Consumo</p>
                            </div>
                        </div>
                        <div className="flex-1 p-6 flex items-center justify-center">
                            <LineChart data={graficos.consumo_mensual} />
                        </div>
                    </div>

                    {/* Gráfico Circular (Secundario) */}
                    <div className="lg:col-span-1 flex flex-col bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
                        <div className="p-6 border-b border-slate-100 dark:border-zinc-800/80 flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-lg text-slate-500 dark:text-zinc-400">
                                <HiLocationMarker className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-0.5">Distribución actual</h3>
                                <p className="text-lg font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">Consumo por Ruta</p>
                            </div>
                        </div>
                        <div className="flex-1 p-6 flex items-center justify-center">
                            <PieChart data={graficos.estado_clientes} unit="m³" />
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default InicioVista;