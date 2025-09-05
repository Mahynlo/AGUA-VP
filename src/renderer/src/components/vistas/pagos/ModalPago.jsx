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
  SelectItem
} from "@nextui-org/react";
import { useState, useEffect } from "react";
import { HiCurrencyDollar, HiCreditCard, HiCalendar, HiAnnotation, HiUser, HiExclamation, HiCheck, HiX } from "react-icons/hi";

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
  
  // Estados para el flujo de pago
  const [estadoPago, setEstadoPago] = useState('formulario'); // 'formulario', 'confirmacion', 'procesando', 'exito', 'error'
  const [resultadoPago, setResultadoPago] = useState(null);

  // Función para limpiar errores cuando el usuario empiece a escribir
  const limpiarError = (campo) => {
    if (erroresCampos[campo]) {
      setErroresCampos(prev => ({
        ...prev,
        [campo]: false
      }));
    }
  };

  // Resetear formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen && factura) {
      setFormPago({
        monto: factura.saldo_pendiente?.toString() || "",
        cantidad_entregada: factura.saldo_pendiente?.toString() || "",
        metodo_pago: "Efectivo",
        comentario: "",
        fecha_pago: new Date().toISOString().split('T')[0] // Siempre fecha actual
      });
      setErroresCampos({});
      setMostrarErrores(false);
      setEstadoPago('formulario');
      setResultadoPago(null);
    }
  }, [isOpen, factura]);

  const handleConfirmar = () => {
    setMostrarErrores(true);

    // Validaciones
    const nuevosErrores = {};
    if (!formPago.cantidad_entregada || parseFloat(formPago.cantidad_entregada) <= 0) {
      nuevosErrores.cantidad_entregada = true;
    }
    if (!formPago.metodo_pago) {
      nuevosErrores.metodo_pago = true;
    }
    if (!formPago.comentario.trim()) {
      nuevosErrores.comentario = true;
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErroresCampos(nuevosErrores);
      return;
    }

    // Ir a pantalla de confirmación
    setEstadoPago('confirmacion');
  };

  const handleProcesarPago = async () => {
    console.log("Iniciando proceso de pago...");
    setEstadoPago('procesando');
    
    try {
      // Pequeña demora para mostrar el estado de procesando
      console.log("Mostrando estado de procesando...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Llamar a la función de pago y capturar el resultado
      console.log("Llamando a onConfirmarPago...");
      const resultado = await onConfirmarPago(formPago);
      
      // Si llegamos aquí sin errores, el pago fue exitoso
      console.log("Resultado del pago exitoso:", resultado);
      
      setResultadoPago({
        exito: true,
        mensaje: `Pago realizado exitosamente`,
        detalles: resultado
      });
      
      console.log("Cambiando a estado de éxito...");
      setEstadoPago('exito');
      
    } catch (error) {
      // Si hay un error, mostrarlo en el modal
      console.error("Error en el pago:", error);
      
      setResultadoPago({
        exito: false,
        mensaje: error.message || 'Error desconocido al procesar el pago',
        detalles: error
      });
      
      console.log("Cambiando a estado de error...");
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
    // Limpiar todos los estados del modal
    setFormPago({
      monto: "",
      cantidad_entregada: "",
      metodo_pago: "",
      comentario: "",
      fecha_pago: new Date().toISOString().split('T')[0] // Siempre fecha actual
    });
    setErroresCampos({});
    setMostrarErrores(false);
    setEstadoPago('formulario');
    setResultadoPago(null);
    
    // Cerrar el modal padre
    onClose();
  };

  if (!factura) return null;

  const cambio = formPago.cantidad_entregada && factura 
    ? parseFloat(formPago.cantidad_entregada) - factura.saldo_pendiente 
    : 0;

  // Renderizar contenido según el estado
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
                      {formPago.comentario}
                    </p>
                  </div>
                </CardBody>
              </Card>
            </ModalBody>

            <ModalFooter>
              <Button 
                color="default"
                variant="light"
                onPress={handleVolverFormulario}
              >
                Volver al Formulario
              </Button>
              <Button 
                color="primary" 
                onPress={handleProcesarPago}
                className="font-medium"
              >
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
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div>
                <h3>Procesando Pago...</h3>
                <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  Por favor espere mientras se procesa el pago
                </p>
              </div>
            </ModalHeader>

            <ModalBody className="space-y-6">
              <Card className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30">
                <CardBody>
                  <div className="flex items-center justify-center gap-3 text-blue-600 dark:text-blue-400 py-8">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-lg font-medium">Procesando pago para {factura.cliente_nombre}...</span>
                  </div>
                </CardBody>
              </Card>
            </ModalBody>
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
                <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  El pago se ha procesado correctamente
                </p>
              </div>
            </ModalHeader>

            <ModalBody className="space-y-6">
              <Card className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30">
                <CardBody className="space-y-4">
                  <div className="flex items-center gap-3">
                    <HiCheck className="w-8 h-8 text-green-600" />
                    <div>
                      <h3 className="text-lg font-bold text-green-700 dark:text-green-300">
                        ¡Pago procesado exitosamente!
                      </h3>
                      <p className="text-green-600 dark:text-green-400">
                        Cliente: {factura.cliente_nombre}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-green-200 dark:border-green-700">
                    <div>
                      <label className="text-sm font-medium text-green-700 dark:text-green-300">Factura #</label>
                      <p className="text-lg font-bold text-green-600">#{factura.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-700 dark:text-green-300">Monto Pagado</label>
                      <p className="text-lg font-bold text-green-600">${parseFloat(formPago.cantidad_entregada).toLocaleString()}</p>
                    </div>
                    {cambio > 0 && (
                      <div>
                        <label className="text-sm font-medium text-green-700 dark:text-green-300">Cambio Entregado</label>
                        <p className="text-lg font-bold text-green-600">${cambio.toLocaleString()}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-green-700 dark:text-green-300">Método de Pago</label>
                      <p className="text-green-600">{formPago.metodo_pago}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-700 dark:text-green-300">Fecha de Pago</label>
                      <p className="text-green-600">{new Date().toLocaleDateString('es-MX', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-700 dark:text-green-300">Comentarios</label>
                      <p className="text-green-600">{formPago.comentario}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </ModalBody>

            <ModalFooter>
              <Button 
                color="primary"
                onPress={() => {
                  handleCerrarModal();
                  // También podemos agregar lógica adicional aquí si es necesario
                }}
                className="font-medium"
              >
                Cerrar
              </Button>
            </ModalFooter>
          </>
        );

      case 'error':
        return (
          <>
            <ModalHeader className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <HiX className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3>Error al Procesar Pago</h3>
                <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  No se pudo completar el pago
                </p>
              </div>
            </ModalHeader>

            <ModalBody className="space-y-6">
              <Card className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30">
                <CardBody className="space-y-4">
                  <div className="flex items-center gap-3">
                    <HiX className="w-8 h-8 text-red-600" />
                    <div>
                      <h3 className="text-lg font-bold text-red-700 dark:text-red-300">
                        ❌ El pago no pudo ser procesado
                      </h3>
                      <p className="text-red-600 dark:text-red-400">
                        Cliente: {factura.cliente_nombre}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-red-100 dark:bg-red-900/50 p-4 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                      <strong>Error:</strong> {resultadoPago?.mensaje}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-red-200 dark:border-red-700">
                    <div>
                      <label className="text-sm font-medium text-red-700 dark:text-red-300">Factura #</label>
                      <p className="text-lg font-bold text-red-600">#{factura.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-red-700 dark:text-red-300">Monto Intentado</label>
                      <p className="text-lg font-bold text-red-600">${parseFloat(formPago.cantidad_entregada).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-red-700 dark:text-red-300">Método de Pago</label>
                      <p className="text-red-600">{formPago.metodo_pago}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-red-700 dark:text-red-300">Fecha de Intento</label>
                      <p className="text-red-600">{new Date().toLocaleDateString('es-MX', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </ModalBody>

            <ModalFooter>
              <Button 
                color="default"
                variant="light"
                onPress={handleVolverFormulario}
              >
                Volver al Formulario
              </Button>
              <Button 
                color="primary"
                onPress={handleReintentar}
                className="font-medium"
              >
                Reintentar Pago
              </Button>
              <Button 
                color="danger"
                variant="light"
                onPress={handleCerrarModal}
                className="font-medium"
              >
                Cerrar Modal
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
                  Fecha de pago: {new Date().toLocaleDateString('es-MX', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </ModalHeader>

            <ModalBody className="space-y-6">
              {/* Información del Cliente */}
              <Card className="border border-blue-200 dark:border-blue-800">
                <CardBody className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <HiUser className="w-5 h-5 text-blue-600" />
                    Información del Cliente
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Cliente
                      </label>
                      <div className="relative w-full flex">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                          <HiUser className="inline-block mr-1 h-5 w-5 text-blue-600" />
                        </span>
                        <input
                          type="text"
                          value={factura.cliente_nombre}
                          readOnly
                          className="border border-gray-300 bg-gray-50 text-gray-600 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Saldo Pendiente
                      </label>
                      <div className="relative w-full flex">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                          <HiCurrencyDollar className="inline-block mr-1 h-5 w-5 text-red-600" />
                        </span>
                        <input
                          type="text"
                          value={`$${factura.saldo_pendiente?.toLocaleString()}`}
                          readOnly
                          className="border border-red-300 bg-red-50 text-red-600 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none dark:bg-red-900/20 dark:border-red-600 dark:text-red-400 font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Información del Pago */}
              <Card className="border border-green-200 dark:border-green-800">
                <CardBody className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <HiCurrencyDollar className="w-5 h-5 text-green-600" />
                    Detalles del Pago
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Monto a aplicar (solo lectura) */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Saldo pendiente
                      </label>
                      <div className="relative w-full flex">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                          <HiCurrencyDollar className="inline-block mr-1 h-5 w-5 text-yellow-600" />
                        </span>
                        <span
                          type="text"
                          className="border border-gray-300 bg-gray-50 text-gray-600 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >{`$${formPago.monto}`}</span>

                      </div>
                      <p className="text-xs text-gray-500 mt-1">Este es el saldo pendiente de la factura.</p>
                    </div>

                    {/* Cantidad entregada */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Cantidad entregada por el cliente*
                      </label>
                      <div className="relative w-full flex">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                          <HiCurrencyDollar className="inline-block mr-1 h-5 w-5 text-green-600" />
                        </span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={formPago.cantidad_entregada}
                          onChange={(e) => {
                            setFormPago({...formPago, cantidad_entregada: e.target.value});
                            limpiarError('cantidad_entregada');
                          }}
                          min="0"
                          step="0.01"
                          className={`border ${mostrarErrores && erroresCampos.cantidad_entregada ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-green-600 focus:border-green-500'} text-gray-600 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white`}
                        />
                      </div>
                      {mostrarErrores && erroresCampos.cantidad_entregada && (
                        <p className="text-sm text-red-500 mt-1">La cantidad entregada es requerida y debe ser mayor a 0</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Puede ser mayor al saldo pendiente (dar cambio)</p>
                    </div>

                    {/* Método de pago */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Método de pago*
                      </label>
                      <Select
                        aria-label="Método de pago"
                        placeholder="Seleccionar método"
                        selectedKeys={formPago.metodo_pago ? [formPago.metodo_pago] : []}
                        onSelectionChange={(keys) => {
                          const value = Array.from(keys)[0];
                          setFormPago({...formPago, metodo_pago: value});
                          limpiarError('metodo_pago');
                        }}
                        color="primary"
                        variant="bordered"
                        size="md"
                        isRequired
                        className="w-full"
                        startContent={<HiCreditCard className="text-gray-400 text-lg" />}
                        isInvalid={mostrarErrores && erroresCampos.metodo_pago}
                        errorMessage={mostrarErrores && erroresCampos.metodo_pago && "El método de pago es requerido"}
                      >
                        <SelectItem key="Efectivo" value="Efectivo">Efectivo</SelectItem>
                        <SelectItem key="Transferencia" value="Transferencia">Transferencia</SelectItem>
                        <SelectItem key="Tarjeta" value="Tarjeta">Tarjeta</SelectItem>
                        <SelectItem key="Cheque" value="Cheque">Cheque</SelectItem>
                      </Select>
                    </div>

                    {/* Fecha de pago (solo lectura) */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Fecha de pago
                      </label>
                      <div className="relative w-full flex">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                          <HiCalendar className="inline-block mr-1 h-5 w-5 text-blue-600" />
                        </span>
                        <input
                          type="text"
                          value={new Date().toLocaleDateString('es-MX', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                          readOnly
                          className="border border-gray-300 bg-gray-50 text-gray-600 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">La fecha de pago se registra automáticamente al momento actual.</p>
                    </div>
                  </div>

                  {/* Comentarios */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Comentarios*
                    </label>
                    <textarea
                      placeholder="Notas adicionales sobre el pago..."
                      value={formPago.comentario}
                      onChange={(e) => {
                        setFormPago({...formPago, comentario: e.target.value});
                        limpiarError('comentario');
                      }}
                      rows="3"
                      className={`border ${mostrarErrores && erroresCampos.comentario ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-600 focus:border-blue-500'} text-gray-600 rounded-xl pl-4 pr-4 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white resize-none`}
                    />
                    {mostrarErrores && erroresCampos.comentario && (
                      <p className="text-sm text-red-500 mt-1">El comentario es requerido</p>
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* Indicador de cambio */}
              {cambio > 0 && (
                <Card className="border border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/30">
                  <CardBody>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-warning-200 dark:bg-warning-800 rounded-lg">
                        <HiExclamation className="w-5 h-5 text-warning-600 dark:text-warning-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-warning-700 dark:text-warning-300">
                          Cambio a entregar al cliente:
                        </p>
                        <p className="text-lg font-bold text-warning-600 dark:text-warning-400">
                          ${cambio.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}
            </ModalBody>

            <ModalFooter>
              <Button 
                color="danger"
                variant="light"
                onPress={handleCerrarModal}
              >
                Cancelar
              </Button>
              <Button 
                color="primary" 
                onPress={handleConfirmar}
                isDisabled={!formPago.cantidad_entregada || !formPago.metodo_pago || !formPago.comentario}
                className="font-medium"
              >
                Continuar
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
      size="4xl"
      backdrop="blur"
      placement="center"
      scrollBehavior="inside"
      isDismissable={estadoPago !== 'procesando'}
      isKeyboardDismissDisabled={estadoPago === 'procesando'}
      classNames={{
        modal: "bg-white dark:bg-gray-800 rounded-lg shadow-lg",
        closeButton: "hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-gray-600 dark:text-white",
      }}
    >
      <ModalContent>
        {renderContenido()}
      </ModalContent>
    </Modal>
  );
};

export default ModalPago;
