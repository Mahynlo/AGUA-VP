import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useMedidores } from "../../../context/MedidoresContext";
import {
    Chip,
    Button,
    Card,
    CardBody,
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

// Componente de Input Personalizado (UI Mejorada)
const CustomInput = ({ label, value, onChange, icon, type = "text", color = "blue", description, placeholder, autoFocus }) => {
    // Mapa de colores seguros para focus
    const focusColors = {
        blue: "focus:ring-slate-400/20 focus:border-slate-300",
        green: "focus:ring-slate-400/20 focus:border-slate-300",
    };
    
    return (
        <div className="w-full">
            {label && (
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wider">
                    {label}
                </label>
            )}
            <div className="relative w-full flex items-center">
                <span className="absolute left-3 text-slate-400 dark:text-zinc-500 flex items-center justify-center">
                    {icon}
                </span>
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    className={`
                        w-full pl-10 pr-4 py-3 text-sm rounded-xl transition-all duration-200
                        bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100
                        border border-slate-200 dark:border-zinc-800
                        hover:border-slate-300 dark:hover:border-zinc-700
                        focus:outline-none focus:ring-2
                        placeholder-slate-400 dark:placeholder-zinc-500
                        ${focusColors[color] || focusColors.blue}
                    `}
                />
            </div>
            {description && <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1.5 ml-1">{description}</p>}
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

    // Búsqueda con debounce (Lógica intacta)
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
                <Chip size="sm" color="warning" variant="flat" className="h-5 text-[10px] font-bold uppercase">
                    Libre
                </Chip>
            );
        } else if (medidor.cliente_id === clienteId) {
            return (
                <Chip size="sm" color="primary" variant="flat" className="h-5 text-[10px] font-bold uppercase">
                    Actual
                </Chip>
            );
        } else {
            return (
                <Chip size="sm" color="danger" variant="flat" className="h-5 text-[10px] font-bold uppercase">
                    Ocupado
                </Chip>
            );
        }
    };

    return (
        // Contenedor principal con h-full
        <div className="flex flex-col lg:flex-row w-full h-full gap-4 lg:gap-6 min-h-[500px]">
            
            {/* PANEL IZQUIERDO: Medidores Asignados */}
            <Card className="flex-1 h-full border-none shadow-none bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl flex flex-col">
                <CardBody className="p-4 sm:p-5 flex flex-col h-full min-h-0">
                    
                    {/* Header Panel Izquierdo (No se encoge) */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-zinc-800 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-500/10 rounded-xl">
                                <HiCog className="text-xl text-slate-600 dark:text-zinc-300" />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                                    Medidores Asignados
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-zinc-400">
                                    Actualmente en uso
                                </p>
                            </div>
                        </div>
                        {medidoresAsignadosCliente.length > 0 && (
                            <Chip size="sm" color="default" variant="flat" className="font-bold text-[10px] uppercase tracking-wider">
                                {medidoresAsignadosCliente.length}
                            </Chip>
                        )}
                    </div>

                    {/* Lista Scrolleable */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0">
                        {medidoresAsignadosCliente.length > 0 ? (
                            <div className="space-y-3 pb-2">
                                {medidoresAsignadosCliente.map(medidor => (
                                    <div
                                        key={medidor.id}
                                        className="group p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/30 hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Avatar
                                                    icon={<HiCog className="text-lg" />}
                                                    classNames={{
                                                        base: "bg-slate-200/80 dark:bg-zinc-800 flex-shrink-0",
                                                        icon: "text-slate-600 dark:text-zinc-300"
                                                    }}
                                                    size="sm"
                                                />
                                                <div className="min-w-0">
                                                    <h5 className="text-sm font-bold text-slate-800 dark:text-zinc-100 truncate">
                                                        {medidor.numero_serie}
                                                    </h5>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <HiLocationMarker className="text-[10px] text-slate-400 flex-shrink-0" />
                                                        <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                                                            {medidor.ubicacion}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                color={medidoresLiberados.has(medidor.id) ? "success" : "default"}
                                                variant={medidoresLiberados.has(medidor.id) ? "flat" : "bordered"}
                                                onPress={() => manejarLiberacion(medidor.id)}
                                                className={`text-[10px] h-7 px-2 font-bold uppercase tracking-wide flex-shrink-0 transition-all ${
                                                    !medidoresLiberados.has(medidor.id) && "border-slate-300 dark:border-zinc-600 text-slate-600 dark:text-zinc-300"
                                                }`}
                                            >
                                                {medidoresLiberados.has(medidor.id) ? "Liberado" : "Liberar"}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Empty State Izquierdo */
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                                <div className="bg-slate-100 dark:bg-zinc-800 p-4 rounded-full mb-3">
                                    <HiInbox className="text-3xl text-slate-400 dark:text-zinc-500" />
                                </div>
                                <p className="text-sm font-bold text-slate-600 dark:text-zinc-300">Sin medidores</p>
                                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 max-w-[200px]">
                                    Este cliente aún no tiene medidores asignados en el sistema.
                                </p>
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>

            {/* PANEL DERECHO: Búsqueda y Selección */}
            <Card className="flex-1 h-full border-none shadow-none bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl flex flex-col">
                <CardBody className="p-4 sm:p-5 flex flex-col h-full min-h-0 relative">
                    
                    {/* Header Panel Derecho (Búsqueda) */}
                    <div className="flex-shrink-0 z-20">
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-zinc-800">
                            <div className="p-2 bg-emerald-500/10 rounded-xl">
                                <HiSearch className="text-xl text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                                    Buscar Medidores
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-zinc-400">
                                    Encuentra equipos disponibles
                                </p>
                            </div>
                        </div>

                        <div className="relative">
                            <CustomInput
                                placeholder="Escribe serie o ubicación..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                color="green"
                                icon={isSearching ? <Spinner size="sm" color="success" /> : <HiSearch className="w-4 h-4" />}
                            />

                            {/* Resultados Flotantes (Dropdown Absoluto) */}
                            {resultados.length > 0 && (
                                <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-64 overflow-y-auto custom-scrollbar border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl bg-white dark:bg-zinc-950">
                                    {resultados.map((medidor, index) => {
                                        const isDisabled = medidor.cliente_id && medidor.cliente_id !== clienteId;
                                        return (
                                            <div
                                                key={medidor.id}
                                                onClick={() => {
                                                    if (!isDisabled) seleccionarMedidor(medidor);
                                                }}
                                                className={`
                                                    p-3 transition-colors duration-200 flex items-center gap-3
                                                    ${index !== resultados.length - 1 ? 'border-b border-slate-100 dark:border-zinc-700' : ''}
                                                    ${isDisabled 
                                                        ? 'opacity-60 bg-slate-50 dark:bg-zinc-900/50 cursor-not-allowed' 
                                                        : 'cursor-pointer hover:bg-emerald-500/10'
                                                    }
                                                `}
                                            >
                                                <div className={`p-2 rounded-full flex-shrink-0 ${isDisabled ? 'bg-slate-200 dark:bg-zinc-700' : 'bg-emerald-500/10'}`}>
                                                    <HiCog className={`text-lg ${isDisabled ? 'text-slate-500' : 'text-emerald-600 dark:text-emerald-400'}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-0.5">
                                                        <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100 truncate">
                                                            {medidor.numero_serie}
                                                        </h4>
                                                        {renderChip(medidor)}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <HiLocationMarker className="text-[10px] text-slate-400 flex-shrink-0" />
                                                        <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                                                            {medidor.ubicacion}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* No hay resultados */}
                            {busqueda.trim() && !isSearching && resultados.length === 0 && (
                                <div className="absolute top-full left-0 right-0 z-50 mt-2 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl bg-white dark:bg-zinc-950 p-6 text-center">
                                    <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">No se encontraron equipos</p>
                                    <p className="text-xs text-slate-500 mt-1">Verifica el número de serie e intenta de nuevo.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Por Asignar (Flex-1 para que ocupe el resto del panel derecho) */}
                    <div className="mt-6 flex flex-col flex-1 min-h-0 z-10">
                        <div className="flex items-center justify-between mb-3 flex-shrink-0">
                            <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                Equipos por agregar
                            </h4>
                            {medidoresSeleccionados.length > 0 && (
                                <Chip size="sm" color="success" variant="flat" className="h-5 text-[10px] font-bold uppercase tracking-wider">
                                    {medidoresSeleccionados.length} listos
                                </Chip>
                            )}
                        </div>

                        {/* Lista de seleccionados scrolleable */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0 pb-2">
                            {medidoresSeleccionados.length > 0 ? (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                                    {medidoresSeleccionados.map((medidor) => (
                                        <div
                                            key={medidor.id}
                                            className="flex items-center justify-between p-2 pl-3 bg-emerald-500/10 border border-emerald-200/70 dark:border-emerald-900/40 rounded-xl"
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="p-1.5 bg-emerald-500/10 rounded-full shrink-0">
                                                    <HiPlus className="text-xs text-emerald-700 dark:text-emerald-400" />
                                                </div>
                                                <div className="truncate">
                                                    <h5 className="text-sm font-bold text-emerald-900 dark:text-emerald-200 truncate leading-tight">
                                                        {medidor.numero_serie}
                                                    </h5>
                                                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 truncate mt-0.5">
                                                        {medidor.ubicacion}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                color="default"
                                                variant="flat"
                                                onPress={() => quitarMedidor(medidor.id)}
                                                className="w-7 h-7 min-w-7 ml-2 bg-white/80 dark:bg-zinc-900/60 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
                                            >
                                                <HiX className="text-sm" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* Empty State "Por Asignar" */
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-xl p-4">
                                    <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                                        No has seleccionado ningún medidor.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                </CardBody>
            </Card>

        </div>
    );
};

export default BuscarMedidor;

