import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppLogo } from "../../context/LogoContext";

const money = (value) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(value || 0));

const percent = (value) => `${Number(value || 0).toFixed(1)}%`;

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
  const deudores = useMemo(() => (listados.deudores || []).slice(0, 25), [listados]);
  const pagadores = useMemo(() => (listados.pagadores || []).slice(0, 25), [listados]);

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
        <div className="no-break" style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#1e3a8a",
          color: "white",
          padding: "12px 16px",
          borderRadius: "8px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img src={logoSrc} alt="Logo" style={{ width: "52px", height: "52px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
            <div>
              <div style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Estado Financiero de Pagos
              </div>
              <div style={{ fontSize: "11px", opacity: 0.85 }}>
                Recaudacion, cobranza y cartera
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right", fontSize: "10px" }}>
            <div style={{ opacity: 0.8, textTransform: "uppercase" }}>Filtro</div>
            <div style={{ fontSize: "12px", fontWeight: 700 }}>{filtro.etiqueta || "General"}</div>
            <div style={{ opacity: 0.8 }}>{filtro.fecha_inicio || "-"} a {filtro.fecha_fin || "-"}</div>
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
