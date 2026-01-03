import React, { useState, useMemo } from "react";
import { Card, CardBody, CardHeader, Chip, Button, Divider, Select, SelectItem } from "@nextui-org/react";
import { HiSearch, HiLocationMarker, HiCog, HiCheck, HiX, HiHashtag, HiUser } from "react-icons/hi";
import MapaMedidores from "../../mapa/MapaMedidores";
import { useMedidores } from "../../../context/MedidoresContext";
import LoadingSkeleton from "./components/LoadingSkeleton";

const TabMapaMedidores = () => {
    const {
        medidores,
        loading,
        initialLoading,
        medidoresAsignados
    } = useMedidores();

    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("todos");
    const [filtroAsignacion, setFiltroAsignacion] = useState("todos"); // todos, asignados, disponibles
    const [filtroPueblo, setFiltroPueblo] = useState("todos"); // todos, Nacori Grande, Matape, Adivino
    const [selectedMedidor, setSelectedMedidor] = useState(null);

    const pueblos = [
        { key: "Nacori Grande", label: "Nacori Grande" },
        { key: "Matape", label: "Matape" },
        { key: "Adivino", label: "Adivino" },
    ];

    // Estadísticas básicas
    const estadisticas = useMemo(() => {
        if (!medidores) return { total: 0 };
        return { total: medidores.length };
    }, [medidores]);

    // Helper para normalizar texto (quitar acentos, minúsculas)
    const normalizeText = (text) => {
        if (!text) return "";
        return text.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    // Filtrar medidores (Búsqueda inteligente + Filtros avanzados)
    const medidoresFiltrados = useMemo(() => {
        if (!medidores) return [];
        return medidores.filter(medidor => {
            // 1. Búsqueda Texto
            const termino = normalizeText(busqueda);
            const ubicacionNorm = normalizeText(medidor.ubicacion);
            const serieNorm = normalizeText(medidor.numero_serie);

            const coincideTexto =
                !busqueda ||
                ubicacionNorm.includes(termino) ||
                serieNorm.includes(termino);

            // 2. Estado (Activo/Inactivo)
            const coincideEstado = filtroEstado === "todos" || medidor.estado_medidor === filtroEstado;

            // 3. Asignación (Asignado/Disponible)
            let coincideAsignacion = true;
            if (filtroAsignacion === "asignados") {
                coincideAsignacion = !!medidor.cliente_id;
            } else if (filtroAsignacion === "disponibles") {
                coincideAsignacion = !medidor.cliente_id;
            }

            // 4. Pueblo / Ciudad
            let coincidePueblo = true;
            if (filtroPueblo !== "todos") {
                const puebloBusqueda = normalizeText(filtroPueblo);

                // Prefijos por pueblo
                const prefijoPueblo = {
                    "Nacori Grande": "ng",
                    "Matape": "mp",
                    "Adivino": "ad"
                }[filtroPueblo] || "";

                // Chequear prefijo en número de serie (ej: NG-123)
                const tienePrefijo = prefijoPueblo && serieNorm.startsWith(prefijoPueblo);

                // Buscar coincidencia en ubicación o campos específicos
                coincidePueblo =
                    tienePrefijo ||
                    ubicacionNorm.includes(puebloBusqueda) ||
                    normalizeText(medidor.ciudad).includes(puebloBusqueda) ||
                    normalizeText(medidor.pueblo).includes(puebloBusqueda);
            }

            return coincideTexto && coincideEstado && coincideAsignacion && coincidePueblo;
        });
    }, [medidores, busqueda, filtroEstado, filtroAsignacion, filtroPueblo]);

    const handleSelectMedidor = (medidor) => {
        setSelectedMedidor(medidor);
    };

    if (initialLoading) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">

            {/* Mapa */}
            <div className="lg:col-span-2">
                <Card className="h-[calc(100vh-190px)] backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border-0 shadow-xl">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-green-500 to-teal-600 rounded-full">
                                <HiLocationMarker className="text-white text-lg" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                                    Ubicación de Medidores
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Mapa interactivo con {medidoresFiltrados.length} medidores visibles
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardBody className="pt-0 p-0">
                        <div className="h-full w-full rounded-b-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                            {/* FIX: Pasar medidoresFiltrados al mapa */}
                            <MapaMedidores medidores={medidoresFiltrados} selectedMedidor={selectedMedidor} />
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Panel lateral - LISTA DE MEDIDORES */}
            <div className="flex flex-col h-[calc(100vh-190px)]">
                <Card className="h-full backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border-0 shadow-xl">
                    <CardHeader className="pb-3 flex-none">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full">
                                <HiCog className="text-white text-lg" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                                    Lista de Medidores
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {medidoresFiltrados.length} encontrados
                                </p>
                            </div>
                            {loading && !initialLoading && (
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            )}
                        </div>
                    </CardHeader>

                    <CardBody className="pt-0 flex flex-col gap-4 overflow-hidden">

                        {/* Filtros Unificados con NextUI */}
                        <div className="space-y-3 flex-none px-1">
                            {/* Buscador */}
                            <div>
                                <div className="relative w-full flex">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 z-10">
                                        <HiSearch className="inline-block h-5 w-5 text-blue-600" />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Buscar por serie o ubicación..."
                                        value={busqueda}
                                        onChange={(e) => setBusqueda(e.target.value)}
                                        className="border border-gray-300 text-gray-600 rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all duration-200"
                                    />
                                </div>
                            </div>

                            {/* Filtros Grid */}
                            <div className="grid grid-cols-2 gap-2">
                                <Select
                                    label="Pueblo"
                                    size="sm"
                                    placeholder="Todos"
                                    selectedKeys={[filtroPueblo]}
                                    onChange={(e) => setFiltroPueblo(e.target.value || "todos")}
                                >
                                    <SelectItem key="todos" value="todos">Todos</SelectItem>
                                    {pueblos.map(p => (
                                        <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                                    ))}
                                </Select>

                                <Select
                                    label="Asignación"
                                    size="sm"
                                    placeholder="Todos"
                                    selectedKeys={[filtroAsignacion]}
                                    onChange={(e) => setFiltroAsignacion(e.target.value || "todos")}
                                >
                                    <SelectItem key="todos" value="todos">Todos</SelectItem>
                                    <SelectItem key="disponibles" value="disponibles">Disponibles</SelectItem>
                                    <SelectItem key="asignados" value="asignados">Asignados</SelectItem>
                                </Select>
                            </div>

                            {/* Estado Select */}
                            <Select
                                label="Estado"
                                size="sm"
                                placeholder="Todos los estados"
                                selectedKeys={[filtroEstado]}
                                onChange={(e) => setFiltroEstado(e.target.value || "todos")}
                            >
                                <SelectItem key="todos" value="todos">Todos</SelectItem>
                                <SelectItem key="Activo" value="Activo">Activos</SelectItem>
                                <SelectItem key="Inactivo" value="Inactivo">Inactivos</SelectItem>
                            </Select>
                        </div>

                        <Divider className="my-2 flex-none" />

                        {/* Lista */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                            <div className="text-sm text-gray-600 dark:text-gray-300 mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                📊 Mostrando {medidoresFiltrados.length} de {estadisticas.total} medidores
                            </div>

                            {medidoresFiltrados.map(medidor => (
                                <Card
                                    key={medidor.id}
                                    isPressable
                                    onPress={() => handleSelectMedidor(medidor)}
                                    className={`w-full border-2 transition-all hover:shadow-lg bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700
                                        ${selectedMedidor?.id === medidor.id
                                            ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-900'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                                        }
                                    `}
                                >
                                    <CardBody className="p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3 w-full">
                                                <div className="p-2 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-700 rounded-full flex-shrink-0">
                                                    <HiCog className="text-blue-600 dark:text-blue-300 text-sm" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                        <HiHashtag className="w-3 h-3 text-blue-500" />
                                                        {medidor.numero_serie}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-1 mt-1">
                                                        <HiLocationMarker className="w-3 h-3 text-purple-500 flex-shrink-0 mt-0.5" />
                                                        <span className="whitespace-normal break-words leading-tight">{medidor.ubicacion}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <Chip size="sm" color={medidor.estado_medidor === "Activo" ? "success" : "danger"} variant="flat" className="font-semibold">
                                                {medidor.estado_medidor}
                                            </Chip>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 mt-3">
                                            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                <span className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                                                    <HiLocationMarker className="w-3 h-3" /> Coordenadas:
                                                </span>
                                                <span className="text-xs font-semibold text-gray-800 dark:text-white">
                                                    {Number(medidor.latitud || 0).toFixed(4)}, {Number(medidor.longitud || 0).toFixed(4)}
                                                </span>
                                            </div>

                                            {/* Status de Cliente siempre visible para consistencia de altura */}
                                            {medidor.cliente_id ? (
                                                <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                                        <HiUser className="w-3 h-3" /> Cliente:
                                                    </span>
                                                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-200">Asignado</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                        <HiUser className="w-3 h-3" /> Cliente:
                                                    </span>
                                                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500 italic">Disponible</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>
                            ))}

                            {medidoresFiltrados.length === 0 && (
                                <Card className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border border-gray-200 dark:border-gray-700">
                                    <CardBody className="text-center py-8">
                                        <HiSearch className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No se encontraron medidores</h3>
                                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">No hay medidores que coincidan con los filtros aplicados</p>
                                    </CardBody>
                                </Card>
                            )}
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default TabMapaMedidores;
