import { useNavigate } from "react-router-dom";
import { Button, Card, CardBody, Chip, Tabs, Tab, Skeleton } from "@nextui-org/react";
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
    // CONTENEDOR PRINCIPAL: Pide padding (p-4 sm:p-6 lg:p-8) para dejar ese "espacio de separación" sutil
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20">

      {/* CONTENEDOR DE LA VISTA: 'w-full' (sin max-w) para que ocupe todo el espacio que le deja el padre */}
      <div className="w-full min-h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-6 sm:p-8 lg:p-10 flex flex-col gap-8">

        {/* ── 1. HEADER Y ESTADÍSTICAS ── */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          
          {/* Título de la vista */}
          <div className="flex gap-4 items-center shrink-0">
            <div className="p-3.5 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
              <HiPrinter className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-none">
                Impresión de Recibos
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 max-w-lg leading-relaxed">
                Configure, genere y administre la impresión de los recibos de agua para sus clientes.
              </p>
            </div>
          </div>

          {/* Tarjetas de Estadísticas (KPIs) - Se alinean a la derecha en pantallas grandes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full xl:w-auto shrink-0">
            {/* Tarjeta: Recibos */}
            <div className="flex flex-col justify-center p-4 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors">
              <div className="flex items-center gap-1.5 mb-2 text-slate-400 dark:text-zinc-500">
                <HiUsers className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Recibos</span>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-16 rounded-lg bg-slate-200 dark:bg-zinc-800" />
              ) : (
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400 leading-none">
                  {estadisticas.totalFacturas}
                </p>
              )}
            </div>

            {/* Tarjeta: Total ($) */}
            <div className="flex flex-col justify-center p-4 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors">
              <div className="flex items-center gap-1.5 mb-2 text-slate-400 dark:text-zinc-500">
                <HiCurrencyDollar className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Total</span>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-24 rounded-lg bg-slate-200 dark:bg-zinc-800" />
              ) : (
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                  ${estadisticas.totalMonto.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              )}
            </div>

            {/* Tarjeta: m³ Total */}
            <div className="flex flex-col justify-center p-4 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors">
              <div className="flex items-center gap-1.5 mb-2 text-slate-400 dark:text-zinc-500">
                <HiOutlinePresentationChartBar className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">m³ Total</span>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-20 rounded-lg bg-slate-200 dark:bg-zinc-800" />
              ) : (
                <p className="text-2xl font-black text-purple-600 dark:text-purple-400 leading-none">
                  {estadisticas.consumoTotal.toLocaleString('es-MX')}
                </p>
              )}
            </div>

            {/* Tarjeta: Promedio */}
            <div className="flex flex-col justify-center p-4 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors">
              <div className="flex items-center gap-1.5 mb-2 text-slate-400 dark:text-zinc-500">
                <HiOutlinePresentationChartLine className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Promedio</span>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-16 rounded-lg bg-slate-200 dark:bg-zinc-800" />
              ) : (
                <p className="text-2xl font-black text-orange-500 dark:text-orange-400 leading-none">
                  {estadisticas.promedioConsumo}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── 2. NAVEGACIÓN (TABS) Y CONTENIDO ── */}
        <div className="flex flex-col w-full flex-1 mt-4">
          <Tabs
            aria-label="Opciones de Impresión"
            selectedKey={selectedTab}
            onSelectionChange={handleTabChange}
            variant="underlined"
            classNames={{
              base: "w-full border-b border-slate-200 dark:border-zinc-800 mb-6",
              tabList: "gap-6 w-full relative rounded-none p-0",
              cursor: "w-full bg-blue-600 dark:bg-blue-500 h-0.5",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-blue-600 dark:group-data-[selected=true]:text-blue-400 group-data-[selected=true]:font-bold text-slate-500 dark:text-zinc-400 font-medium text-sm transition-colors",
            }}
          >
            {/* TAB: IMPRESIÓN */}
            <Tab
              key="impresion"
              title={
                <div className="flex items-center gap-2.5">
                  <HiPrinter className="w-5 h-5" />
                  <span>Impresión</span>
                  <Chip size="sm" variant="flat" className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold h-5 text-[10px] px-1 ml-1">
                    {estadisticas.totalFacturas}
                  </Chip>
                </div>
              }
            >
              <div className="animate-in fade-in duration-500">
                <TabImpresion />
              </div>
            </Tab>

            {/* TAB: REPORTES */}
            <Tab
              key="reportes"
              title={
                <div className="flex items-center gap-2.5">
                  <HiDocumentText className="w-5 h-5" />
                  <span>Reportes y Listas</span>
                </div>
              }
            >
              <div className="animate-in fade-in duration-500">
                <TabReportes />
              </div>
            </Tab>

            {/* TAB: CONFIGURACIÓN */}
            <Tab
              key="configuracion"
              title={
                <div className="flex items-center gap-2.5">
                  <HiCog className="w-5 h-5" />
                  <span>Configurar Anuncios</span>
                  <Chip size="sm" variant="flat" className="bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-[9px] h-5 px-1 ml-1">
                    Config
                  </Chip>
                </div>
              }
            >
              <div className="animate-in fade-in duration-500">
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
