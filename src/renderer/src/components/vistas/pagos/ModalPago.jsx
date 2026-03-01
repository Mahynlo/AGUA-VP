import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Select,
  SelectItem,
  Chip
} from "@nextui-org/react";
import { useState, useEffect, useMemo } from "react";
import ModalVistaPrevia from "../impresion/components/ModalVistaPrevia";
import {
  HiCurrencyDollar,
  HiCreditCard,
  HiCalendar,
  HiUser,
  HiExclamation,
  HiCheck,
  HiX,
  HiCash,
  HiDocumentText
} from "react-icons/hi";

const ModalPago = ({ isOpen, onClose, factura, onConfirmarPago }) => {
  const [formPago, setFormPago] = useState({
    monto: "",
    cantidad_entregada: "",
    metodo_pago: "",
    comentario: "",
    fecha_pago: new Date().toISOString().split('T')[0]
  });

  const [erroresCampos, setErroresCampos] = useState({});
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const [estadoPago, setEstadoPago] = useState('formulario');
  const [resultadoPago, setResultadoPago] = useState(null);

  // Estado del comprobante de impresión
  const [comprobanteUrl, setComprobanteUrl] = useState(null);   // file:// PDF temporal
  const [comprobantePrintUrl, setComprobantePrintUrl] = useState(null); // URL React para imprimir
  const [generandoComprobante, setGenerandoComprobante] = useState(false);

  // Lógica para generar sugerencias de pago basadas en billetes MXN
  const sugerenciasPago = useMemo(() => {
    if (!factura?.saldo_pendiente) return [];

    const monto = parseFloat(factura.saldo_pendiente);
    const sugerencias = new Set();

    // 1. Pago Exacto
    sugerencias.add(monto);

    // 2. Siguientes denominaciones cerradas
    if (monto % 10 !== 0) sugerencias.add(Math.ceil(monto / 10) * 10);
    if (monto % 50 !== 0) sugerencias.add(Math.ceil(monto / 50) * 50);
    if (monto % 100 !== 0) sugerencias.add(Math.ceil(monto / 100) * 100);

    // 3. Billetes comunes que cubran el monto
    const billetes = [20, 50, 100, 200, 500, 1000];
    billetes.forEach(billete => {
      if (billete > monto) {
        sugerencias.add(billete);
      }
    });

    return Array.from(sugerencias)
      .sort((a, b) => a - b)
      .slice(0, 5);
  }, [factura]);

  const limpiarError = (campo) => {
    if (erroresCampos[campo]) {
      setErroresCampos(prev => ({ ...prev, [campo]: false }));
    }
  };

  useEffect(() => {
    if (isOpen && factura) {
      // Verificar si la factura está en convenio
      if (factura.estado === 'En Convenio' || factura.convenio_id) {
        setEstadoPago('bloqueado_convenio');
        return;
      }

      setFormPago({
        monto: factura.saldo_pendiente?.toString() || "",
        cantidad_entregada: "",
        metodo_pago: "Efectivo",
        comentario: "",
        fecha_pago: new Date().toISOString().split('T')[0]
      });
      setErroresCampos({});
      setMostrarErrores(false);
      setEstadoPago('formulario');
      setResultadoPago(null);
    }
  }, [isOpen, factura]);

  const handleConfirmar = () => {
    setMostrarErrores(true);
    const nuevosErrores = {};

    if (!formPago.cantidad_entregada || parseFloat(formPago.cantidad_entregada) <= 0) {
      nuevosErrores.cantidad_entregada = true;
    }

    if (!formPago.metodo_pago) {
      nuevosErrores.metodo_pago = true;
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErroresCampos(nuevosErrores);
      return;
    }
    setEstadoPago('confirmacion');
  };

  const handleProcesarPago = async () => {
    setEstadoPago('procesando');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const resultado = await onConfirmarPago(formPago);
      setResultadoPago({
        exito: true,
        mensaje: `Pago realizado exitosamente`,
        detalles: resultado
      });
      setEstadoPago('exito');
    } catch (error) {
      setResultadoPago({
        exito: false,
        mensaje: error.message || 'Error desconocido al procesar el pago',
        detalles: error
      });
      setEstadoPago('error');
    }
  };

  const handleVolverFormulario = () => {
    setEstadoPago('formulario');
    setMostrarErrores(false);
  };

  const handleReintentar = () => {
    setEstadoPago('confirmacion');
  };

  const handleCerrarModal = () => {
    setFormPago({
      monto: "",
      cantidad_entregada: "",
      metodo_pago: "",
      comentario: "",
      fecha_pago: new Date().toISOString().split('T')[0]
    });
    setErroresCampos({});
    setMostrarErrores(false);
    setEstadoPago('formulario');
    setResultadoPago(null);
    setComprobanteUrl(null);
    setComprobantePrintUrl(null);
    onClose();
  };

  // Genera el PDF del comprobante y abre el modal de impresión
  const handleImprimirComprobante = async () => {
    if (generandoComprobante) return;
    setGenerandoComprobante(true);
    try {
      const operador = localStorage.getItem('username') || localStorage.getItem('usuario') || 'Operador';

      // Cálculos correctos para pagos parciales y completos
      const saldoPendiente     = parseFloat(factura.saldo_pendiente || factura.total || 0);
      const cantidadEntregada  = parseFloat(formPago.cantidad_entregada || 0);
      const montoAplicado      = Math.min(cantidadEntregada, saldoPendiente);   // Lo que realmente se abonó
      const cambioCalculado    = Math.max(0, cantidadEntregada - saldoPendiente); // Cambio solo si pagó de más
      const esPagoParcial      = cantidadEntregada < saldoPendiente;             // ¿No alcanzó para cubrir todo?
      const saldoRestante      = Math.max(0, saldoPendiente - cantidadEntregada);// Lo que queda pendiente

      const datos = {
        folio_pago: resultadoPago?.detalles?.pago_id || resultadoPago?.detalles?.id || '—',
        factura: {
          id:               factura.id,
          cliente_nombre:   factura.cliente_nombre,
          direccion_cliente: factura.direccion_cliente || '',
          cliente_ciudad:   factura.cliente_ciudad || 'Villa Pesqueira',
          periodo:          factura.periodo || factura.mes_facturado || '—',
          tarifa_nombre:    factura.tarifa_nombre || '—',
          medidor_serie:    factura.medidor?.numero_serie || factura.medidor_serie || '—',
          consumo_m3:       factura.consumo_m3 ?? '—',
          total:            factura.total ?? factura.saldo_pendiente,
          saldo_restante:   saldoRestante,
        },
        pago: {
          monto:              montoAplicado,
          cantidad_entregada: cantidadEntregada,
          metodo_pago:        formPago.metodo_pago,
          comentario:         formPago.comentario || '',
          fecha_pago:         formPago.fecha_pago,
        },
        cambio:          cambioCalculado,
        es_pago_parcial: esPagoParcial,
        operador,
        fecha_hora_emision: new Date().toISOString(),
      };

      // Historial parcial: solo el pago actual (no tenemos más info en este punto)
      datos.historial_pagos = [
        { id: datos.folio_pago, monto: datos.pago.monto, fecha_pago: datos.pago.fecha_pago, metodo_pago: datos.pago.metodo_pago },
      ];

      const dataKey = await window.api.savePrintData(JSON.stringify(datos));

      const { protocol, origin, href } = window.location;
      let printUrl;
      if (protocol === 'file:') {
        const base = href.split('#')[0];
        printUrl = `${base}#/comprobante-pago?print=true&dataKey=${dataKey}`;
      } else {
        printUrl = `${origin}/#/comprobante-pago?print=true&dataKey=${dataKey}`;
      }

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

  if (!factura) return null;

  const cambio = formPago.cantidad_entregada && factura
    ? parseFloat(formPago.cantidad_entregada) - factura.saldo_pendiente
    : 0;

  const renderContenido = () => {
    switch (estadoPago) {
      case 'confirmacion':
        return (
          <>
            <ModalHeader className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <HiExclamation className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3>Confirmar Pago - Factura #{factura.id}</h3>
                <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  Revise los datos antes de procesar el pago
                </p>
              </div>
            </ModalHeader>

            <ModalBody className="space-y-6">
              <Card className="border border-blue-200 dark:border-blue-800">
                <CardBody className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <HiUser className="w-5 h-5 text-blue-600" />
                    Resumen del Pago
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cliente</label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{factura.cliente_nombre}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Saldo Pendiente</label>
                      <p className="text-lg font-bold text-red-600">${factura.saldo_pendiente?.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cantidad Entregada</label>
                      <p className="text-lg font-bold text-green-600">${parseFloat(formPago.cantidad_entregada).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Método de Pago</label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{formPago.metodo_pago}</p>
                    </div>
                  </div>

                  {cambio > 0 && (
                    <Card className="border border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/30">
                      <CardBody>
                        <div className="flex items-center gap-3">
                          <HiCurrencyDollar className="w-6 h-6 text-warning-600" />
                          <div>
                            <p className="text-sm font-semibold text-warning-700 dark:text-warning-300">
                              Cambio a entregar:
                            </p>
                            <p className="text-xl font-bold text-warning-600 dark:text-warning-400">
                              ${cambio.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Comentarios</label>
                    <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      {formPago.comentario || "Sin comentarios"}
                    </p>
                  </div>
                </CardBody>
              </Card>
            </ModalBody>

            <ModalFooter>
              <Button color="default" variant="light" onPress={handleVolverFormulario}>
                Volver al Formulario
              </Button>
              <Button color="primary" onPress={handleProcesarPago} className="font-medium">
                Confirmar y Procesar Pago
              </Button>
            </ModalFooter>
          </>
        );

      case 'procesando':
        return (
          <>
            <ModalHeader className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <HiCurrencyDollar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3>Procesando Pago...</h3>
                <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  Por favor espere
                </p>
              </div>
            </ModalHeader>

            <ModalBody className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Procesando el pago...</p>
            </ModalBody>
          </>
        );

      case 'bloqueado_convenio':
        return (
          <>
            <ModalHeader className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 bg-warning-100 dark:bg-warning-900 rounded-lg">
                <HiExclamation className="w-6 h-6 text-warning-600 dark:text-warning-400" />
              </div>
              <div>
                <h3>Factura en Convenio de Pago</h3>
                <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  No se puede pagar directamente
                </p>
              </div>
            </ModalHeader>

            <ModalBody className="space-y-6">
              <Card className="border-2 border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-950">
                <CardBody className="space-y-4">
                  <div className="flex items-start gap-3">
                    <HiExclamation className="w-6 h-6 text-warning-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-warning-900 dark:text-warning-100 mb-2">
                        Esta factura está incluida en un convenio de pago activo
                      </h4>
                      <p className="text-sm text-warning-800 dark:text-warning-200">
                        No puede realizar pagos directos a facturas que forman parte de un convenio.
                        Los pagos deben realizarse a través de las parcialidades del convenio.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-warning-200 dark:border-warning-800 pt-4">
                    <h5 className="font-medium text-warning-900 dark:text-warning-100 mb-2">
                      ¿Cómo pagar esta factura?
                    </h5>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-warning-800 dark:text-warning-200">
                      <li>Vaya a la pestaña "Deudores"</li>
                      <li>Busque al cliente: <span className="font-semibold">{factura.cliente_nombre}</span></li>
                      <li>Haga clic en "Ver Convenio"</li>
                      <li>Pague las parcialidades pendientes del convenio</li>
                    </ol>
                  </div>
                </CardBody>
              </Card>

              <Card className="border border-gray-200 dark:border-gray-700">
                <CardBody>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-3">Información de la Factura</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Cliente:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{factura.cliente_nombre}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Factura #:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{factura.id}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Saldo:</span>
                      <p className="font-medium text-gray-900 dark:text-white">${factura.saldo_pendiente?.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Estado:</span>
                      <Chip color="success" variant="flat" size="sm">En Convenio</Chip>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </ModalBody>

            <ModalFooter>
              <Button color="primary" onPress={handleCerrarModal}>
                Entendido
              </Button>
            </ModalFooter>
          </>
        );



      case 'exito':
        return (
          <>
            <ModalHeader className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <HiCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3>¡Pago Realizado con Éxito!</h3>
                <p className="text-sm font-normal text-gray-500 dark:text-gray-400">El pago se ha procesado correctamente</p>
              </div>
            </ModalHeader>
            <ModalBody className="space-y-6">
              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-100 dark:border-green-800 flex flex-col items-center text-center">
                <HiCheck className="w-16 h-16 text-green-500 mb-2" />
                <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-1">
                  ${parseFloat(formPago.cantidad_entregada).toLocaleString()}
                </h3>
                <p className="text-green-600 dark:text-green-300">Monto registrado</p>

                {cambio > 0 && (
                  <div className="mt-4 p-3 bg-white dark:bg-zinc-800 rounded-lg shadow-sm w-full">
                    <p className="text-sm text-gray-500">Cambio Entregado</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-white">${cambio.toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Botón de comprobante */}
              <Button
                color="default"
                variant="flat"
                className="w-full font-medium"
                startContent={generandoComprobante ? null : <HiDocumentText className="w-4 h-4" />}
                isLoading={generandoComprobante}
                onPress={handleImprimirComprobante}
              >
                {generandoComprobante ? 'Generando comprobante…' : 'Imprimir Comprobante de Pago'}
              </Button>
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onPress={handleCerrarModal} className="w-full font-bold">
                Finalizar
              </Button>
            </ModalFooter>
          </>
        );

      case 'error':
        return (
          <>
            <ModalBody className="py-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <HiX className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-red-600">Error al Procesar</h3>
                <p className="text-gray-600 dark:text-gray-300">{resultadoPago?.mensaje}</p>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="light" onPress={handleReintentar}>
                Reintentar
              </Button>
              <Button color="danger" onPress={handleCerrarModal}>
                Cerrar
              </Button>
            </ModalFooter>
          </>
        );

      default: // formulario
        return (
          <>
            <ModalHeader className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <HiCreditCard className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3>Realizar Pago - Factura #{factura.id}</h3>
                <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  Total a pagar: <span className="font-bold text-gray-800 dark:text-white">${factura.saldo_pendiente?.toLocaleString()}</span>
                </p>
              </div>
            </ModalHeader>

            <ModalBody className="space-y-6">

              {/* Información del Pago */}
              <Card className="border border-green-200 dark:border-green-800 shadow-sm">
                <CardBody className="space-y-5">

                  {/* Fila 1: Saldos */}
                  <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Cliente</p>
                      <p className="font-medium text-gray-800 dark:text-gray-200">{factura.cliente_nombre}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase font-semibold">Saldo Pendiente</p>
                      <p className="text-xl font-bold text-red-600">${formPago.monto}</p>
                    </div>
                  </div>

                  {/* Fila 2: Cantidad Entregada (Con mejoras) */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                      Cantidad entregada por el cliente*
                    </label>
                    <div className="relative w-full flex">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg">
                        $
                      </span>
                      <input
                        type="number"
                        placeholder="0.00"
                        autoFocus
                        value={formPago.cantidad_entregada}
                        onChange={(e) => {
                          setFormPago({ ...formPago, cantidad_entregada: e.target.value });
                          limpiarError('cantidad_entregada');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleConfirmar();
                        }}
                        min="0"
                        step="0.01"
                        className={`border ${mostrarErrores && erroresCampos.cantidad_entregada ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-600 focus:border-green-500'} text-gray-800 text-2xl font-bold rounded-xl pl-8 pr-4 py-3 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:border-gray-600 dark:text-white transition-all`}
                      />
                    </div>

                    {/* BOTONES DE SUGERENCIA DE PAGO (Monedas y Billetes) */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {sugerenciasPago.map((montoSugerido) => (
                        <button
                          key={montoSugerido}
                          onClick={() => {
                            setFormPago({ ...formPago, cantidad_entregada: montoSugerido.toString() });
                            limpiarError('cantidad_entregada');
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all transform active:scale-95 border
                                    ${parseFloat(formPago.cantidad_entregada) === montoSugerido
                              ? 'bg-green-600 text-white border-green-600 shadow-md'
                              : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-zinc-700 hover:border-green-400 hover:text-green-600'
                            }`}
                        >
                          <span className="flex items-center gap-1">
                            <HiCash className={parseFloat(formPago.cantidad_entregada) === montoSugerido ? "text-white" : "text-green-500"} />
                            ${montoSugerido}
                          </span>
                        </button>
                      ))}
                    </div>

                    {mostrarErrores && erroresCampos.cantidad_entregada && (
                      <p className="text-sm text-red-500 mt-1">Ingrese un monto válido</p>
                    )}
                  </div>

                  {/* Fila 3: Método y Comentario */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                        Método de pago*
                      </label>
                      <Select
                        aria-label="Método de pago"
                        placeholder="Seleccionar"
                        selectedKeys={formPago.metodo_pago ? [formPago.metodo_pago] : []}
                        onChange={(e) => {
                          setFormPago({ ...formPago, metodo_pago: e.target.value });
                          limpiarError('metodo_pago');
                        }}
                        color="primary"
                        variant="bordered"
                        startContent={<HiCreditCard className="text-gray-400" />}
                        className="w-full"
                      >
                        <SelectItem key="Efectivo" value="Efectivo" startContent={<HiCash />}>Efectivo</SelectItem>
                        <SelectItem key="Transferencia" value="Transferencia" startContent={<HiCreditCard />}>Transferencia</SelectItem>
                        <SelectItem key="Tarjeta" value="Tarjeta" startContent={<HiCreditCard />}>Tarjeta</SelectItem>
                        {/* AQUI ESTABA EL ERROR ANTES: HiDocumentText ya está importado */}
                        <SelectItem key="Cheque" value="Cheque" startContent={<HiDocumentText />}>Cheque</SelectItem>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                        Comentario (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Nota..."
                        className="border border-gray-300 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:border-gray-600 dark:text-white"
                        value={formPago.comentario}
                        onChange={(e) => setFormPago({ ...formPago, comentario: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Indicador de cambio dinámico */}
                  {cambio > 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-3 flex justify-between items-center animate-pulse-once">
                      <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 font-medium">
                        <HiExclamation className="w-5 h-5" />
                        <span>Cambio a entregar:</span>
                      </div>
                      <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        ${cambio.toLocaleString()}
                      </span>
                    </div>
                  )}
                </CardBody>
              </Card>
            </ModalBody>

            <ModalFooter>
              <Button color="danger" variant="light" onPress={handleCerrarModal}>
                Cancelar
              </Button>
              <Button
                color="primary"
                onPress={handleConfirmar}
                className="font-bold px-8"
                shadow
              >
                Cobrar
              </Button>
            </ModalFooter>
          </>
        );
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={estadoPago === 'procesando' ? undefined : handleCerrarModal}
        size="2xl"
        backdrop="blur"
        scrollBehavior="inside"
        isDismissable={estadoPago !== 'procesando'}
        classNames={{
          backdrop: "bg-black/60 backdrop-blur-sm",
          modal: "bg-white dark:bg-zinc-900 rounded-xl shadow-2xl",
          closeButton: "hover:bg-red-600 hover:text-white text-gray-600"
        }}
      >
        <ModalContent>
          {renderContenido()}
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

export default ModalPago;