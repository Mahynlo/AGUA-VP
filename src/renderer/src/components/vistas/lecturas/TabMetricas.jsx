import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Chip,
  Progress,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/react";
import {
  HiChartBar,
  HiCheckCircle,
  HiClock,
  HiFire,
  HiMap,
  HiPrinter,
  HiTrendingDown,
  HiTrendingUp,
  HiBeaker,
} from "react-icons/hi";
import ReactApexChart from "react-apexcharts";

import SelectorPeriodoAvanzado from "../../ui/SelectorPeriodoAvanzado";
import ModalImprimir from "../impresion/components/ModalImprimir";
import { useRutas } from "../../../context/RutasContext";
import { formatearPeriodo, obtenerPeriodoActual } from "../../../utils/periodoUtils";

const formatearNumero = (valor, decimales = 0) => {
  const n = Number(valor || 0);
  return n.toLocaleString("es-MX", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
};

export default function TabMetricas() {
  const { rutas, initialLoading } = useRutas();

  const [vista, setVista] = useState("consumo");
  const [tipoFiltro, setTipoFiltro] = useState("ultimos_meses");
  const [periodo, setPeriodo] = useState(obtenerPeriodoActual());
  const [ultimosMeses, setUltimosMeses] = useState("3");

  const [loadingConsumo, setLoadingConsumo] = useState(false);
  const [errorConsumo, setErrorConsumo] = useState("");
  const [reporteConsumo, setReporteConsumo] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [printUrl, setPrintUrl] = useState(null);
  const [modoPdf, setModoPdf] = useState(null);
  const [loadingImprimir, setLoadingImprimir] = useState(false);

  const filtrosActivos = useMemo(() => {
    if (tipoFiltro === "periodo") {
      return { tipo: "periodo", periodo };
    }
    return { tipo: "ultimos_meses", meses: Number(ultimosMeses || 3) };
  }, [tipoFiltro, periodo, ultimosMeses]);

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

  const chartConsumoMensual = useMemo(() => {
    return {
      series: [
        {
          name: "Consumo total (m3)",
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
        },
        stroke: {
          width: [0, 3],
          curve: "smooth",
        },
        colors: ["#0ea5e9", "#6366f1"],
        xaxis: {
          categories: consumoMensual.map((r) => formatearPeriodo(r.periodo)),
          labels: { style: { colors: "currentColor" } },
        },
        yaxis: [
          {
            title: { text: "m3" },
            labels: { style: { colors: "currentColor" } },
          },
          {
            opposite: true,
            title: { text: "Recibos" },
            labels: { style: { colors: "currentColor" } },
          },
        ],
        dataLabels: { enabled: false },
        legend: {
          position: "top",
          labels: { colors: "currentColor" },
        },
        grid: { borderColor: "#d4d4d8" },
      },
    };
  }, [consumoMensual]);

  const chartDistribucionRutas = useMemo(() => {
    const topRutas = distribucionRutasConsumo.slice(0, 8);
    return {
      series: topRutas.map((r) => Number(r.consumo_total_m3 || 0)),
      options: {
        chart: {
          type: "donut",
          background: "transparent",
        },
        labels: topRutas.map((r) => r.ruta_nombre),
        colors: ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#6366f1", "#14b8a6", "#f97316", "#a855f7"],
        legend: {
          position: "bottom",
          labels: { colors: "currentColor" },
        },
        dataLabels: {
          enabled: true,
          formatter: (val) => `${Math.round(val)}%`,
        },
        stroke: { show: false },
      },
    };
  }, [distribucionRutasConsumo]);

  const chartEstadosRutas = useMemo(() => {
    return {
      series: estadisticasRutas.distribucionPorEstado.map((d) => d.value),
      options: {
        chart: {
          type: "donut",
          background: "transparent",
        },
        labels: estadisticasRutas.distribucionPorEstado.map((d) => d.name),
        colors: estadisticasRutas.distribucionPorEstado.map((d) => d.color),
        legend: {
          position: "bottom",
          labels: { colors: "currentColor" },
        },
        dataLabels: {
          enabled: true,
          formatter: (val) => `${Math.round(val)}%`,
        },
        stroke: { show: false },
      },
    };
  }, [estadisticasRutas]);

  const etiquetaFiltro = reporteConsumo?.filtro_aplicado?.etiqueta || "Sin filtro";

  const construirUrlReporteLecturasMetricas = useCallback(async () => {
    if (!reporteConsumo) return null;

    const payload = {
      titulo: "Reporte de Métricas de Lecturas",
      filtro_aplicado: reporteConsumo.filtro_aplicado || {},
      consumo: {
        resumen: resumenConsumo,
        series: {
          consumo_mensual: consumoMensual,
        },
        listados: {
          top_consumidores: topConsumidores,
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
    topConsumidores,
    menorConsumo,
    distribucionRutasConsumo,
    estadisticasRutas,
  ]);

  const handlePrint = async () => {
    const url = await construirUrlReporteLecturasMetricas();
    if (!url) return;

    setLoadingImprimir(true);
    try {
      const response = await window.api.previewComponent(url);
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

  const selectClasses = {
    trigger: "bg-slate-100/70 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-none",
  };

  return (
    <div className="w-full space-y-6">
      <Card className="w-full bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8 lg:p-10 print:shadow-none print:rounded-none print:bg-white print:border-none print:p-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 print:mb-4">
          <div className="flex items-center gap-4">
            <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl p-3 print:hidden">
              <HiChartBar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">Métricas Unificadas de Lecturas</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">Consumo de agua potable y rendimiento operativo por rutas</p>
            </div>
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2 print:hidden">
            <Chip color="default" variant="bordered" className="border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 font-medium rounded-xl" startContent={<HiClock className="w-3.5 h-3.5" />}>
              {etiquetaFiltro}
            </Chip>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8 print:hidden">
          <div className="lg:col-span-3">
            <Select
              label="Vista"
              selectedKeys={[vista]}
              onChange={(e) => setVista(e.target.value || "consumo")}
              size="sm"
              variant="flat"
              classNames={selectClasses}
            >
              <SelectItem key="consumo" value="consumo">Consumo de agua</SelectItem>
              <SelectItem key="rutas" value="rutas">Rutas y distribución</SelectItem>
            </Select>
          </div>

          <div className="lg:col-span-3">
            <Select
              label="Rango"
              selectedKeys={[tipoFiltro]}
              onChange={(e) => setTipoFiltro(e.target.value || "ultimos_meses")}
              size="sm"
              variant="flat"
              classNames={selectClasses}
            >
              <SelectItem key="ultimos_meses" value="ultimos_meses">Últimos meses</SelectItem>
              <SelectItem key="periodo" value="periodo">Período específico</SelectItem>
            </Select>
          </div>

          <div className="lg:col-span-4">
            {tipoFiltro === "periodo" ? (
              <SelectorPeriodoAvanzado
                value={periodo}
                onChange={setPeriodo}
                label="Período"
                placeholder="Seleccionar período"
              />
            ) : (
              <Select
                label="Últimos meses"
                selectedKeys={[ultimosMeses]}
                onChange={(e) => setUltimosMeses(e.target.value || "3")}
                size="sm"
                variant="flat"
                classNames={selectClasses}
              >
                <SelectItem key="3" value="3">Últimos 3 meses</SelectItem>
                <SelectItem key="6" value="6">Últimos 6 meses</SelectItem>
                <SelectItem key="12" value="12">Últimos 12 meses</SelectItem>
              </Select>
            )}
          </div>

          <div className="lg:col-span-2 flex items-end">
            <Button
              color="primary"
              className="w-full font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl"
              onPress={handlePrint}
              isLoading={loadingImprimir}
              isDisabled={!reporteConsumo || loadingConsumo || loadingImprimir}
              startContent={!loadingImprimir && <HiPrinter className="text-lg" />}
            >
              {loadingImprimir ? "Preparando..." : "Imprimir"}
            </Button>
          </div>
        </div>
      </Card>

      {errorConsumo && (
        <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/50 p-4 mb-8 print:hidden">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">{errorConsumo}</p>
        </div>
      )}

      {loadingConsumo && !reporteConsumo ? (
        <div className="flex items-center justify-center py-20 print:hidden">
          <Spinner size="lg" color="default" label="Generando métricas de consumo..." classNames={{ label: "text-slate-500 text-sm font-medium mt-4" }} />
        </div>
      ) : (
        <>
          {vista === "consumo" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8 print:grid-cols-5 print:gap-2">
                <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 print:border-none print:bg-transparent print:p-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Recibos</p>
                  <p className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100">{formatearNumero(resumenConsumo.total_recibos)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 print:border-none print:bg-transparent print:p-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Agua consumida</p>
                  <p className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100">{formatearNumero(resumenConsumo.consumo_total_m3, 2)} m3</p>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 print:border-none print:bg-transparent print:p-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Promedio por recibo</p>
                  <p className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100">{formatearNumero(resumenConsumo.consumo_promedio_m3, 2)} m3</p>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 print:border-none print:bg-transparent print:p-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Clientes analizados</p>
                  <p className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100">{formatearNumero(resumenConsumo.total_clientes)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 print:border-none print:bg-transparent print:p-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Promedio por cliente</p>
                  <p className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100">{formatearNumero(resumenConsumo.promedio_consumo_por_cliente_m3, 2)} m3</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-4">Tendencia de consumo y recibos</p>
                  {consumoMensual.length > 0 ? (
                    <ReactApexChart options={chartConsumoMensual.options} series={chartConsumoMensual.series} type="line" height={330} />
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-sm text-slate-500 dark:text-zinc-400">Sin datos para el rango seleccionado.</div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600"><HiTrendingUp className="w-4 h-4" /></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Mayor consumo</span>
                    </div>
                    {topConsumidor ? (
                      <>
                        <p className="text-sm font-bold text-slate-800 dark:text-zinc-100 truncate">{topConsumidor.cliente_nombre}</p>
                        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-1">{formatearNumero(topConsumidor.consumo_total_m3, 2)} m3 en {formatearNumero(topConsumidor.recibos)} recibos</p>
                      </>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-zinc-400">Sin datos disponibles.</p>
                    )}
                  </div>

                  <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded-lg bg-red-500/10 text-red-600"><HiTrendingDown className="w-4 h-4" /></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Menor consumo</span>
                    </div>
                    {menorConsumidor ? (
                      <>
                        <p className="text-sm font-bold text-slate-800 dark:text-zinc-100 truncate">{menorConsumidor.cliente_nombre}</p>
                        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-1">{formatearNumero(menorConsumidor.consumo_total_m3, 2)} m3 en {formatearNumero(menorConsumidor.recibos)} recibos</p>
                      </>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-zinc-400">Sin datos disponibles.</p>
                    )}
                  </div>

                  <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-slate-500/10 text-slate-600 dark:text-zinc-300"><HiMap className="w-4 h-4" /></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Rutas con consumo</span>
                    </div>
                    <p className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100">{formatearNumero(distribucionRutasConsumo.length)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Top consumidores</p>
                    <Chip size="sm" variant="flat" className="bg-slate-200/50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-bold" startContent={<HiFire className="w-3 h-3" />}>{topConsumidores.length}</Chip>
                  </div>
                  <Table aria-label="Top consumidores" removeWrapper className="max-h-[340px] overflow-auto" classNames={{ th: "bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800", td: "text-sm font-medium text-slate-600 dark:text-zinc-300 border-b border-slate-100 dark:border-zinc-800/50 py-3" }}>
                    <TableHeader>
                      <TableColumn>Cliente</TableColumn>
                      <TableColumn>Localidad</TableColumn>
                      <TableColumn>Recibos</TableColumn>
                      <TableColumn>Consumo m3</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent="Sin datos" items={topConsumidores}>
                      {(item) => (
                        <TableRow key={item.cliente_id}>
                          <TableCell className="font-semibold text-slate-800 dark:text-zinc-100">{item.cliente_nombre}</TableCell>
                          <TableCell>{item.localidad || "-"}</TableCell>
                          <TableCell>{formatearNumero(item.recibos)}</TableCell>
                          <TableCell className="font-black tracking-tight text-slate-800 dark:text-zinc-100">{formatearNumero(item.consumo_total_m3, 2)}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Menor consumo</p>
                    <Chip size="sm" variant="flat" className="bg-slate-200/50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-bold" startContent={<HiTrendingDown className="w-3 h-3" />}>{menorConsumo.length}</Chip>
                  </div>
                  <Table aria-label="Menor consumo" removeWrapper className="max-h-[340px] overflow-auto" classNames={{ th: "bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800", td: "text-sm font-medium text-slate-600 dark:text-zinc-300 border-b border-slate-100 dark:border-zinc-800/50 py-3" }}>
                    <TableHeader>
                      <TableColumn>Cliente</TableColumn>
                      <TableColumn>Localidad</TableColumn>
                      <TableColumn>Recibos</TableColumn>
                      <TableColumn>Consumo m3</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent="Sin datos" items={menorConsumo}>
                      {(item) => (
                        <TableRow key={item.cliente_id}>
                          <TableCell className="font-semibold text-slate-800 dark:text-zinc-100">{item.cliente_nombre}</TableCell>
                          <TableCell>{item.localidad || "-"}</TableCell>
                          <TableCell>{formatearNumero(item.recibos)}</TableCell>
                          <TableCell className="font-black tracking-tight text-slate-800 dark:text-zinc-100">{formatearNumero(item.consumo_total_m3, 2)}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {vista === "rutas" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8 print:grid-cols-4 print:gap-2">
                <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 print:border-none print:bg-transparent print:p-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Rutas activas</p>
                  <p className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100">{formatearNumero(estadisticasRutas.totalRutas)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 print:border-none print:bg-transparent print:p-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Rutas completadas</p>
                  <p className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100">{formatearNumero(estadisticasRutas.rutasCompletadas)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 print:border-none print:bg-transparent print:p-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">En progreso</p>
                  <p className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100">{formatearNumero(estadisticasRutas.rutasEnProgreso)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 print:border-none print:bg-transparent print:p-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Avance operativo</p>
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100">{estadisticasRutas.promedioCompletado}%</p>
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600"><HiCheckCircle className="w-4 h-4" /></div>
                  </div>
                  <Progress
                    value={estadisticasRutas.promedioCompletado}
                    className="h-2"
                    classNames={{ track: "bg-slate-200 dark:bg-zinc-800", indicator: "bg-slate-800 dark:bg-zinc-200 rounded-full" }}
                    aria-label="Avance operativo"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-4">Distribución operativa de rutas</p>
                  {estadisticasRutas.totalRutas > 0 ? (
                    <ReactApexChart options={chartEstadosRutas.options} series={chartEstadosRutas.series} type="donut" height={320} />
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-sm text-slate-500 dark:text-zinc-400">No hay rutas disponibles.</div>
                  )}
                </div>

                <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-4">Distribución de consumo por ruta</p>
                  {distribucionRutasConsumo.length > 0 ? (
                    <ReactApexChart options={chartDistribucionRutas.options} series={chartDistribucionRutas.series} type="donut" height={320} />
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-sm text-slate-500 dark:text-zinc-400">Sin consumo facturado para el rango seleccionado.</div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Consumo por ruta</p>
                  <Chip size="sm" variant="flat" className="bg-slate-200/50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-bold" startContent={<HiMap className="w-3 h-3" />}>{distribucionRutasConsumo.length}</Chip>
                </div>
                <Table aria-label="Consumo por ruta" removeWrapper className="max-h-[360px] overflow-auto" classNames={{ th: "bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800", td: "text-sm font-medium text-slate-600 dark:text-zinc-300 border-b border-slate-100 dark:border-zinc-800/50 py-3" }}>
                  <TableHeader>
                    <TableColumn>Ruta</TableColumn>
                    <TableColumn>Recibos</TableColumn>
                    <TableColumn>Consumo total (m3)</TableColumn>
                    <TableColumn>Promedio (m3)</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="Sin datos" items={distribucionRutasConsumo}>
                    {(item) => (
                      <TableRow key={`${item.ruta_id}-${item.ruta_nombre}`}>
                        <TableCell className="font-semibold text-slate-800 dark:text-zinc-100">{item.ruta_nombre}</TableCell>
                        <TableCell>{formatearNumero(item.recibos)}</TableCell>
                        <TableCell className="font-black tracking-tight text-slate-800 dark:text-zinc-100">{formatearNumero(item.consumo_total_m3, 2)}</TableCell>
                        <TableCell>{formatearNumero(item.consumo_promedio_m3, 2)}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}

      {pdfUrl && modoPdf === "imprimir" && (
        <ModalImprimir
          pdfUrl={pdfUrl}
          printUrl={printUrl}
          onClose={() => {
            setPdfUrl(null);
            setPrintUrl(null);
            setModoPdf(null);
          }}
          onVolver={() => setModoPdf("vista-previa")}
        />
      )}
    </div>
  );
}
