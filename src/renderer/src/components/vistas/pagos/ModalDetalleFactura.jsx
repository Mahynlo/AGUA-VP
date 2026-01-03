import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip
} from "@nextui-org/react";
import {
  HiUser,
  HiCreditCard,
  HiCog
} from "react-icons/hi";

const ModalDetalleFactura = ({ isOpen, onClose, factura }) => {
  if (!factura) return null;

  const getEstadoColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case "pagado":
        return "success";
      case "pendiente":
        return "warning";
      case "vencida":
      case "vencido":
        return "danger";
      default:
        return "default";
    }
  };

  const formatFecha = (fecha) =>
    new Date(fecha).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      backdrop="blur"
      scrollBehavior="inside"
      classNames={{
        backdrop: "bg-black/60 backdrop-blur-sm",
        modal: "bg-white dark:bg-zinc-900",
        closeButton:
          "text-gray-600 dark:text-gray-300 hover:bg-red-600 hover:text-white",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex gap-3 items-center text-gray-900 dark:text-gray-100">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <HiCreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold">
              Detalle de Factura #{factura.id}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Información completa de la factura
            </p>
          </div>
        </ModalHeader>

        <ModalBody className="space-y-6">

          {/* FACTURA */}
          <Card className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-b border-gray-200 dark:border-zinc-700">
              <h4 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-100">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <HiCreditCard className="text-white" />
                </div>
                Información de la Factura
              </h4>
            </CardHeader>

            <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Info label="Estado">
                <Chip
                  color={getEstadoColor(factura.estado)}
                  variant="flat"
                  size="lg"
                >
                  {factura.estado}
                </Chip>
              </Info>

              <Info label="Periodo">
                {factura.mes_facturado || "No especificado"}
              </Info>

              <Info label="Consumo">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                  {factura.consumo_m3} m³
                </span>
              </Info>

              <Info label="Total">
                <span className="text-green-600 dark:text-green-400 font-bold text-lg">
                  ${factura.total?.toFixed(2)}
                </span>
              </Info>

              <Info label="Saldo Pendiente">
                <span
                  className={`font-bold ${
                    factura.saldo_pendiente > 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-green-600 dark:text-green-400"
                  }`}
                >
                  ${factura.saldo_pendiente?.toFixed(2)}
                </span>
              </Info>

              <Info label="Vencimiento">
                {formatFecha(factura.fecha_vencimiento)}
              </Info>
            </CardBody>
          </Card>

          {/* CLIENTE */}
          <Card className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 border-b border-gray-200 dark:border-zinc-700">
              <h4 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-100">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg">
                  <HiUser className="text-white" />
                </div>
                Información del Cliente
              </h4>
            </CardHeader>

            <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Info label="Cliente">{factura.cliente_nombre}</Info>
              <Info label="Teléfono">
                {factura.telefono_cliente || "No especificado"}
              </Info>
              <Info label="Dirección" colSpan>
                {factura.direccion_cliente}
              </Info>
            </CardBody>
          </Card>

          {/* MEDIDOR */}
          <Card className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30 border-b border-gray-200 dark:border-zinc-700">
              <h4 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-100">
                <div className="p-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg">
                  <HiCog className="text-white" />
                </div>
                Medidor y Tarifa
              </h4>
            </CardHeader>

            <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Info label="Medidor">
                {factura.medidor?.numero_serie || "No especificado"}
              </Info>
              <Info label="Tarifa">
                {factura.tarifa_nombre || "No especificada"}
              </Info>
              <Info label="Ruta">
                {factura.ruta?.nombre || "No especificada"}
              </Info>
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

export default ModalDetalleFactura;

