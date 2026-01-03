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
// AGREGADO: HiDocumentText a los imports
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
    onClose();
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
          <ModalBody className="py-12 flex flex-col items-center justify-center">
             <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
             </div>
             <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Procesando Pago...</h3>
             <p className="text-gray-500">Por favor espere un momento</p>
          </ModalBody>
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
            <ModalBody className="py-8">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                        <HiX className="w-10 h-10 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-red-600">Error al Procesar</h3>
                    <p className="text-gray-600 dark:text-gray-300">{resultadoPago?.mensaje}</p>
                </div>
            </ModalBody>
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
                          setFormPago({...formPago, cantidad_entregada: e.target.value});
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
                                    setFormPago({...formPago, cantidad_entregada: montoSugerido.toString()});
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
                          setFormPago({...formPago, metodo_pago: e.target.value});
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
                            onChange={(e) => setFormPago({...formPago, comentario: e.target.value})}
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
  );
};

export default ModalPago;