import React, { useState, useEffect } from "react";
import { Button, Card, CardHeader, CardContent } from "@heroui/react";
import { HiPrinter, HiEye, HiUsers, HiSortAscending, HiLocationMarker, HiDownload, HiDocumentReport, HiCog, HiChevronDown, HiDocumentText } from "react-icons/hi";
import ListadoLecturas from "./components/ListadoLecturas";
import ModalImprimir from "./components/ModalImprimir";
import { useReportes } from "../../../context/ReportesContext";
import { useRutas } from "../../../context/RutasContext";
import { useClientes } from "../../../context/ClientesContext";
import { exportData } from "../../../utils/exportUtils";
import { obtenerPeriodoActual } from "../../../utils/periodoUtils";
import { preloadPdfViewer } from "../../../utils/pdfPreloader";

const formatearPeriodoTexto = (periodoStr) => {
  if (!periodoStr || !/^\d{4}-\d{2}$/.test(periodoStr)) return periodoStr;
  const [anio, mes] = periodoStr.split('-');
  const date = new Date(parseInt(anio, 10), parseInt(mes, 10) - 1, 1);
  const mesNombre = date.toLocaleDateString('es-MX', { month: 'long' });
  const mesCapitalizado = mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1);
  return `${mesCapitalizado} de ${anio}`;
};

