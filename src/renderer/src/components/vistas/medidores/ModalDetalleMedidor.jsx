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
import { useClientes } from "../../../context/ClientesContext";
import { useTarifas } from "../../../context/TarifasContext";
import { HiCog, HiLocationMarker, HiCalendar, HiUser, HiMap, HiFingerPrint, HiCurrencyDollar } from "react-icons/hi";

const ModalDetalleMedidor = ({ isOpen, onClose, medidor }) => {
    const { allClientes } = useClientes();
    const { tarifas } = useTarifas();

    // Encontrar información del cliente asignado si existe
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
                                    <HiCog className="w-7 h-7" />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
                                        Detalle del Medidor
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                                            ID: {medidor.id}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-600"></span>
                                        <Chip 
                                            size="sm" 
                                            color={medidor.estado_servicio === 'Cortado' ? "danger" : (medidor.estado_medidor === "Activo" ? "success" : "danger")}
                                            variant="flat" 
                                            className="h-5 px-1 text-[10px] font-bold uppercase tracking-wider"
                                        >
                                            {medidor.estado_servicio === 'Cortado' ? 'Servicio Cortado' : medidor.estado_medidor}
                                        </Chip>
                                    </div>
                                </div>
                            </div>
                        </ModalHeader>
                        
                        <ModalBody className="custom-scrollbar space-y-6">

                            {/* 1. Información Técnica Principal */}
                            <Card className="border-none shadow-none bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl">
                                <CardBody className="p-5">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-4 flex items-center gap-2">
                                        <HiFingerPrint className="w-4 h-4" /> Especificaciones Técnicas
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                                        <div>
                                            <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Número de Serie</span>
                                            <span className="text-lg sm:text-xl font-mono font-bold text-slate-800 dark:text-zinc-100 bg-white dark:bg-zinc-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 w-fit">
                                                {medidor.numero_serie}
                                            </span>
                                        </div>

                                        <div className="md:row-span-2">
                                             <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Estado Físico</span>
                                             <div className="flex flex-col gap-2 mt-2">
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-300">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> 
                                                    Marca: <strong className="text-slate-800 dark:text-zinc-100">{medidor.marca || "No especificada"}</strong>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-300">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> 
                                                    Modelo: <strong className="text-slate-800 dark:text-zinc-100">{medidor.modelo || "No especificado"}</strong>
                                                </div>
                                             </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* 2. Ubicación e Instalación */}
                                <Card className="border-none shadow-none bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl h-full">
                                    <CardBody className="p-5">
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-4 flex items-center gap-2">
                                            <HiLocationMarker className="w-4 h-4" /> Ubicación y Registro
                                        </h4>
                                        <div className="space-y-4 flex flex-col h-full">
                                            <div>
                                                <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Dirección / Localidad</span>
                                                <span className="text-sm font-medium text-slate-800 dark:text-zinc-100 leading-snug block">
                                                    {medidor.ubicacion || "Sin ubicación registrada"}
                                                </span>
                                            </div>

                                            {medidor.latitud && medidor.longitud && (
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Coordenadas</span>
                                                    <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 bg-sky-500/10 border border-sky-200/70 dark:border-sky-900/40 px-2 py-1 rounded w-fit">
                                                        <HiMap className="w-3.5 h-3.5" />
                                                        <span className="text-xs font-mono">
                                                            {medidor.latitud}, {medidor.longitud}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-auto pt-4 border-t border-slate-200 dark:border-zinc-700/50">
                                                <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Fecha Instalación</span>
                                                <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
                                                    <HiCalendar className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm font-medium">
                                                        {medidor.fecha_instalacion
                                                            ? new Date(medidor.fecha_instalacion).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
                                                            : "No registrada"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>

                                {/* 3. Cliente Asignado */}
                                <Card className={`border-none shadow-none rounded-2xl h-full ${
                                    clienteAsignado
                                        ? "bg-emerald-500/10 border border-emerald-200/70 dark:border-emerald-900/40"
                                        : "bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800/50"
                                }`}>
                                    <CardBody className="p-5 flex flex-col h-full">
                                        <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${clienteAsignado ? "text-emerald-700 dark:text-emerald-400" : "text-slate-400 dark:text-zinc-500"}`}>
                                            <HiUser className="w-4 h-4" /> Asignación de Cliente
                                        </h4>

                                        {clienteAsignado ? (
                                            <div className="flex flex-col h-full">
                                                <div className="mb-4">
                                                    <span className="text-[11px] font-bold text-emerald-700/70 dark:text-emerald-400/70 uppercase tracking-wider block mb-1">Cliente Titular</span>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="text-sm font-bold text-slate-800 dark:text-zinc-100 truncate">
                                                            {clienteAsignado.nombre}
                                                        </p>
                                                        <Chip size="sm" color="success" variant="flat" className="h-5 px-1 text-[10px] font-bold uppercase tracking-wider">
                                                            ID: {clienteAsignado.id}
                                                        </Chip>
                                                    </div>
                                                    {clienteAsignado.telefono && (
                                                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                                                            Tel: {clienteAsignado.telefono}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="mt-auto pt-4 border-t border-emerald-200/50 dark:border-emerald-900/30">
                                                    <span className="text-[11px] font-bold text-emerald-700/70 dark:text-emerald-400/70 uppercase tracking-wider block mb-1">Esquema de Tarifa</span>
                                                    <div className="flex items-start gap-2">
                                                        <HiCurrencyDollar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                                                        <div className="min-w-0">
                                                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 block truncate">
                                                                {tarifaCliente?.nombre || "Sin tarifa asignada"}
                                                            </span>
                                                            {tarifaCliente?.descripcion && (
                                                                <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 block line-clamp-2 leading-tight mt-0.5">
                                                                    {tarifaCliente.descripcion}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                                                <div className="bg-slate-200 dark:bg-zinc-700 p-3 rounded-full mb-3">
                                                    <HiCog className="text-xl text-slate-500 dark:text-zinc-400" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-600 dark:text-zinc-300">Medidor Libre</p>
                                                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 max-w-[200px]">
                                                    Este equipo no está asignado a ningún cliente actualmente.
                                                </p>
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>
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
};

export default ModalDetalleMedidor;
