import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Select,
  SelectItem,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
} from "@nextui-org/react";
import Chart from "react-apexcharts";
import {
  HiCurrencyDollar,
  HiTrendingUp,
  HiTrendingDown,
  HiCalendar,
  HiChartBar,
  HiUsers,
  HiEye,
  HiPrinter,
} from "react-icons/hi";
import SelectorPeriodoAvanzado from "../../../ui/SelectorPeriodoAvanzado";
import { useReportes } from "../../../../context/ReportesContext";
import { generarCatalogoPeriodos, obtenerPeriodoActual } from "../../../../utils/periodoUtils";
import ModalVistaPrevia from "./ModalVistaPrevia";
import ModalImprimir from "./ModalImprimir";
import { useTheme } from "@renderer/theme/useTheme";

const ReporteFinancieroEstado = () => {
  const {
    financiero,
    loadingFinanciero,
    errorFinanciero,
    cargarReporteFinanciero,
  } = useReportes();
  const { theme } = useTheme();

  const [tipoFiltro, setTipoFiltro] = useState("periodo");
  const [periodo, setPeriodo] = useState(obtenerPeriodoActual());
  const [ultimosMeses, setUltimosMeses] = useState("3");
  const [anioEspecifico, setAnioEspecifico] = useState(String(new Date().getFullYear()));
  const [pdfUrl, setPdfUrl] = useState(null);
  const [printUrl, setPrintUrl] = useState(null);
  const [modoPdf, setModoPdf] = useState(null);
  const [loadingImprimir, setLoadingImprimir] = useState(false);

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

  const cargarDatos = useCallback(async (forzarRecarga = false) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    await cargarReporteFinanciero(token, filtrosActivos, forzarRecarga);
  }, [cargarReporteFinanciero, filtrosActivos]);

  const construirUrlReporteFinanciero = useCallback(async () => {
    if (!financiero) return null;

    const dataKey = await window.api.savePrintData(JSON.stringify(financiero));
    const { protocol, origin, href } = window.location;
    const params = `print=true&dataKey=${dataKey}`;

    if (protocol === "file:") {
      const base = href.split("#")[0];
      return `${base}#/reporteFinancieroPagos?${params}`;
    }

    return `${origin}/#/reporteFinancieroPagos?${params}`;
  }, [financiero]);

  useEffect(() => {
    cargarDatos(false).catch((err) => {
      console.error("Error inicial cargando reporte financiero:", err);
    });
  }, [cargarDatos]);

  const resumen = financiero?.resumen || {};
  const series = financiero?.series || {};
  const listados = financiero?.listados || {};

  const isDark = useMemo(() => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return theme === "dark";
  }, [theme]);

  const moneda = (valor) => {
    const n = Number(valor || 0);
    return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
  };

  const porcentaje = (valor) => `${Number(valor || 0).toFixed(1)}%`;

  const formatearMesCorto = (periodoMes) => {
    if (!periodoMes || !/^\d{4}-\d{2}$/.test(periodoMes)) return periodoMes || "";
    const [anio, mes] = periodoMes.split("-");
    const fecha = new Date(Number(anio), Number(mes) - 1, 1);
    return fecha.toLocaleDateString("es-MX", { month: "short" }).replace(".", "").toLowerCase();
  };

  const tituloAnioTendencia = useMemo(() => {
    const mensual = series.recaudacion_mensual || [];
    const years = [...new Set(mensual.map((m) => String(m.periodo || "").slice(0, 4)).filter(Boolean))];
    if (years.length === 0) return "Año";
    if (years.length === 1) return years[0];
    return `${years[0]} - ${years[years.length - 1]}`;
  }, [series]);

  const chartMensual = useMemo(() => {
    const mensual = series.recaudacion_mensual || [];
    const categories = mensual.map((m) => formatearMesCorto(m.periodo));

    return {
      options: {
        chart: {
          type: "bar",
          toolbar: { show: true },
          background: "transparent",
          foreColor: isDark ? "#cbd5e1" : "#334155",
        },
        theme: {
          mode: isDark ? "dark" : "light",
        },
        grid: {
          borderColor: isDark ? "#3f3f46" : "#e2e8f0",
          strokeDashArray: 3,
        },
        plotOptions: {
          bar: {
            horizontal: false,
            borderRadius: 4,
            columnWidth: "48%",
          },
        },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 1, colors: ["transparent"] },
        xaxis: {
          categories,
          labels: {
            style: {
              colors: isDark ? "#a1a1aa" : "#64748b",
            },
          },
        },
        yaxis: {
          labels: {
            style: {
              colors: isDark ? "#a1a1aa" : "#64748b",
            },
            formatter: (val) => `$${Number(val).toLocaleString("es-MX")}`,
          },
        },
        legend: {
          position: "top",
          labels: {
            colors: isDark ? "#cbd5e1" : "#334155",
          },
        },
        tooltip: {
          theme: isDark ? "dark" : "light",
          y: {
            formatter: (val) => moneda(val),
          },
        },
        colors: ["#6366f1", "#14b8a6", "#f97316"],
      },
      series: [
        { name: "Esperado", data: mensual.map((m) => Number(m.esperado || 0)) },
        { name: "Recaudado", data: mensual.map((m) => Number(m.recaudado || 0)) },
        { name: "Pendiente", data: mensual.map((m) => Number(m.pendiente || 0)) },
      ],
    };
  }, [series, isDark]);

  const chartMetodos = useMemo(() => {
    const metodos = series.metodos_pago || [];
    return {
      options: {
        labels: metodos.map((m) => m.metodo),
        legend: { position: "bottom" },
        dataLabels: {
          formatter: (_val, opts) => {
            const idx = opts.seriesIndex;
            const total = metodos[idx]?.total || 0;
            return `$${Number(total).toLocaleString("es-MX")}`;
          },
        },
        tooltip: {
          y: {
            formatter: (val) => moneda(val),
          },
        },
        colors: ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"],
      },
      series: metodos.map((m) => Number(m.total || 0)),
    };
  }, [series]);

  const eficienciaPositiva = Number(resumen.eficiencia_recaudo_porcentaje || 0) >= 70;

  const handlePreview = async () => {
    const url = await construirUrlReporteFinanciero();
    if (!url) return;

    try {
      const response = await window.api.previewComponent(url);
      if (response && response.success && response.path) {
        setPrintUrl(url);
        setPdfUrl(response.path);
        setModoPdf("vista-previa");
      }
    } catch (err) {
      console.error("Error generando vista previa financiera:", err);
      alert("Error al generar vista previa del reporte financiero");
    }
  };

  const handlePrint = async () => {
    const url = await construirUrlReporteFinanciero();
    if (!url) return;

    setLoadingImprimir(true);
    try {
      const response = await window.api.previewComponent(url);
      if (response && response.success && response.path) {
        setPrintUrl(url);
        setPdfUrl(response.path);
        setModoPdf("imprimir");
      }
    } catch (err) {
      console.error("Error preparando impresión financiera:", err);
      alert("Error al preparar impresión del reporte financiero");
    } finally {
      setLoadingImprimir(false);
    }
  };

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-visible">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl">
            <HiCurrencyDollar className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 leading-tight">
              Estado Financiero de Pagos
            </h3>
            <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
              Recaudacion, cobranza y cartera por periodo
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2">
          <Chip color="primary" variant="flat" startContent={<HiCalendar className="w-3.5 h-3.5" />}>
            {financiero?.filtro_aplicado?.etiqueta || "Sin filtro"}
          </Chip>
        </div>
      </CardHeader>

      <CardBody className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-slate-50 dark:bg-zinc-800/30 p-4 rounded-xl border border-slate-100 dark:border-zinc-800">
          <div className="lg:col-span-3">
            <Select
              label="Vista"
              selectedKeys={[tipoFiltro]}
              onChange={(e) => setTipoFiltro(e.target.value || "periodo")}
              size="sm"
              variant="bordered"
              classNames={{ trigger: "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700" }}
            >
              <SelectItem key="periodo" value="periodo">Periodo puntual</SelectItem>
              <SelectItem key="ultimos_meses" value="ultimos_meses">Ultimos meses</SelectItem>
              <SelectItem key="anio" value="anio">Anio especifico</SelectItem>
            </Select>
          </div>

          <div className="lg:col-span-6">
            {tipoFiltro === "periodo" && (
              <SelectorPeriodoAvanzado
                value={periodo}
                onChange={setPeriodo}
                label="Periodo"
                placeholder="Seleccionar periodo"
              />
            )}

            {tipoFiltro === "ultimos_meses" && (
              <Select
                label="Ultimos meses"
                selectedKeys={[ultimosMeses]}
                onChange={(e) => setUltimosMeses(e.target.value || "3")}
                size="sm"
                variant="bordered"
                classNames={{ trigger: "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700" }}
              >
                <SelectItem key="3" value="3">Ultimos 3 meses</SelectItem>
                <SelectItem key="6" value="6">Ultimos 6 meses</SelectItem>
                <SelectItem key="12" value="12">Ultimos 12 meses</SelectItem>
              </Select>
            )}

            {tipoFiltro === "anio" && (
              <Select
                label="Anio"
                selectedKeys={[anioEspecifico]}
                onChange={(e) => setAnioEspecifico(e.target.value || String(new Date().getFullYear()))}
                size="sm"
                variant="bordered"
                classNames={{ trigger: "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700" }}
              >
                {opcionesAnio.map((anio) => (
                  <SelectItem key={anio} value={anio}>{anio}</SelectItem>
                ))}
              </Select>
            )}
          </div>

          <div className="lg:col-span-3 flex items-end">
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button
                color="warning"
                className="w-full font-bold text-white"
                onPress={() => cargarDatos(true)}
                isLoading={loadingFinanciero}
                startContent={!loadingFinanciero && <HiChartBar className="text-lg" />}
              >
                {loadingFinanciero ? "Generando..." : "Generar"}
              </Button>

              <Button
                color="primary"
                variant="flat"
                className="w-full font-bold"
                onPress={handlePreview}
                isDisabled={!financiero || loadingFinanciero}
                startContent={<HiEye className="text-lg" />}
              >
                Vista previa
              </Button>

              <Button
                color="primary"
                className="w-full font-bold"
                onPress={handlePrint}
                isLoading={loadingImprimir}
                isDisabled={!financiero || loadingFinanciero || loadingImprimir}
                startContent={!loadingImprimir && <HiPrinter className="text-lg" />}
              >
                {loadingImprimir ? "Preparando..." : "Imprimir"}
              </Button>
            </div>
          </div>
        </div>

        {errorFinanciero && (
          <div className="rounded-xl border border-danger-200 bg-danger-50 dark:bg-danger-900/20 p-3">
            <p className="text-sm font-medium text-danger-700 dark:text-danger-300">{errorFinanciero}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/70 dark:bg-indigo-900/15 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600/80">Esperado</p>
            <p className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">{moneda(resumen.total_esperado)}</p>
          </div>

          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-900/15 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600/80">Recaudado</p>
            <p className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">{moneda(resumen.total_recaudado)}</p>
          </div>

          <div className="rounded-xl border border-orange-200 dark:border-orange-900/40 bg-orange-50/70 dark:bg-orange-900/15 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-orange-600/80">Por cobrar</p>
            <p className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">{moneda(resumen.por_cobrar_estimado)}</p>
          </div>

          <div className="rounded-xl border border-sky-200 dark:border-sky-900/40 bg-sky-50/70 dark:bg-sky-900/15 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-sky-600/80">Recaudado a hoy</p>
            <p className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">{moneda(resumen.recaudado_hasta_fecha_actual)}</p>
          </div>

          <div className="rounded-xl border border-violet-200 dark:border-violet-900/40 bg-violet-50/70 dark:bg-violet-900/15 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-violet-600/80">Eficiencia</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xl font-black text-slate-800 dark:text-zinc-100">{porcentaje(resumen.eficiencia_recaudo_porcentaje)}</p>
              {eficienciaPositiva ? (
                <HiTrendingUp className="text-emerald-500 w-5 h-5" />
              ) : (
                <HiTrendingDown className="text-rose-500 w-5 h-5" />
              )}
            </div>
          </div>
        </div>

        {loadingFinanciero && !financiero ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" color="warning" label="Cargando estado financiero..." />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2 rounded-xl border border-slate-200 dark:border-zinc-800 p-3 bg-white dark:bg-zinc-900">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-zinc-500 mb-1">{tituloAnioTendencia}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-300 mb-2">Tendencia mensual</p>
                <Chart options={chartMensual.options} series={chartMensual.series} type="bar" height={310} />
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 p-3 bg-white dark:bg-zinc-900">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2">Metodos de pago</p>
                {(chartMetodos.series || []).length > 0 ? (
                  <Chart options={chartMetodos.options} series={chartMetodos.series} type="donut" height={310} />
                ) : (
                  <div className="h-[310px] flex items-center justify-center text-sm text-slate-500 dark:text-zinc-400">
                    Sin pagos en el rango seleccionado.
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Lista de deudores</p>
                  <Chip size="sm" variant="flat" color="danger" startContent={<HiUsers className="w-3 h-3" />}>
                    {(listados.deudores || []).length}
                  </Chip>
                </div>
                <Table aria-label="Tabla de deudores" removeWrapper className="max-h-[350px] overflow-auto">
                  <TableHeader>
                    <TableColumn>Cliente</TableColumn>
                    <TableColumn>Localidad</TableColumn>
                    <TableColumn>Facturas</TableColumn>
                    <TableColumn>Deuda</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="Sin deudores en el rango" items={(listados.deudores || []).slice(0, 12)}>
                    {(item) => (
                      <TableRow key={item.cliente_id}>
                        <TableCell>{item.cliente_nombre}</TableCell>
                        <TableCell>{item.localidad || "-"}</TableCell>
                        <TableCell>{item.facturas_con_deuda}</TableCell>
                        <TableCell className="font-semibold text-danger">{moneda(item.deuda_total)}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Lista de clientes que pagaron</p>
                  <Chip size="sm" variant="flat" color="success" startContent={<HiUsers className="w-3 h-3" />}>
                    {(listados.pagadores || []).length}
                  </Chip>
                </div>
                <Table aria-label="Tabla de pagadores" removeWrapper className="max-h-[350px] overflow-auto">
                  <TableHeader>
                    <TableColumn>Cliente</TableColumn>
                    <TableColumn>Pagado</TableColumn>
                    <TableColumn>Pagos</TableColumn>
                    <TableColumn>Deuda actual</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="Sin pagos en el rango" items={(listados.pagadores || []).slice(0, 12)}>
                    {(item) => (
                      <TableRow key={item.cliente_id}>
                        <TableCell>{item.cliente_nombre}</TableCell>
                        <TableCell className="font-semibold text-emerald-600">{moneda(item.total_pagado)}</TableCell>
                        <TableCell>{item.pagos_realizados}</TableCell>
                        <TableCell>{moneda(item.deuda_total_actual)}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
      </CardBody>

      {pdfUrl && modoPdf === "vista-previa" && (
        <ModalVistaPrevia
          pdfUrl={pdfUrl}
          printUrl={printUrl}
          onClose={() => { setPdfUrl(null); setPrintUrl(null); setModoPdf(null); }}
          onImprimir={() => setModoPdf("imprimir")}
        />
      )}

      {pdfUrl && modoPdf === "imprimir" && (
        <ModalImprimir
          pdfUrl={pdfUrl}
          printUrl={printUrl}
          onClose={() => { setPdfUrl(null); setPrintUrl(null); setModoPdf(null); }}
          onVolver={() => setModoPdf("vista-previa")}
        />
      )}
    </Card>
  );
};

export default ReporteFinancieroEstado;
