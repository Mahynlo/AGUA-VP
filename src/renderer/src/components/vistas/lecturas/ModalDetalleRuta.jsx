import React, { useEffect, useState, useMemo } from "react";
import { Modal, Button } from "flowbite-react";
import {
    HiMap,
    HiLocationMarker,
    HiCalendar,
    HiChartPie,
    HiExclamation,
    HiArrowRight,
    HiUserGroup
} from "react-icons/hi";
import { useRutas } from "../../../context/RutasContext";
import MapaRutas from "../../mapa/MapaRutas";

const largeModalTheme = {
    root: { show: { on: "flex bg-slate-900/60 dark:bg-black/80", off: "hidden" } },
    content: {
        base: "relative h-full w-full p-1 sm:p-2 pt-16 sm:pt-20",
        inner: "relative flex h-[calc(100dvh-4.25rem)] sm:h-[calc(100dvh-5.25rem)] flex-col rounded-[2rem] bg-white shadow-2xl dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 mx-auto max-w-[1300px] w-full"
    },
    header: {
        base: "flex items-start justify-between border-b border-slate-100 dark:border-zinc-800/50 pb-4 pt-6 px-8 shrink-0",
        close: { base: "absolute top-4 right-4 inline-flex items-center rounded-xl bg-transparent p-2 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors z-50", icon: "h-5 w-5" }
    },
    body: { base: "px-8 py-6 flex-1 min-h-0 overflow-y-auto custom-scrollbar" },
    footer: { base: "flex items-center justify-between gap-3 border-t border-slate-100 dark:border-zinc-800/50 py-4 px-8 shrink-0" }
};

