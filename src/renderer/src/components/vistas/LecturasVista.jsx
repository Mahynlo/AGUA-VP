import { Link, useNavigate } from "react-router-dom";
import { Button, Modal } from "flowbite-react";
import { Tabs, Tab, Card, CardBody, CardHeader, Chip, Skeleton } from "@nextui-org/react";
import { HiArrowLeft, HiMap, HiDocumentText, HiChartBar, HiClock, HiCheckCircle } from "react-icons/hi";
import { useState, useMemo } from "react";


import TabRutas from "./lecturas/TabRutas";
import { useRutas } from "../../context/RutasContext";

import { LecturasIcon, RutaLecturaIcon, MetricasLecturaIcon } from "../../IconsApp/IconsResibos";
const Lecturas = () => {
  const navigate = useNavigate(); // Hook de navegación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { rutas, initialLoading } = useRutas();

  // Calcular estadísticas reales basadas en los datos
  const estadisticas = useMemo(() => {
    // Si estamos en loading inicial, mostrar valores de 0 temporalmente
    if (initialLoading) {
      return {
        rutasActivas: 0,
        lecturasHoy: 0,
        lecturasCompletadas: 0,
        eficiencia: 0
      };
    }

    const totalRutas = rutas.length;
    const lecturasCompletadas = rutas.reduce((acc, r) => acc + (r.completadas || 0), 0);
    const totalLecturas = rutas.reduce((acc, r) => acc + (r.total_puntos || 0), 0);
    const eficiencia = totalLecturas > 0 ? Math.round((lecturasCompletadas / totalLecturas) * 100) : 0;

    return {
      rutasActivas: totalRutas,
      lecturasHoy: lecturasCompletadas, // Usando completadas como lecturas del día
      lecturasCompletadas: lecturasCompletadas,
      eficiencia: eficiencia
    };
  }, [rutas, initialLoading]);

  return (
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
      <div className="w-full h-full bg-white overflow-x-hidden p-6 rounded-lg shadow-md dark:bg-gray-800">


        {/* Header con título y estadísticas */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <LecturasIcon className="bg-red-500 text-white rounded-full p-2" />
                Sistema de Lecturas
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Gestiona rutas y registra lecturas de medidores
              </p>
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white min-w-[120px]">
                <CardBody className="text-center p-4">
                  <HiMap className="w-8 h-8 mx-auto mb-2" />
                  {initialLoading ? (
                    <Skeleton className="h-8 w-12 mx-auto mb-1 bg-white/20" />
                  ) : (
                    <p className="text-2xl font-bold">{estadisticas.rutasActivas}</p>
                  )}
                  <p className="text-xs opacity-90">Rutas Activas</p>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white min-w-[120px]">
                <CardBody className="text-center p-4">
                  <HiClock className="w-8 h-8 mx-auto mb-2" />
                  {initialLoading ? (
                    <Skeleton className="h-8 w-12 mx-auto mb-1 bg-white/20" />
                  ) : (
                    <p className="text-2xl font-bold">{estadisticas.lecturasHoy}</p>
                  )}
                  <p className="text-xs opacity-90">Lecturas Hoy</p>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white min-w-[120px]">
                <CardBody className="text-center p-4">
                  <HiCheckCircle className="w-8 h-8 mx-auto mb-2" />
                  {initialLoading ? (
                    <Skeleton className="h-8 w-16 mx-auto mb-1 bg-white/20" />
                  ) : (
                    <p className="text-2xl font-bold">{estadisticas.lecturasCompletadas.toLocaleString()}</p>
                  )}
                  <p className="text-xs opacity-90">Completadas</p>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white min-w-[120px]">
                <CardBody className="text-center p-4">
                  <HiChartBar className="w-8 h-8 mx-auto mb-2" />
                  {initialLoading ? (
                    <Skeleton className="h-8 w-12 mx-auto mb-1 bg-white/20" />
                  ) : (
                    <p className="text-2xl font-bold">{estadisticas.eficiencia}%</p>
                  )}
                  <p className="text-xs opacity-90">Eficiencia</p>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>

        {/* Tabs principales */}
        <div className="flex w-full flex-col h-[calc(100%-150px)]">
          <Tabs
            aria-label="Opciones de Lecturas"
            classNames={{
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
              cursor: "w-full bg-blue-600",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-blue-600 font-medium",
            }}
            color="primary"
            variant="underlined"
          >
            <Tab
              key="rutas"
              title={
                <div className="flex items-center gap-2">
                  <HiMap className="w-5 h-5" />
                  <span>Rutas de Lectura</span>
                </div>
              }
            >
              <div className="h-full pt-4">
                <TabRutas />
              </div>
            </Tab>

            <Tab
              key="lecturas"
              title={
                <div className="flex items-center gap-2">
                  <HiDocumentText className="w-5 h-5" />
                  <span>Registro de Lecturas</span>
                </div>
              }
            >
              <Card className="h-full mt-4">
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <HiDocumentText className="w-6 h-6 text-blue-600" />
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Registro de Lecturas
                      </h2>
                    </div>
                    <Chip color="primary" variant="flat">
                      En desarrollo
                    </Chip>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="text-center py-12">
                    <HiDocumentText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Módulo de Lecturas
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                      Aquí podrás registrar y gestionar las lecturas de los medidores de agua de cada ruta asignada.
                    </p>
                  </div>
                </CardBody>
              </Card>
            </Tab>

            <Tab
              key="metricas"
              title={
                <div className="flex items-center gap-2">
                  <HiChartBar className="w-5 h-5" />
                  <span>Métricas y Reportes</span>
                </div>
              }
            >
              <Card className="h-full mt-4">
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <HiChartBar className="w-6 h-6 text-orange-600" />
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Métricas y Análisis
                      </h2>
                    </div>
                    <Chip color="warning" variant="flat">
                      Próximamente
                    </Chip>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Tarjeta de métricas de rendimiento */}
                    <Card className="border border-blue-200 dark:border-blue-800">
                      <CardBody className="text-center p-6">
                        <HiChartBar className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          Rendimiento por Ruta
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Análisis de eficiencia y tiempo promedio por ruta de lectura
                        </p>
                      </CardBody>
                    </Card>

                    {/* Tarjeta de consumo */}
                    <Card className="border border-green-200 dark:border-green-800">
                      <CardBody className="text-center p-6">
                        <HiDocumentText className="w-12 h-12 mx-auto mb-3 text-green-600" />
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          Análisis de Consumo
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Patrones de consumo y comparativas mensuales por sector
                        </p>
                      </CardBody>
                    </Card>

                    {/* Tarjeta de alertas */}
                    <Card className="border border-orange-200 dark:border-orange-800">
                      <CardBody className="text-center p-6">
                        <HiCheckCircle className="w-12 h-12 mx-auto mb-3 text-orange-600" />
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          Alertas y Anomalías
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Detección de consumos anómalos y medidores con problemas
                        </p>
                      </CardBody>
                    </Card>

                    {/* Progreso actual */}
                    <div className="md:col-span-2 lg:col-span-3">
                      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                        <CardBody className="p-6">
                          <div className="text-center">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                              Resumen del Sistema de Lecturas
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-2xl font-bold text-blue-600">{estadisticas.rutasActivas}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Rutas Configuradas</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-green-600">{estadisticas.lecturasHoy}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Lecturas Hoy</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-purple-600">{estadisticas.lecturasCompletadas.toLocaleString()}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Total Histórico</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-orange-600">{estadisticas.eficiencia}%</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Eficiencia General</p>
                              </div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Tab>
          </Tabs>
        </div>




      </div>
    </div>
  );
};

export default Lecturas;