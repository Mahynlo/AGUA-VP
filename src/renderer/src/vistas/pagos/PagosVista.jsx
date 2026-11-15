import React, { useState, useMemo } from "react";
import { 
  HiCreditCard, 
  HiDocumentText, 
  HiChartBar, 
  HiTrendingUp, 
  HiUserGroup, 
  HiCash, 
  HiExclamation, 
  HiCurrencyDollar, 
  HiHand,
  HiCalculator
} from "react-icons/hi";
import { PagosIcon } from "../../IconsApp/IconsResibos";
import TabFacturas from "./components/TabFacturas";
import TabPagos from "./components/TabPagos";
import TabEstadisticas from "./components/TabEstadisticas";
// import TabDeudores from "./components/TabDeudores"; // oculto temporalmente (sin probar)
import TabCobranzaCliente from "./components/TabCobranzaCliente";
import { useFacturas } from "../../context/FacturasContext";
import { usePagos } from "../../context/PagosContext";
import { useDeudores } from "../../context/DeudoresContext";
import { useReportes } from "../../context/ReportesContext";
import { EncabezadoVista, PestanasVista, Indicador, IndicadoresVista, ProveedorIndicadores } from "../../components/ui/VistaModulo";

// Pestañas de la vista (Cobranza y Estadísticas colocan sus propios indicadores junto al título)
const TABS = [
  { key: "cobranza", label: "Cobranza", icon: HiCalculator },
  { key: "facturas", label: "Facturas", icon: HiDocumentText },
  { key: "pagos", label: "Pagos", icon: HiCreditCard },
  { key: "estadisticas", label: "Estadísticas", icon: HiChartBar }
];

