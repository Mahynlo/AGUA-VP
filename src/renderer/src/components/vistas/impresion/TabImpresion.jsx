import React from "react";
import { Button, Card, CardBody, CardHeader } from "@nextui-org/react";
import { HiPrinter, HiCog, HiDocumentText, HiLink, HiDatabase, HiTemplate } from "react-icons/hi";
import { Link } from "react-router-dom";
import useImpresionRecibos from "../../../hooks/useImpresionRecibos";
import ClientesList from "./components/ClientesList";
import AccionesImpresion from "./components/AccionesImpresion";
import ModalVistaPrevia from "./components/ModalVistaPrevia";

/**
 * TabImpresion - Componente orquestador para impresión de recibos
 * * Este componente maneja la UI principal para:
 * - Selección de período de facturación
 * - Selección de clientes
 * - Generación de vista previa e impresión de recibos
 * * La lógica de negocio está delegada al hook useImpresionRecibos
 */
const TabImpresion = () => {
  // Hook personalizado con toda la lógica
  const {
    periodoSeleccionado,
    clientesSeleccionados,
    loading,
    clientesConFacturasYLecturas,
    facturasParaImprimir,
    estadisticas,
    handleCambioPeriodo,
    handleToggleCliente,
    handleToggleTodos,
    handleImprimirRecibos,
    handleVistaPreviaRecibos,
    handlePruebaConDatosMock,
    handleTestUrls,
    procesandoAccion,
    pdfUrl,
    setPdfUrl,
    printUrl,
    setPrintUrl
  } = useImpresionRecibos();

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">

      {/* HEADER DEL MÓDULO */}
      <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 pt-6 pb-5 border-b border-slate-100 dark:border-zinc-800/50">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl">
                    <HiPrinter className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                        Centro de Impresión de Recibos
                    </h3>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
                        Selección, vista previa y emisión de facturas
                    </p>
                </div>
            </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* COLUMNA IZQUIERDA: Selección de Datos */}
        <div className="xl:col-span-2 space-y-6">

          {/* Lista Unificada con Filtros */}
          <ClientesList
            clientes={clientesConFacturasYLecturas}
            clientesSeleccionados={clientesSeleccionados}
            onToggleCliente={handleToggleCliente}
            onToggleTodos={handleToggleTodos}
            periodoSeleccionado={periodoSeleccionado}
            onCambioPeriodo={handleCambioPeriodo}
            loading={loading}
          />

          {/* Herramientas de desarrollo (Debug) */}
          <details className="group bg-slate-50 dark:bg-zinc-800/30 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden transition-all duration-300">
            <summary className="cursor-pointer text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider p-4 flex items-center gap-2 select-none hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:bg-slate-100 dark:focus:bg-zinc-800">
              <HiCog className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-open:rotate-90 transition-transform duration-300" /> 
              Herramientas Avanzadas de Desarrollo
            </summary>
            <div className="p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 border-t border-slate-200 dark:border-zinc-800 mt-1">
              <Button 
                onPress={handleTestUrls} 
                size="sm" 
                variant="flat" 
                className="font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-sm text-slate-600 dark:text-zinc-300"
                startContent={<HiLink />}
              >
                Test URLs
              </Button>
              <Button 
                onPress={handlePruebaConDatosMock} 
                size="sm" 
                variant="flat" 
                color="warning" 
                className="font-bold shadow-sm"
                startContent={<HiDatabase />}
              >
                Datos Mock
              </Button>
              <Button 
                as={Link} 
                to="/recibo" 
                size="sm" 
                variant="flat" 
                className="font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-sm text-slate-600 dark:text-zinc-300"
                startContent={<HiTemplate />}
              >
                Ver Plantilla
              </Button>
              <Button 
                as={Link} 
                to="/reporteLecturas" 
                size="sm" 
                variant="flat" 
                className="font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-sm text-slate-600 dark:text-zinc-300"
                startContent={<HiDocumentText />}
              >
                Reporte
              </Button>
            </div>
          </details>
        </div>

        {/* COLUMNA DERECHA: Centro de Acción (Sticky) */}
        <div className="xl:col-span-1">
          <div className="sticky top-6 space-y-4">
            {facturasParaImprimir.length > 0 ? (
              <AccionesImpresion
                estadisticas={estadisticas}
                onVistaPrevia={handleVistaPreviaRecibos}
                onImprimir={handleImprimirRecibos}
                procesandoAccion={procesandoAccion}
              />
            ) : (
              <Card className="border-dashed border-2 border-slate-200 dark:border-zinc-800 bg-transparent shadow-none rounded-2xl">
                <CardBody className="text-center py-12 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-center mb-4">
                    <HiPrinter className="text-3xl text-slate-400 dark:text-zinc-500" />
                  </div>
                  <p className="text-sm font-bold text-slate-600 dark:text-zinc-300">
                    Sin facturas seleccionadas
                  </p>
                  <p className="text-xs font-medium text-slate-500 dark:text-zinc-500 mt-1 max-w-[200px]">
                    Selecciona uno o más clientes en la lista para habilitar las opciones de impresión.
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        </div>

      </div>

      {/* MODAL DE VISTA PREVIA / IMPRESIÓN */}
      {
        pdfUrl && (
          <ModalVistaPrevia
            pdfUrl={pdfUrl}
            printUrl={printUrl}
            onClose={() => { setPdfUrl(null); setPrintUrl(null); }}
          />
        )
      }

    </div>
  );
};

export default TabImpresion;