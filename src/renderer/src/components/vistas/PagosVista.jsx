import React, { useState, useEffect } from "react";
import { 
  HiCreditCard, 
  HiDocumentText, 
  HiChartBar, 
  HiTrendingUp, 
  HiUserGroup, 
  HiCash, 
  HiExclamation, 
  HiCurrencyDollar, 
  HiHand 
} from "react-icons/hi";
import { Tabs, Tab } from "@nextui-org/react";
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
    card3: { icon: HiCreditCard, value: "0", label: "Pagadas", color: "emerald" },
    card4: { icon: HiTrendingUp, value: "0", label: "Vencidas", color: "rose" }
  });

  // Efecto para actualizar KPIs basado en tab seleccionado
  useEffect(() => {
    switch (selectedTab) {
      case "facturas":
        setKpis({
          card1: {
            icon: HiCurrencyDollar,
            value: `$${(statsFacturas?.monto_total || 0).toLocaleString('es-MX')}`,
            label: "Total Facturado",
            color: "blue"
          },
          card2: {
            icon: HiExclamation,
            value: (statsFacturas?.cantidad_pendientes || 0).toLocaleString('es-MX'),
            label: "Pendientes",
            color: "orange"
          },
          card3: {
            icon: HiCreditCard,
            value: (statsFacturas?.cantidad_pagadas || 0).toLocaleString('es-MX'),
            label: "Pagadas",
            color: "emerald"
          },
          card4: {
            icon: HiExclamation,
            value: (statsFacturas?.cantidad_vencidas || 0).toLocaleString('es-MX'),
            label: "Vencidas",
            color: "rose"
          }
        });
        break;

      case "pagos":
        setKpis({
          card1: {
            icon: HiCurrencyDollar,
            value: `$${(statsPagos?.total_pagado || 0).toLocaleString('es-MX')}`,
            label: "Recaudado",
            color: "emerald"
          },
          card2: {
            icon: HiCash,
            value: (statsPagos?.cantidad_pagos || 0).toLocaleString('es-MX'),
            label: "Transacciones",
            color: "blue"
          },
          card3: {
            icon: HiChartBar,
            value: `$${(statsPagos?.promedio_pago || 0).toLocaleString('es-MX', { maximumFractionDigits: 2 })}`,
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
            value: `$${(statsDeudores?.totalDeuda || 0).toLocaleString('es-MX')}`,
            label: "Deuda Visible",
            color: "rose"
          },
          card2: {
            icon: HiUserGroup,
            value: (statsDeudores?.criticos || 0).toLocaleString('es-MX'),
            label: "Usuarios Críticos",
            color: "orange"
          },
          card3: {
            icon: HiDocumentText,
            value: (statsDeudores?.casosActivos || 0).toLocaleString('es-MX'),
            label: "Casos Activos",
            color: "amber"
          },
          card4: {
            icon: HiHand,
            value: (statsDeudores?.convenios || 0).toLocaleString('es-MX'),
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

  // Helper para renderizar card Premium
  const KpiCard = ({ data }) => {
    const Icon = data.icon;
    
    // Mapeo seguro de colores de Tailwind para el texto
    const textColors = {
      blue: "text-blue-600 dark:text-blue-400",
      emerald: "text-emerald-600 dark:text-emerald-400",
      orange: "text-orange-500 dark:text-orange-400",
      rose: "text-rose-500 dark:text-rose-400",
      purple: "text-purple-600 dark:text-purple-400",
      teal: "text-teal-600 dark:text-teal-400",
      amber: "text-amber-500 dark:text-amber-400"
    };

    const valueColor = textColors[data.color] || textColors.blue;

    return (
      <div className="flex flex-col justify-center p-4 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors w-full">
        <div className="flex items-center gap-1.5 mb-2 text-slate-400 dark:text-zinc-500">
          <Icon className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">{data.label}</span>
        </div>
        <p className={`text-2xl font-black leading-none ${valueColor}`}>
          {data.value}
        </p>
      </div>
    );
  };

  return (
    // CONTENEDOR PRINCIPAL: Padding exterior fluido
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20">

      {/* CONTENEDOR DE LA VISTA: 'w-full' para ocupar todo el espacio disponible */}
      <div className="w-full min-h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-6 sm:p-8 lg:p-10 flex flex-col gap-8">

        {/* ── 1. HEADER Y ESTADÍSTICAS ── */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          
          {/* Título de la vista */}
          <div className="flex gap-4 items-center shrink-0">
            {/* Identidad Emerald para Pagos */}
            <div className="p-3.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0 flex items-center justify-center">
              <HiCreditCard className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-none">
                Gestión de Pagos
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 max-w-lg leading-relaxed">
                Administra facturas, supervisa deudores, procesa cobros y analiza estadísticas financieras.
              </p>
            </div>
          </div>

          {/* Tarjetas de Estadísticas (KPIs) Dinámicas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full xl:w-auto shrink-0">
            <KpiCard data={kpis.card1} />
            <KpiCard data={kpis.card2} />
            <KpiCard data={kpis.card3} />
            <KpiCard data={kpis.card4} />
          </div>
        </div>

        {/* ── 2. NAVEGACIÓN (TABS) Y CONTENIDO ── */}
        <div className="flex flex-col w-full flex-1 mt-4">
          <Tabs
            aria-label="Opciones de Pagos"
            selectedKey={selectedTab}
            onSelectionChange={handleTabChange}
            variant="underlined"
            classNames={{
              base: "w-full border-b border-slate-200 dark:border-zinc-800 mb-6",
              tabList: "gap-6 w-full relative rounded-none p-0",
              cursor: "w-full bg-emerald-600 dark:bg-emerald-500 h-0.5",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-emerald-600 dark:group-data-[selected=true]:text-emerald-400 group-data-[selected=true]:font-bold text-slate-500 dark:text-zinc-400 font-medium text-sm transition-colors",
            }}
          >
            {/* TAB: FACTURAS */}
            <Tab
              key="facturas"
              title={
                <div className="flex items-center gap-2.5">
                  <HiDocumentText className="w-5 h-5" />
                  <span>Facturas</span>
                </div>
              }
            >
              <div className="animate-in fade-in duration-500 pt-2">
                <TabFacturas />
              </div>
            </Tab>

            {/* TAB: PAGOS */}
            <Tab
              key="pagos"
              title={
                <div className="flex items-center gap-2.5">
                  <HiCreditCard className="w-5 h-5" />
                  <span>Pagos</span>
                </div>
              }
            >
              <div className="animate-in fade-in duration-500 pt-2">
                <TabPagos />
              </div>
            </Tab>

            {/* TAB: DEUDORES */}
            <Tab
              key="deudores"
              title={
                <div className="flex items-center gap-2.5">
                  <HiUserGroup className="w-5 h-5" />
                  <span>Deudores</span>
                </div>
              }
            >
              <div className="animate-in fade-in duration-500 pt-2">
                <TabDeudores />
              </div>
            </Tab>

            {/* TAB: ESTADÍSTICAS */}
            <Tab
              key="estadisticas"
              title={
                <div className="flex items-center gap-2.5">
                  <HiChartBar className="w-5 h-5" />
                  <span>Estadísticas</span>
                </div>
              }
            >
              <div className="animate-in fade-in duration-500 pt-2">
                <TabEstadisticas />
              </div>
            </Tab>
          </Tabs>
        </div>

      </div>
    </div>
  );
};

export default PagosVista;