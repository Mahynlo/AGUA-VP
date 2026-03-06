import React, { useState } from "react";
import { Card, CardBody, Button, Select, SelectItem, Divider } from "@nextui-org/react";
import { HiPrinter, HiEye, HiUsers, HiSortAscending, HiLocationMarker, HiDownload } from "react-icons/hi";
import ListadoLecturas from "./components/ListadoLecturas";
import ModalVistaPrevia from "./components/ModalVistaPrevia"; // Importar Modal
import { useReportes } from "../../../context/ReportesContext";
import { exportData } from "../../../utils/exportUtils";

const TabReportes = () => {
  // --- USO DE CONTEXTO ---
  // Reemplazamos estados locales con la lógica centralizada del ReportesContext
  /* eslint-disable no-unused-vars */
  const {
    lecturas,
    loading,
    cargarLecturas
  } = useReportes();

  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7));
  const [pdfUrl, setPdfUrl] = useState(null); // Estado para modal PDF

  // --- LECTURAS: Opciones de impresión ---
  const [ordenLecturas, setOrdenLecturas] = useState("numero_predio"); // id | numero_predio
  const [ciudadLecturas, setCiudadLecturas] = useState("todas"); // todas | nombre de ciudad específica

  // --- PADRÓN GENERAL ---
  const [ordenPadron, setOrdenPadron] = useState("numero_predio"); // id | numero_predio
  const [agrupacion, setAgrupacion] = useState("ciudad"); // ciudad | ninguna
  const [loadingPadron, setLoadingPadron] = useState(false);

  // --- EXPORTAR DATOS ---
  const [modoExport, setModoExport] = useState("clientes");      // clientes | medidores | combinado
  const [formatoExport, setFormatoExport] = useState("xlsx");    // xlsx | csv
  const [loadingExport, setLoadingExport] = useState(false);

  // Efecto para cargar datos usando el contexto cuando cambia el periodo
  React.useEffect(() => {
    if (periodo) {
      const token = localStorage.getItem('token');
      cargarLecturas(token, periodo);
    }
  }, [periodo, cargarLecturas]);

  // Alias para mantener compatibilidad con el resto del código
  const lecturasData = lecturas || [];
  const loadingLecturas = loading; // Usamos el loading del contexto

  // Extraer ciudades disponibles de los datos agrupados
  const ciudadesDisponibles = React.useMemo(() => {
    if (!lecturasData || lecturasData.length === 0) return [];
    // Los datos vienen agrupados por localidad
    if (lecturasData[0]?.localidad) {
      return lecturasData.map(g => g.localidad).filter(Boolean).sort();
    }
    return [];
  }, [lecturasData]);

  const getUrlLecturas = async () => {
    // 1. Preparar datos — filtrar por ciudad si es necesario
    let dataToSend = lecturasData;
    if (ciudadLecturas !== "todas" && lecturasData[0]?.localidad) {
      dataToSend = lecturasData.filter(g => g.localidad === ciudadLecturas);
    }

    // 2. Guardar en IPC FileSystem (Robusto)
    const dataKey = await window.api.savePrintData(JSON.stringify(dataToSend));

    // 3. Generar URL Robusta con params de orden
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

      // Obtener TODOS los clientes (sin paginación)
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

      // Guardar datos via IPC (robusto para grandes volúmenes)
      const dataKey = await window.api.savePrintData(JSON.stringify(clientesData));

      // Construir URL con parámetros de configuración
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
  // Campos a EXCLUIR en cada modo
  const CLIENTES_EXCLUDE = ['id', 'tarifa_id', 'modificado_por'];
  const MEDIDORES_EXCLUDE = ['id', 'cliente_id', 'fecha_creacion'];
  // Campos de medidor que reciben sufijo "_medidor" en modo combinado para evitar colisiones
  const MEDIDOR_SUFFIX_FIELDS = ['numero_serie', 'marca', 'modelo', 'ubicacion', 'fecha_instalacion', 'estado_medidor', 'latitud', 'longitud'];

  /**
   * Construye un mapa { numero_serie → ruta_nombre } usando el endpoint de listar rutas,
   * que ya devuelve la lista de números de serie por ruta sin llamadas adicionales.
   */
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

      // ── SOLO CLIENTES ──────────────────────────────────
      if (modoExport === 'clientes') {
        const resp = await window.api.fetchClientes(token);
        const clientes = resp?.data || (Array.isArray(resp) ? resp : []);
        if (!clientes.length) { alert("No hay clientes para exportar"); return; }
        await exportData(clientes.map(limpiarCliente), `Clientes_${today}`, formatoExport);

      // ── SOLO MEDIDORES ─────────────────────────────────
      } else if (modoExport === 'medidores') {
        const resp = await window.api.fetchMedidores(token);
        const medidores = resp?.data || (Array.isArray(resp) ? resp : []);
        if (!medidores.length) { alert("No hay medidores para exportar"); return; }
        const rutaMap = await buildSerieRutaMap(token);
        await exportData(medidores.map(m => limpiarMedidor(m, rutaMap)), `Medidores_${today}`, formatoExport);

      // ── COMBINADO (Clientes + Medidores) ───────────────
      } else {
        const [clientesResp, medidoresResp] = await Promise.all([
          window.api.fetchClientes(token),
          window.api.fetchMedidores(token)
        ]);
        const clientes = clientesResp?.data || (Array.isArray(clientesResp) ? clientesResp : []);
        const medidores = medidoresResp?.data || (Array.isArray(medidoresResp) ? medidoresResp : []);
        if (!clientes.length) { alert("No hay clientes para exportar"); return; }

        const rutaMap = await buildSerieRutaMap(token);

        // Índice medidores por cliente_id
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
          // Sin medidor asignado — columnas vacías para alinear el CSV/XLSX
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

      // Llamada al previewComponent (ahora devuelve promesa con path)
      if (window.api && window.api.previewComponent) {
        const response = await window.api.previewComponent(url);
        if (response && response.success && response.path) {
          setPdfUrl(response.path); // Abrir Modal
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
        // Nota: printComponent usa el diálogo del sistema directo
        window.api.printComponent(url, (res) => console.log(res));
      }
    } catch (err) {
      console.error("Error printing:", err);
    }
  };

  return (
    <div className="space-y-6 p-2">

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN 1: REPORTE DE LECTURAS                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {/* Listado de Lecturas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COLUMNA IZQUIERDA: Listado (Read Only) */}
        <div className="lg:col-span-2 space-y-6">
          <ListadoLecturas
            lecturas={lecturasData}
            periodo={periodo}
            setPeriodo={setPeriodo}
            loading={loadingLecturas}
          />
        </div>

        {/* COLUMNA DERECHA: Panel de acciones */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">

            {/* Info rápida */}
            <Card className="shadow-sm border border-gray-200 dark:border-gray-700">
              <CardBody className="p-4 grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Periodo</p>
                  <p className="font-bold text-lg text-gray-800 dark:text-white">{periodo}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Tomas</p>
                  <p className="font-bold text-lg text-blue-600 dark:text-blue-400">
                    {lecturasData.reduce((acc, g) => acc + (g.clientes ? g.clientes.length : 1), 0)}
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Opciones de impresión de Lecturas */}
            {lecturasData.length > 0 && (
              <Card className="shadow-sm border border-gray-200 dark:border-gray-700">
                <CardBody className="p-4 space-y-3">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Opciones de Impresión</p>

                  <Select
                    label="Ordenar por"
                    size="sm"
                    selectedKeys={[ordenLecturas]}
                    onChange={(e) => setOrdenLecturas(e.target.value || "numero_predio")}
                    startContent={<HiSortAscending className="text-gray-400" />}
                  >
                    <SelectItem key="numero_predio" value="numero_predio">N° de Predio</SelectItem>
                    <SelectItem key="id" value="id">ID (numérico)</SelectItem>
                  </Select>

                  <Select
                    label="Ciudad a imprimir"
                    size="sm"
                    selectedKeys={[ciudadLecturas]}
                    onChange={(e) => setCiudadLecturas(e.target.value || "todas")}
                    startContent={<HiLocationMarker className="text-gray-400" />}
                  >
                    <SelectItem key="todas" value="todas">Todas las ciudades</SelectItem>
                    {ciudadesDisponibles.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </Select>

                  <p className="text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded p-2">
                    <span className="font-bold">Config:</span>{" "}
                    {ordenLecturas === "numero_predio" ? "N° Predio" : "ID"} • {ciudadLecturas === "todas" ? "Todas" : ciudadLecturas}
                  </p>
                </CardBody>
              </Card>
            )}

            {/* Acciones Lecturas */}
            {lecturasData.length > 0 ? (
              <Card className="shadow-sm border border-gray-200 dark:border-gray-700">
                <CardBody className="p-4 space-y-3">
                  <Button
                    size="md"
                    color="primary"
                    variant="flat"
                    className="w-full font-semibold"
                    onPress={handlePreviewLecturas}
                    isLoading={loadingLecturas}
                    isDisabled={loadingLecturas}
                    startContent={!loadingLecturas && <HiEye className="w-4 h-4" />}
                  >
                    {loadingLecturas ? 'Generando...' : 'Vista Previa'}
                  </Button>

                  <Button
                    size="md"
                    color="success"
                    variant="flat"
                    className="w-full font-semibold"
                    onPress={handlePrintLecturas}
                    isLoading={loadingLecturas}
                    isDisabled={loadingLecturas}
                    startContent={!loadingLecturas && <HiPrinter className="w-4 h-4" />}
                  >
                    Imprimir Lista
                  </Button>
                </CardBody>
              </Card>
            ) : (
              <Card className="border-dashed border-2 border-gray-300 dark:border-gray-700 bg-transparent">
                <CardBody className="text-center py-8 text-gray-400">
                  <HiPrinter className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Selecciona un periodo con datos</p>
                </CardBody>
              </Card>
            )}
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN 2: PADRÓN GENERAL DE CLIENTES                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Divider className="my-4" />

      <Card className="shadow-sm border border-gray-200 dark:border-gray-700">
        <CardBody className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
              <HiUsers className="text-indigo-600 dark:text-indigo-400 text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Padrón General de Clientes
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Listado completo de clientes con número de predio y tarifa
              </p>
            </div>
          </div>

          {/* Opciones y Acciones en una sola fila */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <Select
              label="Ordenar por"
              size="sm"
              selectedKeys={[ordenPadron]}
              onChange={(e) => setOrdenPadron(e.target.value || "numero_predio")}
              startContent={<HiSortAscending className="text-gray-400" />}
            >
              <SelectItem key="numero_predio" value="numero_predio">N° de Predio</SelectItem>
              <SelectItem key="nombre" value="nombre">Nombre (A-Z)</SelectItem>
            </Select>

            <Select
              label="Agrupación"
              size="sm"
              selectedKeys={[agrupacion]}
              onChange={(e) => setAgrupacion(e.target.value || "ciudad")}
            >
              <SelectItem key="ciudad" value="ciudad">Por Ciudad</SelectItem>
              <SelectItem key="tarifa" value="tarifa">Por Tarifa</SelectItem>
              <SelectItem key="ninguna" value="ninguna">Sin agrupar</SelectItem>
            </Select>

            <Button
              size="md"
              color="primary"
              variant="flat"
              className="font-semibold"
              onPress={handlePreviewPadron}
              isLoading={loadingPadron}
              isDisabled={loadingPadron}
              startContent={!loadingPadron && <HiEye className="w-4 h-4" />}
            >
              {loadingPadron ? 'Cargando...' : 'Vista Previa'}
            </Button>

            <Button
              size="md"
              color="success"
              variant="flat"
              className="font-semibold"
              onPress={handlePrintPadron}
              isLoading={loadingPadron}
              isDisabled={loadingPadron}
              startContent={!loadingPadron && <HiPrinter className="w-4 h-4" />}
            >
              Imprimir Padrón
            </Button>
          </div>

          {/* Config resumen */}
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-3 bg-gray-50 dark:bg-gray-800 rounded p-2">
            <span className="font-bold">Configuración:</span>{" "}
            {ordenPadron === "numero_predio" ? "N° de Predio" : "Nombre"} • {agrupacion === "ciudad" ? "Por ciudad" : agrupacion === "tarifa" ? "Por tarifa" : "Sin agrupar"}
          </p>
        </CardBody>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN 3: EXPORTAR DATOS                                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Divider className="my-4" />

      <Card className="shadow-sm border border-gray-200 dark:border-gray-700">
        <CardBody className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
              <HiDownload className="text-emerald-600 dark:text-emerald-400 text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Exportar Datos
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Descarga clientes, medidores o la relación combinada en Excel o CSV
              </p>
            </div>
          </div>

          {/* Opciones y Acción en una sola fila */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <Select
              label="Datos a exportar"
              size="sm"
              selectedKeys={[modoExport]}
              onChange={(e) => setModoExport(e.target.value || "clientes")}
            >
              <SelectItem key="clientes" value="clientes">Solo Clientes</SelectItem>
              <SelectItem key="medidores" value="medidores">Solo Medidores</SelectItem>
              <SelectItem key="combinado" value="combinado">Clientes + Medidores</SelectItem>
            </Select>

            <Select
              label="Formato"
              size="sm"
              selectedKeys={[formatoExport]}
              onChange={(e) => setFormatoExport(e.target.value || "xlsx")}
            >
              <SelectItem key="xlsx" value="xlsx">Excel (.xlsx)</SelectItem>
              <SelectItem key="csv" value="csv">CSV (.csv)</SelectItem>
            </Select>

            <Button
              size="md"
              color="success"
              variant="flat"
              className="font-semibold"
              onPress={handleExportar}
              isLoading={loadingExport}
              isDisabled={loadingExport}
              startContent={!loadingExport && <HiDownload className="w-4 h-4" />}
            >
              {loadingExport ? 'Exportando...' : 'Exportar'}
            </Button>
          </div>

          {/* Descripción de campos */}
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-3 bg-gray-50 dark:bg-gray-800 rounded p-2">
            <span className="font-bold">Nota:</span>{" "}
            Los IDs internos son excluidos automáticamente.{" "}
            {modoExport === "combinado" && (
              <>Los campos del medidor llevan sufijo <em>_medidor</em> (p.&nbsp;ej. <em>numero_serie_medidor</em>, <em>fecha_instalacion_medidor</em>).{" "}</>
            )}
            Incluye campo <em>ruta</em> si el medidor está asignado a una ruta.
          </p>
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