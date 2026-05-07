import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useMedidores } from "../../../context/MedidoresContext";
import {
    Chip,
    Button,
    Avatar,
    Spinner
} from "@nextui-org/react";
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
    const { allMedidores } = useMedidores();
    const [busqueda, setBusqueda] = useState("");
    const [resultados, setResultados] = useState([]);
    const [medidoresSeleccionados, setMedidoresSeleccionados] = useState([]);
    const [medidoresLiberados, setMedidoresLiberados] = useState(new Set());
    const [isSearching, setIsSearching] = useState(false);

    // Medidores ya asignados al cliente
    const medidoresAsignadosCliente = useMemo(() =>
        allMedidores.filter(medidor => medidor.cliente_id === clienteId),
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
            const filtrados = allMedidores.filter((medidor) =>
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
        <div className="flex flex-col lg:flex-row w-full h-full gap-6 min-h-[500px]">
            
            {/* ── PANEL IZQUIERDO: Medidores Asignados ── */}
            <div className="flex-1 flex flex-col bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-3xl p-6 sm:p-8">
                
                {/* Header Panel Izquierdo */}
                <div className="flex items-center gap-3 border-b border-slate-200 dark:border-zinc-800/80 pb-5 mb-5 flex-shrink-0">
                    <div className="p-2.5 bg-slate-200/50 dark:bg-zinc-800 rounded-xl">
                        <HiCog className="text-xl text-slate-600 dark:text-zinc-300" />
                    </div>
                    <div className="flex flex-col flex-1">
                        <h4 className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest leading-tight">
                            Medidores Asignados
                        </h4>
                        <p className="text-xs font-medium text-slate-400 dark:text-zinc-500 mt-0.5">
                            Equipos actualmente en uso
                        </p>
                    </div>
                    {medidoresAsignadosCliente.length > 0 && (
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 flex items-center justify-center text-[10px] font-black tracking-wider">
                            {medidoresAsignadosCliente.length}
                        </div>
                    )}
                </div>

                {/* Lista Scrolleable */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent pr-2 min-h-0">
                    {medidoresAsignadosCliente.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            {medidoresAsignadosCliente.map(medidor => (
                                <div
                                    key={medidor.id}
                                    className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors flex items-center justify-between gap-4 shadow-sm"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <Avatar
                                            icon={<HiCog className="text-lg" />}
                                            classNames={{
                                                base: "bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex-shrink-0 shadow-sm",
                                                icon: "text-slate-500 dark:text-zinc-400"
                                            }}
                                            size="sm"
                                        />
                                        <div className="flex flex-col min-w-0">
                                            <h5 className="text-sm font-black text-slate-800 dark:text-zinc-100 truncate uppercase">
                                                {medidor.numero_serie}
                                            </h5>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <HiLocationMarker className="text-[10px] text-slate-400 shrink-0" />
                                                <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 truncate">
                                                    {medidor.ubicacion}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        color={medidoresLiberados.has(medidor.id) ? "danger" : "default"}
                                        variant={medidoresLiberados.has(medidor.id) ? "flat" : "bordered"}
                                        onPress={() => manejarLiberacion(medidor.id)}
                                        className={`h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest flex-shrink-0 transition-all ${
                                            !medidoresLiberados.has(medidor.id) 
                                                ? "border-slate-200 dark:border-zinc-700 text-slate-500 hover:border-slate-300 dark:hover:border-zinc-600" 
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
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <div className="p-4 bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 shadow-sm rounded-2xl mb-4">
                                <HiInbox className="text-3xl text-slate-300 dark:text-zinc-600" />
                            </div>
                            <p className="text-sm font-black text-slate-600 dark:text-zinc-300">Sin medidores</p>
                            <p className="text-xs font-medium text-slate-400 dark:text-zinc-500 mt-1 max-w-[200px]">
                                Este cliente aún no tiene medidores asignados.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── PANEL DERECHO: Búsqueda y Selección ── */}
            <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-sm">
                
                {/* Header Panel Derecho */}
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-zinc-800/80 pb-5 mb-5 flex-shrink-0">
                    <div className="p-2.5 bg-indigo-500/10 dark:bg-indigo-900/30 rounded-xl">
                        <HiSearch className="text-xl text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex flex-col">
                        <h4 className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest leading-tight">
                            Buscar Medidores
                        </h4>
                        <p className="text-xs font-medium text-slate-400 dark:text-zinc-500 mt-0.5">
                            Encuentra equipos disponibles
                        </p>
                    </div>
                </div>

                <div className="flex flex-col flex-1 min-h-0 z-20">
                    <div className="relative z-30">
                        <CustomInput
                            placeholder="Escribe número de serie o ubicación..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            icon={isSearching ? <Spinner size="sm" color="primary" /> : <HiSearch className="w-5 h-5" />}
                        />

                        {/* Resultados Flotantes (Dropdown Absoluto) */}
                        {resultados.length > 0 && (
                            <div className="absolute top-[calc(100%+8px)] left-0 right-0 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent border border-slate-200 dark:border-zinc-800 shadow-xl rounded-2xl bg-white dark:bg-zinc-950 p-2 flex flex-col gap-1">
                                {resultados.map((medidor) => {
                                    const isDisabled = medidor.cliente_id && medidor.cliente_id !== clienteId;
                                    return (
                                        <div
                                            key={medidor.id}
                                            onClick={() => {
                                                if (!isDisabled) seleccionarMedidor(medidor);
                                            }}
                                            className={`
                                                p-3 rounded-xl transition-all duration-200 flex items-center justify-between gap-3
                                                ${isDisabled 
                                                    ? 'opacity-50 bg-slate-50 dark:bg-zinc-900/40 cursor-not-allowed' 
                                                    : 'cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={`p-2 rounded-xl flex-shrink-0 ${isDisabled ? 'bg-slate-200 dark:bg-zinc-800' : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-sm'}`}>
                                                    <HiCog className={`text-lg ${isDisabled ? 'text-slate-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <h4 className="text-sm font-black text-slate-800 dark:text-zinc-100 truncate uppercase">
                                                            {medidor.numero_serie}
                                                        </h4>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <HiLocationMarker className="text-[10px] text-slate-400 flex-shrink-0" />
                                                        <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 truncate">
                                                            {medidor.ubicacion}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="shrink-0">
                                                {renderChip(medidor)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Sin resultados flotantes */}
                        {busqueda.trim() && !isSearching && resultados.length === 0 && (
                            <div className="absolute top-[calc(100%+8px)] left-0 right-0 border border-slate-200 dark:border-zinc-800 shadow-xl rounded-2xl bg-white dark:bg-zinc-950 p-6 text-center z-30">
                                <p className="text-sm font-black text-slate-700 dark:text-zinc-300">No se encontraron equipos</p>
                                <p className="text-xs font-medium text-slate-500 mt-1">Verifica el número de serie e intenta de nuevo.</p>
                            </div>
                        )}
                    </div>

                    {/* Por Asignar (Flex-1 para ocupar espacio) */}
                    <div className="mt-8 flex flex-col flex-1 min-h-0 z-10">
                        <div className="flex items-center justify-between mb-4 flex-shrink-0">
                            <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                Equipos Listos para Agregar
                            </h4>
                            {medidoresSeleccionados.length > 0 && (
                                <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-black">
                                    {medidoresSeleccionados.length}
                                </div>
                            )}
                        </div>

                        {/* Lista de seleccionados */}
                        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent pr-2 min-h-0">
                            {medidoresSeleccionados.length > 0 ? (
                                <div className="flex flex-col gap-3 animate-in fade-in duration-300">
                                    {medidoresSeleccionados.map((medidor) => (
                                        <div
                                            key={medidor.id}
                                            className="flex items-center justify-between p-3 pl-4 bg-indigo-500/10 border border-indigo-200/70 dark:border-indigo-900/40 rounded-2xl"
                                        >
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl shadow-sm shrink-0">
                                                    <HiPlus className="text-sm text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <h5 className="text-sm font-black text-indigo-900 dark:text-indigo-200 truncate uppercase leading-tight">
                                                        {medidor.numero_serie}
                                                    </h5>
                                                    <p className="text-[10px] font-bold text-indigo-600/70 dark:text-indigo-400/70 uppercase tracking-widest truncate mt-0.5">
                                                        {medidor.ubicacion}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="flat"
                                                onPress={() => quitarMedidor(medidor.id)}
                                                className="w-8 h-8 min-w-8 ml-3 bg-white/80 dark:bg-zinc-900/60 text-slate-400 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                                            >
                                                <HiX className="text-base" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* Empty State "Por Asignar" */
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-60 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl p-6 bg-slate-50/50 dark:bg-zinc-900/30">
                                    <div className="p-3 bg-white dark:bg-zinc-800 rounded-full mb-3 shadow-sm border border-slate-100 dark:border-zinc-700">
                                        <HiSearch className="text-xl text-slate-400" />
                                    </div>
                                    <p className="text-sm font-black text-slate-600 dark:text-zinc-300">
                                        No has seleccionado equipos.
                                    </p>
                                    <p className="text-[11px] font-medium text-slate-400 mt-1 max-w-[200px]">
                                        Usa el buscador superior para encontrar y agregar medidores.
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