const ModalDetalleRuta = ({ isOpen, onClose, ruta }) => {
    const { obtenerInfoRuta } = useRutas();
    const [loading, setLoading] = useState(true);
    const [detalleRuta, setDetalleRuta] = useState(null);
    const [missingCount, setMissingCount] = useState(0);
    const [rutaCalculadaState, setRutaCalculadaState] = useState(null);

    useEffect(() => {
        if (isOpen && ruta?.id) {
            setLoading(true);
            setRutaCalculadaState(null);

            obtenerInfoRuta(ruta.id)
                .then(async (data) => {
                    setDetalleRuta(data);

                    const sinCliente = (data?.puntos || []).filter(p => !p.cliente_id).length;
                    setMissingCount(sinCliente);

                    if (data && data.puntos && data.puntos.length >= 2) {
                        try {
                            const puntosParaCalculo = data.puntos.map(p => ({
                                lat: parseFloat(p.latitud),
                                lng: parseFloat(p.longitud)
                            }));

                            if (puntosParaCalculo.every(p => !isNaN(p.lat) && !isNaN(p.lng))) {
                                const geometry = await window.api.calcularRuta(puntosParaCalculo);
                                setRutaCalculadaState(geometry);
                            }
                        } catch (err) {
                            console.error("Error calculating route geometry for view:", err);
                        }
                    }
                })
                .catch((err) => {
                    console.error("Error loading route details:", err);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [isOpen, ruta, obtenerInfoRuta]);

    const porcentaje = ruta?.total_puntos > 0
        ? ((ruta.completadas || 0) / ruta.total_puntos) * 100
        : 0;

    const medidoresMapa = useMemo(() => {
        if (!detalleRuta?.puntos) return [];
        return detalleRuta.puntos.map(p => ({
            id: p.medidor_id || p.id,
            latitud: parseFloat(p.latitud),
            longitud: parseFloat(p.longitud),
            numero_serie: p.numero_serie,
            ubicacion: p.ubicacion || p.cliente_direccion || "Sin ubicación registrada",
            estado_medidor: p.estado_medidor || "Activo"
        }));
    }, [detalleRuta]);

    const puntosRutaOverlay = useMemo(() => {
        return medidoresMapa.map(m => ({
            id: m.id,
            lat: m.latitud,
            lng: m.longitud,
            numero_serie: m.numero_serie
        }));
    }, [medidoresMapa]);

    const rutaFinal = useMemo(() => {
        if (rutaCalculadaState) return rutaCalculadaState;
        const coords = medidoresMapa.map(m => [m.latitud, m.longitud]);
        return { ruta: coords, puntos_gps: coords };
    }, [rutaCalculadaState, medidoresMapa]);

    if (!isOpen || !ruta) return null;

    const chipColor = porcentaje === 100
        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        : porcentaje > 0
            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
            : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400";

    const chipLabel = porcentaje === 100 ? "Completada" : porcentaje > 0 ? "En Progreso" : "Pendiente";

    return (
        <Modal
            show={isOpen}
            onClose={onClose}
            dismissible={false}
            theme={largeModalTheme}
            size="7xl"
        >
            <Modal.Header>
                <div className="flex items-center justify-between gap-4 w-full">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-2xl">
                            <HiMap className="w-7 h-7" />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
                                Ruta de Lectura: {ruta.nombre}
                            </h2>
                            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
                                {ruta.descripcion || "Sin descripción"}
                            </p>
                        </div>
                    </div>
                    <span className={`hidden sm:inline-flex items-center h-7 px-2 rounded-md font-bold uppercase tracking-widest text-[10px] ${chipColor}`}>
                        {chipLabel}
                    </span>
                </div>
            </Modal.Header>

            <Modal.Body>
                <div className="space-y-6">

                    {/* 1. Panel de Métricas Rápidas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">

                        {/* Progreso */}
                        <div className="border border-slate-200 dark:border-zinc-800 shadow-none bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-5 flex flex-col justify-between">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <HiChartPie className="text-sky-500 w-4 h-4" /> Avance de Lectura
                                </h4>
                                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-800">
                                    {porcentaje.toFixed(1)}%
                                </span>
                            </div>
                            <div>
                                <div className="flex items-baseline gap-1.5 mb-2">
                                    <span className="text-3xl font-black text-slate-800 dark:text-zinc-100 tracking-tight leading-none">
                                        {ruta.completadas || 0}
                                    </span>
                                    <span className="text-sm font-bold text-slate-400 dark:text-zinc-500">
                                        / {ruta.total_puntos}
                                    </span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${porcentaje === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                        style={{ width: `${porcentaje}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Periodo */}
                        <div className="border border-slate-200 dark:border-zinc-800 shadow-none bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-5 flex flex-col justify-between">
                            <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 mb-4 uppercase tracking-widest flex items-center gap-2">
                                <HiCalendar className="text-violet-500 w-4 h-4" /> Periodo Asignado
                            </h4>
                            <div className="mt-auto">
                                <span className="text-2xl font-black text-slate-800 dark:text-zinc-100 tracking-tight block mb-1">
                                    {ruta.periodo_mostrado}
                                </span>
                                <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                                    Ciclo de facturación actual
                                </span>
                            </div>
                        </div>

                        {/* Estado de Asignación */}
                        <div className="border border-slate-200 dark:border-zinc-800 shadow-none bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-5 flex flex-col justify-between">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <HiUserGroup className="text-teal-500 w-4 h-4" /> Puntos de Ruta
                                </h4>
                                {missingCount > 0 && (
                                    <HiExclamation className="text-red-500 w-5 h-5 animate-pulse" />
                                )}
                            </div>
                            <div className="flex justify-between items-end mt-auto">
                                <div>
                                    <span className="text-2xl font-black text-slate-800 dark:text-zinc-100 tracking-tight block leading-none mb-1">
                                        {detalleRuta?.puntos?.length || 0}
                                    </span>
                                    <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                                        Asignados
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className={`text-2xl font-black tracking-tight block leading-none mb-1 ${missingCount > 0 ? "text-red-500 dark:text-red-400" : "text-slate-300 dark:text-zinc-600"}`}>
                                        {missingCount}
                                    </span>
                                    <span className={`text-[11px] font-bold uppercase tracking-wider ${missingCount > 0 ? "text-red-500/70 dark:text-red-400/70" : "text-slate-400 dark:text-zinc-500"}`}>
                                        Sin Cliente
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Warning Card for Unassigned */}
                    {missingCount > 0 && (
                        <div className="border border-red-200/70 dark:border-red-900/40 shadow-none bg-red-500/10 rounded-2xl overflow-hidden">
                            <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex gap-4 items-center">
                                    <div className="p-2.5 bg-red-500/10 rounded-full text-red-600 dark:text-red-400 shrink-0">
                                        <HiExclamation className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-red-700 dark:text-red-400 text-sm sm:text-base leading-tight">
                                            Atención: {missingCount} {missingCount === 1 ? 'medidor' : 'medidores'} en la ruta sin cliente asignado.
                                        </h4>
                                        <p className="text-xs text-red-600/80 dark:text-red-300/80 mt-1">
                                            Estos equipos no aparecerán para toma de lectura hasta que se les vincule un cliente.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="font-bold shrink-0 w-full sm:w-auto bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 rounded-xl px-4 py-2 text-sm flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-zinc-800"
                                >
                                    Ir al Inventario <HiArrowRight />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 3. Mapa de la Ruta */}
                    <div className="flex flex-col gap-3">
                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                            <HiLocationMarker className="text-sky-500 w-4 h-4" /> Recorrido Geográfico
                        </h4>
                        <div className="border border-slate-200 dark:border-zinc-800 shadow-none bg-slate-50 dark:bg-zinc-900/50 rounded-2xl overflow-hidden h-[400px] sm:h-[500px] relative">
                            {loading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-zinc-900/50 z-20">
                                    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
                                    <p className="text-sm font-bold text-slate-500 mt-4">Trazando ruta...</p>
                                </div>
                            ) : (
                                <MapaRutas
                                    medidores={medidoresMapa}
                                    puntosRuta={puntosRutaOverlay}
                                    rutaCalculada={rutaFinal}
                                    dibujar={true}
                                    readOnly={true}
                                    onAgregarMedidor={() => { }}
                                    onEliminarMedidor={() => { }}
                                />
                            )}
                        </div>
                    </div>

                </div>
            </Modal.Body>

            <Modal.Footer>
                <Button
                    color="light"
                    onClick={onClose}
                    className="font-bold text-slate-600 dark:text-zinc-300 bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800"
                >
                    Cerrar Panel
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalDetalleRuta;
