import React from "react";
import { Card, CardHeader, CardBody, Button } from "@nextui-org/react";
import { HiPrinter, HiEye, HiDocumentText, HiCog } from "react-icons/hi";
import EstadisticasImpresion from "./EstadisticasImpresion";

/**
 * Componente para acciones de impresión (vista previa e imprimir)
 */
const AccionesImpresion = ({
  estadisticas,
  onVistaPrevia,
  onImprimir,
  procesandoAccion,
  progresoGeneracion,
  ciudadFiltro,
  setCiudadFiltro,
  ordenCriterio,
  setOrdenCriterio,
  ciudadesDisponibles
}) => {
  const isAnyProcessing = procesandoAccion !== null;

  return (
    <div className="space-y-5">
      {/* ── 1. Estadísticas Rápidas ── */}
      <EstadisticasImpresion estadisticas={estadisticas} />

      {/* ── 2. Acciones de Impresión ── */}
      <div className="flex flex-col gap-4">
        
        {/* ── Opciones de Impresión (Arriba) ── */}
        <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700">
          <CardHeader className="pt-5 px-5 pb-3 border-b border-slate-100 dark:border-zinc-800/50">
            <div className="flex items-center gap-2">
              <HiCog className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                Opciones de Impresión
              </h4>
            </div>
          </CardHeader>
          <CardBody className="p-5 flex flex-col gap-4">
            {/* Filtro de Ciudad */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Filtrar por Ciudad
              </label>
              <select
                value={ciudadFiltro}
                onChange={(e) => setCiudadFiltro(e.target.value)}
                className="w-full h-11 px-3 text-sm font-medium rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="All">Todas las ciudades</option>
                {ciudadesDisponibles.map(ciudad => (
                  <option key={ciudad} value={ciudad}>{ciudad}</option>
                ))}
              </select>
            </div>

            {/* Criterio de Ordenamiento */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Criterio de Orden
              </label>
              <select
                value={ordenCriterio}
                onChange={(e) => setOrdenCriterio(e.target.value)}
                className="w-full h-11 px-3 text-sm font-medium rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="numero_predio">Número de Predio</option>
                <option value="cliente_nombre">Nombre del Cliente</option>
                <option value="defecto">Orden del Servidor</option>
              </select>
            </div>
          </CardBody>
        </Card>

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

            {/* Info rápida o progreso dinámico */}
            {procesandoAccion === 'vista-previa' && progresoGeneracion ? (
              <div className="flex flex-col gap-2.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-blue-700 dark:text-blue-400">
                  <span className="truncate max-w-[70%]">{progresoGeneracion.cliente}</span>
                  <span className="font-mono">{progresoGeneracion.actual} / {progresoGeneracion.total}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(progresoGeneracion.actual / progresoGeneracion.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
                  <HiDocumentText className="w-4 h-4 opacity-70" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Recibos a generar:</span>
                </div>
                <span className="text-sm font-black text-slate-800 dark:text-zinc-100">
                  {estadisticas?.cantidadRecibos || 0}
                </span>
              </div>
            )}

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

            {/* Info rápida o progreso dinámico */}
            {procesandoAccion === 'imprimir' && progresoGeneracion ? (
              <div className="flex flex-col gap-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  <span className="truncate max-w-[70%]">{progresoGeneracion.cliente}</span>
                  <span className="font-mono">{progresoGeneracion.actual} / {progresoGeneracion.total}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(progresoGeneracion.actual / progresoGeneracion.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
                  <HiDocumentText className="w-4 h-4 opacity-70" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Hojas estimadas:</span>
                </div>
                <span className="text-sm font-black text-slate-800 dark:text-zinc-100">
                  {estadisticas?.paginasEstimadas || 0}
                </span>
              </div>
            )}

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