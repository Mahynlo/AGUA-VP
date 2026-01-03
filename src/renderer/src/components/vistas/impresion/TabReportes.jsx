import React, { useState } from "react";
import { Card, CardBody, Button } from "@nextui-org/react";
import { HiPrinter, HiEye } from "react-icons/hi";
import ListadoLecturas from "./components/ListadoLecturas";
import ModalVistaPrevia from "./components/ModalVistaPrevia"; // Importar Modal
import { useReportes } from "../../../context/ReportesContext";

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

  const getUrlLecturas = async () => {
    // 1. Preparar datos
    let dataToSend = lecturasData;

    // 2. Guardar en IPC FileSystem (Robusto)
    const dataKey = await window.api.savePrintData(JSON.stringify(dataToSend));

    // 3. Generar URL Robusta (Misma lógica que Recibos)
    const { protocol, origin, href } = window.location;
    if (protocol === 'file:') {
      const base = href.split('#')[0];
      return `${base}#/reporteLecturas?mes=${periodo}&dataKey=${dataKey}&print=true`;
    }
    return `${origin}/#/reporteLecturas?mes=${periodo}&dataKey=${dataKey}&print=true`;
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

      {/* Contenido Principal (Layout 3 Columnas) */}
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

        {/* COLUMNA DERECHA: Centro de Acción (Sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">

            {/* 1. Estadísticas Rápidas (Estilo Purple/Dark como en Recibos) */}
            <Card className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg border border-slate-700">
              <CardBody className="p-4 grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Periodo</p>
                  <p className="font-bold text-lg">{periodo}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Tomas</p>
                  <p className="font-bold text-lg text-emerald-400">
                    {lecturasData.reduce((acc, g) => acc + (g.clientes ? g.clientes.length : 1), 0)}
                  </p>
                </div>
              </CardBody>
            </Card>

            {lecturasData.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {/* 2. Tarjeta Vista Previa (Azul) */}
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border-2 border-blue-200 dark:border-blue-800 shadow-md">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-600 rounded-lg shadow-md">
                        <HiEye className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="text-md font-bold text-gray-900 dark:text-white">Vista Previa</h4>
                    </div>

                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-4 px-1">
                      <span>Registros a generar:</span>
                      <span className="font-bold text-blue-600">
                        {lecturasData.reduce((acc, g) => acc + (g.clientes ? g.clientes.length : 1), 0)}
                      </span>
                    </div>

                    <Button
                      size="md"
                      color="primary"
                      variant="shadow"
                      className="w-full font-bold bg-gradient-to-r from-blue-600 to-cyan-600"
                      onPress={handlePreviewLecturas}
                      isLoading={loadingLecturas}
                      isDisabled={loadingLecturas}
                    >
                      <div className="flex items-center gap-2">
                        {/* Icono condicional si no esta cargando */}
                        {!loadingLecturas && <HiEye className="w-4 h-4" />}
                        <span>{loadingLecturas ? 'Generando...' : 'Vista Previa'}</span>
                      </div>
                    </Button>
                  </CardBody>
                </Card>

                {/* 3. Tarjeta Imprimir (Verde) */}
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-2 border-green-200 dark:border-green-800 shadow-md">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-green-600 rounded-lg shadow-md">
                        <HiPrinter className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="text-md font-bold text-gray-900 dark:text-white">Imprimir</h4>
                    </div>

                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-4 px-1">
                      <span>Hojas estimadas:</span>
                      <span className="font-bold text-green-600">
                        {/* Calculo aproximado: 25 items por pagina + 1 header por grupo */}
                        {Math.ceil(lecturasData.reduce((acc, g) => acc + (g.clientes ? g.clientes.length : 1), 0) / 25) + (lecturasData[0]?.localidad ? lecturasData.length : 0)}
                      </span>
                    </div>

                    <Button
                      size="md"
                      color="success"
                      variant="shadow"
                      className="w-full font-bold bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                      onPress={handlePrintLecturas}
                      isLoading={loadingLecturas}
                      isDisabled={loadingLecturas}
                    >
                      <div className="flex items-center gap-2">
                        {!loadingLecturas && <HiPrinter className="w-4 h-4" />}
                        <span>Imprimir Lista</span>
                      </div>
                    </Button>
                  </CardBody>
                </Card>
              </div>
            ) : (
              <Card className="border-dashed border-2 border-gray-300 dark:border-gray-700 bg-transparent">
                <CardBody className="text-center py-8 text-gray-400">
                  <HiPrinter className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Selecciona un periodo con datos para habilitar acciones</p>
                </CardBody>
              </Card>
            )}
          </div>
        </div>

      </div>


      {/* MODAL PDF */}
      {
        pdfUrl && (
          <ModalVistaPrevia
            pdfUrl={pdfUrl}
            onClose={() => setPdfUrl(null)}
          />
        )
      }
    </div >
  );
};

export default TabReportes;