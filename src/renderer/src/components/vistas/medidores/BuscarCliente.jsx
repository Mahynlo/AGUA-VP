import React, { useState, useEffect } from "react";
import { useClientes } from "../../../context/ClientesContext";
import {
    Input,
    Card,
    CardBody,
    User,
    Chip,
    Spinner,
    Button,
    Avatar
} from "@nextui-org/react";
import { HiSearch, HiUsers, HiX, HiLocationMarker } from "react-icons/hi";

/**
 * Componente que permite buscar un cliente por nombre o RPE
 * y devuelve el ID del cliente seleccionado al componente padre.
 *
 * @param {function} onClienteSeleccionado - Callback que recibe el ID del cliente seleccionado
 */
const BuscarCliente = ({ onClienteSeleccionado }) => {
    const { clientes } = useClientes();
    const [busqueda, setBusqueda] = useState("");
    const [resultados, setResultados] = useState([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (busqueda.trim() === "") {
            setResultados([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        
        // Simular un pequeño delay para mostrar el loading
        const timeoutId = setTimeout(() => {
            const filtrados = clientes.filter((cliente) =>
                `${cliente.nombre} ${cliente.ciudad} ${cliente.dirección}`
                    .toLowerCase()
                    .includes(busqueda.toLowerCase())
            );

            setResultados(filtrados);
            setIsSearching(false);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [busqueda, clientes]);

    const seleccionarCliente = (cliente) => {
        setClienteSeleccionado(cliente);
        setBusqueda("");
        setResultados([]);
        onClienteSeleccionado(cliente.id); // Enviamos solo el ID
    };

    const limpiarSeleccion = () => {
        setClienteSeleccionado(null);
        setBusqueda("");
        setResultados([]);
        onClienteSeleccionado(null);
    };

    return (
        <div className="space-y-4">
            {/* Cliente Seleccionado */}
            {clienteSeleccionado && (
                <Card className="border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                    <CardBody className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar
                                    icon={<HiUsers className="text-lg" />}
                                    color="success"
                                    size="sm"
                                />
                                <div>
                                    <h4 className="text-sm font-semibold text-green-800 dark:text-green-200">
                                        {clienteSeleccionado.nombre}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <HiLocationMarker className="text-xs text-green-600" />
                                        <span className="text-xs text-green-600 dark:text-green-400">
                                            {clienteSeleccionado.ciudad}
                                        </span>
                                        <Chip 
                                            size="sm" 
                                            color="success" 
                                            variant="flat"
                                            className="text-xs"
                                        >
                                            ID: {clienteSeleccionado.id}
                                        </Chip>
                                    </div>
                                </div>
                            </div>
                            <Button
                                isIconOnly
                                size="sm"
                                color="danger"
                                variant="light"
                                onPress={limpiarSeleccion}
                                className="min-w-unit-8 w-8 h-8"
                            >
                                <HiX className="text-sm" />
                            </Button>
                        </div>
                        {clienteSeleccionado.dirección && (
                            <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                                📍 {clienteSeleccionado.dirección}
                            </div>
                        )}
                    </CardBody>
                </Card>
            )}

            {/* Campo de Búsqueda */}
            {!clienteSeleccionado && (
                <div className="relative">
                    <Input
                        type="text"
                        placeholder="Buscar cliente por nombre o ciudad..."
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
                            inputWrapper: "group-data-[focus=true]:border-blue-500"
                        }}
                    />

                    {/* Resultados de Búsqueda */}
                    {resultados.length > 0 && (
                        <Card className="absolute z-50 w-full mt-2 max-h-64 overflow-hidden border shadow-lg">
                            <CardBody className="p-0">
                                <div className="max-h-64 overflow-y-auto">
                                    {resultados.map((cliente, index) => (
                                        <div
                                            key={cliente.id}
                                            className={`p-3 cursor-pointer transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                                index !== resultados.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''
                                            }`}
                                            onClick={() => seleccionarCliente(cliente)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    icon={<HiUsers className="text-lg" />}
                                                    color="primary"
                                                    size="sm"
                                                    className="flex-shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                            {cliente.nombre}
                                                        </h4>
                                                        <Chip 
                                                            size="sm" 
                                                            color="primary" 
                                                            variant="flat"
                                                            className="text-xs flex-shrink-0"
                                                        >
                                                            {cliente.id}
                                                        </Chip>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <HiLocationMarker className="text-xs text-gray-500 flex-shrink-0" />
                                                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                                            {cliente.ciudad}
                                                        </span>
                                                    </div>
                                                    {cliente.dirección && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">
                                                            📍 {cliente.dirección}
                                                        </div>
                                                    )}
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
                                    <HiUsers className="text-2xl mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No se encontraron clientes</p>
                                    <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
                                </div>
                            </CardBody>
                        </Card>
                    )}

                    {/* Indicador de total de resultados */}
                    {busqueda.trim() && !isSearching && resultados.length > 0 && (
                        <div className="mt-2">
                            <Chip 
                                size="sm" 
                                color="primary" 
                                variant="flat"
                                className="text-xs"
                            >
                                {resultados.length} cliente{resultados.length !== 1 ? 's' : ''} encontrado{resultados.length !== 1 ? 's' : ''}
                            </Chip>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BuscarCliente;

