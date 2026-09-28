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

const ReporteGeneral = () => {
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
        console.error("Error leyendo datos del reporte general:", error);
        setData(null);
      } finally {
        setReady(true);
      }
    };

    load();
  }, [searchParams]);

  // Datos normalizados
  const filtro = data?.filtro_aplicado || {};
  const consumoData = data?.consumoAgua || {};
  const financieroData = data?.financiero || {};
  const clientesResumen = data?.clientesResumen || {};
  const medidoresResumen = data?.medidoresResumen || {};
  const tarifasDistribucion = data?.tarifasDistribucion || [];

  // Series temporales para gráficas
  const consumoMensual = useMemo(
    () => consumoData?.series?.consumo_mensual || [],
    [consumoData]
  );
  const recaudacionMensual = useMemo(
    () => financieroData?.series?.recaudacion_mensual || [],
    [financieroData]
  );
  const metodosPago = useMemo(
    () => financieroData?.series?.metodos_pago || [],
    [financieroData]
  );

  // Consumo y Rutas
  const consumoResumen = consumoData.resumen || {};
  const rutas = consumoData.distribucion_rutas || [];
  const topConsumidores = consumoData.listados?.top_consumidores || [];
  const consumoTotalM3 = Number(consumoResumen.consumo_total_m3 || 0);
  const consumoPromedioM3 = Number(consumoResumen.consumo_promedio_m3 || 0);
  const totalTomas = Number(consumoResumen.total_recibos || 0);

  // Finanzas
  const finResumen = financieroData.resumen || {};
  const totalFacturado = Number(finResumen.total_esperado || 0);
  const totalRecaudado = Number(finResumen.total_recaudado || 0);
  const saldoPendiente = Number(finResumen.por_cobrar_estimado || 0);
  const carteraVencida = Number(finResumen.deuda_total_rango || 0);
  const eficienciaCobranza = Number(finResumen.eficiencia_recaudo_porcentaje || 0);
  const totalFacturas = Number(finResumen.total_facturas || totalTomas || 0);
  const facturasPagadas = Number(finResumen.facturas_pagadas || 0);
  const recaudacionCaja = useMemo(
    () => financieroData?.series?.recaudacion_por_mes_pago || [],
    [financieroData]
  );
  const totalRecaudadoCaja = useMemo(
    () =>
      Number(finResumen.total_recaudado_caja || 0) ||
      recaudacionCaja.reduce((acc, r) => acc + Number(r.recaudado || 0), 0),
    [finResumen, recaudacionCaja]
  );
  const totalTransaccionesCaja = useMemo(
    () =>
      recaudacionCaja.reduce((acc, r) => acc + Number(r.transacciones || 0), 0),
    [recaudacionCaja]
  );
  const maxCaja = useMemo(
    () =>
      recaudacionCaja.reduce(
        (acc, r) => Math.max(acc, Number(r.recaudado || 0)),
        0
      ),
    [recaudacionCaja]
  );

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

  const totalMetodosPago = useMemo(
    () => metodosPago.reduce((acc, m) => acc + Number(m.total || 0), 0),
    [metodosPago]
  );
  const totalOperacionesMetodos = useMemo(
    () =>
      metodosPago.reduce(
        (acc, m) => acc + Number(m.cantidad || m.transacciones || 0),
        0
      ),
    [metodosPago]
  );

  // Clientes y Medidores
  const totalClientes = Number(clientesResumen.total || 0);
  const clientesActivos = Number(clientesResumen.activos || 0);
  const clientesConMedidor = Number(clientesResumen.conMedidor || 0);
  const clientesSinMedidor = Number(clientesResumen.sinMedidor || 0);
  const medidoresActivos = Number(medidoresResumen.activos || 0);
  const medidoresRetirados = Number(medidoresResumen.retirados || 0);

  // Totales de rutas
  const totalTomasRutas = useMemo(
    () => rutas.reduce((acc, r) => acc + Number(r.recibos || 0), 0),
    [rutas]
  );
  const totalM3Rutas = useMemo(
    () => rutas.reduce((acc, r) => acc + Number(r.consumo_total_m3 || 0), 0),
    [rutas]
  );

  // Cálculos para Gráfica de Consumo SVG
  const maxConsumo = useMemo(
    () =>
      consumoMensual.reduce(
        (acc, row) => Math.max(acc, Number(row.consumo_total_m3 || 0)),
        0
      ),
    [consumoMensual]
  );

  const maxRecibos = useMemo(
    () =>
      consumoMensual.reduce(
        (acc, row) => Math.max(acc, Number(row.recibos || 0)),
        0
      ),
    [consumoMensual]
  );

  // Cálculos para Variación de Consumo Mes a Mes
  const deltasConsumo = useMemo(() => {
    if (!consumoMensual || consumoMensual.length < 2) return [];
    return consumoMensual.map((item, idx) => {
      const curr = Number(item.consumo_total_m3 || 0);
      if (idx === 0) {
        return {
          periodo: item.periodo,
          diff: 0,
          pct: 0,
          isBase: true,
          consumo: curr,
        };
      }
      const prev = Number(consumoMensual[idx - 1].consumo_total_m3 || 0);
      const diff = curr - prev;
      const pct = prev > 0 ? (diff / prev) * 100 : 0;
      return {
        periodo: item.periodo,
        diff,
        pct,
        isBase: false,
        consumo: curr,
      };
    });
  }, [consumoMensual]);

  const maxAbsDiffConsumo = useMemo(() => {
    if (deltasConsumo.length === 0) return 1;
    return Math.max(...deltasConsumo.map((d) => Math.abs(d.diff)), 1);
  }, [deltasConsumo]);

  // Cálculos para Gráfica Financiera SVG
  const maxFinanciero = useMemo(() => {
    return recaudacionMensual.reduce((acc, row) => {
      const esperado = Number(row.esperado || 0);
      const recaudado = Number(row.recaudado || 0);
      const pendiente = Number(row.pendiente || 0);
      return Math.max(acc, esperado, recaudado, pendiente);
    }, 0);
  }, [recaudacionMensual]);

  // Interpretación de período / rango de filtro
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

  const periodoPrincipal = useMemo(() => {
    if (filtro.periodo) return formatMonthYearLong(filtro.periodo);
    if (filtro.anio) return `Ejercicio Fiscal ${filtro.anio}`;
    if (filtro.meses) return `Rango de Últimos ${filtro.meses} Meses`;
    return filtro.etiqueta || "Período Ordinario";
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

  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        Cargando informe general...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        No hay datos para mostrar en este período.
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 10mm;
          }
          body {
            margin: 0;
            padding: 0;
            background: #ffffff !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
          .portada-general {
            box-sizing: border-box !important;
            min-height: 250mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            align-items: center !important;
            page-break-after: always !important;
            break-after: page !important;
            padding: 12mm 10mm !important;
            margin: 0 !important;
            border: none !important;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
          tr {
            page-break-inside: avoid !important;
          }
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
        @media screen {
          .portada-general {
            min-height: 80vh;
            padding: 36px 30px;
            margin-bottom: 28px;
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            background: #ffffff;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
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
          color: "#111827",
          background: "#ffffff",
        }}
      >

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* HOJA DE PRESENTACIÓN / PORTADA INSTITUCIONAL (Página 1 Completa)     */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div className="portada-general page-break">
          {/* Cabecera Superior de Portada */}
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #1e3a8a", paddingBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              {logoSrc ? (
                <img src={logoSrc} alt="Logotipo Institucional" style={{ width: "82px", height: "82px", objectFit: "contain" }} />
              ) : (
                <div style={{ width: "70px", height: "70px", borderRadius: "10px", background: "#1e3a8a", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "24px" }}>
                  AVP
                </div>
              )}
              <div>
                <div style={{ fontSize: "14px", fontWeight: 900, color: "#1e3a8a", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  H. Ayuntamiento de Villa Pesqueira, Sonora
                </div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "2px" }}>
                  Comisión Municipal de Agua Potable y Alcantarillado
                </div>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "#64748b", marginTop: "1px" }}>
                  Organismo Operador Municipal · Sistema AguaVP
                </div>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ display: "inline-block", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#1e3a8a", padding: "4px 10px", borderRadius: "6px", fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Documento Oficial
              </div>
              <div style={{ fontSize: "9px", color: "#64748b", marginTop: "4px" }}>
                Folio: <strong style={{ color: "#0f172a", fontFamily: "monospace" }}>INF-GEN-{filtro.anio || new Date().getFullYear()}-{String(new Date().getMonth() + 1).padStart(2, "0")}</strong>
              </div>
            </div>
          </div>

          {/* Cuerpo Central de Portada */}
          <div style={{ width: "100%", maxWidth: "720px", textAlign: "center", margin: "24px auto" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#1e3a8a", padding: "6px 14px", borderRadius: "9999px", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1e3a8a" }} />
              Rendición de Cuentas y Control Operativo
            </div>

            <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#0f172a", lineHeight: 1.15, textTransform: "uppercase", letterSpacing: "0.03em", margin: "0 0 10px" }}>
              Informe General Ejecutivo
            </h1>

            <p style={{ fontSize: "13px", fontWeight: 600, color: "#475569", lineHeight: 1.5, margin: "0 auto 24px", maxWidth: "600px" }}>
              Diagnóstico Integral de Operación Hidráulica, Demanda de Consumo, Recaudación Financiera, Tarifas y Padrón de Usuarios.
            </p>

            {/* Tarjeta de Ficha Técnica */}
            <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "16px 20px", textAlign: "left", marginBottom: "22px" }}>
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#1e3a8a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px", borderBottom: "1px solid #cbd5e1", paddingBottom: "6px" }}>
                Ficha Técnica de Consulta y Ámbito Temporal
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "11px" }}>
                <div>
                  <span style={{ color: "#64748b", fontSize: "10px", display: "block" }}>Período / Criterio de Análisis:</span>
                  <strong style={{ color: "#0f172a", fontSize: "12px" }}>{periodoPrincipal}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", fontSize: "10px", display: "block" }}>Rango Cronológico Evaluado:</span>
                  <strong style={{ color: "#0f172a" }}>{rangoFiltro}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", fontSize: "10px", display: "block" }}>Fecha de Emisión Oficial:</span>
                  <strong style={{ color: "#0f172a" }}>{fechaHoy} ({horaHoy} hrs)</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", fontSize: "10px", display: "block" }}>Carácter de la Información:</span>
                  <strong style={{ color: "#0f172a" }}>Institucional · Auditoría Interna y Pública</strong>
                </div>
              </div>
            </div>

            {/* Mini Resumen Ejecutivo en Portada (4 Pilares Sobrios) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "10px" }}>
              <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "9px", textTransform: "uppercase", color: "#1e3a8a", fontWeight: 800 }}>Padrón Activo</div>
                <div style={{ fontSize: "16px", fontWeight: 900, color: "#0f172a", marginTop: "4px" }}>{fmt(clientesActivos)}</div>
                <div style={{ fontSize: "8.5px", color: "#64748b", marginTop: "2px" }}>de {fmt(totalClientes)} cuentas</div>
              </div>

              <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "9px", textTransform: "uppercase", color: "#1e3a8a", fontWeight: 800 }}>Agua Suministrada</div>
                <div style={{ fontSize: "16px", fontWeight: 900, color: "#0f172a", marginTop: "4px" }}>{fmt(consumoTotalM3, 1)} m³</div>
                <div style={{ fontSize: "8.5px", color: "#64748b", marginTop: "2px" }}>{fmt(consumoPromedioM3, 1)} m³/toma prom.</div>
              </div>

              <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "9px", textTransform: "uppercase", color: "#1e3a8a", fontWeight: 800 }}>Recaudación en Caja</div>
                <div style={{ fontSize: "16px", fontWeight: 900, color: "#0f172a", marginTop: "4px" }}>{money(totalRecaudado)}</div>
                <div style={{ fontSize: "8.5px", color: "#64748b", marginTop: "2px" }}>{fmt(facturasPagadas)} recibos pagados</div>
              </div>

              <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "9px", textTransform: "uppercase", color: "#1e3a8a", fontWeight: 800 }}>Eficiencia de Cobro</div>
                <div style={{ fontSize: "16px", fontWeight: 900, color: "#0f172a", marginTop: "4px" }}>{percent(eficienciaCobranza)}</div>
                <div style={{ fontSize: "8.5px", color: "#64748b", marginTop: "2px" }}>facturado {money(totalFacturado)}</div>
              </div>
            </div>
          </div>

          {/* Pie Inferior de Portada */}
          <div style={{ width: "100%", borderTop: "1px solid #cbd5e1", paddingTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "9.5px", color: "#64748b" }}>
            <div>
              <span>Organismo Operador Municipal de Agua Potable · Villa Pesqueira, Sonora</span>
            </div>
            <div>
              <span>Sistema Oficial AguaVP · Certificación Administrativa</span>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* TABLA MAESTRA PARA CONTROLAR EL FLUJO DE IMPRESIÓN (Páginas 2+)      */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td>


                {/* ═════════════════════════════════════════════════════════════ */}
                {/* SECCIÓN I. RESUMEN EJECUTIVO Y CIFRAS CLAVE                   */}
                {/* ═════════════════════════════════════════════════════════════ */}
                <div style={{ marginBottom: "6px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 800, color: "#1e3a8a", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    SECCIÓN I. RESUMEN EJECUTIVO Y CIFRAS CLAVE
                  </div>
                </div>
                <div
                  className="no-break"
                  style={{
                    marginBottom: "14px",
                    display: "grid",
                    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                    gap: "8px",
                  }}
                >
                  <div style={{ border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: "6px", padding: "8px" }}>
                    <div style={{ fontSize: "8.5px", textTransform: "uppercase", color: "#475569", fontWeight: 700 }}>Padrón Facturado</div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>{fmt(totalTomas)}</div>
                  </div>

                  <div style={{ border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: "6px", padding: "8px" }}>
                    <div style={{ fontSize: "8.5px", textTransform: "uppercase", color: "#475569", fontWeight: 700 }}>Volumen Medido</div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>{fmt(consumoTotalM3, 1)} m³</div>
                  </div>

                  <div style={{ border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: "6px", padding: "8px" }}>
                    <div style={{ fontSize: "8.5px", textTransform: "uppercase", color: "#475569", fontWeight: 700 }}>Facturación Emitida</div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>{money(totalFacturado)}</div>
                  </div>

                  <div style={{ border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: "6px", padding: "8px" }}>
                    <div style={{ fontSize: "8.5px", textTransform: "uppercase", color: "#475569", fontWeight: 700 }}>Recaudación Corriente</div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>{money(totalRecaudado)}</div>
                  </div>

                  <div style={{ border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: "6px", padding: "8px" }}>
                    <div style={{ fontSize: "8.5px", textTransform: "uppercase", color: "#475569", fontWeight: 700 }}>Eficiencia de Cobro</div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>{percent(eficienciaCobranza)}</div>
                  </div>
                </div>

                {/* ═════════════════════════════════════════════════════════════ */}
                {/* SECCIÓN II. DIAGNÓSTICO OPERATIVO Y DEMANDA DE CONSUMO        */}
                {/* ═════════════════════════════════════════════════════════════ */}
                <div style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "12px", background: "#f8fafc", marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div>
                      <h3 style={{ margin: "0 0 2px", fontSize: "11px", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 800 }}>
                        SECCIÓN II. DIAGNÓSTICO OPERATIVO Y DEMANDA DE CONSUMO HIDRÁULICO
                      </h3>
                      <div style={{ fontSize: "9px", color: "#64748b" }}>
                        Evolución mensual del volumen extraído/medido (m³) y tomas activas registradas.
                      </div>
                    </div>
                    <div style={{ fontSize: "9.5px", fontWeight: 800, color: "#1e3a8a", fontFamily: "monospace" }}>
                      VOLUMEN: {fmt(consumoTotalM3, 1)} M³
                    </div>
                  </div>

                  {/* GRÁFICA DE TENDENCIA MENSUAL DE CONSUMO (SVG) */}
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "8.5px", color: "#64748b", fontWeight: 600, marginBottom: "4px" }}>
                      Rango Y Izq (Consumo): 0 - {fmt(maxConsumo, 1)} m³ · Rango Y Der (Recibos): 0 - {fmt(maxRecibos)} tomas
                    </div>

                    {consumoMensual.length === 0 ? (
                      <div style={{ fontSize: "10px", color: "#6b7280", padding: "10px", background: "white", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                        Sin serie histórica mensual para este período específico.
                      </div>
                    ) : (
                      <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", background: "white", padding: "8px" }}>
                        <svg
                          width="100%"
                          viewBox={`0 0 ${Math.max(420, consumoMensual.length * 44 + 90)} 230`}
                          preserveAspectRatio="none"
                          style={{ height: "220px", display: "block" }}
                        >
                          {(() => {
                            const width = Math.max(420, consumoMensual.length * 44 + 90);
                            const chartTop = 20;
                            const chartBottom = 180;
                            const chartHeight = chartBottom - chartTop;
                            const left = 46;
                            const right = 36;
                            const plotWidth = width - left - right;
                            const groupWidth = plotWidth / consumoMensual.length;
                            const barWidth = Math.max(8, Math.min(22, groupWidth / 2.2));
                            const baseConsumo = maxConsumo > 0 ? maxConsumo : 1;
                            const baseRecibos = maxRecibos > 0 ? maxRecibos : 1;

                            const linePoints = consumoMensual.map((row, idx) => {
                              const x = left + idx * groupWidth + groupWidth / 2;
                              const recibos = Number(row.recibos || 0);
                              const y = chartBottom - (recibos / baseRecibos) * (chartHeight - 16);
                              return { x, y };
                            });

                            return (
                              <>
                                {[0, 1, 2, 3, 4].map((step) => {
                                  const y = chartBottom - (step / 4) * chartHeight;
                                  const axisConsumo = (baseConsumo * step) / 4;
                                  const axisRecibos = (baseRecibos * step) / 4;
                                  return (
                                    <g key={`grid-con-${step}`}>
                                      <line x1={left} y1={y} x2={width - right} y2={y} stroke="#e2e8f0" strokeDasharray="2 2" strokeWidth="1" />
                                      <text x={left - 5} y={y + 3} textAnchor="end" fontSize="7" fill="#64748b" fontWeight="700">
                                        {axisConsumo.toLocaleString("es-MX", { notation: "compact", maximumFractionDigits: 1 })}
                                      </text>
                                      <text x={width - right + 5} y={y + 3} textAnchor="start" fontSize="7" fill="#64748b" fontWeight="700">
                                        {Math.round(axisRecibos)}
                                      </text>
                                    </g>
                                  );
                                })}

                                {consumoMensual.map((row, idx) => {
                                  const consumoVal = Number(row.consumo_total_m3 || 0);
                                  const x = left + idx * groupWidth + groupWidth / 2;
                                  const hCon = (consumoVal / baseConsumo) * (chartHeight - 16);
                                  const barTop = chartBottom - hCon;
                                  const valLabel = consumoVal >= 1000 ? (consumoVal / 1000).toFixed(1) + "k" : Math.round(consumoVal);

                                  return (
                                    <g key={`bar-con-${row.periodo}-${idx}`}>
                                      <rect
                                        x={x - barWidth / 2}
                                        y={barTop}
                                        width={barWidth}
                                        height={hCon}
                                        fill="#2563eb"
                                        rx="2"
                                      />
                                      <text x={x} y={barTop - 4} textAnchor="middle" fontSize="7" fill="#2563eb" fontWeight="800">
                                        {valLabel}
                                      </text>
                                      <text x={x} y="202" textAnchor="middle" fontSize="8" fill="#475569" fontWeight="700">
                                        {shortMonth(row.periodo)}
                                      </text>
                                    </g>
                                  );
                                })}

                                {linePoints.length > 1 && (
                                  <polyline
                                    fill="none"
                                    stroke="#1e293b"
                                    strokeWidth="2"
                                    points={linePoints.map((p) => `${p.x},${p.y}`).join(" ")}
                                  />
                                )}
                                {linePoints.map((p, idx) => (
                                  <circle key={`pt-con-${idx}`} cx={p.x} cy={p.y} r="2.8" fill="#1e293b" stroke="white" strokeWidth="1.2" />
                                ))}
                              </>
                            );
                          })()}
                        </svg>

                        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "6px", fontSize: "9px", color: "#334155" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ width: "8px", height: "8px", background: "#2563eb", borderRadius: "2px", display: "inline-block" }} />
                            Consumo Total de Agua (m³) — Barras Eje Izquierdo
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ width: "12px", height: "2px", background: "#1e293b", display: "inline-block" }} />
                            Tomas / Recibos Facturados — Línea Eje Derecho
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* GRÁFICA ANALÍTICA DE VARIACIÓN INTERMENSUAL DE CONSUMO */}
                  {deltasConsumo.length >= 2 && (
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ fontSize: "9.5px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", marginBottom: "4px" }}>
                        Análisis de Variación Intermensual de Consumo (Incremento / Decremento)
                      </div>
                      <div style={{ fontSize: "8.5px", color: "#64748b", fontWeight: 600, marginBottom: "4px" }}>
                        Diferencial neto en metros cúbicos (m³) y porcentaje relativo comparado contra el mes inmediato anterior.
                      </div>
                      <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", background: "white", padding: "8px" }}>
                        <svg
                          width="100%"
                          viewBox={`0 0 ${Math.max(420, deltasConsumo.length * 44 + 90)} 150`}
                          preserveAspectRatio="none"
                          style={{ height: "140px", display: "block" }}
                        >
                          {(() => {
                            const width = Math.max(420, deltasConsumo.length * 44 + 90);
                            const chartTop = 20;
                            const chartBottom = 120;
                            const chartHeight = chartBottom - chartTop;
                            const zeroY = chartTop + chartHeight / 2;
                            const availableHalf = chartHeight / 2 - 12;
                            const left = 50;
                            const right = 24;
                            const plotWidth = width - left - right;
                            const groupWidth = plotWidth / deltasConsumo.length;
                            const barWidth = Math.max(8, Math.min(22, groupWidth / 2.3));

                            return (
                              <>
                                <line x1={left} y1={chartTop} x2={width - right} y2={chartTop} stroke="#e2e8f0" strokeDasharray="2 2" strokeWidth="0.8" />
                                <text x={left - 6} y={chartTop + 3} textAnchor="end" fontSize="7" fill="#64748b" fontWeight="700">
                                  +{fmt(maxAbsDiffConsumo, 1)} m³
                                </text>

                                <line x1={left} y1={zeroY} x2={width - right} y2={zeroY} stroke="#94a3b8" strokeWidth="1.2" />
                                <text x={left - 6} y={zeroY + 3} textAnchor="end" fontSize="7" fill="#0f172a" fontWeight="800">
                                  0 m³
                                </text>

                                <line x1={left} y1={chartBottom} x2={width - right} y2={chartBottom} stroke="#e2e8f0" strokeDasharray="2 2" strokeWidth="0.8" />
                                <text x={left - 6} y={chartBottom + 3} textAnchor="end" fontSize="7" fill="#64748b" fontWeight="700">
                                  -{fmt(maxAbsDiffConsumo, 1)} m³
                                </text>

                                {deltasConsumo.map((d, idx) => {
                                  const x = left + idx * groupWidth + groupWidth / 2;
                                  if (d.isBase) {
                                    return (
                                      <g key={`delta-base-${idx}`}>
                                        <circle cx={x} cy={zeroY} r="3.5" fill="#64748b" />
                                        <text x={x} y={zeroY - 6} textAnchor="middle" fontSize="7" fill="#64748b" fontWeight="700">
                                          Base
                                        </text>
                                        <text x={x} y="136" textAnchor="middle" fontSize="7.5" fill="#0f172a" fontWeight="700">
                                          {shortMonth(d.periodo)}
                                        </text>
                                      </g>
                                    );
                                  }

                                  if (d.diff >= 0) {
                                    const h = (d.diff / maxAbsDiffConsumo) * availableHalf;
                                    const barTop = zeroY - h;
                                    return (
                                      <g key={`delta-${idx}`}>
                                        <rect
                                          x={x - barWidth / 2}
                                          y={barTop}
                                          width={barWidth}
                                          height={Math.max(2, h)}
                                          fill="#2563eb"
                                          rx="2"
                                        />
                                        <text x={x} y={barTop - 4} textAnchor="middle" fontSize="6.8" fill="#2563eb" fontWeight="800">
                                          +{d.pct.toFixed(1)}%
                                        </text>
                                        <text x={x} y="136" textAnchor="middle" fontSize="7.5" fill="#0f172a" fontWeight="700">
                                          {shortMonth(d.periodo)}
                                        </text>
                                      </g>
                                    );
                                  } else {
                                    const h = (Math.abs(d.diff) / maxAbsDiffConsumo) * availableHalf;
                                    const barBottom = zeroY + h;
                                    return (
                                      <g key={`delta-${idx}`}>
                                        <rect
                                          x={x - barWidth / 2}
                                          y={zeroY}
                                          width={barWidth}
                                          height={Math.max(2, h)}
                                          fill="#dc2626"
                                          rx="2"
                                        />
                                        <text x={x} y={barBottom + 8} textAnchor="middle" fontSize="6.8" fill="#dc2626" fontWeight="800">
                                          {d.pct.toFixed(1)}%
                                        </text>
                                        <text x={x} y="136" textAnchor="middle" fontSize="7.5" fill="#0f172a" fontWeight="700">
                                          {shortMonth(d.periodo)}
                                        </text>
                                      </g>
                                    );
                                  }
                                })}
                              </>
                            );
                          })()}
                        </svg>

                        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "6px", fontSize: "9px", color: "#334155" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ width: "8px", height: "8px", background: "#2563eb", borderRadius: "2px", display: "inline-block" }} />
                            Incremento de Consumo (+m³)
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ width: "8px", height: "8px", background: "#dc2626", borderRadius: "2px", display: "inline-block" }} />
                            Disminución de Consumo (-m³)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TABLAS OPERATIVAS EN 2 COLUMNAS (DESGLOSE HISTÓRICO Y RUTAS) */}
                  <div style={{ display: "grid", gridTemplateColumns: consumoMensual.length > 1 ? "1.05fr 1fr" : "1fr", gap: "10px", marginTop: "12px" }}>
                    {/* TABLA DE DESGLOSE DE CONSUMO MENSUAL */}
                    {consumoMensual.length > 1 && (
                      <div className="no-break" style={{ marginBottom: "10px" }}>
                        <div style={{ fontSize: "9px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", marginBottom: "4px" }}>
                          Desglose Histórico de Consumo
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8.5px", background: "white" }}>
                          <thead>
                            <tr>
                              <th style={{ background: "#1e293b", color: "white", padding: "4px 5px", textAlign: "left" }}>Período</th>
                              <th style={{ background: "#1e293b", color: "white", padding: "4px 5px", textAlign: "right" }}>Consumo Total</th>
                              <th style={{ background: "#1e293b", color: "white", padding: "4px 5px", textAlign: "right" }}>Prom/Toma</th>
                              <th style={{ background: "#1e293b", color: "white", padding: "4px 5px", textAlign: "right" }}>Tomas</th>
                            </tr>
                          </thead>
                          <tbody>
                            {consumoMensual.map((cm, idx) => (
                              <tr key={`cm-${cm.periodo || idx}`}>
                                <td style={{ border: "1px solid #e2e8f0", padding: "3px 5px", fontWeight: 700 }}>{formatMonthYearLong(cm.periodo)}</td>
                                <td style={{ border: "1px solid #e2e8f0", padding: "3px 5px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#2563eb" }}>
                                  {fmt(cm.consumo_total_m3, 1)} m³
                                </td>
                                <td style={{ border: "1px solid #e2e8f0", padding: "3px 5px", textAlign: "right", fontFamily: "monospace" }}>
                                  {fmt(cm.consumo_promedio_m3, 1)} m³
                                </td>
                                <td style={{ border: "1px solid #e2e8f0", padding: "3px 5px", textAlign: "right", fontFamily: "monospace" }}>
                                  {fmt(cm.recibos)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* TABLA DE DISTRIBUCIÓN POR RUTAS */}
                    <div className="no-break" style={{ marginBottom: "10px" }}>
                      <div style={{ fontSize: "9px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", marginBottom: "4px" }}>
                        Distribución Hidráulica por Sector
                      </div>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8.5px", background: "white" }}>
                        <thead>
                          <tr>
                            <th style={{ background: "#1e293b", color: "white", padding: "4px 5px", textAlign: "left" }}>Ruta / Sector</th>
                            <th style={{ background: "#1e293b", color: "white", padding: "4px 5px", textAlign: "right" }}>Tomas</th>
                            <th style={{ background: "#1e293b", color: "white", padding: "4px 5px", textAlign: "right" }}>Volumen</th>
                            <th style={{ background: "#1e293b", color: "white", padding: "4px 5px", textAlign: "right" }}>Promedio</th>
                            <th style={{ background: "#1e293b", color: "white", padding: "4px 5px", textAlign: "right" }}>Part.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rutas.length > 0 ? (
                            rutas.map((ruta, idx) => {
                              const m3 = Number(ruta.consumo_total_m3 || 0);
                              const part = totalM3Rutas > 0 ? (m3 / totalM3Rutas) * 100 : 0;
                              return (
                                <tr key={`ruta-${ruta.ruta_id || idx}`}>
                                  <td style={{ border: "1px solid #e2e8f0", padding: "3px 5px", fontWeight: 700, color: "#0f172a" }}>
                                    {ruta.ruta_nombre || "Sector sin nombre"}
                                  </td>
                                  <td style={{ border: "1px solid #e2e8f0", padding: "3px 5px", textAlign: "right", fontFamily: "monospace" }}>
                                    {fmt(ruta.recibos)}
                                  </td>
                                  <td style={{ border: "1px solid #e2e8f0", padding: "3px 5px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#2563eb" }}>
                                    {fmt(m3, 1)} m³
                                  </td>
                                  <td style={{ border: "1px solid #e2e8f0", padding: "3px 5px", textAlign: "right", fontFamily: "monospace" }}>
                                    {fmt(ruta.consumo_promedio_m3, 1)} m³
                                  </td>
                                  <td style={{ border: "1px solid #e2e8f0", padding: "3px 5px", textAlign: "right", fontFamily: "monospace", color: "#0f172a", fontWeight: 700 }}>
                                    {percent(part)}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={5} style={{ border: "1px solid #e2e8f0", padding: "6px", textAlign: "center", color: "#9ca3af" }}>
                                Sin registro de rutas para este filtro.
                              </td>
                            </tr>
                          )}
                          <tr style={{ background: "#f1f5f9" }}>
                            <td style={{ border: "1px solid #cbd5e1", padding: "4px 5px", fontWeight: 800, textTransform: "uppercase", color: "#0f172a" }}>
                              Total
                            </td>
                            <td style={{ border: "1px solid #cbd5e1", padding: "4px 5px", textAlign: "right", fontWeight: 800, fontFamily: "monospace" }}>
                              {fmt(totalTomasRutas)}
                            </td>
                            <td style={{ border: "1px solid #cbd5e1", padding: "4px 5px", textAlign: "right", fontWeight: 800, fontFamily: "monospace", color: "#2563eb" }}>
                              {fmt(totalM3Rutas, 1)} m³
                            </td>
                            <td style={{ border: "1px solid #cbd5e1", padding: "4px 5px", textAlign: "right", fontWeight: 800, fontFamily: "monospace" }}>
                              {fmt(consumoPromedioM3, 1)} m³
                            </td>
                            <td style={{ border: "1px solid #cbd5e1", padding: "4px 5px", textAlign: "right", fontWeight: 800, fontFamily: "monospace", color: "#0f172a" }}>
                              100.0%
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* ═════════════════════════════════════════════════════════════ */}
                {/* SECCIÓN III. ESTADO FINANCIERO Y GESTIÓN DE COBRANZA         */}
                {/* ═════════════════════════════════════════════════════════════ */}
                <div style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "12px", background: "#f8fafc", marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div>
                      <h3 style={{ margin: "0 0 2px", fontSize: "11px", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 800 }}>
                        SECCIÓN III. ESTADO FINANCIERO Y GESTIÓN DE COBRANZA
                      </h3>
                      <div style={{ fontSize: "9px", color: "#64748b" }}>
                        Facturación determinada, cobranza corriente del período, saldos pendientes y flujo de efectivo en caja.
                      </div>
                    </div>
                    <div style={{ fontSize: "9.5px", fontWeight: 800, color: "#059669", fontFamily: "monospace" }}>
                      EFICIENCIA: {percent(eficienciaCobranza)}
                    </div>
                  </div>

                  {/* GRÁFICA DE TENDENCIA MENSUAL FINANCIERA (SVG) */}
                  <div style={{ marginBottom: "12px" }}>
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
                            const left = 46;
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
                                      <text x={left - 5} y={y + 3} textAnchor="end" fontSize="7" fill="#64748b" fontWeight="700">
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

                {/* 1. DESGLOSE MENSUAL DE FACTURACIÓN DETERMINADA Y RECAUDACIÓN APLICADA */}
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
                <div className="no-break page-break-before" style={{ marginBottom: "14px", pageBreakBefore: "always", breakBefore: "page" }}>
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
                {metodosPago.length > 0 && (
                  <div className="no-break" style={{ marginBottom: "14px" }}>
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
                        {metodosPago.map((mp, idx) => {
                          const pct = totalMetodosPago > 0 ? ((mp.total || 0) / totalMetodosPago) * 100 : 0;
                          return (
                            <tr key={`mp-fin-${idx}`}>
                              <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", fontWeight: 700, textTransform: "uppercase" }}>{mp.metodo || "Efectivo"}</td>
                              <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", textAlign: "right", fontFamily: "monospace" }}>{fmt(mp.cantidad || mp.transacciones || 0)}</td>
                              <td style={{ border: "1px solid #e2e8f0", padding: "5px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#059669" }}>{money(mp.total || 0)}</td>
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

                {/* ═════════════════════════════════════════════════════════════ */}
                {/* SECCIÓN IV. PADRÓN DE USUARIOS Y ESTRUCTURA TARIFARIA          */}
                {/* ═════════════════════════════════════════════════════════════ */}
                <div className="no-break" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "10px", marginBottom: "14px" }}>
                  {/* Tarifas */}
                  <div style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px", background: "#ffffff" }}>
                    <h3 style={{ margin: "0 0 2px", fontSize: "11px", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 800 }}>
                      SECCIÓN IV. PADRÓN DE USUARIOS Y ESTRUCTURA TARIFARIA
                    </h3>
                    <div style={{ fontSize: "8.5px", color: "#64748b", marginBottom: "6px" }}>
                      Padrón activo clasificado según régimen o esquema tarifario vigente.
                    </div>

                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px" }}>
                      <thead>
                        <tr>
                          <th style={{ background: "#1e293b", color: "white", padding: "4px 6px", textAlign: "left" }}>Régimen / Esquema Tarifario</th>
                          <th style={{ background: "#1e293b", color: "white", padding: "4px 6px", textAlign: "right" }}>Cuentas Registradas</th>
                          <th style={{ background: "#1e293b", color: "white", padding: "4px 6px", textAlign: "right" }}>% Padrón</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tarifasDistribucion.length > 0 ? (
                          tarifasDistribucion.map((tarifa, idx) => (
                            <tr key={`tarifa-${idx}`}>
                              <td style={{ border: "1px solid #e2e8f0", padding: "4px 6px", fontWeight: 700 }}>{tarifa.nombre}</td>
                              <td style={{ border: "1px solid #e2e8f0", padding: "4px 6px", textAlign: "right", fontFamily: "monospace" }}>{fmt(tarifa.cantidadClientes)}</td>
                              <td style={{ border: "1px solid #e2e8f0", padding: "4px 6px", textAlign: "right", fontFamily: "monospace", color: "#0f172a", fontWeight: 700 }}>
                                {percent(tarifa.porcentaje)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td style={{ border: "1px solid #e2e8f0", padding: "4px 6px", fontWeight: 700 }}>Doméstica Estándar</td>
                            <td style={{ border: "1px solid #e2e8f0", padding: "4px 6px", textAlign: "right", fontFamily: "monospace" }}>{fmt(totalClientes)}</td>
                            <td style={{ border: "1px solid #e2e8f0", padding: "4px 6px", textAlign: "right", fontFamily: "monospace" }}>100.0%</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Parque de Medidores y Cuentas */}
                  <div style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px", background: "#f8fafc" }}>
                    <h3 style={{ margin: "0 0 2px", fontSize: "11px", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 800 }}>
                      PARQUE DE MEDICIÓN Y TIPOS DE SUMINISTRO
                    </h3>
                    <div style={{ fontSize: "8.5px", color: "#64748b", marginBottom: "6px" }}>
                      Estado del parque de medición y régimen de suministro contratado.
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "9px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 6px", background: "white", border: "1px solid #e2e8f0", borderRadius: "4px" }}>
                        <span style={{ color: "#475569" }}>Padrón Total de Cuentas Contratadas:</span>
                        <strong style={{ fontFamily: "monospace" }}>{fmt(totalClientes)} cuentas</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 6px", background: "white", border: "1px solid #e2e8f0", borderRadius: "4px" }}>
                        <span style={{ color: "#475569" }}>Cuentas Activas con Suministro:</span>
                        <strong style={{ fontFamily: "monospace", color: "#059669" }}>{fmt(clientesActivos)}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 6px", background: "white", border: "1px solid #e2e8f0", borderRadius: "4px" }}>
                        <span style={{ color: "#475569" }}>Tomas con Servicio Medido (Medidor):</span>
                        <strong style={{ fontFamily: "monospace", color: "#2563eb" }}>{fmt(clientesConMedidor || medidoresActivos)}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 6px", background: "white", border: "1px solid #e2e8f0", borderRadius: "4px" }}>
                        <span style={{ color: "#475569" }}>Tomas de Cuota Fija (Servicio Directo):</span>
                        <strong style={{ fontFamily: "monospace", color: "#d97706" }}>{fmt(clientesSinMedidor)}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 6px", background: "white", border: "1px solid #cbd5e1", borderRadius: "4px" }}>
                        <span style={{ color: "#0f172a", fontWeight: 700 }}>Medidores en Taller / Inventario:</span>
                        <strong style={{ fontFamily: "monospace", color: "#0f172a" }}>{fmt(medidoresRetirados)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── FIN DEL CONTENIDO PRINCIPAL ── */}
              </td>
            </tr>
          </tbody>

          {/* FOOTER INVISIBLE PARA RESERVAR ESPACIO */}
          <tfoot>
            <tr>
              <td>
                <div style={{ height: "30px" }}></div>
              </td>
            </tr>
          </tfoot>
        </table>

        {/* FOOTER FIJO (Se repite al final de cada hoja impresa) */}
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
            AGUA VILLA PESQUEIRA · Informe General Ejecutivo Oficial · Emisión: {fechaHoy} ({horaHoy} hrs)
          </span>
          <span style={{ fontWeight: 700, color: "#1e3a8a" }}>
            Organismo Operador Municipal · Sistema AguaVP
          </span>
        </div>

      </div>
    </>
  );
};

export default ReporteGeneral;
