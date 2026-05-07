import React, { useState, useEffect } from "react";
import { useClientes } from "../../../context/ClientesContext";
import { Spinner, Button } from "@nextui-org/react";
import { HiSearch, HiUsers, HiX, HiLocationMarker } from "react-icons/hi";

// Componente de Input Personalizado (Premium UI - Token 4)
const CustomInput = ({ label, value, onChange, icon, type = "text", placeholder, autoFocus }) => (
    <div className="w-full flex flex-col gap-1.5">
        {label && (
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 ml-1">
                {label}
            </label>
        )}
        <div className="relative w-full flex items-center group">
            <span className="absolute left-4 text-slate-400 dark:text-zinc-500 flex items-center justify-center group-focus-within:text-blue-500 transition-colors duration-200 pointer-events-none">
                {icon}
            </span>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoFocus={autoFocus}
                className="w-full pl-11 pr-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 resize-none h-[52px] bg-slate-100/70 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-none placeholder:text-slate-400/70"
            />
        </div>
    </div>
);

/**
 * Componente que permite buscar un cliente por nombre, ciudad, predio o dirección
 * y devuelve el ID del cliente seleccionado al componente padre.
 *
 * @param {function} onClienteSeleccionado - Callback que recibe el ID del cliente seleccionado
 */
const BuscarCliente = ({ onClienteSeleccionado }) => {
    const { allClientes } = useClientes();
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

        // Normaliza texto eliminando acentos para búsqueda parcial sin tildes
        const normalizar = (str) =>
            (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const termino = normalizar(busqueda);

        // Simular un pequeño delay para mostrar el loading
        const timeoutId = setTimeout(() => {
            const filtrados = allClientes.filter((cliente) =>
                normalizar(`${cliente.nombre} ${cliente.ciudad} ${cliente.direccion} ${cliente.numero_predio}`)
                    .includes(termino)
            );

            setResultados(filtrados);
            setIsSearching(false);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [busqueda, allClientes]);

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
        <div className="w-full flex flex-col gap-4 relative z-20">
            {/* Estado: Cliente Seleccionado */}
            {clienteSeleccionado ? (
                <div className="p-4 bg-emerald-500/10 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200/70 dark:border-emerald-800/50 flex items-center justify-between shadow-sm animate-in fade-in duration-300">
                    <div className="flex items-center gap-4 overflow-hidden">
                        <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl shadow-sm shrink-0">
                            <HiUsers className="text-emerald-600 dark:text-emerald-400 text-lg" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-100 truncate">
                                {clienteSeleccionado.nombre}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] px-1.5 py-0.5 bg-emerald-200/50 dark:bg-emerald-800/50 text-emerald-800 dark:text-emerald-300 rounded-md font-bold tracking-widest uppercase shrink-0">
                                    ID: {clienteSeleccionado.id}
                                </span>
                                <div className="flex items-center gap-1 text-emerald-700/80 dark:text-emerald-400/70 min-w-0">
                                    <HiLocationMarker className="text-[10px] shrink-0" />
                                    <span className="text-[11px] font-medium truncate">
                                        {clienteSeleccionado.ciudad}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        onPress={limpiarSeleccion}
                        className="w-8 h-8 min-w-8 ml-3 bg-white/80 dark:bg-zinc-900/60 text-slate-400 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors shadow-sm shrink-0"
                        title="Quitar selección"
                    >
                        <HiX className="text-base" />
                    </Button>
                </div>
            ) : (
                /* Estado: Buscador Activo */
                <div className="relative w-full">
                    <CustomInput
                        placeholder="Buscar cliente por nombre o ciudad..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        icon={isSearching ? <Spinner size="sm" color="primary" /> : <HiSearch className="w-5 h-5" />}
                    />

                    {/* Resultados de Búsqueda Flotantes */}
                    {resultados.length > 0 && (
                        <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-50 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent border border-slate-200 dark:border-zinc-800 shadow-xl rounded-2xl bg-white dark:bg-zinc-950 p-2 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2">
                            {resultados.map((cliente) => (
                                <div
                                    key={cliente.id}
                                    onClick={() => seleccionarCliente(cliente)}
                                    className="p-3 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200 flex items-center gap-3"
                                >
                                    <div className="p-2 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl flex-shrink-0 shadow-sm">
                                        <HiUsers className="text-blue-600 dark:text-blue-400 text-lg" />
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h4 className="text-sm font-black text-slate-800 dark:text-zinc-100 truncate">
                                                {cliente.nombre}
                                            </h4>
                                            <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-md font-bold uppercase tracking-widest shrink-0">
                                                #{cliente.id}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <HiLocationMarker className="text-[10px] text-slate-400 flex-shrink-0" />
                                            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 truncate">
                                                {cliente.ciudad}
                                                {cliente.direccion && <span className="mx-1.5 opacity-50">•</span>}
                                                {cliente.direccion}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Mensaje cuando no hay resultados */}
                    {busqueda.trim() && !isSearching && resultados.length === 0 && (
                        <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-50 border border-slate-200 dark:border-zinc-800 shadow-xl rounded-2xl bg-white dark:bg-zinc-950 p-6 text-center animate-in fade-in slide-in-from-top-2">
                            <p className="text-sm font-black text-slate-700 dark:text-zinc-300">No se encontraron clientes</p>
                            <p className="text-xs font-medium text-slate-500 dark:text-zinc-500 mt-1">Intenta con otro término de búsqueda.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BuscarCliente;

