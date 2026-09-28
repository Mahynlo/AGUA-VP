import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppLogo } from "../../context/LogoContext";
import { useNotifyPrintReady } from "../../hooks/useNotifyPrintReady";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n, dec = 0) =>
  Number(n || 0).toLocaleString("es-MX", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });

const formatMonthYearLong = (periodoMes) => {
  if (!periodoMes || !/^\d{4}-\d{2}$/.test(periodoMes)) return periodoMes || "Período Ordinario";
  const [anio, mes] = periodoMes.split("-");
  const fecha = new Date(Number(anio), Number(mes) - 1, 1);
  const label = fecha.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

// ─── Ordenamiento alfanumérico inteligente ────────────────────────────────────

const sortLecturasItems = (items, campo = "numero_predio") => {
  return [...items].sort((a, b) => {
    if (campo === "id") {
      return (Number(a?.id) || 0) - (Number(b?.id) || 0);
    }
    const valA = String(a?.numero_predio || "");
    const valB = String(b?.numero_predio || "");
    return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
  });
};

// Normalización de datos en grupos homogéneos
const normalizeLecturasData = (raw) => {
  if (!raw) return [];
  if (!Array.isArray(raw)) {
    if (Array.isArray(raw.data)) return normalizeLecturasData(raw.data);
    if (Array.isArray(raw.clientes)) return [{ localidad: raw.localidad || "Padrón General", clientes: raw.clientes }];
    return [];
  }
  if (raw.length === 0) return [];
  if (raw[0]?.clientes && Array.isArray(raw[0].clientes)) {
    return raw;
  }
  const hasLocalidades = raw.some((c) => c._localidad || c.localidad || c.ruta);
  if (hasLocalidades) {
    const map = new Map();
    raw.forEach((c) => {
      const loc = c._localidad || c.localidad || c.ruta || "Localidad General";
      if (!map.has(loc)) map.set(loc, []);
      map.get(loc).push(c);
    });
    return Array.from(map.entries()).map(([localidad, clientes]) => ({ localidad, clientes }));
  }
  return [{ localidad: "Padrón General de Lecturas", clientes: raw }];
};

// ─── Componente Principal ─────────────────────────────────────────────────────

const ReporteLecturas = () => {
  const [searchParams] = useSearchParams();
  const { logoSrc } = useAppLogo();
  const [data, setData] = useState([]);
  const [mes, setMes] = useState("");
  const [isReady, setIsReady] = useState(false);

  useNotifyPrintReady(isReady);

  useEffect(() => {
    const cargarDatos = async () => {
      setMes(searchParams.get("mes") || "");
      const dataKey = searchParams.get("dataKey");
      const dataParam = searchParams.get("data");
      const useStorage = searchParams.get("useStorage");

      if (dataKey) {
        try {
          const raw = await window.api.getPrintData(dataKey);
          if (raw) setData(typeof raw === "string" ? JSON.parse(raw) : raw);
        } catch (e) {
          console.error("Error IPC getPrintData:", e);
        }
      } else if (dataParam) {
        try {
          setData(JSON.parse(decodeURIComponent(dataParam)));
        } catch (e) {
          console.error(e);
        }
      } else if (useStorage) {
        try {
          const stored = localStorage.getItem("reporte_lecturas_data");
          if (stored) setData(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      } else {
        // Datos demostrativos de respaldo si no hay parámetros
        setData([
          {
            localidad: "Sector Centro",
            clientes: Array.from({ length: 6 }, (_, i) => ({
              id: 1000 + i,
              numero_predio: `NG-${String(i + 1).padStart(3, "0")}`,
              nombre: `CLIENTE DE MUESTRA ${i + 1}`,
              direccion: `CALLE HIDALGO #${i + 10}, COLONIA CENTRO`,
              sin_medidor: i === 3,
              medidor: i === 3 ? null : { serie: `M-${5000 + i}`, ubicacion: `CALLE HIDALGO #${i + 10}` },
              lectura_anterior: {
                consumo_registrado: 12 + i * 2,
                lectura_fisica: String(12400 + i * 15).padStart(5, "0"),
                es_cambio_medidor: i === 2,
                es_medidor_nuevo: i === 4,
              },
            })),
          },
        ]);
      }
      setIsReady(true);
    };
    cargarDatos();
  }, [searchParams]);

  const ordenarPor = searchParams.get("ordenarPor") || "numero_predio";
  const grupos = useMemo(() => normalizeLecturasData(data), [data]);

  const estadisticas = useMemo(() => {
    let total = 0;
    let conMed = 0;
    let sinMed = 0;
    let cambios = 0;
    let nuevos = 0;

    grupos.forEach((g) => {
      (g.clientes || []).forEach((c) => {
        total++;
        const esSinMed = c.sin_medidor || (!c.medidor && c.medidor !== 0);
        if (esSinMed) sinMed++;
        else conMed++;

        const lectAnt = typeof c.lectura_anterior === "object" ? c.lectura_anterior : null;
        if (lectAnt?.es_cambio_medidor) cambios++;
        if (lectAnt?.es_medidor_nuevo) nuevos++;
      });
    });

    return { total, conMed, sinMed, cambios, nuevos };
  }, [grupos]);

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

  const periodoLabel = useMemo(() => formatMonthYearLong(mes), [mes]);

  if (!isReady) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif", color: "#6b7280", backgroundColor: "#f8fafc" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "32px", height: "32px", border: "4px solid #2563eb", borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
          Cargando formato de toma de lecturas...
        </div>
      </div>
    );
  }

  let globalRowCounter = 0;

  return (
    <>
      <style>{`
        @media print {
          @page { size: letter portrait; margin: 10mm; }
          body { margin: 0; padding: 0; background: white; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-break { page-break-inside: avoid; break-inside: avoid; }
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
        @keyframes spin { 100% { transform: rotate(360deg); } }
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
                          Villa Pesqueira, Sonora — Formato de Toma de Lecturas
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
                        Total Tomas
                      </div>
                      <div style={{ fontWeight: 800, fontSize: "18px", marginTop: "1px", color: "#ffffff" }}>
                        {estadisticas.total}
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
                        Período a Levantar
                      </div>
                      <div style={{ fontSize: "10px", fontWeight: 800, color: "#1e3a8a", textTransform: "uppercase" }}>
                        {periodoLabel}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "7px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: 700 }}>
                        Criterio de Secuencia
                      </div>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "#0f172a" }}>
                        {ordenarPor === "id" ? "ID DE SISTEMA" : "NÚMERO DE PREDIO"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "7px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: 700 }}>
                        Cobertura en Ruta
                      </div>
                      <div style={{ fontSize: "10px", fontWeight: 600, color: "#475569" }}>
                        {grupos.length} SECTOR(ES) / LOCALIDAD(ES)
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "7px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: 700 }}>
                        Expedición Oficial
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
                    <div style={{ fontSize: "8px", textTransform: "uppercase", color: "#475569", fontWeight: 700 }}>Tomas en Listado</div>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>{fmt(estadisticas.total)}</div>
                    <div style={{ fontSize: "7.5px", color: "#64748b", marginTop: "2px" }}>Padrón activo a medir</div>
                  </div>

                  <div style={{ border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: "8px", padding: "10px" }}>
                    <div style={{ fontSize: "8px", textTransform: "uppercase", color: "#2563eb", fontWeight: 700 }}>Con Medidor Activo</div>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: "#2563eb", marginTop: "2px" }}>{fmt(estadisticas.conMed)}</div>
                    <div style={{ fontSize: "7.5px", color: "#64748b", marginTop: "2px" }}>Lectura física obligatoria</div>
                  </div>

                  <div style={{ border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: "8px", padding: "10px" }}>
                    <div style={{ fontSize: "8px", textTransform: "uppercase", color: "#d97706", fontWeight: 700 }}>Cuota Fija / Sin Medidor</div>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: "#d97706", marginTop: "2px" }}>{fmt(estadisticas.sinMed)}</div>
                    <div style={{ fontSize: "7.5px", color: "#64748b", marginTop: "2px" }}>Sin registro volumétrico</div>
                  </div>

                  <div style={{ border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: "8px", padding: "10px" }}>
                    <div style={{ fontSize: "8px", textTransform: "uppercase", color: "#d97706", fontWeight: 700 }}>Cambios de Medidor</div>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: "#d97706", marginTop: "2px" }}>{fmt(estadisticas.cambios)}</div>
                    <div style={{ fontSize: "7.5px", color: "#64748b", marginTop: "2px" }}>Requiere verificación</div>
                  </div>

                  <div style={{ border: "1px solid #cbd5e1", background: "#ffffff", borderRadius: "8px", padding: "10px" }}>
                    <div style={{ fontSize: "8px", textTransform: "uppercase", color: "#059669", fontWeight: 700 }}>Medidores Nuevos</div>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: "#059669", marginTop: "2px" }}>{fmt(estadisticas.nuevos)}</div>
                    <div style={{ fontSize: "7.5px", color: "#64748b", marginTop: "2px" }}>Primer ciclo de lectura</div>
                  </div>
                </div>

                {/* ── TABLAS DE TOMA DE LECTURAS POR GRUPO / SECTOR ── */}
                {grupos.map((grupo, gIdx) => {
                  const clientesOrdenados = sortLecturasItems(grupo.clientes || [], ordenarPor);
                  if (clientesOrdenados.length === 0) return null;

                  return (
                    <div key={gIdx} style={{ marginBottom: "14px" }}>
                      {/* Cabecera de Sección de Ruta / Localidad */}
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
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#1e40af" }} />
                          <span style={{ fontSize: "10.5px", fontWeight: 800, color: "#1e3a8a", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                            SECTOR / LOCALIDAD: {grupo.localidad || grupo.ruta || "Padrón General"}
                          </span>
                        </div>
                        <span style={{ fontSize: "9px", fontWeight: 700, color: "#64748b" }}>
                          {clientesOrdenados.length} tomas programadas en esta sección
                        </span>
                      </div>

                      {/* Tabla Tabular de Campo */}
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9.5px", border: "1px solid #cbd5e1", borderTop: "none" }}>
                        <thead>
                          <tr>
                            <th style={{ background: "#1e293b", color: "white", padding: "5px 3px", textAlign: "center", width: "24px", fontSize: "9px" }}>#</th>
                            <th style={{ background: "#1e293b", color: "white", padding: "5px 4px", textAlign: "center", width: "55px", fontSize: "9px" }}>
                              {ordenarPor === "id" ? "ID" : "Predio"}
                            </th>
                            <th style={{ background: "#1e293b", color: "white", padding: "5px 8px", textAlign: "left", fontSize: "9px" }}>
                              Usuario / Titular y Ubicación
                            </th>
                            <th style={{ background: "#1e293b", color: "white", padding: "5px 6px", textAlign: "left", width: "85px", fontSize: "9px" }}>
                              N° Medidor
                            </th>
                            <th style={{ background: "#1e293b", color: "white", padding: "5px 4px", textAlign: "center", width: "62px", fontSize: "9px" }}>
                              Mes Ant.
                            </th>
                            <th style={{ background: "#1e293b", color: "white", padding: "5px 4px", textAlign: "center", width: "68px", fontSize: "9px" }}>
                              Lect. Ant.
                            </th>
                            <th style={{ background: "#1e293b", color: "white", padding: "5px 4px", textAlign: "center", width: "70px", fontSize: "9px" }}>
                              Lect. Actual
                            </th>
                            <th style={{ background: "#1e293b", color: "white", padding: "5px 4px", textAlign: "center", width: "58px", fontSize: "9px" }}>
                              Consumo
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientesOrdenados.map((item, idx) => {
                            globalRowCounter++;
                            const nombre = item.nombre || item.cliente || "Sin Nombre";
                            const sinMed = item.sin_medidor || (!item.medidor && item.medidor !== 0);
                            const medidorObj = typeof item.medidor === "object" ? item.medidor : null;
                            const serie = sinMed ? null : medidorObj ? medidorObj.serie || medidorObj.numero_serie || "S/N" : item.medidor || "S/N";
                            const direccion = medidorObj?.ubicacion || item.direccion || "";

                            const lectAntObj = typeof item.lectura_anterior === "object" ? item.lectura_anterior : null;
                            const consumoAnt = sinMed
                              ? ""
                              : lectAntObj?.consumo_registrado ?? (typeof item.lectura_anterior === "number" ? item.lectura_anterior : "");
                            const lecturaFisicaAnt = sinMed ? "" : lectAntObj?.lectura_fisica ?? lectAntObj?.valor ?? "";
                            const esCambio = !sinMed && !!lectAntObj?.es_cambio_medidor;
                            const esNuevo = !sinMed && !esCambio && !!lectAntObj?.es_medidor_nuevo;

                            const isEven = idx % 2 === 0;
                            const bgRow = sinMed ? "#fffbeb" : isEven ? "#ffffff" : "#f8fafc";

                            return (
                              <tr key={idx} style={{ background: bgRow, borderBottom: "1px solid #e2e8f0" }}>
                                <td style={{ border: "1px solid #e2e8f0", padding: "4px 2px", textAlign: "center", color: "#64748b", fontWeight: 700, fontSize: "9px" }}>
                                  {globalRowCounter}
                                </td>
                                <td style={{ border: "1px solid #e2e8f0", padding: "4px 3px", textAlign: "center", fontFamily: "monospace", fontWeight: 800, fontSize: "10px", color: sinMed ? "#c2410c" : "#1e40af", background: sinMed ? "#fef3c7" : isEven ? "#eff6ff" : "#dbeafe" }}>
                                  {ordenarPor === "id" ? item.id || "—" : item.numero_predio || "—"}
                                </td>
                                <td style={{ border: "1px solid #e2e8f0", padding: "4px 8px" }}>
                                  <div style={{ fontWeight: 800, fontSize: "10px", color: "#0f172a", textTransform: "uppercase", lineHeight: 1.2 }}>{nombre}</div>
                                  {direccion && (
                                    <div style={{ fontSize: "8px", color: "#64748b", textTransform: "uppercase", marginTop: "1px" }}>
                                      {direccion}
                                    </div>
                                  )}
                                </td>
                                <td style={{ border: "1px solid #e2e8f0", padding: "4px 6px" }}>
                                  {sinMed ? (
                                    <span style={{ fontSize: "8px", fontWeight: 800, color: "#c2410c", textTransform: "uppercase" }}>
                                      SIN MEDIDOR
                                    </span>
                                  ) : (
                                    <div>
                                      <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "9.5px", color: "#0f172a" }}>{serie}</span>
                                      {esCambio && (
                                        <div style={{ fontSize: "6.5px", fontWeight: 800, color: "#b45309", background: "#fef3c7", padding: "1px 3px", borderRadius: "2px", width: "fit-content", marginTop: "1px" }}>
                                          CAMBIO
                                        </div>
                                      )}
                                      {esNuevo && (
                                        <div style={{ fontSize: "6.5px", fontWeight: 800, color: "#047857", background: "#d1fae5", padding: "1px 3px", borderRadius: "2px", width: "fit-content", marginTop: "1px" }}>
                                          NUEVO
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </td>
                                {/* Mes Ant.: número grande destacado */}
                                <td style={{ border: "1px solid #e2e8f0", padding: "4px 2px", textAlign: "center", background: sinMed ? "#fffbeb" : "#eff6ff" }}>
                                  {sinMed ? (
                                    <span style={{ color: "#94a3b8" }}>—</span>
                                  ) : consumoAnt !== "" ? (
                                    <span>
                                      <strong style={{ fontSize: "12.5px", color: "#2563eb", fontFamily: "monospace" }}>{fmt(consumoAnt)}</strong>
                                      <span style={{ fontSize: "8px", color: "#64748b", marginLeft: "2px", fontWeight: 700 }}>m³</span>
                                    </span>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                                {/* Lect. Ant.: número grande destacado */}
                                <td style={{ border: "1px solid #e2e8f0", padding: "4px 2px", textAlign: "center", background: sinMed ? "#fffbeb" : "#f1f5f9" }}>
                                  {sinMed ? (
                                    <span style={{ color: "#94a3b8" }}>—</span>
                                  ) : lecturaFisicaAnt !== "" ? (
                                    <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#1e3a8a", fontFamily: "monospace", letterSpacing: "0.5px" }}>
                                      {String(lecturaFisicaAnt)}
                                    </span>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                                {/* Casilla en blanco para lectura actual */}
                                <td style={{ border: "1px solid #cbd5e1", padding: "4px", textAlign: "center", background: sinMed ? "#fef3c7" : "#ffffff", height: "24px" }}>
                                  {sinMed ? <span style={{ color: "#94a3b8", fontWeight: 800 }}>—</span> : null}
                                </td>
                                {/* Casilla para consumo / diferencia */}
                                <td style={{ border: "1px solid #cbd5e1", padding: "4px", textAlign: "right", position: "relative", background: sinMed ? "#fef3c7" : "#ffffff", height: "24px" }}>
                                  {sinMed ? (
                                    <span style={{ color: "#94a3b8", display: "flex", justifyContent: "center", fontWeight: 800 }}>—</span>
                                  ) : (
                                    <span style={{ fontSize: "7.5px", color: "#94a3b8", fontWeight: "bold" }}>m³</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
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
          <span>AGUA VILLA PESQUEIRA · Formato Oficial de Toma de Lecturas · Emisión: {fechaHoyCorta} {horaHoy}</span>
          <span style={{ fontWeight: 700, color: "#1e3a8a" }}>DOCUMENTO OFICIAL DE CONTROL OPERATIVO</span>
        </div>
      </div>
    </>
  );
};

export default ReporteLecturas;
