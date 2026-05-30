import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Card, CardBody, CardHeader, Divider, Select, SelectItem, Spinner } from "@nextui-org/react";
import { HiSearch, HiLocationMarker, HiCog, HiHashtag, HiUser } from "react-icons/hi";
import MapaMedidores from "../../mapa/MapaMedidores";
import { useMedidores } from "../../../context/MedidoresContext";
import LoadingSkeleton from "./components/LoadingSkeleton";

const LIST_PAGE = 40; // Tamaño de "ventana" de la lista (render incremental)

const PREFIJO_PUEBLO = {
    "Nacori Grande": "ng",
    "Matape": "mp",
    "Adivino": "ad",
};

const TabMapaMedidores = () => {
    const {
        allMedidores,
        loading,
        initialLoading,
        medidoresAsignados
    } = useMedidores();

    const [busqueda, setBusqueda] = useState("");
    const [debouncedBusqueda, setDebouncedBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("todos");
    const [filtroAsignacion, setFiltroAsignacion] = useState("todos"); // todos, asignados, disponibles
    const [filtroPueblo, setFiltroPueblo] = useState("todos"); // todos, Nacori Grande, Matape, Adivino
    const [selectedMedidor, setSelectedMedidor] = useState(null);
    const [visibleCount, setVisibleCount] = useState(LIST_PAGE);
    const listRef = useRef(null);

    // Debounce de la búsqueda: evita re-filtrar y re-renderizar mapa + lista en cada tecla.
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedBusqueda(busqueda.trim()), 250);
        return () => clearTimeout(timer);
    }, [busqueda]);

    const pueblos = [
        { key: "Nacori Grande", label: "Nacori Grande" },
        { key: "Matape", label: "Matape" },
        { key: "Adivino", label: "Adivino" },
    ];

    // Helper para normalizar texto (quitar acentos, minúsculas)
    const normalizeText = (text) => {
        if (!text) return "";
        return text.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    // Índice con campos normalizados precalculados: solo se recalcula si cambian los
    // medidores, evitando normalizar (NFD + regex) todos los registros en cada pulsación.
    const medidoresIndex = useMemo(() => {
        if (!allMedidores) return [];
        return allMedidores.map((m) => ({
            medidor: m,
            serieNorm: normalizeText(m.numero_serie),
            ubicacionNorm: normalizeText(m.ubicacion),
            ciudadNorm: normalizeText(m.ciudad),
            puebloNorm: normalizeText(m.pueblo),
        }));
    }, [allMedidores]);

    // Filtrar medidores (búsqueda inteligente + filtros avanzados) sobre el índice.
    const medidoresFiltrados = useMemo(() => {
        const termino = normalizeText(debouncedBusqueda);
        const prefijoPueblo = PREFIJO_PUEBLO[filtroPueblo] || "";
        const puebloBusqueda = filtroPueblo !== "todos" ? normalizeText(filtroPueblo) : "";

        const out = [];
        for (const item of medidoresIndex) {
            const { medidor, serieNorm, ubicacionNorm, ciudadNorm, puebloNorm } = item;

            if (termino && !ubicacionNorm.includes(termino) && !serieNorm.includes(termino)) continue;
            if (filtroEstado !== "todos" && medidor.estado_medidor !== filtroEstado) continue;
            if (filtroAsignacion === "asignados" && !medidor.cliente_id) continue;
            if (filtroAsignacion === "disponibles" && medidor.cliente_id) continue;

            if (filtroPueblo !== "todos") {
                const tienePrefijo = prefijoPueblo && serieNorm.startsWith(prefijoPueblo);
                const coincidePueblo =
                    tienePrefijo ||
                    ubicacionNorm.includes(puebloBusqueda) ||
                    ciudadNorm.includes(puebloBusqueda) ||
                    puebloNorm.includes(puebloBusqueda);
                if (!coincidePueblo) continue;
            }

            out.push(medidor);
        }
        return out;
    }, [medidoresIndex, debouncedBusqueda, filtroEstado, filtroAsignacion, filtroPueblo]);

    // Render incremental de la lista: solo se monta una "ventana" de tarjetas a la vez.
    useEffect(() => {
        setVisibleCount(LIST_PAGE);
        if (listRef.current) listRef.current.scrollTop = 0;
    }, [medidoresFiltrados]);

    const handleListScroll = useCallback((e) => {
        const el = e.currentTarget;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 240) {
            setVisibleCount((c) => (c < medidoresFiltrados.length ? c + LIST_PAGE : c));
        }
    }, [medidoresFiltrados.length]);

    const medidoresVisibles = useMemo(
        () => medidoresFiltrados.slice(0, visibleCount),
        [medidoresFiltrados, visibleCount]
    );

    const handleSelectMedidor = useCallback((medidor) => {
        setSelectedMedidor(medidor);
    }, []);

    if (initialLoading) {
        return <LoadingSkeleton />;
    }

    const selectClassNames = {
        trigger: "bg-slate-100/70 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 shadow-none h-[52px]",
        value: "font-medium text-slate-700 dark:text-zinc-200 text-sm",
        label: "text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500"
    };

    return (
        <div className="w-full bg-white dark:bg-zinc-950 rounded-[2rem] border border-slate-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8 lg:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Mapa */}
            <div className="lg:col-span-2">
                <Card className="h-[calc(100vh-190px)] border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 shadow-none rounded-2xl">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                <HiLocationMarker className="text-lg" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
                                    Ubicación de Medidores
                                </h3>
                                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                                    Mapa interactivo con {medidoresFiltrados.length} medidores visibles
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardBody className="pt-0 p-0">
                        <div className="h-full w-full rounded-b-2xl overflow-hidden border border-slate-200 dark:border-zinc-800">
                            {/* FIX: Pasar medidoresFiltrados al mapa */}
                            <MapaMedidores medidores={medidoresFiltrados} selectedMedidor={selectedMedidor} />
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Panel lateral - LISTA DE MEDIDORES */}
            <div className="flex flex-col h-[calc(100vh-190px)]">
                <Card className="h-full border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 shadow-none rounded-2xl">
                    <CardHeader className="pb-3 flex-none">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-xl">
                                <HiCog className="text-lg" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100">
                                    Lista de Medidores
                                </h3>
                                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                                    {medidoresFiltrados.length} encontrados
                                </p>
                            </div>
                            {loading && !initialLoading && (
                                <Spinner size="sm" color="default" />
                            )}
                        </div>
                    </CardHeader>

                    <CardBody className="pt-0 flex flex-col gap-4 overflow-hidden">

                        {/* Filtros Unificados con NextUI */}
                        <div className="space-y-3 flex-none px-1">
                            {/* Buscador */}
                            <div>
                                <div className="relative w-full flex">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-zinc-500 z-10">
                                        <HiSearch className="inline-block h-5 w-5" />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Buscar por serie o ubicación..."
                                        value={busqueda}
                                        onChange={(e) => setBusqueda(e.target.value)}
                                        className="border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-100 rounded-xl pl-10 pr-4 py-3 w-full bg-slate-100/70 dark:bg-zinc-900/80 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-300 transition-all duration-200 h-[52px]"
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
                                    variant="flat"
                                    classNames={selectClassNames}
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
                                    variant="flat"
                                    classNames={selectClassNames}
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
                                variant="flat"
                                classNames={selectClassNames}
                            >
                                <SelectItem key="todos" value="todos">Todos</SelectItem>
                                <SelectItem key="Activo" value="Activo">Activos</SelectItem>
                                <SelectItem key="Inactivo" value="Inactivo">Inactivos</SelectItem>
                            </Select>
                        </div>

                        <Divider className="my-2 flex-none" />

                        {/* Lista (render incremental para fluidez en equipos sin GPU) */}
                        <div
                            ref={listRef}
                            onScroll={handleListScroll}
                            className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
                        >
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-3 p-3 bg-slate-100/70 dark:bg-zinc-900/50 rounded-xl border border-slate-200 dark:border-zinc-800">
                                Mostrando {medidoresVisibles.length} de {medidoresFiltrados.length} medidores
                            </div>

                            {medidoresVisibles.map(medidor => {
                                const seleccionado = selectedMedidor?.id === medidor.id;
                                return (
                                    <button
                                        key={medidor.id}
                                        type="button"
                                        onClick={() => handleSelectMedidor(medidor)}
                                        className={`w-full text-left rounded-xl border p-4 transition-colors bg-white dark:bg-zinc-950/30 ${
                                            seleccionado
                                                ? 'border-sky-500 dark:border-sky-400 ring-2 ring-sky-200/60 dark:ring-sky-900/50'
                                                : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3 w-full min-w-0">
                                                <div className="p-2 bg-slate-500/10 rounded-full flex-shrink-0">
                                                    <HiCog className="text-slate-600 dark:text-zinc-300 text-sm" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                                                        <HiHashtag className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                                        {medidor.numero_serie}
                                                    </p>
                                                    <p className="text-sm text-slate-600 dark:text-zinc-300 flex items-start gap-1 mt-1">
                                                        <HiLocationMarker className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                                                        <span className="whitespace-normal break-words leading-tight">{medidor.ubicacion}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`flex-shrink-0 font-semibold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                                medidor.estado_medidor === "Activo"
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                            }`}>
                                                {medidor.estado_medidor}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 mt-3">
                                            <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-zinc-900/60 rounded-lg border border-slate-200 dark:border-zinc-800">
                                                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                                                    <HiLocationMarker className="w-3 h-3" /> Coordenadas:
                                                </span>
                                                <span className="text-xs font-semibold text-slate-800 dark:text-zinc-100">
                                                    {Number(medidor.latitud || 0).toFixed(4)}, {Number(medidor.longitud || 0).toFixed(4)}
                                                </span>
                                            </div>

                                            {medidor.cliente_id ? (
                                                <div className="flex items-center justify-between p-2 bg-sky-500/10 rounded-lg border border-sky-200/70 dark:border-sky-900/40">
                                                    <span className="text-xs font-medium text-sky-700 dark:text-sky-400 flex items-center gap-1">
                                                        <HiUser className="w-3 h-3" /> Cliente:
                                                    </span>
                                                    <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">Asignado</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-zinc-900/60 rounded-lg border border-dashed border-slate-300 dark:border-zinc-700">
                                                    <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                                                        <HiUser className="w-3 h-3" /> Cliente:
                                                    </span>
                                                    <span className="text-xs font-medium text-slate-400 dark:text-zinc-500 italic">Disponible</span>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}

                            {visibleCount < medidoresFiltrados.length && (
                                <div className="py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                                    Desplázate para ver más · {medidoresFiltrados.length - visibleCount} restantes
                                </div>
                            )}

                            {medidoresFiltrados.length === 0 && (
                                <div className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 rounded-xl text-center py-8 px-4">
                                    <HiSearch className="w-12 h-12 mx-auto text-slate-400 dark:text-zinc-500 mb-3" />
                                    <h3 className="text-lg font-semibold text-slate-700 dark:text-zinc-300 mb-2">No se encontraron medidores</h3>
                                    <p className="text-slate-500 dark:text-zinc-400 max-w-md mx-auto">No hay medidores que coincidan con los filtros aplicados</p>
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>
            </div>
            </div>
        </div>
    );
};

export default TabMapaMedidores;
