import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  Card,
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
  HiUsers,
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
          fontFamily: "inherit",
          foreColor: isDark ? "#71717a" : "#94a3b8", // Text-zinc-500 / text-slate-400
        },
        theme: {
          mode: isDark ? "dark" : "light",
        },
        grid: {
          borderColor: isDark ? "#27272a" : "#f1f5f9", // zinc-800 / slate-100
          strokeDashArray: 4,
        },
        plotOptions: {
          bar: {
            horizontal: false,
            borderRadius: 4,
            columnWidth: "48%",
          },
        },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 2, colors: ["transparent"] },
        xaxis: {
          categories,
          labels: {
            style: {
              colors: isDark ? "#71717a" : "#94a3b8",
              fontSize: "12px",
              fontWeight: 500,
            },
          },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: {
          labels: {
            style: {
              colors: isDark ? "#71717a" : "#94a3b8",
              fontSize: "12px",
              fontWeight: 500,
            },
            formatter: (val) => `$${Number(val).toLocaleString("es-MX")}`,
          },
        },
        legend: {
          position: "top",
          fontWeight: 600,
          labels: {
            colors: isDark ? "#d4d4d8" : "#334155",
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
        legend: { 
          position: "bottom",
          fontWeight: 500,
          labels: { colors: isDark ? "#d4d4d8" : "#334155" }
        },
        chart: { fontFamily: "inherit" },
        dataLabels: {
          style: { fontSize: "12px", fontWeight: "bold" },
          formatter: (_val, opts) => {
            const idx = opts.seriesIndex;
            const total = metodos[idx]?.total || 0;
            return `$${Number(total).toLocaleString("es-MX")}`;
          },
        },
        stroke: { show: false },
        tooltip: {
          theme: isDark ? "dark" : "light",
          y: {
            formatter: (val) => moneda(val),
          },
        },
        colors: ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"],
      },
      series: metodos.map((m) => Number(m.total || 0)),
    };
  }, [series, isDark]);

  const eficienciaPositiva = Number(resumen.eficiencia_recaudo_porcentaje || 0) >= 70;

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

  const selectClasses = {
    trigger: "bg-slate-100/70 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-none",
  };

  return (
    <Card className="w-full bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8 lg:p-10 print:shadow-none print:rounded-none print:bg-white print:border-none print:p-0">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 print:mb-4">
        <div className="flex items-center gap-4">
          <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl p-3 print:hidden">
            <HiCurrencyDollar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
              Estado Financiero de Pagos
            </h3>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
              Recaudación, cobranza y cartera por periodo
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2 print:hidden">
          <Chip color="default" variant="bordered" className="border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 font-medium rounded-xl" startContent={<HiCalendar className="w-3.5 h-3.5" />}>
            {financiero?.filtro_aplicado?.etiqueta || "Sin filtro"}
          </Chip>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8 print:hidden">
        <div className="lg:col-span-3">
          <Select
            label="Vista"
            selectedKeys={[tipoFiltro]}
            onChange={(e) => setTipoFiltro(e.target.value || "periodo")}
            size="sm"
            variant="flat"
            classNames={selectClasses}
          >
            <SelectItem key="periodo" value="periodo">Periodo puntual</SelectItem>
            <SelectItem key="ultimos_meses" value="ultimos_meses">Últimos meses</SelectItem>
            <SelectItem key="anio" value="anio">Año específico</SelectItem>
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

          {tipoFiltro === "anio" && (
            <Select
              label="Año"
              selectedKeys={[anioEspecifico]}
              onChange={(e) => setAnioEspecifico(e.target.value || String(new Date().getFullYear()))}
              size="sm"
              variant="flat"
              classNames={selectClasses}
            >
              {opcionesAnio.map((anio) => (
                <SelectItem key={anio} value={anio}>{anio}</SelectItem>
              ))}
            </Select>
          )}
        </div>

        <div className="lg:col-span-3 flex items-end">
          <Button
            color="primary"
            className="w-full font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl"
            onPress={handlePrint}
            isLoading={loadingImprimir}
            isDisabled={!financiero || loadingFinanciero || loadingImprimir}
            startContent={!loadingImprimir && <HiPrinter className="text-lg" />}
          >
            {loadingImprimir ? "Preparando..." : "Imprimir"}
          </Button>
        </div>
      </div>

      {errorFinanciero && (
        <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/50 p-4 mb-8 print:hidden">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">{errorFinanciero}</p>
        </div>
      )}

      {/* KPIs GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8 print:grid-cols-5 print:gap-2">
        <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 print:border-none print:bg-transparent print:p-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Total Esperado</p>
          <p className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100">{moneda(resumen.total_esperado)}</p>
        </div>

        <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 print:border-none print:bg-transparent print:p-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Total Recaudado</p>
          <p className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100">{moneda(resumen.total_recaudado)}</p>
        </div>

        <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 print:border-none print:bg-transparent print:p-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Por cobrar</p>
          <p className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100">{moneda(resumen.por_cobrar_estimado)}</p>
        </div>

        <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 print:border-none print:bg-transparent print:p-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Recaudado a hoy</p>
          <p className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100">{moneda(resumen.recaudado_hasta_fecha_actual)}</p>
        </div>

        <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 print:border-none print:bg-transparent print:p-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Eficiencia</p>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-black tracking-tight text-slate-800 dark:text-zinc-100">{porcentaje(resumen.eficiencia_recaudo_porcentaje)}</p>
            <div className={`p-1.5 rounded-lg ${eficienciaPositiva ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'} print:hidden`}>
              {eficienciaPositiva ? <HiTrendingUp className="w-5 h-5" /> : <HiTrendingDown className="w-5 h-5" />}
            </div>
          </div>
        </div>
      </div>

      {loadingFinanciero && !financiero ? (
        <div className="flex items-center justify-center py-20 print:hidden">
          <Spinner size="lg" color="default" label="Cargando estado financiero..." classNames={{ label: "text-slate-500 text-sm font-medium mt-4" }} />
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* CHARTS SECTION */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 print:block">
            <div className="xl:col-span-2 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 print:border-none print:bg-transparent print:p-0 print:mb-6">
              <div className="flex items-center gap-2 mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">{tituloAnioTendencia}</p>
                <span className="text-slate-300 dark:text-zinc-600">•</span>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Tendencia mensual</p>
              </div>
              <Chart options={chartMensual.options} series={chartMensual.series} type="bar" height={310} />
            </div>

            <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 print:border-none print:bg-transparent print:p-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-4">Métodos de pago</p>
              {(chartMetodos.series || []).length > 0 ? (
                <Chart options={chartMetodos.options} series={chartMetodos.series} type="donut" height={310} />
              ) : (
                <div className="h-[310px] flex items-center justify-center text-sm font-medium text-slate-400 dark:text-zinc-500">
                  Sin pagos en el rango seleccionado.
                </div>
              )}
            </div>
          </div>

          {/* TABLES SECTION */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 print:block">
            <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 print:border-none print:bg-transparent print:p-0 print:mb-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Lista de deudores</p>
                <Chip size="sm" variant="flat" className="bg-slate-200/50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-bold" startContent={<HiUsers className="w-3 h-3" />}>
                  {(listados.deudores || []).length}
                </Chip>
              </div>
              <Table aria-label="Tabla de deudores" removeWrapper className="max-h-[350px] overflow-auto print:max-h-none" classNames={{ th: "bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800", td: "text-sm font-medium text-slate-600 dark:text-zinc-300 border-b border-slate-100 dark:border-zinc-800/50 py-3" }}>
                <TableHeader>
                  <TableColumn>Cliente</TableColumn>
                  <TableColumn>Localidad</TableColumn>
                  <TableColumn>Facturas</TableColumn>
                  <TableColumn className="text-right">Deuda</TableColumn>
                </TableHeader>
                <TableBody emptyContent="Sin deudores en el rango" items={listados.deudores || []}>
                  {(item) => (
                    <TableRow key={item.cliente_id}>
                      <TableCell className="font-semibold text-slate-800 dark:text-zinc-100">{item.cliente_nombre}</TableCell>
                      <TableCell>{item.localidad || "-"}</TableCell>
                      <TableCell>{item.facturas_con_deuda}</TableCell>
                      <TableCell className="text-right font-black tracking-tight text-slate-800 dark:text-zinc-100">{moneda(item.deuda_total)}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 print:border-none print:bg-transparent print:p-0">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Clientes que pagaron</p>
                <Chip size="sm" variant="flat" className="bg-slate-200/50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-bold" startContent={<HiUsers className="w-3 h-3" />}>
                  {(listados.pagadores || []).length}
                </Chip>
              </div>
              <Table aria-label="Tabla de pagadores" removeWrapper className="max-h-[350px] overflow-auto print:max-h-none" classNames={{ th: "bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800", td: "text-sm font-medium text-slate-600 dark:text-zinc-300 border-b border-slate-100 dark:border-zinc-800/50 py-3" }}>
                <TableHeader>
                  <TableColumn>Cliente</TableColumn>
                  <TableColumn>Pagado</TableColumn>
                  <TableColumn>Pagos</TableColumn>
                  <TableColumn className="text-right">Deuda actual</TableColumn>
                </TableHeader>
                <TableBody emptyContent="Sin pagos en el rango" items={listados.pagadores || []}>
                  {(item) => (
                    <TableRow key={item.cliente_id}>
                      <TableCell className="font-semibold text-slate-800 dark:text-zinc-100">{item.cliente_nombre}</TableCell>
                      <TableCell className="font-black tracking-tight text-emerald-600 dark:text-emerald-400">{moneda(item.total_pagado)}</TableCell>
                      <TableCell>{item.pagos_realizados}</TableCell>
                      <TableCell className="text-right font-black tracking-tight text-slate-800 dark:text-zinc-100">{moneda(item.deuda_total_actual)}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
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
