import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppLogo } from "../../context/LogoContext";
import { useNotifyPrintReady } from "../../hooks/useNotifyPrintReady";

const fmt = (n, dec = 0) =>
  Number(n || 0).toLocaleString("es-MX", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });

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
  const rutasResumen = data?.rutas?.resumen || {};
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
    const inicio = filtro.inicio_periodo;
    const fin = filtro.fin_periodo;
    if (inicio && fin && inicio !== fin) {
      return `${formatMonthYearLong(inicio)} a ${formatMonthYearLong(fin)}`;
    }
    if (inicio) return formatMonthYearLong(inicio);
    if (fin) return formatMonthYearLong(fin);
    return "Sin rango";
  }, [filtro]);

  const periodoPrincipal = useMemo(() => {
    if (filtro.periodo) return formatMonthYearLong(filtro.periodo);
    if (filtro.anio) return `Año ${filtro.anio}`;
    if (filtro.meses) return `Últimos ${filtro.meses} meses`;
    return "-";
  }, [filtro]);

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
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }
          /* Pie fijo: se repite al final de CADA hoja impresa. */
          .page-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #ffffff;
            margin-top: 0 !important;
            padding: 6px 4px;
          }
          .report-body { padding-bottom: 42px; }
        }
      `}</style>

      <div
        className="report-body"
        style={{
          maxWidth: "920px",
          margin: "0 auto",
          padding: "18px",
          fontFamily: "'Segoe UI', Arial, sans-serif",
          color: "#111827",
          background: "#ffffff",
        }}
      >
        {/* ── HEADER ── */}
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
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img src={logoSrc} alt="Logo" style={{ width: "76px", height: "76px", objectFit: "contain" }} />
              <div>
                <div style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Comision Municipal de Agua Potable y Alcantarillado
                </div>
                <div style={{ fontSize: "11px", opacity: 0.88, marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Villa Pesqueira, Sonora — Reporte de metricas de lecturas
                </div>
              </div>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.35)",
                borderRadius: "8px",
                padding: "8px 14px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.8 }}>Periodos</div>
              <div style={{ fontWeight: 800, fontSize: "14px", marginTop: "2px" }}>{consumoMensual.length}</div>
            </div>
          </div>

          <div
            style={{
              background: "#f0f9ff",
              borderLeft: "4px solid #1e40af",
              borderRight: "1px solid #bfdbfe",
              borderBottom: "1px solid #bfdbfe",
              borderRadius: "0 0 8px 8px",
              padding: "7px 12px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: "13px", color: "#1e3a8a", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Metricas de Lecturas y Rutas
              </div>
              <div>
                <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: 700 }}>
                  Filtro aplicado
                </div>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "#1f2937", textTransform: "uppercase" }}>
                  {filtro.etiqueta || "General"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: 700 }}>
                  Periodo principal
                </div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>
                  {periodoPrincipal}
                </div>
              </div>
            </div>
            <div style={{ fontSize: "10px", color: "#475569", fontWeight: 600 }}>
              {rangoFiltro} · Tendencia mensual, consumo por ruta y rendimiento operativo
            </div>
          </div>
        </div>

        {/* ── KPIs (5 cols) ── */}
        <div
          className="no-break"
          style={{
            marginTop: "12px",
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            gap: "8px",
          }}
        >
          <div style={{ border: "1px solid #c7d2fe", background: "#eef2ff", borderRadius: "6px", padding: "8px" }}>
            <div style={{ fontSize: "9px", textTransform: "uppercase", color: "#4338ca", fontWeight: 700 }}>Recibos</div>
            <div style={{ fontSize: "14px", fontWeight: 800 }}>{fmt(resumen.total_recibos)}</div>
          </div>
          <div style={{ border: "1px solid #bae6fd", background: "#f0f9ff", borderRadius: "6px", padding: "8px" }}>
            <div style={{ fontSize: "9px", textTransform: "uppercase", color: "#0369a1", fontWeight: 700 }}>Agua consumida</div>
            <div style={{ fontSize: "14px", fontWeight: 800 }}>{fmt(resumen.consumo_total_m3, 2)} m³</div>
          </div>
          <div style={{ border: "1px solid #a7f3d0", background: "#ecfdf5", borderRadius: "6px", padding: "8px" }}>
            <div style={{ fontSize: "9px", textTransform: "uppercase", color: "#047857", fontWeight: 700 }}>Promedio por recibo</div>
            <div style={{ fontSize: "14px", fontWeight: 800 }}>{fmt(resumen.consumo_promedio_m3, 2)} m³</div>
          </div>
          <div style={{ border: "1px solid #fed7aa", background: "#fff7ed", borderRadius: "6px", padding: "8px" }}>
            <div style={{ fontSize: "9px", textTransform: "uppercase", color: "#c2410c", fontWeight: 700 }}>Clientes</div>
            <div style={{ fontSize: "14px", fontWeight: 800 }}>{fmt(resumen.total_clientes)}</div>
          </div>
          <div style={{ border: "1px solid #ddd6fe", background: "#f5f3ff", borderRadius: "6px", padding: "8px" }}>
            <div style={{ fontSize: "9px", textTransform: "uppercase", color: "#6d28d9", fontWeight: 700 }}>Promedio cliente</div>
            <div style={{ fontSize: "14px", fontWeight: 800 }}>{fmt(resumen.promedio_consumo_por_cliente_m3, 2)} m³</div>
          </div>
        </div>

        {/* ── GRAFICA SVG ── */}
        <div
          className="no-break"
          style={{
            border: "1px solid #dbeafe",
            borderRadius: "8px",
            padding: "10px",
            background: "#f8fafc",
            marginTop: "12px",
          }}
        >
          <h3 style={{ margin: "0 0 8px", fontSize: "11px", color: "#1e3a8a", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Tendencia mensual de consumo
          </h3>
          <div style={{ fontSize: "9px", color: "#64748b", fontWeight: 600 }}>
            Rango del eje Y izq: 0 - {fmt(maxConsumo, 2)} m³ · Rango eje der: 0 - {fmt(maxRecibos)} recibos
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            {consumoMensual.length === 0 && (
              <div style={{ fontSize: "10px", color: "#6b7280" }}>Sin datos de tendencia para el periodo seleccionado.</div>
            )}
            {consumoMensual.length > 0 && (
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", background: "white", padding: "10px" }}>
                <svg
                  width="100%"
                  viewBox={`0 0 ${Math.max(420, consumoMensual.length * 44 + 90)} 220`}
                  preserveAspectRatio="none"
                  style={{ height: "210px", display: "block" }}
                >
                  {(() => {
                    const width = Math.max(420, consumoMensual.length * 44 + 90);
                    const chartTop = 16;
                    const chartBottom = 170;
                    const chartHeight = chartBottom - chartTop;
                    const left = 44;
                    const right = 36;
                    const plotWidth = width - left - right;
                    const groupWidth = plotWidth / consumoMensual.length;
                    const barWidth = Math.max(6, Math.min(16, groupWidth / 2.2));
                    const baseConsumo = maxConsumo > 0 ? maxConsumo : 1;
                    const baseRecibos = maxRecibos > 0 ? maxRecibos : 1;

                    const linePoints = consumoMensual.map((row, idx) => {
                      const x = left + idx * groupWidth + groupWidth / 2;
                      const recibos = Number(row.recibos || 0);
                      const y = chartBottom - (recibos / baseRecibos) * chartHeight;
                      return { x, y };
                    });

                    return (
                      <>
                        {[0, 1, 2, 3, 4].map((step) => {
                          const y = chartBottom - (step / 4) * chartHeight;
                          const axisConsumo = (baseConsumo * step) / 4;
                          const axisRecibos = (baseRecibos * step) / 4;
                          return (
                            <g key={`grid-${step}`}>
                              <line x1={left} y1={y} x2={width - right} y2={y} stroke="#dbeafe" strokeDasharray="2 2" strokeWidth="1" />
                              <text x={left - 5} y={y + 3} textAnchor="end" fontSize="7" fill="#0369a1" fontWeight="700">
                                {axisConsumo.toLocaleString("es-MX", { notation: "compact", maximumFractionDigits: 1 })}
                              </text>
                              <text x={width - right + 5} y={y + 3} textAnchor="start" fontSize="7" fill="#4338ca" fontWeight="700">
                                {Math.round(axisRecibos)}
                              </text>
                            </g>
                          );
                        })}

                        {consumoMensual.map((row, idx) => {
                          const consumoVal = Number(row.consumo_total_m3 || 0);
                          const x = left + idx * groupWidth + groupWidth / 2;
                          const hCon = (consumoVal / baseConsumo) * chartHeight;

                          return (
                            <g key={`bar-${row.periodo}-${idx}`}>
                              <rect
                                x={x - barWidth / 2}
                                y={chartBottom - hCon}
                                width={barWidth}
                                height={hCon}
                                fill="#0ea5e9"
                                rx="2"
                              />
                              <text x={x} y="188" textAnchor="middle" fontSize="8" fill="#475569" fontWeight="700">
                                {shortMonth(row.periodo)}
                              </text>
                            </g>
                          );
                        })}

                        {linePoints.length > 1 && (
                          <polyline
                            fill="none"
                            stroke="#6366f1"
                            strokeWidth="2.5"
                            points={linePoints.map((p) => `${p.x},${p.y}`).join(" ")}
                          />
                        )}
                        {linePoints.map((p, idx) => (
                          <circle key={`pt-${idx}`} cx={p.x} cy={p.y} r="3" fill="#6366f1" stroke="white" strokeWidth="1.5" />
                        ))}
                      </>
                    );
                  })()}
                </svg>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "6px", fontSize: "9px", color: "#334155" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "8px", height: "8px", background: "#0ea5e9", borderRadius: "2px", display: "inline-block" }} />
                    Consumo (m³)
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "12px", height: "2px", background: "#6366f1", display: "inline-block" }} />
                    Recibos
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── DESGLOSE MENSUAL ── */}
        <div style={{ marginTop: "14px" }} className="no-break">
          <h3 style={{ margin: "0 0 6px", fontSize: "12px", color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Desglose mensual de consumo
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
            <thead>
              <tr>
                <th style={{ background: "#1e3a8a", color: "white", padding: "6px", textAlign: "left" }}>Periodo</th>
                <th style={{ background: "#1e3a8a", color: "white", padding: "6px", textAlign: "right" }}>Recibos</th>
                <th style={{ background: "#1e3a8a", color: "white", padding: "6px", textAlign: "right" }}>Consumo total (m³)</th>
                <th style={{ background: "#1e3a8a", color: "white", padding: "6px", textAlign: "right" }}>Promedio (m³)</th>
              </tr>
            </thead>
            <tbody>
              {consumoMensual.map((row, idx) => (
                <tr key={`${row.periodo}-${idx}`}>
                  <td style={{ border: "1px solid #e5e7eb", padding: "5px", textTransform: "capitalize" }}>{formatMonthYearLong(row.periodo)}</td>
                  <td style={{ border: "1px solid #e5e7eb", padding: "5px", textAlign: "right" }}>{fmt(row.recibos)}</td>
                  <td style={{ border: "1px solid #e5e7eb", padding: "5px", textAlign: "right" }}>{fmt(row.consumo_total_m3, 2)}</td>
                  <td style={{ border: "1px solid #e5e7eb", padding: "5px", textAlign: "right" }}>{fmt(row.consumo_promedio_m3, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── RESUMEN OPERATIVO DE RUTAS ── */}
        <div
          className="no-break"
          style={{
            border: "1px solid #dbeafe",
            borderRadius: "8px",
            padding: "10px",
            background: "#f8fafc",
            marginTop: "12px",
          }}
        >
          <h3 style={{ margin: "0 0 8px", fontSize: "11px", color: "#1e3a8a", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Resumen operativo de rutas
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", background: "white", border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
            <thead>
              <tr>
                <th style={{ background: "#1e3a8a", color: "white", padding: "6px", textAlign: "right" }}>Total rutas</th>
                <th style={{ background: "#1e3a8a", color: "white", padding: "6px", textAlign: "right" }}>Completadas</th>
                <th style={{ background: "#1e3a8a", color: "white", padding: "6px", textAlign: "right" }}>En progreso</th>
                <th style={{ background: "#1e3a8a", color: "white", padding: "6px", textAlign: "right" }}>Sin iniciar</th>
                <th style={{ background: "#1e3a8a", color: "white", padding: "6px", textAlign: "right" }}>Avance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #e5e7eb", padding: "6px", textAlign: "right", fontWeight: 700 }}>{fmt(rutasResumen.total_rutas)}</td>
                <td style={{ border: "1px solid #e5e7eb", padding: "6px", textAlign: "right", fontWeight: 700, color: "#047857" }}>{fmt(rutasResumen.rutas_completadas)}</td>
                <td style={{ border: "1px solid #e5e7eb", padding: "6px", textAlign: "right", fontWeight: 700, color: "#c2410c" }}>{fmt(rutasResumen.rutas_en_progreso)}</td>
                <td style={{ border: "1px solid #e5e7eb", padding: "6px", textAlign: "right", fontWeight: 700, color: "#b91c1c" }}>{fmt(rutasResumen.rutas_sin_iniciar)}</td>
                <td style={{ border: "1px solid #e5e7eb", padding: "6px", textAlign: "right", fontWeight: 800, background: "#eff6ff" }}>{fmt(rutasResumen.promedio_completado)}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── CONSUMO POR RUTA ── */}
        <div style={{ marginTop: "14px" }} className="no-break">
          <h3 style={{ margin: "0 0 6px", fontSize: "12px", color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Consumo por ruta
          </h3>
          {distribucionRutas.length === 0 ? (
            <div style={{ fontSize: "10px", color: "#6b7280" }}>Sin consumo facturado por ruta en el filtro seleccionado.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
              <thead>
                <tr>
                  <th style={{ background: "#1e3a8a", color: "white", padding: "6px", textAlign: "left" }}>Ruta</th>
                  <th style={{ background: "#1e3a8a", color: "white", padding: "6px", textAlign: "right" }}>Recibos</th>
                  <th style={{ background: "#1e3a8a", color: "white", padding: "6px", textAlign: "right" }}>Consumo total (m³)</th>
                  <th style={{ background: "#1e3a8a", color: "white", padding: "6px", textAlign: "right" }}>Promedio (m³)</th>
                </tr>
              </thead>
              <tbody>
                {distribucionRutas.map((row, idx) => (
                  <tr key={`${row.ruta_id}-${idx}`}>
                    <td style={{ border: "1px solid #e5e7eb", padding: "5px", fontWeight: 700 }}>{row.ruta_nombre}</td>
                    <td style={{ border: "1px solid #e5e7eb", padding: "5px", textAlign: "right" }}>{fmt(row.recibos)}</td>
                    <td style={{ border: "1px solid #e5e7eb", padding: "5px", textAlign: "right" }}>{fmt(row.consumo_total_m3, 2)}</td>
                    <td style={{ border: "1px solid #e5e7eb", padding: "5px", textAlign: "right" }}>{fmt(row.consumo_promedio_m3, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── FOOTER (fijo al pie de cada hoja en impresión) ── */}
        <div
          className="page-footer"
          style={{
            marginTop: "16px",
            borderTop: "1px solid #e5e7eb",
            paddingTop: "8px",
            fontSize: "9px",
            color: "#6b7280",
            display: "flex",
            justifyContent: "space-between",
            background: "#ffffff",
          }}
        >
          <span>Generado: {new Date().toLocaleString("es-MX")}</span>
          <span>AGUA VP · Reporte de Métricas de Lecturas</span>
        </div>
      </div>
    </>
  );
};

export default ReporteLecturasMetricas;
