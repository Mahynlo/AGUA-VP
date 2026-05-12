import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppLogo } from "../../context/LogoContext";

const fmt = (n, dec = 0) => Number(n || 0).toLocaleString("es-MX", {
  minimumFractionDigits: dec,
  maximumFractionDigits: dec,
});

const fmtPeriodo = (periodo) => {
  if (!periodo || !/^\d{4}-\d{2}$/.test(periodo)) return periodo || "-";
  const [y, m] = periodo.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });
};

const Header = ({ logoSrc, etiqueta }) => (
  <div style={{ marginBottom: 16 }}>
    <div
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)",
        color: "#fff",
        borderRadius: "10px 10px 0 0",
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <img src={logoSrc} alt="Logo" style={{ width: 72, height: 72, objectFit: "contain" }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", fontSize: 16 }}>
          Comision Municipal de Agua Potable y Alcantarillado
        </div>
        <div style={{ fontSize: 11, opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>
          Villa Pesqueira, Sonora
        </div>
      </div>
      <div
        style={{
          border: "1px solid rgba(255,255,255,0.35)",
          background: "rgba(255,255,255,0.12)",
          borderRadius: 8,
          padding: "8px 12px",
          textAlign: "center",
          minWidth: 170,
        }}
      >
        <div style={{ fontSize: 9, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Filtro aplicado</div>
        <div style={{ marginTop: 3, fontSize: 13, fontWeight: 700 }}>{etiqueta}</div>
      </div>
    </div>

    <div
      style={{
        borderLeft: "4px solid #0ea5e9",
        borderRight: "1px solid #bae6fd",
        borderBottom: "1px solid #bae6fd",
        borderRadius: "0 0 8px 8px",
        padding: "10px 18px",
        background: "#ecfeff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a", letterSpacing: "0.05em", textTransform: "uppercase" }}>
        Reporte de Metricas de Lecturas y Rutas
      </div>
      <div style={{ fontSize: 10, color: "#334155" }}>
        Generado: {new Date().toLocaleString("es-MX")}
      </div>
    </div>
  </div>
);

const Box = ({ title, value }) => (
  <div
    style={{
      border: "1px solid #e2e8f0",
      borderRadius: 10,
      padding: "10px 12px",
      background: "#fff",
      minHeight: 72,
    }}
  >
    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", fontWeight: 700 }}>{title}</div>
    <div style={{ marginTop: 5, fontWeight: 800, color: "#0f172a", fontSize: 20 }}>{value}</div>
  </div>
);

const TableSimple = ({ title, columns, rows }) => (
  <div style={{ marginTop: 14 }}>
    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#1e293b", marginBottom: 6 }}>
      {title}
    </div>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
      <thead>
        <tr>
          {columns.map((c, i) => (
            <th
              key={i}
              style={{
                textAlign: "left",
                background: "#0f172a",
                color: "#fff",
                padding: "6px 7px",
                borderRight: i === columns.length - 1 ? "none" : "1px solid rgba(255,255,255,0.2)",
                textTransform: "uppercase",
                fontSize: 9,
                letterSpacing: "0.06em",
              }}
            >
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {(rows || []).map((r, i) => (
          <tr key={i}>
            {r.map((cell, ci) => (
              <td
                key={ci}
                style={{
                  padding: "6px 7px",
                  borderBottom: "1px solid #e2e8f0",
                  borderRight: ci === r.length - 1 ? "none" : "1px solid #f1f5f9",
                  color: "#0f172a",
                }}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ReporteLecturasMetricas = () => {
  const [searchParams] = useSearchParams();
  const { logoSrc } = useAppLogo();
  const [data, setData] = useState(null);
  const [ready, setReady] = useState(false);

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
  const rutas = data?.rutas || {};

  const seriesRows = useMemo(
    () =>
      (consumo?.series?.consumo_mensual || []).map((m) => [
        fmtPeriodo(m.periodo),
        fmt(m.recibos),
        `${fmt(m.consumo_total_m3, 2)} m3`,
        `${fmt(m.consumo_promedio_m3, 2)} m3`,
      ]),
    [consumo]
  );

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
          tr { page-break-inside: avoid; }
        }
      `}</style>

      <div className="bg-slate-50 min-h-screen py-8 px-4 flex justify-center print:p-0 print:bg-white print:block">
        <div
          className="w-full max-w-[900px] bg-white rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:max-w-none"
          style={{ padding: 24, fontFamily: "'Segoe UI', Arial, sans-serif" }}
        >
          <Header logoSrc={logoSrc} etiqueta={data?.filtro_aplicado?.etiqueta || "-"} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
            <Box title="Recibos" value={fmt(consumo?.resumen?.total_recibos)} />
            <Box title="Consumo total" value={`${fmt(consumo?.resumen?.consumo_total_m3, 2)} m3`} />
            <Box title="Promedio por recibo" value={`${fmt(consumo?.resumen?.consumo_promedio_m3, 2)} m3`} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, marginTop: 10 }}>
            <Box title="Clientes analizados" value={fmt(consumo?.resumen?.total_clientes)} />
            <Box title="Promedio por cliente" value={`${fmt(consumo?.resumen?.promedio_consumo_por_cliente_m3, 2)} m3`} />
            <Box title="Rutas con consumo" value={fmt((consumo?.distribucion_rutas || []).length)} />
          </div>

          <TableSimple
            title="Resumen operativo de rutas"
            columns={["Total rutas", "Completadas", "En progreso", "Sin iniciar", "Avance"]}
            rows={[[
              fmt(rutas?.resumen?.total_rutas),
              fmt(rutas?.resumen?.rutas_completadas),
              fmt(rutas?.resumen?.rutas_en_progreso),
              fmt(rutas?.resumen?.rutas_sin_iniciar),
              `${fmt(rutas?.resumen?.promedio_completado)}%`,
            ]]}
          />

          <TableSimple
            title="Tendencia mensual de consumo"
            columns={["Periodo", "Recibos", "Consumo total", "Promedio"]}
            rows={seriesRows}
          />

          <TableSimple
            title="Top consumidores"
            columns={["Cliente", "Localidad", "Recibos", "Consumo total"]}
            rows={(consumo?.listados?.top_consumidores || []).map((c) => [
              c.cliente_nombre,
              c.localidad || "-",
              fmt(c.recibos),
              `${fmt(c.consumo_total_m3, 2)} m3`,
            ])}
          />

          <TableSimple
            title="Consumo por ruta"
            columns={["Ruta", "Recibos", "Consumo total", "Promedio"]}
            rows={(consumo?.distribucion_rutas || []).map((r) => [
              r.ruta_nombre,
              fmt(r.recibos),
              `${fmt(r.consumo_total_m3, 2)} m3`,
              `${fmt(r.consumo_promedio_m3, 2)} m3`,
            ])}
          />
        </div>
      </div>
    </>
  );
};

export default ReporteLecturasMetricas;
