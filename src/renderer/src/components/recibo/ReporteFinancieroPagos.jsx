import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppLogo } from "../../context/LogoContext";
import { useNotifyPrintReady } from "../../hooks/useNotifyPrintReady";

// --- HELPERS DE FORMATO CONSISTENTES CON EL SISTEMA INSTITUCIONAL ---
const fmt = (n, dec = 0) =>
  Number(n || 0).toLocaleString("es-MX", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });

const money = (value) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const percent = (value) => `${Number(value || 0).toFixed(1)}%`;

const shortMonth = (periodoMes) => {
  if (!periodoMes || !/^\d{4}-\d{2}$/.test(periodoMes)) return periodoMes || "";
  const [anio, mes] = periodoMes.split("-");
  const fecha = new Date(Number(anio), Number(mes) - 1, 1);
  return fecha.toLocaleDateString("es-MX", { month: "short" }).replace(".", "").toUpperCase();
};

const formatMonthYearLong = (periodoMes) => {
  if (!periodoMes || !/^\d{4}-\d{2}$/.test(periodoMes)) return periodoMes || "-";
  const [anio, mes] = periodoMes.split("-");
  const fecha = new Date(Number(anio), Number(mes) - 1, 1);
  const label = fecha.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const ReporteFinancieroPagos = () => {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useNotifyPrintReady(isReady);
  const { logoSrc } = useAppLogo();

  useEffect(() => {
    const cargar = async () => {
      const dataKey = searchParams.get("dataKey");
      const dataParam = searchParams.get("data");

      if (dataKey) {
        try {
          const raw = await window.api.getPrintData(dataKey);
          if (raw) {
            setData(typeof raw === "string" ? JSON.parse(raw) : raw);
            setIsReady(true);
            return;
          }
        } catch (err) {
          console.error("Error al cargar reporte financiero por dataKey:", err);
        }
      }

      if (dataParam) {
        try {
          setData(JSON.parse(decodeURIComponent(dataParam)));
        } catch (err) {
          console.error("Error parseando data de reporte financiero:", err);
        }
      }

      setIsReady(true);
    };

    cargar();
  }, [searchParams]);

  // Datos normalizados del reporte financiero
  const resumen = data?.resumen || {};
  const filtro = data?.filtro_aplicado || {};
  const series = data?.series || {};

  // Series financieras
  const recaudacionMensual = useMemo(() => series.recaudacion_mensual || [], [series]);
  const recaudacionCaja = useMemo(() => series.recaudacion_por_mes_pago || [], [series]);
  const metodosPago = useMemo(() => series.metodos_pago || [], [series]);

  // Métricas financieras principales
  const totalFacturado = Number(resumen.total_esperado || 0);
  const totalRecaudado = Number(resumen.total_recaudado || 0);
  const saldoPendiente = Number(resumen.por_cobrar_estimado || 0);
  const carteraVencida = Number(resumen.deuda_total_rango || 0);
  const eficienciaCobranza = Number(resumen.eficiencia_recaudo_porcentaje || 0);
  const totalFacturas = Number(resumen.total_facturas || 0);
  const facturasPagadas = Number(resumen.facturas_pagadas || 0);

  const totalRecaudadoCaja = useMemo(
    () =>
      Number(resumen.total_recaudado_caja || 0) ||
      recaudacionCaja.reduce((acc, row) => acc + Number(row.recaudado || 0), 0),
    [resumen, recaudacionCaja]
  );

  const totalTransaccionesCaja = useMemo(
    () => recaudacionCaja.reduce((acc, row) => acc + Number(row.transacciones || 0), 0),
    [recaudacionCaja]
  );

  // Escalas máximas para gráficos SVG
  const maxFinanciero = useMemo(() => {
    return recaudacionMensual.reduce((acc, row) => {
      const esperado = Number(row.esperado || 0);
      const recaudado = Number(row.recaudado || 0);
      const pendiente = Number(row.pendiente || 0);
      return Math.max(acc, esperado, recaudado, pendiente);
    }, 0);
  }, [recaudacionMensual]);

  const maxCaja = useMemo(() => {
    return recaudacionCaja.reduce((acc, row) => {
      return Math.max(acc, Number(row.recaudado || 0));
    }, 0);
  }, [recaudacionCaja]);

  const totalMetodosPago = useMemo(
    () => metodosPago.reduce((acc, row) => acc + Number(row.total || 0), 0),
    [metodosPago]
  );

  const totalOperacionesMetodos = useMemo(
    () => metodosPago.reduce((acc, row) => acc + Number(row.cantidad || 0), 0),
    [metodosPago]
  );

  const metodosPagoTabla = useMemo(() => {
    return [...metodosPago]
      .map((row) => ({
        metodo: row.metodo || "Sin clasificar",
        cantidad: Number(row.cantidad || 0),
        total: Number(row.total || 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [metodosPago]);

  // Totales sumados de la tabla mensual
  const totalesMensual = useMemo(() => {
    return recaudacionMensual.reduce(
      (acc, row) => {
        acc.esperado += Number(row.esperado || 0);
        acc.recaudado += Number(row.recaudado || 0);
        acc.pendiente += Number(row.pendiente || 0);
        return acc;
      },
      { esperado: 0, recaudado: 0, pendiente: 0 }
    );
  }, [recaudacionMensual]);

  // Metadatos de fechas y filtros
  const periodoPrincipal = useMemo(() => {
    if (filtro.periodo) return formatMonthYearLong(filtro.periodo);
    if (filtro.periodo_mes) return formatMonthYearLong(filtro.periodo_mes);
    if (filtro.anio) return `Ejercicio Fiscal ${filtro.anio}`;
    if (filtro.meses) return `Rango de Últimos ${filtro.meses} Meses`;
    return filtro.etiqueta || "Período Ordinario";
  }, [filtro]);

  const rangoFiltro = useMemo(() => {
    const inicio = filtro.inicio_periodo || filtro.fecha_inicio;
    const fin = filtro.fin_periodo || filtro.fecha_fin;
    if (inicio && fin && inicio !== fin) {
      return `${formatMonthYearLong(inicio)} a ${formatMonthYearLong(fin)}`;
    }
    if (inicio) return formatMonthYearLong(inicio);
    if (fin) return formatMonthYearLong(fin);
    return "Consolidado Integral";
  }, [filtro]);

  const fechaHoy = useMemo(() => {
    const f = new Date();
    const str = f.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, []);

  const horaHoy = useMemo(() => {
    return new Date().toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  if (!isReady) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        Generando reporte financiero...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        No se encontraron datos financieros para el filtro seleccionado.
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 10mm 10mm 12mm 10mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            height: auto !important;
          }
          #root {
            height: auto !important;
            min-height: 0 !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .report-body {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .page-break-before {
            page-break-before: always !important;
            break-before: page !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .page-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #ffffff;
            padding: 4px 0;
            margin-top: 0 !important;
          }
        }
      `}</style>

      <div
        className="report-body"
        style={{
          maxWidth: "920px",
          margin: "0 auto",
          padding: "18px",
          fontFamily: "'Segoe UI', Arial, sans-serif",
          color: "#0f172a",
          background: "#ffffff",
        }}
      >
                {/* ═════════════════════════════════════════════════════════════ */}
                {/* ENCABEZADO INSTITUCIONAL                                      */}
                {/* ═════════════════════════════════════════════════════════════ */}
                <div className="no-break" style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 60%, #1d4ed8 100%)",
                      color: "white",
                      padding: "14px 20px",
                      borderRadius: "8px 8px 0 0",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <img
                        src={logoSrc}
                        alt="Logo"
                        style={{ width: "76px", height: "76px", objectFit: "contain" }}
                      />
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                          Comisión Municipal de Agua Potable y Alcantarillado
                        </div>
                        <div style={{ fontSize: "11px", opacity: 0.92, marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          Villa Pesqueira, Sonora — Estado Financiero y Recaudación
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        background: "rgba(255,255,255,0.15)",
                        border: "1px solid rgba(255,255,255,0.3)",
                        borderRadius: "8px",
                        padding: "8px 14px",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.85 }}>Períodos Analizados</div>
                      <div style={{ fontWeight: 800, fontSize: "15px", marginTop: "2px" }}>{recaudacionMensual.length}</div>
                    </div>
                  </div>

                  {/* Fila de metadatos de filtro y período */}
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      borderTop: "none",
                      borderRadius: "0 0 8px 8px",
                      padding: "10px 16px",
                      display: "grid",
                      gridTemplateColumns: rangoFiltro !== "Consolidado Integral" ? "1.2fr 1.3fr 1.3fr 1.2fr" : "1.5fr 1.8fr 1.5fr",
                      gap: "12px",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "8.5px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: 700 }}>
                        Filtro Aplicado
                      </div>
                      <div style={{ fontSize: "11px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase" }}>
                        {filtro.etiqueta || "Consolidado General"}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "8.5px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: 700 }}>
                        Período Principal / Ejercicio
                      </div>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#1e3a8a" }}>
                        {periodoPrincipal}
                      </div>
                    </div>

                    {rangoFiltro !== "Consolidado Integral" && (
                      <div>
                        <div style={{ fontSize: "8.5px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: 700 }}>
                          Rango de Cobertura
                        </div>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>
                          {rangoFiltro}
                        </div>
                      </div>
                    )}

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "8.5px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: 700 }}>
                        Fecha de Expedición
                      </div>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "#334155" }}>
                        {fechaHoy}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ═════════════════════════════════════════════════════════════ */}
                {/* TARJETAS EJECUTIVAS DE KPIS FINANCIEROS (SERIAS Y LIMPIAS)    */}
                {/* ═════════════════════════════════════════════════════════════ */}
                <div
                  className="no-break"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                    gap: "8px",
                    marginBottom: "14px",
                  }}
                >
                  <div style={{ border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: "6px", padding: "8px 10px" }}>
                    <div style={{ fontSize: "8px", textTransform: "uppercase", color: "#475569", fontWeight: 700, letterSpacing: "0.04em" }}>
                      Facturación Emitida
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 900, color: "#0f172a", marginTop: "2px", fontFamily: "monospace" }}>
                      {money(totalFacturado)}
                    </div>
                    <div style={{ fontSize: "7.5px", color: "#64748b", marginTop: "2px" }}>
                      {fmt(totalFacturas)} recibos emitidos
                    </div>
                  </div>

                  <div style={{ border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: "6px", padding: "8px 10px" }}>
                    <div style={{ fontSize: "8px", textTransform: "uppercase", color: "#059669", fontWeight: 700, letterSpacing: "0.04em" }}>
                      Recaudación Corriente
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 900, color: "#059669", marginTop: "2px", fontFamily: "monospace" }}>
                      {money(totalRecaudado)}
                    </div>
                    <div style={{ fontSize: "7.5px", color: "#64748b", marginTop: "2px" }}>
                      {fmt(facturasPagadas)} recibos liquidados
                    </div>
                  </div>

                  <div style={{ border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: "6px", padding: "8px 10px" }}>
                    <div style={{ fontSize: "8px", textTransform: "uppercase", color: "#dc2626", fontWeight: 700, letterSpacing: "0.04em" }}>
                      Saldo Pendiente
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 900, color: "#dc2626", marginTop: "2px", fontFamily: "monospace" }}>
                      {money(saldoPendiente)}
                    </div>
                    <div style={{ fontSize: "7.5px", color: "#64748b", marginTop: "2px" }}>
                      {fmt(Math.max(0, totalFacturas - facturasPagadas))} recibos por cobrar
                    </div>
                  </div>

                  <div style={{ border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: "6px", padding: "8px 10px" }}>
                    <div style={{ fontSize: "8px", textTransform: "uppercase", color: "#0d9488", fontWeight: 700, letterSpacing: "0.04em" }}>
                      Caja Real (Efectivo)
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 900, color: "#0d9488", marginTop: "2px", fontFamily: "monospace" }}>
                      {money(totalRecaudadoCaja)}
                    </div>
                    <div style={{ fontSize: "7.5px", color: "#64748b", marginTop: "2px" }}>
                      {fmt(totalTransaccionesCaja)} cobros procesados
                    </div>
                  </div>

                  <div style={{ border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: "6px", padding: "8px 10px" }}>
                    <div style={{ fontSize: "8px", textTransform: "uppercase", color: "#1e3a8a", fontWeight: 700, letterSpacing: "0.04em" }}>
                      Eficiencia de Cobro
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 900, color: "#0f172a", marginTop: "2px", fontFamily: "monospace" }}>
                      {percent(eficienciaCobranza)}
                    </div>
                    <div style={{ fontSize: "7.5px", color: "#64748b", marginTop: "2px" }}>
                      {facturasPagadas} de {totalFacturas} saldados
                    </div>
                  </div>
                </div>

                {/* ═════════════════════════════════════════════════════════════ */}
                {/* ANÁLISIS FINANCIERO Y COMPORTAMIENTO DE COBRANZA              */}
                {/* ═════════════════════════════════════════════════════════════ */}
                <div
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "12px",
                    background: "#f8fafc",
                    marginBottom: "14px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div>
                      <h3 style={{ margin: "0 0 2px", fontSize: "11px", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 800 }}>
                        Comportamiento Mensual de Facturación y Recaudación
                      </h3>
                      <div style={{ fontSize: "9px", color: "#64748b" }}>
                        Comparativa consolidada entre facturación determinada, cobranza corriente del período y saldos pendientes.
                      </div>
                    </div>
                    <div style={{ fontSize: "9.5px", fontWeight: 800, color: "#059669", fontFamily: "monospace" }}>
                      EFICIENCIA GLOBAL: {percent(eficienciaCobranza)}
                    </div>
                  </div>

                  {/* 1. GRÁFICA COMPARATIVA GENERAL MULTIVARIABLE (SVG) */}
                  <div className="no-break" style={{ marginBottom: "14px" }}>
                    <div style={{ fontSize: "8.5px", color: "#64748b", fontWeight: 600, marginBottom: "4px" }}>
                      Rango Y: {money(0)} - {money(maxFinanciero)}
                    </div>

                    {recaudacionMensual.length === 0 ? (
                      <div style={{ fontSize: "10px", color: "#6b7280", padding: "10px", background: "white", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                        Sin serie financiera mensual para el período seleccionado.
                      </div>
                    ) : (
                      <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", background: "white", padding: "8px" }}>
                        <svg
                          width="100%"
                          viewBox={`0 0 ${Math.max(420, recaudacionMensual.length * 44 + 90)} 230`}
                          preserveAspectRatio="none"
                          style={{ height: "220px", display: "block" }}
                        >
                          {(() => {
                            const width = Math.max(420, recaudacionMensual.length * 44 + 90);
                            const chartTop = 20;
                            const chartBottom = 180;
                            const chartHeight = chartBottom - chartTop;
                            const left = 48;
                            const right = 20;
                            const plotWidth = width - left - right;
                            const groupWidth = plotWidth / recaudacionMensual.length;
                            const barWidth = Math.max(5, Math.min(12, groupWidth / 3.8));
                            const base = maxFinanciero > 0 ? maxFinanciero : 1;

                            return (
                              <>
                                {[0, 1, 2, 3, 4].map((step) => {
                                  const y = chartBottom - (step / 4) * chartHeight;
                                  const axisValue = (base * step) / 4;
                                  return (
                                    <g key={`grid-fin-${step}`}>
                                      <line x1={left} y1={y} x2={width - right} y2={y} stroke="#e2e8f0" strokeDasharray="2 2" strokeWidth="1" />
                                      <text x={left - 6} y={y + 3} textAnchor="end" fontSize="7" fill="#64748b" fontWeight="700">
                                        ${axisValue.toLocaleString("es-MX", { notation: "compact", maximumFractionDigits: 1 })}
                                      </text>
                                    </g>
                                  );
                                })}

                                {recaudacionMensual.map((row, idx) => {
                                  const esperado = Number(row.esperado || 0);
                                  const recaudado = Number(row.recaudado || 0);
                                  const pendiente = Number(row.pendiente || 0);
                                  const x = left + idx * groupWidth + groupWidth / 2;

                                  const hEsp = (esperado / base) * chartHeight;
                                  const hRec = (recaudado / base) * chartHeight;
                                  const hPen = (pendiente / base) * chartHeight;

                                  return (
                                    <g key={`bars-fin-${row.periodo}-${idx}`}>
                                      <rect x={x - barWidth * 1.7} y={chartBottom - hEsp} width={barWidth} height={hEsp} fill="#2563eb" rx="1.5" />
                                      <rect x={x - barWidth * 0.5} y={chartBottom - hRec} width={barWidth} height={hRec} fill="#059669" rx="1.5" />
                                      <rect x={x + barWidth * 0.7} y={chartBottom - hPen} width={barWidth} height={hPen} fill="#dc2626" rx="1.5" />
                                      <text x={x} y="204" textAnchor="middle" fontSize="8" fill="#475569" fontWeight="700">
                                        {shortMonth(row.periodo)}
                                      </text>
                                    </g>
                                  );
                                })}
                              </>
                            );
                          })()}
                        </svg>

                        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "6px", fontSize: "9px", color: "#334155" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ width: "8px", height: "8px", background: "#2563eb", borderRadius: "2px", display: "inline-block" }} />
                            Facturación Emitida (Determinada)
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ width: "8px", height: "8px", background: "#059669", borderRadius: "2px", display: "inline-block" }} />
                            Recaudación Corriente del Período
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ width: "8px", height: "8px", background: "#dc2626", borderRadius: "2px", display: "inline-block" }} />
                            Saldo Pendiente por Recuperar
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. DESGLOSE INDIVIDUAL POR COMPONENTE (ÓPTIMO PARA IMPRESIÓN B&W) */}
                  {recaudacionMensual.length > 0 && (
                    <div className="no-break">
                      <div style={{ fontSize: "9px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", marginBottom: "3px", letterSpacing: "0.03em" }}>
                        Desglose Individual por Componente Financiero (Óptimo para Impresión en Blanco y Negro)
                      </div>
                      <div style={{ fontSize: "8px", color: "#64748b", fontWeight: 600, marginBottom: "6px" }}>
                        Métricas analíticas a ancho completo para garantizar total legibilidad y separación de los 12 meses sin saturación ni recortes.
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {[
                          { campo: "esperado", titulo: "1. Facturación Emitida / Determinada (Cuotas y Consumos)", color: "#2563eb" },
                          { campo: "recaudado", titulo: "2. Recaudación Aplicada al Período (Cobranza Corriente)", color: "#059669" },
                          { campo: "pendiente", titulo: "3. Saldo Corriente Pendiente por Recuperar", color: "#dc2626" },
                        ].map((m) => {
                          const maxVal = Math.max(...recaudacionMensual.map((r) => Number(r[m.campo] || 0)), 1);
                          const totalVal = recaudacionMensual.reduce((acc, r) => acc + Number(r[m.campo] || 0), 0);
                          const width = Math.max(420, recaudacionMensual.length * 44 + 90);
                          const alto = 90;
                          const cTop = 22;
                          const cBottom = 70;
                          const cHeight = cBottom - cTop;
                          const left = 48;
                          const right = 20;
                          const pWidth = width - left - right;
                          const gWidth = pWidth / recaudacionMensual.length;
                          const bWidth = Math.max(10, Math.min(22, gWidth / 2.2));
                          const maxValK = Math.floor((maxVal / 1000) * 10) / 10;
                          const maxValStr =
                            maxVal >= 1000000
                              ? `$${(Math.floor((maxVal / 1000000) * 10) / 10).toFixed(1)}M`
                              : maxVal >= 1000
                                ? `$${maxValK.toFixed(1)}k`
                                : `$${Math.floor(maxVal)}`;
                          const midVal = maxVal / 2;
                          const midValK = Math.floor((midVal / 1000) * 10) / 10;
                          const midValStr =
                            midVal >= 1000000
                              ? `$${(Math.floor((midVal / 1000000) * 10) / 10).toFixed(1)}M`
                              : midVal >= 1000
                                ? `$${midValK.toFixed(1)}k`
                                : `$${Math.floor(midVal)}`;

                          return (
                            <div key={`sub-card-fin-${m.campo}`} style={{ border: "1px solid #cbd5e1", borderRadius: "5px", background: "white", padding: "6px 10px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                <span style={{ fontSize: "8.5px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase" }}>{m.titulo}</span>
                                <span style={{ fontSize: "9.5px", fontWeight: 800, color: m.color, fontFamily: "monospace" }}>{money(totalVal)}</span>
                              </div>
                              <svg width="100%" viewBox={`0 0 ${width} ${alto}`} preserveAspectRatio="none" style={{ height: "90px", display: "block" }}>
                                <line x1={left} y1={cTop} x2={width - right} y2={cTop} stroke="#e2e8f0" strokeDasharray="2 2" strokeWidth="0.8" />
                                <text x={left - 6} y={cTop + 3} textAnchor="end" fontSize="6.5" fill="#64748b" fontWeight="700">{maxValStr}</text>

                                <line x1={left} y1={cBottom} x2={width - right} y2={cBottom} stroke="#cbd5e1" strokeWidth="1" />
                                <text x={left - 6} y={cBottom + 2} textAnchor="end" fontSize="6.5" fill="#64748b" fontWeight="700">$0</text>

                                <line x1={left} y1={cBottom - cHeight / 2} x2={width - right} y2={cBottom - cHeight / 2} stroke="#e2e8f0" strokeDasharray="2 2" strokeWidth="0.8" />
                                <text x={left - 6} y={cBottom - cHeight / 2 + 2.5} textAnchor="end" fontSize="6" fill="#64748b" fontWeight="600">{midValStr}</text>

                                {recaudacionMensual.map((row, idx) => {
                                  const val = Number(row[m.campo] || 0);
                                  const x = left + idx * gWidth + gWidth / 2;
                                  const h = (val / maxVal) * cHeight;

                                  const esp = Number(row.esperado || 0);
                                  const rec = Number(row.recaudado || 0);
                                  const pen = Number(row.pendiente || 0);
                                  const espK = Math.floor((esp / 1000) * 10) / 10;
                                  const recK = Math.floor((rec / 1000) * 10) / 10;
                                  const penK = Math.max(0, Math.round((espK - recK) * 10) / 10);

                                  let valLabel = "$0";
                                  if (m.campo === "esperado") {
                                    valLabel =
                                      esp >= 1000000
                                        ? `$${(Math.floor((esp / 1000000) * 10) / 10).toFixed(1)}M`
                                        : esp >= 1000
                                          ? `$${espK.toFixed(1)}k`
                                          : `$${Math.floor(esp)}`;
                                  } else if (m.campo === "recaudado") {
                                    valLabel =
                                      rec >= 1000000
                                        ? `$${(Math.floor((rec / 1000000) * 10) / 10).toFixed(1)}M`
                                        : rec >= 1000
                                          ? `$${recK.toFixed(1)}k`
                                          : `$${Math.floor(rec)}`;
                                  } else {
                                    valLabel =
                                      pen >= 1000000
                                        ? `$${(Math.floor((pen / 1000000) * 10) / 10).toFixed(1)}M`
                                        : esp >= 1000
                                          ? `$${penK.toFixed(1)}k`
                                          : pen >= 1000
                                            ? `$${(Math.floor((pen / 1000) * 10) / 10).toFixed(1)}k`
                                            : `$${Math.floor(pen)}`;
                                  }

                                  return (
                                    <g key={`sub-fin-${m.campo}-${idx}`}>
                                      <rect
                                        x={x - bWidth / 2}
                                        y={cBottom - h}
                                        width={bWidth}
                                        height={Math.max(1.5, h)}
                                        fill={m.color}
                                        rx="1.5"
                                        stroke="#0f172a"
                                        strokeWidth="0.7"
                                      />
                                      <text x={x} y={cBottom - h - 3} textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#0f172a">
                                        {valLabel}
                                      </text>
                                      <text x={x} y="82" textAnchor="middle" fontSize="7" fontWeight="700" fill="#475569">
                                        {shortMonth(row.periodo)}
                                      </text>
                                    </g>
                                  );
                                })}
                              </svg>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* ═════════════════════════════════════════════════════════════ */}
                {/* TABLAS CONTABLES Y ANÁLISIS DE FLUJO DE CAJA                 */}
                {/* ═════════════════════════════════════════════════════════════ */}

                {/* 1. DESGLOSE MENSUAL DE FACTURACIÓN DETERMINADA Y RECAUDACIÓN */}
                {recaudacionMensual.length > 0 && (
                  <div
                    className="no-break page-break-before"
                    style={{
                      pageBreakBefore: "always",
                      breakBefore: "page",
                      marginBottom: "14px",
                    }}
                  >
                    <div style={{ fontSize: "9.5px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", marginBottom: "4px", letterSpacing: "0.04em" }}>
                      Desglose Mensual de Facturación Determinada y Recaudación Aplicada
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px", background: "white", border: "1px solid #cbd5e1", borderRadius: "6px", overflow: "hidden", pageBreakInside: "avoid", breakInside: "avoid" }}>
                      <thead>
                        <tr>
                          <th style={{ background: "#1e293b", color: "white", padding: "6px 8px", textAlign: "left" }}>Período Emitido</th>
                          <th style={{ background: "#1e293b", color: "white", padding: "6px 8px", textAlign: "right" }}>Facturación Emitida</th>
                          <th style={{ background: "#1e293b", color: "white", padding: "6px 8px", textAlign: "right" }}>Recaudación Corriente</th>
                          <th style={{ background: "#1e293b", color: "white", padding: "6px 8px", textAlign: "right" }}>Saldo Pendiente</th>
                          <th style={{ background: "#1e293b", color: "white", padding: "6px 8px", textAlign: "right" }}>% Eficiencia Cobro</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recaudacionMensual.map((rm, idx) => {
                          const esp = Number(rm.esperado || 0);
                          const rec = Number(rm.recaudado || 0);
                          const pen = Number(rm.pendiente || 0);
                          const pct = esp > 0 ? (rec / esp) * 100 : 0;
                          return (
                            <tr key={`rm-fin-${rm.periodo || idx}`}>
                              <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", fontWeight: 700 }}>{formatMonthYearLong(rm.periodo)}</td>
                              <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", textAlign: "right", fontFamily: "monospace" }}>{money(esp)}</td>
                              <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#059669" }}>{money(rec)}</td>
                              <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", textAlign: "right", fontFamily: "monospace", color: "#dc2626" }}>{money(pen)}</td>
                              <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>{percent(pct)}</td>
                            </tr>
                          );
                        })}
                        {/* Fila de Totales Consolidados */}
                        <tr style={{ background: "#f1f5f9" }}>
                          <td style={{ border: "1px solid #cbd5e1", padding: "6px 8px", fontWeight: 800, textTransform: "uppercase" }}>Total Consolidado</td>
                          <td style={{ border: "1px solid #cbd5e1", padding: "6px 8px", textAlign: "right", fontWeight: 800, fontFamily: "monospace" }}>{money(totalesMensual.esperado)}</td>
                          <td style={{ border: "1px solid #cbd5e1", padding: "6px 8px", textAlign: "right", fontWeight: 800, fontFamily: "monospace", color: "#059669" }}>{money(totalesMensual.recaudado)}</td>
                          <td style={{ border: "1px solid #cbd5e1", padding: "6px 8px", textAlign: "right", fontWeight: 800, fontFamily: "monospace", color: "#dc2626" }}>{money(totalesMensual.pendiente)}</td>
                          <td style={{ border: "1px solid #cbd5e1", padding: "6px 8px", textAlign: "right", fontWeight: 800, fontFamily: "monospace", color: "#0f172a" }}>
                            {percent(totalesMensual.esperado > 0 ? (totalesMensual.recaudado / totalesMensual.esperado) * 100 : 0)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 2. GRÁFICA DE RECAUDACIÓN POR MES DE PAGO (CAJA REAL · FLUJO EFECTIVO) - DEBAJO DE DESGLOSE MENSUAL */}
                {recaudacionCaja.length > 0 && (
                  <div
                    className="no-break"
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      padding: "12px",
                      background: "#f8fafc",
                      marginBottom: "14px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                      <div>
                        <div style={{ fontSize: "9.5px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase" }}>
                          Recaudación por Mes de Pago{" "}
                          <span style={{ color: "#0d9488", fontWeight: 800 }}>[Caja Real · Flujo Efectivo]</span>
                        </div>
                        <div style={{ fontSize: "8.5px", color: "#64748b", fontWeight: 600 }}>
                          Flujo de efectivo real percibido en ventanilla y cuentas bancarias según la fecha de cobro (incluye cobranza corriente y recuperación de rezagos históricos).
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "8.5px", color: "#64748b", fontWeight: 700 }}>Total Ingresado en Caja: </span>
                        <span style={{ fontSize: "11px", fontWeight: 900, color: "#0d9488", fontFamily: "monospace" }}>
                          {money(totalRecaudadoCaja)}
                        </span>
                        {totalTransaccionesCaja > 0 && (
                          <div style={{ fontSize: "7.5px", color: "#64748b" }}>
                            {fmt(totalTransaccionesCaja)} cobros registrados
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ border: "1px solid #cbd5e1", borderRadius: "6px", background: "white", padding: "8px" }}>
                      {(() => {
                        const width = Math.max(420, recaudacionCaja.length * 44 + 90);
                        const alto = 110;
                        const chartTop = 20;
                        const chartBottom = 82;
                        const chartHeight = chartBottom - chartTop;
                        const left = 48;
                        const right = 20;
                        const plotWidth = width - left - right;
                        const groupWidth = plotWidth / recaudacionCaja.length;
                        const barWidth = Math.max(10, Math.min(24, groupWidth / 2.2));
                        const base = maxCaja > 0 ? maxCaja : 1;

                        return (
                          <svg
                            width="100%"
                            viewBox={`0 0 ${width} ${alto}`}
                            preserveAspectRatio="none"
                            style={{ height: "110px", display: "block" }}
                          >
                            {[0, 1, 2, 3, 4].map((step) => {
                              const y = chartBottom - (step / 4) * chartHeight;
                              const axisVal = (base * step) / 4;
                              const axisValK = Math.floor((axisVal / 1000) * 10) / 10;
                              const axisLabel =
                                axisVal >= 1000000
                                  ? `$${(Math.floor((axisVal / 1000000) * 10) / 10).toFixed(1)}M`
                                  : axisVal >= 1000
                                    ? `$${axisValK.toFixed(1)}k`
                                    : `$${Math.floor(axisVal)}`;
                              return (
                                <g key={`grid-caja-${step}`}>
                                  <line
                                    x1={left}
                                    y1={y}
                                    x2={width - right}
                                    y2={y}
                                    stroke="#e2e8f0"
                                    strokeDasharray="2 2"
                                    strokeWidth="0.8"
                                  />
                                  <text
                                    x={left - 6}
                                    y={y + 3}
                                    textAnchor="end"
                                    fontSize="7"
                                    fill="#64748b"
                                    fontWeight="700"
                                  >
                                    {axisLabel}
                                  </text>
                                </g>
                              );
                            })}

                            {recaudacionCaja.map((row, idx) => {
                              const val = Number(row.recaudado || 0);
                              const x = left + idx * groupWidth + groupWidth / 2;
                              const h = (val / base) * chartHeight;
                              const valK = Math.floor((val / 1000) * 10) / 10;
                              const valStr =
                                val >= 1000000
                                  ? `$${(Math.floor((val / 1000000) * 10) / 10).toFixed(1)}M`
                                  : val >= 1000
                                    ? `$${valK.toFixed(1)}k`
                                    : `$${Math.floor(val)}`;

                              return (
                                <g key={`bars-caja-${row.periodo}-${idx}`}>
                                  <rect
                                    x={x - barWidth / 2}
                                    y={chartBottom - h}
                                    width={barWidth}
                                    height={Math.max(2, h)}
                                    fill="#0d9488"
                                    stroke="#0f172a"
                                    strokeWidth="0.8"
                                    rx="2"
                                  />
                                  <text
                                    x={x}
                                    y={chartBottom - h - 4}
                                    textAnchor="middle"
                                    fontSize="7"
                                    fontWeight="800"
                                    fill="#0f172a"
                                  >
                                    {valStr}
                                  </text>
                                  <text
                                    x={x}
                                    y="98"
                                    textAnchor="middle"
                                    fontSize="7.5"
                                    fill="#475569"
                                    fontWeight="700"
                                  >
                                    {shortMonth(row.periodo)}
                                  </text>
                                </g>
                              );
                            })}
                          </svg>
                        );
                      })()}

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px", fontSize: "9px", color: "#334155" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ width: "8px", height: "8px", background: "#0d9488", border: "1px solid #0f172a", borderRadius: "2px", display: "inline-block" }} />
                          Recaudación Efectiva Ingresada en Ventanilla (Flujo de Efectivo)
                        </span>
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>
                          Total Depositado en Caja: {money(totalRecaudadoCaja)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. DETALLE DE FLUJO EFECTIVO PERCIBIDO EN CAJA POR MES DE COBRO - DEBAJO DE LA GRÁFICA DE CAJA REAL */}
                {recaudacionCaja.length > 0 && (
                  <div className="no-break" style={{ marginBottom: "14px" }}>
                    <div style={{ fontSize: "9.5px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", marginBottom: "4px", letterSpacing: "0.04em" }}>
                      Detalle de Flujo Efectivo Percibido en Caja por Mes de Cobro
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px", background: "white", border: "1px solid #cbd5e1", borderRadius: "6px", overflow: "hidden" }}>
                      <thead>
                        <tr>
                          <th style={{ background: "#0d9488", color: "white", padding: "6px 8px", textAlign: "left" }}>Mes de Operación (Fecha de Cobro)</th>
                          <th style={{ background: "#0d9488", color: "white", padding: "6px 8px", textAlign: "right" }}>Recibos Cobrados en Ventanilla</th>
                          <th style={{ background: "#0d9488", color: "white", padding: "6px 8px", textAlign: "right" }}>Flujo Percibido en Caja ($ MXN)</th>
                          <th style={{ background: "#0d9488", color: "white", padding: "6px 8px", textAlign: "right" }}>% del Flujo Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recaudacionCaja.map((row, idx) => {
                          const cobrado = Number(row.recaudado || 0);
                          const pct = totalRecaudadoCaja > 0 ? (cobrado / totalRecaudadoCaja) * 100 : 0;
                          return (
                            <tr key={`caja-row-${row.periodo}-${idx}`}>
                              <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", fontWeight: 700 }}>{formatMonthYearLong(row.periodo)}</td>
                              <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", textAlign: "right", fontFamily: "monospace" }}>{fmt(row.transacciones || 0)}</td>
                              <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#0d9488" }}>{money(cobrado)}</td>
                              <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>{percent(pct)}</td>
                            </tr>
                          );
                        })}
                        <tr style={{ background: "#f0fdfa" }}>
                          <td style={{ border: "1px solid #ccfbf1", padding: "6px 8px", fontWeight: 800, textTransform: "uppercase" }}>Total Ingresado en Caja</td>
                          <td style={{ border: "1px solid #ccfbf1", padding: "6px 8px", textAlign: "right", fontWeight: 800, fontFamily: "monospace" }}>{fmt(totalTransaccionesCaja)}</td>
                          <td style={{ border: "1px solid #ccfbf1", padding: "6px 8px", textAlign: "right", fontWeight: 800, fontFamily: "monospace", color: "#0d9488" }}>{money(totalRecaudadoCaja)}</td>
                          <td style={{ border: "1px solid #ccfbf1", padding: "6px 8px", textAlign: "right", fontWeight: 800, fontFamily: "monospace" }}>100.0%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 4. BALANCE INTEGRAL DE DERECHOS, COBRANZA Y CARTERA DEUDORA */}
                <div
                  className="no-break page-break-before"
                  style={{
                    pageBreakBefore: "always",
                    breakBefore: "page",
                    marginBottom: "14px",
                  }}
                >
                  <div style={{ fontSize: "9.5px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", marginBottom: "4px", letterSpacing: "0.04em" }}>
                    Balance Integral de Derechos, Cobranza y Cartera Deudora
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px", background: "white", border: "1px solid #cbd5e1", borderRadius: "6px", overflow: "hidden" }}>
                    <thead>
                      <tr>
                        <th style={{ background: "#1e293b", color: "white", padding: "6px 8px", textAlign: "left" }}>Concepto Financiero y Contable</th>
                        <th style={{ background: "#1e293b", color: "white", padding: "6px 8px", textAlign: "right" }}>Cuentas / Recibos</th>
                        <th style={{ background: "#1e293b", color: "white", padding: "6px 8px", textAlign: "right" }}>Monto Consolidado ($ MXN)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", fontWeight: 700 }}>Facturación Total Determinada y Emitida (Ejercicio/Período)</td>
                        <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", textAlign: "right", fontFamily: "monospace" }}>{fmt(totalFacturas)}</td>
                        <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>{money(totalFacturado)}</td>
                      </tr>
                      <tr>
                        <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", fontWeight: 700, color: "#059669" }}>Recaudación Efectiva Aplicada a la Emisión Corriente</td>
                        <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", textAlign: "right", fontFamily: "monospace", color: "#059669" }}>{fmt(facturasPagadas)}</td>
                        <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 800, color: "#059669" }}>{money(totalRecaudado)}</td>
                      </tr>
                      <tr>
                        <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", fontWeight: 700, color: "#dc2626" }}>Saldo Corriente Pendiente de Cobro (Rezago del Ejercicio)</td>
                        <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", textAlign: "right", fontFamily: "monospace", color: "#dc2626" }}>{fmt(Math.max(0, totalFacturas - facturasPagadas))}</td>
                        <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 800, color: "#dc2626" }}>{money(saldoPendiente)}</td>
                      </tr>
                      <tr style={{ background: "#f8fafc" }}>
                        <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", fontWeight: 700, color: "#475569" }}>Cartera Vencida Histórica Acumulada (Rezagos Previos)</td>
                        <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", textAlign: "right", fontFamily: "monospace", color: "#64748b" }}>Acumulado Histórico</td>
                        <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#475569" }}>{money(carteraVencida)}</td>
                      </tr>
                      <tr style={{ background: "#f1f5f9" }}>
                        <td style={{ border: "1px solid #cbd5e1", padding: "6px 8px", fontWeight: 800, textTransform: "uppercase", color: "#0f172a" }}>
                          Índice de Eficiencia Recaudatoria (Cobranza / Emisión)
                        </td>
                        <td style={{ border: "1px solid #cbd5e1", padding: "6px 8px", textAlign: "right", fontWeight: 800, fontFamily: "monospace", color: "#0f172a" }}>
                          {facturasPagadas} / {totalFacturas}
                        </td>
                        <td style={{ border: "1px solid #cbd5e1", padding: "6px 8px", textAlign: "right", fontWeight: 800, fontFamily: "monospace", color: "#059669", fontSize: "11px" }}>
                          {percent(eficienciaCobranza)}
                        </td>
                      </tr>
                      <tr style={{ background: "#f0fdfa" }}>
                        <td style={{ border: "1px solid #ccfbf1", padding: "6px 8px", fontWeight: 800, textTransform: "uppercase", color: "#0d9488" }}>
                          Flujo Total de Efectivo Percibido en Caja (Ventanilla / Bancos)
                        </td>
                        <td style={{ border: "1px solid #ccfbf1", padding: "6px 8px", textAlign: "right", fontWeight: 800, fontFamily: "monospace", color: "#0d9488" }}>
                          {fmt(totalTransaccionesCaja)} cobros registrados
                        </td>
                        <td style={{ border: "1px solid #ccfbf1", padding: "6px 8px", textAlign: "right", fontWeight: 800, fontFamily: "monospace", color: "#0d9488", fontSize: "11px" }}>
                          {money(totalRecaudadoCaja)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 5. CLASIFICACIÓN DE INGRESOS POR MEDIO DE PAGO */}
                {metodosPagoTabla.length > 0 && (
                  <div className="no-break" style={{ marginBottom: "0px" }}>
                    <div style={{ fontSize: "9.5px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", marginBottom: "4px", letterSpacing: "0.04em" }}>
                      Clasificación de Ingresos por Medio de Pago
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px", background: "white", border: "1px solid #cbd5e1", borderRadius: "6px", overflow: "hidden" }}>
                      <thead>
                        <tr>
                          <th style={{ background: "#1e293b", color: "white", padding: "6px 8px", textAlign: "left" }}>Medio de Pago / Canal de Cobro</th>
                          <th style={{ background: "#1e293b", color: "white", padding: "6px 8px", textAlign: "right" }}>Operaciones</th>
                          <th style={{ background: "#1e293b", color: "white", padding: "6px 8px", textAlign: "right" }}>Total Percibido ($ MXN)</th>
                          <th style={{ background: "#1e293b", color: "white", padding: "6px 8px", textAlign: "right" }}>% Participación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metodosPagoTabla.map((mp, idx) => {
                          const pct = totalMetodosPago > 0 ? (mp.total / totalMetodosPago) * 100 : 0;
                          return (
                            <tr key={`mp-fin-${idx}`}>
                              <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", fontWeight: 700, textTransform: "uppercase" }}>{mp.metodo}</td>
                              <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", textAlign: "right", fontFamily: "monospace" }}>{fmt(mp.cantidad)}</td>
                              <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#059669" }}>{money(mp.total)}</td>
                              <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>{percent(pct)}</td>
                            </tr>
                          );
                        })}
                        <tr style={{ background: "#eff6ff" }}>
                          <td style={{ border: "1px solid #cbd5e1", padding: "6px 8px", fontWeight: 800, textTransform: "uppercase" }}>Total Ingresos Canalizados</td>
                          <td style={{ border: "1px solid #cbd5e1", padding: "6px 8px", textAlign: "right", fontWeight: 800, fontFamily: "monospace" }}>{fmt(totalOperacionesMetodos)}</td>
                          <td style={{ border: "1px solid #cbd5e1", padding: "6px 8px", textAlign: "right", fontWeight: 800, fontFamily: "monospace", color: "#1e3a8a" }}>{money(totalMetodosPago)}</td>
                          <td style={{ border: "1px solid #cbd5e1", padding: "6px 8px", textAlign: "right", fontWeight: 800, fontFamily: "monospace" }}>100.0%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                {/* --- FIN DEL CONTENIDO PRINCIPAL --- */}

        {/* PIE DE PÁGINA FIJO INSTITUCIONAL */}
        <div
          className="page-footer"
          style={{
            borderTop: "1px solid #cbd5e1",
            padding: "6px 8px",
            fontSize: "8.5px",
            color: "#64748b",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#ffffff",
          }}
        >
          <span>
            AGUA VILLA PESQUEIRA · Informe Financiero y Recaudación Oficial · Emisión: {fechaHoy} ({horaHoy} hrs)
          </span>
          <span style={{ fontWeight: 700, color: "#1e3a8a" }}>
            Organismo Operador Municipal · Sistema AguaVP
          </span>
        </div>
      </div>
    </>
  );
};

export default ReporteFinancieroPagos;
