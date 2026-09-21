import React from "react";
import { Card, CardHeader, CardContent, Button } from "@heroui/react";
import { HiPrinter, HiEye, HiDocumentText, HiCog } from "react-icons/hi";
import EstadisticasImpresion from "./EstadisticasImpresion";

/**
 * Componente para acciones de impresión (vista previa e imprimir)
 */
const AccionesImpresion = ({
  estadisticas,
  onEmitir,
  onVistaPrevia,
  onImprimir,
  onPruebaRecibo,
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
        <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700">
          <CardHeader className="pt-5 px-6 pb-4 border-b border-slate-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <HiCog className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                  Opciones de Emisión
                </h4>
                <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
                  Filtros de impresión masiva
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex flex-col gap-4">
            {/* Filtro de Ciudad */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 ml-1">
                Filtrar por Localidad / Ciudad
              </label>
              <select
                value={ciudadFiltro}
                onChange={(e) => setCiudadFiltro(e.target.value)}
                className="w-full h-12 px-4 text-sm font-semibold rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all"
              >
                <option value="All">Todas las localidades</option>
                {ciudadesDisponibles.map(ciudad => (
                  <option key={ciudad} value={ciudad}>{ciudad}</option>
                ))}
              </select>
            </div>

            {/* Criterio de Ordenamiento */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 ml-1">
                Criterio de Ordenamiento
              </label>
              <select
                value={ordenCriterio}
                onChange={(e) => setOrdenCriterio(e.target.value)}
                className="w-full h-12 px-4 text-sm font-semibold rounded-xl bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all"
              >
                <option value="numero_predio">Número de Predio</option>
                <option value="cliente_nombre">Nombre del Cliente</option>
                <option value="defecto">Orden del Servidor</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* TARJETA UNIFICADA: Emisión e Impresión de Recibos */}
        <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm rounded-2xl overflow-hidden transition-all duration-200 hover:border-indigo-200 dark:hover:border-indigo-900/50">
          <CardContent className="p-6 flex flex-col gap-4">

            {/* Header de la tarjeta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <HiPrinter className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                    Emisión e Impresión
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
                    Visor y control de impresión
                  </p>
                </div>
              </div>
            </div>

            {/* Info rápida o progreso dinámico */}
            {isAnyProcessing && progresoGeneracion ? (
              <div className="flex flex-col gap-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-3.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-indigo-700 dark:text-indigo-400">
                  <span className="truncate max-w-[70%]">
                    {progresoGeneracion.fase === 'compilando'
                      ? "⚡ Compilando PDF y abriendo visor..."
                      : progresoGeneracion.cliente}
                  </span>
                  <span className="font-mono">
                    {progresoGeneracion.fase === 'compilando'
                      ? "PDF..."
                      : `${progresoGeneracion.actual} / ${progresoGeneracion.total}`}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      progresoGeneracion.fase === 'compilando'
                        ? "bg-indigo-600 dark:bg-indigo-400 animate-pulse w-full"
                        : "bg-indigo-600 dark:bg-indigo-500"
                    }`}
                    style={{
                      width: progresoGeneracion.fase === 'compilando'
                        ? '100%'
                        : `${(progresoGeneracion.actual / progresoGeneracion.total) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            ) : (
              /* Resumen consolidado: Recibos y Hojas calculadas a 2 por hoja */
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                    <HiDocumentText className="w-4 h-4 text-indigo-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Recibos:</span>
                  </div>
                  <span className="text-base font-black font-mono text-slate-800 dark:text-zinc-100">
                    {estadisticas?.cantidadRecibos || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                    <HiPrinter className="w-4 h-4 text-emerald-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Hojas:</span>
                  </div>
                  <span className="text-base font-black font-mono text-slate-800 dark:text-zinc-100">
                    {estadisticas?.paginasEstimadas ?? Math.ceil((estadisticas?.cantidadRecibos || 0) / 2)}
                  </span>
                </div>
              </div>
            )}

            {/* Botón Principal: Emitir Recibos */}
            <Button
              className="w-full h-12 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm rounded-xl transition-all active:scale-98 text-sm flex items-center justify-center gap-2"
              onPress={onEmitir || onVistaPrevia}
              isLoading={procesandoAccion === 'emitir' || procesandoAccion === 'vista-previa' || procesandoAccion === 'imprimir'}
              isDisabled={isAnyProcessing}
            >
              {!(procesandoAccion === 'emitir' || procesandoAccion === 'vista-previa' || procesandoAccion === 'imprimir') && <HiPrinter className="text-lg" />}
              <span>{procesandoAccion === 'emitir' || procesandoAccion === 'vista-previa' || procesandoAccion === 'imprimir' ? 'Generando PDF...' : 'Emitir e Imprimir Recibos'}</span>
            </Button>

            {/* Botón Pequeño de Prueba: 1 Recibo */}
            <div className="pt-0.5">
              <Button
                size="sm"
                variant="flat"
                className="w-full h-9 font-bold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700 rounded-xl transition-all text-xs flex items-center justify-center gap-2"
                onPress={onPruebaRecibo}
                isLoading={procesandoAccion === 'prueba-recibo'}
                isDisabled={isAnyProcessing}
              >
                {procesandoAccion !== 'prueba-recibo' && <HiEye className="w-4 h-4 text-slate-500 dark:text-zinc-400" />}
                <span>{procesandoAccion === 'prueba-recibo' ? 'Generando prueba...' : 'Prueba de Impresión (1 Recibo)'}</span>
              </Button>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default AccionesImpresion;