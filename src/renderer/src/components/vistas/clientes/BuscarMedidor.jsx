import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useMedidores } from "../../../context/MedidoresContext";
import { 
    Chip, 
    Button, 
    Card, 
    CardBody, 
    Input, 
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

// Estilos personalizados para scroll moderno
const scrollStyles = `
.modern-scroll {
    scrollbar-width: thin;
    scrollbar-color: rgba(99, 102, 241, 0.3) transparent;
}

.modern-scroll::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

.modern-scroll::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 10px;
}

.modern-scroll::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(139, 92, 246, 0.4));
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.modern-scroll::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.6), rgba(139, 92, 246, 0.6));
}

.modern-scroll::-webkit-scrollbar-corner {
    background: transparent;
}
`;

// Inyectar estilos en el DOM
if (typeof document !== 'undefined' && !document.getElementById('modern-scroll-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'modern-scroll-styles';
    styleSheet.textContent = scrollStyles;
    document.head.appendChild(styleSheet);
}

const BuscarMedidor = ({ onMedidorSeleccionado, clienteId, onLiberarMedidor }) => {
    const { medidores, actualizarMedidores } = useMedidores();
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
                <Chip 
                    size="sm" 
                    color="warning" 
                    variant="flat"
                    className="text-xs"
                >
                    Libre
                </Chip>
            );
        } else if (medidor.cliente_id === clienteId) {
            return (
                <Chip 
                    size="sm" 
                    color="primary" 
                    variant="solid"
                    className="text-xs"
                >
                    De este cliente
                </Chip>
            );
        } else {
            return (
                <Chip 
                    size="sm" 
                    color="success" 
                    variant="flat"
                    className="text-xs"
                >
                    Asignado
                </Chip>
            );
        }
    };

    return (
        <div className="space-y-6">
           

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Panel izquierdo: Medidores asignados */}
                <div className="space-y-4">
                    <Card className="border border-gray-200 dark:border-gray-700">
                        <CardBody className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <HiCog className="text-lg text-blue-600" />
                                <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                                    Medidores Asignados
                                </h4>
                                {medidoresAsignadosCliente.length > 0 && (
                                    <Chip size="sm" color="primary" variant="flat">
                                        {medidoresAsignadosCliente.length}
                                    </Chip>
                                )}
                            </div>

                            {medidoresAsignadosCliente.length > 0 ? (
                                <div className="space-y-3 max-h-80 overflow-y-auto modern-scroll pr-2">
                                    {medidoresAsignadosCliente.map(medidor => (
                                        <Card 
                                            key={medidor.id} 
                                            className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
                                        >
                                            <CardBody className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar
                                                            icon={<HiCog className="text-sm" />}
                                                            color="primary"
                                                            size="sm"
                                                        />
                                                        <div>
                                                            <h5 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                                                                {medidor.numero_serie}
                                                            </h5>
                                                            <div className="flex items-center gap-1 mt-1">
                                                                <HiLocationMarker className="text-xs text-blue-600" />
                                                                <span className="text-xs text-blue-600 dark:text-blue-400">
                                                                    {medidor.ubicacion}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        color={medidoresLiberados.has(medidor.id) ? "success" : "warning"}
                                                        variant={medidoresLiberados.has(medidor.id) ? "solid" : "flat"}
                                                        onPress={() => manejarLiberacion(medidor.id)}
                                                        className="text-xs min-w-20"
                                                    >
                                                        {medidoresLiberados.has(medidor.id) ? "Liberado" : "Liberar"}
                                                    </Button>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <HiCog className="text-3xl mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">No hay medidores asignados</p>
                                    <p className="text-xs mt-1">Busca y selecciona medidores disponibles</p>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* Panel derecho: Búsqueda y selección */}
                <div className="space-y-4">
                    {/* Campo de búsqueda */}
                    <Card className="border border-gray-200 dark:border-gray-700 h-96">
                        <CardBody className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <HiSearch className="text-lg text-green-600" />
                                <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                                    Buscar Medidores
                                </h4>
                            </div>

                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder="Buscar por número de serie o ubicación..."
                                    value={busqueda}
                                    onValueChange={setBusqueda}
                                    startContent={
                                        isSearching ? (
                                            <Spinner size="sm" color="primary" />
                                        ) : (
                                            <HiSearch className="text-gray-400 text-lg" />
                                        )
                                    }
                                    variant="bordered"
                                    color="primary"
                                    size="md"
                                    className="w-full"
                                    classNames={{
                                        input: "text-sm",
                                        inputWrapper: "group-data-[focus=true]:border-green-500"
                                    }}
                                />

                                {/* Resultados de búsqueda */}
                                {resultados.length > 0 && (
                                    <Card className="absolute z-50 w-full mt-2 max-h-64 overflow-hidden border shadow-lg">
                                        <CardBody className="p-0">
                                            <div className="max-h-64 overflow-y-auto modern-scroll">
                                                {resultados.map((medidor, index) => (
                                                    <div
                                                        key={medidor.id}
                                                        className={`p-3 cursor-pointer transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                                            index !== resultados.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''
                                                        } ${medidor.cliente_id && medidor.cliente_id !== clienteId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        onClick={() => {
                                                            if (!medidor.cliente_id || medidor.cliente_id === clienteId) {
                                                                seleccionarMedidor(medidor);
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Avatar
                                                                icon={<HiCog className="text-lg" />}
                                                                color="primary"
                                                                size="sm"
                                                                className="flex-shrink-0"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                        {medidor.numero_serie}
                                                                    </h4>
                                                                    <Chip 
                                                                        size="sm" 
                                                                        color="primary" 
                                                                        variant="flat"
                                                                        className="text-xs flex-shrink-0"
                                                                    >
                                                                        {medidor.id}
                                                                    </Chip>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <HiLocationMarker className="text-xs text-gray-500 flex-shrink-0" />
                                                                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                                                        {medidor.ubicacion}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-1">
                                                                    {renderChip(medidor)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardBody>
                                    </Card>
                                )}

                                {/* Mensaje cuando no hay resultados */}
                                {busqueda.trim() && !isSearching && resultados.length === 0 && (
                                    <Card className="absolute z-50 w-full mt-2 border shadow-lg">
                                        <CardBody className="p-4 text-center">
                                            <div className="text-gray-500 dark:text-gray-400">
                                                <HiCog className="text-2xl mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">No se encontraron medidores</p>
                                                <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
                                            </div>
                                        </CardBody>
                                    </Card>
                                )}
                            </div>

                            {/* Contador de resultados */}
                            {busqueda.trim() && !isSearching && resultados.length > 0 && (
                                <div className="mt-3">
                                    <Chip 
                                        size="sm" 
                                        color="primary" 
                                        variant="flat"
                                        className="text-xs"
                                    >
                                        {resultados.length} medidor{resultados.length !== 1 ? 'es' : ''} encontrado{resultados.length !== 1 ? 's' : ''}
                                    </Chip>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* Medidores seleccionados para asignar */}
                    {medidoresSeleccionados.length > 0 && (
                        <Card className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                            <CardBody className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <HiPlus className="text-lg text-green-600" />
                                    <h4 className="text-md font-semibold text-green-800 dark:text-green-200">
                                        Medidores para Asignar
                                    </h4>
                                    <Chip size="sm" color="success" variant="flat">
                                        {medidoresSeleccionados.length}
                                    </Chip>
                                </div>

                                <div className="space-y-3 max-h-60 overflow-y-auto modern-scroll pr-2">
                                    {medidoresSeleccionados.map((medidor) => (
                                        <Card 
                                            key={medidor.id} 
                                            className="border border-green-300 dark:border-green-700 bg-white dark:bg-green-900/10"
                                        >
                                            <CardBody className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar
                                                            icon={<HiCog className="text-sm" />}
                                                            color="success"
                                                            size="sm"
                                                        />
                                                        <div>
                                                            <h5 className="text-sm font-semibold text-green-800 dark:text-green-200">
                                                                {medidor.numero_serie}
                                                            </h5>
                                                            <div className="flex items-center gap-1 mt-1">
                                                                <HiLocationMarker className="text-xs text-green-600" />
                                                                <span className="text-xs text-green-600 dark:text-green-400">
                                                                    {medidor.ubicacion}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        color="danger"
                                                        variant="flat"
                                                        startContent={<HiX className="text-xs" />}
                                                        onPress={() => quitarMedidor(medidor.id)}
                                                        className="text-xs"
                                                    >
                                                        Quitar
                                                    </Button>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BuscarMedidor;


