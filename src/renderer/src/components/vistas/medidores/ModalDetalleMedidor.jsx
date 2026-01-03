import React from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Divider,
    Chip
} from "@nextui-org/react";
import { useClientes } from "../../../context/ClientesContext";
import { useTarifas } from "../../../context/TarifasContext";
import { HiCog, HiLocationMarker, HiCalendar, HiUser, HiMap } from "react-icons/hi";

const ModalDetalleMedidor = ({ isOpen, onClose, medidor }) => {
    const { clientes } = useClientes();
    const { tarifas } = useTarifas();

    // Encontrar información del cliente asignado si existe
    const clienteAsignado = React.useMemo(() => {
        if (!medidor?.cliente_id || !clientes.length) return null;
        return clientes.find(c => c.id === medidor.cliente_id);
    }, [medidor, clientes]);

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
            size="2xl"
            classNames={{
                backdrop: "bg-gradient-to-t mt-18 from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
                closeButton: "hover:bg-red-600 hover:text-white dark:hover:bg-red-600 text-gray-600 dark:text-white",
            }}

        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                                    <HiCog className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-bold text-gray-800 dark:text-white">
                                        Detalles del Medidor
                                    </span>
                                    <span className="text-sm font-normal text-gray-500">
                                        Serie: {medidor.numero_serie}
                                    </span>
                                </div>
                            </div>
                        </ModalHeader>
                        <Divider />
                        <ModalBody>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">

                                {/* Información General */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">
                                        Información Técnica
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-xs text-gray-400 block">Marca</span>
                                            <span className="text-sm font-medium">{medidor.marca}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-400 block">Modelo</span>
                                            <span className="text-sm font-medium">{medidor.modelo}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-400 block">Estado</span>
                                            <Chip
                                                className="mt-1"
                                                color={medidor.estado_medidor === "Activo" ? "success" : "danger"}
                                                size="sm"
                                                variant="flat"
                                            >
                                                {medidor.estado_medidor}
                                            </Chip>
                                        </div>
                                    </div>
                                </div>

                                {/* Ubicación */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">
                                        Ubicación y Fechas
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-2">
                                            <HiLocationMarker className="w-5 h-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <span className="text-xs text-gray-400 block">Dirección / Pueblo</span>
                                                <span className="text-sm font-medium">{medidor.ubicacion}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <HiMap className="w-5 h-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <span className="text-xs text-gray-400 block">Coordenadas</span>
                                                <span className="text-sm font-medium text-gray-600">
                                                    {medidor.latitud}, {medidor.longitud}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <HiCalendar className="w-5 h-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <span className="text-xs text-gray-400 block">Fecha Instalación</span>
                                                <span className="text-sm font-medium">
                                                    {new Date(medidor.fecha_instalacion).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Asignación (Full width) */}
                                <div className="md:col-span-2 mt-2 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-lg">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-full">
                                            <HiUser className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                                        </div>
                                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                            Cliente Asignado
                                        </h4>
                                    </div>

                                    {clienteAsignado ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-xs text-gray-500 block mb-0.5">Nombre del Cliente</span>
                                                <p className="text-base font-semibold text-gray-900 dark:text-white">
                                                    {clienteAsignado.nombre}
                                                </p>
                                                <Chip size="sm" color="primary" variant="flat" className="mt-1 text-xs">
                                                    ID: #{clienteAsignado.id}
                                                </Chip>
                                            </div>

                                            <div>
                                                <span className="text-xs text-gray-500 block mb-0.5">Tarifa Aplicada</span>
                                                {tarifaCliente ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                            {tarifaCliente.nombre}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {tarifaCliente.descripcion}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400 italic">No especificada</span>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="pl-2">
                                            <p className="text-sm text-gray-500 italic flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                                                Este medidor se encuentra libre (Sin asignar).
                                            </p>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="primary" onPress={onClose}>
                                Cerrar
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default ModalDetalleMedidor;
