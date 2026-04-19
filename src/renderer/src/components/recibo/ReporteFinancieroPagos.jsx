import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppLogo } from "../../context/LogoContext";

const money = (value) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
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

const formatDateLabel = (raw) => {
  if (!raw) return "-";
  if (/^\d{4}-\d{2}$/.test(raw)) return formatMonthYearLong(raw);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [anio, mes, dia] = raw.split("-");
    const fecha = new Date(Number(anio), Number(mes) - 1, Number(dia));
    return fecha.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
  }
  return raw;
};

const ReporteFinancieroPagos = () => {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [isReady, setIsReady] = useState(false);
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

  const resumen = data?.resumen || {};
  const filtro = data?.filtro_aplicado || {};
  const series = data?.series || {};

  const recaudacionMensual = useMemo(() => series.recaudacion_mensual || [], [series]);
  const metodosPago = useMemo(() => series.metodos_pago || [], [series]);
  const maxMensual = useMemo(() => {
    return recaudacionMensual.reduce((acc, row) => {
      const esperado = Number(row.esperado || 0);
      const recaudado = Number(row.recaudado || 0);
      const pendiente = Number(row.pendiente || 0);
      return Math.max(acc, esperado, recaudado, pendiente);
    }, 0);
  }, [recaudacionMensual]);

  const totalMetodosPago = useMemo(
    () => metodosPago.reduce((acc, row) => acc + Number(row.total || 0), 0),
    [metodosPago]
  );

  const metodosPagoTabla = useMemo(() => {
    return [...metodosPago]
      .map((row) => {
        const total = Number(row.total || 0);
        return {
          metodo: row.metodo || "Sin metodo",
          total,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [metodosPago, totalMetodosPago]);

  const rangoFiltro = useMemo(() => {
    const inicio = formatDateLabel(filtro.fecha_inicio);
    const fin = formatDateLabel(filtro.fecha_fin);
    if (inicio !== "-" && fin !== "-") return `${inicio} a ${fin}`;
    if (inicio !== "-") return inicio;
    if (fin !== "-") return fin;
    return "Sin rango";
  }, [filtro.fecha_inicio, filtro.fecha_fin]);

  if (!isReady) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Generando reporte financiero...
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
        }
      `}</style>

      <div style={{
        maxWidth: "920px",
        margin: "0 auto",
        padding: "18px",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        color: "#111827",
        background: "#ffffff"
      }}>
        <div className="no-break" style={{ marginBottom: "10px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 60%, #1d4ed8 100%)",
            color: "white",
            padding: "14px 20px",
            borderRadius: "8px 8px 0 0"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img src={logoSrc} alt="Logo" style={{ width: "76px", height: "76px", objectFit: "contain" }} />
              <div>
                <div style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Comision Municipal de Agua Potable y Alcantarillado
                </div>
                <div style={{ fontSize: "11px", opacity: 0.88, marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Villa Pesqueira, Sonora — Reporte financiero de pagos
                </div>
              </div>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.35)",
              borderRadius: "8px",
              padding: "8px 14px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.8 }}>Periodos</div>
              <div style={{ fontWeight: 800, fontSize: "14px", marginTop: "2px" }}>{recaudacionMensual.length}</div>
            </div>
          </div>

          <div style={{
            background: "#f0f9ff",
            borderLeft: "4px solid #1e40af",
            borderRight: "1px solid #bfdbfe",
            borderBottom: "1px solid #bfdbfe",
            borderRadius: "0 0 8px 8px",
            padding: "7px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div style={{ fontSize: "13px", color: "#1e3a8a", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Estado Financiero de Pagos
            </div>
            <div style={{ fontSize: "10px", color: "#475569", fontWeight: 600 }}>
              Tendencia mensual, metodos de pago y desglose de recaudacion
            </div>
          </div>
        </div>

        <div className="no-break" style={{
          marginTop: "10px",
          border: "1px solid #dbeafe",
          borderRadius: "8px",
          padding: "9px 10px",
          background: "#f8fafc",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "8px"
        }}>
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
              Rango
            </div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>{rangoFiltro}</div>
          </div>
          <div>
            <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: 700 }}>
              Periodo principal
            </div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>
              {formatMonthYearLong(filtro.periodo || filtro.periodo_mes || "")}
            </div>
          </div>
        </div>

        <div className="no-break" style={{
          marginTop: "12px",
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          gap: "8px"
        }}>
          <div style={{ border: "1px solid #c7d2fe", background: "#eef2ff", borderRadius: "6px", padding: "8px" }}>
            <div style={{ fontSize: "9px", textTransform: "uppercase", color: "#4338ca", fontWeight: 700 }}>Esperado</div>
            <div style={{ fontSize: "14px", fontWeight: 800 }}>{money(resumen.total_esperado)}</div>
          </div>
          <div style={{ border: "1px solid #a7f3d0", background: "#ecfdf5", borderRadius: "6px", padding: "8px" }}>
            <div style={{ fontSize: "9px", textTransform: "uppercase", color: "#047857", fontWeight: 700 }}>Recaudado</div>
            <div style={{ fontSize: "14px", fontWeight: 800 }}>{money(resumen.total_recaudado)}</div>
          </div>
          <div style={{ border: "1px solid #fed7aa", background: "#fff7ed", borderRadius: "6px", padding: "8px" }}>
            <div style={{ fontSize: "9px", textTransform: "uppercase", color: "#c2410c", fontWeight: 700 }}>Por cobrar</div>
            <div style={{ fontSize: "14px", fontWeight: 800 }}>{money(resumen.por_cobrar_estimado)}</div>
          </div>
          <div style={{ border: "1px solid #bae6fd", background: "#f0f9ff", borderRadius: "6px", padding: "8px" }}>
            <div style={{ fontSize: "9px", textTransform: "uppercase", color: "#0369a1", fontWeight: 700 }}>Recaudado a hoy</div>
            <div style={{ fontSize: "14px", fontWeight: 800 }}>{money(resumen.recaudado_hasta_fecha_actual)}</div>
          </div>
          <div style={{ border: "1px solid #ddd6fe", background: "#f5f3ff", borderRadius: "6px", padding: "8px" }}>
            <div style={{ fontSize: "9px", textTransform: "uppercase", color: "#6d28d9", fontWeight: 700 }}>Eficiencia</div>
            <div style={{ fontSize: "14px", fontWeight: 800 }}>{percent(resumen.eficiencia_recaudo_porcentaje)}</div>
          </div>
        </div>

        <div className="no-break" style={{ border: "1px solid #dbeafe", borderRadius: "8px", padding: "10px", background: "#f8fafc", marginTop: "12px" }}>
          <h3 style={{ margin: "0 0 8px", fontSize: "11px", color: "#1e3a8a", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Grafica de tendencia mensual
          </h3>
          <div style={{ fontSize: "9px", color: "#64748b", fontWeight: 600 }}>
            Rango del eje Y: {money(0)} - {money(maxMensual)}
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            {recaudacionMensual.length === 0 && (
              <div style={{ fontSize: "10px", color: "#6b7280" }}>Sin datos de tendencia para el periodo seleccionado.</div>
            )}
            {recaudacionMensual.length > 0 && (
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", background: "white", padding: "10px" }}>
                <svg
                  width="100%"
                  viewBox={`0 0 ${Math.max(420, recaudacionMensual.length * 44 + 90)} 220`}
                  preserveAspectRatio="none"
                  style={{ height: "210px", display: "block" }}
                >
                  {(() => {
                    const width = Math.max(420, recaudacionMensual.length * 44 + 90);
                    const chartTop = 16;
                    const chartBottom = 170;
                    const chartHeight = chartBottom - chartTop;
                    const left = 44;
                    const right = 18;
                    const plotWidth = width - left - right;
                    const groupWidth = plotWidth / recaudacionMensual.length;
                    const barWidth = Math.max(5, Math.min(10, groupWidth / 4));
                    const base = maxMensual > 0 ? maxMensual : 1;

                    return (
                      <>
                        {[0, 1, 2, 3, 4].map((step) => {
                          const y = chartBottom - (step / 4) * chartHeight;
                          const axisValue = (base * step) / 4;
                          return (
                            <g key={`grid-${step}`}>
                              <line x1={left} y1={y} x2={width - right} y2={y} stroke="#dbeafe" strokeDasharray="2 2" strokeWidth="1" />
                              <text x={left - 5} y={y + 3} textAnchor="end" fontSize="7" fill="#64748b" fontWeight="700">
                                {axisValue.toLocaleString("es-MX", { notation: "compact", maximumFractionDigits: 1 })}
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
                            <g key={`bars-${row.periodo}-${idx}`}>
                              <rect x={x - barWidth * 1.7} y={chartBottom - hEsp} width={barWidth} height={hEsp} fill="#6366f1" rx="2" />
                              <rect x={x - barWidth * 0.5} y={chartBottom - hRec} width={barWidth} height={hRec} fill="#14b8a6" rx="2" />
                              <rect x={x + barWidth * 0.7} y={chartBottom - hPen} width={barWidth} height={hPen} fill="#f97316" rx="2" />
                              <text x={x} y="188" textAnchor="middle" fontSize="8" fill="#475569" fontWeight="700">
                                {shortMonth(row.periodo)}
                              </text>
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "6px", fontSize: "9px", color: "#334155" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", background: "#6366f1", borderRadius: "2px", display: "inline-block" }} />Esperado</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", background: "#14b8a6", borderRadius: "2px", display: "inline-block" }} />Recaudado</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", background: "#f97316", borderRadius: "2px", display: "inline-block" }} />Pendiente</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: "14px" }} className="no-break">
          <h3 style={{ margin: "0 0 6px", fontSize: "12px", color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Desglose de recaudacion mensual
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
            <thead>
              <tr>
                <th style={{ background: "#1e3a8a", color: "white", padding: "6px", textAlign: "left" }}>Periodo</th>
                <th style={{ background: "#1e3a8a", color: "white", padding: "6px", textAlign: "right" }}>Esperado</th>
                <th style={{ background: "#1e3a8a", color: "white", padding: "6px", textAlign: "right" }}>Recaudado</th>
                <th style={{ background: "#1e3a8a", color: "white", padding: "6px", textAlign: "right" }}>Pendiente</th>
                <th style={{ background: "#1e3a8a", color: "white", padding: "6px", textAlign: "right" }}>% Recaudo</th>
              </tr>
            </thead>
            <tbody>
              {recaudacionMensual.map((row, idx) => (
                <tr key={`${row.periodo}-${idx}`}>
                  <td style={{ border: "1px solid #e5e7eb", padding: "5px", textTransform: "capitalize" }}>{formatMonthYearLong(row.periodo)}</td>
                  <td style={{ border: "1px solid #e5e7eb", padding: "5px", textAlign: "right" }}>{money(row.esperado)}</td>
                  <td style={{ border: "1px solid #e5e7eb", padding: "5px", textAlign: "right" }}>{money(row.recaudado)}</td>
                  <td style={{ border: "1px solid #e5e7eb", padding: "5px", textAlign: "right" }}>{money(row.pendiente)}</td>
                  <td style={{ border: "1px solid #e5e7eb", padding: "5px", textAlign: "right" }}>{percent(row.porcentaje_recaudo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="no-break" style={{ border: "1px solid #dbeafe", borderRadius: "8px", padding: "10px", background: "#f8fafc", marginTop: "12px" }}>
          <h3 style={{ margin: "0 0 8px", fontSize: "11px", color: "#1e3a8a", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Metodos de pago
          </h3>
          {metodosPagoTabla.length === 0 ? (
            <div style={{ fontSize: "10px", color: "#6b7280" }}>Sin pagos registrados para clasificar metodos en este filtro.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", background: "white", border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
              <thead>
                <tr>
                  <th style={{ background: "#1e3a8a", color: "white", padding: "6px", textAlign: "left" }}>Metodo</th>
                  <th style={{ background: "#1e3a8a", color: "white", padding: "6px", textAlign: "right" }}>Total recaudado</th>
                </tr>
              </thead>
              <tbody>
                {metodosPagoTabla.map((row, idx) => (
                  <tr key={`${row.metodo}-${idx}`}>
                    <td style={{ border: "1px solid #e5e7eb", padding: "5px", textTransform: "uppercase", fontWeight: 700 }}>{row.metodo}</td>
                    <td style={{ border: "1px solid #e5e7eb", padding: "5px", textAlign: "right", fontWeight: 700 }}>{money(row.total)}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ border: "1px solid #e5e7eb", padding: "6px", fontWeight: 800, textTransform: "uppercase", background: "#eff6ff" }}>Total</td>
                  <td style={{ border: "1px solid #e5e7eb", padding: "6px", textAlign: "right", fontWeight: 800, background: "#eff6ff" }}>
                    {money(totalMetodosPago)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        <div style={{ marginTop: "16px", borderTop: "1px solid #e5e7eb", paddingTop: "8px", fontSize: "9px", color: "#6b7280", display: "flex", justifyContent: "space-between" }}>
          <span>Generado: {new Date().toLocaleString("es-MX")}</span>
          <span>AGUA VP · Reporte Financiero</span>
        </div>
      </div>
    </>
  );
};

export default ReporteFinancieroPagos;
