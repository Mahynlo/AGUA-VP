import { useCallback, useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import {
  HiCalendar,
  HiChartBar,
  HiCheckCircle,
  HiChevronDown,
  HiMap,
  HiPrinter,
  HiTrendingDown,
  HiTrendingUp,
} from "react-icons/hi";

import SelectorPeriodoAvanzado from "../../../components/ui/SelectorPeriodoAvanzado";
import ModalImprimir from "../../../components/impresion/ModalImprimir";
import { useRutas } from "../../../context/RutasContext";
import {
  generarCatalogoPeriodos,
  obtenerPeriodoActual,
} from "../../../utils/periodoUtils";
import { useTheme } from "@renderer/theme/useTheme";
import { preloadPdfViewer } from "../../../utils/pdfPreloader";
import { EncabezadoSeccion, Indicador, IndicadoresVista } from "../../../components/ui/VistaModulo";

const formatearNumero = (valor, decimales = 0) => {
  const n = Number(valor || 0);
  return n.toLocaleString("es-MX", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
};

const formatearMesCorto = (periodoMes) => {
  if (!periodoMes || !/^\d{4}-\d{2}$/.test(periodoMes)) return periodoMes || "";
  const [anio, mes] = periodoMes.split("-");
  const fecha = new Date(Number(anio), Number(mes) - 1, 1);
  return fecha
    .toLocaleDateString("es-MX", { month: "short" })
    .replace(".", "")
    .toLowerCase();
};

const selectClasses = {
  trigger:
    "bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-none h-[52px] focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-zinc-100/10 focus:outline-none focus:border-slate-400 dark:focus:border-zinc-500",
  value: "font-medium text-slate-800 dark:text-zinc-100 text-sm",
};

const MetricasLecturasEstado = () => {
  const { rutas, initialLoading, siguientePeriodo, periodosInfo, ultimoPeriodoRegistrado } = useRutas();
  const { theme } = useTheme();

  // Precarga del visor PDF
  useEffect(() => {
    preloadPdfViewer();
  }, []);

  const [vista, setVista] = useState("consumo");
  const [tipoFiltro, setTipoFiltro] = useState("periodo");
  const [periodo, setPeriodo] = useState(() => siguientePeriodo || obtenerPeriodoActual());

  useEffect(() => {
    if (siguientePeriodo) {
      setPeriodo(siguientePeriodo);
    }
  }, [siguientePeriodo]);
  const [ultimosMeses, setUltimosMeses] = useState("3");
  const [anioEspecifico, setAnioEspecifico] = useState(
    String(new Date().getFullYear()),
  );

  const [loadingConsumo, setLoadingConsumo] = useState(false);
  const [errorConsumo, setErrorConsumo] = useState("");
  const [reporteConsumo, setReporteConsumo] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [printUrl, setPrintUrl] = useState(null);
  const [modoPdf, setModoPdf] = useState(null);
  const [loadingImprimir, setLoadingImprimir] = useState(false);

  const isDark = useMemo(() => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return theme === "dark";
  }, [theme]);

  const opcionesAnio = useMemo(() => {
    const catalogo = generarCatalogoPeriodos({ startYear: 2020 });
    return [...new Set(catalogo.map((item) => item.year))];
  }, []);

  const filtrosActivos = useMemo(() => {
    if (tipoFiltro === "periodo") {
      return { tipo: "periodo", periodo };
    }
    if (tipoFiltro === "ultimos_meses") {
      return { tipo: "ultimos_meses", meses: Number(ultimosMeses || 3) };
    }
    return { tipo: "anio", anio: anioEspecifico };
  }, [tipoFiltro, periodo, ultimosMeses, anioEspecifico]);

  const cargarReporteConsumo = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setErrorConsumo("No se encontró token de sesión.");
      setReporteConsumo(null);
      return;
    }

    setLoadingConsumo(true);
    setErrorConsumo("");

    try {
      const data = await window.api.fetchReporteConsumoAgua(token, filtrosActivos);
      setReporteConsumo(data || null);
    } catch (error) {
      console.error("Error cargando métricas de consumo:", error);
      setErrorConsumo(error?.message || "No se pudo cargar el reporte de consumo.");
      setReporteConsumo(null);
    } finally {
      setLoadingConsumo(false);
    }
  }, [filtrosActivos]);

  useEffect(() => {
    cargarReporteConsumo();
  }, [cargarReporteConsumo]);

  const estadisticasRutas = useMemo(() => {
    if (initialLoading || !rutas.length) {
      return {
        totalRutas: 0,
        rutasCompletadas: 0,
        rutasEnProgreso: 0,
        rutasSinIniciar: 0,
        promedioCompletado: 0,
        totalPuntos: 0,
        puntosCompletados: 0,
        mejorRuta: null,
        peorRuta: null,
        distribucionPorEstado: [],
      };
    }

    const rutasCompletadas = rutas.filter((r) => r.completadas === r.total_puntos && r.total_puntos > 0);
    const rutasEnProgreso = rutas.filter((r) => r.completadas > 0 && r.completadas < r.total_puntos);
    const rutasSinIniciar = rutas.filter((r) => r.completadas === 0);

    const totalPuntos = rutas.reduce((acc, r) => acc + (r.total_puntos || 0), 0);
    const puntosCompletados = rutas.reduce((acc, r) => acc + (r.completadas || 0), 0);
    const promedioCompletado = totalPuntos > 0 ? Math.round((puntosCompletados / totalPuntos) * 100) : 0;

    const rutasConDatos = rutas.filter((r) => r.total_puntos > 0);
    const mejorRuta =
      rutasConDatos.length > 0
        ? rutasConDatos.reduce((max, r) => {
            const porcentaje = (r.completadas / r.total_puntos) * 100;
            const maxPorcentaje = (max.completadas / max.total_puntos) * 100;
            return porcentaje > maxPorcentaje ? r : max;
          })
        : null;

    const peorRuta =
      rutasConDatos.length > 0
        ? rutasConDatos.reduce((min, r) => {
            const porcentaje = (r.completadas / r.total_puntos) * 100;
            const minPorcentaje = (min.completadas / min.total_puntos) * 100;
            return porcentaje < minPorcentaje ? r : min;
          })
        : null;

    return {
      totalRutas: rutas.length,
      rutasCompletadas: rutasCompletadas.length,
      rutasEnProgreso: rutasEnProgreso.length,
      rutasSinIniciar: rutasSinIniciar.length,
      promedioCompletado,
      totalPuntos,
      puntosCompletados,
      mejorRuta,
      peorRuta,
      distribucionPorEstado: [
        { name: "Completadas", value: rutasCompletadas.length, color: "#10B981" },
        { name: "En Progreso", value: rutasEnProgreso.length, color: "#F59E0B" },
        { name: "Sin Iniciar", value: rutasSinIniciar.length, color: "#EF4444" },
      ],
    };
  }, [rutas, initialLoading]);

  const resumenConsumo = reporteConsumo?.resumen || {};
  const consumoMensual = reporteConsumo?.series?.consumo_mensual || [];
  const topConsumidores = reporteConsumo?.listados?.top_consumidores || [];
  const menorConsumo = reporteConsumo?.listados?.menor_consumo || [];
  const distribucionRutasConsumo = reporteConsumo?.distribucion_rutas || [];

  const topConsumidor = topConsumidores[0] || null;
  const menorConsumidor = menorConsumo[0] || null;

  const tituloAnioTendencia = useMemo(() => {
    const years = [
      ...new Set(
        consumoMensual.map((m) => String(m.periodo || "").slice(0, 4)).filter(Boolean),
      ),
    ];
    if (years.length === 0) return "Año";
    if (years.length === 1) return years[0];
    return `${years[0]} - ${years[years.length - 1]}`;
  }, [consumoMensual]);

  const chartConsumoMensual = useMemo(() => {
    const ejeColor = isDark ? "#71717a" : "#94a3b8";
    const ejeBold = isDark ? "#d4d4d8" : "#334155";
    return {
      series: [
        {
          name: "Consumo total (m³)",
          type: "column",
          data: consumoMensual.map((r) => Number(r.consumo_total_m3 || 0)),
        },
        {
          name: "Recibos",
          type: "line",
          data: consumoMensual.map((r) => Number(r.recibos || 0)),
        },
      ],
      options: {
        chart: {
          type: "line",
          stacked: false,
          toolbar: { show: false },
          background: "transparent",
          fontFamily: "inherit",
          foreColor: ejeColor,
        },
        theme: { mode: isDark ? "dark" : "light" },
        grid: {
          borderColor: isDark ? "#27272a" : "#f1f5f9",
          strokeDashArray: 4,
        },
        plotOptions: {
          bar: { horizontal: false, borderRadius: 4, columnWidth: "48%" },
        },
        stroke: { width: [0, 3], curve: "smooth" },
        colors: ["#0ea5e9", "#6366f1"],
        xaxis: {
          categories: consumoMensual.map((r) => formatearMesCorto(r.periodo)),
          labels: {
            style: {
              colors: ejeColor,
              fontSize: "10px",
              fontWeight: 700,
              cssClass: "uppercase tracking-widest",
            },
          },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: [
          {
            title: {
              text: "m³",
              style: { color: ejeColor, fontSize: "10px", fontWeight: 700 },
            },
            labels: {
              style: { colors: ejeColor, fontSize: "12px", fontWeight: 500 },
            },
          },
          {
            opposite: true,
            title: {
              text: "Recibos",
              style: { color: ejeColor, fontSize: "10px", fontWeight: 700 },
            },
            labels: {
              style: { colors: ejeColor, fontSize: "12px", fontWeight: 500 },
            },
          },
        ],
        dataLabels: { enabled: false },
        legend: {
          position: "top",
          fontWeight: 600,
          labels: { colors: ejeBold },
        },
        tooltip: { theme: isDark ? "dark" : "light" },
      },
    };
  }, [consumoMensual, isDark]);

  const chartDistribucionRutas = useMemo(() => {
    const topRutas = distribucionRutasConsumo.slice(0, 8);
    return {
      series: topRutas.map((r) => Number(r.consumo_total_m3 || 0)),
      options: {
        chart: { type: "donut", background: "transparent", fontFamily: "inherit" },
        labels: topRutas.map((r) => r.ruta_nombre),
        colors: [
          "#0ea5e9",
          "#22c55e",
          "#f59e0b",
          "#ef4444",
          "#6366f1",
          "#14b8a6",
          "#f97316",
          "#a855f7",
        ],
        legend: {
          position: "bottom",
          fontWeight: 500,
          labels: { colors: isDark ? "#d4d4d8" : "#334155" },
        },
        dataLabels: {
          enabled: true,
          style: { fontSize: "12px", fontWeight: "bold" },
          formatter: (val) => `${Math.round(val)}%`,
        },
        stroke: { show: false },
        tooltip: { theme: isDark ? "dark" : "light" },
      },
    };
  }, [distribucionRutasConsumo, isDark]);

  const chartEstadosRutas = useMemo(() => {
    return {
      series: estadisticasRutas.distribucionPorEstado.map((d) => d.value),
      options: {
        chart: { type: "donut", background: "transparent", fontFamily: "inherit" },
        labels: estadisticasRutas.distribucionPorEstado.map((d) => d.name),
        colors: estadisticasRutas.distribucionPorEstado.map((d) => d.color),
        legend: {
          position: "bottom",
          fontWeight: 500,
          labels: { colors: isDark ? "#d4d4d8" : "#334155" },
        },
        dataLabels: {
          enabled: true,
          style: { fontSize: "12px", fontWeight: "bold" },
          formatter: (val) => `${Math.round(val)}%`,
        },
        stroke: { show: false },
        tooltip: { theme: isDark ? "dark" : "light" },
      },
    };
  }, [estadisticasRutas, isDark]);

  const etiquetaFiltro = reporteConsumo?.filtro_aplicado?.etiqueta || "Sin filtro";

  const construirUrlReporteLecturasMetricas = useCallback(async () => {
    if (!reporteConsumo) return null;

    const payload = {
      titulo: "Reporte de Métricas de Lecturas",
      filtro_aplicado: reporteConsumo.filtro_aplicado || {},
      consumo: {
        resumen: resumenConsumo,
        series: { consumo_mensual: consumoMensual },
        listados: {
          menor_consumo: menorConsumo,
        },
        distribucion_rutas: distribucionRutasConsumo,
      },
      rutas: {
        resumen: {
          total_rutas: estadisticasRutas.totalRutas,
          rutas_completadas: estadisticasRutas.rutasCompletadas,
          rutas_en_progreso: estadisticasRutas.rutasEnProgreso,
          rutas_sin_iniciar: estadisticasRutas.rutasSinIniciar,
          promedio_completado: estadisticasRutas.promedioCompletado,
          total_puntos: estadisticasRutas.totalPuntos,
          puntos_completados: estadisticasRutas.puntosCompletados,
        },
      },
      generated_at: new Date().toISOString(),
    };

    const dataKey = await window.api.savePrintData(JSON.stringify(payload));
    const { protocol, origin, href } = window.location;
    const params = `print=true&dataKey=${dataKey}`;

    if (protocol === "file:") {
      const base = href.split("#")[0];
      return `${base}#/reporteLecturasMetricas?${params}`;
    }

    return `${origin}/#/reporteLecturasMetricas?${params}`;
  }, [
    reporteConsumo,
    resumenConsumo,
    consumoMensual,
    menorConsumo,
    distribucionRutasConsumo,
    estadisticasRutas,
  ]);

  const handlePrint = async () => {
    const url = await construirUrlReporteLecturasMetricas();
    if (!url) return;

    setLoadingImprimir(true);
    try {
      const response = await window.api.previewComponent(url, { pageNumbers: true });
      if (response && response.success && response.path) {
        setPrintUrl(url);
        setPdfUrl(response.path);
        setModoPdf("imprimir");
      }
    } catch (error) {
      console.error("Error preparando impresión de métricas de lecturas:", error);
      alert("No se pudo preparar la impresión del reporte de métricas.");
    } finally {
      setLoadingImprimir(false);
    }
  };

  return (
    <div className="w-full animate-in fade-in duration-500 print:bg-white">

      {/* ── INDICADORES (junto al título del módulo): avance de las rutas ── */}
      <IndicadoresVista>
        <Indicador icon={HiMap} tint="bg-amber-500/10 text-amber-600 dark:text-amber-400" label="Rutas activas" value={formatearNumero(estadisticasRutas.totalRutas)} />
        <Indicador icon={HiCheckCircle} tint="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" label="Rutas completadas" value={formatearNumero(estadisticasRutas.rutasCompletadas)} valueClass="text-emerald-600 dark:text-emerald-400" />
        <Indicador icon={HiChartBar} tint="bg-orange-500/10 text-orange-600 dark:text-orange-400" label="En progreso" value={formatearNumero(estadisticasRutas.rutasEnProgreso)} valueClass="text-orange-600 dark:text-orange-400" />
        <Indicador icon={HiTrendingUp} tint="bg-blue-500/10 text-blue-600 dark:text-blue-400" label="Avance operativo" value={`${estadisticasRutas.promedioCompletado}%`}>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${estadisticasRutas.promedioCompletado}%` }} />
          </div>
        </Indicador>
      </IndicadoresVista>

      {/* ── SUBTÍTULO DE LA PESTAÑA ── */}
      <div className="mb-5 print:mb-4">
        <EncabezadoSeccion
          icon={HiChartBar}
          titulo="Métricas de lecturas"
          descripcion="Consumo de agua potable y rendimiento operativo por rutas."
        >
          <div className="border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 font-semibold text-xs rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-900/50 print:hidden" title="Rango que se está mostrando">
            <HiCalendar className="w-4 h-4" />
            <span>{etiquetaFiltro}</span>
          </div>
        </EncabezadoSeccion>
      </div>

      {/* ── FILTER CONTROLS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-5 items-end print:hidden relative z-30 p-4 rounded-2xl bg-slate-50/60 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800">

        <div className="lg:col-span-3 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 ml-1">
            Vista del Reporte
          </label>
          <div className="relative">
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value || "periodo")}
              aria-label="Tipo de filtro"
              className="w-full h-11 pl-4 pr-10 text-sm font-semibold rounded-xl bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
            >
              <option value="periodo">Periodo puntual</option>
              <option value="ultimos_meses">Últimos meses</option>
              <option value="anio">Año específico</option>
            </select>
            <HiChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col gap-1.5">
          {tipoFiltro === "periodo" && (
            <>
              <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 ml-1">
                Seleccionar Periodo
              </label>
              <SelectorPeriodoAvanzado
                value={periodo}
                onChange={setPeriodo}
                placeholder="Seleccionar periodo"
                className="h-11 w-full"
                periodosInfo={periodosInfo}
                siguientePeriodo={siguientePeriodo}
                ultimoPeriodoRegistrado={ultimoPeriodoRegistrado}
              />
            </>
          )}

          {tipoFiltro === "ultimos_meses" && (
            <>
              <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 ml-1">
                Rango de meses
              </label>
              <div className="relative">
                <select
                  value={ultimosMeses}
                  onChange={(e) => setUltimosMeses(e.target.value || "3")}
                  aria-label="Últimos meses"
                  className="w-full h-11 pl-4 pr-10 text-sm font-semibold rounded-xl bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
                >
                  <option value="3">Últimos 3 meses</option>
                  <option value="6">Últimos 6 meses</option>
                  <option value="12">Últimos 12 meses</option>
                </select>
                <HiChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </>
          )}

          {tipoFiltro === "anio" && (
            <>
              <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 ml-1">
                Año Fiscal
              </label>
              <div className="relative">
                <select
                  value={anioEspecifico}
                  onChange={(e) =>
                    setAnioEspecifico(e.target.value || String(new Date().getFullYear()))
                  }
                  aria-label="Año específico"
                  className="w-full h-11 pl-4 pr-10 text-sm font-semibold rounded-xl bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
                >
                  {opcionesAnio.map((anio) => (
                    <option key={anio} value={anio}>{anio}</option>
                  ))}
                </select>
                <HiChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-3 flex items-end h-11">
          <button
            type="button"
            className="w-full font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl h-full shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-2 text-xs disabled:opacity-50 cursor-pointer"
            onClick={handlePrint}
            disabled={!reporteConsumo || loadingConsumo || loadingImprimir}
          >
            {loadingImprimir ? (
              <div className="w-4 h-4 rounded-full border-2 border-white dark:border-zinc-950 border-t-transparent animate-spin" />
            ) : (
              <HiPrinter className="text-lg" />
            )}
            <span>{loadingImprimir ? "Preparando..." : "Imprimir Reporte"}</span>
          </button>
        </div>
      </div>

      {/* ── VISTA TOGGLE (consumo / rutas) ── */}
      <div className="inline-flex items-center gap-1 p-1 mb-5 rounded-xl bg-slate-200/50 dark:bg-zinc-800/60 print:hidden" role="group" aria-label="Sección del reporte">
        <button
          type="button"
          onClick={() => setVista("consumo")}
          aria-pressed={vista === "consumo"}
          className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
            vista === "consumo"
              ? "bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 shadow-sm"
              : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
          }`}
        >
          Consumo de agua
        </button>
        <button
          type="button"
          onClick={() => setVista("rutas")}
          aria-pressed={vista === "rutas"}
          className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
            vista === "rutas"
              ? "bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 shadow-sm"
              : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
          }`}
        >
          Rutas y distribución
        </button>
      </div>

      {errorConsumo && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 mb-8 print:hidden flex items-center gap-3">
          <div className="p-2 bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg">
            <HiTrendingDown className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-red-700 dark:text-red-400">{errorConsumo}</p>
        </div>
      )}

      {loadingConsumo && !reporteConsumo ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 print:hidden">
          <div className="w-8 h-8 rounded-full border-3 border-slate-900 dark:border-zinc-100 border-t-transparent animate-spin" />
          <span className="text-sm font-semibold text-slate-500 dark:text-zinc-400">
            Generando métricas de consumo...
          </span>
        </div>
      ) : (
        <>
          {/* ── VISTA: CONSUMO ── */}
          {vista === "consumo" && (
            <div className="space-y-5">

              {/* KPIs Grid */}
              <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 print:grid-cols-5 print:gap-2">
                <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 print:border-none print:bg-transparent print:p-2 flex flex-col gap-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Recibos</p>
                  <p className="text-2xl font-black tracking-tight tabular-nums text-slate-800 dark:text-zinc-100">{formatearNumero(resumenConsumo.total_recibos)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 print:border-none print:bg-transparent print:p-2 flex flex-col gap-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Agua consumida</p>
                  <p className="text-2xl font-black tracking-tight tabular-nums text-slate-800 dark:text-zinc-100 flex items-baseline gap-1">
                    {formatearNumero(resumenConsumo.consumo_total_m3, 2)} <span className="text-sm font-bold text-slate-400">m³</span>
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 print:border-none print:bg-transparent print:p-2 flex flex-col gap-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Promedio por recibo</p>
                  <p className="text-2xl font-black tracking-tight tabular-nums text-slate-800 dark:text-zinc-100 flex items-baseline gap-1">
                    {formatearNumero(resumenConsumo.consumo_promedio_m3, 2)} <span className="text-sm font-bold text-slate-400">m³</span>
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 print:border-none print:bg-transparent print:p-2 flex flex-col gap-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Clientes analizados</p>
                  <p className="text-2xl font-black tracking-tight tabular-nums text-slate-800 dark:text-zinc-100">{formatearNumero(resumenConsumo.total_clientes)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 print:border-none print:bg-transparent print:p-2 flex flex-col gap-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Promedio por cliente</p>
                  <p className="text-2xl font-black tracking-tight tabular-nums text-slate-800 dark:text-zinc-100 flex items-baseline gap-1">
                    {formatearNumero(resumenConsumo.promedio_consumo_por_cliente_m3, 2)} <span className="text-sm font-bold text-slate-400">m³</span>
                  </p>
                </div>
              </div>

              {/* Charts & Highlights Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 print:block">

                <div className="xl:col-span-2 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 print:border-none print:bg-transparent print:p-0 print:mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <p className="text-sm font-bold text-slate-700 dark:text-zinc-200">Tendencia de consumo y recibos</p>
                    <span className="text-slate-300 dark:text-zinc-700">•</span>
                    <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">{tituloAnioTendencia}</p>
                  </div>
                  {consumoMensual.length > 0 ? (
                    <Chart options={chartConsumoMensual.options} series={chartConsumoMensual.series} type="line" height={320} />
                  ) : (
                    <div className="h-[320px] flex items-center justify-center text-sm font-bold text-slate-400 dark:text-zinc-600">
                      Sin datos para el rango seleccionado.
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><HiTrendingUp className="w-5 h-5" /></div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Mayor consumo</span>
                    </div>
                    {topConsumidor ? (
                      <>
                        <p className="text-base font-black text-slate-800 dark:text-zinc-100 truncate mb-1">{topConsumidor.cliente_nombre}</p>
                        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                          <span className="font-bold text-slate-700 dark:text-zinc-300">{formatearNumero(topConsumidor.consumo_total_m3, 2)} m³</span> en {formatearNumero(topConsumidor.recibos)} recibos
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-medium text-slate-400 dark:text-zinc-600">Sin datos disponibles.</p>
                    )}
                  </div>

                  <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400"><HiTrendingDown className="w-5 h-5" /></div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Menor consumo</span>
                    </div>
                    {menorConsumidor ? (
                      <>
                        <p className="text-base font-black text-slate-800 dark:text-zinc-100 truncate mb-1">{menorConsumidor.cliente_nombre}</p>
                        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                          <span className="font-bold text-slate-700 dark:text-zinc-300">{formatearNumero(menorConsumidor.consumo_total_m3, 2)} m³</span> en {formatearNumero(menorConsumidor.recibos)} recibos
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-medium text-slate-400 dark:text-zinc-600">Sin datos disponibles.</p>
                    )}
                  </div>

                  <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400"><HiMap className="w-5 h-5" /></div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Rutas con consumo</span>
                    </div>
                    <p className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100">{formatearNumero(distribucionRutasConsumo.length)}</p>
                  </div>
                </div>
              </div>

              {/* Tabla: Menor consumo */}
              <div>
                <div className="bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 print:border-none print:bg-transparent print:p-0">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-slate-700 dark:text-zinc-200">Clientes con menor consumo</p>
                    <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5">
                      <HiTrendingDown className="w-3 h-3" />
                      {menorConsumo.length}
                    </div>
                  </div>
                  <div className="max-h-[350px] overflow-auto print:max-h-none scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent pr-2">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 z-10 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-zinc-500">
                        <tr>
                          <th className="py-2.5 px-2">Cliente</th>
                          <th className="py-2.5 px-2">Localidad</th>
                          <th className="py-2.5 px-2">Recibos</th>
                          <th className="py-2.5 px-2 text-right">Consumo (m³)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                        {(!menorConsumo || menorConsumo.length === 0) ? (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-sm font-medium text-slate-400 dark:text-zinc-500">Sin datos</td>
                          </tr>
                        ) : (
                          menorConsumo.map((item) => (
                            <tr key={item.cliente_id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/30 transition-colors">
                              <td className="py-2.5 px-2 font-bold text-slate-800 dark:text-zinc-100">{item.cliente_nombre}</td>
                              <td className="py-2.5 px-2 text-slate-600 dark:text-zinc-300">{item.localidad || "-"}</td>
                              <td className="py-2.5 px-2 text-slate-600 dark:text-zinc-300">{formatearNumero(item.recibos)}</td>
                              <td className="py-2.5 px-2 font-black tracking-tight text-slate-800 dark:text-zinc-100 text-right">{formatearNumero(item.consumo_total_m3, 2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── VISTA: RUTAS ── */}
          {vista === "rutas" && (
            <div className="space-y-5">

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 print:block">
                <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 print:border-none print:bg-transparent print:p-0 print:mb-6">
                  <p className="text-sm font-bold text-slate-700 dark:text-zinc-200 mb-4">Distribución operativa de rutas</p>
                  {estadisticasRutas.totalRutas > 0 ? (
                    <Chart options={chartEstadosRutas.options} series={chartEstadosRutas.series} type="donut" height={320} />
                  ) : (
                    <div className="h-[320px] flex items-center justify-center text-sm font-bold text-slate-400 dark:text-zinc-600">No hay rutas disponibles.</div>
                  )}
                </div>

                <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 print:border-none print:bg-transparent print:p-0">
                  <p className="text-sm font-bold text-slate-700 dark:text-zinc-200 mb-4">Distribución de consumo por ruta</p>
                  {distribucionRutasConsumo.length > 0 ? (
                    <Chart options={chartDistribucionRutas.options} series={chartDistribucionRutas.series} type="donut" height={320} />
                  ) : (
                    <div className="h-[320px] flex items-center justify-center text-sm font-bold text-slate-400 dark:text-zinc-600">Sin consumo facturado para el rango seleccionado.</div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 print:border-none print:bg-transparent print:p-0">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-slate-700 dark:text-zinc-200">Consumo por ruta</p>
                  <div className="bg-slate-500/10 text-slate-600 dark:text-zinc-300 font-bold text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5">
                    <HiMap className="w-3 h-3" />
                    {distribucionRutasConsumo.length}
                  </div>
                </div>
                <div className="max-h-[360px] overflow-auto print:max-h-none scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent pr-2">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-zinc-500">
                      <tr>
                        <th className="py-2.5 px-2">Ruta</th>
                        <th className="py-2.5 px-2">Recibos</th>
                        <th className="py-2.5 px-2 text-right">Consumo total (m³)</th>
                        <th className="py-2.5 px-2 text-right">Promedio (m³)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                      {(!distribucionRutasConsumo || distribucionRutasConsumo.length === 0) ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-sm font-medium text-slate-400 dark:text-zinc-500">Sin datos</td>
                        </tr>
                      ) : (
                        distribucionRutasConsumo.map((item) => (
                          <tr key={`${item.ruta_id}-${item.ruta_nombre}`} className="hover:bg-slate-50 dark:hover:bg-zinc-900/30 transition-colors">
                            <td className="py-2.5 px-2 font-bold text-slate-800 dark:text-zinc-100">{item.ruta_nombre}</td>
                            <td className="py-2.5 px-2 text-slate-600 dark:text-zinc-300">{formatearNumero(item.recibos)}</td>
                            <td className="py-2.5 px-2 font-black tracking-tight text-slate-800 dark:text-zinc-100 text-right">{formatearNumero(item.consumo_total_m3, 2)}</td>
                            <td className="py-2.5 px-2 font-bold text-right text-slate-600 dark:text-zinc-300">{formatearNumero(item.consumo_promedio_m3, 2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {pdfUrl && modoPdf && (
        <ModalImprimir
          pdfUrl={pdfUrl}
          printUrl={printUrl}
          onClose={() => {
            setPdfUrl(null);
            setPrintUrl(null);
            setModoPdf(null);
          }}
          initialMode="print"
        />
      )}
    </div>
  );
};

export default MetricasLecturasEstado;
