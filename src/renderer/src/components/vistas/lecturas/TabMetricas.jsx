import { useMemo, useState } from "react";
import { Card, CardBody, CardHeader, Chip, Progress, Tabs, Tab } from "@nextui-org/react";
import { HiMap, HiDocumentText, HiChartBar, HiClock, HiCheckCircle, HiTrendingUp, HiExclamation, HiTrendingDown } from "react-icons/hi";
import { useRutas } from "../../../context/RutasContext";
import ReactApexChart from "react-apexcharts";

export default function TabMetricas() {
  const { rutas, initialLoading } = useRutas();
  const [selectedTab, setSelectedTab] = useState("rutas");

  // Estadísticas de Rutas
  const estadisticasRutas = useMemo(() => {
    if (initialLoading || !rutas.length) {
      return {
        totalRutas: 0,
        rutasCompletadas: 0,
        rutasEnProgreso: 0,
        rutasSinIniciar: 0,
        promedioCompletado: 0,
        totalPuntos: 0,
        puntosCompletados: 0,
        mejorRuta: null,
        peorRuta: null,
        distribucionPorEstado: []
      };
    }

    const rutasCompletadas = rutas.filter(r => r.completadas === r.total_puntos && r.total_puntos > 0);
    const rutasEnProgreso = rutas.filter(r => r.completadas > 0 && r.completadas < r.total_puntos);
    const rutasSinIniciar = rutas.filter(r => r.completadas === 0);
    
    const totalPuntos = rutas.reduce((acc, r) => acc + (r.total_puntos || 0), 0);
    const puntosCompletados = rutas.reduce((acc, r) => acc + (r.completadas || 0), 0);
    const promedioCompletado = totalPuntos > 0 ? Math.round((puntosCompletados / totalPuntos) * 100) : 0;

    const rutasConDatos = rutas.filter(r => r.total_puntos > 0);
    const mejorRuta = rutasConDatos.length > 0 
      ? rutasConDatos.reduce((max, r) => {
          const porcentaje = (r.completadas / r.total_puntos) * 100;
          const maxPorcentaje = (max.completadas / max.total_puntos) * 100;
          return porcentaje > maxPorcentaje ? r : max;
        })
      : null;

    const peorRuta = rutasConDatos.length > 0
      ? rutasConDatos.reduce((min, r) => {
          const porcentaje = (r.completadas / r.total_puntos) * 100;
          const minPorcentaje = (min.completadas / min.total_puntos) * 100;
          return porcentaje < minPorcentaje ? r : min;
        })
      : null;

    const distribucionPorEstado = [
      { name: 'Completadas', value: rutasCompletadas.length, color: '#10B981' }, // emerald-500
      { name: 'En Progreso', value: rutasEnProgreso.length, color: '#F59E0B' }, // amber-500
      { name: 'Sin Iniciar', value: rutasSinIniciar.length, color: '#EF4444' }  // red-500
    ];

    return {
      totalRutas: rutas.length,
      rutasCompletadas: rutasCompletadas.length,
      rutasEnProgreso: rutasEnProgreso.length,
      rutasSinIniciar: rutasSinIniciar.length,
      promedioCompletado,
      totalPuntos,
      puntosCompletados,
      mejorRuta,
      peorRuta,
      distribucionPorEstado
    };
  }, [rutas, initialLoading]);

  // Estadísticas de Lecturas
  const estadisticasLecturas = useMemo(() => {
    if (initialLoading || !rutas.length) {
      return {
        totalLecturas: 0,
        lecturasCompletadas: 0,
        lecturasPendientes: 0,
        porcentajeCompletado: 0,
        lecturasPorRuta: [],
        tendencia: []
      };
    }

    const totalLecturas = rutas.reduce((acc, r) => acc + (r.total_puntos || 0), 0);
    const lecturasCompletadas = rutas.reduce((acc, r) => acc + (r.completadas || 0), 0);
    const lecturasPendientes = totalLecturas - lecturasCompletadas;
    const porcentajeCompletado = totalLecturas > 0 ? Math.round((lecturasCompletadas / totalLecturas) * 100) : 0;

    const lecturasPorRuta = rutas
      .map(r => ({
        nombre: r.nombre,
        completadas: r.completadas || 0,
        total: r.total_puntos || 0,
        porcentaje: r.total_puntos > 0 ? Math.round((r.completadas / r.total_puntos) * 100) : 0
      }))
      .sort((a, b) => b.completadas - a.completadas)
      .slice(0, 5);

    return {
      totalLecturas,
      lecturasCompletadas,
      lecturasPendientes,
      porcentajeCompletado,
      lecturasPorRuta
    };
  }, [rutas, initialLoading]);

  // Configuración del gráfico de distribución de rutas
  const chartDistribucionRutas = {
    series: estadisticasRutas.distribucionPorEstado.map(d => d.value),
    options: {
      chart: {
        type: 'donut',
        fontFamily: 'inherit',
        background: 'transparent'
      },
      labels: estadisticasRutas.distribucionPorEstado.map(d => d.name),
      colors: estadisticasRutas.distribucionPorEstado.map(d => d.color),
      legend: {
        position: 'bottom',
        labels: { colors: 'currentColor' }
      },
      stroke: { show: false },
      dataLabels: {
        enabled: true,
        formatter: function (val) {
          return Math.round(val) + "%";
        },
        dropShadow: { enabled: false }
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              name: { show: true, color: 'currentColor' },
              value: { show: true, fontSize: '24px', fontWeight: 700, color: 'currentColor' },
              total: { show: true, showAlways: true, label: 'Total', color: 'currentColor' }
            }
          }
        }
      },
      theme: { mode: 'light' } // ApexCharts se maneja mejor en light por defecto si no forzamos todo
    }
  };

  // Configuración del gráfico de lecturas por ruta
  const chartLecturasPorRuta = {
    series: [{
      name: 'Completadas',
      data: estadisticasLecturas.lecturasPorRuta.map(r => r.completadas)
    }, {
      name: 'Pendientes',
      data: estadisticasLecturas.lecturasPorRuta.map(r => r.total - r.completadas)
    }],
    options: {
      chart: {
        type: 'bar',
        stacked: true,
        fontFamily: 'inherit',
        toolbar: { show: false },
        background: 'transparent'
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
        },
      },
      stroke: { width: 1, colors: ['#fff'] },
      xaxis: {
        categories: estadisticasLecturas.lecturasPorRuta.map(r => r.nombre),
        labels: { style: { colors: 'currentColor' } }
      },
      yaxis: {
        labels: { style: { colors: 'currentColor' } }
      },
      colors: ['#10B981', '#F59E0B'], // emerald, amber
      legend: {
        position: 'top',
        labels: { colors: 'currentColor' }
      },
      dataLabels: { enabled: false }
    }
  };

  return (
    <div className="w-full space-y-6">
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={setSelectedTab}
        color="primary"
        variant="underlined"
        classNames={{
          tabList: "gap-6 w-full relative rounded-none p-0 border-b border-slate-200 dark:border-zinc-800",
          cursor: "w-full bg-blue-500",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:text-blue-600 dark:group-data-[selected=true]:text-blue-400 font-bold text-slate-500",
        }}
      >
        {/* TAB DE ESTADÍSTICAS DE RUTAS */}
        <Tab
          key="rutas"
          title={
            <div className="flex items-center gap-2">
              <HiMap className="text-lg" />
              <span>Estadísticas de Rutas</span>
            </div>
          }
        >
          <div className="pt-6 space-y-6">
            
            {/* KPI Cards (Resumen Rápido) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-none shadow-sm bg-blue-50 dark:bg-blue-900/10 rounded-2xl">
                <CardBody className="p-5 flex flex-row items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                    <HiMap className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wider mb-0.5">Total Rutas</p>
                    <p className="text-3xl font-black text-blue-700 dark:text-blue-300 leading-none">
                      {estadisticasRutas.totalRutas}
                    </p>
                  </div>
                </CardBody>
              </Card>

              <Card className="border-none shadow-sm bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl">
                <CardBody className="p-5 flex flex-row items-center gap-4">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                    <HiCheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider mb-0.5">Completadas</p>
                    <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 leading-none">
                      {estadisticasRutas.rutasCompletadas}
                    </p>
                  </div>
                </CardBody>
              </Card>

              <Card className="border-none shadow-sm bg-amber-50 dark:bg-amber-900/10 rounded-2xl">
                <CardBody className="p-5 flex flex-row items-center gap-4">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                    <HiClock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-amber-600/70 dark:text-amber-400/70 uppercase tracking-wider mb-0.5">En Progreso</p>
                    <p className="text-3xl font-black text-amber-700 dark:text-amber-300 leading-none">
                      {estadisticasRutas.rutasEnProgreso}
                    </p>
                  </div>
                </CardBody>
              </Card>

              <Card className="border-none shadow-sm bg-red-50 dark:bg-red-900/10 rounded-2xl">
                <CardBody className="p-5 flex flex-row items-center gap-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl shrink-0">
                    <HiExclamation className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-red-600/70 dark:text-red-400/70 uppercase tracking-wider mb-0.5">Sin Iniciar</p>
                    <p className="text-3xl font-black text-red-700 dark:text-red-300 leading-none">
                      {estadisticasRutas.rutasSinIniciar}
                    </p>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Gráficos y Detalles */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Distribución por estado */}
              <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl">
                <CardHeader className="pt-6 px-6 pb-0">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                    <HiChartBar className="text-blue-500" /> Distribución por Estado
                  </h3>
                </CardHeader>
                <CardBody className="px-6 py-6 flex items-center justify-center">
                  {estadisticasRutas.totalRutas > 0 ? (
                    <div className="w-full" style={{ color: 'var(--nextui-colors-foreground)' }}>
                      <ReactApexChart
                        options={chartDistribucionRutas.options}
                        series={chartDistribucionRutas.series}
                        type="donut"
                        height={320}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] opacity-50">
                      <HiChartBar className="w-12 h-12 text-slate-400 mb-2" />
                      <p className="text-sm font-medium text-slate-500">No hay datos de rutas</p>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Progreso General y Destacados */}
              <div className="flex flex-col gap-6">
                <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl">
                  <CardHeader className="pt-6 px-6 pb-0">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                      <HiChartBar className="text-emerald-500" /> Progreso General
                    </h3>
                  </CardHeader>
                  <CardBody className="px-6 py-6">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                        Avance de Lecturas
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-800 dark:text-zinc-100">
                          {estadisticasRutas.puntosCompletados}
                        </span>
                        <span className="text-sm font-bold text-slate-400">/ {estadisticasRutas.totalPuntos}</span>
                      </div>
                    </div>
                    <Progress
                      value={estadisticasRutas.promedioCompletado}
                      color="success"
                      className="h-3"
                      classNames={{ track: "bg-slate-100 dark:bg-zinc-800", indicator: "rounded-full bg-emerald-500" }}
                      aria-label="Progreso general"
                    />
                    <p className="text-right text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                        {estadisticasRutas.promedioCompletado}% Completado
                    </p>
                  </CardBody>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                    {estadisticasRutas.mejorRuta ? (
                        <Card className="border-none shadow-sm bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/30 rounded-2xl">
                            <CardBody className="p-5 flex flex-col justify-center">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-1.5 bg-emerald-500 text-white rounded-full"><HiTrendingUp className="w-4 h-4" /></div>
                                    <span className="text-[11px] font-bold text-emerald-700/70 dark:text-emerald-500/70 uppercase tracking-wider">Mejor Ruta</span>
                                </div>
                                <p className="text-sm font-bold text-slate-800 dark:text-zinc-100 truncate mb-1">{estadisticasRutas.mejorRuta.nombre}</p>
                                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                    {estadisticasRutas.mejorRuta.completadas} / {estadisticasRutas.mejorRuta.total_puntos} puntos ({Math.round((estadisticasRutas.mejorRuta.completadas / estadisticasRutas.mejorRuta.total_puntos) * 100)}%)
                                </p>
                            </CardBody>
                        </Card>
                    ) : <div />}

                    {estadisticasRutas.peorRuta ? (
                        <Card className="border-none shadow-sm bg-red-50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-800/30 rounded-2xl">
                            <CardBody className="p-5 flex flex-col justify-center">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-1.5 bg-red-500 text-white rounded-full"><HiTrendingDown className="w-4 h-4" /></div>
                                    <span className="text-[11px] font-bold text-red-700/70 dark:text-red-500/70 uppercase tracking-wider">Requiere Atención</span>
                                </div>
                                <p className="text-sm font-bold text-slate-800 dark:text-zinc-100 truncate mb-1">{estadisticasRutas.peorRuta.nombre}</p>
                                <p className="text-xs font-medium text-red-600 dark:text-red-400">
                                    {estadisticasRutas.peorRuta.completadas} / {estadisticasRutas.peorRuta.total_puntos} puntos ({Math.round((estadisticasRutas.peorRuta.completadas / estadisticasRutas.peorRuta.total_puntos) * 100)}%)
                                </p>
                            </CardBody>
                        </Card>
                    ) : <div />}
                </div>
              </div>
            </div>
          </div>
        </Tab>

        {/* TAB DE ESTADÍSTICAS DE LECTURAS */}
        <Tab
          key="lecturas"
          title={
            <div className="flex items-center gap-2">
              <HiDocumentText className="text-lg" />
              <span>Métricas de Lecturas</span>
            </div>
          }
        >
          <div className="pt-6 space-y-6">
            {/* KPI Cards de Lecturas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-none shadow-sm bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl">
                <CardBody className="p-5 flex flex-row items-center gap-4">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                    <HiDocumentText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-indigo-600/70 dark:text-indigo-400/70 uppercase tracking-wider mb-0.5">Total Lecturas</p>
                    <p className="text-3xl font-black text-indigo-700 dark:text-indigo-300 leading-none">
                      {estadisticasLecturas.totalLecturas.toLocaleString()}
                    </p>
                  </div>
                </CardBody>
              </Card>

              <Card className="border-none shadow-sm bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl">
                <CardBody className="p-5 flex flex-row items-center gap-4">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                    <HiCheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider mb-0.5">Realizadas</p>
                    <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 leading-none">
                      {estadisticasLecturas.lecturasCompletadas.toLocaleString()}
                    </p>
                  </div>
                </CardBody>
              </Card>

              <Card className="border-none shadow-sm bg-amber-50 dark:bg-amber-900/10 rounded-2xl">
                <CardBody className="p-5 flex flex-row items-center gap-4">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                    <HiClock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-amber-600/70 dark:text-amber-400/70 uppercase tracking-wider mb-0.5">Pendientes</p>
                    <p className="text-3xl font-black text-amber-700 dark:text-amber-300 leading-none">
                      {estadisticasLecturas.lecturasPendientes.toLocaleString()}
                    </p>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Gráfico de lecturas */}
            <div className="grid grid-cols-1 gap-6">
              
              <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl">
                <CardHeader className="pt-6 px-6 pb-0">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                    <HiChartBar className="text-blue-500" /> Top 5 Rutas (Avance de Lectura)
                  </h3>
                </CardHeader>
                <CardBody className="px-6 py-6">
                  {estadisticasLecturas.lecturasPorRuta.length > 0 ? (
                    <div className="w-full" style={{ color: 'var(--nextui-colors-foreground)' }}>
                        <ReactApexChart
                        options={chartLecturasPorRuta.options}
                        series={chartLecturasPorRuta.series}
                        type="bar"
                        height={350}
                        />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] opacity-50">
                      <HiDocumentText className="w-12 h-12 text-slate-400 mb-2" />
                      <p className="text-sm font-medium text-slate-500">No hay datos de lecturas</p>
                    </div>
                  )}
                </CardBody>
              </Card>
              
            </div>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}