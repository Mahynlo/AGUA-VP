import React from "react";
import { Modal, Button, ModalHeader, ModalBody, ModalFooter } from "flowbite-react";
import { useClientes } from "../../../context/ClientesContext";
import { useTarifas } from "../../../context/TarifasContext";
import {
    HiCog, HiLocationMarker, HiCalendar, HiUser,
    HiMap, HiFingerPrint, HiCurrencyDollar
} from "react-icons/hi";

const premiumModalTheme = {
    root: {
        show: { on: "flex bg-slate-900/60 dark:bg-black/80", off: "hidden" }
    },
    content: {
        base: "relative h-full w-full p-4 md:h-auto",
        inner: "relative flex max-h-[90dvh] flex-col rounded-2xl bg-white shadow-lg dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800"
    },
    header: {
        base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/80 px-8 py-6 rounded-t-2xl",
        close: { base: "inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer",
            icon: "h-5 w-5"
        }
    },
    body: { base: "p-8 flex-1 overflow-y-auto" },
    footer: { base: "flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800/80 px-8 py-6 rounded-b-2xl" }
};

const ModalDetalleMedidor = ({ isOpen, onClose, medidor }) => {
    const { allClientes } = useClientes();
    const { tarifas } = useTarifas();

    const clienteAsignado = React.useMemo(() => {
        if (!medidor?.cliente_id || !allClientes.length) return null;
        return allClientes.find(c => c.id === medidor.cliente_id);
    }, [medidor, allClientes]);

    const tarifaCliente = React.useMemo(() => {
        if (!clienteAsignado?.id_tarifa && !clienteAsignado?.tarifa_id) return null;
        const tId = clienteAsignado.id_tarifa || clienteAsignado.tarifa_id;
        return tarifas.find(t => t.id === tId);
    }, [clienteAsignado, tarifas]);

    if (!medidor) return null;

    const estadoBadgeClass = medidor.estado_servicio === "Cortado" || medidor.estado_medidor !== "Activo"
        ? "bg-red-500/10 text-red-600 dark:text-red-400"
        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    const estadoLabel = medidor.estado_servicio === "Cortado" ? "Servicio Cortado" : medidor.estado_medidor;

    return (
        <Modal
            show={isOpen}
            onClose={onClose}
            size="3xl"
            dismissible
            theme={premiumModalTheme}
            className="mt-5"
        >
            {/* ── HEADER ── */}
            <ModalHeader>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
                        <HiCog className="w-7 h-7" />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
                            Detalle del Medidor
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                                ID: #{medidor.id}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-600" />
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${estadoBadgeClass}`}>
                                {estadoLabel}
                            </span>
                        </div>
                    </div>
                </div>
            </ModalHeader>

            {/* ── BODY ── */}
            <ModalBody>
                <div className="flex flex-col gap-6">
                    {medidor.fecha_eliminacion && (
                        <div className="p-5 bg-red-500/10 border border-red-200/50 dark:border-red-900/40 rounded-2xl flex flex-col gap-2">
                            <h4 className="text-xs font-black text-red-800 dark:text-red-400 uppercase tracking-widest">
                                Medidor Desactivado (En Papelera)
                            </h4>
                            <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                <span className="text-slate-400">Motivo:</span> {medidor.razon_eliminacion || "Sin motivo especificado"}
                            </p>
                            <p className="text-[10px] font-medium text-slate-500">
                                <span className="text-slate-400">Fecha de eliminación:</span> {new Date(medidor.fecha_eliminacion).toLocaleString()}
                            </p>
                        </div>
                    )}

                    {/* 1. Especificaciones Técnicas */}
                    <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 p-6 space-y-4">
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-200/70 dark:border-zinc-800/70">
                            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                                <HiFingerPrint className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-black text-sm text-slate-800 dark:text-zinc-100 uppercase tracking-wider leading-none">
                                    Especificaciones Técnicas
                                </h4>
                                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-1">Identificador del medidor y ficha de fábrica</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 pt-1">
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block mb-1.5">Número de Serie</span>
                                <span className="text-lg sm:text-xl font-mono font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 inline-block shadow-sm">
                                    {medidor.numero_serie}
                                </span>
                            </div>
                            <div className="md:row-span-2">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block mb-1.5">Estado Físico</span>
                                <div className="flex flex-col gap-2.5 mt-1 bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-300">
                                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                                        Marca: <strong className="text-slate-800 dark:text-zinc-100">{medidor.marca || "No especificada"}</strong>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-300">
                                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                                        Modelo: <strong className="text-slate-800 dark:text-zinc-100">{medidor.modelo || "No especificado"}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Grid: Ubicación + Cliente */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Ubicación y Registro */}
                        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 p-6 space-y-4 flex flex-col">
                            <div className="flex items-center gap-3 pb-3 border-b border-slate-200/70 dark:border-zinc-800/70">
                                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                                    <HiLocationMarker className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-black text-sm text-slate-800 dark:text-zinc-100 uppercase tracking-wider leading-none">
                                        Ubicación y Registro
                                    </h4>
                                    <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-1">Lugar de instalación y coordenadas</p>
                                </div>
                            </div>
                            <div className="space-y-4 flex flex-col flex-1">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Dirección / Localidad</span>
                                    <span className="text-sm font-medium text-slate-800 dark:text-zinc-100 leading-snug block">
                                        {medidor.ubicacion || "Sin ubicación registrada"}
                                    </span>
                                </div>

                                {medidor.latitud && medidor.longitud && (
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Coordenadas</span>
                                        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-200/60 dark:border-blue-900/40 px-2.5 py-1 rounded-lg w-fit">
                                            <HiMap className="w-3.5 h-3.5" />
                                            <span className="text-xs font-mono font-bold">{medidor.latitud}, {medidor.longitud}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-auto pt-4 border-t border-slate-200/70 dark:border-zinc-800/70">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">Fecha Instalación</span>
                                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
                                        <HiCalendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        <span className="text-sm font-medium">
                                            {medidor.fecha_instalacion
                                                ? new Date(medidor.fecha_instalacion).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })
                                                : "No registrada"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cliente Asignado */}
                        <div className={`rounded-2xl p-6 flex flex-col ${
                            clienteAsignado
                                ? "bg-emerald-500/10 border border-emerald-200/70 dark:border-emerald-900/40"
                                : "rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30"
                        }`}>
                            <div className="flex items-center gap-3 pb-3 border-b border-slate-200/70 dark:border-zinc-800/70">
                                <div className={`p-2 rounded-xl shrink-0 ${clienteAsignado ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"}`}>
                                    <HiUser className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-black text-sm text-slate-800 dark:text-zinc-100 uppercase tracking-wider leading-none">
                                        Asignación de Cliente
                                    </h4>
                                    <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-1">Titular asociado</p>
                                </div>
                            </div>

                            {clienteAsignado ? (
                                <div className="flex flex-col flex-1 mt-4">
                                    <div className="mb-4">
                                        <span className="text-[10px] font-bold text-emerald-700/80 dark:text-emerald-400/80 uppercase tracking-widest block mb-1">Cliente Titular</span>
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-bold text-slate-800 dark:text-zinc-100 truncate">
                                                {clienteAsignado.nombre}
                                            </p>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 shrink-0">
                                                ID: #{clienteAsignado.id}
                                            </span>
                                        </div>
                                        {clienteAsignado.telefono && (
                                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Tel: {clienteAsignado.telefono}</p>
                                        )}
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-emerald-200/50 dark:border-emerald-900/30">
                                        <span className="text-[10px] font-bold text-emerald-700/80 dark:text-emerald-400/80 uppercase tracking-widest block mb-1">Esquema de Tarifa</span>
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
                                <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                                    <div className="bg-slate-100 dark:bg-zinc-800 p-3 rounded-2xl mb-3 text-slate-400 dark:text-zinc-500">
                                        <HiCog className="text-2xl" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">Medidor Libre</p>
                                    <p className="text-xs font-medium text-slate-500 dark:text-zinc-500 mt-1 max-w-[220px]">
                                        Este equipo no está asignado a ningún cliente actualmente.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </ModalBody>

            {/* ── FOOTER ── */}
            <ModalFooter>
                <Button
                    color="dark"
                    onClick={onClose}
                    className="font-black bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 text-white border-transparent rounded-xl h-11 px-5 shadow-sm transition-transform active:scale-95"
                >
                    Cerrar Panel
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default ModalDetalleMedidor;
