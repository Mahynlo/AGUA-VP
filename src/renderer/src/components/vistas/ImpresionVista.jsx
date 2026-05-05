import { useNavigate } from "react-router-dom";
import { Chip, Tabs, Tab, Skeleton } from "@nextui-org/react";
import { 
  HiPrinter, 
  HiUsers, 
  HiDocumentText, 
  HiCog, 
  HiCurrencyDollar, 
  HiOutlinePresentationChartLine, 
  HiOutlinePresentationChartBar 
} from "react-icons/hi";
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
    // CONTENEDOR PRINCIPAL: Padding exterior fluido y fondo gris sutil
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20 scroll-smooth">

      {/* CONTENEDOR DE LA VISTA: 'w-full min-h-full' para ocupar todo el espacio disponible */}
      <div className="w-full min-h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-6 sm:p-8 lg:p-10 flex flex-col gap-10 animate-in fade-in duration-500">

        {/* ── 1. HEADER Y ESTADÍSTICAS ── */}
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-8">
          
          {/* Título de la vista */}
          <div className="flex gap-4 items-start shrink-0">
            {/* Regla de Tintes (Índigo Corporativo) */}
            <div className="p-3.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0 flex items-center justify-center">
              <HiPrinter className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1 pt-0.5">
              {/* Token 3: Textos Principales */}
              <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
                Impresión de Recibos
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 max-w-lg mt-1 leading-relaxed">
                Configure, genere y administre la impresión de los recibos de agua para sus clientes.
              </p>
            </div>
          </div>

          {/* Tarjetas de Estadísticas (KPIs) - Se alinean a la derecha */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full xl:w-auto shrink-0">
            
            {/* KPI: Recibos (Azul) */}
            <div className="flex flex-col gap-3 p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Recibos</span>
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400"><HiUsers className="w-4 h-4" /></div>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-16 rounded-lg bg-slate-200 dark:bg-zinc-800" />
              ) : (
                <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">
                  {estadisticas.totalFacturas.toLocaleString('es-MX')}
                </p>
              )}
            </div>

            {/* KPI: Total $ (Esmeralda) */}
            <div className="flex flex-col gap-3 p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Total a Cobrar</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><HiCurrencyDollar className="w-4 h-4" /></div>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-24 rounded-lg bg-slate-200 dark:bg-zinc-800" />
              ) : (
                <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none flex items-baseline gap-0.5">
                  <span className="text-lg font-bold text-slate-400">$</span>
                  {estadisticas.totalMonto.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              )}
            </div>

            {/* KPI: m³ Total (Púrpura) */}
            <div className="flex flex-col gap-3 p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">m³ Total</span>
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400"><HiOutlinePresentationChartBar className="w-4 h-4" /></div>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-20 rounded-lg bg-slate-200 dark:bg-zinc-800" />
              ) : (
                <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">
                  {estadisticas.consumoTotal.toLocaleString('es-MX')}
                </p>
              )}
            </div>

            {/* KPI: Promedio (Naranja) */}
            <div className="flex flex-col gap-3 p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Promedio m³</span>
                <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400"><HiOutlinePresentationChartLine className="w-4 h-4" /></div>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-16 rounded-lg bg-slate-200 dark:bg-zinc-800" />
              ) : (
                <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">
                  {estadisticas.promedioConsumo}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── 2. NAVEGACIÓN (TABS) Y CONTENIDO ── */}
        <div className="flex flex-col w-full flex-1 mt-2">
          {/* Token 7: Pestañas de Navegación SaaS - Tema Índigo */}
          <Tabs
            aria-label="Opciones de Impresión"
            selectedKey={selectedTab}
            onSelectionChange={handleTabChange}
            variant="underlined"
            classNames={{
              base: "w-full border-b border-slate-200 dark:border-zinc-800 mb-6",
              tabList: "gap-6 w-full relative rounded-none p-0",
              cursor: "w-full bg-indigo-600 dark:bg-indigo-500 h-[2px]", // Cursor Índigo
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-indigo-600 dark:group-data-[selected=true]:text-indigo-400 group-data-[selected=true]:font-bold text-slate-500 dark:text-zinc-400 font-medium text-sm transition-colors",
            }}
          >
            {/* TAB: IMPRESIÓN */}
            <Tab
              key="impresion"
              title={
                <div className="flex items-center gap-2.5">
                  <HiPrinter className="text-lg" />
                  <span>Impresión General</span>
                  <Chip size="sm" variant="flat" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold h-5 text-[10px] px-1 ml-1 rounded-md">
                    {estadisticas.totalFacturas}
                  </Chip>
                </div>
              }
            >
              <div className="pt-2 animate-in fade-in duration-500 h-full flex flex-col">
                <TabImpresion />
              </div>
            </Tab>

            {/* TAB: REPORTES */}
            <Tab
              key="reportes"
              title={
                <div className="flex items-center gap-2.5">
                  <HiDocumentText className="text-lg" />
                  <span>Reportes y Listas</span>
                </div>
              }
            >
              <div className="pt-2 animate-in fade-in duration-500 h-full flex flex-col">
                <TabReportes />
              </div>
            </Tab>

            {/* TAB: CONFIGURACIÓN */}
            <Tab
              key="configuracion"
              title={
                <div className="flex items-center gap-2.5">
                  <HiCog className="text-lg" />
                  <span>Configuración Visual</span>
                  <Chip size="sm" variant="flat" className="bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-[9px] h-5 px-1 ml-1 rounded-md">
                    Global
                  </Chip>
                </div>
              }
            >
              <div className="pt-2 animate-in fade-in duration-500 h-full flex flex-col">
                <TabConfiguracion />
              </div>
            </Tab>
          </Tabs>
        </div>

      </div>
    </div>
  );
};

export default Impresion;