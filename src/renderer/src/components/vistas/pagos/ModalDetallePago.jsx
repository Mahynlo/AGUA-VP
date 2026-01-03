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
  HiCalendar,
  HiUser
} from "react-icons/hi";

const ModalDetallePago = ({
  isOpen,
  onClose,
  pago,
  obtenerInfoPagosPorFactura,
  getMetodoColor
}) => {
  if (!pago) return null;

  // Funciones de formato
  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString("es-MX", {
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      backdrop="blur"
      scrollBehavior="inside" // El scroll lo maneja el ModalBody
      classNames={{
        backdrop: "bg-black/60 backdrop-blur-sm",
        modal: "bg-white dark:bg-zinc-900",
        closeButton:
          "text-gray-600 dark:text-gray-300 hover:bg-red-600 hover:text-white",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex gap-3 items-center text-gray-900 dark:text-gray-100">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <HiCurrencyDollar className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Detalle del Pago #{pago.id}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Información completa del registro de pago
            </p>
          </div>
        </ModalHeader>

        {/* Agregamos padding-bottom extra para que el último card no quede pegado */}
        <ModalBody className="space-y-6 pb-6">
          
          {/* INFORMACIÓN DEL PAGO */}
          {/* 'overflow-visible' evita que el Card genere su propio scroll */}
          <Card className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 overflow-visible shadow-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-b border-gray-200 dark:border-zinc-700">
              <h4 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-100">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                  <HiCurrencyDollar className="text-white" />
                </div>
                Información del Pago
              </h4>
            </CardHeader>

            {/* 'overflow-visible' aquí es clave para que el contenido empuje hacia abajo */}
            <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-visible">
              <Info label="Fecha de Pago">
                {formatFecha(pago.fecha_pago)}
              </Info>

              <Info label="Método">
                <Chip
                  color={getMetodoColor(pago.metodo_pago)}
                  variant="flat"
                  size="sm"
                >
                  {pago.metodo_pago}
                </Chip>
              </Info>

              <Info label="Monto Aplicado">
                <span className="text-green-600 dark:text-green-400 font-bold text-lg">
                  ${pago.monto?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </span>
              </Info>

              <Info label="Cantidad Entregada">
                <span className="font-semibold">
                  ${pago.cantidad_entregada?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </span>
              </Info>

              <Info label="Cambio">
                <span
                  className={`font-bold ${
                    pago.cambio > 0
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  ${pago.cambio?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </span>
              </Info>

              {pago.comentario && (
                <Info label="Comentario" colSpan>
                  <span className="italic text-gray-600 dark:text-gray-300">
                    "{pago.comentario}"
                  </span>
                </Info>
              )}
            </CardBody>
          </Card>

          {/* INFORMACIÓN DE LA FACTURA ASOCIADA */}
          <Card className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 overflow-visible shadow-sm">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-b border-gray-200 dark:border-zinc-700">
              <h4 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-100">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <HiCreditCard className="text-white" />
                </div>
                Información de la Factura (#{pago.factura_id})
              </h4>
            </CardHeader>
            <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-visible">
              <Info label="Estado Factura">
                <Chip
                  color={pago.estado_factura === "Pagado" ? "success" : "warning"}
                  variant="flat"
                  size="md"
                >
                  {pago.estado_factura}
                </Chip>
              </Info>
              <Info label="Periodo">
                {pago.periodo_facturado}
              </Info>
              <Info label="Fecha Emisión">
                {formatFecha(pago.fecha_emision_factura)}
              </Info>
              <Info label="Total Factura">
                ${pago.total_factura?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </Info>
              <Info label="Saldo Pendiente">
                 <span
                  className={`font-bold ${
                    pago.saldo_pendiente_factura > 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-green-600 dark:text-green-400"
                  }`}
                >
                  ${pago.saldo_pendiente_factura?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </span>
              </Info>
            </CardBody>
          </Card>

           {/* PAGOS MÚLTIPLES (CONDICIONAL) */}
           {(() => {
              const infoPagosFactura = obtenerInfoPagosPorFactura(pago.factura_id);
              if (infoPagosFactura && infoPagosFactura.total > 1) {
                return (
                  <Card className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 overflow-visible shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 border-b border-gray-200 dark:border-zinc-700">
                      <h4 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-100">
                        <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                          <HiCash className="text-white" />
                        </div>
                        Historial de Pagos ({infoPagosFactura.total})
                      </h4>
                    </CardHeader>
                    <CardBody className="space-y-3 overflow-visible">
                      {infoPagosFactura.pagosOrdenados.map((pagoItem, index) => (
                         <div
                            key={pagoItem.id}
                            className={`p-3 rounded-lg border flex flex-col md:flex-row justify-between items-center gap-4 ${
                                pagoItem.id === pago.id
                                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                : "bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700"
                            }`}
                         >
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-gray-400">#{index + 1}</span>
                                <div>
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Pago #{pagoItem.id}</p>
                                    <p className="text-xs text-gray-500">{formatFecha(pagoItem.fecha_pago)}</p>
                                </div>
                            </div>
                            
                            <Chip size="sm" variant="flat" color={getMetodoColor(pagoItem.metodo_pago)}>
                                {pagoItem.metodo_pago}
                            </Chip>

                            <div className="text-right">
                                <p className="text-sm font-bold text-green-600 dark:text-green-400">
                                    ${pagoItem.monto?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                         </div>
                      ))}
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-zinc-700 flex justify-end">
                          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                              Total Pagado: <span className="text-green-600 dark:text-green-400 ml-1">${infoPagosFactura.montoTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                          </p>
                      </div>
                    </CardBody>
                  </Card>
                );
              }
              return null;
            })()}


          {/* CLIENTE */}
          <Card className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 overflow-visible shadow-sm">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 border-b border-gray-200 dark:border-zinc-700">
              <h4 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-100">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg">
                  <HiUser className="text-white" />
                </div>
                Información del Cliente
              </h4>
            </CardHeader>
            <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-visible">
              <Info label="Nombre">{pago.cliente_nombre}</Info>
              <Info label="Dirección">{pago.direccion_cliente}</Info>
              <Info label="Medidor">{pago.medidor_numero_serie}</Info>
              <Info label="Consumo Facturado">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                  {pago.consumo_m3} m³
                </span>
              </Info>
            </CardBody>
          </Card>

          {/* REGISTRO */}
          <Card className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 overflow-visible shadow-sm">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30 border-b border-gray-200 dark:border-zinc-700">
              <h4 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-100">
                <div className="p-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg">
                  <HiCalendar className="text-white" />
                </div>
                Auditoría del Registro
              </h4>
            </CardHeader>
            <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-visible">
              <Info label="Registrado Por">{pago.modificado_por_nombre}</Info>
              <Info label="Fecha Registro">{formatFechaHora(pago.fecha_creacion)}</Info>
              <Info label="Fecha Lectura">{formatFecha(pago.fecha_lectura)}</Info>
            </CardBody>
          </Card>

        </ModalBody>

        <ModalFooter>
          <Button color="primary" onPress={onClose}>
            Cerrar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Componente reutilizable INFO
const Info = ({ label, children, colSpan }) => (
  <div className={`space-y-1 ${colSpan ? "md:col-span-2" : ""}`}>
    <p className="text-xs uppercase text-gray-500 dark:text-gray-400">
      {label}
    </p>
    <div className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-3 text-gray-800 dark:text-gray-100">
      {children}
    </div>
  </div>
);

export default ModalDetallePago;
