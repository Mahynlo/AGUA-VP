import React from "react";
import { Button, Card, CardBody, CardHeader } from "@nextui-org/react";
import { HiPrinter, HiCog, HiDocumentText, HiLink, HiDatabase, HiTemplate } from "react-icons/hi";
import { Link } from "react-router-dom";
import useImpresionRecibos from "../../../hooks/useImpresionRecibos";
import ClientesList from "./components/ClientesList";
import AccionesImpresion from "./components/AccionesImpresion";
import ModalImprimir from "./components/ModalImprimir";

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
    setPrintUrl,
    modoPdf,
    setModoPdf,
  } = useImpresionRecibos();

  const handleClosePdf = () => {
    setPdfUrl(null);
    setPrintUrl(null);
    setModoPdf(null);
  };

  return (
    /* Token 1: Contenedor Raíz (adaptado para el módulo layout) */
    <div className="w-full bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8 lg:p-10 print:shadow-none print:rounded-none print:bg-white print:border-none print:p-0 animate-in fade-in duration-300 flex flex-col gap-6">

      {/* HEADER DEL MÓDULO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-zinc-800/50 pb-6">
        <div className="flex items-center gap-4">
          {/* Regla de tintes */}
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
            <HiPrinter className="w-6 h-6" />
          </div>
          <div>
            {/* Token 3: Textos Principales */}
            <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
              Centro de Impresión de Recibos
            </h3>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
              Selección, vista previa y emisión masiva de facturas
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* COLUMNA IZQUIERDA: Selección de Datos */}
        <div className="xl:col-span-2 flex flex-col gap-6">

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
          {/* Token 4: Estilo de contenedor colapsable sutil */}
          <details className="group bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-none">
            <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 p-4 flex items-center gap-2 select-none hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-zinc-100/10">
              <HiCog className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-open:rotate-90 transition-transform duration-300" /> 
              Herramientas Avanzadas de Desarrollo
            </summary>
            <div className="p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 border-t border-slate-200 dark:border-zinc-800 mt-2">
              <Button 
                onPress={handleTestUrls} 
                size="sm" 
                variant="flat" 
                className="font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 shadow-sm"
                startContent={<HiLink className="w-4 h-4" />}
              >
                Test URLs
              </Button>
              <Button 
                onPress={handlePruebaConDatosMock} 
                size="sm" 
                variant="flat" 
                className="font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-transparent shadow-none"
                startContent={<HiDatabase className="w-4 h-4" />}
              >
                Datos Mock
              </Button>
              <Button 
                as={Link} 
                to="/recibo" 
                size="sm" 
                variant="flat" 
                className="font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 shadow-sm"
                startContent={<HiTemplate className="w-4 h-4" />}
              >
                Ver Plantilla
              </Button>
              <Button 
                as={Link} 
                to="/reporteLecturas" 
                size="sm" 
                variant="flat" 
                className="font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 shadow-sm"
                startContent={<HiDocumentText className="w-4 h-4" />}
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
              /* Empty State Premium SaaS */
              <div className="border border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[300px]">
                {/* Regla de tintes */}
                <div className="w-16 h-16 rounded-2xl bg-slate-500/10 text-slate-500 dark:text-slate-400 flex items-center justify-center mb-4">
                  <HiPrinter className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-black tracking-tight text-slate-800 dark:text-zinc-100 mb-1">
                  Sin facturas seleccionadas
                </h3>
                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 max-w-[200px]">
                  Selecciona uno o más clientes en la lista para habilitar las opciones de impresión.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* MODAL DE VISTA PREVIA */}
      {pdfUrl && modoPdf && (
        <ModalImprimir
          pdfUrl={pdfUrl}
          printUrl={printUrl}
          onClose={handleClosePdf}
          initialMode={modoPdf === 'imprimir' ? 'print' : 'preview'}
        />
      )}

    </div>
  );
};

export default TabImpresion;
