import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Chip
} from "@nextui-org/react";
import { HiUser, HiCalendar, HiLocationMarker, HiPhone, HiCurrencyDollar, HiCreditCard, HiMap, HiCog } from "react-icons/hi";

const ModalDetalleFactura = ({ isOpen, onClose, factura }) => {
  if (!factura) return null;

  const getEstadoColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case "pagado": return "success";
      case "pendiente": return "warning";
      case "vencida": 
      case "vencido": return "danger";
      default: return "default";
    }
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
            <HiCreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3>Detalle de Factura #{factura.id}</h3>
            <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
              Información completa de la factura
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
                    Nombre Completo
                  </label>
                  <div className="relative w-full flex">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                      <HiUser className="inline-block mr-1 h-5 w-5 text-blue-600" />
                    </span>
                    <input
                      type="text"
                      value={factura.cliente_nombre || ""}
                      readOnly
                      className="border border-gray-300 bg-gray-50 text-gray-600 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Teléfono
                  </label>
                  <div className="relative w-full flex">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                      <HiPhone className="inline-block mr-1 h-5 w-5 text-blue-600" />
                    </span>
                    <input
                      type="text"
                      value={factura.telefono_cliente || "No especificado"}
                      readOnly
                      className="border border-gray-300 bg-gray-50 text-gray-600 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Dirección
                  </label>
                  <div className="relative w-full flex">
                    <span className="absolute left-2 top-3 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                      <HiLocationMarker className="inline-block mr-1 h-5 w-5 text-blue-600" />
                    </span>
                    <textarea
                      value={factura.direccion_cliente || ""}
                      readOnly
                      rows="2"
                      className="border border-gray-300 bg-gray-50 text-gray-600 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                    />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Información de Facturación */}
          <Card className="border border-green-200 dark:border-green-800">
            <CardBody className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <HiCurrencyDollar className="w-5 h-5 text-green-600" />
                Información de Facturación
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Fecha de Emisión
                  </label>
                  <div className="relative w-full flex">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                      <HiCalendar className="inline-block mr-1 h-5 w-5 text-green-600" />
                    </span>
                    <input
                      type="text"
                      value={new Date(factura.fecha_emision).toLocaleDateString('es-ES')}
                      readOnly
                      className="border border-gray-300 bg-gray-50 text-gray-600 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Fecha de Vencimiento
                  </label>
                  <div className="relative w-full flex">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                      <HiCalendar className="inline-block mr-1 h-5 w-5 text-red-600" />
                    </span>
                    <input
                      type="text"
                      value={new Date(factura.fecha_vencimiento).toLocaleDateString('es-ES')}
                      readOnly
                      className="border border-gray-300 bg-gray-50 text-gray-600 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Estado
                  </label>
                  <div className="pt-2">
                    <Chip
                      size="lg"
                      color={getEstadoColor(factura.estado)}
                      variant="flat"
                      className="w-full justify-center"
                    >
                      {factura.estado}
                    </Chip>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Consumo
                  </label>
                  <div className="relative w-full flex">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                      <HiCurrencyDollar className="inline-block mr-1 h-5 w-5 text-blue-600" />
                    </span>
                    <input
                      type="text"
                      value={`${factura.consumo_m3} m³`}
                      readOnly
                      className="border border-gray-300 bg-gray-50 text-gray-600 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Total a Pagar
                  </label>
                  <div className="relative w-full flex">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                      <HiCurrencyDollar className="inline-block mr-1 h-5 w-5 text-green-600" />
                    </span>
                    <input
                      type="text"
                      value={`$${factura.total?.toFixed(2)}`}
                      readOnly
                      className="border border-gray-300 bg-gray-50 text-gray-600 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white font-bold"
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
                      value={`$${factura.saldo_pendiente?.toFixed(2)}`}
                      readOnly
                      className="border border-red-300 bg-red-50 text-red-600 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none dark:bg-red-900/20 dark:border-red-600 dark:text-red-400 font-bold"
                    />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Información Adicional */}
          <Card className="border border-purple-200 dark:border-purple-800">
            <CardBody className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <HiMap className="w-5 h-5 text-purple-600" />
                Información Adicional
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tarifa
                  </label>
                  <div className="relative w-full flex">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                      <HiCurrencyDollar className="inline-block mr-1 h-5 w-5 text-purple-600" />
                    </span>
                    <input
                      type="text"
                      value={factura.tarifa_nombre || "No especificada"}
                      readOnly
                      className="border border-gray-300 bg-gray-50 text-gray-600 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ruta
                  </label>
                  <div className="relative w-full flex">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                      <HiMap className="inline-block mr-1 h-5 w-5 text-purple-600" />
                    </span>
                    <input
                      type="text"
                      value={factura.ruta?.nombre || "No especificada"}
                      readOnly
                      className="border border-gray-300 bg-gray-50 text-gray-600 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Medidor
                  </label>
                  <div className="relative w-full flex">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                      <HiCog className="inline-block mr-1 h-5 w-5 text-purple-600" />
                    </span>
                    <input
                      type="text"
                      value={factura.medidor?.numero_serie || "No especificado"}
                      readOnly
                      className="border border-gray-300 bg-gray-50 text-gray-600 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Periodo
                  </label>
                  <div className="relative w-full flex">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                      <HiCalendar className="inline-block mr-1 h-5 w-5 text-purple-600" />
                    </span>
                    <input
                      type="text"
                      value={factura.mes_facturado || "No especificado"}
                      readOnly
                      className="border border-gray-300 bg-gray-50 text-gray-600 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Costo por m³
                  </label>
                  <div className="relative w-full flex">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2">
                      <HiCurrencyDollar className="inline-block mr-1 h-5 w-5 text-purple-600" />
                    </span>
                    <input
                      type="text"
                      value={`$${factura.costo_por_m3 || 0}`}
                      readOnly
                      className="border border-gray-300 bg-gray-50 text-gray-600 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
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

export default ModalDetalleFactura;
