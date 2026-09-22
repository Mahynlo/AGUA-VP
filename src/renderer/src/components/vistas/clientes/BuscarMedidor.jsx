import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useMedidores } from "../../../context/MedidoresContext";
import {
    Chip,
    Button,
    Spinner
} from "@heroui/react";
import {
    HiSearch,
    HiCog,
    HiLocationMarker,
    HiX,
    HiPlus,
    HiInbox
} from "react-icons/hi";

// Componente de Input Personalizado (Premium UI - Token 4)
const CustomInput = ({ label, value, onChange, icon, type = "text", placeholder, autoFocus }) => {
    return (
        <div className="w-full flex flex-col gap-1.5">
            {label && (
                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest ml-1">
                    {label}
                </label>
            )}
            <div className="relative w-full flex items-center group">
                <span className="absolute left-4 text-slate-400 dark:text-zinc-500 flex items-center justify-center group-focus-within:text-indigo-500 transition-colors duration-200 pointer-events-none">
                    {icon}
                </span>
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    className="w-full pl-11 pr-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 resize-none h-[52px] bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-none placeholder:text-slate-400/70"
                />
            </div>
        </div>
    );
};

const BuscarMedidor = ({ onMedidorSeleccionado, clienteId, onLiberarMedidor }) => {
    const { allMedidores, actualizarMedidores, loading, initialLoading } = useMedidores();
    const [busqueda, setBusqueda] = useState("");
    const [resultados, setResultados] = useState([]);
    const [medidoresSeleccionados, setMedidoresSeleccionados] = useState([]);
    const [medidoresLiberados, setMedidoresLiberados] = useState(new Set());
    const [isSearching, setIsSearching] = useState(false);

    // Asegurar que allMedidores se cargue de forma proactiva al abrir la gestión
    useEffect(() => {
        if ((!allMedidores || allMedidores.length === 0) && !loading && !initialLoading) {
            actualizarMedidores();
        }
    }, [allMedidores, loading, initialLoading, actualizarMedidores]);

    // Medidores ya asignados al cliente
    const medidoresAsignadosCliente = useMemo(() =>
        (allMedidores || []).filter(medidor => medidor.cliente_id === clienteId),
        [allMedidores, clienteId]
    );

    // Búsqueda con debounce
    useEffect(() => {
        if (busqueda.trim() === "") {
            setResultados([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const normalizar = (str) =>
            (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const termino = normalizar(busqueda);
        const timeoutId = setTimeout(() => {
            const filtrados = (allMedidores || []).filter((medidor) =>
                normalizar(`${medidor.numero_serie} ${medidor.ubicacion}`).includes(termino)
            );
            setResultados(filtrados);
            setIsSearching(false);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [busqueda, allMedidores]);

    const seleccionarMedidor = useCallback((medidor) => {
        if (medidor.cliente_id && medidor.cliente_id !== clienteId) return;

        const yaSeleccionado = medidoresSeleccionados.some(m => m.id === medidor.id);
        if (!yaSeleccionado) {
            const nuevosSeleccionados = [...medidoresSeleccionados, medidor];
            setMedidoresSeleccionados(nuevosSeleccionados);
            onMedidorSeleccionado(nuevosSeleccionados.map(m => m.id));
        }

        setBusqueda("");
        setResultados([]);
    }, [medidoresSeleccionados, onMedidorSeleccionado, clienteId]);

    const quitarMedidor = useCallback((id) => {
        const nuevos = medidoresSeleccionados.filter(m => m.id !== id);
        setMedidoresSeleccionados(nuevos);
        onMedidorSeleccionado(nuevos.map(m => m.id));
    }, [medidoresSeleccionados, onMedidorSeleccionado]);

    const manejarLiberacion = useCallback((medidorId) => {
        setMedidoresLiberados(prev => {
            const nuevoSet = new Set(prev);
            if (nuevoSet.has(medidorId)) {
                nuevoSet.delete(medidorId);
            } else {
                nuevoSet.add(medidorId);
            }
            onLiberarMedidor(Array.from(nuevoSet));
            return nuevoSet;
        });
    }, [onLiberarMedidor]);

    const renderChip = (medidor) => {
        if (!medidor.cliente_id) {
            return (
                <Chip size="sm" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[9px] uppercase tracking-widest px-1 h-5">
                    Libre
                </Chip>
            );
        } else if (medidor.cliente_id === clienteId) {
            return (
                <Chip size="sm" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[9px] uppercase tracking-widest px-1 h-5">
                    Actual
                </Chip>
            );
        } else {
            return (
                <Chip size="sm" className="bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-[9px] uppercase tracking-widest px-1 h-5">
                    Ocupado
                </Chip>
            );
        }
    };
    return (
        <div className="flex flex-col lg:flex-row w-full gap-6 min-h-0">
            
            {/* ── PANEL IZQUIERDO: Medidores Asignados ── */}
            <div className="flex-1 flex flex-col bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-3xl p-5">
                
                {/* Header Panel Izquierdo */}
                <div className="flex items-center gap-3 border-b border-slate-200 dark:border-zinc-800/80 pb-4 mb-4 flex-shrink-0">
                    <div className="p-2 bg-slate-200/50 dark:bg-zinc-800 rounded-xl">
                        <HiCog className="text-lg text-slate-600 dark:text-zinc-300" />
                    </div>
                    <div className="flex flex-col flex-1">
                        <h4 className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest leading-tight">
                            Medidores Asignados
                        </h4>
                        <p className="text-xs font-medium text-slate-400 dark:text-zinc-500 mt-0.5">
                            Equipos actualmente en uso
                        </p>
                    </div>
                    {medidoresAsignadosCliente.length > 0 && (
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 flex items-center justify-center text-[10px] font-black tracking-wider">
                            {medidoresAsignadosCliente.length}
                        </div>
                    )}
                </div>

                {/* Lista Scrolleable (Limitada para portátiles) */}
                <div className="flex-1 max-h-[340px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent pr-1 min-h-0">
                    {medidoresAsignadosCliente.length > 0 ? (
                        <div className="flex flex-col gap-2.5">
                            {medidoresAsignadosCliente.map(medidor => (
                                <div
                                    key={medidor.id}
                                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors flex items-center justify-between gap-3 shadow-sm"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center shrink-0 shadow-sm text-slate-500 dark:text-zinc-400">
                                            <HiCog className="text-base" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <h5 className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate uppercase">
                                                {medidor.numero_serie}
                                            </h5>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <HiLocationMarker className="text-[9px] text-slate-400 shrink-0" />
                                                <span className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 truncate">
                                                    {medidor.ubicacion}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        color={medidoresLiberados.has(medidor.id) ? "danger" : "default"}
                                        variant={medidoresLiberados.has(medidor.id) ? "ghost" : "outline"}
                                        onPress={() => manejarLiberacion(medidor.id)}
                                        className={`h-7 px-2 rounded-lg text-[9px] font-bold uppercase tracking-widest flex-shrink-0 transition-all ${
                                            !medidoresLiberados.has(medidor.id) 
                                                ? "border-slate-200 dark:border-zinc-750 text-slate-550 hover:border-slate-300 dark:hover:border-zinc-650" 
                                                : "bg-red-500/10 text-red-600 dark:text-red-400 border-transparent hover:bg-red-500/20"
                                        }`}
                                    >
                                        {medidoresLiberados.has(medidor.id) ? "Liberado" : "Liberar"}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Empty State Izquierdo */
                        <div className="h-full py-10 flex flex-col items-center justify-center text-center">
                            <div className="p-3 bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 shadow-sm rounded-2xl mb-3">
                                <HiInbox className="text-2xl text-slate-350 dark:text-zinc-550" />
                            </div>
                            <p className="text-xs font-bold text-slate-650 dark:text-zinc-355">Sin medidores asignados</p>
                            <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 mt-1 max-w-[200px]">
                                Este cliente aún no tiene equipos vinculados.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── PANEL DERECHO: Búsqueda y Selección ── */}
            <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 rounded-3xl p-5 shadow-sm">
                
                {/* Header Panel Derecho */}
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-zinc-800/80 pb-4 mb-4 flex-shrink-0">
                    <div className="p-2 bg-indigo-500/10 dark:bg-indigo-900/30 rounded-xl">
                        <HiSearch className="text-lg text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex flex-col">
                        <h4 className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest leading-tight">
                            Buscar Medidores
                        </h4>
                        <p className="text-xs font-medium text-slate-400 dark:text-zinc-500 mt-0.5">
                            Encuentra equipos disponibles
                        </p>
                    </div>
                </div>

                <div className="flex flex-col flex-1 min-h-0">
                    <div>
                        <CustomInput
                            placeholder="Escribe número de serie o ubicación..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            icon={isSearching ? <Spinner size="sm" color="primary" /> : <HiSearch className="w-5 h-5" />}
                        />
                    </div>

                    {/* Resultados de Búsqueda (Integrados inline para que no se recorten en la Card del Modal) */}
                    {resultados.length > 0 && (
                        <div className="mt-3 max-h-48 overflow-y-auto border border-indigo-100 dark:border-zinc-800/80 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/10 p-1.5 flex flex-col gap-1 z-10 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                            {resultados.map((medidor) => {
                                const isDisabled = medidor.cliente_id && medidor.cliente_id !== clienteId;
                                return (
                                    <div
                                        key={medidor.id}
                                        onClick={() => {
                                            if (!isDisabled) seleccionarMedidor(medidor);
                                        }}
                                        className={`
                                            p-2.5 rounded-xl transition-all duration-200 flex items-center justify-between gap-3
                                            ${isDisabled 
                                                ? 'opacity-50 bg-slate-100/50 dark:bg-zinc-900/30 cursor-not-allowed border border-transparent' 
                                                : 'cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 shadow-sm'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={`p-1.5 rounded-lg flex-shrink-0 ${isDisabled ? 'bg-slate-200 dark:bg-zinc-800' : 'bg-indigo-50 dark:bg-zinc-900 border border-indigo-100/50 dark:border-zinc-850 shadow-sm'}`}>
                                                <HiCog className={`text-sm ${isDisabled ? 'text-slate-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate uppercase">
                                                    {medidor.numero_serie}
                                                </h4>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <HiLocationMarker className="text-[9px] text-slate-400 flex-shrink-0" />
                                                    <span className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 truncate">
                                                        {medidor.ubicacion}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="shrink-0 scale-90">
                                            {renderChip(medidor)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Sin resultados */}
                    {busqueda.trim() && !isSearching && resultados.length === 0 && (
                        <div className="mt-3 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/20 p-4 text-center">
                            <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">No se encontraron equipos</p>
                            <p className="text-[10px] font-medium text-slate-500 mt-0.5">Verifica el número de serie.</p>
                        </div>
                    )}

                    {/* Por Asignar (Flex-1 para ocupar espacio) */}
                    <div className="mt-6 flex flex-col flex-1 min-h-0">
                        <div className="flex items-center justify-between mb-3 flex-shrink-0">
                            <h4 className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                Equipos Listos para Agregar
                            </h4>
                            {medidoresSeleccionados.length > 0 && (
                                <div className="w-5.5 h-5.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-black">
                                    {medidoresSeleccionados.length}
                                </div>
                            )}
                        </div>

                        {/* Lista de seleccionados */}
                        <div className="flex-1 max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent pr-1 min-h-0">
                            {medidoresSeleccionados.length > 0 ? (
                                <div className="flex flex-col gap-2 animate-in fade-in duration-300">
                                    {medidoresSeleccionados.map((medidor) => (
                                        <div
                                            key={medidor.id}
                                            className="flex items-center justify-between p-2.5 pl-3 bg-indigo-500/10 border border-indigo-200/50 dark:border-indigo-900/30 rounded-2xl animate-in slide-in-from-bottom-2 duration-200"
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="p-1.5 bg-white dark:bg-zinc-900 rounded-lg shadow-sm shrink-0">
                                                    <HiPlus className="text-xs text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <h5 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 truncate uppercase leading-none">
                                                        {medidor.numero_serie}
                                                    </h5>
                                                    <span className="text-[10px] font-medium text-indigo-600/70 dark:text-indigo-450/70 truncate mt-0.5">
                                                        {medidor.ubicacion}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="ghost"
                                                onPress={() => quitarMedidor(medidor.id)}
                                                className="w-7 h-7 min-w-7 ml-3 bg-white/80 dark:bg-zinc-900/60 text-slate-400 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                                            >
                                                <HiX className="text-sm" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* Empty State "Por Asignar" */
                                <div className="h-full min-h-[100px] flex flex-col items-center justify-center text-center opacity-65 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl p-4 bg-slate-50/30 dark:bg-zinc-900/10">
                                    <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                                        No has seleccionado nuevos equipos
                                    </p>
                                    <p className="text-[10px] font-medium text-slate-400 mt-0.5 max-w-[200px]">
                                        Usa el buscador para añadir nuevos medidores a este cliente.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BuscarMedidor;

