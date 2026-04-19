import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppLogo } from "../../context/LogoContext";

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

  const rows = useMemo(() => {
    return getRawRows(payload)
      .map(normalizeRow)
      .filter((r) => r.totalAdeudo > 0 || r.recibosConDeuda > 0 || r.meses.length > 0)
      .sort((a, b) => b.totalAdeudo - a.totalAdeudo || b.recibosConDeuda - a.recibosConDeuda || a.nombreCliente.localeCompare(b.nombreCliente));
  }, [payload]);

  const totalAdeudoGeneral = useMemo(
    () => rows.reduce((acc, r) => acc + Number(r.totalAdeudo || 0), 0),
    [rows]
  );

  if (!isReady) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
        Generando reporte de deudores...
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          @page { size: letter portrait; margin: 10mm; }
          html, body { width: 100%; }
          body { margin: 0; padding: 0; background: white; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }
          .reporte-deudores-wrap { width: 100% !important; max-width: 100% !important; }
          .reporte-deudores-table { width: 100% !important; table-layout: fixed !important; }
          .reporte-deudores-table th,
          .reporte-deudores-table td { box-sizing: border-box; overflow-wrap: anywhere; }
        }
      `}</style>

      <div className="bg-slate-50 dark:bg-black/20 min-h-screen py-8 px-4 flex justify-center print:p-0 print:bg-white print:block">
        <div
          className="reporte-deudores-wrap w-full max-w-[980px] bg-white rounded-2xl shadow-2xl overflow-hidden p-6 print:p-0 print:shadow-none print:rounded-none print:max-w-none"
          style={{ fontFamily: "'Segoe UI', Arial, sans-serif", color: "#111827" }}
        >
          <div style={{ marginBottom: "14px" }}>
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
              <img src={logoSrc} alt="Escudo" style={{ height: "76px", width: "76px", objectFit: "contain", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: "16px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Comisión Municipal de Agua Potable y Alcantarillado
                </div>
                <div style={{ fontSize: "11px", opacity: 0.88, marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Villa Pesqueira, Sonora — Reporte de mayores deudores
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
                <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.8 }}>Deudores</div>
                <div style={{ fontWeight: 800, fontSize: "14px", marginTop: "2px" }}>{rows.length}</div>
              </div>
            </div>

            <div
              style={{
                background: "#f0f9ff",
                borderLeft: "4px solid #1e40af",
                borderRight: "1px solid #bfdbfe",
                borderBottom: "1px solid #bfdbfe",
                padding: "8px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: "0 0 6px 6px",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: "14px", color: "#1e3a8a", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Cartera Vencida Prioritaria
              </div>
              <div style={{ fontSize: "10px", color: "#6b7280" }}>
                Total adeudo: <span style={{ fontWeight: 800, color: "#1f2937" }}>{money(totalAdeudoGeneral)}</span>
              </div>
            </div>
          </div>

          <table className="reporte-deudores-table" style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: "9.5px" }}>
            <colgroup>
              <col style={{ width: "9%" }} />
              <col style={{ width: "27%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "28%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "12%" }} />
            </colgroup>
            <thead>
              <tr>
                {["No. Predio", "Nombre del Cliente", "Medidor", "Meses de Deuda", "Total Adeudo", "Abono/Pago"].map((title, idx) => (
                  <th
                    key={title}
                    style={{
                      padding: "7px 6px",
                      background: "#1e3a8a",
                      color: "#fff",
                      fontSize: "9px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      textAlign: idx === 4 ? "right" : idx === 5 ? "center" : idx === 3 ? "center" : "left",
                      borderRight: idx === 5 ? "none" : "1px solid rgba(255,255,255,0.18)",
                    }}
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "20px", textAlign: "center", color: "#6b7280", border: "1px solid #e5e7eb" }}>
                    No hay deudores para mostrar en este reporte.
                  </td>
                </tr>
              )}

              {rows.map((r, idx) => {
                const even = idx % 2 === 0;
                const bg = even ? "#ffffff" : "#f8fafc";
                const td = {
                  padding: "6px 6px",
                  borderRight: "1px solid #e5e7eb",
                  borderBottom: "1px solid #e5e7eb",
                  verticalAlign: "top",
                  background: bg,
                };

                return (
                  <tr key={r.id}>
                    <td style={{ ...td, textAlign: "center", fontFamily: "monospace", fontWeight: 700 }}>{r.noPredio || "—"}</td>
                    <td style={td}>
                      <div style={{ fontWeight: 700, textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.nombreCliente}
                      </div>
                      <div style={{ marginTop: "3px", fontSize: "9px", color: "#475569", fontWeight: 700 }}>
                        Recibos con deuda: {r.recibosConDeuda}
                      </div>
                    </td>
                    <td style={{ ...td, textAlign: "center", fontFamily: "monospace", fontWeight: 700 }}>{r.medidor || "S/N"}</td>
                    <td style={{ ...td, textAlign: "center" }}>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.04em" }}>
                        {r.meses.length ? r.meses.join(", ") : "—"}
                      </span>
                    </td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 800, color: "#991b1b" }}>{money(r.totalAdeudo)}</td>
                    <td style={{ ...td, textAlign: "center", borderRight: "none" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "11px", height: "11px", border: "1.5px solid #64748b", borderRadius: "2px", display: "inline-block" }} />
                        <span style={{ display: "inline-block", width: "38px", borderBottom: "1px solid #94a3b8", height: "12px" }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div
            style={{
              marginTop: "12px",
              paddingTop: "8px",
              borderTop: "1px dashed #d1d5db",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "9px",
              color: "#9ca3af",
            }}
          >
            <span>Sistema AguaVP — Comisaría de Agua Potable Villa Pesqueira</span>
            <span style={{ fontWeight: 700, color: "#374151" }}>{rows.length} deudores listados</span>
            <span>Documento generado automáticamente — no requiere firma</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReporteDeudoresMayores;
