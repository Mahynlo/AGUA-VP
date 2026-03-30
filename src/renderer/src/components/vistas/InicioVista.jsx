import React from "react";
import { Card, CardBody, Chip, Progress, Skeleton } from "@nextui-org/react";
import PieChart from "../charts/piechart";
import LineChart from "../charts/lineChart";
import CalendarComponent from "../calendario/Calendario";
import { ConsumoIcon, ClientesHomeIcon, MedidioresIcon } from "../../IconsApp/IconsHome";
import { HiCurrencyDollar, HiTrendingUp, HiTrendingDown, HiUsers, HiChartBar, HiChartPie, HiLocationMarker } from "react-icons/hi";
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
            <div className="mt-16 h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20">
                <div className="w-full min-h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-6 sm:p-8 lg:p-10 flex flex-col gap-8">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-2xl" />
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
                    {/* Skeleton del calendario */}
                    <Skeleton className="rounded-2xl h-[600px] w-full mt-4" />
                </div>
            </div>
        );
    }

    return (
        // CONTENEDOR PRINCIPAL: Padding exterior fluido y fondo estandarizado
        <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20">

            {/* CONTENEDOR DE LA VISTA: 'w-full' para ocupar todo el espacio disponible */}
            <div className="w-full min-h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-4 sm:p-6 lg:p-8 flex flex-col gap-6 lg:gap-8">

                {/* ── 1. HEADER DEL DASHBOARD ── */}
                <div className="flex flex-col gap-1.5 px-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                            <HiChartPie className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-none">
                            Panel General
                        </h1>
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 ml-14">
                        Resumen operativo y financiero · <span className="font-bold text-slate-700 dark:text-zinc-300">{dashboardData?.meta?.mes_actual || 'Mes Actual'}</span>
                    </p>
                </div>

                {/* ── 2. KPIs (Tarjetas de Métricas) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">

                    {/* KPI 1: Consumo */}
                    <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow rounded-2xl group overflow-hidden">
                        <CardBody className="p-5 flex flex-col justify-between gap-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 text-rose-500 dark:text-rose-400">
                                    <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg group-hover:scale-110 transition-transform">
                                        <ConsumoIcon className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Consumo Total</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-800 dark:text-zinc-100 tracking-tight flex items-baseline gap-1">
                                    {consumo.actual.toLocaleString('es-MX')} <span className="text-sm font-bold text-slate-400">m³</span>
                                </h3>
                            </div>
                            <div className="flex items-center justify-between mt-auto">
                                <Chip
                                    size="sm"
                                    color={consumo.variacion >= 0 ? "danger" : "success"}
                                    variant="flat"
                                    className="font-bold text-[10px] uppercase tracking-wider px-1 h-6"
                                    startContent={consumo.variacion >= 0 ? <HiTrendingUp className="w-3 h-3" /> : <HiTrendingDown className="w-3 h-3" />}
                                >
                                    {consumo.variacion > 0 ? '+' : ''}{consumo.variacion}% vs mes ant.
                                </Chip>
                            </div>
                        </CardBody>
                    </Card>

                    {/* KPI 2: Clientes */}
                    <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow rounded-2xl group overflow-hidden">
                        <CardBody className="p-5 flex flex-col justify-between gap-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 text-blue-500 dark:text-blue-400">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg group-hover:scale-110 transition-transform">
                                        <ClientesHomeIcon className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Clientes Activos</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-800 dark:text-zinc-100 tracking-tight flex items-baseline gap-1">
                                    {clientes.total.toLocaleString('es-MX')}
                                </h3>
                            </div>
                            <div className="flex items-center justify-between mt-auto">
                                <Chip
                                    size="sm"
                                    color="primary"
                                    variant="flat"
                                    className="font-bold text-[10px] uppercase tracking-wider px-1 h-6"
                                    startContent={<HiTrendingUp className="w-3 h-3" />}
                                >
                                    +{clientes.nuevos} nuevos
                                </Chip>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Este mes</span>
                            </div>
                        </CardBody>
                    </Card>

                    {/* KPI 3: Medidores */}
                    <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow rounded-2xl group overflow-hidden">
                        <CardBody className="p-5 flex flex-col justify-between gap-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400">
                                    <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg group-hover:scale-110 transition-transform">
                                        <MedidioresIcon className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Medidores Inst.</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-800 dark:text-zinc-100 tracking-tight flex items-baseline gap-1">
                                    {medidores.total.toLocaleString('es-MX')}
                                </h3>
                            </div>
                            <div className="flex flex-col gap-1.5 mt-auto">
                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                                    <span>Nuevos: +{medidores.nuevos_este_mes}</span>
                                    <span className="text-amber-500">{medidores.crecimiento_nuevos || 0}%</span>
                                </div>
                                <Progress
                                    value={medidores.crecimiento_nuevos || 0}
                                    color="warning"
                                    size="sm"
                                    classNames={{ track: "bg-slate-100 dark:bg-zinc-800" }}
                                />
                            </div>
                        </CardBody>
                    </Card>

                    {/* KPI 4: Recaudo */}
                    <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow rounded-2xl group overflow-hidden">
                        <CardBody className="p-5 flex flex-col justify-between gap-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400">
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg group-hover:scale-110 transition-transform">
                                        <HiCurrencyDollar className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Recaudación</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-800 dark:text-zinc-100 tracking-tight flex items-baseline gap-1">
                                    <span className="text-emerald-500">$</span>{(recaudo.actual || 0).toLocaleString('es-MX')}
                                </h3>
                            </div>
                            <div className="flex items-center justify-between mt-auto">
                                <Chip
                                    size="sm"
                                    color={recaudo.variacion >= 0 ? "success" : "danger"}
                                    variant="flat"
                                    className="font-bold text-[10px] uppercase tracking-wider px-1 h-6"
                                    startContent={recaudo.variacion >= 0 ? <HiTrendingUp className="w-3 h-3" /> : <HiTrendingDown className="w-3 h-3" />}
                                >
                                    {recaudo.variacion > 0 ? '+' : ''}{recaudo.variacion}% vs mes ant.
                                </Chip>
                            </div>
                        </CardBody>
                    </Card>

                </div>

                {/* ── 3. CALENDARIO (Movido justo debajo de los KPIs) ── */}
                <div className="w-full  border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 rounded-[2rem] shadow-sm overflow-hidden p-2 sm:p-4">
                    <CalendarComponent />
                   
                </div>

                {/* ── 4. GRÁFICOS (Ahora al final) ── */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 flex-1">
                    
                    {/* Gráfico de Líneas (Principal) */}
                    <div className="lg:col-span-3 flex flex-col border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-[2rem] shadow-sm overflow-hidden h-[400px] lg:h-auto min-h-[400px]">
                        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-zinc-800/80 flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-lg text-slate-500 dark:text-zinc-400">
                                <HiChartBar className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-widest">Tendencias de Consumo</h3>
                                <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">Análisis histórico mensual</p>
                            </div>
                        </div>
                        <div className="flex-1 p-4 flex items-center justify-center">
                            <LineChart data={graficos.consumo_mensual} />
                        </div>
                    </div>

                    {/* Gráfico Circular (Secundario) */}
                    <div className="lg:col-span-1 flex flex-col border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-[2rem] shadow-sm overflow-hidden h-[400px] lg:h-auto min-h-[400px]">
                        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-zinc-800/80 flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-lg text-slate-500 dark:text-zinc-400">
                                <HiLocationMarker className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-widest">Consumo por Ruta</h3>
                                <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">Distribución actual</p>
                            </div>
                        </div>
                        <div className="flex-1 p-4 flex items-center justify-center">
                            <PieChart data={graficos.estado_clientes} unit="m³" />
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};
export default InicioVista;