import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppLogo } from "../../context/LogoContext";
import { useNotifyPrintReady } from "../../hooks/useNotifyPrintReady";

const money = (value) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));

const MESES_MAP = {
  "01": "ENE",
  "02": "FEB",
  "03": "MAR",
  "04": "ABR",
  "05": "MAY",
  "06": "JUN",
  "07": "JUL",
  "08": "AGO",
  "09": "SEP",
  "10": "OCT",
  "11": "NOV",
  "12": "DIC",
};

const normalizeMonth = (raw) => {
  if (!raw) return "";
  const str = String(raw).trim();

  const yyyyMm = str.match(/^(\d{4})-(\d{2})$/);
  if (yyyyMm) return MESES_MAP[yyyyMm[2]] || str.toUpperCase();

  const onlyMonth = str.match(/^(\d{1,2})$/);
  if (onlyMonth) {
    const mm = String(Number(onlyMonth[1])).padStart(2, "0");
    return MESES_MAP[mm] || str.toUpperCase();
  }

  const first3 = str.slice(0, 3).toUpperCase();
  return first3;
};

const extractMesesDeuda = (row) => {
  if (Array.isArray(row.meses_deuda) && row.meses_deuda.length > 0) {
    return row.meses_deuda.map(normalizeMonth).filter(Boolean);
  }

  if (typeof row.meses_deuda === "string" && row.meses_deuda.trim()) {
    return row.meses_deuda
      .split(/[,;|\s]+/)
      .map(normalizeMonth)
      .filter(Boolean);
  }

  const facturas = Array.isArray(row.facturas) ? row.facturas : [];
  const fromFacturas = facturas
    .filter((f) => {
      const est = (f?.estado || f?.estatus || "").toString().toLowerCase();
      return est.includes("pend") || est.includes("venc") || est === "";
    })
    .map((f) => f?.periodo_mes || f?.periodo || f?.mes)
    .map(normalizeMonth)
    .filter(Boolean);

  return [...new Set(fromFacturas)];
};

const getRecibosConDeuda = (row, meses) => {
  const explicit = row.recibos_con_deuda ?? row.facturas_con_deuda ?? row.deuda?.facturas_vencidas;
  if (explicit !== undefined && explicit !== null && explicit !== "") return Number(explicit) || 0;

  if (Array.isArray(row.facturas)) {
    return row.facturas.filter((f) => {
      const est = (f?.estado || f?.estatus || "").toString().toLowerCase();
      return est.includes("pend") || est.includes("venc") || est === "";
    }).length;
  }

  return meses.length;
};

const getRawRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload.deudores)) return payload.deudores;
  if (Array.isArray(payload.candidatos)) return payload.candidatos;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
};

const normalizeRow = (row) => {
  const noPredio =
    row.numero_predio ||
    row.predio ||
    row.cliente?.numero_predio ||
    row.cliente_numero_predio ||
    "—";

  const nombreCliente =
    row.nombre ||
    row.cliente_nombre ||
    row.cliente?.nombre ||
    row.nombre_cliente ||
    "SIN NOMBRE";

  const medidor =
    row.medidor?.numero_serie ||
    row.medidor?.serie ||
    row.numero_serie ||
    row.medidor ||
    "S/N";

  const meses = extractMesesDeuda(row);
  const recibosConDeuda = getRecibosConDeuda(row, meses);
  const ciudad = row.ciudad || row.cliente?.ciudad || "Sin Ciudad";

  const totalAdeudo = Number(
    row.total_adeudo ??
      row.adeudo_total ??
      row.saldo_pendiente ??
      row.deuda?.total ??
      row.deuda_total ??
      0
  );

  return {
    id: row.id || `${noPredio}-${nombreCliente}`,
    noPredio,
    nombreCliente,
    ciudad,
    medidor,
    meses,
    recibosConDeuda,
    totalAdeudo,
  };
};

