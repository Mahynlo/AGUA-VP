import React, { useState, useEffect } from "react";
import { HiCreditCard, HiDocumentText, HiChartBar, HiTrendingUp, HiUserGroup, HiCash, HiExclamation, HiCurrencyDollar, HiHand } from "react-icons/hi";
import { Tabs, Tab, Card, CardBody, Chip } from "@nextui-org/react";
import TabFacturas from "./pagos/TabFacturas";
import TabPagos from "./pagos/TabPagos";
import TabEstadisticas from "./pagos/TabEstadisticas";
import TabDeudores from "./pagos/TabDeudores";
import { useFacturas } from "../../context/FacturasContext";
import { usePagos } from "../../context/PagosContext";
import { useDeudores } from "../../context/DeudoresContext";

const PagosVista = () => {
  // Estado para la pestaña activa
  const [selectedTab, setSelectedTab] = useState(() => {
    return localStorage.getItem("pagos_activeTab") || "facturas";
  });

  // Consumir contextos
  const { estadisticas: statsFacturas } = useFacturas();
  const { resumen: statsPagos } = usePagos();
  const { estadisticas: statsDeudores } = useDeudores();

  // Estado local para KPIs visuales
  const [kpis, setKpis] = useState({
    card1: { icon: HiDocumentText, value: "$0", label: "Total", color: "blue" },
    card2: { icon: HiExclamation, value: "0", label: "Pendientes", color: "orange" },
    card3: { icon: HiCreditCard, value: "0", label: "Pagadas", color: "green" },
    card4: { icon: HiTrendingUp, value: "0", label: "Vencidas", color: "red" }
  });

  // Efecto para actualizar KPIs basado en tab seleccionado
  useEffect(() => {
    switch (selectedTab) {
      case "facturas":
        setKpis({
          card1: {
            icon: HiCurrencyDollar,
            value: `$${(statsFacturas?.monto_total || 0).toLocaleString()}`,
            label: "Total Facturado",
            color: "blue"
          },
          card2: {
            icon: HiExclamation,
            value: statsFacturas?.cantidad_pendientes || 0,
            label: "Pendientes",
            color: "orange"
          },
          card3: {
            icon: HiCreditCard,
            value: statsFacturas?.cantidad_pagadas || 0, // Asumiendo que existe o se calcula
            label: "Pagadas",
            color: "green"
          },
          card4: {
            icon: HiExclamation,
            value: statsFacturas?.cantidad_vencidas || 0, // Asumiendo
            label: "Vencidas",
            color: "red"
          }
        });
        break;

      case "pagos":
        setKpis({
          card1: {
            icon: HiCurrencyDollar,
            value: `$${(statsPagos?.total_pagado || 0).toLocaleString()}`,
            label: "Recaudado",
            color: "green"
          },
          card2: {
            icon: HiCash,
            value: statsPagos?.cantidad_pagos || 0,
            label: "Transacciones",
            color: "blue"
          },
          card3: {
            icon: HiChartBar,
            value: `$${(statsPagos?.promedio_pago || 0).toLocaleString()}`,
            label: "Ticket Promedio",
            color: "purple"
          },
          card4: {
            icon: HiTrendingUp,
            value: "100%", // Placeholder o calculado
            label: "Efectividad",
            color: "teal"
          }
        });
        break;

      case "deudores":
        setKpis({
          card1: {
            icon: HiCurrencyDollar,
            value: `$${(statsDeudores?.totalDeuda || 0).toLocaleString()}`,
            label: "Deuda Visible",
            color: "red"
          },
          card2: {
            icon: HiUserGroup,
            value: statsDeudores?.criticos || 0,
            label: "Usuarios Críticos",
            color: "orange"
          },
          card3: {
            icon: HiDocumentText,
            value: statsDeudores?.casosActivos || 0,
            label: "Casos Activos",
            color: "yellow"
          },
          card4: {
            icon: HiHand,
            value: statsDeudores?.convenios || 0,
            label: "Convenios",
            color: "blue"
          }
        });
        break;

      default:
        break;
    }
  }, [selectedTab, statsFacturas, statsPagos, statsDeudores]);

  const handleTabChange = (key) => {
    setSelectedTab(key);
    localStorage.setItem("pagos_activeTab", key);
  };

  // Helper para renderizar card
  const KpiCard = ({ data }) => {
    const Icon = data.icon;
    const colorClasses = {
      blue: "from-blue-500 to-blue-600",
      green: "from-green-500 to-green-600",
      orange: "from-orange-500 to-orange-600",
      red: "from-red-500 to-red-600",
      purple: "from-purple-500 to-purple-600",
      teal: "from-teal-500 to-teal-600",
      yellow: "from-yellow-500 to-yellow-600"
    };

    return (
      <Card className={`bg-gradient-to-r ${colorClasses[data.color] || colorClasses.blue} text-white min-w-[120px]`}>
        <CardBody className="text-center p-4">
          <Icon className="w-8 h-8 mx-auto mb-2" />
          <p className="text-2xl font-bold">{data.value}</p>
          <p className="text-sm opacity-90 font-medium">{data.label}</p>
        </CardBody>
      </Card>
    );
  };

  return (
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-24">
      <div className="w-full min-h-full bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">

        {/* Header con título y estadísticas dinámicas */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <HiCreditCard className="bg-green-600 text-white rounded-full p-2 h-12 w-12" />
                Gestión de Pagos
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Administra facturas, pagos y estadísticas financieras
              </p>
            </div>

            {/* Estadísticas rápidas Dinámicas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 min-w-[600px]">
              <KpiCard data={kpis.card1} />
              <KpiCard data={kpis.card2} />
              <KpiCard data={kpis.card3} />
              <KpiCard data={kpis.card4} />
            </div>
          </div>
        </div>

        {/* Tabs Content */}
        <div className="flex w-full flex-col">
          <Tabs
            aria-label="Opciones de Pagos"
            selectedKey={selectedTab}
            onSelectionChange={handleTabChange}
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
                </div>
              }
            >
              <TabPagos />
            </Tab>

            <Tab
              key="deudores"
              title={
                <div className="flex items-center gap-3">
                  <HiUserGroup className="w-6 h-6" />
                  <span>Deudores</span>
                </div>
              }
            >
              <TabDeudores />
            </Tab>

            <Tab
              key="estadisticas"
              title={
                <div className="flex items-center gap-3">
                  <HiChartBar className="w-6 h-6" />
                  <span>Estadísticas</span>
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

export default PagosVista;
