import React from "react";
import { Card, CardBody, Button } from "@nextui-org/react";
import { HiPrinter, HiEye, HiDocumentText } from "react-icons/hi";
import EstadisticasImpresion from "./EstadisticasImpresion";

/**
 * Componente para acciones de impresión (vista previa e imprimir)
 */
const AccionesImpresion = ({
  estadisticas,
  onVistaPrevia,
  onImprimir,
  procesandoAccion
}) => {
  const isAnyProcessing = procesandoAccion !== null;

  return (
    <div className="space-y-5">
      {/* ── 1. Estadísticas Rápidas ── */}
      <EstadisticasImpresion estadisticas={estadisticas} />

      {/* ── 2. Acciones de Impresión ── */}
      <div className="flex flex-col gap-4">
        
        {/* TARJETA 1: Vista Previa */}
        <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700">
          <CardBody className="p-5 flex flex-col gap-4">

            {/* Header de la tarjeta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
                  <HiEye className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                    Vista Previa
                  </h4>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mt-0.5">
                    Revisar Documento
                  </p>
                </div>
              </div>
            </div>

            {/* Info rápida */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
                <HiDocumentText className="w-4 h-4 opacity-70" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Recibos a generar:</span>
              </div>
              <span className="text-sm font-black text-slate-800 dark:text-zinc-100">
                {estadisticas?.cantidadRecibos || 0}
              </span>
            </div>

            {/* Botón de Acción */}
            <Button
              color="primary"
              className="w-full h-11 font-bold shadow-sm"
              onPress={onVistaPrevia}
              startContent={procesandoAccion !== 'vista-previa' && <HiEye className="text-lg" />}
              isLoading={procesandoAccion === 'vista-previa'}
              isDisabled={isAnyProcessing}
            >
              {procesandoAccion === 'vista-previa' ? 'Generando PDF...' : 'Abrir Vista Previa'}
            </Button>
          </CardBody>
        </Card>

        {/* TARJETA 2: Imprimir Directamente */}
        <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700">
          <CardBody className="p-5 flex flex-col gap-4">

            {/* Header de la tarjeta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <HiPrinter className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                    Imprimir Lote
                  </h4>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mt-0.5">
                    Enviar a cola de impresión
                  </p>
                </div>
              </div>
            </div>

            {/* Info rápida */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
                <HiDocumentText className="w-4 h-4 opacity-70" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Hojas estimadas:</span>
              </div>
              <span className="text-sm font-black text-slate-800 dark:text-zinc-100">
                {estadisticas?.paginasEstimadas || 0}
              </span>
            </div>

            {/* Botón de Acción */}
            <Button
              color="success"
              className="w-full h-11 font-bold text-white shadow-sm"
              onPress={onImprimir}
              startContent={procesandoAccion !== 'imprimir' && <HiPrinter className="text-lg" />}
              isLoading={procesandoAccion === 'imprimir'}
              isDisabled={isAnyProcessing}
            >
              {procesandoAccion === 'imprimir' ? 'Enviando a impresora...' : 'Imprimir Directamente'}
            </Button>
          </CardBody>
        </Card>

      </div>
    </div>
  );
};

export default AccionesImpresion;