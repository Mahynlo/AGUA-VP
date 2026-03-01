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
import { HiUser, HiPhone, HiMail, HiLocationMarker, HiMap, HiCurrencyDollar, HiCog, HiHashtag } from "react-icons/hi";
import { useMedidores } from "../../../context/MedidoresContext";
import { useTarifas } from "../../../context/TarifasContext";

export default function ModalDetalleCliente({ isOpen, onClose, cliente }) {
    const { medidores } = useMedidores();
    const { tarifas } = useTarifas();

    if (!cliente) return null;

    // Resolve Relationships
    const medidoresAsignados = medidores.filter(m => m.cliente_id === cliente.id);
    const tarifaAsignada = tarifas.find(t => t.id === (cliente.id_tarifa || cliente.tarifa_id));

    return (
        <Modal
            backdrop="blur"
            isOpen={isOpen}
            onClose={onClose}
            size="3xl"
            scrollBehavior="inside"
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
                                    <HiUser className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-bold text-gray-800 dark:text-white">
                                        Detalles del Cliente
                                    </span>
                                    <span className="text-sm font-normal text-gray-500">
                                        ID Cliente: {cliente.id}
                                    </span>
                                </div>
                            </div>
                        </ModalHeader>
                        <Divider />
                        <ModalBody className="py-4">
                            <div className="space-y-4">

                                {/* 1. Información Personal */}
                                <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <CardBody>
                                        <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                                            <HiUser className="w-4 h-4" /> Información Personal
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-xs text-gray-400 block mb-1">Nombre Completo</span>
                                                <span className="text-base font-semibold">{cliente.nombre}</span>
                                            </div>

                                            <div className="flex items-start gap-2">
                                                <HiMail className="w-4 h-4 text-gray-400 mt-0.5" />
                                                <div>
                                                    <span className="text-xs text-gray-400 block mb-1">Correo Electrónico</span>
                                                    <span className="text-sm font-medium">{cliente.email || cliente.correo || "No registrado"}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-2">
                                                <HiPhone className="w-4 h-4 text-gray-400 mt-0.5" />
                                                <div>
                                                    <span className="text-xs text-gray-400 block mb-1">Teléfono</span>
                                                    <span className="text-sm font-medium">{cliente.telefono || "No registrado"}</span>
                                                </div>
                                            </div>

                                            {cliente.numero_predio && (
                                                <div className="flex items-start gap-2">
                                                    <HiHashtag className="w-4 h-4 text-gray-400 mt-0.5" />
                                                    <div>
                                                        <span className="text-xs text-gray-400 block mb-1">Número de Predio</span>
                                                        <span className="text-sm font-medium font-mono">{cliente.numero_predio}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>

                                {/* 2. Dirección y Ubicación */}
                                <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <CardBody>
                                        <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                                            <HiLocationMarker className="w-4 h-4" /> Dirección
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                                            <div className="col-span-1 md:col-span-2">
                                                <span className="text-xs text-gray-400 block mb-1">Calle y Número</span>
                                                <span className="text-sm font-medium">{cliente.direccion}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-400 block mb-1">Colonia</span>
                                                <span className="text-sm font-medium">{cliente.colonia}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-400 block mb-1">Ciudad/Localidad</span>
                                                <span className="text-sm font-medium">{cliente.ciudad}</span>
                                            </div>
                                            {cliente.referencia && (
                                                <div className="col-span-1 md:col-span-2 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                                    <span className="text-xs text-gray-400 block mb-1">Referencia</span>
                                                    <span className="text-sm text-gray-600 italic">{cliente.referencia}</span>
                                                </div>
                                            )}
                                            {cliente.latitud && (
                                                <div className="col-span-1 md:col-span-2 flex items-center gap-2 text-blue-600">
                                                    <HiMap className="w-4 h-4" />
                                                    <span className="text-xs font-mono">
                                                        {cliente.latitud}, {cliente.longitud}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>

                                {/* 3. Tarifa y Estado */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card className="border border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10">
                                        <CardBody>
                                            <h4 className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-2">
                                                <HiCurrencyDollar className="w-5 h-5 text-green-600" /> Tarifa
                                            </h4>
                                            {tarifaAsignada ? (
                                                <div>
                                                    <p className="font-bold text-green-700 dark:text-green-400">{tarifaAsignada.nombre}</p>
                                                    <p className="text-xs text-green-600/80">{tarifaAsignada.descripcion}</p>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 italic">Sin tarifa asignada</p>
                                            )}
                                        </CardBody>
                                    </Card>

                                    <Card className="border border-gray-200 dark:border-gray-700">
                                        <CardBody className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-gray-500">Estado del Cliente</span>
                                            <Chip
                                                color={cliente.estado_cliente === "Activo" ? "success" : "danger"}
                                                variant="flat"
                                                className="capitalize"
                                            >
                                                {cliente.estado_cliente || "Desconocido"}
                                            </Chip>
                                        </CardBody>
                                    </Card>
                                </div>

                                {/* 4. Medidores Asignados */}
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-full">
                                                <HiCog className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                                            </div>
                                            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                Medidores Asignados
                                            </h4>
                                        </div>
                                        {medidoresAsignados.length > 0 ? (
                                            <Chip size="sm" color="primary" variant="solid">
                                                {medidoresAsignados.length} {medidoresAsignados.length === 1 ? 'Medidor' : 'Medidores'}
                                            </Chip>
                                        ) : (
                                            <Chip size="sm" color="default" variant="flat">Sin Medidores</Chip>
                                        )}
                                    </div>

                                    {medidoresAsignados.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-3">
                                            {medidoresAsignados.map((medidor) => (
                                                <Card key={medidor.id} className="border border-blue-200 dark:border-blue-800 shadow-none bg-white dark:bg-neutral-800">
                                                    <CardBody className="p-3">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <span className="text-[10px] text-gray-500 block uppercase tracking-wide">Número de Serie</span>
                                                                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300 font-mono">
                                                                        {medidor.numero_serie}
                                                                    </span>
                                                                </div>
                                                                <Chip
                                                                    size="sm"
                                                                    className="h-5 text-[10px]"
                                                                    color={medidor.estado_servicio === 'Cortado' ? 'danger' : (medidor.estado_medidor === 'Activo' ? 'success' : 'default')}
                                                                    variant="flat"
                                                                >
                                                                    {medidor.estado_servicio === 'Cortado' ? 'Cortado' : medidor.estado_medidor}
                                                                </Chip>
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] text-gray-500 block uppercase tracking-wide">Modelo / Marca</span>
                                                                <span className="text-xs text-gray-700 dark:text-gray-300">
                                                                    {medidor.marca} - {medidor.modelo}
                                                                </span>
                                                            </div>
                                                            <div className="sm:col-span-2">
                                                                <span className="text-[10px] text-gray-500 block uppercase tracking-wide">Ubicación</span>
                                                                <span className="text-xs text-gray-600 dark:text-gray-400 italic truncate block">
                                                                    {medidor.ubicacion}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 pl-2 italic">
                                            El cliente no tiene medidores vinculados actualmente.
                                        </p>
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
}