const ReporteDeudoresMayores = () => {
  const [searchParams] = useSearchParams();
  const [payload, setPayload] = useState([]);
  const [isReady, setIsReady] = useState(false);

  useNotifyPrintReady(isReady);
  const { logoSrc } = useAppLogo();

  useEffect(() => {
    const load = async () => {
      try {
        const dataKey = searchParams.get("dataKey");
        const dataParam = searchParams.get("data");
        const useStorage = searchParams.get("useStorage");

        if (dataKey) {
          const raw = await window.api.getPrintData(dataKey);
          if (raw) {
            setPayload(typeof raw === "string" ? JSON.parse(raw) : raw);
            setIsReady(true);
            return;
          }
        }

        if (dataParam) {
          setPayload(JSON.parse(decodeURIComponent(dataParam)));
          setIsReady(true);
          return;
        }

        if (useStorage) {
          const stored = localStorage.getItem("reporte_deudores_data");
          if (stored) {
            setPayload(JSON.parse(stored));
            setIsReady(true);
            return;
          }
        }

        // Demo fallback
        setPayload([
          {
            id: 1,
            numero_predio: "A-102",
            nombre: "JUAN PEREZ",
            numero_serie: "MD-9001",
            meses_deuda: ["2026-01", "2026-02", "2026-03"],
            recibos_con_deuda: 3,
            total_adeudo: 4860.5,
          },
          {
            id: 2,
            numero_predio: "B-22",
            nombre: "MARIA LOPEZ",
            numero_serie: "MD-7710",
            meses_deuda: ["2025-11", "2025-12", "2026-01", "2026-02"],
            recibos_con_deuda: 4,
            total_adeudo: 6520,
          },
        ]);
      } catch (err) {
        console.error("Error cargando reporte de deudores:", err);
        setPayload([]);
      } finally {
        setIsReady(true);
      }
    };

    load();
  }, [searchParams]);

  // Orden solicitado desde Cobranza ("mayor" | "menor" | "predio"). Por defecto "mayor".
  const orden = useMemo(() => {
    if (payload && !Array.isArray(payload) && typeof payload === "object" && payload.orden) {
      return payload.orden;
    }
    return "mayor";
  }, [payload]);

  const rows = useMemo(() => {
    const parsePredio = (p) => {
      const digits = String(p ?? "").replace(/\D/g, "");
      if (!digits) return Number.MAX_SAFE_INTEGER;
      const n = Number(digits);
      return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
    };

    return getRawRows(payload)
      .map(normalizeRow)
      .filter((r) => r.totalAdeudo > 0 || r.recibosConDeuda > 0 || r.meses.length > 0)
      .sort((a, b) => {
        if (orden === "predio") {
          const pa = parsePredio(a.noPredio);
          const pb = parsePredio(b.noPredio);
          if (pa !== pb) return pa - pb;
          return String(a.noPredio).localeCompare(String(b.noPredio), "es", { numeric: true, sensitivity: "base" });
        }
        if (orden === "menor") {
          return a.totalAdeudo - b.totalAdeudo || a.recibosConDeuda - b.recibosConDeuda || a.nombreCliente.localeCompare(b.nombreCliente);
        }
        // "mayor" (por defecto)
        return b.totalAdeudo - a.totalAdeudo || b.recibosConDeuda - a.recibosConDeuda || a.nombreCliente.localeCompare(b.nombreCliente);
      });
  }, [payload, orden]);

  const deudoresPorCiudad = useMemo(() => {
    const group = {};
    rows.forEach((r) => {
      const ciudad = (r.ciudad || "Sin Ciudad").toUpperCase();
      if (!group[ciudad]) group[ciudad] = [];
      group[ciudad].push(r);
    });
    return group;
  }, [rows]);

  const ordenLabel = useMemo(() => ({
    mayor: "Mayor deudor primero",
    menor: "Menor deudor primero",
    predio: "Por número de predio",
  })[orden] || "Mayor deudor primero", [orden]);

  const totalAdeudoGeneral = useMemo(
    () => rows.reduce((acc, r) => acc + Number(r.totalAdeudo || 0), 0),
    [rows]
  );

  const totalRecibosRezago = useMemo(
    () => rows.reduce((acc, r) => acc + Number(r.recibosConDeuda || 0), 0),
    [rows]
  );

  const deudaPromedio = useMemo(
    () => (rows.length > 0 ? totalAdeudoGeneral / rows.length : 0),
    [rows, totalAdeudoGeneral]
  );

  const maxDeuda = useMemo(
    () => rows.reduce((max, r) => Math.max(max, Number(r.totalAdeudo || 0)), 0),
    [rows]
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

  const fechaHoyCorta = useMemo(
    () => new Date().toLocaleDateString("es-MX", { year: "numeric", month: "2-digit", day: "2-digit" }),
    []
  );

  const horaHoy = useMemo(
    () => new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
    []
  );

  if (!isReady) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
        Generando reporte de deudores...
      </div>
    );
  }

  let globalRowCounter = 0;

  return (
    <>
      <style>{`
        @media print {
          @page { size: letter portrait; margin: 10mm; }
          html, body { width: 100%; }
          body { margin: 0; padding: 0; background: white; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          
          /* Esenciales para el salto de página y el footer maestro */
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          .reporte-deudores-table tbody tr { page-break-inside: avoid; }
          
          .reporte-deudores-wrap { width: 100% !important; max-width: 100% !important; }
          .reporte-deudores-table { width: 100% !important; table-layout: fixed !important; }
          .reporte-deudores-table th,
          .reporte-deudores-table td { box-sizing: border-box; overflow-wrap: anywhere; }
          
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
        }
      `}</style>

      <div className="bg-slate-50 dark:bg-black/20 min-h-screen py-8 px-4 flex justify-center print:p-0 print:bg-white print:block">
        <div
          className="reporte-deudores-wrap w-full max-w-[960px] bg-white rounded-2xl shadow-2xl overflow-hidden p-6 print:p-0 print:shadow-none print:rounded-none print:max-w-none"
          style={{ fontFamily: "'Segoe UI', Arial, sans-serif", color: "#0f172a" }}
        >
          {/* TABLA MAESTRA PARA CONTROLAR EL FLUJO DE IMPRESIÓN */}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td>
                  {/* ── 1. ENCABEZADO INSTITUCIONAL OFICIAL ── */}
                  <div style={{ marginBottom: "8px" }}>
                    <div
                      style={{
                        background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 60%, #1d4ed8 100%)",
                        color: "#fff",
                        padding: "14px 20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        borderRadius: "8px 8px 0 0",
                      }}
                    >
                      {logoSrc ? (
                        <img src={logoSrc} alt="Escudo" style={{ height: "68px", width: "68px", objectFit: "contain", flexShrink: 0 }} />
                      ) : (
                        <div style={{ height: "68px", width: "68px", background: "rgba(255,255,255,0.2)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                          AGUA VP
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: "16px", letterSpacing: "0.03em", textTransform: "uppercase" }}>
                          Comisión Municipal de Agua Potable y Alcantarillado
                        </div>
                        <div style={{ fontSize: "11px", color: "#dbeafe", marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          Villa Pesqueira, Sonora — Reporte de Mayores Deudores (Cartera Vencida)
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
                        <div style={{ fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#bfdbfe", fontWeight: 700 }}>Total Deudores</div>
                        <div style={{ fontWeight: 800, fontSize: "18px", marginTop: "1px", color: "#ffffff" }}>{rows.length}</div>
                      </div>
                    </div>

                    {/* ── 2. CINTILLO DE METADATOS Y CRITERIOS ── */}
                    <div
                      style={{
                        background: "#f8fafc",
                        borderLeft: "4px solid #991b1b",
                        borderRight: "1px solid #cbd5e1",
                        borderBottom: "1px solid #cbd5e1",
                        padding: "8px 16px",
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: "12px",
                        borderRadius: "0 0 8px 8px",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "8px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Objeto del Control</div>
                        <div style={{ fontSize: "10.5px", fontWeight: 800, color: "#991b1b", textTransform: "uppercase" }}>Cartera Vencida Prioritaria</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "8px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Criterio de Secuencia</div>
                        <div style={{ fontSize: "10.5px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase" }}>{ordenLabel}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "8px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Cobertura Geográfica</div>
                        <div style={{ fontSize: "10.5px", fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>{Object.keys(deudoresPorCiudad).length} Sector(es) / Localidad(es)</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "8px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Expedición Oficial</div>
                        <div style={{ fontSize: "10px", fontWeight: 700, color: "#475569" }}>{fechaHoyLarga}</div>
                      </div>
                    </div>
                  </div>

                  {/* ── 3. TARJETAS DE KPIS FINANCIEROS Y OPERATIVOS ── */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(5, 1fr)",
                      gap: "8px",
                      marginBottom: "14px",
                    }}
                  >
                    <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "8px 10px", borderTop: "3px solid #991b1b" }}>
                      <div style={{ fontSize: "8px", fontWeight: 700, color: "#991b1b", textTransform: "uppercase" }}>Cartera Vencida Total</div>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: "#991b1b", marginTop: "2px" }}>{money(totalAdeudoGeneral)}</div>
                      <div style={{ fontSize: "7.5px", color: "#64748b", marginTop: "2px" }}>Saldo total pendiente</div>
                    </div>
                    <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "8px 10px", borderTop: "3px solid #1e3a8a" }}>
                      <div style={{ fontSize: "8px", fontWeight: 700, color: "#1e3a8a", textTransform: "uppercase" }}>Clientes con Rezago</div>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: "#1e3a8a", marginTop: "2px" }}>{rows.length}</div>
                      <div style={{ fontSize: "7.5px", color: "#64748b", marginTop: "2px" }}>Padrón con adeudo activo</div>
                    </div>
                    <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "8px 10px", borderTop: "3px solid #475569" }}>
                      <div style={{ fontSize: "8px", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Deuda Promedio</div>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>{money(deudaPromedio)}</div>
                      <div style={{ fontSize: "7.5px", color: "#64748b", marginTop: "2px" }}>Por cliente deudor</div>
                    </div>
                    <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "8px 10px", borderTop: "3px solid #d97706" }}>
                      <div style={{ fontSize: "8px", fontWeight: 700, color: "#d97706", textTransform: "uppercase" }}>Máxima Deuda</div>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: "#d97706", marginTop: "2px" }}>{money(maxDeuda)}</div>
                      <div style={{ fontSize: "7.5px", color: "#64748b", marginTop: "2px" }}>Caso prioritario mayor</div>
                    </div>
                    <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "8px 10px", borderTop: "3px solid #2563eb" }}>
                      <div style={{ fontSize: "8px", fontWeight: 700, color: "#2563eb", textTransform: "uppercase" }}>Recibos con Rezago</div>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: "#2563eb", marginTop: "2px" }}>{totalRecibosRezago}</div>
                      <div style={{ fontSize: "7.5px", color: "#64748b", marginTop: "2px" }}>Facturas pendientes</div>
                    </div>
                  </div>

                  {/* ── 4. TABLAS DE REZAGO POR SECTOR / LOCALIDAD ── */}
                  {rows.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: "8px", background: "#f8fafc" }}>
                      No se encontraron deudores con saldo pendiente para mostrar en este reporte.
                    </div>
                  ) : (
                    Object.keys(deudoresPorCiudad).map((ciudad) => {
                      const deudoresCiudad = deudoresPorCiudad[ciudad];
                      const totalDeudaCiudad = deudoresCiudad.reduce((sum, d) => sum + Number(d.totalAdeudo || 0), 0);

                      return (
                        <div key={ciudad} style={{ marginBottom: "16px" }}>
                          {/* Barra de cabecera de la Localidad / Ciudad */}
                          <div
                            style={{
                              background: "#eff6ff",
                              border: "1px solid #bfdbfe",
                              borderRadius: "6px 6px 0 0",
                              padding: "6px 12px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#1e3a8a" }} />
                              <span style={{ fontSize: "10.5px", fontWeight: 800, color: "#1e3a8a", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                SECTOR / LOCALIDAD: {ciudad}
                              </span>
                            </div>
                            <span style={{ fontSize: "9px", fontWeight: 800, color: "#991b1b" }}>
                              Deudores: {deudoresCiudad.length} | Cartera Vencida: {money(totalDeudaCiudad)}
                            </span>
                          </div>

                          <table className="reporte-deudores-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "9.5px", border: "1px solid #cbd5e1", borderTop: "none" }}>
                            <thead>
                              <tr>
                                <th style={{ background: "#1e293b", color: "#ffffff", padding: "5px 3px", textAlign: "center", width: "24px", fontSize: "9px" }}>#</th>
                                <th style={{ background: "#1e293b", color: "#ffffff", padding: "5px 4px", textAlign: "center", width: "55px", fontSize: "9px" }}>Predio</th>
                                <th style={{ background: "#1e293b", color: "#ffffff", padding: "5px 8px", textAlign: "left", fontSize: "9px" }}>Nombre del Cliente / Titular</th>
                                <th style={{ background: "#1e293b", color: "#ffffff", padding: "5px 6px", textAlign: "center", width: "75px", fontSize: "9px" }}>N° Medidor</th>
                                <th style={{ background: "#1e293b", color: "#ffffff", padding: "5px 6px", textAlign: "center", width: "115px", fontSize: "9px" }}>Meses con Rezago</th>
                                <th style={{ background: "#1e293b", color: "#ffffff", padding: "5px 6px", textAlign: "right", width: "95px", fontSize: "9px" }}>Total Adeudo</th>
                                <th style={{ background: "#1e293b", color: "#ffffff", padding: "5px 4px", textAlign: "center", width: "65px", fontSize: "9px" }}>Abono / Pago</th>
                              </tr>
                            </thead>
                            <tbody>
                              {deudoresCiudad.map((r, idx) => {
                                globalRowCounter++;
                                const even = idx % 2 === 0;
                                const bg = even ? "#ffffff" : "#f8fafc";
                                const mesesStr = r.meses && r.meses.length > 0 ? r.meses.join(", ") : "—";

                                return (
                                  <tr key={r.id} style={{ background: bg, borderBottom: "1px solid #e2e8f0" }}>
                                    <td style={{ border: "1px solid #e2e8f0", padding: "4px 2px", textAlign: "center", color: "#64748b", fontWeight: 700, fontSize: "9px" }}>
                                      {globalRowCounter}
                                    </td>
                                    <td style={{ border: "1px solid #e2e8f0", padding: "4px 3px", textAlign: "center", fontFamily: "monospace", fontWeight: 800, fontSize: "10px", color: "#1e40af", background: even ? "#eff6ff" : "#dbeafe" }}>
                                      {r.noPredio || "—"}
                                    </td>
                                    <td style={{ border: "1px solid #e2e8f0", padding: "4px 8px" }}>
                                      <div style={{ fontWeight: 800, fontSize: "10px", color: "#0f172a", textTransform: "uppercase", lineHeight: 1.2 }}>
                                        {r.nombreCliente}
                                      </div>
                                      <div style={{ marginTop: "1px", fontSize: "8px", color: r.recibosConDeuda >= 3 ? "#991b1b" : "#64748b", fontWeight: 700 }}>
                                        Recibos pendientes: {r.recibosConDeuda}
                                      </div>
                                    </td>
                                    <td style={{ border: "1px solid #e2e8f0", padding: "4px 6px", textAlign: "center", fontFamily: "monospace", fontWeight: 700, fontSize: "9.5px", color: r.medidor && r.medidor !== "S/N" ? "#0f172a" : "#c2410c" }}>
                                      {r.medidor || "S/N"}
                                    </td>
                                    <td style={{ border: "1px solid #e2e8f0", padding: "4px 6px", textAlign: "center", fontFamily: "monospace", fontWeight: 700, fontSize: "9px", color: "#475569" }}>
                                      {mesesStr}
                                    </td>
                                    <td style={{ border: "1px solid #e2e8f0", padding: "4px 6px", textAlign: "right", fontWeight: 800, color: "#991b1b", fontSize: "11px" }}>
                                      {money(r.totalAdeudo)}
                                    </td>
                                    <td style={{ border: "1px solid #e2e8f0", padding: "4px 4px", textAlign: "center" }}>
                                      <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                        <span style={{ width: "10px", height: "10px", border: "1.5px solid #94a3b8", borderRadius: "2px", display: "inline-block" }} />
                                        <span style={{ display: "inline-block", width: "32px", borderBottom: "1px solid #94a3b8", height: "10px" }} />
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })
                  )}
                  {/* --- FIN DEL CONTENIDO --- */}
                </td>
              </tr>
            </tbody>

            {/* FOOTER INVISIBLE PARA RESERVAR EL ESPACIO */}
            <tfoot>
              <tr>
                <td>
                  <div style={{ height: "25px" }}></div>
                </td>
              </tr>
            </tfoot>
          </table>

          {/* FOOTER FIJO ORIGINAL (Flotando sobre la reserva) */}
          <div
            className="page-footer"
            style={{
              marginTop: "8px",
              paddingTop: "6px",
              borderTop: "1px solid #cbd5e1",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "8px",
              color: "#64748b",
              background: "#ffffff",
            }}
          >
            <span>AGUA VILLA PESQUEIRA · Reporte Oficial de Mayores Deudores · Emisión: {fechaHoyCorta} {horaHoy}</span>
            <span style={{ fontWeight: 700, color: "#991b1b" }}>DOCUMENTO OFICIAL DE CONTROL FINANCIERO Y COBRANZA</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReporteDeudoresMayores;
