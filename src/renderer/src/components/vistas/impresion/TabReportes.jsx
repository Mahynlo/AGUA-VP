import React, { useState } from "react";
import { Card, CardBody, CardHeader, Button, Select, SelectItem } from "@nextui-org/react";
import { HiPrinter, HiEye, HiUsers, HiSortAscending, HiLocationMarker, HiDownload, HiDocumentReport } from "react-icons/hi";
import ListadoLecturas from "./components/ListadoLecturas";
import ModalVistaPrevia from "./components/ModalVistaPrevia";
import { useReportes } from "../../../context/ReportesContext";
import { exportData } from "../../../utils/exportUtils";

const TabReportes = () => {
  // --- USO DE CONTEXTO ---
  /* eslint-disable no-unused-vars */
  const {
    lecturas,
    loading,
    cargarLecturas
  } = useReportes();

  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7));
  const [pdfUrl, setPdfUrl] = useState(null); // Estado para modal PDF

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
      if (window.api && window.api.previewComponent) {
        const response = await window.api.previewComponent(url);
        if (response && response.success && response.path) {
          setPdfUrl(response.path);
        }
      }
    } catch (err) {
      console.error("Error generating padron preview:", err);
      alert("Error al generar vista previa del padrón");
    }
  };

  const handlePrintPadron = async () => {
    const url = await getUrlPadron();
    if (!url) return;

    try {
      if (window.api && window.api.printComponent) {
        window.api.printComponent(url, (res) => console.log(res));
      }
    } catch (err) {
      console.error("Error printing padron:", err);
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
      if (window.api && window.api.previewComponent) {
        const response = await window.api.previewComponent(url);
        if (response && response.success && response.path) {
          setPdfUrl(response.path); 
        }
      }
    } catch (err) {
      console.error("Error generating preview:", err);
      alert("Error al generar vista previa");
    }
  };

  const handlePrintLecturas = async () => {
    if (lecturasData.length === 0) return;
    try {
      const url = await getUrlLecturas();
      if (window.api && window.api.printComponent) {
        window.api.printComponent(url, (res) => console.log(res));
      }
    } catch (err) {
      console.error("Error printing:", err);
    }
  };

  // Clases compartidas para los Selects
  const selectClassNames = {
    trigger: "bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 shadow-sm rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors",
    value: "font-medium text-slate-700 dark:text-zinc-200 text-sm"
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN 1: REPORTE DE LECTURAS (Tarjeta Maestra Azul)               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl">
              <HiDocumentReport className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                Reporte de Lecturas Mensual
              </h3>
              <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
                Gestión e impresión de tomas para cobro
              </p>
            </div>
          </div>
        </CardHeader>

        <CardBody className="p-6">
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
                
                {/* Info rápida (Ahora con fondo gris claro al estar dentro de la tarjeta blanca) */}
                <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700 p-5 grid grid-cols-2 gap-4 text-center divide-x divide-slate-200 dark:divide-zinc-700 shadow-inner">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Periodo</p>
                    <p className="font-black text-xl text-slate-800 dark:text-zinc-100">{periodo}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Total Tomas</p>
                    <p className="font-black text-xl text-blue-600 dark:text-blue-400">
                      {lecturasData.reduce((acc, g) => acc + (g.clientes ? g.clientes.length : 1), 0)}
                    </p>
                  </div>
                </div>

                {/* Opciones de impresión de Lecturas */}
                {lecturasData.length > 0 && (
                  <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700 p-5 space-y-4 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider border-b border-slate-200 dark:border-zinc-700 pb-2">Opciones de Impresión</p>

                    <Select
                      label="Ordenar registros por:"
                      size="sm"
                      variant="bordered"
                      selectedKeys={[ordenLecturas]}
                      onChange={(e) => setOrdenLecturas(e.target.value || "numero_predio")}
                      startContent={<HiSortAscending className="text-slate-400" />}
                      classNames={{...selectClassNames, trigger: "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 shadow-sm rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"}}
                    >
                      <SelectItem key="numero_predio" value="numero_predio">N° de Predio</SelectItem>
                      <SelectItem key="id" value="id">ID (Secuencial)</SelectItem>
                    </Select>

                    <Select
                      label="Filtrar ciudad:"
                      size="sm"
                      variant="bordered"
                      selectedKeys={[ciudadLecturas]}
                      onChange={(e) => setCiudadLecturas(e.target.value || "todas")}
                      startContent={<HiLocationMarker className="text-slate-400" />}
                      classNames={{...selectClassNames, trigger: "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 shadow-sm rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"}}
                    >
                      <SelectItem key="todas" value="todas">Todas las ciudades</SelectItem>
                      {ciudadesDisponibles.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </Select>

                    <div className="bg-blue-100/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-900/40 rounded-xl p-3 flex flex-col gap-1">
                      <p className="text-[10px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wider">
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
                    <Button
                      size="lg"
                      color="primary"
                      variant="flat"
                      className="w-full font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100"
                      onPress={handlePreviewLecturas}
                      isLoading={loadingLecturas}
                      isDisabled={loadingLecturas}
                      startContent={!loadingLecturas && <HiEye className="text-lg" />}
                    >
                      {loadingLecturas ? 'Generando...' : 'Vista Previa (PDF)'}
                    </Button>

                    <Button
                      size="lg"
                      color="primary"
                      className="w-full font-bold shadow-md shadow-blue-500/30"
                      onPress={handlePrintLecturas}
                      isLoading={loadingLecturas}
                      isDisabled={loadingLecturas}
                      startContent={!loadingLecturas && <HiPrinter className="text-lg" />}
                    >
                      Enviar a Impresora
                    </Button>
                  </div>
                ) : (
                  <div className="border-dashed border-2 border-slate-200 dark:border-zinc-800 rounded-2xl py-10 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-zinc-800 flex items-center justify-center mb-3">
                        <HiPrinter className="text-2xl text-slate-400 dark:text-zinc-500" />
                    </div>
                    <p className="text-sm font-bold text-slate-600 dark:text-zinc-400">Sin datos para imprimir</p>
                    <p className="text-xs text-slate-500 mt-1">Selecciona un mes válido.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </CardBody>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN 2: PADRÓN GENERAL DE CLIENTES (Tarjeta Maestra Índigo)    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-visible">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800/50">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-xl">
                    <HiUsers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                        Padrón General de Clientes
                    </h3>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
                        Listado base para impresión
                    </p>
                </div>
            </div>
        </CardHeader>
        <CardBody className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end bg-slate-50 dark:bg-zinc-800/30 p-5 rounded-xl border border-slate-100 dark:border-zinc-800">
            <Select
              label="Ordenar listado por:"
              size="sm"
              variant="bordered"
              selectedKeys={[ordenPadron]}
              onChange={(e) => setOrdenPadron(e.target.value || "numero_predio")}
              startContent={<HiSortAscending className="text-slate-400" />}
              classNames={{...selectClassNames, trigger: "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 shadow-sm rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"}}
            >
              <SelectItem key="numero_predio" value="numero_predio">N° de Predio</SelectItem>
              <SelectItem key="nombre" value="nombre">Nombre (A-Z)</SelectItem>
            </Select>

            <Select
              label="Agrupar registros por:"
              size="sm"
              variant="bordered"
              selectedKeys={[agrupacion]}
              onChange={(e) => setAgrupacion(e.target.value || "ciudad")}
              classNames={{...selectClassNames, trigger: "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 shadow-sm rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"}}
            >
              <SelectItem key="ciudad" value="ciudad">Por Ciudad</SelectItem>
              <SelectItem key="tarifa" value="tarifa">Por Tarifa</SelectItem>
              <SelectItem key="ninguna" value="ninguna">Sin agrupar</SelectItem>
            </Select>

            <Button
              size="lg"
              color="primary"
              variant="flat"
              className="font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 w-full"
              onPress={handlePreviewPadron}
              isLoading={loadingPadron}
              isDisabled={loadingPadron}
              startContent={!loadingPadron && <HiEye className="text-lg" />}
            >
              Vista Previa
            </Button>

            <Button
              size="lg"
              color="primary"
              className="font-bold shadow-md shadow-indigo-500/30 bg-indigo-600 hover:bg-indigo-700 text-white w-full"
              onPress={handlePrintPadron}
              isLoading={loadingPadron}
              isDisabled={loadingPadron}
              startContent={!loadingPadron && <HiPrinter className="text-lg" />}
            >
              Imprimir Padrón
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN 3: EXPORTAR DATOS (Tarjeta Maestra Esmeralda)             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-visible">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800/50">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl">
                    <HiDownload className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                        Exportación de Base de Datos
                    </h3>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
                        Descarga en Excel o CSV
                    </p>
                </div>
            </div>
        </CardHeader>
        <CardBody className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-50 dark:bg-zinc-800/30 p-5 rounded-xl border border-slate-100 dark:border-zinc-800">
            <Select
              label="Conjunto de datos a exportar:"
              size="sm"
              variant="bordered"
              selectedKeys={[modoExport]}
              onChange={(e) => setModoExport(e.target.value || "clientes")}
              classNames={{...selectClassNames, trigger: "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 shadow-sm rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"}}
            >
              <SelectItem key="clientes" value="clientes">Solo Padrón de Clientes</SelectItem>
              <SelectItem key="medidores" value="medidores">Solo Equipos (Medidores)</SelectItem>
              <SelectItem key="combinado" value="combinado">Relación Clientes + Medidores</SelectItem>
            </Select>

            <Select
              label="Formato de salida:"
              size="sm"
              variant="bordered"
              selectedKeys={[formatoExport]}
              onChange={(e) => setFormatoExport(e.target.value || "xlsx")}
              classNames={{...selectClassNames, trigger: "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 shadow-sm rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"}}
            >
              <SelectItem key="xlsx" value="xlsx">Hoja de Cálculo Excel (.xlsx)</SelectItem>
              <SelectItem key="csv" value="csv">Archivo de Texto (.csv)</SelectItem>
            </Select>

            <Button
              size="lg"
              color="success"
              className="font-bold shadow-md shadow-emerald-500/30 text-white w-full"
              onPress={handleExportar}
              isLoading={loadingExport}
              isDisabled={loadingExport}
              startContent={!loadingExport && <HiDownload className="text-lg" />}
            >
              Generar Archivo
            </Button>
          </div>

          {modoExport === "combinado" && (
            <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-xl p-4 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-200">
                <p className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-500/70 uppercase tracking-wider">
                    Nota de exportación
                </p>
                <p className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                    Al descargar la relación combinada, las columnas de los medidores llevarán el sufijo <code className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 px-1 rounded mx-0.5">_medidor</code> para distinguirlas fácilmente de los datos del cliente.
                </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* MODAL PDF */}
      {
        pdfUrl && (
          <ModalVistaPrevia
            pdfUrl={pdfUrl}
            onClose={() => setPdfUrl(null)}
          />
        )
      }
    </div>
  );
};

export default TabReportes;