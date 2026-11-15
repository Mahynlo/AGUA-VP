import { useNavigate } from "react-router-dom";
import { Skeleton } from "@heroui/react";
import { 
  HiPrinter,
  HiUsers, 
  HiDocumentText, 
  HiCog, 
  HiCurrencyDollar, 
  HiOutlinePresentationChartLine, 
  HiOutlinePresentationChartBar 
} from "react-icons/hi";
import { ImpresionResibosIcon } from "../../IconsApp/IconsResibos";
import React, { useMemo, useState } from "react";
import { useReportes } from "../../context/ReportesContext";
import TabImpresion from "./components/TabImpresion";
import TabConfiguracion from "./components/TabConfiguracion";
import TabReportes from "./components/TabReportes";
import { EncabezadoVista, PestanasVista, Indicador, IndicadoresVista, ProveedorIndicadores } from "../../components/ui/VistaModulo";

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

  const valorKpi = (contenido, ancho = "w-16") => (loading
    ? <Skeleton className={`h-7 ${ancho} rounded-lg bg-slate-200 dark:bg-zinc-800`} />
    : contenido);

  const tabs = [
    { key: "impresion", label: "Impresión General", icon: HiPrinter, contador: estadisticas.totalFacturas },
    { key: "reportes", label: "Reportes y Listas", icon: HiDocumentText },
    { key: "configuracion", label: "Configuración Visual", icon: HiCog, contador: "Global" }
  ];

  return (
    // CONTENEDOR PRINCIPAL: Padding exterior fluido y fondo gris sutil
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20 scroll-smooth">

      {/* CONTENEDOR DE LA VISTA (las pestañas colocan sus indicadores junto al título) */}
      <ProveedorIndicadores>
      <div className="w-full min-h-full min-w-0 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-5 sm:p-6 lg:p-8 flex flex-col">

        {/* ── 1. ENCABEZADO ── */}
        <EncabezadoVista
          icon={ImpresionResibosIcon}
          acento="indigo"
          titulo="Impresión de Recibos"
          descripcion="Emisión de recibos, reportes para imprimir y configuración de lo que llevan impreso."
        />

        {/* ── 2. NAVEGACIÓN (TABS) Y CONTENIDO ── */}
        <div className="flex flex-col w-full flex-1 min-w-0 mt-6">
          <PestanasVista tabs={tabs} activa={selectedTab} onChange={handleTabChange} acento="indigo" />

          {/* Indicadores del período (Impresión y Reportes); Configuración no lleva */}
          {selectedTab !== "configuracion" && (
            <IndicadoresVista>
              <Indicador icon={HiPrinter} tint="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" label="Recibos" value={valorKpi(estadisticas.totalFacturas.toLocaleString('es-MX'))} detalle="Recibos del período" />
              <Indicador icon={HiCurrencyDollar} tint="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" label="Facturado" value={valorKpi(`$${estadisticas.totalMonto.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, "w-24")} detalle="Importe total de los recibos del período" />
              <Indicador icon={HiOutlinePresentationChartBar} tint="bg-purple-500/10 text-purple-600 dark:text-purple-400" label="Consumo" value={valorKpi(estadisticas.consumoTotal.toLocaleString('es-MX'), "w-20")} sufijo={!loading && <span className="text-xs font-bold text-purple-400/80">m³</span>} detalle="Consumo total del período" />
              <Indicador icon={HiOutlinePresentationChartLine} tint="bg-orange-500/10 text-orange-600 dark:text-orange-400" label="Promedio" value={valorKpi(estadisticas.promedioConsumo)} sufijo={!loading && <span className="text-xs font-bold text-orange-400/80">m³</span>} detalle="Consumo promedio por recibo" />
            </IndicadoresVista>
          )}

          {/* CONTENIDOS */}
          {selectedTab === "impresion" && (
            <div className="h-full flex flex-col min-w-0">
              <TabImpresion />
            </div>
          )}

          {selectedTab === "reportes" && (
            <div className="h-full flex flex-col min-w-0">
              <TabReportes />
            </div>
          )}

          {selectedTab === "configuracion" && (
            <div className="h-full flex flex-col min-w-0">
              <TabConfiguracion />
            </div>
          )}
        </div>

      </div>
      </ProveedorIndicadores>
    </div>
  );
};

export default Impresion;