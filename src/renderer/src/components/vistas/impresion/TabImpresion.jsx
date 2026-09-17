import React from "react";
import { HiPrinter } from "react-icons/hi";
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
    ciudadFiltro,
    setCiudadFiltro,
    ordenCriterio,
    setOrdenCriterio,
    ciudadesDisponibles,
    progresoGeneracion,
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
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300 print:p-0">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

        {/* COLUMNA IZQUIERDA: Selección de Datos */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col gap-6">

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

          {/* Herramientas de desarrollo (Debug) comentadas para producción
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
              >
                <HiLink className="w-4 h-4" />
                Test URLs
              </Button>
              <Button 
                onPress={handlePruebaConDatosMock} 
                size="sm" 
                variant="flat" 
                className="font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-transparent shadow-none"
              >
                <HiDatabase className="w-4 h-4" />
                Datos Mock
              </Button>
              <Button 
                as={Link} 
                to="/recibo" 
                size="sm" 
                variant="flat" 
                className="font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 shadow-sm"
              >
                <HiTemplate className="w-4 h-4" />
                Ver Plantilla
              </Button>
              <Button 
                as={Link} 
                to="/reporteLecturas" 
                size="sm" 
                variant="flat" 
                className="font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 shadow-sm"
              >
                <HiDocumentText className="w-4 h-4" />
                Reporte
              </Button>
            </div>
          </details>
          */}
        </div>

        {/* COLUMNA DERECHA: Centro de Acción (Sticky) */}
        <div className="lg:col-span-5 xl:col-span-5">
          <div className="sticky top-6 space-y-4">
            
            {facturasParaImprimir.length > 0 ? (
              <AccionesImpresion
                estadisticas={estadisticas}
                onVistaPrevia={handleVistaPreviaRecibos}
                onImprimir={handleImprimirRecibos}
                procesandoAccion={procesandoAccion}
                progresoGeneracion={progresoGeneracion}
                ciudadFiltro={ciudadFiltro}
                setCiudadFiltro={setCiudadFiltro}
                ordenCriterio={ordenCriterio}
                setOrdenCriterio={setOrdenCriterio}
                ciudadesDisponibles={ciudadesDisponibles}
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
