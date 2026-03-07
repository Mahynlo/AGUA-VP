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
    Divider,
    Chip
} from "@nextui-org/react";
import { useClientes } from "../../../context/ClientesContext";
import { useTarifas } from "../../../context/TarifasContext";
import { HiCog, HiLocationMarker, HiCalendar, HiUser, HiMap, HiFingerPrint } from "react-icons/hi";

const ModalDetalleMedidor = ({ isOpen, onClose, medidor }) => {
    const { allClientes } = useClientes();
    const { tarifas } = useTarifas();

    // Encontrar información del cliente asignado si existe
    // Uses allClientes (full dataset) — NOT the paginated buffer
    const clienteAsignado = React.useMemo(() => {
        if (!medidor?.cliente_id || !allClientes.length) return null;
        return allClientes.find(c => c.id === medidor.cliente_id);
    }, [medidor, allClientes]);

    // Encontrar tarifa del cliente actual
    const tarifaCliente = React.useMemo(() => {
        if (!clienteAsignado?.id_tarifa && !clienteAsignado?.tarifa_id) return null;
        const tId = clienteAsignado.id_tarifa || clienteAsignado.tarifa_id;
        return tarifas.find(t => t.id === tId);
    }, [clienteAsignado, tarifas]);

    if (!medidor) return null;

    return (
        <Modal
            backdrop="blur"
            isOpen={isOpen}
            onClose={onClose}
            size="3xl"
            classNames={{
                backdrop: "bg-gradient-to-t mt-18 from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
                closeButton: "hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-gray-600 dark:text-white",
            }}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full">
                            <HiCog className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold text-gray-800 dark:text-white">
                                Detalle del Medidor
                            </span>
                            <span className="text-sm font-normal text-gray-500">
                                Información técnica y estado de asignación
                            </span>
                        </div>
                    </div>
                </ModalHeader>
                <Divider />
                <ModalBody className="py-6 space-y-5">

                    {/* 1. Información Técnica Principal */}
                    <Card className="border border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-900/10">
                        <CardBody className="p-5">
                            <h4 className="text-sm font-bold text-blue-700 dark:text-blue-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                                <HiFingerPrint className="w-5 h-5" /> Especificaciones Técnicas
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                                <div>
                                    <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Número de Serie</span>
                                    <span className="text-xl font-mono font-bold text-blue-800 dark:text-blue-300">
                                        {medidor.numero_serie}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Estado Actual</span>
                                    <Chip
                                        color={medidor.estado_servicio === 'Cortado' ? "danger" : (medidor.estado_medidor === "Activo" ? "success" : "danger")}
                                        variant="flat"
                                        size="sm"
                                        className="capitalize"
                                    >
                                        {medidor.estado_servicio === 'Cortado' ? 'Cortado' : medidor.estado_medidor}
                                    </Chip>
                                </div>

                                <div>
                                    <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Marca / Fabricante</span>
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        {medidor.marca}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Modelo</span>
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        {medidor.modelo}
                                    </span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 2. Ubicación e Instalación */}
                        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
                            <CardBody className="p-4">
                                <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                    <HiLocationMarker className="w-4 h-4" /> Ubicación y Registro
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-[10px] text-gray-400 block uppercase">Dirección / Pueblo</span>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 leading-snug">
                                            {medidor.ubicacion}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <div>
                                            <span className="text-[10px] text-gray-400 block uppercase">Coordenadas</span>
                                            <div className="flex items-center gap-1">
                                                <HiMap className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                                                    {medidor.latitud || "--"}, {medidor.longitud || "--"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-gray-400 block uppercase">Fecha Instalación</span>
                                            <div className="flex items-center justify-end gap-1">
                                                <HiCalendar className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                                    {medidor.fecha_instalacion
                                                        ? new Date(medidor.fecha_instalacion).toLocaleDateString('es-MX')
                                                        : "No registrada"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* 3. Cliente Asignado */}
                        <Card className={`border shadow-sm ${clienteAsignado
                            ? "border-green-200 dark:border-green-800 bg-green-50/20 dark:bg-green-900/10"
                            : "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-zinc-800/50"
                            }`}>
                            <CardBody className="p-4">
                                <h4 className={`text-xs font-bold mb-3 uppercase tracking-wider flex items-center gap-2 ${clienteAsignado ? "text-green-600" : "text-gray-400"}`}>
                                    <HiUser className="w-4 h-4" /> Asignación
                                </h4>

                                {clienteAsignado ? (
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-[10px] text-gray-400 block uppercase">Cliente Titular</span>
                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
                                                {clienteAsignado.nombre}
                                            </p>
                                        </div>

                                        <div className="flex justify-between items-center pt-2 border-t border-green-100 dark:border-green-800/30">
                                            <div>
                                                <span className="text-[10px] text-gray-400 block uppercase">Tarifa</span>
                                                <span className="text-xs font-medium text-green-700 dark:text-green-400">
                                                    {tarifaCliente?.nombre || "No asignada"}
                                                </span>
                                            </div>
                                            <Chip size="sm" color="success" variant="flat" className="h-6">
                                                ID: {clienteAsignado.id}
                                            </Chip>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-2">
                                            <HiCog className="text-gray-400 text-lg" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-500">Sin Asignar</p>
                                        <p className="text-xs text-gray-400">Este medidor está libre</p>
                                    </div>
                                )}
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

export default ModalDetalleMedidor;
