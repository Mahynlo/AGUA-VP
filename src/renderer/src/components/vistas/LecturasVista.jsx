import { Link, useNavigate } from "react-router-dom";
import { Button, Modal } from "flowbite-react";
import { Tabs, Tab, Card, CardBody, CardHeader, Chip, Skeleton } from "@nextui-org/react";
import { HiArrowLeft, HiMap, HiDocumentText, HiChartBar, HiClock, HiCheckCircle } from "react-icons/hi";
import { useState, useMemo } from "react";


import TabRutas from "./lecturas/TabRutas";
import TabMetricas from "./lecturas/TabMetricas";
import { useRutas } from "../../context/RutasContext";

import { LecturasIcon, RutaLecturaIcon, MetricasLecturaIcon } from "../../IconsApp/IconsResibos";

const Lecturas = () => {
  const navigate = useNavigate(); // Hook de navegación
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    // Si estamos en loading inicial, mostrar valores de 0 temporalmente
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
  }, [rutas, initialLoading]);

  return (
    // CONTENEDOR PRINCIPAL: Maneja el scroll general
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-24">

      {/* CAMBIO 1: 'min-h-full' y quitamos 'overflow-x-hidden' */}
      <div className="w-full min-h-full bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">

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
        {/* CAMBIO 2: Eliminamos la altura fija (h-[calc...]) para que crezca libremente */}
        <div className="flex w-full flex-col">
          <Tabs
            aria-label="Opciones de Lecturas"
            selectedKey={selectedTab}
            onSelectionChange={handleTabChange}
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
              key="lecturas"
              title={
                <div className="flex items-center gap-2">
                  <HiDocumentText className="w-5 h-5" />
                  <span>Registro de Lecturas</span>
                </div>
              }
            >
              <div className="h-full pt-4">
                <TabRutas />
              </div>
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
              <div className="h-full pt-4">
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