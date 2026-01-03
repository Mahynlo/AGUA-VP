import React, { useState } from "react";
import { Card, CardBody, Chip, Progress, Skeleton } from "@nextui-org/react";
import PieChart from "../charts/piechart";
import LineChart from "../charts/lineChart";
import CalendarComponent from "../calendario/Calendario";
import { ConsumoIcon, ClientesHomeIcon, MedidioresIcon } from "../../IconsApp/IconsHome";
import { HiCurrencyDollar, HiTrendingUp, HiTrendingDown, HiUsers, HiChartBar, HiChartPie } from "react-icons/hi";
import { useDashboard } from "../../context/DashboardContext";
import { parseDate } from "@internationalized/date";

const InicioVista = () => {
    const { dashboardData, loading } = useDashboard();

    // Extraer datos o usar valores por defecto/seguros
    const stats = dashboardData?.tarjetas || {};
    const consumo = stats.consumo || { actual: 0, variacion: 0 };
    const clientes = stats.clientes || { total: 0, nuevos: 0, crecimiento: 0 };
    const medidores = stats.medidores || { total: 0, nuevos_este_mes: 0, crecimiento_nuevos: 0 };
    const recaudo = stats.pagos || { actual: 0, variacion: 0 }; // API devuelve 'pagos', lo mapeamos a 'recaudo'

    // Datos para gráficos
    const graficosAPI = dashboardData?.graficos || {};
    const graficos = {
        consumo_mensual: graficosAPI.linea_historico?.map(h => ({ mes: h.mes, total: h.consumo })) || [],
        estado_clientes: graficosAPI.pie_distribucion?.map(p => ({ estado: p.nombre, cantidad: p.valor })) || []
    };

    if (loading && !dashboardData) {
        return (
            <div className="mt-16 h-[calc(100vh-4rem)] p-6 sm:ml-24">
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="rounded-lg h-40" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-3 sm:p-4 md:p-6 sm:ml-24 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Header del Dashboard */}
            <div className="mb-4 sm:mb-6 md:mb-8">

                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <HiChartPie className="bg-blue-500 text-white rounded-full p-2 h-12 w-12" />
                    Panel de Infromacion General
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    Resumen general del sistema de agua Villa Pesqueira - {dashboardData?.meta?.mes_actual || 'Cargando...'}
                </p>
            </div>

            <div className="grid gap-3 sm:gap-4 md:gap-6 auto-rows-max h-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4">

                {/* Tarjeta de Consumo */}
                <Card className="col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1 border-none bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardBody className="p-3 sm:p-4 md:p-6">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <ConsumoIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                                    <p className="text-sm sm:text-base md:text-lg font-semibold text-red-700 dark:text-red-400 truncate">Consumo</p>
                                </div>
                                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-600 dark:text-red-400 mb-2 truncate">
                                    {consumo.actual} m³
                                </h3>
                                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                    <Chip
                                        size="sm"
                                        color={consumo.variacion >= 0 ? "danger" : "default"}
                                        variant="flat"
                                        startContent={consumo.variacion >= 0 ? <HiTrendingUp className="w-3 h-3" /> : <HiTrendingDown className="w-3 h-3" />}
                                    >
                                        {consumo.variacion > 0 ? '+' : ''}{consumo.variacion}%
                                    </Chip>
                                    <span className="text-xs text-gray-600 dark:text-gray-400 hidden sm:inline">vs mes anterior</span>
                                </div>
                                <Progress
                                    value={75}
                                    color="danger"
                                    size="sm"
                                    className="mt-auto"
                                    label="Capacidad utilizada"
                                    showValueLabel={false}
                                />
                            </div>
                            <div className="bg-gradient-to-br from-red-500 to-red-600 p-2 sm:p-3 rounded-xl sm:rounded-2xl text-white shadow-lg ml-2 flex-shrink-0">
                                <ConsumoIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Tarjeta de Clientes */}
                <Card className="col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1 border-none bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardBody className="p-3 sm:p-4 md:p-6">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <HiUsers className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                                    <p className="text-sm sm:text-base md:text-lg font-semibold text-green-700 dark:text-green-400 truncate">Clientes</p>
                                </div>
                                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400 mb-2 truncate">
                                    {clientes.total}
                                </h3>
                                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                    <Chip size="sm" color="success" variant="flat" startContent={<HiTrendingUp className="w-3 h-3" />}>
                                        +{clientes.nuevos} nuevos
                                    </Chip>
                                    <span className="text-xs text-gray-600 dark:text-gray-400 hidden sm:inline">este mes</span>
                                </div>
                                <Progress
                                    value={clientes.activos ? (clientes.activos / clientes.total) * 100 : 0}
                                    color="success"
                                    size="sm"
                                    className="mt-auto"
                                    label="Activos"
                                    showValueLabel={false}
                                />
                            </div>
                            <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 sm:p-3 rounded-xl sm:rounded-2xl text-white shadow-lg ml-2 flex-shrink-0">
                                <ClientesHomeIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Tarjeta de Medidores */}
                <Card className="col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1 border-none bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardBody className="p-3 sm:p-4 md:p-6">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <MedidioresIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                    <p className="text-sm sm:text-base md:text-lg font-semibold text-blue-700 dark:text-blue-400 truncate">Medidores</p>
                                </div>
                                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2 truncate">
                                    {medidores.total}
                                </h3>
                                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                    <Chip size="sm" color="primary" variant="flat" startContent={<HiChartBar className="w-3 h-3" />}>
                                        +{medidores.nuevos_este_mes} nuevos
                                    </Chip>
                                    <span className="text-xs text-gray-600 dark:text-gray-400 hidden sm:inline">este mes</span>
                                </div>
                                <Progress
                                    value={medidores.crecimiento_nuevos || 0}
                                    color="primary"
                                    maxValue={100}
                                    size="sm"
                                    className="mt-auto"
                                    label="Crecimiento"
                                    showValueLabel={false}
                                />
                            </div>
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 sm:p-3 rounded-xl sm:rounded-2xl text-white shadow-lg ml-2 flex-shrink-0">
                                <MedidioresIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Tarjeta de Pagos (Recaudo) */}
                <Card className="col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1 border-none bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardBody className="p-3 sm:p-4 md:p-6">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <HiCurrencyDollar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                                    <p className="text-sm sm:text-base md:text-lg font-semibold text-purple-700 dark:text-purple-400 truncate">Recaudo</p>
                                </div>
                                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2 truncate">
                                    ${(recaudo.actual || 0).toLocaleString()}
                                </h3>
                                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                    <Chip size="sm" color="secondary" variant="flat" startContent={<HiTrendingUp className="w-3 h-3" />}>
                                        {recaudo.variacion > 0 ? '+' : ''}{recaudo.variacion}%
                                    </Chip>
                                    <span className="text-xs text-gray-600 dark:text-gray-400 hidden sm:inline">vs mes anterior</span>
                                </div>
                                <Progress
                                    value={92}
                                    color="secondary"
                                    size="sm"
                                    className="mt-auto"
                                    label="Tasa de cobro"
                                    showValueLabel={false}
                                />
                            </div>
                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 sm:p-3 rounded-xl sm:rounded-2xl text-white shadow-lg ml-2 flex-shrink-0">
                                <HiCurrencyDollar className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Calendario */}
                <Card className="col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-4 xl:col-span-4 2xl:col-span-4 border-none bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg shadow-xl max max-h-[900px]">
                    <CardBody className="p-3 sm:p-4 md:p-6">

                        <div className="min-h-[300px] sm:min-h-[400px] md:min-h-[851px] overflow-hidden">
                            <CalendarComponent />
                        </div>
                    </CardBody>
                </Card>

                {/* Gráfico de Líneas */}
                <Card className="col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-3 xl:col-span-3 2xl:col-span-3 h-[300px] sm:h-[400px] md:h-[500px] lg:h-[500px] xl:h-[500px] 2xl:h-[500px] border-none bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg shadow-xl">
                    <CardBody className="p-3 sm:p-4 md:p-6 h-full">
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl flex-shrink-0">
                                <HiChartBar className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                                    Tendencias de Consumo
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                                    Análisis temporal del consumo de agua
                                </p>
                            </div>
                        </div>
                        <div className="flex-1 flex items-center justify-center overflow-hidden">
                            <LineChart data={graficos.consumo_mensual} />
                        </div>
                    </CardBody>
                </Card>

                {/* Gráfico Circular */}
                <Card className="col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-1 xl:col-span-1 2xl:col-span-1 h-[300px] sm:h-[400px] md:h-[500px] lg:h-[500px] xl:h-[500px] 2xl:h-[500px] border-none bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg shadow-xl">
                    <CardBody className="p-3 sm:p-4 md:p-6 h-full">
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl flex-shrink-0">
                                <HiChartBar className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-white truncate">
                                    Participación del Consumo
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                                    Por Ruta
                                </p>
                            </div>
                        </div>
                        <div className="flex-1 flex items-center justify-center overflow-hidden">
                            <PieChart data={graficos.estado_clientes} unit="m³" />
                        </div>
                    </CardBody>
                </Card>

            </div>
        </div>
    );
};
export default InicioVista;
