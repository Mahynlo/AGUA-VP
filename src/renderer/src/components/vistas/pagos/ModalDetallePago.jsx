import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Button,
  Card,
  CardHeader,
  CardBody,
  Chip
} from "@nextui-org/react";
import { 
  HiCurrencyDollar, 
  HiCash, 
  HiCreditCard, 
  HiCalendar 
} from "react-icons/hi";

const ModalDetallePago = ({ 
  isOpen, 
  onClose, 
  pago, 
  obtenerInfoPagosPorFactura,
  getMetodoColor 
}) => {
  // Función para formatear fecha
  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Función para formatear fecha y hora
  const formatFechaHora = (fecha) => {
    return new Date(fecha).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="4xl"
      backdrop="blur"
      placement="center"
      scrollBehavior="inside"
      classNames={{
        modal: "bg-white dark:bg-gray-800 rounded-lg shadow-lg",
        closeButton: "hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-gray-600 dark:text-white",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-3 text-xl font-bold">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <HiCurrencyDollar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3>Detalle del Pago #{pago?.id}</h3>
            <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
              Información completa del registro de pago
            </p>
          </div>
        </ModalHeader>
        
        <ModalBody className="space-y-6">
          {pago && (
            <div className="space-y-6">
              {/* Información del Pago */}
              <Card className="shadow-lg border border-gray-200/50 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 border-b border-gray-200/30">
                  <h4 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                      <HiCurrencyDollar className="w-5 h-5 text-white" />
                    </div>
                    Información del Pago
                  </h4>
                </CardHeader>
                <CardBody className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">ID del Pago</p>
                      <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-3 border border-blue-200/50">
                        <p className="font-bold text-blue-700 font-mono text-lg">#{pago.id}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Fecha de Pago</p>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="font-semibold text-gray-800">{formatFecha(pago.fecha_pago)}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Método de Pago</p>
                      <div className="flex justify-start">
                        <Chip 
                          color={getMetodoColor(pago.metodo_pago)}
                          variant="flat"
                          className="font-semibold"
                          size="lg"
                        >
                          {pago.metodo_pago}
                        </Chip>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Monto Aplicado</p>
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                        <p className="font-bold text-green-700 text-xl">
                          ${pago.monto?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Cantidad Entregada</p>
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <p className="font-bold text-blue-700 text-xl">
                          ${pago.cantidad_entregada?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Cambio</p>
                      <div className={`rounded-lg p-3 border ${
                        pago.cambio > 0 
                          ? 'bg-orange-50 border-orange-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <p className={`font-bold text-xl ${
                          pago.cambio > 0 ? 'text-orange-700' : 'text-gray-500'
                        }`}>
                          ${pago.cambio?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {pago.comentario && (
                    <div className="mt-6">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Comentario</p>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-gray-700 italic">"{pago.comentario}"</p>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Información de Múltiples Pagos (si aplica) */}
              {(() => {
                const infoPagosFactura = obtenerInfoPagosPorFactura(pago.factura_id);
                if (infoPagosFactura.total > 1) {
                  return (
                    <Card className="shadow-lg border border-gray-200/50 bg-white/80 backdrop-blur-sm">
                      <CardHeader className="bg-gradient-to-r from-orange-50/80 to-red-50/80 border-b border-gray-200/30">
                        <h4 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                          <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                            <HiCash className="w-5 h-5 text-white" />
                          </div>
                          Pagos Múltiples de esta Factura ({infoPagosFactura.total} pagos)
                        </h4>
                      </CardHeader>
                      <CardBody className="p-6">
                        <div className="space-y-4">
                          {infoPagosFactura.pagosOrdenados.map((pagoItem, index) => (
                            <div 
                              key={pagoItem.id} 
                              className={`p-4 rounded-xl border-l-4 transition-all duration-200 ${
                                pagoItem.id === pago.id 
                                  ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 shadow-lg' 
                                  : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                              }`}
                            >
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-500 font-medium mb-1">Pago #{index + 1}</p>
                                  <p className="font-bold text-gray-800 font-mono">#{pagoItem.id}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 font-medium mb-1">Fecha</p>
                                  <p className="font-semibold text-gray-800">{formatFecha(pagoItem.fecha_pago)}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 font-medium mb-1">Monto</p>
                                  <p className="font-bold text-green-600 text-lg">
                                    ${pagoItem.monto?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500 font-medium mb-1">Método</p>
                                  <Chip size="sm" color={getMetodoColor(pagoItem.metodo_pago)} variant="flat">
                                    {pagoItem.metodo_pago}
                                  </Chip>
                                </div>
                              </div>
                              {pagoItem.comentario && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-xs text-gray-500 font-medium mb-1">Comentario:</p>
                                  <p className="text-sm italic text-gray-700">"{pagoItem.comentario}"</p>
                                </div>
                              )}
                            </div>
                          ))}
                          <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-green-700 text-lg">Total Pagado en esta Factura:</span>
                              <span className="font-bold text-green-700 text-2xl">
                                ${infoPagosFactura.montoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  );
                }
                return null;
              })()}

              {/* Información del Cliente */}
              <Card className="shadow-lg border border-gray-200/50 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-indigo-50/80 to-blue-50/80 border-b border-gray-200/30">
                  <h4 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg">
                      <HiCash className="w-5 h-5 text-white" />
                    </div>
                    Información del Cliente
                  </h4>
                </CardHeader>
                <CardBody className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Nombre del Cliente</p>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="font-semibold text-gray-800 text-lg">{pago.cliente_nombre}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Dirección</p>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="font-semibold text-gray-800">{pago.direccion_cliente}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Número de Medidor</p>
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <p className="font-bold text-blue-700 font-mono text-lg">{pago.medidor_numero_serie}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Consumo Facturado</p>
                      <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-200">
                        <p className="font-bold text-cyan-700 text-lg">{pago.consumo_m3} m³</p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Información de la Factura */}
              <Card className="shadow-lg border border-gray-200/50 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-purple-50/80 to-pink-50/80 border-b border-gray-200/30">
                  <h4 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                      <HiCreditCard className="w-5 h-5 text-white" />
                    </div>
                    Información de la Factura
                  </h4>
                </CardHeader>
                <CardBody className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Número de Factura</p>
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <p className="font-bold text-purple-700 font-mono text-lg">#{pago.factura_id}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Estado</p>
                      <div className="flex justify-start">
                        <Chip 
                          color={pago.estado_factura === 'Pagado' ? 'success' : 'warning'}
                          variant="flat"
                          className="font-semibold"
                          size="lg"
                        >
                          {pago.estado_factura}
                        </Chip>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Período Facturado</p>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="font-semibold text-gray-800">{pago.periodo_facturado}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Factura</p>
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <p className="font-bold text-blue-700 text-lg">
                          ${pago.total_factura?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Saldo Pendiente</p>
                      <div className={`rounded-lg p-3 border ${
                        pago.saldo_pendiente_factura > 0 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-green-50 border-green-200'
                      }`}>
                        <p className={`font-bold text-lg ${
                          pago.saldo_pendiente_factura > 0 ? 'text-red-700' : 'text-green-700'
                        }`}>
                          ${pago.saldo_pendiente_factura?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Fecha de Emisión</p>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="font-semibold text-gray-800">{formatFecha(pago.fecha_emision_factura)}</p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Información de Registro */}
              <Card className="shadow-lg border border-gray-200/50 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-teal-50/80 to-cyan-50/80 border-b border-gray-200/30">
                  <h4 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                    <div className="p-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg">
                      <HiCalendar className="w-5 h-5 text-white" />
                    </div>
                    Información de Registro
                  </h4>
                </CardHeader>
                <CardBody className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Registrado por</p>
                      <div className="bg-teal-50 rounded-lg p-3 border border-teal-200">
                        <p className="font-semibold text-teal-700">{pago.modificado_por_nombre}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Fecha de Registro</p>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="font-semibold text-gray-800">
                          {formatFechaHora(pago.fecha_creacion)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Fecha de Lectura</p>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="font-semibold text-gray-800">{formatFecha(pago.fecha_lectura)}</p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </ModalBody>
        
        <ModalFooter>
          <Button 
            color="primary" 
            onPress={onClose}
            className="font-medium"
          >
            Cerrar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ModalDetallePago;
