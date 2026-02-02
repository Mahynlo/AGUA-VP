import React from "react";
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
  HiUser,
  HiCreditCard,
  HiCog,
  HiCalendar,
  HiCurrencyDollar,
  HiLocationMarker
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
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
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
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full">
              <HiCreditCard className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-800 dark:text-white">
                Detalle de Factura #{factura.id}
              </span>
              <span className="text-sm font-normal text-gray-500">
                Información detallada del cobro y estado
              </span>
            </div>
          </div>
        </ModalHeader>
        <Divider />
        <ModalBody className="py-6 space-y-5">

          {/* 1. Información Principal de la Factura */}
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardBody className="p-5">
              <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                <HiCreditCard className="w-4 h-4" /> Información General
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                <div>
                  <span className="text-xs text-gray-400 block mb-1">Periodo Facturado</span>
                  <span className="text-base font-semibold capitalize">{factura.mes_facturado || "No especificado"}</span>
                </div>

                <div>
                  <span className="text-xs text-gray-400 block mb-1">Fecha de Vencimiento</span>
                  <div className="flex items-center gap-2">
                    <HiCalendar className="text-gray-400" />
                    <span className={`text-sm font-medium ${factura.estado?.toLowerCase().includes('vencid') ? 'text-red-500' : ''
                      }`}>
                      {formatFecha(factura.fecha_vencimiento)}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-gray-400 block mb-1">Estado de Pago</span>
                  <Chip
                    color={getEstadoColor(factura.estado)}
                    variant="flat"
                    size="sm"
                    className="capitalize"
                  >
                    {factura.estado}
                  </Chip>
                </div>

                <div>
                  <span className="text-xs text-gray-400 block mb-1">Consumo Registrado</span>
                  <span className="text-lg font-bold text-cyan-600 dark:text-cyan-400">
                    {factura.consumo_m3} <span className="text-sm font-normal text-gray-500">m³</span>
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* 2. Desglose Económico */}
          <Card className="border border-green-200 dark:border-green-800 bg-green-50/40 dark:bg-green-900/10">
            <CardBody className="p-5">
              <h4 className="text-sm font-bold text-green-700 dark:text-green-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                <HiCurrencyDollar className="w-5 h-5" /> Detalles Económicos
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg border border-green-100 dark:border-green-800/30">
                  <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Total Facturado</span>
                  <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                    ${factura.total?.toFixed(2)}
                  </span>
                </div>
                <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg border border-red-100 dark:border-red-800/30">
                  <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Saldo Pendiente</span>
                  <span className={`text-2xl font-bold ${factura.saldo_pendiente > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                    }`}>
                    ${factura.saldo_pendiente?.toFixed(2)}
                  </span>
                  {factura.saldo_pendiente <= 0 && (
                    <span className="text-xs text-green-600 ml-2 font-medium">(Pagado)</span>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* 3. Cliente y Medidor */}
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
                      {factura.cliente_nombre}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase">Dirección</span>
                    <div className="flex items-start gap-1">
                      <HiLocationMarker className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-gray-600 dark:text-gray-400 leading-snug">
                        {factura.direccion_cliente}
                      </span>
                    </div>
                  </div>
                  {factura.telefono_cliente && (
                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase">Teléfono</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {factura.telefono_cliente}
                      </span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Información del Medidor */}
            <Card className="border border-blue-200 dark:border-blue-800 bg-blue-50/20 dark:bg-blue-900/10">
              <CardBody className="p-4">
                <h4 className="text-xs font-bold text-blue-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <HiCog className="w-4 h-4" /> Datos del Servicio
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase">Medidor</span>
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300 font-mono">
                      {factura.medidor?.numero_serie || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase">Tarifa Aplicada</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {factura.tarifa_nombre || "No especificada"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase">Ruta de Lectura</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {factura.ruta?.nombre || "No asignada"}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

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

export default ModalDetalleFactura;

