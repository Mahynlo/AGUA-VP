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
    HiPlus
} from "react-icons/hi";

// Componente de Input Personalizado (Estandarizado)
const CustomInput = ({ label, value, onChange, icon, type = "text", color = "blue", description, placeholder, autoFocus }) => (
    <div>
        {label && (
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                {label}
            </label>
        )}
        <div className="relative w-full flex">
            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2 pr-2">
                {icon}
            </span>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoFocus={autoFocus}
                className={`border border-gray-300 focus:ring-${color}-600 focus:border-${color}-500 text-gray-600 rounded-xl pl-12 pr-4 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all shadow-sm`}
            />
        </div>
        {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
    </div>
);

const BuscarMedidor = ({ onMedidorSeleccionado, clienteId, onLiberarMedidor }) => {
    const { medidores } = useMedidores();
    const [busqueda, setBusqueda] = useState("");
    const [resultados, setResultados] = useState([]);
    const [medidoresSeleccionados, setMedidoresSeleccionados] = useState([]);
    const [medidoresLiberados, setMedidoresLiberados] = useState(new Set());
    const [isSearching, setIsSearching] = useState(false);

    // Medidores ya asignados al cliente
    const medidoresAsignadosCliente = useMemo(() =>
        medidores.filter(medidor => medidor.cliente_id === clienteId),
        [medidores, clienteId]
    );

    // Búsqueda con debounce
    useEffect(() => {
        if (busqueda.trim() === "") {
            setResultados([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const timeoutId = setTimeout(() => {
            const filtrados = medidores.filter((medidor) =>
                `${medidor.numero_serie} ${medidor.ubicacion}`
                    .toLowerCase()
                    .includes(busqueda.toLowerCase())
            );
            setResultados(filtrados);
            setIsSearching(false);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [busqueda, medidores]);

    // Función optimizada para seleccionar medidor
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

    // Función optimizada para quitar medidor
    const quitarMedidor = useCallback((id) => {
        const nuevos = medidoresSeleccionados.filter(m => m.id !== id);
        setMedidoresSeleccionados(nuevos);
        onMedidorSeleccionado(nuevos.map(m => m.id));
    }, [medidoresSeleccionados, onMedidorSeleccionado]);

    // Función para manejar liberación de medidores
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

    // Función para renderizar el estado del medidor
    const renderChip = (medidor) => {
        if (!medidor.cliente_id) {
            return (
                <span className="text-[10px] px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 rounded border border-yellow-200 dark:border-yellow-800 font-medium">
                    Libre
                </span>
            );
        } else if (medidor.cliente_id === clienteId) {
            return (
                <span className="text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-800 font-medium">
                    De este cliente
                </span>
            );
        } else {
            return (
                <span className="text-[10px] px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded border border-green-200 dark:border-green-800 font-medium">
                    Asignado
                </span>
            );
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Panel izquierdo: Medidores asignados actualmente */}
                <div className="space-y-4">
                    <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900 shadow-sm">
                        <CardBody className="p-5">
                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <HiCog className="text-lg text-blue-600 dark:text-blue-400" />
                                </div>
                                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                                    Medidores Asignados
                                </h4>
                                {medidoresAsignadosCliente.length > 0 && (
                                    <Chip size="sm" color="primary" variant="flat" className="ml-auto">
                                        {medidoresAsignadosCliente.length}
                                    </Chip>
                                )}
                            </div>

                            {medidoresAsignadosCliente.length > 0 ? (
                                <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                                    {medidoresAsignadosCliente.map(medidor => (
                                        <div
                                            key={medidor.id}
                                            className="group p-3 rounded-xl border border-blue-100 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        icon={<HiCog className="text-lg" />}
                                                        classNames={{
                                                            base: "bg-blue-200 dark:bg-blue-800",
                                                            icon: "text-blue-600 dark:text-blue-400"
                                                        }}
                                                        size="sm"
                                                    />
                                                    <div>
                                                        <h5 className="text-sm font-bold text-blue-900 dark:text-blue-100">
                                                            {medidor.numero_serie}
                                                        </h5>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <HiLocationMarker className="text-xs text-blue-500" />
                                                            <span className="text-xs text-blue-700 dark:text-blue-300">
                                                                {medidor.ubicacion}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    color={medidoresLiberados.has(medidor.id) ? "success" : "warning"}
                                                    variant={medidoresLiberados.has(medidor.id) ? "flat" : "ghost"}
                                                    onPress={() => manejarLiberacion(medidor.id)}
                                                    className="text-[10px] h-7 min-w-16 font-medium"
                                                >
                                                    {medidoresLiberados.has(medidor.id) ? "Liberado" : "Liberar"}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                    <HiCog className="text-3xl text-gray-300 dark:text-gray-600 mb-2" />
                                    <p className="text-sm text-gray-500 font-medium">No hay medidores asignados</p>
                                    <p className="text-xs text-gray-400 mt-1">Busca y selecciona medidores disponibles</p>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* Panel derecho: Búsqueda y selección */}
                <div className="space-y-4">
                    {/* Campo de búsqueda */}
                    <Card className="border border-gray-200 dark:border-gray-700 shadow-sm h-full max-h-[800px]">
                        <CardBody className="p-5">
                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <HiSearch className="text-lg text-green-600 dark:text-green-400" />
                                </div>
                                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                                    Buscar Medidores
                                </h4>
                            </div>

                            <div className="relative">
                                <CustomInput
                                    placeholder="Buscar por número de serie o ubicación..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    icon={
                                        isSearching ? (
                                            <Spinner size="sm" color="success" />
                                        ) : (
                                            <HiSearch className="text-green-500 w-5 h-5" />
                                        )
                                    }
                                    color="green"
                                    description="Busque medidores para asignar a este cliente"
                                />

                                {/* Resultados de búsqueda */}
                                {resultados.length > 0 && (
                                    <div className="absolute z-50 w-full mt-2 max-h-64 overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl bg-white dark:bg-zinc-800">
                                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                            {resultados.map((medidor, index) => (
                                                <div
                                                    key={medidor.id}
                                                    className={`p-3 cursor-pointer transition-colors duration-200 hover:bg-green-50 dark:hover:bg-green-900/20 group ${index !== resultados.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''
                                                        } ${medidor.cliente_id && medidor.cliente_id !== clienteId ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50' : ''}`}
                                                    onClick={() => {
                                                        if (!medidor.cliente_id || medidor.cliente_id === clienteId) {
                                                            seleccionarMedidor(medidor);
                                                        }
                                                    }}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-full ${medidor.cliente_id && medidor.cliente_id !== clienteId ? 'bg-gray-200 dark:bg-gray-700' : 'bg-green-100 dark:bg-green-900/50 group-hover:bg-green-200 dark:group-hover:bg-green-800'}`}>
                                                            <HiCog className={`text-lg ${medidor.cliente_id && medidor.cliente_id !== clienteId ? 'text-gray-500' : 'text-green-600 dark:text-green-400'}`} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                                    {medidor.numero_serie}
                                                                </h4>
                                                                {medidor.id && (
                                                                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded font-medium">
                                                                        ID: {medidor.id}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className="flex items-center gap-1 min-w-0">
                                                                    <HiLocationMarker className="text-xs text-gray-400 flex-shrink-0" />
                                                                    <span className="text-xs text-gray-500 truncate">
                                                                        {medidor.ubicacion}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                {renderChip(medidor)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Mensaje cuando no hay resultados */}
                                {busqueda.trim() && !isSearching && resultados.length === 0 && (
                                    <div className="absolute z-50 w-full mt-2 border border-gray-200 dark:border-gray-700 shadow-lg rounded-xl bg-white dark:bg-zinc-900 p-6 text-center">
                                        <div className="bg-gray-50 dark:bg-gray-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <HiCog className="text-xl text-gray-400" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No se encontraron medidores</p>
                                        <p className="text-xs text-gray-500 mt-1">Intenta con otro término de búsqueda</p>
                                    </div>
                                )}
                            </div>

                            {/* Medidores seleccionados para asignar */}
                            {medidoresSeleccionados.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded">
                                            <HiPlus className="text-sm text-green-600" />
                                        </div>
                                        <h4 className="text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wide">
                                            Por Asignar
                                        </h4>
                                        <Chip size="sm" color="success" variant="solid" className="ml-auto h-5 text-[10px]">
                                            {medidoresSeleccionados.length}
                                        </Chip>
                                    </div>

                                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                                        {medidoresSeleccionados.map((medidor) => (
                                            <div
                                                key={medidor.id}
                                                className="flex items-center justify-between p-2 pl-3 bg-green-50/80 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="p-1.5 bg-green-200 dark:bg-green-800/50 rounded-full shrink-0">
                                                        <HiCog className="text-xs text-green-700 dark:text-green-300" />
                                                    </div>
                                                    <div className="truncate">
                                                        <h5 className="text-xs font-bold text-green-900 dark:text-green-100 truncate">
                                                            {medidor.numero_serie}
                                                        </h5>
                                                        <p className="text-[10px] text-green-700 dark:text-green-400 truncate">
                                                            {medidor.ubicacion}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    color="danger"
                                                    variant="light"
                                                    onPress={() => quitarMedidor(medidor.id)}
                                                    className="w-6 h-6 min-w-6 ml-2 text-danger-400 hover:text-danger-600"
                                                >
                                                    <HiX className="text-xs" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default BuscarMedidor;


