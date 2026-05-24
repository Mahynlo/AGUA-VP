import React from "react";
import { Modal, Button } from "flowbite-react";
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
        close: {
            base: "absolute top-6 right-6 inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors",
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
            dismissible={false}
            theme={premiumModalTheme}
            className="mt-5"
        >
            {/* ── HEADER ── */}
            <Modal.Header>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-2xl shrink-0">
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
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-600" />
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${estadoBadgeClass}`}>
                                {estadoLabel}
                            </span>
                        </div>
                    </div>
                </div>
            </Modal.Header>

            {/* ── BODY ── */}
            <Modal.Body>
                <div className="flex flex-col gap-6">

                    {/* 1. Especificaciones Técnicas */}
                    <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-4 flex items-center gap-2">
                            <HiFingerPrint className="w-4 h-4" /> Especificaciones Técnicas
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                            <div>
                                <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Número de Serie</span>
                                <span className="text-lg sm:text-xl font-mono font-bold text-slate-800 dark:text-zinc-100 bg-white dark:bg-zinc-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 inline-block">
                                    {medidor.numero_serie}
                                </span>
                            </div>
                            <div className="md:row-span-2">
                                <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Estado Físico</span>
                                <div className="flex flex-col gap-2 mt-2">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-300">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                        Marca: <strong className="text-slate-800 dark:text-zinc-100">{medidor.marca || "No especificada"}</strong>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-300">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                        Modelo: <strong className="text-slate-800 dark:text-zinc-100">{medidor.modelo || "No especificado"}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Grid: Ubicación + Cliente */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Ubicación y Registro */}
                        <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-4 flex items-center gap-2">
                                <HiLocationMarker className="w-4 h-4" /> Ubicación y Registro
                            </h4>
                            <div className="space-y-4 flex flex-col flex-1">
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
                                            <span className="text-xs font-mono">{medidor.latitud}, {medidor.longitud}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-auto pt-4 border-t border-slate-200 dark:border-zinc-700/50">
                                    <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Fecha Instalación</span>
                                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
                                        <HiCalendar className="w-4 h-4 text-slate-400" />
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
                        <div className={`rounded-2xl p-5 flex flex-col ${
                            clienteAsignado
                                ? "bg-emerald-500/10 border border-emerald-200/70 dark:border-emerald-900/40"
                                : "bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800"
                        }`}>
                            <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${clienteAsignado ? "text-emerald-700 dark:text-emerald-400" : "text-slate-400 dark:text-zinc-500"}`}>
                                <HiUser className="w-4 h-4" /> Asignación de Cliente
                            </h4>

                            {clienteAsignado ? (
                                <div className="flex flex-col flex-1">
                                    <div className="mb-4">
                                        <span className="text-[11px] font-bold text-emerald-700/70 dark:text-emerald-400/70 uppercase tracking-wider block mb-1">Cliente Titular</span>
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-bold text-slate-800 dark:text-zinc-100 truncate">
                                                {clienteAsignado.nombre}
                                            </p>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                                                ID: {clienteAsignado.id}
                                            </span>
                                        </div>
                                        {clienteAsignado.telefono && (
                                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Tel: {clienteAsignado.telefono}</p>
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
                                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                                    <div className="bg-slate-200 dark:bg-zinc-700 p-3 rounded-full mb-3">
                                        <HiCog className="text-xl text-slate-500 dark:text-zinc-400" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-600 dark:text-zinc-300">Medidor Libre</p>
                                    <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 max-w-[200px]">
                                        Este equipo no está asignado a ningún cliente actualmente.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Modal.Body>

            {/* ── FOOTER ── */}
            <Modal.Footer>
                <Button
                    color="gray"
                    onClick={onClose}
                    className="font-bold text-slate-500 border-transparent bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 focus:ring-0 rounded-xl h-11"
                >
                    Cerrar Panel
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalDetalleMedidor;
