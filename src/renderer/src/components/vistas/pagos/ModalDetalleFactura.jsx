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
  Chip
} from "@nextui-org/react";
import {
  HiUser,
  HiCreditCard,
  HiCog,
  HiCalendar,
  HiCurrencyDollar,
  HiLocationMarker,
  HiPhone,
  HiCash,
  HiChartBar
} from "react-icons/hi";

const ModalDetalleFactura = ({ isOpen, onClose, factura }) => {
  if (!factura) return null;

  const getEstadoConfig = (estado) => {
    switch (estado?.toLowerCase()) {
      case "pagado":
        return { color: "success", label: "Pagada", bg: "bg-green-500/10 dark:bg-green-500/20", iconText: "text-green-600 dark:text-green-400" };
      case "pendiente":
        return { color: "warning", label: "Pendiente", bg: "bg-orange-500/10 dark:bg-orange-500/20", iconText: "text-orange-600 dark:text-orange-400" };
      case "vencida":
      case "vencido":
        return { color: "danger", label: "Vencida", bg: "bg-red-500/10 dark:bg-red-500/20", iconText: "text-red-600 dark:text-red-400" };
      default:
        return { color: "default", label: estado || "Desconocido", bg: "bg-slate-500/10 dark:bg-slate-500/20", iconText: "text-slate-600 dark:text-slate-400" };
    }
  };

  const estadoConfig = getEstadoConfig(factura.estado);

  const parseFechaLocal = (valor) => {
    if (!valor) return null;
    const match = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
    const parsed = new Date(valor);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatFecha = (fecha) => {
    if (!fecha) return "No registrada";
    const parsedDate = parseFechaLocal(fecha);
    if (!parsedDate) return "No registrada";
    return parsedDate.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Modal
      backdrop="blur"
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
      classNames={{
        base: "bg-white dark:bg-zinc-900 shadow-2xl",
        backdrop: "bg-zinc-900/50 backdrop-blur-sm",
        header: "border-b border-slate-100 dark:border-zinc-800",
        footer: "border-t border-slate-100 dark:border-zinc-800",
        closeButton: "hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 text-slate-400 dark:text-zinc-500 transition-colors",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            {/* HEADER */}
            <ModalHeader className="flex flex-col gap-1 pt-6 px-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${estadoConfig.bg} ${estadoConfig.iconText}`}>
                    <HiCreditCard className="w-7 h-7" />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                      Detalle de Factura
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                        Folio: #{factura.id}
                      </span>
                    </div>
                  </div>
                </div>
                <Chip
                    color={estadoConfig.color}
                    variant="flat"
                    className="h-7 px-2 text-xs font-black uppercase tracking-wider"
                >
                    {estadoConfig.label}
                </Chip>
              </div>
            </ModalHeader>

            {/* BODY */}
            <ModalBody className="py-6 px-4 sm:px-6 custom-scrollbar space-y-6">

              {/* 1. Resumen Económico Principal */}
              <Card className="border-none shadow-none bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                <CardBody className="p-5">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <HiCurrencyDollar className="w-4 h-4" /> Desglose Económico
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Total Facturado */}
                    <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700/50 flex flex-col justify-center">
                      <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Total Facturado</span>
                      <span className="text-3xl font-black text-slate-800 dark:text-zinc-100 tracking-tight">
                        ${factura.total?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Saldo Pendiente */}
                    <div className={`p-4 rounded-xl border flex flex-col justify-center ${
                        factura.saldo_pendiente > 0 
                            ? "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30" 
                            : "bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30"
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${factura.saldo_pendiente > 0 ? "text-red-700/60 dark:text-red-500/60" : "text-green-700/60 dark:text-green-500/60"}`}>
                            Saldo Pendiente
                        </span>
                        {factura.saldo_pendiente <= 0 && (
                            <HiCash className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <span className={`text-3xl font-black tracking-tight ${factura.saldo_pendiente > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                        ${factura.saldo_pendiente?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                  </div>
                </CardBody>
              </Card>

              {/* 2. Información General (Fechas y Consumo) */}
              <Card className="border-none shadow-none bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                <CardBody className="p-5">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <HiCalendar className="w-4 h-4" /> Fechas y Periodo
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-6">
                    
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Periodo Facturado</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-zinc-100 capitalize">
                        {factura.mes_facturado || "No especificado"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Vencimiento</span>
                      <span className={`text-sm font-bold ${factura.estado?.toLowerCase().includes('vencid') ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-zinc-100'}`}>
                        {formatFecha(factura.fecha_vencimiento)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Consumo Registrado</span>
                      <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/30 w-fit">
                        <HiChartBar className="w-3.5 h-3.5" />
                        <span className="text-sm font-bold font-mono">
                            {factura.consumo_m3} <span className="text-[10px] font-semibold opacity-70">m³</span>
                        </span>
                      </div>
                    </div>

                  </div>
                </CardBody>
              </Card>

              {/* 3. Cliente y Medidor (2 Columnas) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Datos del Cliente */}
                <Card className="border-none shadow-none bg-slate-50 dark:bg-zinc-800/50 rounded-2xl h-full">
                  <CardBody className="p-5 flex flex-col">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                      <HiUser className="w-4 h-4" /> Datos del Cliente
                    </h4>
                    <div className="space-y-4 flex-1">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Nombre Completo</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-zinc-100 block">
                          {factura.cliente_nombre}
                        </span>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <HiLocationMarker className="w-4 h-4 text-slate-400 dark:text-zinc-500 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                           <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Dirección</span>
                           <span className="text-sm font-medium text-slate-700 dark:text-zinc-300 leading-snug block">
                              {factura.direccion_cliente || "No registrada"}
                           </span>
                        </div>
                      </div>

                      {factura.telefono_cliente && (
                        <div className="flex items-center gap-2">
                            <HiPhone className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" />
                            <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                                {factura.telefono_cliente}
                            </span>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>

                {/* Información del Medidor y Tarifa */}
                <Card className="border border-blue-200/60 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl h-full shadow-sm">
                  <CardBody className="p-5 flex flex-col">
                    <h4 className="text-xs font-bold text-blue-700/60 dark:text-blue-500/60 mb-4 uppercase tracking-wider flex items-center gap-2">
                      <HiCog className="w-4 h-4" /> Datos del Servicio
                    </h4>
                    <div className="space-y-4 flex-1">
                      <div>
                        <span className="text-[11px] font-bold text-blue-700/60 dark:text-blue-500/60 uppercase tracking-wider block mb-1">Medidor</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-zinc-100 font-mono bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-blue-100 dark:border-zinc-700 w-fit block">
                          {factura.medidor?.numero_serie || "N/A"}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-[11px] font-bold text-blue-700/60 dark:text-blue-500/60 uppercase tracking-wider block mb-1">Tarifa Aplicada</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-zinc-300 block">
                          {factura.tarifa_nombre || "No especificada"}
                        </span>
                      </div>

                      <div className="mt-auto pt-4 border-t border-blue-100/50 dark:border-blue-900/30">
                        <span className="text-[11px] font-bold text-blue-700/60 dark:text-blue-500/60 uppercase tracking-wider block mb-1">Ruta de Lectura</span>
                        <span className="text-xs font-medium text-slate-600 dark:text-zinc-400 block truncate">
                          {factura.ruta?.nombre || "Sin ruta asignada"}
                        </span>
                      </div>
                    </div>
                  </CardBody>
                </Card>

              </div>
            </ModalBody>
            
            <ModalFooter className="px-6 py-4">
              <Button 
                  color="default" 
                  variant="light" 
                  onPress={onClose}
                  className="font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                  Cerrar
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ModalDetalleFactura;

