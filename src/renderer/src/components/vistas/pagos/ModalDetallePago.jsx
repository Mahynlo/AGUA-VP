import { useState } from "react";
import { Modal } from "flowbite-react";
import {
  HiCurrencyDollar,
  HiCash,
  HiCreditCard,
  HiCalendar,
  HiUser,
  HiCog,
  HiLocationMarker,
  HiDocumentText,
  HiMap
} from "react-icons/hi";
import ModalImprimir from "../impresion/components/ModalImprimir";

const premiumModalTheme = {
  root: { show: { on: "flex bg-slate-900/60 dark:bg-black/80 mt-10", off: "hidden" } },
  content: {
    base: "relative h-full w-full p-4 md:h-auto",
    inner: "relative flex max-h-[90dvh] flex-col rounded-2xl bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 mx-auto max-w-3xl w-full"
  },
  header: {
    base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/50 px-8 py-6 rounded-t-2xl shrink-0",
    close: { base: "absolute top-6 right-6 inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors", icon: "h-5 w-5" }
  },
  body: { base: "px-6 py-6 flex-1 overflow-y-auto" },
  footer: { base: "flex items-center justify-between gap-3 border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8 rounded-b-2xl shrink-0" }
};

const ModalDetallePago = ({ isOpen, onClose, pago, obtenerInfoPagosPorFactura, getMetodoColor }) => {
  const [comprobanteUrl, setComprobanteUrl] = useState(null);
  const [comprobantePrintUrl, setComprobantePrintUrl] = useState(null);
  const [modoPdf, setModoPdf] = useState(null);
  const [generandoComprobante, setGenerandoComprobante] = useState(false);

  const handleImprimirComprobante = async () => {
    if (!pago || generandoComprobante) return;
    setGenerandoComprobante(true);
    try {
      const operador = pago.modificado_por_nombre || localStorage.getItem("username") || "Sistema";
      const saldoRestante = pago.saldo_pendiente_factura ?? 0;
      const esPagoParcial = saldoRestante > 0;
      const datos = {
        folio_pago: pago.id,
        factura: {
          id: pago.factura_id, cliente_nombre: pago.cliente_nombre, direccion_cliente: pago.direccion_cliente || "",
          cliente_ciudad: "Villa Pesqueira", periodo: pago.periodo_facturado || "—", tarifa_nombre: pago.tarifa_nombre || "—",
          medidor_serie: pago.medidor_numero_serie || "—", consumo_m3: pago.consumo_m3 ?? "—",
          total: pago.total_factura, saldo_restante: saldoRestante
        },
        pago: { monto: pago.monto, cantidad_entregada: pago.cantidad_entregada, metodo_pago: pago.metodo_pago, comentario: pago.comentario || "", fecha_pago: pago.fecha_pago },
        cambio: pago.cambio || 0, es_pago_parcial: esPagoParcial, operador,
        fecha_hora_emision: pago.fecha_creacion || pago.fecha_pago,
        historial_pagos: obtenerInfoPagosPorFactura ? (obtenerInfoPagosPorFactura(pago.factura_id)?.pagosOrdenados || []) : []
      };
      const dataKey = await window.api.savePrintData(JSON.stringify(datos));
      const { protocol, origin, href } = window.location;
      const printUrl = protocol === "file:"
        ? `${href.split("#")[0]}#/comprobante-pago?print=true&dataKey=${dataKey}`
        : `${origin}/#/comprobante-pago?print=true&dataKey=${dataKey}`;
      const response = await window.api.previewComponent(printUrl);
      if (response?.success && response?.path) {
        setComprobantePrintUrl(printUrl);
        setComprobanteUrl(response.path);
        setModoPdf("imprimir");
      }
    } catch (err) {
      console.error("Error generando comprobante:", err);
      alert("Error al generar el comprobante: " + err);
    } finally {
      setGenerandoComprobante(false);
    }
  };

  if (!pago) return null;

  const formatFecha = (fecha) => {
    if (!fecha) return "No registrada";
    return new Date(fecha).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });
  };

  const formatFechaHora = (fecha) => {
    if (!fecha) return "No registrada";
    return new Date(fecha).toLocaleString("es-MX", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const infoPagosFactura = obtenerInfoPagosPorFactura ? obtenerInfoPagosPorFactura(pago.factura_id) : null;

  const metodoColor = getMetodoColor ? getMetodoColor(pago.metodo_pago) : "default";
  const metodoBadgeClass = {
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    primary: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    default: "bg-slate-200/50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
  }[metodoColor] || "bg-slate-200/50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400";

  return (
    <>
      <Modal show={isOpen} onClose={onClose} theme={premiumModalTheme} dismissible size="4xl">
        {/* HEADER */}
        <Modal.Header>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-2xl">
              <HiCurrencyDollar className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                Detalle del Pago
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Folio: #{pago.id}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-600" />
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Factura: #{pago.factura_id}</span>
              </div>
            </div>
          </div>
        </Modal.Header>

        {/* BODY */}
        <Modal.Body>
          <div className="space-y-6">
            {/* 1. Resumen Financiero */}
            <div className="bg-green-50/50 dark:bg-green-900/10 rounded-2xl p-5">
              <h4 className="text-xs font-bold text-green-700/70 dark:text-green-500/70 mb-4 uppercase tracking-wider flex items-center gap-2">
                <HiCash className="w-4 h-4" /> Resumen Financiero
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-6">
                <div className="lg:col-span-2">
                  <span className="text-[11px] font-bold text-green-700/60 dark:text-green-500/60 uppercase tracking-wider block mb-1">Monto Aplicado</span>
                  <span className="text-3xl font-black text-green-700 dark:text-green-400 tracking-tight">
                    ${pago.monto?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex flex-col justify-end">
                  <span className="text-[11px] font-bold text-green-700/60 dark:text-green-500/60 uppercase tracking-wider block mb-1">Fecha de Pago</span>
                  <div className="flex items-center gap-1.5 text-slate-800 dark:text-zinc-200">
                    <HiCalendar className="w-4 h-4 text-green-600/70" />
                    <span className="text-sm font-semibold">{formatFechaHora(pago.fecha_pago)}</span>
                  </div>
                </div>
                <div className="flex flex-col justify-end">
                  <span className="text-[11px] font-bold text-green-700/60 dark:text-green-500/60 uppercase tracking-wider block mb-1">Método</span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit ${metodoBadgeClass}`}>
                    {pago.metodo_pago}
                  </span>
                </div>
                <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex items-center gap-6 mt-2 pt-4 border-t border-green-200/50 dark:border-green-900/30">
                  <div>
                    <span className="text-[10px] font-bold text-green-700/50 dark:text-green-500/50 uppercase tracking-wider block mb-0.5">Efectivo Entregado</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                      ${pago.cantidad_entregada?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-green-700/50 dark:text-green-500/50 uppercase tracking-wider block mb-0.5">Cambio / Vuelto</span>
                    <span className={`text-sm font-black ${pago.cambio > 0 ? "text-orange-500 dark:text-orange-400" : "text-slate-500"}`}>
                      ${pago.cambio?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                {pago.comentario && (
                  <div className="col-span-1 sm:col-span-2 lg:col-span-4 mt-2">
                    <span className="text-[10px] font-bold text-green-700/50 dark:text-green-500/50 uppercase tracking-wider block mb-1">Nota del Cajero</span>
                    <div className="bg-white/60 dark:bg-black/20 p-3 rounded-xl border border-green-100 dark:border-green-900/20">
                      <span className="text-sm text-slate-600 dark:text-zinc-300 italic leading-relaxed">"{pago.comentario}"</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Factura Asociada */}
            <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-zinc-700/50">
                <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <HiCreditCard className="w-4 h-4" /> Factura #{pago.factura_id}
                </h4>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border text-xs ${pago.estado_factura === "Pagado" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"}`}>
                  {pago.estado_factura}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Periodo</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-zinc-100">{pago.periodo_facturado}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Total a Pagar</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-zinc-100">${pago.total_factura?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Saldo Restante</span>
                  <span className={`text-sm font-black ${pago.saldo_pendiente_factura > 0 ? "text-red-500 dark:text-red-400" : "text-green-500 dark:text-green-400"}`}>
                    ${pago.saldo_pendiente_factura?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {infoPagosFactura && infoPagosFactura.total > 1 && (
                <div className="mt-5 pt-5 border-t border-slate-200 dark:border-zinc-700/50">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 block mb-3 uppercase tracking-wider">Historial de Pagos (Abonos)</span>
                  <div className="space-y-2">
                    {infoPagosFactura.pagosOrdenados.map((pagoItem, index) => {
                      const isCurrentPago = pagoItem.id === pago.id;
                      return (
                        <div key={pagoItem.id} className={`flex items-center justify-between p-3 rounded-xl transition-colors ${isCurrentPago ? "bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800/50" : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800"}`}>
                          <div className="flex items-center gap-3">
                            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${isCurrentPago ? "bg-green-500 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-500"}`}>{index + 1}</div>
                            <div>
                              <span className={`text-xs font-bold ${isCurrentPago ? "text-green-800 dark:text-green-300" : "text-slate-700 dark:text-zinc-300"}`}>Pago #{pagoItem.id} {isCurrentPago && "(Éste)"}</span>
                              <span className="block text-[10px] text-slate-500 dark:text-zinc-500">{formatFecha(pagoItem.fecha_pago)}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className={`text-sm font-black ${isCurrentPago ? "text-green-700 dark:text-green-400" : "text-slate-800 dark:text-zinc-100"}`}>${pagoItem.monto?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                            <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase">{pagoItem.metodo_pago}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Cliente y Auditoría */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-5 flex flex-col">
                <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <HiUser className="w-4 h-4" /> Datos del Cliente
                </h4>
                <div className="space-y-4 flex-1">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Nombre</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-zinc-100 block">{pago.cliente_nombre}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <HiLocationMarker className="w-4 h-4 text-slate-400 dark:text-zinc-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Dirección</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-zinc-300 leading-snug block">{pago.direccion_cliente || "No registrada"}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-zinc-700/50 flex justify-between items-center">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Medidor</span>
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/30">
                      {pago.medidor_numero_serie}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Fecha Lectura</span>
                    <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">{formatFecha(pago.fecha_lectura)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-5 flex flex-col">
                <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <HiCog className="w-4 h-4" /> Auditoría del Registro
                </h4>
                <div className="space-y-5 flex-1">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-2">Registrado Por (Cajero)</span>
                    <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700/50 w-fit">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-black shrink-0">
                        {pago.modificado_por_nombre ? pago.modificado_por_nombre.charAt(0).toUpperCase() : "S"}
                      </div>
                      <span className="text-sm font-bold text-slate-800 dark:text-zinc-100 pr-2">
                        {pago.modificado_por_nombre || "Sistema Automático"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Fecha de Creación en Sistema</span>
                    <span className="text-xs font-mono font-medium text-slate-600 dark:text-zinc-400">
                      {formatFechaHora(pago.fecha_creacion)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>

        {/* FOOTER */}
        <Modal.Footer>
          <button
            type="button"
            onClick={handleImprimirComprobante}
            disabled={generandoComprobante}
            className="font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl px-6 h-11 flex items-center gap-2 disabled:opacity-70"
          >
            {generandoComprobante
              ? <><div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-600 rounded-full animate-spin" /> Procesando...</>
              : <><HiDocumentText className="w-5 h-5 text-slate-500" /> Ver / Imprimir Recibo</>}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="font-bold bg-blue-600 text-white rounded-xl px-8 h-11 shadow-sm shadow-blue-500/20"
          >
            Cerrar
          </button>
        </Modal.Footer>
      </Modal>

      {comprobanteUrl && modoPdf && (
        <ModalImprimir
          pdfUrl={comprobanteUrl}
          printUrl={comprobantePrintUrl}
          onClose={() => { setComprobanteUrl(null); setComprobantePrintUrl(null); setModoPdf(null); }}
          initialMode={modoPdf === "imprimir" ? "print" : "preview"}
        />
      )}
    </>
  );
};

export default ModalDetallePago;
