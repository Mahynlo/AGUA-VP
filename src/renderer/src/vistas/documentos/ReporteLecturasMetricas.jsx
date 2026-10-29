import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppLogo } from "../../context/LogoContext";
import { useNotifyPrintReady } from "../../hooks/useNotifyPrintReady";

const fmt = (n, dec = 0) =>
  Number(n || 0).toLocaleString("es-MX", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });

const percent = (value) => `${Number(value || 0).toFixed(1)}%`;

const shortMonth = (periodoMes) => {
  if (!periodoMes || !/^\d{4}-\d{2}$/.test(periodoMes)) return periodoMes || "";
  const [anio, mes] = periodoMes.split("-");
  const fecha = new Date(Number(anio), Number(mes) - 1, 1);
  return fecha
    .toLocaleDateString("es-MX", { month: "short" })
    .replace(".", "")
    .toUpperCase();
};

const formatMonthYearLong = (periodoMes) => {
  if (!periodoMes || !/^\d{4}-\d{2}$/.test(periodoMes)) return periodoMes || "-";
  const [anio, mes] = periodoMes.split("-");
  const fecha = new Date(Number(anio), Number(mes) - 1, 1);
  const label = fecha.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const ReporteLecturasMetricas = () => {
  const [searchParams] = useSearchParams();
  const { logoSrc } = useAppLogo();
  const [data, setData] = useState(null);
  const [ready, setReady] = useState(false);

  useNotifyPrintReady(ready);

  useEffect(() => {
    const load = async () => {
      const dataKey = searchParams.get("dataKey");
      if (!dataKey) {
        setData(null);
        setReady(true);
        return;
      }

      try {
        const raw = await window.api.getPrintData(dataKey);
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        setData(parsed || null);
      } catch (error) {
        console.error("Error leyendo datos de impresión:", error);
        setData(null);
      } finally {
        setReady(true);
      }
    };

    load();
  }, [searchParams]);

  const consumo = data?.consumo || {};
  const rutasData = data?.rutas || {};
  const rutasResumen = rutasData?.resumen || {};
  const filtro = data?.filtro_aplicado || {};
  const resumen = consumo?.resumen || {};

  const consumoMensual = useMemo(
    () => consumo?.series?.consumo_mensual || [],
    [consumo],
  );

  const distribucionRutas = useMemo(
    () => consumo?.distribucion_rutas || [],
    [consumo],
  );

  const menorConsumo = useMemo(
    () => consumo?.listados?.menor_consumo || [],
    [consumo],
  );

  const maxConsumo = useMemo(
    () =>
      consumoMensual.reduce(
        (acc, row) => Math.max(acc, Number(row.consumo_total_m3 || 0)),
        0,
      ),
    [consumoMensual],
  );

  const maxRecibos = useMemo(
    () =>
      consumoMensual.reduce(
        (acc, row) => Math.max(acc, Number(row.recibos || 0)),
        0,
      ),
    [consumoMensual],
  );

  const rangoFiltro = useMemo(() => {
    const inicio = filtro.inicio_periodo || filtro.fecha_inicio;
    const fin = filtro.fin_periodo || filtro.fecha_fin;
    if (inicio && fin && inicio !== fin) {
      return `${formatMonthYearLong(inicio)} a ${formatMonthYearLong(fin)}`;
    }
    if (inicio) return formatMonthYearLong(inicio);
    if (fin) return formatMonthYearLong(fin);
    return "Consolidado General";
  }, [filtro]);

  const periodoPrincipal = useMemo(() => {
    if (filtro.periodo) return formatMonthYearLong(filtro.periodo);
    if (filtro.anio) return `Ejercicio Fiscal ${filtro.anio}`;
    if (filtro.meses) return `Últimos ${filtro.meses} Meses`;
    return filtro.etiqueta || "Período Ordinario";
  }, [filtro]);

  // Cálculos de variaciones mes a mes
  const deltasConsumo = useMemo(() => {
    if (!consumoMensual || consumoMensual.length < 2) return [];
    return consumoMensual.map((currRow, i) => {
      const curr = Number(currRow.consumo_total_m3 || 0);
      if (i === 0) {
        return {
          periodo: currRow.periodo,
          diff: 0,
          pct: 0,
          isBase: true,
          consumo: curr,
        };
      }
      const prev = Number(consumoMensual[i - 1].consumo_total_m3 || 0);
      const diff = curr - prev;
      const pct = prev > 0 ? (diff / prev) * 100 : 0;
      return {
        periodo: currRow.periodo,
        diff,
        pct,
        isBase: false,
        consumo: curr,
      };
    });
  }, [consumoMensual]);

  const maxAbsDiff = useMemo(() => {
    if (!deltasConsumo.length) return 1;
    return Math.max(...deltasConsumo.map((d) => Math.abs(d.diff)), 1);
  }, [deltasConsumo]);

  // Totales de tablas
  const totalRecibosTabla = useMemo(
    () => consumoMensual.reduce((acc, r) => acc + Number(r.recibos || 0), 0),
    [consumoMensual],
  );

  const totalConsumoTabla = useMemo(
    () => consumoMensual.reduce((acc, r) => acc + Number(r.consumo_total_m3 || 0), 0),
    [consumoMensual],
  );

  const totalConsumoRutas = useMemo(
    () => distribucionRutas.reduce((acc, r) => acc + Number(r.consumo_total_m3 || 0), 0),
    [distribucionRutas],
  );

  const totalRecibosRutas = useMemo(
    () => distribucionRutas.reduce((acc, r) => acc + Number(r.recibos || 0), 0),
    [distribucionRutas],
  );

  const fechaHoyLarga = useMemo(() => {
    const f = new Date().toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return f.charAt(0).toUpperCase() + f.slice(1);
  }, []);

  const fechaHoyCorta = useMemo(() => {
    return new Date().toLocaleDateString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }, []);

  const horaHoy = useMemo(() => {
    return new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  }, []);

  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Cargando reporte...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        No hay datos para mostrar.
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          @page { size: letter portrait; margin: 10mm; }
          body { margin: 0; padding: 0; background: white; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-break { page-break-inside: avoid; break-inside: avoid; }
          .page-break { page-break-before: always; break-before: page; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          tr { page-break-inside: avoid; }
          .page-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #ffffff;
            margin-top: 0 !important;
            padding: 6px 4px;
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
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td>
                {/* ── ENCABEZADO INSTITUCIONAL OFICIAL ── */}
                <div className="no-break" style={{ marginBottom: "10px" }}>
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
                      {logoSrc ? (
                        <img src={logoSrc} alt="Logo" style={{ width: "68px", height: "68px", objectFit: "contain" }} />
                      ) : (
                        <div style={{ width: "68px", height: "68px", background: "rgba(255,255,255,0.2)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                          AGUA VP
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                          Comisión Municipal de Agua Potable y Alcantarillado
                        </div>
                        <div style={{ fontSize: "11px", color: "#dbeafe", marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          Villa Pesqueira, Sonora — Reporte de Métricas de Lecturas
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        background: "rgba(255,255,255,0.15)",
                        border: "1px solid rgba(255,255,255,0.35)",
                        borderRadius: "8px",
                        padding: "8px 16px",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#bfdbfe", fontWeight: 700 }}>
                        Períodos
                      </div>
                      <div style={{ fontWeight: 800, fontSize: "18px", marginTop: "1px", color: "#ffffff" }}>
                        {consumoMensual.length || 1}
                      </div>
                    </div>
                  </div>

                  {/* ── CINTILLO DE METADATOS ── */}
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      borderTop: "none",
                      borderRadius: "0 0 8px 8px",
                      padding: "8px 14px",
                      display: "grid",
                      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "7px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: 700 }}>
                        Filtro aplicado
                      </div>
                      <div style={{ fontSize: "10px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase" }}>
                        {filtro.etiqueta || "General"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "7px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: 700 }}>
                        Período principal
                      </div>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "#1e3a8a" }}>
                        {periodoPrincipal}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "7px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: 700 }}>
                        Rango de cobertura
                      </div>
                      <div style={{ fontSize: "10px", fontWeight: 600, color: "#475569" }}>
                        {rangoFiltro}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "7px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: 700 }}>
                        Expedición
                      </div>
                      <div style={{ fontSize: "9px", fontWeight: 600, color: "#475569" }}>
                        {fechaHoyLarga}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── 5 TARJETAS DE KPIS OPERATIVOS ── */}
                <div
                  className="no-break"
                  style={{
                    marginBottom: "12px",
                    display: "grid",
                    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                    gap: "8px",
                  }}
                >
                  <div style={{ border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: "8px", padding: "10px" }}>
                    <div style={{ fontSize: "8px", textTransform: "uppercase", color: "#475569", fontWeight: 700 }}>Recibos Emitidos</div>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>{fmt(resumen.total_recibos)}</div>
                    <div style={{ fontSize: "7.5px", color: "#64748b", marginTop: "2px" }}>Padrón activo facturado</div>
                  </div>

                  <div style={{ border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: "8px", padding: "10px" }}>
                    <div style={{ fontSize: "8px", textTransform: "uppercase", color: "#2563eb", fontWeight: 700 }}>Agua Consumida</div>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: "#2563eb", marginTop: "2px" }}>{fmt(resumen.consumo_total_m3, 2)} m³</div>
                    <div style={{ fontSize: "7.5px", color: "#64748b", marginTop: "2px" }}>Volumen total medido</div>
                  </div>

                  <div style={{ border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: "8px", padding: "10px" }}>
                    <div style={{ fontSize: "8px", textTransform: "uppercase", color: "#059669", fontWeight: 700 }}>Promedio por Recibo</div>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: "#059669", marginTop: "2px" }}>{fmt(resumen.consumo_promedio_m3, 2)} m³</div>
                    <div style={{ fontSize: "7.5px", color: "#64748b", marginTop: "2px" }}>Media mensual por toma</div>
                  </div>

                  <div style={{ border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: "8px", padding: "10px" }}>
                    <div style={{ fontSize: "8px", textTransform: "uppercase", color: "#d97706", fontWeight: 700 }}>Clientes en Padrón</div>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: "#d97706", marginTop: "2px" }}>{fmt(resumen.total_clientes)}</div>
                    <div style={{ fontSize: "7.5px", color: "#64748b", marginTop: "2px" }}>Tomas registradas</div>
                  </div>

                  <div style={{ border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: "8px", padding: "10px" }}>
                    <div style={{ fontSize: "8px", textTransform: "uppercase", color: "#1e3a8a", fontWeight: 700 }}>Promedio Cliente</div>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: "#1e3a8a", marginTop: "2px" }}>{fmt(resumen.promedio_consumo_por_cliente_m3, 2)} m³</div>
                    <div style={{ fontSize: "7.5px", color: "#64748b", marginTop: "2px" }}>Intensidad de uso</div>
                  </div>
                </div>

                {/* ── GRÁFICA 1: TENDENCIA MENSUAL DE CONSUMO (SOLO m³) ── */}
                <div
                  className="no-break"
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    background: "#ffffff",
                    marginBottom: "10px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                    <h3 style={{ margin: 0, fontSize: "11px", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 800 }}>
                      Tendencia Mensual de Consumo de Agua Potable (m³)
                    </h3>
                    <span style={{ fontSize: "10px", fontWeight: 800, color: "#2563eb" }}>
                      VOLUMEN TOTAL: {fmt(resumen.consumo_total_m3, 2)} m³
                    </span>
                  </div>
                  <div style={{ fontSize: "8px", color: "#64748b", marginBottom: "6px" }}>
                    Volumen hidráulico mensual medido y facturado en metros cúbicos para los períodos analizados.
                  </div>

                  {consumoMensual.length === 0 ? (
                    <div style={{ padding: "14px", textAlign: "center", color: "#64748b", fontSize: "9px", background: "#f8fafc", borderRadius: "6px" }}>
                      Sin datos de consumo mensual para el período seleccionado.
                    </div>
                  ) : (
                    <div>
                      <svg
                        width="100%"
                        viewBox={`0 0 ${Math.max(480, consumoMensual.length * 48 + 90)} 160`}
                        preserveAspectRatio="none"
                        style={{ height: "145px", display: "block" }}
                      >
                        {(() => {
                          const width = Math.max(480, consumoMensual.length * 48 + 90);
                          const chartTop = 16;
                          const chartBottom = 136;
                          const chartHeight = chartBottom - chartTop;
                          const left = 46;
                          const right = 24;
                          const plotWidth = width - left - right;
                          const groupWidth = plotWidth / consumoMensual.length;
                          const barWidth = Math.max(8, Math.min(22, groupWidth / 2.3));
                          const baseConsumo = maxConsumo > 0 ? maxConsumo : 1;

                          return (
                            <>
                              {[0, 1, 2, 3, 4].map((step) => {
                                const y = chartBottom - (step / 4) * chartHeight;
                                const axisConsumo = (baseConsumo * step) / 4;
                                return (
                                  <g key={`grid-c-${step}`}>
                                    <line x1={left} y1={y} x2={width - right} y2={y} stroke="#e2e8f0" strokeDasharray="2 2" strokeWidth="0.8" />
                                    <text x={left - 6} y={y + 3} textAnchor="end" fontSize="7" fill="#475569" fontWeight="700">
                                      {axisConsumo.toLocaleString("es-MX", { notation: "compact", maximumFractionDigits: 1 })}
                                    </text>
                                  </g>
                                );
                              })}

                              {consumoMensual.map((row, idx) => {
                                const consumoVal = Number(row.consumo_total_m3 || 0);
                                const x = left + idx * groupWidth + groupWidth / 2;
                                const hCon = (consumoVal / baseConsumo) * (chartHeight - 8);
                                const barTop = chartBottom - hCon;
                                const valLabel = consumoVal >= 1000 ? (consumoVal / 1000).toFixed(1) + "k" : Math.round(consumoVal);

                                return (
                                  <g key={`bar-c-${row.periodo}-${idx}`}>
                                    <rect
                                      x={x - barWidth / 2}
                                      y={barTop}
                                      width={barWidth}
                                      height={Math.max(2, hCon)}
                                      fill="#2563eb"
                                      rx="2"
                                    />
                                    <text x={x} y={barTop - 4} textAnchor="middle" fontSize="6.5" fill="#2563eb" fontWeight="700">
                                      {valLabel}
                                    </text>
                                    <text x={x} y="152" textAnchor="middle" fontSize="7.5" fill="#0f172a" fontWeight="700">
                                      {shortMonth(row.periodo)}
                                    </text>
                                  </g>
                                );
                              })}
                            </>
                          );
                        })()}
                      </svg>

                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "8px", color: "#334155" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "5px", fontWeight: 700, color: "#2563eb" }}>
                          <span style={{ width: "9px", height: "9px", background: "#2563eb", borderRadius: "2px", display: "inline-block" }} />
                          ■ Consumo Medido Facturado (m³)
                        </span>
                        <span style={{ color: "#64748b" }}>
                          Promedio: {fmt(resumen.consumo_promedio_m3, 2)} m³/recibo
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── GRÁFICA 2: ANÁLISIS DE VARIACIÓN INTERMENSUAL DE CONSUMO ── */}
                <div
                  className="no-break"
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    background: "#ffffff",
                    marginBottom: "10px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                    <h3 style={{ margin: 0, fontSize: "11px", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 800 }}>
                      Análisis de Variación Intermensual de Consumo (Incremento / Decremento)
                    </h3>
                    <span style={{ fontSize: "8.5px", fontWeight: 700, color: "#64748b" }}>
                      TENDENCIA RELATIVA MES A MES
                    </span>
                  </div>
                  <div style={{ fontSize: "8px", color: "#64748b", marginBottom: "6px" }}>
                    Fluctuación porcentual y neta en m³ respecto al mes inmediato anterior. Identifica picos estacionales o descensos de demanda.
                  </div>

                  {deltasConsumo.length < 2 ? (
                    <div style={{ padding: "14px", textAlign: "center", color: "#64748b", fontSize: "9px", background: "#f8fafc", borderRadius: "6px" }}>
                      Se requieren al menos dos períodos para calcular la variación intermensual.
                    </div>
                  ) : (
                    <div>
                      <svg
                        width="100%"
                        viewBox={`0 0 ${Math.max(480, deltasConsumo.length * 48 + 90)} 140`}
                        preserveAspectRatio="none"
                        style={{ height: "125px", display: "block" }}
                      >
                        {(() => {
                          const width = Math.max(480, deltasConsumo.length * 48 + 90);
                          const chartTop = 16;
                          const chartBottom = 118;
                          const chartHeight = chartBottom - chartTop;
                          const zeroY = chartTop + chartHeight / 2;
                          const availableHalf = chartHeight / 2 - 10;
                          const left = 46;
                          const right = 24;
                          const plotWidth = width - left - right;
                          const groupWidth = plotWidth / deltasConsumo.length;
                          const barWidth = Math.max(8, Math.min(22, groupWidth / 2.3));

                          return (
                            <>
                              <line x1={left} y1={chartTop} x2={width - right} y2={chartTop} stroke="#e2e8f0" strokeDasharray="2 2" strokeWidth="0.8" />
                              <text x={left - 5} y={chartTop + 3} textAnchor="end" fontSize="6.5" fill="#64748b" fontWeight="700">
                                +{fmt(maxAbsDiff, 1)} m³
                              </text>
                              <line x1={left} y1={zeroY} x2={width - right} y2={zeroY} stroke="#94a3b8" strokeWidth="1.2" />
                              <text x={left - 5} y={zeroY + 3} textAnchor="end" fontSize="6.5" fill="#0f172a" fontWeight="700">
                                0 m³
                              </text>
                              <line x1={left} y1={chartBottom} x2={width - right} y2={chartBottom} stroke="#e2e8f0" strokeDasharray="2 2" strokeWidth="0.8" />
                              <text x={left - 5} y={chartBottom + 3} textAnchor="end" fontSize="6.5" fill="#64748b" fontWeight="700">
                                -{fmt(maxAbsDiff, 1)} m³
                              </text>

                              {deltasConsumo.map((d, idx) => {
                                const x = left + idx * groupWidth + groupWidth / 2;
                                if (d.isBase) {
                                  return (
                                    <g key={`delta-${idx}`}>
                                      <circle cx={x} cy={zeroY} r="3" fill="#64748b" />
                                      <text x={x} y={zeroY - 5} textAnchor="middle" fontSize="6.5" fill="#64748b" fontWeight="700">
                                        Base
                                      </text>
                                      <text x={x} y="134" textAnchor="middle" fontSize="7.5" fill="#0f172a" fontWeight="700">
                                        {shortMonth(d.periodo)}
                                      </text>
                                    </g>
                                  );
                                }
                                if (d.diff >= 0) {
                                  const h = (d.diff / maxAbsDiff) * availableHalf;
                                  const barTop = zeroY - h;
                                  return (
                                    <g key={`delta-${idx}`}>
                                      <rect x={x - barWidth / 2} y={barTop} width={barWidth} height={Math.max(2, h)} fill="#2563eb" rx="2" />
                                      <text x={x} y={barTop - 3} textAnchor="middle" fontSize="6.5" fill="#2563eb" fontWeight="700">
                                        +{d.pct.toFixed(1)}%
                                      </text>
                                      <text x={x} y="134" textAnchor="middle" fontSize="7.5" fill="#0f172a" fontWeight="700">
                                        {shortMonth(d.periodo)}
                                      </text>
                                    </g>
                                  );
                                }
                                const h = (Math.abs(d.diff) / maxAbsDiff) * availableHalf;
                                const barBottom = zeroY + h;
                                return (
                                  <g key={`delta-${idx}`}>
                                    <rect x={x - barWidth / 2} y={zeroY} width={barWidth} height={Math.max(2, h)} fill="#dc2626" rx="2" />
                                    <text x={x} y={barBottom + 8} textAnchor="middle" fontSize="6.5" fill="#dc2626" fontWeight="700">
                                      {d.pct.toFixed(1)}%
                                    </text>
                                    <text x={x} y="134" textAnchor="middle" fontSize="7.5" fill="#0f172a" fontWeight="700">
                                      {shortMonth(d.periodo)}
                                    </text>
                                  </g>
                                );
                              })}
                            </>
                          );
                        })()}
                      </svg>

                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "8px" }}>
                        <span style={{ fontWeight: 700, color: "#2563eb" }}>■ Incremento de Consumo (%)</span>
                        <span style={{ fontWeight: 700, color: "#dc2626" }}>■ Reducción de Consumo (%)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── GRÁFICA 3: EVOLUCIÓN MENSUAL DE CLIENTES Y RECIBOS FACTURADOS ── */}
                <div
                  className="no-break"
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    background: "#ffffff",
                    marginBottom: "14px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                    <h3 style={{ margin: 0, fontSize: "11px", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 800 }}>
                      Evolución Mensual de Clientes y Recibos Facturados
                    </h3>
                    <span style={{ fontSize: "10px", fontWeight: 800, color: "#1e3a8a" }}>
                      TOTAL PADRÓN: {fmt(resumen.total_recibos)} RECIBOS
                    </span>
                  </div>
                  <div style={{ fontSize: "8px", color: "#64748b", marginBottom: "6px" }}>
                    Total de tomas y usuarios activos censados con recibo emitido en cada ciclo operativo.
                  </div>

                  {consumoMensual.length === 0 ? (
                    <div style={{ padding: "14px", textAlign: "center", color: "#64748b", fontSize: "9px", background: "#f8fafc", borderRadius: "6px" }}>
                      Sin datos de recibos para el período seleccionado.
                    </div>
                  ) : (
                    <div>
                      <svg
                        width="100%"
                        viewBox={`0 0 ${Math.max(480, consumoMensual.length * 48 + 90)} 150`}
                        preserveAspectRatio="none"
                        style={{ height: "135px", display: "block" }}
                      >
                        {(() => {
                          const width = Math.max(480, consumoMensual.length * 48 + 90);
                          const chartTop = 16;
                          const chartBottom = 126;
                          const chartHeight = chartBottom - chartTop;
                          const left = 46;
                          const right = 24;
                          const plotWidth = width - left - right;
                          const groupWidth = plotWidth / consumoMensual.length;
                          const barWidth = Math.max(8, Math.min(22, groupWidth / 2.3));
                          const baseRecibos = maxRecibos > 0 ? maxRecibos : 1;

                          return (
                            <>
                              {[0, 1, 2, 3, 4].map((step) => {
                                const y = chartBottom - (step / 4) * chartHeight;
                                const axisRecibos = (baseRecibos * step) / 4;
                                return (
                                  <g key={`grid-r-${step}`}>
                                    <line x1={left} y1={y} x2={width - right} y2={y} stroke="#e2e8f0" strokeDasharray="2 2" strokeWidth="0.8" />
                                    <text x={left - 6} y={y + 3} textAnchor="end" fontSize="7" fill="#475569" fontWeight="700">
                                      {Math.round(axisRecibos)}
                                    </text>
                                  </g>
                                );
                              })}

                              {consumoMensual.map((row, idx) => {
                                const recibos = Number(row.recibos || 0);
                                const x = left + idx * groupWidth + groupWidth / 2;
                                const hRec = (recibos / baseRecibos) * (chartHeight - 8);
                                const barTop = chartBottom - hRec;

                                return (
                                  <g key={`bar-r-${row.periodo}-${idx}`}>
                                    <rect
                                      x={x - barWidth / 2}
                                      y={barTop}
                                      width={barWidth}
                                      height={Math.max(2, hRec)}
                                      fill="#1e3a8a"
                                      rx="2"
                                    />
                                    <text x={x} y={barTop - 4} textAnchor="middle" fontSize="6.5" fill="#1e3a8a" fontWeight="700">
                                      {fmt(recibos)}
                                    </text>
                                    <text x={x} y="142" textAnchor="middle" fontSize="7.5" fill="#0f172a" fontWeight="700">
                                      {shortMonth(row.periodo)}
                                    </text>
                                  </g>
                                );
                              })}
                            </>
                          );
                        })()}
                      </svg>

                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "8px", color: "#334155" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "5px", fontWeight: 700, color: "#1e3a8a" }}>
                          <span style={{ width: "9px", height: "9px", background: "#1e3a8a", borderRadius: "2px", display: "inline-block" }} />
                          ■ Tomas y Clientes Facturados por Período
                        </span>
                        <span style={{ color: "#64748b" }}>
                          Total clientes en padrón: {fmt(resumen.total_clientes)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── SALTO DE PÁGINA PARA TABLAS ── */}
                <div className="page-break" style={{ height: "1px" }} />

                {/* ── DESGLOSE CRONOLÓGICO DE CONSUMO MENSUAL ── */}
                <div style={{ marginTop: "14px", marginBottom: "14px" }} className="no-break">
                  <h3 style={{ margin: "0 0 6px", fontSize: "11px", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 800 }}>
                    Desglose Cronológico y Rendimiento Mensual de Consumo
                  </h3>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px" }}>
                    <thead>
                      <tr>
                        <th style={{ background: "#1e293b", color: "white", padding: "6px 8px", textAlign: "left" }}>Período / Mes</th>
                        <th style={{ background: "#1e293b", color: "white", padding: "6px 8px", textAlign: "right" }}>Recibos / Tomas</th>
                        <th style={{ background: "#1e293b", color: "white", padding: "6px 8px", textAlign: "right" }}>Consumo Total (m³)</th>
                        <th style={{ background: "#1e293b", color: "white", padding: "6px 8px", textAlign: "right" }}>Promedio por Recibo (m³)</th>
                        <th style={{ background: "#1e293b", color: "white", padding: "6px 8px", textAlign: "right" }}>Variación vs Anterior</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consumoMensual.map((row, idx) => {
                        const rec = Number(row.recibos || 0);
                        const con = Number(row.consumo_total_m3 || 0);
                        const prom = Number(row.consumo_promedio_m3 || 0);

                        let varStr = "-";
                        let varColor = "#64748b";
                        if (idx > 0) {
                          const prevCon = Number(consumoMensual[idx - 1].consumo_total_m3 || 0);
                          const diff = con - prevCon;
                          const pct = prevCon > 0 ? (diff / prevCon) * 100 : 0;
                          if (diff > 0) {
                            varStr = `+${fmt(diff, 1)} m³ (+${pct.toFixed(1)}%)`;
                            varColor = "#2563eb";
                          } else if (diff < 0) {
                            varStr = `${fmt(diff, 1)} m³ (${pct.toFixed(1)}%)`;
                            varColor = "#dc2626";
                          } else {
                            varStr = "0.0 m³ (0.0%)";
                            varColor = "#475569";
                          }
                        }

                        const isEven = idx % 2 === 0;
                        return (
                          <tr key={`${row.periodo}-${idx}`} style={{ background: isEven ? "#f8fafc" : "#ffffff" }}>
                            <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", fontWeight: 700 }}>{formatMonthYearLong(row.periodo)}</td>
                            <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", textAlign: "right" }}>{fmt(rec)}</td>
                            <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", textAlign: "right", fontWeight: 700, color: "#2563eb" }}>{fmt(con, 2)}</td>
                            <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", textAlign: "right" }}>{fmt(prom, 2)}</td>
                            <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", textAlign: "right", fontWeight: 700, color: varColor }}>{varStr}</td>
                          </tr>
                        );
                      })}
                      {/* Fila Total Consolidado */}
                      <tr style={{ background: "#eff6ff", fontWeight: 800 }}>
                        <td style={{ border: "1px solid #e2e8f0", padding: "6px 8px" }}>TOTAL CONSOLIDADO</td>
                        <td style={{ border: "1px solid #e2e8f0", padding: "6px 8px", textAlign: "right" }}>{fmt(totalRecibosTabla)}</td>
                        <td style={{ border: "1px solid #e2e8f0", padding: "6px 8px", textAlign: "right", color: "#2563eb" }}>{fmt(totalConsumoTabla, 2)}</td>
                        <td style={{ border: "1px solid #e2e8f0", padding: "6px 8px", textAlign: "right", color: "#059669" }}>
                          {fmt(totalRecibosTabla > 0 ? totalConsumoTabla / totalRecibosTabla : 0, 2)}
                        </td>
                        <td style={{ border: "1px solid #e2e8f0", padding: "6px 8px", textAlign: "right", color: "#1e3a8a" }}>100.0% COBERTURA</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* ── DISTRIBUCIÓN HIDRÁULICA Y CONSUMO POR RUTA / SECTOR ── */}
                <div style={{ marginTop: "14px", marginBottom: "14px" }} className="no-break">
                  <h3 style={{ margin: "0 0 6px", fontSize: "11px", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 800 }}>
                    Distribución Hidráulica y Consumo por Ruta / Sector
                  </h3>
                  {distribucionRutas.length === 0 ? (
                    <div style={{ fontSize: "9px", color: "#6b7280", padding: "10px", background: "#f8fafc", borderRadius: "6px" }}>
                      Sin consumo facturado por ruta en el filtro seleccionado.
                    </div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px" }}>
                      <thead>
                        <tr>
                          <th style={{ background: "#1e293b", color: "white", padding: "6px 8px", textAlign: "left" }}>Ruta / Sector Operativo</th>
                          <th style={{ background: "#1e293b", color: "white", padding: "6px 8px", textAlign: "right" }}>Recibos / Tomas</th>
                          <th style={{ background: "#1e293b", color: "white", padding: "6px 8px", textAlign: "right" }}>Consumo Total (m³)</th>
                          <th style={{ background: "#1e293b", color: "white", padding: "6px 8px", textAlign: "right" }}>Promedio por Toma (m³)</th>
                          <th style={{ background: "#1e293b", color: "white", padding: "6px 8px", textAlign: "right" }}>% del Consumo Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {distribucionRutas.map((row, idx) => {
                          const rec = Number(row.recibos || 0);
                          const con = Number(row.consumo_total_m3 || 0);
                          const prom = Number(row.consumo_promedio_m3 || 0);
                          const pct = totalConsumoRutas > 0 ? (con / totalConsumoRutas) * 100 : 0;
                          const isEven = idx % 2 === 0;

                          return (
                            <tr key={`${row.ruta_id}-${idx}`} style={{ background: isEven ? "#f8fafc" : "#ffffff" }}>
                              <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", fontWeight: 700 }}>{row.ruta_nombre || `Ruta ${row.ruta_id}`}</td>
                              <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", textAlign: "right" }}>{fmt(rec)}</td>
                              <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", textAlign: "right", fontWeight: 700, color: "#2563eb" }}>{fmt(con, 2)}</td>
                              <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", textAlign: "right" }}>{fmt(prom, 2)}</td>
                              <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", textAlign: "right", fontWeight: 700 }}>{percent(pct)}</td>
                            </tr>
                          );
                        })}
                        {/* Fila Total Rutas */}
                        <tr style={{ background: "#eff6ff", fontWeight: 800 }}>
                          <td style={{ border: "1px solid #e2e8f0", padding: "6px 8px" }}>TOTAL RUTAS Y SECTORES</td>
                          <td style={{ border: "1px solid #e2e8f0", padding: "6px 8px", textAlign: "right" }}>{fmt(totalRecibosRutas)}</td>
                          <td style={{ border: "1px solid #e2e8f0", padding: "6px 8px", textAlign: "right", color: "#2563eb" }}>{fmt(totalConsumoRutas, 2)}</td>
                          <td style={{ border: "1px solid #e2e8f0", padding: "6px 8px", textAlign: "right", color: "#059669" }}>
                            {fmt(totalRecibosRutas > 0 ? totalConsumoRutas / totalRecibosRutas : 0, 2)}
                          </td>
                          <td style={{ border: "1px solid #e2e8f0", padding: "6px 8px", textAlign: "right" }}>100.0%</td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>
              </td>
            </tr>
          </tbody>

          {/* ESPACIO PARA PIE DE PÁGINA */}
          <tfoot>
            <tr>
              <td>
                <div style={{ height: "30px" }}></div>
              </td>
            </tr>
          </tfoot>
        </table>

        {/* ── FOOTER ESTANDARIZADO OFICIAL ── */}
        <div
          className="page-footer"
          style={{
            marginTop: "8px",
            borderTop: "1px solid #cbd5e1",
            paddingTop: "6px",
            fontSize: "8px",
            color: "#64748b",
            display: "flex",
            justifyContent: "space-between",
            background: "#ffffff",
          }}
        >
          <span>AGUA VILLA PESQUEIRA · Reporte de Métricas de Lecturas · Emisión: {fechaHoyCorta} {horaHoy}</span>
          <span style={{ fontWeight: 700, color: "#1e3a8a" }}>DOCUMENTO OFICIAL DE CONTROL OPERATIVO</span>
        </div>
      </div>
    </>
  );
};

export default ReporteLecturasMetricas;
