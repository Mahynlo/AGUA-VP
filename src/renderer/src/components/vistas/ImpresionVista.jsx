import { useNavigate } from "react-router-dom";
import { Button, Card, CardBody, Chip, Tabs, Tab, Skeleton } from "@nextui-org/react";
import { HiArrowLeft, HiPrinter, HiUsers, HiDocumentText, HiCog, HiCurrencyDollar, HiOutlinePresentationChartLine, HiOutlinePresentationChartBar } from "react-icons/hi";
import React, { useMemo, useState } from "react";
import { useReportes } from "../../context/ReportesContext";
import TabImpresion from "./impresion/TabImpresion";
import TabConfiguracion from "./impresion/TabConfiguracion";
import TabReportes from "./impresion/TabReportes";

const Impresion = () => {
  const navigate = useNavigate();

  // Estado para la pestaña activa, recuperado de localStorage
  const [selectedTab, setSelectedTab] = useState(() => {
    return localStorage.getItem("impresion_activeTab") || "impresion";
  });

  const handleTabChange = (key) => {
    setSelectedTab(key);
    localStorage.setItem("impresion_activeTab", key);
  };

  // Usamos el contexto unificado de reportes
  const {
    recibos,
    loading
  } = useReportes();

  // Calcular estadísticas basadas en los recibos cargados actualmente
  const estadisticas = useMemo(() => {
    // Si no hay recibos cargados, mostrar ceros
    if (!recibos || recibos.length === 0) {
      return {
        totalFacturas: 0,
        totalMonto: 0,
        consumoTotal: 0,
        promedioConsumo: 0
      };
    }

    const totalFacturas = recibos.length;
    const totalMonto = recibos.reduce((sum, r) => sum + (r.total || 0), 0);
    const consumoTotal = recibos.reduce((sum, r) => sum + (r.consumo_m3 || 0), 0);

    return {
      totalFacturas,
      totalMonto,
      consumoTotal,
      promedioConsumo: totalFacturas > 0 ? (consumoTotal / totalFacturas).toFixed(1) : 0
    };
  }, [recibos]);

  return (
    // CONTENEDOR PRINCIPAL: Maneja el scroll general de la página
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-24">

      {/* CAMBIO: 'min-h-full' para permitir que el contenido crezca verticalmente sin scroll interno */}
      <div className="w-full min-h-full bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">

        {/* Header con título y estadísticas */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">

                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <HiPrinter className="bg-blue-600 text-white rounded-full p-2 h-12 w-12" />
                  Impresión de Recibos
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-300 ml-12">
                Configure y genere recibos de agua para sus clientes
              </p>
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white min-w-[120px]">
                <CardBody className="text-center p-4">
                  <HiUsers className="w-8 h-8 mx-auto mb-2" />
                  {loading ? (
                    <Skeleton className="h-8 w-12 mx-auto mb-1 bg-white/20" />
                  ) : (
                    <p className="text-2xl font-bold">{estadisticas.totalFacturas}</p>
                  )}
                  <p className="text-xs opacity-90">Resibos</p>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white min-w-[120px]">
                <CardBody className="text-center p-4">
                  <HiCurrencyDollar className="w-8 h-8 mx-auto mb-2" />
                  {loading ? (
                    <Skeleton className="h-8 w-12 mx-auto mb-1 bg-white/20" />
                  ) : (
                    <p className="text-2xl font-bold">${estadisticas.totalMonto.toFixed(0)}</p>
                  )}
                  <p className="text-xs opacity-90">Total</p>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white min-w-[120px]">
                <CardBody className="text-center p-4">
                  <HiOutlinePresentationChartBar className="w-8 h-8 mx-auto mb-2" />
                  {loading ? (
                    <Skeleton className="h-8 w-12 mx-auto mb-1 bg-white/20" />
                  ) : (
                    <p className="text-2xl font-bold">{estadisticas.consumoTotal}</p>
                  )}
                  <p className="text-xs opacity-90">m³ Total</p>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white min-w-[120px]">
                <CardBody className="text-center p-4">
                  <HiOutlinePresentationChartLine className="w-8 h-8 mx-auto mb-2" />
                  {loading ? (
                    <Skeleton className="h-8 w-12 mx-auto mb-1 bg-white/20" />
                  ) : (
                    <p className="text-2xl font-bold">{estadisticas.promedioConsumo}</p>
                  )}
                  <p className="text-xs opacity-90">Promedio m³</p>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>

        {/* Tabs Content */}
        <div className="flex w-full flex-col">
          <Tabs
            aria-label="Opciones de Impresión"
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
              key="impresion"
              title={
                <div className="flex items-center gap-3">
                  <HiPrinter className="w-6 h-6" />
                  <span>Impresión</span>
                  <Chip size="sm" variant="flat" color="primary">
                    {estadisticas.totalFacturas}
                  </Chip>
                </div>
              }
            >
              <TabImpresion />
            </Tab>

            {/* TAB 2: REPORTES (NUEVO) */}
            <Tab
              key="reportes"
              title={
                <div className="flex items-center gap-3">
                  <HiDocumentText className="w-6 h-6" />
                  <span>Reportes y Listas</span>
                </div>
              }
            >
              <TabReportes />
            </Tab>

            <Tab
              key="configuracion"
              title={
                <div className="flex items-center gap-3">
                  <HiCog className="w-6 h-6" />
                  <span>Configurar Anuncios</span>
                  <Chip size="sm" variant="flat" color="secondary">
                    Config
                  </Chip>
                </div>
              }
            >
              <TabConfiguracion />
            </Tab>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Impresion;
