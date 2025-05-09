import React, { useState, useEffect } from "react";
import { useClientes } from "../../../context/ClientesContext";
import {

    User,
} from "@nextui-org/react";

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

    useEffect(() => {
        if (busqueda.trim() === "") {
            setResultados([]);
            return;
        }

        const filtrados = clientes.filter((cliente) =>
            `${cliente.nombre} ${cliente.ciudad}`
                .toLowerCase()
                .includes(busqueda.toLowerCase())
        );

        setResultados(filtrados);
    }, [busqueda, clientes]);

    const seleccionarCliente = (cliente) => {
        setClienteSeleccionado(cliente);
        setBusqueda(`${cliente.nombre} (${cliente.ciudad})`);
        setResultados([]);
        onClienteSeleccionado(cliente.id); // Enviamos solo el ID
    };

    return (
        <div className="mb-4 relative">
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Buscar Cliente(campo no obligatorio)
            </label>
            <input
                type="text"
                className="w-full p-2.5 border rounded-xl bg-gray-50 dark:bg-neutral-800 dark:text-white dark:border-gray-600"
                placeholder="Escribe nombre o Pueblo ..."
                value={busqueda}
                onChange={(e) => {
                    setBusqueda(e.target.value);
                    setClienteSeleccionado(null);
                }}
            />
            {resultados.length > 0 && (
                <ul className="absolute z-10 w-full bg-white dark:bg-neutral-800 border dark:border-gray-600 mt-2 rounded-xl max-h-48 overflow-y-auto shadow-lg">
                    {resultados.map((cliente) => (
                        <li
                            key={cliente.id}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                            onClick={() => seleccionarCliente(cliente)}
                        >
                            <User
                                avatarProps={{
                                    name: "Cliente"
                                }}
                                description={
                                    cliente.ciudad

                                }
                                name={cliente.nombre}
                            />
                        </li>
                    ))}
                </ul>
            )}

            {clienteSeleccionado && (
                <p className="text-sm mt-2 text-green-600 dark:text-green-400">
                    Cliente seleccionado: <strong>{clienteSeleccionado.nombre}</strong>
                </p>
            )}
        </div>
    );
};

export default BuscarCliente;

