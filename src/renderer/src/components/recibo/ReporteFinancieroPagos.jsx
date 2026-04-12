import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppLogo } from "../../context/LogoContext";

const money = (value) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(value || 0));

const percent = (value) => `${Number(value || 0).toFixed(1)}%`;

const metodoColors = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#a855f7"];

const polarToCartesian = (cx, cy, radius, angleDeg) => {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
};

const describeArc = (cx, cy, radius, startAngle, endAngle) => {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} L ${cx} ${cy} Z`;
};

const shortMonth = (periodoMes) => {
  if (!periodoMes || !/^\d{4}-\d{2}$/.test(periodoMes)) return periodoMes || "";
  const [anio, mes] = periodoMes.split("-");
  const fecha = new Date(Number(anio), Number(mes) - 1, 1);
  return fecha.toLocaleDateString("es-MX", { month: "short" }).replace(".", "").toUpperCase();
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
  const listados = data?.listados || {};

  const recaudacionMensual = useMemo(() => series.recaudacion_mensual || [], [series]);
  const metodosPago = useMemo(() => series.metodos_pago || [], [series]);
  const deudores = useMemo(() => (listados.deudores || []).slice(0, 25), [listados]);
  const pagadores = useMemo(() => (listados.pagadores || []).slice(0, 25), [listados]);
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

  const pieSlices = useMemo(() => {
    if (!metodosPago.length || totalMetodosPago <= 0) return [];
    let currentAngle = 0;
    return metodosPago.map((row, idx) => {
      const value = Number(row.total || 0);
      const angle = (value / totalMetodosPago) * 360;
      const start = currentAngle;
      const end = currentAngle + angle;
      currentAngle = end;

      return {
        key: `${row.metodo || "sin-metodo"}-${idx}`,
        metodo: row.metodo || "Sin metodo",
        total: value,
        cantidad: Number(row.cantidad || 0),
        porcentaje: totalMetodosPago > 0 ? (value / totalMetodosPago) * 100 : 0,
        color: metodoColors[idx % metodoColors.length],
        path: describeArc(90, 90, 70, start, end),
      };
    });
  }, [metodosPago, totalMetodosPago]);

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
            padding: "14px 16px",
            borderRadius: "8px 8px 0 0"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img src={logoSrc} alt="Logo" style={{ width: "56px", height: "56px", objectFit: "contain" }} />
              <div>
                <div style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Comision Municipal de Agua Potable y Alcantarillado
                </div>
                <div style={{ fontSize: "10px", opacity: 0.85, marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Villa Pesqueira, Sonora
                </div>
              </div>
            </div>

            <div style={{ textAlign: "right", fontSize: "10px" }}>
              <div style={{ opacity: 0.8, textTransform: "uppercase" }}>Filtro</div>
              <div style={{ fontSize: "12px", fontWeight: 700 }}>{filtro.etiqueta || "General"}</div>
              <div style={{ opacity: 0.8 }}>{filtro.fecha_inicio || "-"} a {filtro.fecha_fin || "-"}</div>
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
              Recaudacion, cobranza y cartera
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

        <div className="no-break" style={{
          marginTop: "12px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px"
        }}>
          <div style={{ border: "1px solid #dbeafe", borderRadius: "8px", padding: "10px", background: "#f8fafc" }}>
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
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", background: "white", padding: "8px" }}>
                  <svg
                    width="100%"
                    viewBox={`0 0 ${Math.max(360, recaudacionMensual.length * 42 + 80)} 190`}
                    preserveAspectRatio="none"
                    style={{ height: "180px", display: "block" }}
                  >
                    {(() => {
                      const width = Math.max(360, recaudacionMensual.length * 42 + 80);
                      const chartTop = 14;
                      const chartBottom = 150;
                      const chartHeight = chartBottom - chartTop;
                      const left = 38;
                      const right = 16;
                      const plotWidth = width - left - right;
                      const groupWidth = plotWidth / recaudacionMensual.length;
                      const barWidth = Math.max(5, Math.min(9, groupWidth / 4));
                      const base = maxMensual > 0 ? maxMensual : 1;

                      return (
                        <>
                          {[0, 1, 2, 3, 4].map((step) => {
                            const y = chartBottom - (step / 4) * chartHeight;
                            const axisValue = (base * step) / 4;
                            return (
                              <g key={`grid-${step}`}>
                                <line x1={left} y1={y} x2={width - right} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                                <text x={left - 4} y={y + 3} textAnchor="end" fontSize="7" fill="#64748b" fontWeight="700">
                                  {Math.round(axisValue).toLocaleString("es-MX")}
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
                                <rect x={x - barWidth * 1.7} y={chartBottom - hEsp} width={barWidth} height={hEsp} fill="#6366f1" rx="1" />
                                <rect x={x - barWidth * 0.5} y={chartBottom - hRec} width={barWidth} height={hRec} fill="#14b8a6" rx="1" />
                                <rect x={x + barWidth * 0.7} y={chartBottom - hPen} width={barWidth} height={hPen} fill="#f97316" rx="1" />
                                <text x={x} y="166" textAnchor="middle" fontSize="8" fill="#475569" fontWeight="700">
                                  {shortMonth(row.periodo)}
                                </text>
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>

                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "4px", fontSize: "9px", color: "#334155" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", background: "#6366f1", borderRadius: "2px", display: "inline-block" }} />Esperado</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", background: "#14b8a6", borderRadius: "2px", display: "inline-block" }} />Recaudado</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", background: "#f97316", borderRadius: "2px", display: "inline-block" }} />Pendiente</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ border: "1px solid #dbeafe", borderRadius: "8px", padding: "10px", background: "#f8fafc" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "11px", color: "#1e3a8a", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Metodos de pago
            </h3>
            <div style={{ display: "grid", gap: "6px" }}>
              {metodosPago.length === 0 && (
                <div style={{ fontSize: "10px", color: "#6b7280" }}>Sin pagos registrados para clasificar metodos en este filtro.</div>
              )}
              {pieSlices.length > 0 && (
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", background: "white", padding: "8px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "8px", alignItems: "center" }}>
                    <svg width="180" height="180" viewBox="0 0 180 180" style={{ display: "block", margin: "0 auto" }}>
                      {pieSlices.map((slice) => (
                        <path key={slice.key} d={slice.path} fill={slice.color} stroke="#ffffff" strokeWidth="1.2" />
                      ))}
                      <circle cx="90" cy="90" r="32" fill="#ffffff" />
                      <text x="90" y="86" textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="700">TOTAL</text>
                      <text x="90" y="101" textAnchor="middle" fontSize="10" fill="#0f172a" fontWeight="800">{money(totalMetodosPago)}</text>
                    </svg>

                    <div style={{ display: "grid", gap: "4px" }}>
                      {pieSlices.map((slice) => (
                        <div key={`legend-${slice.key}`} style={{ display: "grid", gridTemplateColumns: "10px 1fr auto", alignItems: "center", gap: "6px", fontSize: "9px", color: "#334155" }}>
                          <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: slice.color, display: "inline-block" }} />
                          <span style={{ fontWeight: 700, textTransform: "uppercase" }}>{slice.metodo}</span>
                          <span>{percent(slice.porcentaje)} · {slice.cantidad} pagos</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "14px" }} className="no-break">
          <h3 style={{ margin: "0 0 6px", fontSize: "12px", color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Recaudacion mensual
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
                  <td style={{ border: "1px solid #e5e7eb", padding: "5px" }}>{row.periodo}</td>
                  <td style={{ border: "1px solid #e5e7eb", padding: "5px", textAlign: "right" }}>{money(row.esperado)}</td>
                  <td style={{ border: "1px solid #e5e7eb", padding: "5px", textAlign: "right" }}>{money(row.recaudado)}</td>
                  <td style={{ border: "1px solid #e5e7eb", padding: "5px", textAlign: "right" }}>{money(row.pendiente)}</td>
                  <td style={{ border: "1px solid #e5e7eb", padding: "5px", textAlign: "right" }}>{percent(row.porcentaje_recaudo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: "14px" }}>
          <h3 style={{ margin: "0 0 6px", fontSize: "12px", color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Deudores (top)
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
            <thead>
              <tr>
                <th style={{ background: "#991b1b", color: "white", padding: "6px", textAlign: "left" }}>Cliente</th>
                <th style={{ background: "#991b1b", color: "white", padding: "6px", textAlign: "left" }}>Localidad</th>
                <th style={{ background: "#991b1b", color: "white", padding: "6px", textAlign: "right" }}>Facturas</th>
                <th style={{ background: "#991b1b", color: "white", padding: "6px", textAlign: "right" }}>Deuda</th>
              </tr>
            </thead>
            <tbody>
              {deudores.map((row) => (
                <tr key={`d-${row.cliente_id}`}>
                  <td style={{ border: "1px solid #e5e7eb", padding: "5px" }}>{row.cliente_nombre}</td>
                  <td style={{ border: "1px solid #e5e7eb", padding: "5px" }}>{row.localidad || "-"}</td>
                  <td style={{ border: "1px solid #e5e7eb", padding: "5px", textAlign: "right" }}>{row.facturas_con_deuda}</td>
                  <td style={{ border: "1px solid #e5e7eb", padding: "5px", textAlign: "right", fontWeight: 700 }}>{money(row.deuda_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: "14px" }}>
          <h3 style={{ margin: "0 0 6px", fontSize: "12px", color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Clientes que pagaron (top)
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
            <thead>
              <tr>
                <th style={{ background: "#065f46", color: "white", padding: "6px", textAlign: "left" }}>Cliente</th>
                <th style={{ background: "#065f46", color: "white", padding: "6px", textAlign: "right" }}>Total pagado</th>
                <th style={{ background: "#065f46", color: "white", padding: "6px", textAlign: "right" }}>Pagos</th>
                <th style={{ background: "#065f46", color: "white", padding: "6px", textAlign: "right" }}>Deuda actual</th>
              </tr>
            </thead>
            <tbody>
              {pagadores.map((row) => (
                <tr key={`p-${row.cliente_id}`}>
                  <td style={{ border: "1px solid #e5e7eb", padding: "5px" }}>{row.cliente_nombre}</td>
                  <td style={{ border: "1px solid #e5e7eb", padding: "5px", textAlign: "right", fontWeight: 700 }}>{money(row.total_pagado)}</td>
                  <td style={{ border: "1px solid #e5e7eb", padding: "5px", textAlign: "right" }}>{row.pagos_realizados}</td>
                  <td style={{ border: "1px solid #e5e7eb", padding: "5px", textAlign: "right" }}>{money(row.deuda_total_actual)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
