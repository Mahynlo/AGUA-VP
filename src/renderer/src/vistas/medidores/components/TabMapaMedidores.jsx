import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { HiSearch, HiLocationMarker, HiCog, HiHashtag, HiUser, HiX, HiChevronDown, HiMap, HiEye, HiStatusOnline, HiExclamation } from "react-icons/hi";
import MapaMedidores from "../../../components/mapa/MapaMedidores";
import { useMedidores } from "../../../context/MedidoresContext";
import LoadingSkeleton from "./LoadingSkeleton";
import { EncabezadoSeccion, Indicador, IndicadoresVista } from "../../../components/ui/VistaModulo";

const LIST_PAGE = 40; // Tamaño de "ventana" de la lista (render incremental)

const SELECT_CLS = "w-full h-11 pl-3 pr-8 text-sm font-semibold rounded-xl bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer";
const PANEL_CLS = "h-[calc(100vh-250px)] min-h-[560px] border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden flex flex-col";

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
            clienteNorm: normalizeText(m.cliente_nombre),
        }));
    }, [allMedidores]);

    // Filtrar medidores (búsqueda inteligente + filtros avanzados) sobre el índice.
    const medidoresFiltrados = useMemo(() => {
        const termino = normalizeText(debouncedBusqueda);
        const prefijoPueblo = PREFIJO_PUEBLO[filtroPueblo] || "";
        const puebloBusqueda = filtroPueblo !== "todos" ? normalizeText(filtroPueblo) : "";

        const out = [];
        for (const item of medidoresIndex) {
            const { medidor, serieNorm, ubicacionNorm, ciudadNorm, puebloNorm, clienteNorm } = item;

            if (termino && !ubicacionNorm.includes(termino) && !serieNorm.includes(termino) && !clienteNorm.includes(termino)) continue;
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

    // Conteos para los indicadores del encabezado (solo presentación)
    const conteoMapa = useMemo(() => {
        const lista = allMedidores || [];
        const conGps = lista.filter(m => Number(m.latitud) && Number(m.longitud)).length;
        return {
            total: lista.length,
            conGps,
            sinGps: lista.length - conGps,
            activos: lista.filter(m => m.estado_medidor === "Activo").length
        };
    }, [allMedidores]);

    const handleSelectMedidor = useCallback((medidor) => {
        setSelectedMedidor(medidor);
    }, []);

    if (initialLoading) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="w-full flex flex-col gap-4">

            {/* Indicadores del mapa, junto al título del módulo */}
            <IndicadoresVista>
                <Indicador
                    icon={HiEye}
                    tint="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    label="En el mapa"
                    value={medidoresFiltrados.length.toLocaleString('es-MX')}
                    sufijo={<span className="text-xs font-bold text-slate-400 dark:text-zinc-500 whitespace-nowrap">/ {conteoMapa.total.toLocaleString('es-MX')}</span>}
                    detalle="Medidores que cumplen la búsqueda y los filtros"
                />
                <Indicador icon={HiLocationMarker} tint="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" label="Con coordenadas" value={conteoMapa.conGps.toLocaleString('es-MX')} valueClass="text-emerald-600 dark:text-emerald-400" detalle="Tienen latitud y longitud registradas" />
                <Indicador icon={HiExclamation} tint="bg-amber-500/10 text-amber-600 dark:text-amber-400" label="Sin coordenadas" value={conteoMapa.sinGps.toLocaleString('es-MX')} valueClass={conteoMapa.sinGps > 0 ? "text-amber-600 dark:text-amber-400" : undefined} detalle="No se pueden ubicar en el mapa" />
                <Indicador icon={HiStatusOnline} tint="bg-orange-500/10 text-orange-600 dark:text-orange-400" label="En servicio" value={conteoMapa.activos.toLocaleString('es-MX')} detalle="Medidores activos" />
            </IndicadoresVista>

            {/* Subtítulo de la pestaña */}
            <EncabezadoSeccion
                icon={HiMap}
                titulo="Mapa de ubicaciones"
                descripcion="Localiza los medidores; elige uno de la lista para ubicarlo en el mapa."
                cargando={loading && !initialLoading}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Mapa */}
            <div className="lg:col-span-2">
                <div className={PANEL_CLS}>
                    <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-100 dark:border-zinc-800/80 shrink-0">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">Ubicación de medidores</h3>
                        <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                            <b className="text-slate-700 dark:text-zinc-200">{medidoresFiltrados.length}</b> visibles
                        </span>
                    </div>
                    <div className="flex-1 min-h-0 p-2">
                        <MapaMedidores medidores={medidoresFiltrados} selectedMedidor={selectedMedidor} />
                    </div>
                </div>
            </div>

            {/* Panel lateral - LISTA DE MEDIDORES */}
            <div className="flex flex-col">
                <div className={PANEL_CLS}>
                    <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-100 dark:border-zinc-800/80 shrink-0">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">Lista de medidores</h3>
                        <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                            <b className="text-slate-700 dark:text-zinc-200">{medidoresFiltrados.length}</b> encontrados
                        </span>
                    </div>

                    <div className="flex-1 min-h-0 flex flex-col">

                        {/* Filtros Unificados */}
                        <div className="space-y-2 flex-none px-4 py-3 border-b border-slate-100 dark:border-zinc-800/80">
                            {/* Buscador */}
                            <div>
                                <div className="relative w-full flex items-center">
                                    <span className="absolute left-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none">
                                        <HiSearch className="w-5 h-5" />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Buscar por serie, ubicación o cliente..."
                                        value={busqueda}
                                        onChange={(e) => setBusqueda(e.target.value)}
                                        className="w-full pl-11 pr-10 text-sm font-medium rounded-xl bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-none h-11"
                                    />
                                    {busqueda && (
                                        <button
                                            type="button"
                                            onClick={() => setBusqueda("")}
                                            aria-label="Limpiar búsqueda"
                                            className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                                        >
                                            <HiX className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Filtros Grid */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="relative">
                                    <select
                                        aria-label="Pueblo"
                                        value={filtroPueblo}
                                        onChange={(e) => setFiltroPueblo(e.target.value || "todos")}
                                        className={SELECT_CLS}
                                    >
                                        <option value="todos">Todos los pueblos</option>
                                        {pueblos.map(p => (
                                            <option key={p.key} value={p.key}>{p.label}</option>
                                        ))}
                                    </select>
                                    <HiChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>

                                <div className="relative">
                                    <select
                                        aria-label="Asignación"
                                        value={filtroAsignacion}
                                        onChange={(e) => setFiltroAsignacion(e.target.value || "todos")}
                                        className={SELECT_CLS}
                                    >
                                        <option value="todos">Todas asignaciones</option>
                                        <option value="disponibles">Disponibles</option>
                                        <option value="asignados">Asignados</option>
                                    </select>
                                    <HiChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Estado Select */}
                            <div className="relative">
                                <select
                                    aria-label="Estado"
                                    value={filtroEstado}
                                    onChange={(e) => setFiltroEstado(e.target.value || "todos")}
                                    className={SELECT_CLS}
                                >
                                    <option value="todos">Todos los estados</option>
                                    <option value="Activo">Activos</option>
                                    <option value="Inactivo">Inactivos</option>
                                </select>
                                <HiChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Lista (render incremental para fluidez en equipos sin GPU) */}
                        <div
                            ref={listRef}
                            onScroll={handleListScroll}
                            className="flex-1 overflow-y-auto space-y-2 p-3 bg-slate-50/50 dark:bg-zinc-900/20 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
                        >
                            <p className="px-1 pb-1 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                                Mostrando <b className="text-slate-700 dark:text-zinc-200">{medidoresVisibles.length}</b> de <b className="text-slate-700 dark:text-zinc-200">{medidoresFiltrados.length}</b> medidores
                            </p>

                            {medidoresVisibles.map(medidor => {
                                const seleccionado = selectedMedidor?.id === medidor.id;
                                return (
                                    <button
                                        key={medidor.id}
                                        type="button"
                                        onClick={() => handleSelectMedidor(medidor)}
                                        className={`w-full text-left rounded-xl border p-3.5 transition-colors bg-white dark:bg-zinc-950 ${
                                            seleccionado
                                                ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20 dark:ring-blue-900/50'
                                                : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3 w-full min-w-0">
                                                <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex-shrink-0">
                                                    <HiCog className="text-sm" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-2 font-mono">
                                                        <HiHashtag className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                                        {medidor.numero_serie}
                                                    </p>
                                                    <p className="text-sm text-slate-600 dark:text-zinc-300 flex items-start gap-1 mt-1">
                                                        <HiLocationMarker className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                                                        <span className="whitespace-normal break-words leading-tight">{medidor.ubicacion}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`flex-shrink-0 font-bold text-[11px] px-2 py-0.5 rounded-md ${
                                                medidor.estado_medidor === "Activo"
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                            }`}>
                                                {medidor.estado_medidor}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 mt-3">
                                            <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-zinc-900/60 rounded-lg border border-slate-200 dark:border-zinc-800">
                                                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                                                    <HiLocationMarker className="w-3 h-3" /> Coordenadas:
                                                </span>
                                                <span className="text-xs font-semibold font-mono text-slate-800 dark:text-zinc-100">
                                                    {Number(medidor.latitud || 0).toFixed(4)}, {Number(medidor.longitud || 0).toFixed(4)}
                                                </span>
                                            </div>

                                            {medidor.cliente_id ? (
                                                <div className="flex flex-col gap-1 p-2 bg-blue-500/10 rounded-lg border border-blue-200/70 dark:border-blue-900/40">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-medium text-blue-700 dark:text-blue-400 flex items-center gap-1">
                                                            <HiUser className="w-3 h-3" /> Cliente:
                                                        </span>
                                                        <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400">Asignado</span>
                                                    </div>
                                                    <div className="text-xs font-bold text-slate-800 dark:text-zinc-100 pl-4 truncate">
                                                        {medidor.cliente_nombre || "Cliente"}
                                                        {medidor.numero_predio ? <span className="font-medium text-slate-500 dark:text-zinc-400"> • Predio #{medidor.numero_predio}</span> : ""}
                                                    </div>
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
                                <div className="py-3 text-center text-xs font-semibold text-slate-400 dark:text-zinc-500">
                                    Desplázate para ver más · {medidoresFiltrados.length - visibleCount} restantes
                                </div>
                            )}

                            {medidoresFiltrados.length === 0 && (
                                <div className="text-center py-10 px-4">
                                    <HiSearch className="w-12 h-12 mx-auto text-slate-400 dark:text-zinc-500 opacity-40 mb-3" />
                                    <p className="font-bold text-sm text-slate-600 dark:text-zinc-300">No se encontraron medidores</p>
                                    <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-1">Ajusta la búsqueda o los filtros.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};

export default TabMapaMedidores;