const TabReportes = () => {
  // Precarga proactiva del visor de PDF
  useEffect(() => {
    preloadPdfViewer();
  }, []);

  // --- USO DE CONTEXTO ---
  /* eslint-disable no-unused-vars */
  const {
    lecturas,
    loading,
    cargarLecturas
  } = useReportes();
  const { periodosInfo, siguientePeriodo, ultimoPeriodoRegistrado } = useRutas();
  const { allClientes, fetchAllClientes } = useClientes();

  useEffect(() => {
    if (!allClientes || allClientes.length === 0) {
      fetchAllClientes?.();
    }
  }, [allClientes, fetchAllClientes]);

  const [periodo, setPeriodo] = useState(() => ultimoPeriodoRegistrado || siguientePeriodo || obtenerPeriodoActual());

  React.useEffect(() => {
    if (ultimoPeriodoRegistrado) {
      setPeriodo(ultimoPeriodoRegistrado);
    }
  }, [ultimoPeriodoRegistrado]);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [printUrl, setPrintUrl] = useState(null);
  const [modoPdf, setModoPdf] = useState(null);   // 'vista-previa' | 'imprimir' | null

  // Acción en curso — cubre TODA la operación async de cada botón.
  // 'preview-lecturas' | 'print-lecturas' | 'preview-padron' | 'print-padron' | 'export' | null
  const [accion, setAccion] = useState(null);
  const procesando = accion !== null;

  // --- LECTURAS: Opciones de impresión ---
  const [ordenLecturas, setOrdenLecturas] = useState("numero_predio");
  const [ciudadLecturas, setCiudadLecturas] = useState("todas");

  // --- PADRÓN GENERAL ---
  const [ordenPadron, setOrdenPadron] = useState("numero_predio");
  const [agrupacion, setAgrupacion] = useState("ciudad");

  // --- EXPORTAR DATOS ---
  const [modoExport, setModoExport] = useState("clientes");
  const [formatoExport, setFormatoExport] = useState("xlsx");

  React.useEffect(() => {
    if (periodo) {
      const token = localStorage.getItem('token');
      cargarLecturas(token, periodo);
    }
  }, [periodo, cargarLecturas]);

  const lecturasData = lecturas || [];
  const loadingLecturas = loading; 

  const ciudadesDisponibles = React.useMemo(() => {
    if (!lecturasData || lecturasData.length === 0) return [];
    if (lecturasData[0]?.localidad) {
      return lecturasData.map(g => g.localidad).filter(Boolean).sort();
    }
    return [];
  }, [lecturasData]);

  const lecturasDataFiltradas = React.useMemo(() => {
    if (!lecturasData || lecturasData.length === 0) return [];
    
    // 1. Filtrar por localidad
    let filtradas = lecturasData;
    if (ciudadLecturas !== "todas" && lecturasData[0]?.localidad) {
      filtradas = lecturasData.filter(g => g.localidad === ciudadLecturas);
    }
    
    // 2. Ordenar clientes dentro de cada localidad
    return filtradas.map(grupo => {
      if (!grupo.clientes) return grupo;
      
      const clientesOrdenados = [...grupo.clientes].sort((a, b) => {
        if (ordenLecturas === "numero_predio") {
          const valA = String(a.numero_predio || "");
          const valB = String(b.numero_predio || "");
          return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
        } else {
          return (a.id || 0) - (b.id || 0);
        }
      });
      
      return {
        ...grupo,
        clientes: clientesOrdenados
      };
    });
  }, [lecturasData, ciudadLecturas, ordenLecturas]);

  // --- MÉTRICAS ESTIMADAS (Tomas y Hojas) ---
  const totalTomas = React.useMemo(() => {
    return lecturasDataFiltradas.reduce((acc, g) => acc + (g.clientes ? g.clientes.length : 0), 0);
  }, [lecturasDataFiltradas]);

  const hojasLecturasEstimadas = React.useMemo(() => {
    if (totalTomas === 0) return 0;
    return totalTomas <= 18 ? 1 : 1 + Math.ceil((totalTomas - 18) / 24);
  }, [totalTomas]);

  const totalClientesPadron = allClientes?.length || 0;
  const hojasPadronEstimadas = React.useMemo(() => {
    if (totalClientesPadron === 0) return 0;
    return 1 + Math.ceil(totalClientesPadron / 22);
  }, [totalClientesPadron]);

  const getUrlLecturas = async (soloPrueba = false) => {
    let dataToSend = lecturasDataFiltradas;
    if (soloPrueba && dataToSend.length > 0) {
      // 1 sola página de prueba (primer grupo, máx 8 tomas)
      const primerGrupo = dataToSend[0];
      dataToSend = [{
        ...primerGrupo,
        clientes: (primerGrupo.clientes || []).slice(0, 8)
      }];
    }
    const dataKey = await window.api.savePrintData(JSON.stringify(dataToSend));

    const { protocol, origin, href } = window.location;
    const params = `mes=${periodo}&dataKey=${dataKey}&ordenarPor=${ordenLecturas}&print=true`;
    if (protocol === 'file:') {
      const base = href.split('#')[0];
      return `${base}#/reporteLecturas?${params}`;
    }
    return `${origin}/#/reporteLecturas?${params}`;
  };

  // --- FUNCIONES PADRÓN GENERAL ---
  const getUrlPadron = async (soloPrueba = false) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("No hay token de sesión");

      let clientesData = allClientes && allClientes.length > 0 ? allClientes : [];
      if (clientesData.length === 0) {
        const response = await window.api.fetchClientes(token);
        if (response && response.data) {
          clientesData = response.data;
        } else if (Array.isArray(response)) {
          clientesData = response;
        }
      }

      if (clientesData.length === 0) {
        alert("No hay clientes registrados para generar el padrón");
        return null;
      }

      if (soloPrueba) {
        // 1 sola página de prueba (primeros 15 clientes)
        clientesData = clientesData.slice(0, 15);
      }

      const dataKey = await window.api.savePrintData(JSON.stringify(clientesData));

      const { protocol, origin, href } = window.location;
      const base = protocol === 'file:' ? href.split('#')[0] : origin + '/';
      const hashBase = protocol === 'file:' ? `${base}#` : `${origin}/#`;
      return `${hashBase}/reporteClientes?dataKey=${dataKey}&ordenarPor=${ordenPadron}&agrupar=${agrupacion}&print=true`;
    } catch (err) {
      console.error("Error al preparar Padrón General:", err);
      alert("Error al cargar datos de clientes");
      return null;
    }
  };

  const handleGenerarPadron = async () => {
    setAccion('generar-padron');
    try {
      const url = await getUrlPadron(false);
      if (!url) return;
      const response = await window.api.previewComponent(url, { pageNumbers: true });
      if (response && response.success && response.path) {
        setPrintUrl(url);
        setPdfUrl(response.path);
        setModoPdf('imprimir');
      }
    } catch (err) {
      console.error("Error preparing padron print:", err);
      alert("Error al preparar la emisión del padrón");
    } finally {
      setAccion(null);
    }
  };

  const handlePruebaPadron = async () => {
    setAccion('prueba-padron');
    try {
      const url = await getUrlPadron(true);
      if (!url) return;
      const response = await window.api.previewComponent(url, { pageNumbers: true });
      if (response && response.success && response.path) {
        setPrintUrl(url);
        setPdfUrl(response.path);
        setModoPdf('imprimir');
      }
    } catch (err) {
      console.error("Error preparing padron test print:", err);
      alert("Error al generar prueba del padrón");
    } finally {
      setAccion(null);
    }
  };

  // ─── EXPORTAR DATOS ──────────────────────────────────────────────────────────
  const buildSerieRutaMap = async (token) => {
    const map = {};
    try {
      const resp = await window.api.listarRutas(token, { limit: 999, page: 1 });
      const rutasList = resp?.rutas || [];
      rutasList.forEach(ruta => {
        (ruta.numeros_serie || []).forEach(serie => {
          if (serie) map[serie] = ruta.nombre;
        });
      });
    } catch (e) {
      console.warn('No se pudo construir mapa de rutas:', e);
    }
    return map;
  };

  const handleExportar = async () => {
    setAccion('export');
    try {
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];

      if (modoExport === 'clientes') {
        const resp = await window.api.fetchClientes(token);
        const clientes = resp?.data || (Array.isArray(resp) ? resp : []);
        if (!clientes.length) { alert("No hay clientes para exportar"); return; }
        
        const rows = clientes.map((c, index) => ({
          "No.": index + 1,
          "Nombre": c.nombre || "",
          "Número de Predio": c.numero_predio || "",
          "Ciudad": c.ciudad || "",
          "Dirección": c.direccion || "",
          "Teléfono": c.telefono || "",
          "Correo": c.email || c.correo || "",
          "Tarifa": c.tarifa_nombre || c.tarifa || "Sin Tarifa",
          "Estado": c.estado_cliente || c.estado || "Activo"
        }));
        await exportData(rows, `Clientes_${today}`, formatoExport);

      } else if (modoExport === 'medidores') {
        const resp = await window.api.fetchMedidores(token);
        const medidores = resp?.data || (Array.isArray(resp) ? resp : []);
        if (!medidores.length) { alert("No hay medidores para exportar"); return; }
        const rutaMap = await buildSerieRutaMap(token);
        
        const rows = medidores.map((m, index) => ({
          "No.": index + 1,
          "Número de Serie": m.numero_serie || "",
          "Ruta": rutaMap[m.numero_serie] || "Sin Ruta",
          "Marca": m.marca || "",
          "Modelo": m.modelo || "",
          "Ubicación": m.ubicacion || "",
          "Latitud": m.latitud || "",
          "Longitud": m.longitud || "",
          "Fecha de Instalación": m.fecha_instalacion ? new Date(m.fecha_instalacion).toLocaleDateString("es-MX") : "No registrada",
          "Lectura Base": m.lectura_base || 0,
          "Capacidad Máxima (m³)": m.capacidad_maxima ?? 99999,
          "Estado Medidor": m.estado_medidor || "",
          "Estado Servicio": m.estado_servicio || "",
          "Cliente Asignado": m.cliente_nombre || "No Asignado",
          "Predio del Cliente": m.numero_predio || ""
        }));
        await exportData(rows, `Medidores_${today}`, formatoExport);

      } else if (modoExport === 'combinado') {
        const [clientesResp, medidoresResp] = await Promise.all([
          window.api.fetchClientes(token),
          window.api.fetchMedidores(token)
        ]);
        const clientes = clientesResp?.data || (Array.isArray(clientesResp) ? clientesResp : []);
        const medidores = medidoresResp?.data || (Array.isArray(medidoresResp) ? medidoresResp : []);
        if (!clientes.length) { alert("No hay clientes para exportar"); return; }

        const rutaMap = await buildSerieRutaMap(token);
        const medidorByClienteId = {};
        medidores.forEach(m => { if (m.cliente_id) medidorByClienteId[m.cliente_id] = m; });

        const rows = clientes.map((c, index) => {
          const m = medidorByClienteId[c.id];
          const row = {
            "No.": index + 1,
            "Nombre": c.nombre || "",
            "Número de Predio": c.numero_predio || "",
            "Ciudad": c.ciudad || "",
            "Dirección": c.direccion || "",
            "Teléfono": c.telefono || "",
            "Correo": c.email || c.correo || "",
            "Tarifa": c.tarifa_nombre || c.tarifa || "Sin Tarifa",
            "Estado Cliente": c.estado_cliente || c.estado || "Activo"
          };

          if (m) {
            row["Número de Serie_medidor"] = m.numero_serie || "";
            row["Ruta_medidor"] = rutaMap[m.numero_serie] || "Sin Ruta";
            row["Marca_medidor"] = m.marca || "";
            row["Modelo_medidor"] = m.modelo || "";
            row["Ubicación_medidor"] = m.ubicacion || "";
            row["Latitud_medidor"] = m.latitud || "";
            row["Longitud_medidor"] = m.longitud || "";
            row["Fecha de Instalación_medidor"] = m.fecha_instalacion ? new Date(m.fecha_instalacion).toLocaleDateString("es-MX") : "No registrada";
            row["Lectura Base_medidor"] = m.lectura_base || 0;
            row["Capacidad Máxima (m³)_medidor"] = m.capacidad_maxima ?? 99999;
            row["Estado Medidor_medidor"] = m.estado_medidor || "";
            row["Estado Servicio_medidor"] = m.estado_servicio || "";
          } else {
            row["Número de Serie_medidor"] = "Sin medidor";
            row["Ruta_medidor"] = "";
            row["Marca_medidor"] = "";
            row["Modelo_medidor"] = "";
            row["Ubicación_medidor"] = "";
            row["Latitud_medidor"] = "";
            row["Longitud_medidor"] = "";
            row["Fecha de Instalación_medidor"] = "";
            row["Lectura Base_medidor"] = "";
            row["Capacidad Máxima (m³)_medidor"] = "";
            row["Estado Medidor_medidor"] = "";
            row["Estado Servicio_medidor"] = "";
          }
          return row;
        });

        await exportData(rows, `Clientes_Medidores_${today}`, formatoExport);

      } else if (modoExport === 'cobranza') {
        const resp = await window.api.fetchClientes(token);
        const clientes = resp?.data || (Array.isArray(resp) ? resp : []);
        if (!clientes.length) { alert("No hay clientes para generar cobranza"); return; }

        // Fetch all bills
        let pageF = 1;
        let totalPagesF = 1;
        const facturasHistorial = [];
        while (pageF <= totalPagesF) {
          const response = await window.api.fetchFacturas(token, { page: pageF, limit: 200, search: "", estado: "" });
          if (response?.facturas && Array.isArray(response.facturas)) {
            facturasHistorial.push(...response.facturas);
            totalPagesF = response?.pagination?.totalPages || 1;
            pageF += 1;
          } else if (Array.isArray(response)) {
            facturasHistorial.push(...response);
            break;
          } else {
            break;
          }
        }

        const facturasPorCliente = new Map();
        facturasHistorial.forEach((factura) => {
          const clienteId = Number(factura.cliente_id);
          if (!facturasPorCliente.has(clienteId)) {
            facturasPorCliente.set(clienteId, []);
          }
          facturasPorCliente.get(clienteId).push(factura);
        });

        const sortFacturasFIFO = (facturas = []) => {
          return [...facturas].sort((a, b) => {
            const dateA = new Date(a.fecha_emision || a.fecha_creacion || 0).getTime();
            const dateB = new Date(b.fecha_emision || b.fecha_creacion || 0).getTime();
            if (dateA !== dateB) return dateA - dateB;
            return Number(a.id) - Number(b.id);
          });
        };

        const toMoney = (value) => {
          const num = Number(value);
          if (!Number.isFinite(num)) return 0;
          return Math.round(num * 100) / 100;
        };

        const rows = clientes.map((c, index) => {
          const facturasCliente = sortFacturasFIFO(facturasPorCliente.get(Number(c.id)) || []);
          const deudaTotal = facturasCliente.reduce((acc, f) => toMoney(acc + f.saldo_pendiente), 0);
          const facturasPendientes = facturasCliente.filter((f) => toMoney(f.saldo_pendiente) > 0 && String(f.estado || "").toLowerCase() !== "pagado").length;
          const facturasPagadas = facturasCliente.filter((f) => String(f.estado || "").toLowerCase().includes("pagad") || toMoney(f.saldo_pendiente) <= 0).length;
          const facturasVencidas = facturasCliente.filter((f) => String(f.estado || "").toLowerCase().includes("vencid")).length;

          return {
            "No.": index + 1,
            "Número de Predio": c.numero_predio || "-",
            "Cliente": c.nombre || "",
            "Dirección": c.direccion || "-",
            "Teléfono": c.telefono || "-",
            "Correo": c.correo || c.email || "-",
            "Deuda Total ($)": deudaTotal,
            "Facturas Pagadas": facturasPagadas,
            "Facturas Pendientes": facturasPendientes,
            "Facturas Vencidas": facturasVencidas,
            "Total Facturas": facturasCliente.length,
            "Estado Cliente": c.estado_cliente || c.estado || "Activo"
          };
        });

        await exportData(rows, `Cobranza_Clientes_${today}`, formatoExport);
      }
    } catch (err) {
      console.error("Error al exportar datos:", err);
      alert("Error al exportar datos. Revisa la consola para más detalles.");
    } finally {
      setAccion(null);
    }
  };

  const handleGenerarLecturas = async () => {
    if (lecturasData.length === 0) return;
    setAccion('generar-lecturas');
    try {
      const url = await getUrlLecturas(false);
      const response = await window.api.previewComponent(url, { pageNumbers: true });
      if (response && response.success && response.path) {
        setPrintUrl(url);
        setPdfUrl(response.path);
        setModoPdf('imprimir');
      }
    } catch (err) {
      console.error("Error generating reading report:", err);
      alert("Error al generar el reporte de lecturas");
    } finally {
      setAccion(null);
    }
  };

  const handlePruebaLecturas = async () => {
    if (lecturasData.length === 0) return;
    setAccion('prueba-lecturas');
    try {
      const url = await getUrlLecturas(true);
      const response = await window.api.previewComponent(url, { pageNumbers: true });
      if (response && response.success && response.path) {
        setPrintUrl(url);
        setPdfUrl(response.path);
        setModoPdf('imprimir');
      }
    } catch (err) {
      console.error("Error generating reading test print:", err);
      alert("Error al generar prueba de lecturas");
    } finally {
      setAccion(null);
    }
  };

  // Clases compartidas para los Selects (Token 4)
  const selectClassNames = {
    trigger: "bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none focus:border-indigo-500 transition-all duration-200 shadow-none h-[52px]",
    value: "font-semibold text-slate-800 dark:text-zinc-100 text-sm"
  };

  return (
    <div className="w-full flex flex-col gap-10 animate-in fade-in duration-300 print:p-0">

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN 1: REPORTE DE LECTURAS                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-2xl shrink-0">
            <HiDocumentReport className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-0.5">
              Gestión e impresión de tomas para cobro
            </h3>
            <p className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
              Reporte de Lecturas Mensual
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* COLUMNA IZQUIERDA: Listado */}
          <div className="lg:col-span-7 xl:col-span-7">
            <ListadoLecturas
              lecturas={lecturasDataFiltradas}
              periodo={periodo}
              setPeriodo={setPeriodo}
              loading={loadingLecturas}
            />
          </div>

          {/* COLUMNA DERECHA: Panel de acciones */}
          <div className="lg:col-span-5 xl:col-span-5">
            <div className="sticky top-4 space-y-4">
              
              {/* Tarjeta KPI */}
              <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 transition-all duration-200 grid grid-cols-3 gap-2 text-center divide-x divide-slate-200 dark:divide-zinc-800 shadow-sm">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Periodo</p>
                  <p className="text-xs font-black tracking-tight text-slate-800 dark:text-zinc-100 uppercase truncate" title={formatearPeriodoTexto(periodo)}>
                    {formatearPeriodoTexto(periodo)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Tomas</p>
                  <p className="text-lg font-black tracking-tight text-sky-600 dark:text-sky-400 font-mono">
                    {totalTomas}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Hojas Est.</p>
                  <p className="text-lg font-black tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
                    {hojasLecturasEstimadas}
                  </p>
                </div>
              </div>

              {/* Opciones de impresión de Lecturas */}
              {lecturasData.length > 0 && (
                <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700">
                  <CardHeader className="pt-5 px-6 pb-4 border-b border-slate-100 dark:border-zinc-800/80">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-xl">
                        <HiCog className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                          Opciones de Emisión
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
                          Filtros del reporte de tomas
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col gap-4">
                    {/* Filtro de Ciudad */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 ml-1">
                        Filtrar por Localidad
                      </label>
                      <select
                        value={ciudadLecturas}
                        onChange={(e) => setCiudadLecturas(e.target.value || "todas")}
                        className="w-full h-12 px-4 text-sm font-semibold rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer transition-all"
                      >
                        <option value="todas">Todas las localidades</option>
                        {ciudadesDisponibles.map(ciudad => (
                          <option key={ciudad} value={ciudad}>{ciudad}</option>
                        ))}
                      </select>
                    </div>

                    {/* Criterio de Ordenamiento */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 ml-1">
                        Criterio de Orden
                      </label>
                      <select
                        value={ordenLecturas}
                        onChange={(e) => setOrdenLecturas(e.target.value || "numero_predio")}
                        className="w-full h-12 px-4 text-sm font-semibold rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer transition-all"
                      >
                        <option value="numero_predio">Número de Predio</option>
                        <option value="id">ID (Secuencial)</option>
                      </select>
                    </div>

                    {/* Resumen */}
                    <div className="bg-sky-500/10 text-sky-700 dark:text-sky-400 rounded-xl p-3.5 flex flex-col gap-1 mt-1 border border-sky-500/20">
                      <p className="text-[10px] font-bold uppercase tracking-widest">
                        Resumen de Selección
                      </p>
                      <p className="text-xs font-medium text-slate-600 dark:text-zinc-300 leading-relaxed">
                        Se generará {ciudadLecturas === "todas" ? "todo el padrón de tomas" : `solo ${ciudadLecturas}`}, ordenado por {ordenLecturas === "numero_predio" ? "N° de Predio" : "ID"}.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Acciones Lecturas */}
              {lecturasData.length > 0 ? (
                <div className="flex flex-col gap-3">
                  
                  {/* Resumen de Tomas y Hojas (Mismo patrón que Recibos) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                        <HiDocumentText className="w-4 h-4 text-sky-500" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Tomas:</span>
                      </div>
                      <span className="text-base font-black font-mono text-slate-800 dark:text-zinc-100">
                        {totalTomas}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                        <HiPrinter className="w-4 h-4 text-emerald-500" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Hojas:</span>
                      </div>
                      <span className="text-base font-black font-mono text-slate-800 dark:text-zinc-100">
                        {hojasLecturasEstimadas}
                      </span>
                    </div>
                  </div>

                  {/* Botón Principal: Emitir Reporte */}
                  <Button
                    className="w-full h-12 font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-sm rounded-xl transition-all active:scale-98 text-sm flex items-center justify-center gap-2"
                    onPress={handleGenerarLecturas}
                    isLoading={accion === 'generar-lecturas'}
                    isDisabled={procesando || loadingLecturas}
                  >
                    {accion !== 'generar-lecturas' && <HiPrinter className="text-lg" />}
                    <span>{accion === 'generar-lecturas' ? 'Generando Reporte...' : 'Emitir Reporte de Lecturas'}</span>
                  </Button>

                  {/* Botón Pequeño de Prueba: 1 Página */}
                  <Button
                    size="sm"
                    variant="flat"
                    className="w-full h-9 font-bold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700 rounded-xl transition-all text-xs flex items-center justify-center gap-2"
                    onPress={handlePruebaLecturas}
                    isLoading={accion === 'prueba-lecturas'}
                    isDisabled={procesando || loadingLecturas}
                  >
                    {accion !== 'prueba-lecturas' && <HiEye className="w-4 h-4 text-slate-500 dark:text-zinc-400" />}
                    <span>{accion === 'prueba-lecturas' ? 'Generando prueba...' : 'Prueba de Impresión (1 Página)'}</span>
                  </Button>

                </div>
              ) : (
                <div className="border border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/20 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[200px]">
                  <div className="w-12 h-12 rounded-2xl bg-slate-500/10 text-slate-500 dark:text-slate-400 flex items-center justify-center mb-3">
                    <HiPrinter className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-black tracking-tight text-slate-800 dark:text-zinc-100 mb-1">
                    Sin datos para imprimir
                  </h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 max-w-[200px] text-center">
                    Selecciona un período válido en el listado para emitir el reporte.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-200 dark:bg-zinc-800 my-2 w-full" />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN 2: PADRÓN GENERAL DE CLIENTES                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0">
              <HiUsers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-0.5">
                Listado base para impresión institucional
              </h3>
              <p className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
                Padrón General de Clientes
              </p>
            </div>
          </div>

          {totalClientesPadron > 0 && (
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Padrón:</span>
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-200 font-mono">{totalClientesPadron} clientes</span>
              </div>
              <span className="text-slate-300 dark:text-zinc-700">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Estimado:</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">{hojasPadronEstimadas} hojas</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start bg-slate-50/60 dark:bg-zinc-900/40 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 ml-1">
              Ordenar por
            </label>
            <div className="relative">
              <select
                aria-label="Ordenar listado por:"
                value={ordenPadron}
                onChange={(e) => setOrdenPadron(e.target.value || "numero_predio")}
                className="w-full h-[52px] pl-4 pr-10 text-sm font-semibold rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
              >
                <option value="numero_predio">N° de Predio</option>
                <option value="nombre">Nombre (A-Z)</option>
              </select>
              <HiChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 ml-1">
              Agrupación
            </label>
            <div className="relative">
              <select
                aria-label="Agrupar registros por:"
                value={agrupacion}
                onChange={(e) => setAgrupacion(e.target.value || "ciudad")}
                className="w-full h-[52px] pl-4 pr-10 text-sm font-semibold rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
              >
                <option value="ciudad">Por Ciudad</option>
                <option value="tarifa">Por Tarifa</option>
                <option value="ninguna">Sin agrupar</option>
              </select>
              <HiChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 ml-1">
              Acciones de Emisión
            </label>
            <div className="flex flex-col gap-2">
              {/* Resumen de Clientes y Hojas */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
                    <HiUsers className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Clientes:</span>
                  </div>
                  <span className="text-sm font-black font-mono text-slate-800 dark:text-zinc-100">
                    {totalClientesPadron}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
                    <HiPrinter className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Hojas:</span>
                  </div>
                  <span className="text-sm font-black font-mono text-slate-800 dark:text-zinc-100">
                    {hojasPadronEstimadas}
                  </span>
                </div>
              </div>

              <Button
                className="w-full font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 shadow-sm h-12 transition-all active:scale-98 text-sm flex items-center justify-center gap-2"
                onPress={handleGenerarPadron}
                isLoading={accion === 'generar-padron'}
                isDisabled={procesando}
              >
                {accion !== 'generar-padron' && <HiPrinter className="text-lg" />}
                <span>{accion === 'generar-padron' ? 'Preparando...' : 'Emitir Padrón General'}</span>
              </Button>

              <Button
                size="sm"
                variant="flat"
                className="w-full h-8 font-bold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5"
                onPress={handlePruebaPadron}
                isLoading={accion === 'prueba-padron'}
                isDisabled={procesando}
              >
                {accion !== 'prueba-padron' && <HiEye className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />}
                <span>{accion === 'prueba-padron' ? 'Generando prueba...' : 'Prueba de Impresión (1 Página)'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-200 dark:bg-zinc-800 my-2 w-full" />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN 3: EXPORTAR DATOS                                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
            <HiDownload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-0.5">
              Descarga en Excel o CSV
            </h3>
            <p className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
              Exportación de Base de Datos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-50/60 dark:bg-zinc-900/40 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 ml-1">
              Conjunto de Datos
            </label>
            <div className="relative">
              <select
                aria-label="Conjunto de datos a exportar:"
                value={modoExport}
                onChange={(e) => setModoExport(e.target.value || "clientes")}
                className="w-full h-[52px] pl-4 pr-10 text-sm font-semibold rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
              >
                <option value="clientes">Solo Padrón de Clientes</option>
                <option value="medidores">Solo Equipos (Medidores)</option>
                <option value="combinado">Relación Clientes + Medidores</option>
                <option value="cobranza">Reporte de Cobranza por Cliente</option>
              </select>
              <HiChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 ml-1">
              Formato de Archivo
            </label>
            <div className="relative">
              <select
                aria-label="Formato de salida:"
                value={formatoExport}
                onChange={(e) => setFormatoExport(e.target.value || "xlsx")}
                className="w-full h-[52px] pl-4 pr-10 text-sm font-semibold rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
              >
                <option value="xlsx">Hoja de Cálculo Excel (.xlsx)</option>
                <option value="csv">Archivo de Texto (.csv)</option>
              </select>
              <HiChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <Button
            className="w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 shadow-sm h-[52px] transition-all"
            onPress={handleExportar}
            isLoading={accion === 'export'}
            isDisabled={procesando}
          >
            {accion !== 'export' && <HiDownload className="text-lg" />}
            {accion === 'export' ? 'Generando...' : 'Generar Archivo'}
          </Button>
        </div>

        {modoExport === "combinado" && (
          <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-xl p-4 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-200 w-full md:w-2/3 border border-emerald-500/20">
            <p className="text-[10px] font-bold uppercase tracking-widest">
              Nota de exportación
            </p>
            <p className="text-xs font-medium text-slate-700 dark:text-zinc-300 leading-relaxed">
              Al descargar la relación combinada, las columnas de los medidores llevarán el sufijo <code className="bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded mx-0.5 font-mono font-bold">_medidor</code> para distinguirlas fácilmente de los datos del cliente.
            </p>
          </div>
        )}
      </div>

      {/* MODALES DE IMPRESIÓN */}
      {pdfUrl && modoPdf && (
        <ModalImprimir
          pdfUrl={pdfUrl}
          printUrl={printUrl}
          onClose={() => { setPdfUrl(null); setPrintUrl(null); setModoPdf(null); }}
          initialMode={modoPdf === 'imprimir' ? 'print' : 'preview'}
        />
      )}
    </div>
  );
};

export default TabReportes;
