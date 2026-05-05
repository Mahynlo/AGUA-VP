import React, { useState } from "react";
import { Button, Select, SelectItem, Divider } from "@nextui-org/react";
import { HiPrinter, HiEye, HiUsers, HiSortAscending, HiLocationMarker, HiDownload, HiDocumentReport } from "react-icons/hi";
import ListadoLecturas from "./components/ListadoLecturas";
import ModalVistaPrevia from "./components/ModalVistaPrevia";
import ModalImprimir from "./components/ModalImprimir";
import { useReportes } from "../../../context/ReportesContext";
import { exportData } from "../../../utils/exportUtils";
import { obtenerPeriodoActual } from "../../../utils/periodoUtils";

const TabReportes = () => {
  // --- USO DE CONTEXTO ---
  /* eslint-disable no-unused-vars */
  const {
    lecturas,
    loading,
    cargarLecturas
  } = useReportes();

  const [periodo, setPeriodo] = useState(obtenerPeriodoActual());
  const [pdfUrl, setPdfUrl] = useState(null);
  const [printUrl, setPrintUrl] = useState(null);
  const [modoPdf, setModoPdf] = useState(null);   // 'vista-previa' | 'imprimir' | null
  const [loadingImprimir, setLoadingImprimir] = useState(false);

  // --- LECTURAS: Opciones de impresión ---
  const [ordenLecturas, setOrdenLecturas] = useState("numero_predio"); 
  const [ciudadLecturas, setCiudadLecturas] = useState("todas"); 

  // --- PADRÓN GENERAL ---
  const [ordenPadron, setOrdenPadron] = useState("numero_predio"); 
  const [agrupacion, setAgrupacion] = useState("ciudad"); 
  const [loadingPadron, setLoadingPadron] = useState(false);

  // --- EXPORTAR DATOS ---
  const [modoExport, setModoExport] = useState("clientes"); 
  const [formatoExport, setFormatoExport] = useState("xlsx"); 
  const [loadingExport, setLoadingExport] = useState(false);

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

  const getUrlLecturas = async () => {
    let dataToSend = lecturasData;
    if (ciudadLecturas !== "todas" && lecturasData[0]?.localidad) {
      dataToSend = lecturasData.filter(g => g.localidad === ciudadLecturas);
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
  const getUrlPadron = async () => {
    setLoadingPadron(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("No hay token de sesión");

      const response = await window.api.fetchClientes(token);
      let clientesData = [];

      if (response && response.data) {
        clientesData = response.data;
      } else if (Array.isArray(response)) {
        clientesData = response;
      }

      if (clientesData.length === 0) {
        alert("No hay clientes registrados para generar el padrón");
        return null;
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
    } finally {
      setLoadingPadron(false);
    }
  };

  const handlePreviewPadron = async () => {
    const url = await getUrlPadron();
    if (!url) return;
    try {
      const response = await window.api.previewComponent(url);
      if (response && response.success && response.path) {
        setPrintUrl(url);
        setPdfUrl(response.path);
        setModoPdf('vista-previa');
      }
    } catch (err) {
      console.error("Error generating padron preview:", err);
      alert("Error al generar vista previa del padrón");
    }
  };

  const handlePrintPadron = async () => {
    const url = await getUrlPadron();
    if (!url) return;
    setLoadingImprimir(true);
    try {
      const response = await window.api.previewComponent(url);
      if (response && response.success && response.path) {
        setPrintUrl(url);
        setPdfUrl(response.path);
        setModoPdf('imprimir');
      }
    } catch (err) {
      console.error("Error preparing padron print:", err);
      alert("Error al preparar la impresión del padrón");
    } finally {
      setLoadingImprimir(false);
    }
  };

  // ─── EXPORTAR DATOS ──────────────────────────────────────────────────────────
  const CLIENTES_EXCLUDE = ['id', 'tarifa_id', 'modificado_por'];
  const MEDIDORES_EXCLUDE = ['id', 'cliente_id', 'fecha_creacion'];
  const MEDIDOR_SUFFIX_FIELDS = ['numero_serie', 'marca', 'modelo', 'ubicacion', 'fecha_instalacion', 'estado_medidor', 'latitud', 'longitud'];

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
    setLoadingExport(true);
    try {
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];

      const limpiarCliente = (c) => {
        const row = {};
        Object.keys(c).forEach(k => { if (!CLIENTES_EXCLUDE.includes(k)) row[k] = c[k]; });
        return row;
      };

      const limpiarMedidor = (m, rutaMap) => {
        const row = {};
        Object.keys(m).forEach(k => {
          if (!MEDIDORES_EXCLUDE.includes(k)) row[k] = m[k];
        });
        row['ruta'] = rutaMap[m.numero_serie] || '';
        return row;
      };

      const limpiarMedidorConSufijo = (m) => {
        const row = {};
        Object.keys(m).forEach(k => {
          if (MEDIDORES_EXCLUDE.includes(k)) return;
          const newKey = MEDIDOR_SUFFIX_FIELDS.includes(k) ? `${k}_medidor` : k;
          row[newKey] = m[k];
        });
        return row;
      };

      if (modoExport === 'clientes') {
        const resp = await window.api.fetchClientes(token);
        const clientes = resp?.data || (Array.isArray(resp) ? resp : []);
        if (!clientes.length) { alert("No hay clientes para exportar"); return; }
        await exportData(clientes.map(limpiarCliente), `Clientes_${today}`, formatoExport);

      } else if (modoExport === 'medidores') {
        const resp = await window.api.fetchMedidores(token);
        const medidores = resp?.data || (Array.isArray(resp) ? resp : []);
        if (!medidores.length) { alert("No hay medidores para exportar"); return; }
        const rutaMap = await buildSerieRutaMap(token);
        await exportData(medidores.map(m => limpiarMedidor(m, rutaMap)), `Medidores_${today}`, formatoExport);

      } else {
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

        const rows = clientes.map(c => {
          const clienteRow = limpiarCliente(c);
          const m = medidorByClienteId[c.id];
          if (m) {
            const medidorRow = limpiarMedidorConSufijo(m);
            medidorRow['ruta'] = rutaMap[m.numero_serie] || '';
            return { ...clienteRow, ...medidorRow };
          }
          const emptyMedidor = {};
          MEDIDOR_SUFFIX_FIELDS.forEach(k => { emptyMedidor[`${k}_medidor`] = ''; });
          emptyMedidor['ruta'] = '';
          return { ...clienteRow, ...emptyMedidor };
        });

        await exportData(rows, `Clientes_Medidores_${today}`, formatoExport);
      }
    } catch (err) {
      console.error("Error al exportar datos:", err);
      alert("Error al exportar datos. Revisa la consola para más detalles.");
    } finally {
      setLoadingExport(false);
    }
  };

  const handlePreviewLecturas = async () => {
    if (lecturasData.length === 0) return;
    try {
      const url = await getUrlLecturas();
      const response = await window.api.previewComponent(url);
      if (response && response.success && response.path) {
        setPrintUrl(url);
        setPdfUrl(response.path);
        setModoPdf('vista-previa');
      }
    } catch (err) {
      console.error("Error generating preview:", err);
      alert("Error al generar vista previa");
    }
  };

  const handlePrintLecturas = async () => {
    if (lecturasData.length === 0) return;
    setLoadingImprimir(true);
    try {
      const url = await getUrlLecturas();
      const response = await window.api.previewComponent(url);
      if (response && response.success && response.path) {
        setPrintUrl(url);
        setPdfUrl(response.path);
        setModoPdf('imprimir');
      }
    } catch (err) {
      console.error("Error preparing print:", err);
      alert("Error al preparar la impresión");
    } finally {
      setLoadingImprimir(false);
    }
  };

  // Clases compartidas para los Selects (Token 4)
  const selectClassNames = {
    trigger: "bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-zinc-100/10 focus:outline-none focus:border-slate-400 dark:focus:border-zinc-500 transition-all duration-200 shadow-none h-[52px]",
    value: "font-medium text-slate-700 dark:text-zinc-200 text-sm"
  };

  return (
    /* Token 1: Contenedor Raíz */
    <div className="w-full bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8 lg:p-10 print:shadow-none print:rounded-none print:bg-white print:border-none print:p-0 animate-in fade-in duration-300 flex flex-col gap-10">

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HEADER DE LA VISTA COMPLETA                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-2">
        {/* Token 3: Textos Principales */}
        <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
          Centro de Reportes
        </h2>
        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
          Generación de documentos, padrones y extracción de base de datos
        </p>
      </div>

      <Divider className="bg-slate-100 dark:bg-zinc-800/80" />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN 1: REPORTE DE LECTURAS                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          {/* Regla de tintes */}
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
            <HiDocumentReport className="w-6 h-6" />
          </div>
          <div>
            {/* Token 3: Overline */}
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-0.5">
              Gestión e impresión de tomas para cobro
            </h3>
            <p className="text-lg font-black tracking-tight text-slate-800 dark:text-zinc-100">
              Reporte de Lecturas Mensual
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* COLUMNA IZQUIERDA: Listado */}
          <div className="xl:col-span-2">
            <ListadoLecturas
              lecturas={lecturasData}
              periodo={periodo}
              setPeriodo={setPeriodo}
              loading={loadingLecturas}
            />
          </div>

          {/* COLUMNA DERECHA: Panel de acciones */}
          <div className="xl:col-span-1">
            <div className="sticky top-4 space-y-4">
              
              {/* Token 5: Tarjeta KPI */}
              <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-200 grid grid-cols-2 gap-4 text-center divide-x divide-slate-200 dark:divide-zinc-700">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Periodo</p>
                  <p className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100">{periodo}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">Total Tomas</p>
                  <p className="text-xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
                    {lecturasData.reduce((acc, g) => acc + (g.clientes ? g.clientes.length : 1), 0)}
                  </p>
                </div>
              </div>

              {/* Opciones de impresión de Lecturas */}
              {lecturasData.length > 0 && (
                <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 border-b border-slate-200 dark:border-zinc-800 pb-3">Opciones de Impresión</p>

                  <div className="space-y-4 pt-2">
                    <Select
                      aria-label="Ordenar registros por:"
                      placeholder="Ordenar registros por:"
                      selectedKeys={[ordenLecturas]}
                      onChange={(e) => setOrdenLecturas(e.target.value || "numero_predio")}
                      startContent={<HiSortAscending className="text-slate-400" />}
                      classNames={selectClassNames}
                    >
                      <SelectItem key="numero_predio" value="numero_predio">N° de Predio</SelectItem>
                      <SelectItem key="id" value="id">ID (Secuencial)</SelectItem>
                    </Select>

                    <Select
                      aria-label="Filtrar ciudad:"
                      placeholder="Filtrar ciudad:"
                      selectedKeys={[ciudadLecturas]}
                      onChange={(e) => setCiudadLecturas(e.target.value || "todas")}
                      startContent={<HiLocationMarker className="text-slate-400" />}
                      classNames={selectClassNames}
                    >
                      <SelectItem key="todas" value="todas">Todas las ciudades</SelectItem>
                      {ciudadesDisponibles.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </Select>
                  </div>

                  <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl p-4 flex flex-col gap-1 mt-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest">
                      Resumen
                    </p>
                    <p className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                        Se imprimirá {ciudadLecturas === "todas" ? "todo el padrón" : `solo ${ciudadLecturas}`}, ordenado por {ordenLecturas === "numero_predio" ? "N° de Predio" : "ID"}.
                    </p>
                  </div>
                </div>
              )}

              {/* Acciones Lecturas */}
              {lecturasData.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {/* Token 4: Botón Secundario (Flat) */}
                  <Button
                    className="w-full font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 h-[52px] rounded-xl shadow-none"
                    onPress={handlePreviewLecturas}
                    isLoading={loadingLecturas}
                    isDisabled={loadingLecturas}
                    startContent={!loadingLecturas && <HiEye className="text-lg" />}
                  >
                    {loadingLecturas ? 'Generando...' : 'Vista Previa (PDF)'}
                  </Button>

                  {/* Token 4: Botón Primario */}
                  <Button
                    className="w-full font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-8 shadow-sm h-[52px]"
                    onPress={handlePrintLecturas}
                    isLoading={loadingImprimir}
                    isDisabled={loadingLecturas || loadingImprimir}
                    startContent={!loadingImprimir && <HiPrinter className="text-lg" />}
                  >
                    {loadingImprimir ? 'Preparando...' : 'Imprimir'}
                  </Button>
                </div>
              ) : (
                <div className="border border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/20 rounded-2xl p-10 flex flex-col items-center justify-center min-h-[250px]">
                  <div className="w-16 h-16 rounded-2xl bg-slate-500/10 text-slate-500 dark:text-slate-400 flex items-center justify-center mb-4">
                      <HiPrinter className="w-8 h-8" />
                  </div>
                  <h3 className="text-sm font-black tracking-tight text-slate-800 dark:text-zinc-100 mb-1">
                    Sin datos para imprimir
                  </h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 max-w-[200px] text-center">
                    Selecciona un mes válido en el listado.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Divider className="bg-slate-100 dark:bg-zinc-800/80 my-4" />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN 2: PADRÓN GENERAL DE CLIENTES                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0">
            <HiUsers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-0.5">
              Listado base para impresión
            </h3>
            <p className="text-lg font-black tracking-tight text-slate-800 dark:text-zinc-100">
              Padrón General de Clientes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end bg-slate-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800">
          <Select
            aria-label="Ordenar listado por:"
            placeholder="Ordenar listado por:"
            selectedKeys={[ordenPadron]}
            onChange={(e) => setOrdenPadron(e.target.value || "numero_predio")}
            startContent={<HiSortAscending className="text-slate-400" />}
            classNames={selectClassNames}
          >
            <SelectItem key="numero_predio" value="numero_predio">N° de Predio</SelectItem>
            <SelectItem key="nombre" value="nombre">Nombre (A-Z)</SelectItem>
          </Select>

          <Select
            aria-label="Agrupar registros por:"
            placeholder="Agrupar registros por:"
            selectedKeys={[agrupacion]}
            onChange={(e) => setAgrupacion(e.target.value || "ciudad")}
            classNames={selectClassNames}
          >
            <SelectItem key="ciudad" value="ciudad">Por Ciudad</SelectItem>
            <SelectItem key="tarifa" value="tarifa">Por Tarifa</SelectItem>
            <SelectItem key="ninguna" value="ninguna">Sin agrupar</SelectItem>
          </Select>

          <Button
            className="w-full font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 h-[52px] rounded-xl shadow-none"
            onPress={handlePreviewPadron}
            isLoading={loadingPadron}
            isDisabled={loadingPadron}
            startContent={!loadingPadron && <HiEye className="text-lg" />}
          >
            Vista Previa
          </Button>

          <Button
            className="w-full font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-8 shadow-sm h-[52px]"
            onPress={handlePrintPadron}
            isLoading={loadingPadron || loadingImprimir}
            isDisabled={loadingPadron || loadingImprimir}
            startContent={!(loadingPadron || loadingImprimir) && <HiPrinter className="text-lg" />}
          >
            {loadingImprimir ? 'Preparando...' : 'Imprimir Padrón'}
          </Button>
        </div>
      </div>

      <Divider className="bg-slate-100 dark:bg-zinc-800/80 my-4" />

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
            <p className="text-lg font-black tracking-tight text-slate-800 dark:text-zinc-100">
              Exportación de Base de Datos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800">
          <Select
            aria-label="Conjunto de datos a exportar:"
            placeholder="Conjunto de datos a exportar:"
            selectedKeys={[modoExport]}
            onChange={(e) => setModoExport(e.target.value || "clientes")}
            classNames={selectClassNames}
          >
            <SelectItem key="clientes" value="clientes">Solo Padrón de Clientes</SelectItem>
            <SelectItem key="medidores" value="medidores">Solo Equipos (Medidores)</SelectItem>
            <SelectItem key="combinado" value="combinado">Relación Clientes + Medidores</SelectItem>
          </Select>

          <Select
            aria-label="Formato de salida:"
            placeholder="Formato de salida:"
            selectedKeys={[formatoExport]}
            onChange={(e) => setFormatoExport(e.target.value || "xlsx")}
            classNames={selectClassNames}
          >
            <SelectItem key="xlsx" value="xlsx">Hoja de Cálculo Excel (.xlsx)</SelectItem>
            <SelectItem key="csv" value="csv">Archivo de Texto (.csv)</SelectItem>
          </Select>

          <Button
            className="w-full font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl px-8 shadow-sm h-[52px]"
            onPress={handleExportar}
            isLoading={loadingExport}
            isDisabled={loadingExport}
            startContent={!loadingExport && <HiDownload className="text-lg" />}
          >
            Generar Archivo
          </Button>
        </div>

        {modoExport === "combinado" && (
          <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl p-4 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-200 w-full md:w-2/3">
            <p className="text-[10px] font-bold uppercase tracking-widest">
                Nota de exportación
            </p>
            <p className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                Al descargar la relación combinada, las columnas de los medidores llevarán el sufijo <code className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1 rounded mx-0.5 font-mono">_medidor</code> para distinguirlas fácilmente de los datos del cliente.
            </p>
          </div>
        )}
      </div>

      {/* MODALES DE IMPRESIÓN */}
      {pdfUrl && modoPdf === 'vista-previa' && (
        <ModalVistaPrevia
          pdfUrl={pdfUrl}
          printUrl={printUrl}
          onClose={() => { setPdfUrl(null); setPrintUrl(null); setModoPdf(null); }}
          onImprimir={() => setModoPdf('imprimir')}
        />
      )}

      {pdfUrl && modoPdf === 'imprimir' && (
        <ModalImprimir
          pdfUrl={pdfUrl}
          printUrl={printUrl}
          onClose={() => { setPdfUrl(null); setPrintUrl(null); setModoPdf(null); }}
          onVolver={() => setModoPdf('vista-previa')}
        />
      )}
    </div>
  );
};

export default TabReportes;
