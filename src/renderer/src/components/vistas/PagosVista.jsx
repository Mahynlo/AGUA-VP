import React, { useState, useEffect } from "react";
import { HiCreditCard, HiDocumentText, HiChartBar, HiTrendingUp } from "react-icons/hi";
import { Tabs, Tab, Card, CardBody, Chip } from "@nextui-org/react";
import TabFacturas from "./pagos/TabFacturas";
import TabPagos from "./pagos/TabPagos";
import TabEstadisticas from "./pagos/TabEstadisticas";

const Pagos = () => {
  const [estadisticas, setEstadisticas] = useState({
    totalFacturas: 0,
    pagosPendientes: 0,
    pagosCompletados: 0,
    montoTotal: 0
  });

  // Simulando datos de estadísticas - aquí deberías usar tu contexto real
  useEffect(() => {
    // Aquí deberías obtener las estadísticas reales de tu contexto o API
    setEstadisticas({
      totalFacturas: 245,
      pagosPendientes: 18,
      pagosCompletados: 227,
      montoTotal: 125000
    });
  }, []);

  return (
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
      <div className="w-full h-full bg-white overflow-x-hidden p-6 rounded-lg shadow-md dark:bg-gray-800">
        
        {/* Header con título y estadísticas */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <HiCreditCard className="bg-green-600 text-white rounded-full p-2 h-12 w-12" />
                Gestión de Pagos
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Administra facturas, pagos y estadísticas financieras del sistema
              </p>
            </div>
            
            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white min-w-[120px]">
                <CardBody className="text-center p-4">
                  <HiDocumentText className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{estadisticas.totalFacturas}</p>
                  <p className="text-xs opacity-90">Total Facturas</p>
                </CardBody>
              </Card>
              
              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white min-w-[120px]">
                <CardBody className="text-center p-4">
                  <HiCreditCard className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{estadisticas.pagosPendientes}</p>
                  <p className="text-xs opacity-90">Pendientes</p>
                </CardBody>
              </Card>
              
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white min-w-[120px]">
                <CardBody className="text-center p-4">
                  <HiCreditCard className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{estadisticas.pagosCompletados}</p>
                  <p className="text-xs opacity-90">Completados</p>
                </CardBody>
              </Card>
              
              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white min-w-[120px]">
                <CardBody className="text-center p-4">
                  <HiTrendingUp className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-2xl font-bold">${estadisticas.montoTotal.toLocaleString()}</p>
                  <p className="text-xs opacity-90">Monto Total</p>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
        {/* Tabs Content */}
        <div className="flex w-full flex-col">
          <Tabs
            aria-label="Opciones de Pagos"
            classNames={{
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider bg-white dark:bg-gray-800",
              cursor: "w-full bg-gradient-to-r from-green-500 to-green-600",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-green-600 font-semibold",
            }}
            color="success"
            variant="underlined"
          >
            <Tab
              key="facturas"
              title={
                <div className="flex items-center gap-3">
                  <HiDocumentText className="w-6 h-6" />
                  <span>Facturas</span>
                  <Chip size="sm" variant="flat" color="primary">
                    {estadisticas.totalFacturas}
                  </Chip>
                </div>
              }
            >
              <TabFacturas />
            </Tab>
            
            <Tab
              key="pagos"
              title={
                <div className="flex items-center gap-3">
                  <HiCreditCard className="w-6 h-6" />
                  <span>Pagos</span>
                  <Chip size="sm" variant="flat" color="success">
                    {estadisticas.pagosCompletados}
                  </Chip>
                </div>
              }
            >
              <TabPagos />
            </Tab>
            
            <Tab
              key="estadisticas"
              title={
                <div className="flex items-center gap-3">
                  <HiChartBar className="w-6 h-6" />
                  <span>Estadísticas</span>
                  <Chip size="sm" variant="flat" color="secondary">
                    Gráficos
                  </Chip>
                </div>
              }
            >
              <TabEstadisticas />
            </Tab>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Pagos;
