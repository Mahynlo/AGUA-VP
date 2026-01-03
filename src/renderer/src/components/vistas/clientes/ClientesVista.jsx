import React, { useState, useEffect, useMemo } from "react";
import { HiUserCircle, HiUsers, HiUserAdd, HiTrendingUp } from "react-icons/hi";
import { TabClientes } from "./TabClientes";
import { TabMetricas } from "./TabMetricas";
import { Tabs, Tab, Card, CardBody, Chip, Skeleton } from "@nextui-org/react";
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
    // Si estamos en loading inicial, mostrar valores de 0 temporalmente
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
    // CONTENEDOR PRINCIPAL: Maneja el scroll general
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-24">

      {/* CAMBIO: Usamos 'min-h-full' y quitamos 'overflow-x-hidden' para permitir que el contenido crezca */}
      <div className="w-full min-h-full bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">

        {/* Header con título y estadísticas */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <HiUsers className="bg-blue-600 text-white rounded-full p-2 h-12 w-12" />
                Gestión de Clientes
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Administra la información de todos los clientes del sistema
              </p>
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white min-w-[120px]">
                <CardBody className="text-center p-4">
                  <HiUsers className="w-8 h-8 mx-auto mb-2" />
                  {initialLoading ? (
                    <Skeleton className="h-8 w-12 mx-auto mb-1 bg-white/20" />
                  ) : (
                    <p className="text-2xl font-bold">{estadisticas.total}</p>
                  )}
                  <p className="text-xs opacity-90">Total Clientes</p>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white min-w-[120px]">
                <CardBody className="text-center p-4">
                  <HiUserCircle className="w-8 h-8 mx-auto mb-2" />
                  {initialLoading ? (
                    <Skeleton className="h-8 w-12 mx-auto mb-1 bg-white/20" />
                  ) : (
                    <p className="text-2xl font-bold">{estadisticas.activos}</p>
                  )}
                  <p className="text-xs opacity-90">Activos</p>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white min-w-[120px]">
                <CardBody className="text-center p-4">
                  <HiUserAdd className="w-8 h-8 mx-auto mb-2" />
                  {initialLoading ? (
                    <Skeleton className="h-8 w-12 mx-auto mb-1 bg-white/20" />
                  ) : (
                    <p className="text-2xl font-bold">{estadisticas.nuevosEsteMes}</p>
                  )}
                  <p className="text-xs opacity-90">Nuevos (mes)</p>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white min-w-[120px]">
                <CardBody className="text-center p-4">
                  <HiTrendingUp className="w-8 h-8 mx-auto mb-2" />
                  {initialLoading ? (
                    <Skeleton className="h-8 w-12 mx-auto mb-1 bg-white/20" />
                  ) : (
                    <p className="text-2xl font-bold">{estadisticas.ciudades}</p>
                  )}
                  <p className="text-xs opacity-90">Ciudades</p>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>

        {/* Tabs Content */}
        <div className="flex w-full flex-col">
          <Tabs
            aria-label="Opciones de Clientes"
            selectedKey={selectedTab}
            onSelectionChange={handleTabChange}
            classNames={{
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider bg-white dark:bg-gray-800",
              cursor: "w-full bg-gradient-to-r from-blue-500 to-blue-600",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-blue-600 font-semibold",
            }}
            color="primary"
            variant="underlined"
          >
            <Tab
              key="Clientes"
              title={
                <div className="flex items-center gap-3">
                  <HiUserCircle className="w-6 h-6" />
                  <span>Lista de Clientes</span>
                  <Chip size="sm" variant="flat" color="primary">
                    {estadisticas.total}
                  </Chip>
                </div>
              }
            >
              <TabClientes />
            </Tab>

            <Tab
              key="Metricas"
              title={
                <div className="flex items-center gap-3">
                  <MetricasLecturaIcon className="w-6 h-6" />
                  <span>Métricas y Análisis</span>
                  <Chip size="sm" variant="flat" color="secondary">
                    Gráficos
                  </Chip>
                </div>
              }
            >
              <TabMetricas />
            </Tab>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Clientes;
