import React, { useMemo, useState } from "react";
import { Card, CardBody, Skeleton, Tabs, Tab } from "@nextui-org/react";
import { HiCog, HiCheck, HiX, HiLocationMarker, HiMap, HiTable } from "react-icons/hi";

import { useMedidores } from "../../../context/MedidoresContext";
import { MedidoresIcon } from "../../../IconsApp/IconsSidebar";
import LoadingSkeleton from "./components/LoadingSkeleton";

// Componentes de Pestañas
import TabMapaMedidores from "./TabMapaMedidores";
import TabInventarioMedidores from "./TabInventarioMedidores";

const Medidores = () => {
  const {
    medidores,
    medidoresAsignados,
    medidoresNoAsignados,
    loading,
    initialLoading
  } = useMedidores();

  // Estado para la pestaña activa, recuperado de localStorage
  const [selectedTab, setSelectedTab] = useState(() => {
    return localStorage.getItem("medidores_activeTab") || "mapa";
  });

  const handleTabChange = (key) => {
    setSelectedTab(key);
    localStorage.setItem("medidores_activeTab", key);
  };

  // Estadísticas calculadas (Mantenemos estas aquí para el Header global)
  const estadisticas = useMemo(() => {
    if (initialLoading) {
      return { total: 0, asignados: 0, libres: 0, activos: 0, inactivos: 0, porcentajeAsignados: 0, porcentajeActivos: 0 };
    }
    if (!medidores || medidores.length === 0) {
      return { total: 0, asignados: 0, libres: 0, activos: 0, inactivos: 0, porcentajeAsignados: 0, porcentajeActivos: 0 };
    }
    const activos = medidores.filter(m => m.estado_medidor === "Activo").length;
    const inactivos = medidores.filter(m => m.estado_medidor === "Inactivo").length;
    return {
      total: medidores.length,
      asignados: medidoresAsignados.length,
      libres: medidoresNoAsignados.length,
      activos,
      inactivos,
      porcentajeAsignados: medidores.length > 0 ? (medidoresAsignados.length / medidores.length * 100) : 0,
      porcentajeActivos: medidores.length > 0 ? (activos / medidores.length * 100) : 0
    };
  }, [medidores, medidoresAsignados, medidoresNoAsignados, initialLoading]);

  // Si está cargando datos iniciales, mostramos el skeleton
  if (initialLoading) {
    // Usamos una versión adaptada del skeleton o el mismo si envuelve toda la página
    return (
      <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-24">
        <div className="w-full min-h-full bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    // CONTENEDOR PRINCIPAL: Scroll general de la página
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-24">

      <div className="w-full min-h-full bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">

        {/* Header con título y estadísticas (Global) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3">
                <MedidoresIcon className="bg-blue-600 text-white rounded-full p-2 h-12 w-12" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Gestión de Medidores
                </h1>
                {loading && !initialLoading && (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Administra y monitorea todos los medidores del sistema
              </p>

            </div>

            {/* Estadísticas rápidas - Siempre visibles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white min-w-[120px] backdrop-blur-md border-0 shadow-xl">
                <CardBody className="text-center p-4">
                  <HiCog className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{estadisticas.total}</p>
                  <p className="text-xs opacity-90">Total Medidores</p>
                </CardBody>
              </Card>
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white min-w-[120px] backdrop-blur-md border-0 shadow-xl">
                <CardBody className="text-center p-4">
                  <HiCheck className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{estadisticas.asignados}</p>
                  <div className="text-xs opacity-90">
                    Asignados ({estadisticas.porcentajeAsignados.toFixed(0)}%)
                  </div>
                </CardBody>
              </Card>
              <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white min-w-[120px] backdrop-blur-md border-0 shadow-xl">
                <CardBody className="text-center p-4">
                  <HiX className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{estadisticas.libres}</p>
                  <p className="text-xs opacity-90">Disponibles</p>
                </CardBody>
              </Card>
              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white min-w-[120px] backdrop-blur-md border-0 shadow-xl">
                <CardBody className="text-center p-4">
                  <HiLocationMarker className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{estadisticas.activos}</p>
                  <div className="text-xs opacity-90">
                    Activos ({estadisticas.porcentajeActivos.toFixed(0)}%)
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>

        {/* TABS PRINCIPALES */}
        <div className="flex w-full flex-col">
          <Tabs
            aria-label="Opciones de Medidores"
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
            {/* TAB 1: MAPA (Vista Original) */}
            <Tab
              key="mapa"
              title={
                <div className="flex items-center gap-2">
                  <HiMap className="w-5 h-5" />
                  <span>Mapa y Ubicación</span>
                </div>
              }
            >
              <TabMapaMedidores />
            </Tab>

            {/* TAB 2: INVENTARIO (Nueva tabla) */}
            <Tab
              key="inventario"
              title={
                <div className="flex items-center gap-2">
                  <HiTable className="w-5 h-5" />
                  <span>Inventario General</span>
                </div>
              }
            >
              <div className="pt-4">
                <TabInventarioMedidores />
              </div>
            </Tab>
          </Tabs>
        </div>

      </div>
    </div>
  );
};

export default Medidores;
