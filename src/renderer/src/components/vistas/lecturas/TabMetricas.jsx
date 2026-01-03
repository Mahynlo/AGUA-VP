import { useMemo, useState } from "react";
import { Card, CardBody, CardHeader, Chip, Progress, Tabs, Tab } from "@nextui-org/react";
import { HiMap, HiDocumentText, HiChartBar, HiClock, HiCheckCircle, HiTrendingUp, HiUsers, HiExclamation } from "react-icons/hi";
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

    // Encontrar mejor y peor ruta
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

    // Distribución por estado
    const distribucionPorEstado = [
      { name: 'Completadas', value: rutasCompletadas.length, color: '#10B981' },
      { name: 'En Progreso', value: rutasEnProgreso.length, color: '#F59E0B' },
      { name: 'Sin Iniciar', value: rutasSinIniciar.length, color: '#EF4444' }
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

    // Lecturas por ruta (Top 5)
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
      },
      labels: estadisticasRutas.distribucionPorEstado.map(d => d.name),
      colors: estadisticasRutas.distribucionPorEstado.map(d => d.color),
      legend: {
        position: 'bottom'
      },
      dataLabels: {
        enabled: true,
        formatter: function (val) {
          return Math.round(val) + "%";
        }
      }
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
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          horizontal: true,
        },
      },
      xaxis: {
        categories: estadisticasLecturas.lecturasPorRuta.map(r => r.nombre),
      },
      colors: ['#10B981', '#F59E0B'],
      legend: {
        position: 'top'
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs de Rutas y Lecturas */}
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={setSelectedTab}
        color="primary"
        variant="underlined"
        classNames={{
          tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full bg-blue-600",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:text-blue-600 font-medium",
        }}
      >
        {/* TAB DE ESTADÍSTICAS DE RUTAS */}
        <Tab
          key="rutas"
          title={
            <div className="flex items-center gap-2">
              <HiMap className="w-5 h-5" />
              <span>Estadísticas de Rutas</span>
            </div>
          }
        >
          <div className="pt-4 space-y-6">
            {/* Cards de resumen */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 border-blue-600">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Rutas</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {estadisticasRutas.totalRutas}
                      </p>
                    </div>
                    <HiMap className="w-12 h-12 text-blue-600 opacity-20" />
                  </div>
                </CardBody>
              </Card>

              <Card className="border-l-4 border-green-600">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Completadas</p>
                      <p className="text-3xl font-bold text-green-600">
                        {estadisticasRutas.rutasCompletadas}
                      </p>
                    </div>
                    <HiCheckCircle className="w-12 h-12 text-green-600 opacity-20" />
                  </div>
                </CardBody>
              </Card>

              <Card className="border-l-4 border-orange-600">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">En Progreso</p>
                      <p className="text-3xl font-bold text-orange-600">
                        {estadisticasRutas.rutasEnProgreso}
                      </p>
                    </div>
                    <HiClock className="w-12 h-12 text-orange-600 opacity-20" />
                  </div>
                </CardBody>
              </Card>

              <Card className="border-l-4 border-red-600">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Sin Iniciar</p>
                      <p className="text-3xl font-bold text-red-600">
                        {estadisticasRutas.rutasSinIniciar}
                      </p>
                    </div>
                    <HiExclamation className="w-12 h-12 text-red-600 opacity-20" />
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Gráficos y detalles */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distribución por estado */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold text-lg">Distribución de Rutas por Estado</h3>
                </CardHeader>
                <CardBody>
                  {estadisticasRutas.totalRutas > 0 ? (
                    <ReactApexChart
                      options={chartDistribucionRutas.options}
                      series={chartDistribucionRutas.series}
                      type="donut"
                      height={300}
                    />
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      No hay datos de rutas disponibles
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Progreso general */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold text-lg">Progreso General de Rutas</h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Puntos Completados
                      </span>
                      <span className="text-sm font-semibold">
                        {estadisticasRutas.puntosCompletados} / {estadisticasRutas.totalPuntos}
                      </span>
                    </div>
                    <Progress
                      value={estadisticasRutas.promedioCompletado}
                      color="success"
                      size="lg"
                      showValueLabel={true}
                    />
                  </div>

                  {estadisticasRutas.mejorRuta && (
                    <Card className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <CardBody className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <HiTrendingUp className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-green-700 dark:text-green-400">
                            Mejor Ruta
                          </span>
                        </div>
                        <p className="text-sm font-medium">{estadisticasRutas.mejorRuta.nombre}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {estadisticasRutas.mejorRuta.completadas} de {estadisticasRutas.mejorRuta.total_puntos} puntos (
                          {Math.round((estadisticasRutas.mejorRuta.completadas / estadisticasRutas.mejorRuta.total_puntos) * 100)}%)
                        </p>
                      </CardBody>
                    </Card>
                  )}

                  {estadisticasRutas.peorRuta && (
                    <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <CardBody className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <HiExclamation className="w-5 h-5 text-red-600" />
                          <span className="font-semibold text-red-700 dark:text-red-400">
                            Necesita Atención
                          </span>
                        </div>
                        <p className="text-sm font-medium">{estadisticasRutas.peorRuta.nombre}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {estadisticasRutas.peorRuta.completadas} de {estadisticasRutas.peorRuta.total_puntos} puntos (
                          {Math.round((estadisticasRutas.peorRuta.completadas / estadisticasRutas.peorRuta.total_puntos) * 100)}%)
                        </p>
                      </CardBody>
                    </Card>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
        </Tab>

        {/* TAB DE ESTADÍSTICAS DE LECTURAS */}
        <Tab
          key="lecturas"
          title={
            <div className="flex items-center gap-2">
              <HiDocumentText className="w-5 h-5" />
              <span>Estadísticas de Lecturas</span>
            </div>
          }
        >
          <div className="pt-4 space-y-6">
            {/* Cards de resumen de lecturas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="border-l-4 border-purple-600">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Lecturas</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {estadisticasLecturas.totalLecturas.toLocaleString()}
                      </p>
                    </div>
                    <HiDocumentText className="w-12 h-12 text-purple-600 opacity-20" />
                  </div>
                </CardBody>
              </Card>

              <Card className="border-l-4 border-green-600">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Completadas</p>
                      <p className="text-3xl font-bold text-green-600">
                        {estadisticasLecturas.lecturasCompletadas.toLocaleString()}
                      </p>
                    </div>
                    <HiCheckCircle className="w-12 h-12 text-green-600 opacity-20" />
                  </div>
                </CardBody>
              </Card>

              <Card className="border-l-4 border-orange-600">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
                      <p className="text-3xl font-bold text-orange-600">
                        {estadisticasLecturas.lecturasPendientes.toLocaleString()}
                      </p>
                    </div>
                    <HiClock className="w-12 h-12 text-orange-600 opacity-20" />
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Gráfico de lecturas */}
            <div className="grid grid-cols-1 gap-6">
              {/* Progreso de lecturas */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold text-lg">Progreso General de Lecturas</h3>
                </CardHeader>
                <CardBody>
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Lecturas Completadas
                      </span>
                      <span className="text-sm font-semibold">
                        {estadisticasLecturas.lecturasCompletadas.toLocaleString()} / {estadisticasLecturas.totalLecturas.toLocaleString()}
                      </span>
                    </div>
                    <Progress
                      value={estadisticasLecturas.porcentajeCompletado}
                      color="success"
                      size="lg"
                      showValueLabel={true}
                      classNames={{
                        indicator: "bg-gradient-to-r from-green-500 to-green-600"
                      }}
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Top 5 Rutas por Lecturas */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold text-lg">Top 5 Rutas por Lecturas Completadas</h3>
                </CardHeader>
                <CardBody>
                  {estadisticasLecturas.lecturasPorRuta.length > 0 ? (
                    <ReactApexChart
                      options={chartLecturasPorRuta.options}
                      series={chartLecturasPorRuta.series}
                      type="bar"
                      height={350}
                    />
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      No hay datos de lecturas disponibles
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
