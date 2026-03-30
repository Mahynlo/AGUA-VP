import React, { useEffect, useState, useMemo } from "react";
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
    Progress,
    Spinner
} from "@nextui-org/react";
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

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="5xl"
            backdrop="blur"
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
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                                        <HiMap className="w-7 h-7" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                                            Ruta de Lectura: {ruta.nombre}
                                        </h2>
                                        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
                                            {ruta.descripcion || "Sin descripción"}
                                        </p>
                                    </div>
                                </div>
                                <Chip 
                                    size="sm" 
                                    color={porcentaje === 100 ? "success" : porcentaje > 0 ? "primary" : "default"} 
                                    variant="flat" 
                                    className="h-7 px-2 font-bold uppercase tracking-wider hidden sm:flex"
                                >
                                    {porcentaje === 100 ? "Completada" : porcentaje > 0 ? "En Progreso" : "Pendiente"}
                                </Chip>
                            </div>
                        </ModalHeader>

                        <ModalBody className="py-6 px-4 sm:px-6 custom-scrollbar space-y-6">

                            {/* 1. Panel de Métricas Rápidas */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                                
                                {/* Progreso */}
                                <Card className="border-none shadow-none bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                                    <CardBody className="p-5 flex flex-col justify-between">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                                <HiChartPie className="text-blue-500 w-4 h-4" /> Avance de Lectura
                                            </h4>
                                            <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700">
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
                                            <Progress
                                                value={porcentaje}
                                                color={porcentaje === 100 ? "success" : "primary"}
                                                className="h-2.5 bg-slate-200 dark:bg-zinc-700"
                                                classNames={{ indicator: "rounded-full" }}
                                            />
                                        </div>
                                    </CardBody>
                                </Card>

                                {/* Periodo */}
                                <Card className="border-none shadow-none bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                                    <CardBody className="p-5 flex flex-col justify-between">
                                        <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                                            <HiCalendar className="text-purple-500 w-4 h-4" /> Periodo Asignado
                                        </h4>
                                        <div className="mt-auto">
                                            <span className="text-2xl font-black text-slate-800 dark:text-zinc-100 tracking-tight block mb-1">
                                                {ruta.periodo_mostrado}
                                            </span>
                                            <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                                                Ciclo de facturación actual
                                            </span>
                                        </div>
                                    </CardBody>
                                </Card>

                                {/* Estado de Asignación */}
                                <Card className="border-none shadow-none bg-slate-50 dark:bg-zinc-800/50 rounded-2xl">
                                    <CardBody className="p-5 flex flex-col justify-between">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
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
                                    </CardBody>
                                </Card>
                            </div>

                            {/* 2. Warning Card for Unassigned (Solo si missingCount > 0) */}
                            {missingCount > 0 && (
                                <Card className="border-none shadow-none bg-red-50 dark:bg-red-900/10 border-l-4 border-l-red-500 rounded-xl overflow-hidden">
                                    <CardBody className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex gap-4 items-center">
                                            <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400 shrink-0">
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
                                        <Button
                                            size="sm"
                                            color="danger"
                                            variant="flat"
                                            className="font-bold shrink-0 w-full sm:w-auto"
                                            endContent={<HiArrowRight />}
                                            onPress={onClose}
                                        >
                                            Ir al Inventario
                                        </Button>
                                    </CardBody>
                                </Card>
                            )}

                            {/* 3. Mapa de la Ruta */}
                            <div className="flex flex-col gap-3">
                                <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2 pl-1">
                                    <HiLocationMarker className="text-indigo-500 w-4 h-4" /> Recorrido Geográfico
                                </h4>
                                {/* AQUI ESTABA EL ERROR: Necesita h-[400px] sm:h-[500px] obligatorio */}
                                <Card className="border-none shadow-none bg-slate-50 dark:bg-zinc-800/50 rounded-2xl overflow-hidden h-[400px] sm:h-[500px]">
                                    <CardBody className="p-0 relative h-full w-full">
                                        {loading ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm z-20">
                                                <Spinner size="lg" color="primary" />
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
                                Cerrar Panel
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default ModalDetalleRuta;