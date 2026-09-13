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
import TabFacturas from "./pagos/TabFacturas";
import TabPagos from "./pagos/TabPagos";
import TabEstadisticas from "./pagos/TabEstadisticas";
// import TabDeudores from "./pagos/TabDeudores"; // oculto temporalmente (sin probar)
import TabCobranzaCliente from "./pagos/TabCobranzaCliente";
import { useFacturas } from "../../context/FacturasContext";
import { usePagos } from "../../context/PagosContext";
import { useDeudores } from "../../context/DeudoresContext";
import { useReportes } from "../../context/ReportesContext";

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

  // Helper para renderizar card Premium SaaS
  const KpiCard = ({ data }) => {
    if (!data) return null;
    const Icon = data.icon;
    
    // Mapeo de tintes dinámicos
    const colorStyles = {
      blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
      rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
      amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
    };

    const tintClasses = colorStyles[data.color] || colorStyles.blue;

    return (
      <div className="flex flex-col justify-center p-5 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl transition-transform hover:-translate-y-1 gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">{data.label}</span>
          <div className={`p-1.5 rounded-lg ${tintClasses}`}>
            {Icon && <Icon className="w-4 h-4" />}
          </div>
        </div>
        <p className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">
          {data.value}
        </p>
      </div>
    );
  };

  return (
    // CONTENEDOR PRINCIPAL: Padding exterior fluido y fondo gris sutil
    <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:p-6 lg:p-8 sm:ml-24 bg-slate-50 dark:bg-black/20 scroll-smooth">

      {/* CONTENEDOR DE LA VISTA: 'w-full min-h-full' para ocupar todo el espacio disponible */}
      <div className="w-full min-h-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[2rem] shadow-sm p-6 sm:p-8 lg:p-10 flex flex-col gap-10 animate-in fade-in duration-500">

        {/* ── 1. HEADER Y ESTADÍSTICAS ── */}
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-8">
          
          {/* Título de la vista */}
          <div className="flex gap-4 items-start shrink-0">
            {/* Regla de Tintes (Esmeralda Corporativo para Pagos) */}
            <div className="p-3.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0 flex items-center justify-center">
              <PagosIcon className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1 pt-0.5">
              {/* Token 3: Textos Principales */}
              <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-none">
                Gestión de Pagos
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 max-w-lg mt-1 leading-relaxed">
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
        <div className="flex flex-col w-full flex-1 mt-2">
          {/* Pestañas de Navegación SaaS - Tema Esmeralda */}
          <div className="w-full border-b border-slate-200 dark:border-zinc-800 mb-6">
            <nav className="flex gap-6 w-full -mb-px">
              {/* TAB: COBRANZA */}
              <button
                type="button"
                onClick={() => handleTabChange("cobranza")}
                className={`flex items-center gap-2.5 py-3 text-sm border-b-2 transition-colors cursor-pointer shrink-0 ${
                  selectedTab === "cobranza"
                    ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
                }`}
              >
                <HiCalculator className="text-lg" />
                <span>Cobranza</span>
              </button>

              {/* TAB: FACTURAS */}
              <button
                type="button"
                onClick={() => handleTabChange("facturas")}
                className={`flex items-center gap-2.5 py-3 text-sm border-b-2 transition-colors cursor-pointer shrink-0 ${
                  selectedTab === "facturas"
                    ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
                }`}
              >
                <HiDocumentText className="text-lg" />
                <span>Facturas</span>
              </button>

              {/* TAB: PAGOS */}
              <button
                type="button"
                onClick={() => handleTabChange("pagos")}
                className={`flex items-center gap-2.5 py-3 text-sm border-b-2 transition-colors cursor-pointer shrink-0 ${
                  selectedTab === "pagos"
                    ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
                }`}
              >
                <HiCreditCard className="text-lg" />
                <span>Pagos</span>
              </button>

              {/* TAB: ESTADÍSTICAS */}
              <button
                type="button"
                onClick={() => handleTabChange("estadisticas")}
                className={`flex items-center gap-2.5 py-3 text-sm border-b-2 transition-colors cursor-pointer shrink-0 ${
                  selectedTab === "estadisticas"
                    ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
                }`}
              >
                <HiChartBar className="text-lg" />
                <span>Estadísticas</span>
              </button>
            </nav>
          </div>

          {/* CONTENIDOS */}
          {selectedTab === "cobranza" && (
            <div className="pt-2 animate-in fade-in duration-500 h-full flex flex-col">
              <TabCobranzaCliente onCobranzaStatsChange={setCobranzaStats} />
            </div>
          )}

          {selectedTab === "facturas" && (
            <div className="pt-2 animate-in fade-in duration-500 h-full flex flex-col">
              <TabFacturas />
            </div>
          )}

          {selectedTab === "pagos" && (
            <div className="pt-2 animate-in fade-in duration-500 h-full flex flex-col">
              <TabPagos />
            </div>
          )}

          {selectedTab === "estadisticas" && (
            <div className="pt-2 animate-in fade-in duration-500 h-full flex flex-col">
              <TabEstadisticas />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PagosVista;