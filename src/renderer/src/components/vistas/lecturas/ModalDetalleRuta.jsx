import React, { useEffect, useState, useMemo } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Card,
    CardHeader,
    CardBody,
    Chip,
    Progress,
    Divider,
    Spinner
} from "@nextui-org/react";
import {
    HiMap,
    HiLocationMarker,
    HiCalendar,
    HiChartPie,
    HiExclamation,
    HiCheckCircle,
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
    const [rutaCalculadaState, setRutaCalculadaState] = useState(null); // Newly calculated route geometry

    useEffect(() => {
        if (isOpen && ruta?.id) {
            setLoading(true);
            setRutaCalculadaState(null);

            obtenerInfoRuta(ruta.id)
                .then(async (data) => {
                    setDetalleRuta(data);
                    // Calculate missing meters (Total in summary vs Valid points in detail)
                    // data.puntos only includes assigned meters usually
                    const validPoints = data?.puntos?.length || 0;
                    const totalInSummary = ruta.total_puntos || 0;
                    const diff = totalInSummary - validPoints;
                    setMissingCount(diff > 0 ? diff : 0);

                    // 🔹 Calculate Route Geometry (Curved Lines)
                    if (data && data.puntos && data.puntos.length >= 2) {
                        try {
                            const puntosParaCalculo = data.puntos.map(p => ({
                                lat: parseFloat(p.latitud),
                                lng: parseFloat(p.longitud)
                            }));

                            // Only calculate if points are valid
                            if (puntosParaCalculo.every(p => !isNaN(p.lat) && !isNaN(p.lng))) {
                                const geometry = await window.api.calcularRuta(puntosParaCalculo);
                                setRutaCalculadaState(geometry);
                            }
                        } catch (err) {
                            console.error("Error calculating route geometry for view:", err);
                            // Fallback to straight lines handled by memo below if state remains null
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

    // Percentage logic
    const porcentaje = ruta.total_puntos > 0
        ? ((ruta.completadas || 0) / ruta.total_puntos) * 100
        : 0;

    // Prepare props for MapaRutas (Read-Only Mode)
    // We transform backend 'puntos' to the format expected by MapaRutas 'medidores' prop for the Markers
    // AND 'puntosRuta' for the orange circles/sequence.

    const medidoresMapa = useMemo(() => {
        if (!detalleRuta?.puntos) return [];
        return detalleRuta.puntos.map(p => ({
            id: p.medidor_id || p.id,
            latitud: parseFloat(p.latitud),
            longitud: parseFloat(p.longitud),
            numero_serie: p.numero_serie,
            ubicacion: p.ubicacion || p.cliente_direccion || "Sin ubicación registrada", // Fallbacks
            estado_medidor: p.estado_medidor || "Activo"
        }));
    }, [detalleRuta]);

    // For 'puntosRuta' (the orange sequence circles), MapaRutas expects { lat, lng, numero_serie }
    const puntosRutaOverlay = useMemo(() => {
        return medidoresMapa.map(m => ({
            id: m.id,
            lat: m.latitud,
            lng: m.longitud,
            numero_serie: m.numero_serie
        }));
    }, [medidoresMapa]);

    // Use calculated state if available, otherwise fallback to straight text
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
                backdrop: "bg-black/60 backdrop-blur-sm",
                modal: "bg-white dark:bg-zinc-900",
                closeButton: "hover:bg-red-600 hover:text-white"
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex gap-3 items-center border-b border-gray-100 dark:border-zinc-800 pb-4">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                                <HiMap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Detalle de Ruta: {ruta.nombre}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {ruta.descripcion}
                                </p>
                            </div>
                        </ModalHeader>

                        <ModalBody className="py-6 space-y-6 bg-gray-50 dark:bg-black/20">

                            {/* 1. Stats and Info Row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Progress Card */}
                                <Card className="border border-gray-200 dark:border-zinc-700 shadow-sm">
                                    <CardHeader className="justify-between pb-2">
                                        <div className="flex gap-2 items-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                                            <HiChartPie className="text-lg text-blue-500" />
                                            Progreso
                                        </div>
                                        <Chip size="sm" color={porcentaje === 100 ? "success" : "primary"} variant="flat">
                                            {porcentaje.toFixed(1)}%
                                        </Chip>
                                    </CardHeader>
                                    <CardBody>
                                        <div className="flex items-end justify-between mb-2">
                                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {ruta.completadas || 0}
                                                <span className="text-sm text-gray-400 font-normal ml-1">/ {ruta.total_puntos}</span>
                                            </span>
                                        </div>
                                        <Progress
                                            value={porcentaje}
                                            color={porcentaje === 100 ? "success" : "primary"}
                                            className="h-2"
                                        />
                                    </CardBody>
                                </Card>

                                {/* Period Info */}
                                <Card className="border border-gray-200 dark:border-zinc-700 shadow-sm">
                                    <CardHeader className="justify-between pb-2">
                                        <div className="flex gap-2 items-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                                            <HiCalendar className="text-lg text-purple-500" />
                                            Periodo
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {ruta.periodo_mostrado}
                                        </span>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Ciclo de facturación actual
                                        </p>
                                    </CardBody>
                                </Card>

                                {/* Meters Status */}
                                <Card className="border border-gray-200 dark:border-zinc-700 shadow-sm">
                                    <CardHeader className="justify-between pb-2">
                                        <div className="flex gap-2 items-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                                            <HiUserGroup className="text-lg text-teal-500" />
                                            Asignación
                                        </div>
                                        {missingCount > 0 && <HiExclamation className="text-red-500 text-xl animate-pulse" />}
                                    </CardHeader>
                                    <CardBody>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                                    {detalleRuta?.puntos?.length || 0}
                                                </span>
                                                <p className="text-xs text-gray-500">Asignados</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-2xl font-bold ${missingCount > 0 ? "text-red-500" : "text-gray-300"}`}>
                                                    {missingCount}
                                                </span>
                                                <p className="text-xs text-gray-500">Sin Cliente</p>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>

                            {/* 2. Warning Card for Unassigned (Only if missingCount > 0) */}
                            {missingCount > 0 && (
                                <Card className="bg-red-50 dark:bg-red-900/10 border-l-4 border-l-red-500 border-y border-r border-gray-200 dark:border-zinc-800 shadow-none">
                                    <CardBody className="flex flex-row items-center justify-between gap-4">
                                        <div className="flex gap-4 items-center">
                                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600">
                                                <HiExclamation className="text-2xl" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-red-700 dark:text-red-400 text-lg">
                                                    Atención: {missingCount} medidores sin asignar
                                                </h4>
                                                <p className="text-sm text-red-600 dark:text-red-300">
                                                    Estos medidores pertenecen a la ruta pero no tienen cliente. No aparecerán en el mapa ni en la toma de lecturas.
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            color="danger"
                                            variant="flat"
                                            endContent={<HiArrowRight />}
                                            onPress={() => onClose()} // Could verify if we can navigate to inventory
                                        >
                                            Ir al Inventario
                                        </Button>
                                    </CardBody>
                                </Card>
                            )}

                            {/* 3. Map View */}
                            <Card className="border border-gray-200 dark:border-zinc-700 shadow-sm flex-1 min-h-[400px]">
                                <CardHeader className="border-b border-gray-100 dark:border-zinc-800">
                                    <h4 className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300">
                                        <HiLocationMarker className="text-indigo-500" />
                                        Mapa de la Ruta
                                    </h4>
                                </CardHeader>
                                <CardBody className="p-0 h-[500px] relative">
                                    {loading ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 z-20">
                                            <Spinner size="lg" label="Cargando mapa..." />
                                        </div>
                                    ) : (
                                        <MapaRutas
                                            medidores={medidoresMapa} // Ahora pasamos los marcadores detallados
                                            puntosRuta={puntosRutaOverlay} // Y la secuencia visual
                                            rutaCalculada={rutaFinal} // Y la línea
                                            dibujar={true}
                                            readOnly={true} // 🔹 Solo lectura, sin botones de agregar/quitar y sin líneas extrañas
                                            onAgregarMedidor={() => { }} // No-op
                                            onEliminarMedidor={() => { }} // No-op
                                        />
                                    )}
                                </CardBody>
                            </Card>

                        </ModalBody>
                        <ModalFooter className="border-t border-gray-100 dark:border-zinc-800">
                            <Button color="danger" variant="light" onPress={onClose}>
                                Cerrar
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default ModalDetalleRuta;
