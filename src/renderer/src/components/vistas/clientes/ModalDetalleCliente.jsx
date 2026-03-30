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
    HiPhone, 
    HiMail, 
    HiLocationMarker, 
    HiMap, 
    HiCurrencyDollar, 
    HiCog, 
    HiHashtag,
    HiInbox
} from "react-icons/hi";
import { useMedidores } from "../../../context/MedidoresContext";
import { useTarifas } from "../../../context/TarifasContext";

export default function ModalDetalleCliente({ isOpen, onClose, cliente }) {
    const { allMedidores } = useMedidores();
    const { tarifas } = useTarifas();

    if (!cliente) return null;

    // Resolver Relaciones
    const medidoresAsignados = allMedidores.filter(m => m.cliente_id === cliente.id);
    const tarifaAsignada = tarifas.find(t => t.id === (cliente.id_tarifa || cliente.tarifa_id));

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
                        <ModalHeader className="flex flex-col gap-1 pt-6 px-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl">
                                    <HiUser className="w-7 h-7" />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                                        Detalles del Cliente
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                            ID: {cliente.id}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-600"></span>
                                        <Chip 
                                            size="sm" 
                                            color={cliente.estado_cliente === "Activo" ? "success" : "danger"} 
                                            variant="flat" 
                                            className="h-5 px-1 text-[10px] font-bold uppercase tracking-wider"
                                        >
                                            {cliente.estado_cliente || "Desconocido"}
                                        </Chip>
                                    </div>
                                </div>
                            </div>
                        </ModalHeader>

                        <ModalBody className="py-6 px-4 sm:px-6 custom-scrollbar">
                            <div className="space-y-6">

                                {/* 1. Información Personal */}
                                <Card className="border-none shadow-none bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                                    <CardBody className="p-5">
                                        <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                                            <HiUser className="w-4 h-4" /> Información Personal
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                                            <div>
                                                <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Nombre Completo</span>
                                                <span className="text-sm font-semibold text-slate-800 dark:text-zinc-100">{cliente.nombre}</span>
                                            </div>

                                            <div className="flex items-start gap-2">
                                                <HiMail className="w-4 h-4 text-slate-400 dark:text-zinc-500 mt-0.5 shrink-0" />
                                                <div className="min-w-0">
                                                    <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Correo Electrónico</span>
                                                    <span className={`text-sm font-medium truncate block ${!cliente.email && !cliente.correo ? 'text-slate-400 italic' : 'text-slate-800 dark:text-zinc-100'}`}>
                                                        {cliente.email || cliente.correo || "No registrado"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-2">
                                                <HiPhone className="w-4 h-4 text-slate-400 dark:text-zinc-500 mt-0.5 shrink-0" />
                                                <div className="min-w-0">
                                                    <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Teléfono</span>
                                                    <span className={`text-sm font-medium truncate block ${!cliente.telefono ? 'text-slate-400 italic' : 'text-slate-800 dark:text-zinc-100'}`}>
                                                        {cliente.telefono || "No registrado"}
                                                    </span>
                                                </div>
                                            </div>

                                            {cliente.numero_predio && (
                                                <div className="flex items-start gap-2">
                                                    <HiHashtag className="w-4 h-4 text-slate-400 dark:text-zinc-500 mt-0.5 shrink-0" />
                                                    <div className="min-w-0">
                                                        <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Número de Predio</span>
                                                        <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300 font-mono bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700">
                                                            {cliente.numero_predio}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>

                                {/* 2. Dirección y Ubicación */}
                                <Card className="border-none shadow-none bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                                    <CardBody className="p-5">
                                        <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                                            <HiLocationMarker className="w-4 h-4" /> Dirección y Ubicación
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                                            <div className="col-span-1 md:col-span-2">
                                                <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Calle y Número</span>
                                                <span className="text-sm font-medium text-slate-800 dark:text-zinc-100">{cliente.direccion || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Colonia</span>
                                                <span className="text-sm font-medium text-slate-800 dark:text-zinc-100">{cliente.colonia || "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Ciudad/Localidad</span>
                                                <span className="text-sm font-medium text-slate-800 dark:text-zinc-100">{cliente.ciudad || "N/A"}</span>
                                            </div>
                                            {cliente.referencia && (
                                                <div className="col-span-1 md:col-span-2 bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 p-3 rounded-xl mt-2">
                                                    <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Referencia</span>
                                                    <span className="text-sm text-slate-600 dark:text-zinc-400 italic leading-relaxed">{cliente.referencia}</span>
                                                </div>
                                            )}
                                            {cliente.latitud && (
                                                <div className="col-span-1 md:col-span-2 flex items-center gap-2 mt-2 p-2 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl w-fit">
                                                    <HiMap className="w-4 h-4 text-blue-500" />
                                                    <span className="text-xs font-mono text-blue-700 dark:text-blue-400">
                                                        {cliente.latitud}, {cliente.longitud}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>

                                {/* 3. Tarifa Asignada */}
                                <Card className="border border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-900/10 shadow-sm rounded-2xl">
                                    <CardBody className="p-5 flex flex-row items-center gap-4">
                                        <div className="p-3 bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full shrink-0">
                                            <HiCurrencyDollar className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-xs font-bold text-green-700/70 dark:text-green-500/70 uppercase tracking-wider mb-1">
                                                Esquema de Tarifa
                                            </h4>
                                            {tarifaAsignada ? (
                                                <div>
                                                    <p className="text-base font-bold text-green-800 dark:text-green-300 truncate">{tarifaAsignada.nombre}</p>
                                                    <p className="text-xs text-green-600/80 dark:text-green-400/80 truncate mt-0.5">{tarifaAsignada.descripcion}</p>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-500 dark:text-zinc-400 italic">No tiene una tarifa asignada</p>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>

                                {/* 4. Medidores Asignados */}
                                <div className="pt-2">
                                    <div className="flex items-center justify-between mb-4 px-1">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg">
                                                <HiCog className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-700 dark:text-zinc-200">
                                                Equipos Medidores
                                            </h4>
                                        </div>
                                        {medidoresAsignados.length > 0 && (
                                            <Chip size="sm" color="primary" variant="flat" className="font-bold">
                                                {medidoresAsignados.length} {medidoresAsignados.length === 1 ? 'Medidor' : 'Medidores'}
                                            </Chip>
                                        )}
                                    </div>

                                    {medidoresAsignados.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {medidoresAsignados.map((medidor) => (
                                                <div 
                                                    key={medidor.id} 
                                                    className="p-4 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-300 dark:hover:border-blue-800/50 transition-colors rounded-2xl shadow-sm"
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="min-w-0 pr-2">
                                                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block uppercase tracking-wide mb-0.5">Nº Serie</span>
                                                            <span className="text-sm font-bold text-blue-700 dark:text-blue-400 font-mono truncate block">
                                                                {medidor.numero_serie}
                                                            </span>
                                                        </div>
                                                        <Chip
                                                            size="sm"
                                                            className="h-5 px-1 text-[10px] font-bold uppercase tracking-wider shrink-0"
                                                            color={medidor.estado_servicio === 'Cortado' ? 'danger' : (medidor.estado_medidor === 'Activo' ? 'success' : 'default')}
                                                            variant="flat"
                                                        >
                                                            {medidor.estado_servicio === 'Cortado' ? 'Cortado' : medidor.estado_medidor}
                                                        </Chip>
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block uppercase tracking-wide mb-0.5">Modelo / Marca</span>
                                                            <span className="text-xs font-medium text-slate-700 dark:text-zinc-300 truncate block">
                                                                {medidor.marca} <span className="text-slate-400 mx-1">•</span> {medidor.modelo}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block uppercase tracking-wide mb-0.5">Ubicación Física</span>
                                                            <span className="text-xs text-slate-600 dark:text-zinc-400 truncate block">
                                                                {medidor.ubicacion || 'Sin especificar'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 opacity-80">
                                            <div className="bg-white dark:bg-zinc-800 p-3 rounded-full mb-3 shadow-sm">
                                                <HiInbox className="w-6 h-6 text-slate-400 dark:text-zinc-500" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-600 dark:text-zinc-300 mb-1">Sin Medidores</p>
                                            <p className="text-xs text-slate-500 dark:text-zinc-500 max-w-[250px]">
                                                Este cliente no tiene ningún equipo vinculado.
                                            </p>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </ModalBody>
                        
                        <ModalFooter className="px-6 py-4">
                            <Button 
                                color="default" 
                                variant="light" 
                                onPress={onClose}
                                className="font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                            >
                                Cerrar Panel
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}