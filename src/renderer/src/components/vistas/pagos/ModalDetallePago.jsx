import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Chip,
  Divider
} from "@nextui-org/react";
import {
  HiCurrencyDollar,
  HiCash,
  HiCreditCard,
  HiCalendar,
  HiUser,
  HiCog,
  HiLocationMarker,
  HiDocumentText
} from "react-icons/hi";
import ModalVistaPrevia from "../impresion/components/ModalVistaPrevia";

const ModalDetallePago = ({
  isOpen,
  onClose,
  pago,
  obtenerInfoPagosPorFactura,
  getMetodoColor
}) => {
  const [comprobanteUrl, setComprobanteUrl]         = useState(null);
  const [comprobantePrintUrl, setComprobantePrintUrl] = useState(null);
  const [generandoComprobante, setGenerandoComprobante] = useState(false);

  const handleImprimirComprobante = async () => {
    if (!pago || generandoComprobante) return;
    setGenerandoComprobante(true);
    try {
      const operador = pago.modificado_por_nombre || localStorage.getItem('username') || 'Sistema';
      const saldoRestante = pago.saldo_pendiente_factura ?? 0;
      const esPagoParcial = saldoRestante > 0;

      const datos = {
        folio_pago: pago.id,
        factura: {
          id:               pago.factura_id,
          cliente_nombre:   pago.cliente_nombre,
          direccion_cliente: pago.direccion_cliente || '',
          cliente_ciudad:   'Villa Pesqueira',
          periodo:          pago.periodo_facturado || '—',
          tarifa_nombre:    pago.tarifa_nombre || '—',
          medidor_serie:    pago.medidor_numero_serie || '—',
          consumo_m3:       pago.consumo_m3 ?? '—',
          total:            pago.total_factura,
          saldo_restante:   saldoRestante,
        },
        pago: {
          monto:              pago.monto,
          cantidad_entregada: pago.cantidad_entregada,
          metodo_pago:        pago.metodo_pago,
          comentario:         pago.comentario || '',
          fecha_pago:         pago.fecha_pago,
        },
        cambio:          pago.cambio || 0,
        es_pago_parcial: esPagoParcial,
        operador,
        fecha_hora_emision: pago.fecha_creacion || pago.fecha_pago,
        // Incluir historial completo de pagos de la factura
        historial_pagos: obtenerInfoPagosPorFactura
          ? (obtenerInfoPagosPorFactura(pago.factura_id)?.pagosOrdenados || [])
          : [],
      };

      const dataKey = await window.api.savePrintData(JSON.stringify(datos));
      const { protocol, origin, href } = window.location;
      const printUrl = protocol === 'file:'
        ? `${href.split('#')[0]}#/comprobante-pago?print=true&dataKey=${dataKey}`
        : `${origin}/#/comprobante-pago?print=true&dataKey=${dataKey}`;

      const response = await window.api.previewComponent(printUrl);
      if (response?.success && response?.path) {
        setComprobantePrintUrl(printUrl);
        setComprobanteUrl(response.path);
      }
    } catch (err) {
      console.error('Error generando comprobante:', err);
      alert('Error al generar el comprobante: ' + err);
    } finally {
      setGenerandoComprobante(false);
    }
  };

  if (!pago) return null;

  // Funciones de formato
  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString("es-MX", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatFechaHora = (fecha) => {
    return new Date(fecha).toLocaleString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
    <Modal
      backdrop="blur"
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
      classNames={{
        backdrop: "bg-gradient-to-t mt-18 from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
        closeButton:
          "hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-gray-600 dark:text-white",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full">
              <HiCurrencyDollar className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-800 dark:text-white">
                Detalle del Pago #{pago.id}
              </span>
              <span className="text-sm font-normal text-gray-500">
                Información del registro de pago
              </span>
            </div>
          </div>
        </ModalHeader>
        <Divider />
        <ModalBody className="py-6 space-y-5">

          {/* 1. Información Principal del Pago */}
          <Card className="border border-green-200 dark:border-green-800 bg-green-50/40 dark:bg-green-900/10">
            <CardBody className="p-5">
              <h4 className="text-sm font-bold text-green-700 dark:text-green-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                <HiCash className="w-5 h-5" /> Resumen del Pago
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Monto Aplicado</span>
                  <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                    ${pago.monto?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Fecha de Pago</span>
                  <div className="flex items-center gap-2">
                    <HiCalendar className="text-green-600/70" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {formatFechaHora(pago.fecha_pago)}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Método de Pago</span>
                  <Chip
                    color={getMetodoColor(pago.metodo_pago)}
                    variant="flat"
                    size="sm"
                    className="capitalize"
                  >
                    {pago.metodo_pago}
                  </Chip>
                </div>

                <div>
                  <div className="flex gap-4">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block">Entregado</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        ${pago.cantidad_entregada?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block">Cambio</span>
                      <span className={`text-sm font-bold ${pago.cambio > 0 ? "text-orange-500" : "text-gray-500"}`}>
                        ${pago.cambio?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {pago.comentario && (
                <div className="mt-4 pt-3 border-t border-green-100 dark:border-green-800/30">
                  <span className="text-xs text-green-700/70 block mb-1 font-medium">Comentario / Nota:</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300 italic block bg-white dark:bg-black/20 p-2 rounded">
                    "{pago.comentario}"
                  </span>
                </div>
              )}
            </CardBody>
          </Card>

          {/* 2. Factura Asociada y Historial */}
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardBody className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <HiCreditCard className="w-4 h-4" /> Factura Asociada (#{pago.factura_id})
                </h4>
                <Chip
                  color={pago.estado_factura === "Pagado" ? "success" : "warning"}
                  variant="dot"
                  size="sm"
                  className="border-none"
                >
                  {pago.estado_factura}
                </Chip>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                  <span className="text-[10px] text-gray-400 uppercase block mb-1">Periodo</span>
                  <span className="text-sm font-semibold">{pago.periodo_facturado}</span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                  <span className="text-[10px] text-gray-400 uppercase block mb-1">Total Factura</span>
                  <span className="text-sm font-semibold">${pago.total_factura?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                  <span className="text-[10px] text-gray-400 uppercase block mb-1">Saldo Restante</span>
                  <span className={`text-sm font-bold ${pago.saldo_pendiente_factura > 0 ? "text-red-500" : "text-green-500"}`}>
                    ${pago.saldo_pendiente_factura?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* PAGOS MÚLTIPLES (CONDICIONAL) */}
              {(() => {
                const infoPagosFactura = obtenerInfoPagosPorFactura(pago.factura_id);
                if (infoPagosFactura && infoPagosFactura.total > 1) {
                  return (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <span className="text-xs font-bold text-gray-400 block mb-3 uppercase">Historial de Pagos para esta Factura</span>
                      <div className="space-y-2">
                        {infoPagosFactura.pagosOrdenados.map((pagoItem, index) => (
                          <div
                            key={pagoItem.id}
                            className={`flex items-center justify-between p-2 rounded text-xs ${pagoItem.id === pago.id
                                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                                : "bg-gray-50 dark:bg-zinc-800"
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-gray-400">#{index + 1}</span>
                              <span className="font-medium">Pago #{pagoItem.id}</span>
                              <span className="text-gray-400">({formatFecha(pagoItem.fecha_pago)})</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-gray-500">{pagoItem.metodo_pago}</span>
                              <span className="font-bold text-gray-700 dark:text-gray-300">
                                ${pagoItem.monto?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </CardBody>
          </Card>

          {/* 3. Cliente y Auditoría */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Información del Cliente */}
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardBody className="p-4">
                <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <HiUser className="w-4 h-4" /> Datos del Cliente
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase">Nombre</span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {pago.cliente_nombre}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase">Dirección</span>
                    <div className="flex items-start gap-1">
                      <HiLocationMarker className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-gray-600 dark:text-gray-400 leading-snug">
                        {pago.direccion_cliente}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 mt-1 border-t border-gray-100 dark:border-gray-800">
                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase">Medidor</span>
                      <span className="text-xs font-mono font-medium">{pago.medidor_numero_serie}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block uppercase">Lectura</span>
                      <span className="text-xs font-medium">{formatFecha(pago.fecha_lectura)}</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Auditoría */}
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-gray-50/50 dark:bg-zinc-900/50">
              <CardBody className="p-4">
                <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <HiCog className="w-4 h-4" /> Auditoría del Registro
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase">Registrado Por</span>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                        {pago.modificado_por_nombre ? pago.modificado_por_nombre.charAt(0) : "S"}
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {pago.modificado_por_nombre || "Sistema"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase">Fecha de Registro</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                      {formatFechaHora(pago.fecha_creacion)}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

        </ModalBody>

        <ModalFooter>
          <Button
            color="default"
            variant="flat"
            startContent={generandoComprobante ? null : <HiDocumentText className="w-4 h-4" />}
            isLoading={generandoComprobante}
            onPress={handleImprimirComprobante}
          >
            {generandoComprobante ? 'Generando…' : 'Imprimir Comprobante'}
          </Button>
          <Button color="primary" onPress={onClose}>
            Cerrar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>

    {/* Modal de vista previa / impresión del comprobante */}
    {comprobanteUrl && (
      <ModalVistaPrevia
        pdfUrl={comprobanteUrl}
        printUrl={comprobantePrintUrl}
        onClose={() => { setComprobanteUrl(null); setComprobantePrintUrl(null); }}
      />
    )}
  </>
  );
};

export default ModalDetallePago;