const PagosVista = () => {
  // Estado para la pestaña activa
  const [selectedTab, setSelectedTab] = useState(() => {
    const saved = localStorage.getItem("pagos_activeTab");
    // El tab "deudores" está oculto temporalmente; si quedó guardado, caer a "cobranza".
    return saved && saved !== "deudores" ? saved : "cobranza";
  });

  // Consumir contextos
  const { estadisticas: statsFacturas } = useFacturas();
  const { resumen: statsPagos } = usePagos();
  const { estadisticas: statsDeudores } = useDeudores();
  const { financiero } = useReportes();

  // Estado sincronizado en vivo desde TabCobranzaCliente
  const [cobranzaStats, setCobranzaStats] = useState(null);

  const handleTabChange = (key) => {
    setSelectedTab(key);
    localStorage.setItem("pagos_activeTab", key);
  };

  // KPIs calculados con useMemo puro para evitar bucles o recargas
  const kpis = useMemo(() => {
    switch (selectedTab) {
      case "facturas":
        return {
          card1: {
            icon: HiCurrencyDollar,
            value: `$${(statsFacturas?.monto_total || financiero?.resumen?.total_esperado || 0).toLocaleString('es-MX')}`,
            label: "Facturado",
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
        };

      case "pagos":
        return {
          card1: {
            icon: HiCurrencyDollar,
            value: `$${(statsPagos?.total_pagado || financiero?.resumen?.total_recaudado || 0).toLocaleString('es-MX')}`,
            label: "Recaudado",
            color: "emerald"
          },
          card2: {
            icon: HiCash,
            value: (statsPagos?.cantidad_pagos || 0).toLocaleString('es-MX'),
            label: "Operaciones",
            color: "blue"
          },
          card3: {
            icon: HiChartBar,
            value: `$${(statsPagos?.promedio_pago || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`,
            label: "Promedio",
            color: "purple"
          },
          card4: {
            icon: HiTrendingUp,
            value: financiero?.resumen?.eficiencia_recaudo_porcentaje !== undefined 
              ? `${Number(financiero.resumen.eficiencia_recaudo_porcentaje).toFixed(0)}%`
              : "100%",
            label: "Efectividad",
            color: "teal"
          }
        };

      case "estadisticas":
        return {
          card1: {
            icon: HiCurrencyDollar,
            value: `$${(financiero?.resumen?.total_recaudado || statsPagos?.total_pagado || 0).toLocaleString('es-MX')}`,
            label: "Recaudado",
            color: "emerald"
          },
          card2: {
            icon: HiDocumentText,
            value: `$${(financiero?.resumen?.total_esperado || statsFacturas?.monto_total || 0).toLocaleString('es-MX')}`,
            label: "Esperado",
            color: "blue"
          },
          card3: {
            icon: HiExclamation,
            value: `$${(financiero?.resumen?.por_cobrar_estimado || statsFacturas?.monto_total_pendiente || 0).toLocaleString('es-MX')}`,
            label: "Por Cobrar",
            color: "orange"
          },
          card4: {
            icon: HiTrendingUp,
            value: financiero?.resumen?.eficiencia_recaudo_porcentaje !== undefined 
              ? `${Number(financiero.resumen.eficiencia_recaudo_porcentaje).toFixed(0)}%`
              : (statsPagos?.total_pagado ? "100%" : "0%"),
            label: "Eficiencia",
            color: "purple"
          }
        };

      case "deudores":
        return {
          card1: {
            icon: HiCurrencyDollar,
            value: `$${(statsDeudores?.totalDeuda || 0).toLocaleString('es-MX')}`,
            label: "Deuda",
            color: "rose"
          },
          card2: {
            icon: HiUserGroup,
            value: (statsDeudores?.criticos || 0).toLocaleString('es-MX'),
            label: "Críticos",
            color: "orange"
          },
          card3: {
            icon: HiDocumentText,
            value: (statsDeudores?.casosActivos || 0).toLocaleString('es-MX'),
            label: "Casos",
            color: "amber"
          },
          card4: {
            icon: HiHand,
            value: (statsDeudores?.convenios || 0).toLocaleString('es-MX'),
            label: "Convenios",
            color: "blue"
          }
        };

      case "cobranza":
      default: {
        const porCobrar = cobranzaStats?.deuda_total !== undefined
          ? cobranzaStats.deuda_total
          : (statsFacturas?.monto_total_pendiente || financiero?.resumen?.por_cobrar_estimado || statsDeudores?.totalDeuda || 0);

        const pendientes = cobranzaStats?.facturas_pendientes !== undefined
          ? cobranzaStats.facturas_pendientes
          : (statsFacturas?.cantidad_pendientes || statsDeudores?.totalDeudores || statsDeudores?.criticos || 0);

        const pagadas = cobranzaStats?.facturas_pagadas !== undefined
          ? cobranzaStats.facturas_pagadas
          : (statsFacturas?.cantidad_pagadas || statsPagos?.cantidad_pagos || 0);

        return {
          card1: {
            icon: HiCurrencyDollar,
            value: `$${porCobrar.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            label: "Por Cobrar",
            color: "rose"
          },
          card2: {
            icon: HiDocumentText,
            value: pendientes.toLocaleString('es-MX'),
            label: "Pendientes",
            color: "orange"
          },
          card3: {
            icon: HiCreditCard,
            value: pagadas.toLocaleString('es-MX'),
            label: "Pagadas",
            color: "emerald"
          },
          card4: {
            icon: HiCalculator,
            value: "FIFO",
            label: "Método",
            color: "blue"
          }
        };
      }
    }
  }, [selectedTab, statsFacturas, statsPagos, statsDeudores, financiero, cobranzaStats]);

  // Tintes de los indicadores
  const colorStyles = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
  };

  const KpiCard = ({ data }) => {
    if (!data) return null;
    return <Indicador icon={data.icon} tint={colorStyles[data.color] || colorStyles.blue} label={data.label} value={data.value} />;
  };

  return (
    // CONTENEDOR PRINCIPAL: Padding exterior fluido y fondo gris sutil
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20 scroll-smooth">

      {/* CONTENEDOR DE LA VISTA (las pestañas colocan sus indicadores junto al título) */}
      <ProveedorIndicadores>
      <div className="w-full min-h-full min-w-0 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-5 sm:p-6 lg:p-8 flex flex-col">

        {/* ── 1. ENCABEZADO ── */}
        <EncabezadoVista
          icon={PagosIcon}
          acento="emerald"
          titulo="Gestión de Pagos"
          descripcion="Cobranza por cliente, facturas, pagos recibidos y estado financiero."
        />

        {/* ── 2. NAVEGACIÓN (TABS) Y CONTENIDO ── */}
        <div className="flex flex-col w-full flex-1 min-w-0 mt-6">
          <PestanasVista tabs={TABS} activa={selectedTab} onChange={handleTabChange} acento="emerald" />

          {/* Indicadores de Facturas y Pagos (Cobranza y Estadísticas colocan los suyos) */}
          {(selectedTab === "facturas" || selectedTab === "pagos") && (
            <IndicadoresVista>
              <KpiCard data={kpis.card1} />
              <KpiCard data={kpis.card2} />
              <KpiCard data={kpis.card3} />
              <KpiCard data={kpis.card4} />
            </IndicadoresVista>
          )}

          {/* CONTENIDOS */}
          {selectedTab === "cobranza" && (
            <div className="h-full flex flex-col min-w-0">
              <TabCobranzaCliente onCobranzaStatsChange={setCobranzaStats} />
            </div>
          )}

          {selectedTab === "facturas" && (
            <div className="h-full flex flex-col min-w-0">
              <TabFacturas />
            </div>
          )}

          {selectedTab === "pagos" && (
            <div className="h-full flex flex-col min-w-0">
              <TabPagos />
            </div>
          )}

          {selectedTab === "estadisticas" && (
            <div className="h-full flex flex-col min-w-0">
              <TabEstadisticas />
            </div>
          )}
        </div>

      </div>
      </ProveedorIndicadores>
    </div>
  );
};

export default PagosVista;