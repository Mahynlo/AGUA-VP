import React, { useState, useEffect } from "react";
import { useClientes } from "../../../context/ClientesContext";
import {
    Card,
    CardBody,
    Chip,
    Spinner,
    Button,
    Avatar
} from "@nextui-org/react";
import { HiSearch, HiUsers, HiX, HiLocationMarker } from "react-icons/hi";

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
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar
                            icon={<HiUsers className="text-lg" />}
                            classNames={{
                                base: "bg-green-200 dark:bg-green-800",
                                icon: "text-green-600 dark:text-green-400"
                            }}
                            size="sm"
                        />
                        <div>
                            <h4 className="text-sm font-bold text-green-800 dark:text-green-200">
                                {clienteSeleccionado.nombre}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                                <HiLocationMarker className="text-xs text-green-600" />
                                <span className="text-xs text-green-700 dark:text-green-400">
                                    {clienteSeleccionado.ciudad}
                                </span>
                                <span className="text-xs px-1.5 py-0.5 bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300 rounded text-[10px] font-semibold">
                                    ID: {clienteSeleccionado.id}
                                </span>
                            </div>
                        </div>
                    </div>
                    <Button
                        isIconOnly
                        size="sm"
                        color="danger"
                        variant="light"
                        onPress={limpiarSeleccion}
                        className="min-w-8 w-8 h-8 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                        <HiX className="text-sm" />
                    </Button>
                </div>
            )}

            {/* Campo de Búsqueda */}
            {!clienteSeleccionado && (
                <div className="relative">
                    <CustomInput
                        placeholder="Buscar cliente por nombre o ciudad..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        icon={
                            isSearching ? (
                                <Spinner size="sm" color="warning" />
                            ) : (
                                <HiSearch className="text-blue-500 w-5 h-5" />
                            )
                        }
                        color="blue"
                        description="Escriba para buscar en la base de datos de clientes"
                    />

                    {/* Resultados de Búsqueda */}
                    {resultados.length > 0 && (
                        <div className="absolute z-50 w-full mt-2 max-h-64 overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl bg-white dark:bg-zinc-800">
                            <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                {resultados.map((cliente, index) => (
                                    <div
                                        key={cliente.id}
                                        className={`p-3 cursor-pointer transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 group ${index !== resultados.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''
                                            }`}
                                        onClick={() => seleccionarCliente(cliente)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                                                <HiUsers className="text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                        {cliente.nombre}
                                                    </h4>
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded font-medium">
                                                        #{cliente.id}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1 min-w-0">
                                                        <HiLocationMarker className="text-xs text-gray-400 flex-shrink-0" />
                                                        <span className="text-xs text-gray-500 truncate">
                                                            {cliente.ciudad}
                                                        </span>
                                                    </div>
                                                    {cliente.dirección && (
                                                        <>
                                                            <span className="text-gray-300 text-xs">•</span>
                                                            <span className="text-xs text-gray-500 truncate max-w-[150px]">
                                                                {cliente.dirección}
                                                            </span>
                                                        </>
                                                    )}
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
                                <HiUsers className="text-xl text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No se encontraron clientes</p>
                            <p className="text-xs text-gray-500 mt-1">Intenta con otro término de búsqueda</p>
                        </div>
                    )}

                    {/* Indicador de total de resultados */}
                    {busqueda.trim() && !isSearching && resultados.length > 0 && (
                        <div className="mt-2 flex justify-end">
                            <span className="text-[10px] px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-medium border border-blue-100 dark:border-blue-800">
                                {resultados.length} coincidencias
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BuscarCliente;

