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
                backdrop: "bg-slate-900/40 backdrop-blur-sm",
                base: "bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-2xl",
                header: "border-b border-slate-100 dark:border-zinc-800/50 pb-4 pt-6 px-8",
                body: "px-8 py-6",
                footer: "border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8",
                closeButton: "hover:bg-slate-100 dark:hover:bg-zinc-800 active:bg-slate-200 text-slate-400 p-2 top-4 right-4",
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-2xl">
                                    <HiUser className="w-7 h-7" />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
                                        Detalles del Cliente
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
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

                        <ModalBody className="custom-scrollbar">
                            <div className="space-y-6">

                                {/* 1. Información Personal */}
                                <Card className="border-none shadow-none bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl">
                                    <CardBody className="p-5">
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-4 flex items-center gap-2">
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
                                <Card className="border-none shadow-none bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl">
                                    <CardBody className="p-5">
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-4 flex items-center gap-2">
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
                                                <div className="col-span-1 md:col-span-2 flex items-center gap-2 mt-2 p-2 bg-sky-500/10 border border-sky-200/60 dark:border-sky-900/40 rounded-xl w-fit">
                                                    <HiMap className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                                                    <span className="text-xs font-mono text-sky-700 dark:text-sky-400">
                                                        {cliente.latitud}, {cliente.longitud}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>

                                {/* 3. Tarifa Asignada */}
                                <Card className="border border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-500/10 shadow-none rounded-2xl">
                                    <CardBody className="p-5 flex flex-row items-center gap-4">
                                        <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full shrink-0">
                                            <HiCurrencyDollar className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/80 dark:text-emerald-400/90 mb-1">
                                                Esquema de Tarifa
                                            </h4>
                                            {tarifaAsignada ? (
                                                <div>
                                                    <p className="text-base font-bold text-emerald-800 dark:text-emerald-300 truncate">{tarifaAsignada.nombre}</p>
                                                    <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 truncate mt-0.5">{tarifaAsignada.descripcion}</p>
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
                                            <div className="p-1.5 bg-slate-500/10 rounded-lg">
                                                <HiCog className="w-4 h-4 text-slate-600 dark:text-zinc-300" />
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
                                                    className="p-4 border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors rounded-2xl shadow-none"
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="min-w-0 pr-2">
                                                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block uppercase tracking-wide mb-0.5">Nº Serie</span>
                                                            <span className="text-sm font-bold text-slate-700 dark:text-zinc-200 font-mono truncate block">
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
                        
                        <ModalFooter>
                            <Button 
                                color="default" 
                                variant="flat" 
                                onPress={onClose}
                                className="font-bold text-slate-600 dark:text-zinc-300 bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl px-6"
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